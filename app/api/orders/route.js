/**
 * POST /api/orders
 * 
 * Server-side order creation with comprehensive fraud prevention.
 * This is the ONLY way orders should be created.
 * 
 * The client submits: items (productId + quantity), delivery info, payment method,
 * coupon code, idempotency key, and a honeypot field.
 * 
 * The server independently validates: product prices, coupon, shipping cost,
 * phone number, rate limits, duplicates, risk score, and creates the order.
 * 
 * PERFORMANCE: All independent Firestore reads run in parallel via Promise.all.
 * Order history checks (duplicate, rate, history) use a single shared snapshot.
 */

import { NextResponse, after } from 'next/server'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firestore'
import { validateBDPhone, normalizePhone } from '@/lib/fraud/phoneValidator'
import { checkRateLimit } from '@/lib/fraud/rateLimiter'
import { runAllOrderChecks, invalidateOrdersCache } from '@/lib/fraud/duplicateDetector'
import { calculateRiskScore } from '@/lib/fraud/riskScorer'
import { logFraudEvent } from '@/lib/fraud/auditLog'
import { getFraudConfig } from '@/lib/fraud/config'
import { productDummyData } from '@/assets/assets'
import { syncOrderIntegrations } from '@/lib/integrations/syncEngine'

// ── In-memory caches with TTL (shared across requests in the same node process) ──
let cachedShipping = null
let cachedShippingTime = 0

let cachedFraudData = null
let cachedFraudTime = 0

let cachedCoupons = null
let cachedCouponsTime = 0

const productCache = new Map() // productId -> { data, time }
const CACHE_TTL_MS = 60 * 1000 // 60 seconds

async function getCachedShipping(firebaseReady) {
    const now = Date.now()
    if (cachedShipping && (now - cachedShippingTime) < CACHE_TTL_MS) {
        return cachedShipping
    }
    if (!firebaseReady) return null
    try {
        const snap = await getDoc(doc(db, 'settings', 'shipping'))
        if (snap.exists()) {
            cachedShipping = snap.data()
            cachedShippingTime = Date.now()
            return cachedShipping
        }
    } catch (e) {
        if (cachedShipping) return cachedShipping
    }
    return null
}

async function getCachedFraudData(firebaseReady) {
    const now = Date.now()
    if (cachedFraudData && (now - cachedFraudTime) < CACHE_TTL_MS) {
        return cachedFraudData
    }
    if (!firebaseReady) return null
    try {
        const snap = await getDoc(doc(db, 'settings', 'fraud'))
        if (snap.exists()) {
            cachedFraudData = snap.data()
            cachedFraudTime = Date.now()
            return cachedFraudData
        }
    } catch (e) {
        if (cachedFraudData) return cachedFraudData
    }
    return null
}

async function getCachedCoupons(firebaseReady) {
    const now = Date.now()
    if (cachedCoupons && (now - cachedCouponsTime) < CACHE_TTL_MS) {
        return cachedCoupons
    }
    if (!firebaseReady) return []
    try {
        const snap = await getDocs(collection(db, 'coupons'))
        cachedCoupons = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        cachedCouponsTime = Date.now()
        return cachedCoupons
    } catch (e) {
        if (cachedCoupons) return cachedCoupons
        return []
    }
}

async function getOrderProducts(productIds, firebaseReady) {
    if (!productIds || productIds.length === 0) return []
    const now = Date.now()

    return Promise.all(
        productIds.map(async (id) => {
            const strId = String(id)
            const cached = productCache.get(strId)
            if (cached && (now - cached.time) < CACHE_TTL_MS) {
                return cached.data
            }

            if (firebaseReady) {
                try {
                    const snap = await getDoc(doc(db, 'products', strId))
                    if (snap.exists()) {
                        const prod = { id: snap.id, ...snap.data() }
                        productCache.set(strId, { data: prod, time: Date.now() })
                        return prod
                    }
                } catch (e) {
                    console.warn(`[OrderAPI] Failed to fetch product ${strId}:`, e)
                }
            }

            // Fallback to dummy data
            const dummy = Array.isArray(productDummyData) && productDummyData.find(p => String(p.id) === strId)
            if (dummy) {
                return dummy
            }
            return null
        })
    ).then(products => products.filter(Boolean))
}

// In-memory idempotency store (prevents duplicate processing within the same serverless instance)
const processedKeys = new Map()

// Cleanup old idempotency keys every 10 minutes
setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000
    for (const [key, timestamp] of processedKeys) {
        if (timestamp < cutoff) processedKeys.delete(key)
    }
}, 10 * 60 * 1000).unref?.()


/**
 * Extract client IP from request headers (Vercel/Cloudflare compatible).
 */
function getClientIP(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        '0.0.0.0'
    )
}

export async function POST(request) {
    const ip = getClientIP(request)

    // Check request payload size (max 100KB) to prevent DoS
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
    if (contentLength > 100 * 1024) {
        return NextResponse.json(
            { error: 'অনুরোধের সাইজ অনেক বড়।', code: 'PAYLOAD_TOO_LARGE' },
            { status: 413 }
        )
    }

    try {
        // ── Parse request body ──────────────────────────────────────────
        const body = await request.json().catch(() => ({}))
        const {
            items,           // [{ productId, quantity, color?, size? }]
            deliveryInfo,    // { name, phone, address, location }
            paymentMethod,   // 'COD' | 'BKASH' | 'NAGAD' | 'BANK'
            trxId,           // Transaction ID for BKASH/NAGAD
            bankName,        // Bank name for BANK payment
            bankTrxId,       // Bank transaction ID
            couponCode,      // Optional coupon code
            idempotencyKey,  // Unique key per checkout session
            honeypot,        // Honeypot field — should be empty
            formLoadedAt,    // Timestamp when form was loaded
            userId,          // Current user ID (validated server-side)
        } = body

        // ── 1. Bot Detection (no Firestore needed) ──────────────────────
        const signals = {}

        if (honeypot) {
            signals.botDetected = true
        }

        if (formLoadedAt) {
            const elapsed = Date.now() - formLoadedAt
            if (elapsed < 3000) { // default min time, overridden below if config loads
                signals.botDetected = true
            }
        }

        // ── 2. Idempotency Check (in-memory, instant) ───────────────────
        if (idempotencyKey) {
            if (processedKeys.has(idempotencyKey)) {
                return NextResponse.json(
                    { error: 'এই অর্ডারটি ইতিমধ্যে প্রসেস করা হয়েছে।', code: 'IDEMPOTENCY_DUPLICATE' },
                    { status: 409 }
                )
            }
        }

        // ── 3. Basic Validation (no Firestore needed) ───────────────────
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'অর্ডারে কোনো পণ্য নেই।', code: 'EMPTY_CART' },
                { status: 400 }
            )
        }

        if (!deliveryInfo?.name?.trim() || !deliveryInfo?.phone?.trim() || !deliveryInfo?.address?.trim()) {
            return NextResponse.json(
                { error: 'অনুগ্রহ করে ডেলিভারি তথ্য পূরণ করুন।', code: 'MISSING_DELIVERY_INFO' },
                { status: 400 }
            )
        }

        if (!paymentMethod || !['COD', 'BKASH', 'NAGAD', 'BANK'].includes(paymentMethod)) {
            return NextResponse.json(
                { error: 'অবৈধ পেমেন্ট পদ্ধতি।', code: 'INVALID_PAYMENT' },
                { status: 400 }
            )
        }

        // Payment-specific validation
        if ((paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') && !trxId?.trim()) {
            return NextResponse.json(
                { error: 'অনুগ্রহ করে ট্রানসেকশন আইডি দিন।', code: 'MISSING_TRX_ID' },
                { status: 400 }
            )
        }
        if (paymentMethod === 'BANK' && (!bankName?.trim() || !bankTrxId?.trim())) {
            return NextResponse.json(
                { error: 'অনুগ্রহ করে ব্যাংকের নাম ও ট্রানসেকশন আইডি দিন।', code: 'MISSING_BANK_INFO' },
                { status: 400 }
            )
        }

        // ── 4. Phone Validation (no Firestore needed) ───────────────────
        const phoneResult = validateBDPhone(deliveryInfo.phone)
        if (!phoneResult.valid) {
            signals.invalidPhone = true
        }
        const normalizedPhone = phoneResult.normalized || normalizePhone(deliveryInfo.phone)

        // ── 5. In-memory Rate Limiting (instant) ────────────────────────
        const ipRateResult = checkRateLimit(`ip:${ip}`, 10) // default, overridden below
        const phoneRateResult = checkRateLimit(`phone:${normalizedPhone}`, 5)

        if (!ipRateResult.allowed || !phoneRateResult.allowed) {
            signals.rateLimitExceeded = true
        }

        // ══════════════════════════════════════════════════════════════════
        // ── PARALLEL FIRESTORE READS ─────────────────────────────────────
        // All independent reads run simultaneously instead of sequentially.
        // This reduces ~6 sequential round-trips to 1 parallel batch.
        // ══════════════════════════════════════════════════════════════════

        const productIds = items.map(i => i.productId)

        const firebaseReady = isFirebaseConfigured()

        const [fraudData, serverProducts, shippingSettings, allCoupons, orderChecks] = await Promise.all([
            // 1. Fraud settings (in-memory cached or single read)
            getCachedFraudData(firebaseReady),

            // 2. Products (fetch only ordered items with in-memory caching)
            getOrderProducts(productIds, firebaseReady),

            // 3. Shipping settings (in-memory cached or single read)
            getCachedShipping(firebaseReady),

            // 4. Coupons (only if coupon code provided, with in-memory caching)
            (firebaseReady && couponCode)
                ? getCachedCoupons(firebaseReady)
                : Promise.resolve([]),

            // 5. All order history checks in ONE pass (targeted phone query + in-memory cache)
            runAllOrderChecks({
                phone: normalizedPhone,
                productIds,
                totalAmount: 0, // will be recalculated after price validation
                duplicateWindowMinutes: 30,
                rateWindowHours: 1,
                codDayWindowHours: 24,
            }),
        ])

        // ── Process fraud config (from cache/read) ──────────────────────
        const config = getFraudConfig(fraudData)

        // Re-check bot detection with actual config
        if (formLoadedAt) {
            const elapsed = Date.now() - formLoadedAt
            if (elapsed < config.minOrderSubmissionTimeMs) {
                signals.botDetected = true
            }
        }

        // ── Blocklist check (from same fraud doc, no extra read) ─────────
        if (fraudData) {
            const blockedPhones = (fraudData.blockedPhones || []).map(p => normalizePhone(p))
            const blockedIPs = fraudData.blockedIPs || []

            if (blockedPhones.includes(normalizedPhone)) {
                signals.blockedPhone = true
            }
            if (blockedIPs.includes(ip)) {
                signals.blockedIP = true
            }
        }

        // ── Process order history checks ─────────────────────────────────
        if (orderChecks.recentCount >= config.maxOrdersPerPhonePerHour) {
            signals.rapidOrders = true
        }

        // ── 7. Server-side Price Validation ─────────────────────────────
        let serverCalculatedSubtotal = 0
        const validatedItems = []

        for (const item of items) {
            const serverProduct = serverProducts.find(p => String(p.id) === String(item.productId)) ||
                                  (Array.isArray(productDummyData) && productDummyData.find(p => String(p.id) === String(item.productId)))
            
            if (!serverProduct) {
                return NextResponse.json(
                    { error: `পণ্য "${item.productId}" পাওয়া যায়নি।`, code: 'PRODUCT_NOT_FOUND' },
                    { status: 400 }
                )
            }

            if (serverProduct.inStock === false) {
                return NextResponse.json(
                    { error: `"${serverProduct.name}" স্টকে নেই।`, code: 'OUT_OF_STOCK' },
                    { status: 400 }
                )
            }

            const qty = Math.max(1, Math.min(parseInt(item.quantity) || 1, 100))
            const price = serverProduct.offerPrice || serverProduct.price || 0
            serverCalculatedSubtotal += price * qty

            validatedItems.push({
                productId: serverProduct.id,
                id: serverProduct.id,
                name: serverProduct.name,
                title: serverProduct.name,
                quantity: qty,
                price: price,
                effectivePrice: price,
                color: item.color || null,
                size: item.size || null,
                product: {
                    id: serverProduct.id,
                    name: serverProduct.name,
                    price: price,
                    images: serverProduct.images,
                    category: serverProduct.category,
                },
            })
        }

        // ── 8. Server-side Shipping Validation ──────────────────────────
        const shippingCost = deliveryInfo.location === 'outsideDhaka'
            ? (shippingSettings?.outsideDhaka?.cost ?? 120)
            : (shippingSettings?.insideDhaka?.cost ?? 70)

        // ── 9. Server-side Coupon Validation ────────────────────────────
        let coupon = null
        let discountAmount = 0

        if (couponCode && allCoupons.length > 0) {
            const found = allCoupons.find(c => c.code?.toUpperCase() === couponCode.toUpperCase())

            if (found && found.isActive && new Date(found.expiresAt) >= new Date()) {
                if (found.minOrderAmount > 0 && serverCalculatedSubtotal < found.minOrderAmount) {
                    // Silently skip coupon — don't error, just don't apply
                } else if (found.maxUses > 0 && (found.usedCount || 0) >= found.maxUses) {
                    // Usage limit exceeded
                } else {
                    coupon = found
                    if (found.discountType === 'fixed') {
                        discountAmount = found.discount
                    } else {
                        discountAmount = (found.discount / 100) * serverCalculatedSubtotal
                    }
                    if (found.maxDiscountAmount && found.maxDiscountAmount > 0) {
                        discountAmount = Math.min(discountAmount, found.maxDiscountAmount)
                    }
                    discountAmount = Math.min(discountAmount, serverCalculatedSubtotal)
                }
            }
        }

        // ── 10. Calculate final total (SERVER-SIDE) ─────────────────────
        const finalTotal = Math.max(0, serverCalculatedSubtotal - discountAmount + shippingCost)

        // ── 11. Duplicate & History checks (from preloaded data) ────────
        if (orderChecks.isDuplicate) {
            signals.duplicateOrder = true
        } else if (finalTotal > 0 && Array.isArray(orderChecks.recentOrders)) {
            // Re-check SAME_PHONE_SAME_AMOUNT using the verified final server total
            const dupAmountOrder = orderChecks.recentOrders.find(
                o => Math.abs((o.total || 0) - finalTotal) < 1
            )
            if (dupAmountOrder) {
                signals.duplicateOrder = true
                orderChecks.isDuplicate = true
                orderChecks.matchedOrderId = dupAmountOrder.id
                orderChecks.reason = 'SAME_PHONE_SAME_AMOUNT'
            }
        }

        const history = orderChecks.history
        if (history.total === 0) {
            signals.noOrderHistory = true
        }
        if (history.total > 3 && history.cancelled / history.total > 0.5) {
            signals.highCancelRate = true
        }

        // ── 13. COD-specific checks ─────────────────────────────────────
        signals.isCOD = paymentMethod === 'COD'
        if (signals.isCOD && history.delivered === 0) {
            signals.codNoHistory = true
        }

        if (signals.isCOD) {
            if (orderChecks.codDayCount >= config.maxCODOrdersPerPhonePerDay) {
                signals.rapidOrders = true
            }
        }

        // ── 14. Calculate Risk Score ────────────────────────────────────
        const { score: riskScore, level: riskLevel, reasons: riskReasons } = calculateRiskScore(signals, config)

        // ── 15. Decision ────────────────────────────────────────────────
        if (riskLevel === 'HIGH') {
            // Log the blocked attempt (non-blocking — don't await)
            logFraudEvent({
                type: 'ORDER_BLOCKED',
                phone: normalizedPhone,
                ip,
                riskScore,
                riskLevel,
                reason: riskReasons.join(', '),
            }).catch(() => {})

            return NextResponse.json(
                { 
                    error: 'এই মুহূর্তে আপনার অর্ডারটি প্রসেস করা সম্ভব হচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা আমাদের সাপোর্ট-এ যোগাযোগ করুন।', 
                    code: 'ORDER_BLOCKED' 
                },
                { status: 403 }
            )
        }

        // ── 16. Create the Order ────────────────────────────────────────
        const orderId = `ord_${Date.now()}`
        const orderStatus = riskLevel === 'MEDIUM' ? 'PENDING_REVIEW' : 'ORDER_PLACED'

        const newOrder = {
            id: orderId,
            total: Number(finalTotal.toFixed(2)),
            amount: Number(finalTotal.toFixed(2)),
            subtotal: serverCalculatedSubtotal,
            shippingCost,
            discountAmount: discountAmount > 0 ? Number(discountAmount.toFixed(2)) : 0,
            status: orderStatus,
            userId: userId || 'user_guest',
            isPaid: paymentMethod !== 'COD',
            paymentMethod,
            trxId: trxId || null,
            bankName: bankName || null,
            bankTrxId: bankTrxId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCouponUsed: !!coupon,
            coupon: coupon ? { code: coupon.code, discount: coupon.discount, discountType: coupon.discountType } : null,
            orderItems: validatedItems,
            items: validatedItems,
            address: {
                id: `addr_${Date.now()}`,
                name: (deliveryInfo.name || '').trim(),
                phone: (deliveryInfo.phone || '').trim(),
                normalizedPhone,
                street: (deliveryInfo.address || '').trim(),
                city: deliveryInfo.location === 'outsideDhaka' ? 'Outside Dhaka' : 'Dhaka',
                country: 'Bangladesh',
            },
            user: {
                id: userId || 'user_guest',
                name: (deliveryInfo.name || '').trim(),
                phone: (deliveryInfo.phone || '').trim(),
                email: body.userEmail || `${normalizedPhone}@customer.ourstorebd.com`,
            },
            // Fraud metadata (admin-only, not shown to customers)
            _fraud: {
                riskScore,
                riskLevel,
                reasons: riskReasons,
                ip: ip,
                signals: Object.keys(signals).filter(k => signals[k]),
                checkedAt: new Date().toISOString(),
            },
        }

        // Save to Firestore (MUST succeed before reporting success)
        if (isFirebaseConfigured()) {
            try {
                await setDoc(doc(db, 'orders', orderId), newOrder)
                // Update in-memory orders cache with new order
                invalidateOrdersCache(newOrder)
            } catch (error) {
                console.error('[OrderAPI] Failed to save order to Firestore:', error)
                return NextResponse.json(
                    { error: 'অর্ডারটি ডাটাবেজে সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।', code: 'DATABASE_WRITE_FAILED' },
                    { status: 500 }
                )
            }
        }

        // Mark idempotency key as processed only after successful Firestore save
        if (idempotencyKey) {
            processedKeys.set(idempotencyKey, Date.now())
        }

        // ── Non-blocking background tasks (don't delay the response) ────
        // Log successful order + fire Meta CAPI event in background
        const bgTasks = []

        bgTasks.push(
            logFraudEvent({
                type: 'ORDER_ATTEMPT',
                orderId,
                phone: normalizedPhone,
                ip,
                riskScore,
                riskLevel,
                reason: riskLevel === 'MEDIUM' ? 'মাঝারি ঝুঁকি — পর্যালোচনা প্রয়োজন' : 'স্বাভাবিক অর্ডার',
                metadata: { paymentMethod, total: finalTotal },
            }).catch(() => {})
        )

        // Fire Server-Side Meta CAPI Purchase event (non-blocking)
        if (isFirebaseConfigured()) {
            bgTasks.push(
                getDoc(doc(db, 'settings', 'tracking')).then(async (snap) => {
                    if (!snap.exists()) return
                    const tracking = snap.data()
                    if (!tracking?.meta?.capiEnabled || !tracking?.meta?.accessToken || !tracking?.meta?.pixelId) return

                    const capiPayload = {
                        action: 'DISPATCH_EVENT',
                        eventName: 'Purchase',
                        eventId: `order_${orderId}`,
                        eventSourceUrl: request.headers.get('referer') || 'https://ourstorebd.shop/order',
                        userData: {
                            email: body.userEmail || newOrder.user?.email,
                            phone: normalizedPhone,
                            name: deliveryInfo.name,
                            city: deliveryInfo.location === 'insideDhaka' ? 'Dhaka' : 'Outside Dhaka',
                        },
                        customData: {
                            currency: 'BDT',
                            value: finalTotal,
                            order_id: orderId,
                            coupon: coupon?.code || null,
                            shipping: deliveryInfo.location,
                            contents: validatedItems.map(item => ({
                                id: item.productId,
                                quantity: item.quantity,
                                item_price: item.price,
                            })),
                        },
                        pixelId: tracking.meta.pixelId,
                        pixelId2: tracking.meta.pixelId2,
                        accessToken: tracking.meta.accessToken,
                        testEventCode: tracking.meta.testEventCode,
                        force: true,
                    }

                    const origin = request.nextUrl?.origin || 'http://localhost:3000'
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 5000)
                    fetch(`${origin}/api/tracking`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(capiPayload),
                        signal: controller.signal,
                    })
                        .catch(e => console.warn('[OrderAPI] Meta CAPI non-blocking notice:', e.message || e))
                        .finally(() => clearTimeout(timeoutId))
                }).catch(() => {})
            )
        }

        // Order Automation: Sync order to Telegram Bot & Google Sheets (non-blocking)
        const requestOrigin = request.nextUrl?.origin || 'https://ourstorebd.shop'
        bgTasks.push(
            syncOrderIntegrations(newOrder, requestOrigin)
                .catch(e => console.warn('[OrderAPI] Order integration sync non-blocking error:', e))
        )

        // Don't await background tasks — let them run after response is sent
        if (typeof after === 'function') {
            try {
                after(async () => {
                    await Promise.allSettled(bgTasks)
                })
            } catch {
                // Ignore if after not available in this environment
            }
        }

        // ── 17. Return the created order ────────────────────────────────
        return NextResponse.json({
            success: true,
            order: newOrder,
            message: orderStatus === 'PENDING_REVIEW'
                ? 'আপনার অর্ডারটি রিসিভ হয়েছে এবং পর্যালোচনাধীন আছে।'
                : 'অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!',
        })

    } catch (error) {
        console.error('[OrderAPI] Unexpected error:', error)

        logFraudEvent({
            type: 'ORDER_ATTEMPT',
            ip,
            reason: `Server error: ${error.message}`,
        }).catch(() => {})

        return NextResponse.json(
            { error: 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', code: 'SERVER_ERROR' },
            { status: 500 }
        )
    }
}
