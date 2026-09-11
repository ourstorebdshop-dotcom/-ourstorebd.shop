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
 */

import { NextResponse } from 'next/server'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firestore'
import { validateBDPhone, normalizePhone } from '@/lib/fraud/phoneValidator'
import { checkRateLimit } from '@/lib/fraud/rateLimiter'
import { checkDuplicateOrder, countRecentOrdersByPhone, getPhoneOrderHistory } from '@/lib/fraud/duplicateDetector'
import { calculateRiskScore } from '@/lib/fraud/riskScorer'
import { logFraudEvent } from '@/lib/fraud/auditLog'
import { getFraudConfig } from '@/lib/fraud/config'

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

    try {
        // ── Parse request body ──────────────────────────────────────────
        const body = await request.json()
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

        // ── Load fraud config (with any admin overrides from Firestore) ─
        let fraudSettings = null
        if (isFirebaseConfigured()) {
            try {
                const fraudDoc = await getDoc(doc(db, 'settings', 'fraud'))
                if (fraudDoc.exists()) fraudSettings = fraudDoc.data()
            } catch { /* use defaults */ }
        }
        const config = getFraudConfig(fraudSettings)

        // ── Collect fraud signals ───────────────────────────────────────
        const signals = {}

        // ── 1. Bot Detection ────────────────────────────────────────────
        // Honeypot check: if the hidden field has a value, it's a bot
        if (honeypot) {
            signals.botDetected = true
        }

        // Time check: if form was submitted too fast, likely automated
        if (formLoadedAt) {
            const elapsed = Date.now() - formLoadedAt
            if (elapsed < config.minOrderSubmissionTimeMs) {
                signals.botDetected = true
            }
        }

        // ── 2. Idempotency Check ────────────────────────────────────────
        if (idempotencyKey) {
            if (processedKeys.has(idempotencyKey)) {
                return NextResponse.json(
                    { error: 'এই অর্ডারটি ইতিমধ্যে প্রসেস করা হয়েছে।', code: 'IDEMPOTENCY_DUPLICATE' },
                    { status: 409 }
                )
            }
        }

        // ── 3. Basic Validation ─────────────────────────────────────────
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'অর্ডারে কোনো পণ্য নেই।', code: 'EMPTY_CART' },
                { status: 400 }
            )
        }

        if (!deliveryInfo?.name || !deliveryInfo?.phone || !deliveryInfo?.address) {
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

        // ── 4. Phone Validation ─────────────────────────────────────────
        const phoneResult = validateBDPhone(deliveryInfo.phone)
        if (!phoneResult.valid) {
            signals.invalidPhone = true
        }
        const normalizedPhone = phoneResult.normalized || normalizePhone(deliveryInfo.phone)

        // ── 5. Blocklist Check ──────────────────────────────────────────
        if (isFirebaseConfigured()) {
            try {
                const fraudDoc = await getDoc(doc(db, 'settings', 'fraud'))
                if (fraudDoc.exists()) {
                    const fraudData = fraudDoc.data()
                    const blockedPhones = (fraudData.blockedPhones || []).map(p => normalizePhone(p))
                    const blockedIPs = fraudData.blockedIPs || []

                    if (blockedPhones.includes(normalizedPhone)) {
                        signals.blockedPhone = true
                    }
                    if (blockedIPs.includes(ip)) {
                        signals.blockedIP = true
                    }
                }
            } catch { /* continue */ }
        }

        // ── 6. Rate Limiting ────────────────────────────────────────────
        const ipRateResult = checkRateLimit(`ip:${ip}`, config.maxOrdersPerIPPerHour)
        const phoneRateResult = checkRateLimit(`phone:${normalizedPhone}`, config.maxOrdersPerPhonePerHour)

        if (!ipRateResult.allowed || !phoneRateResult.allowed) {
            signals.rateLimitExceeded = true
        }

        // Also check Firestore-based persistent rate (survives cold starts)
        const recentOrderCount = await countRecentOrdersByPhone(normalizedPhone, 1)
        if (recentOrderCount >= config.maxOrdersPerPhonePerHour) {
            signals.rapidOrders = true
        }

        // ── 7. Server-side Price Validation ─────────────────────────────
        let serverProducts = []
        if (isFirebaseConfigured()) {
            try {
                const prodSnap = await getDocs(collection(db, 'products'))
                serverProducts = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }))
            } catch { /* fallback below */ }
        }

        // If Firestore products unavailable, try localStorage data sent by client
        // (less secure but ensures orders work when Firestore is down)
        let serverCalculatedSubtotal = 0
        const validatedItems = []

        for (const item of items) {
            const serverProduct = serverProducts.find(p => String(p.id) === String(item.productId))
            
            if (!serverProduct) {
                // Product not found — might be deleted or invalid
                return NextResponse.json(
                    { error: `পণ্য "${item.productId}" পাওয়া যায়নি।`, code: 'PRODUCT_NOT_FOUND' },
                    { status: 400 }
                )
            }

            // Validate stock
            if (serverProduct.inStock === false) {
                return NextResponse.json(
                    { error: `"${serverProduct.name}" স্টকে নেই।`, code: 'OUT_OF_STOCK' },
                    { status: 400 }
                )
            }

            // Validate quantity
            const qty = Math.max(1, Math.min(parseInt(item.quantity) || 1, 100))
            
            // Use SERVER-SIDE price, never trust client
            const price = serverProduct.offerPrice || serverProduct.price || 0
            serverCalculatedSubtotal += price * qty

            validatedItems.push({
                productId: serverProduct.id,
                quantity: qty,
                price: price,
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
        let shippingSettings = null
        if (isFirebaseConfigured()) {
            try {
                const shipDoc = await getDoc(doc(db, 'settings', 'shipping'))
                if (shipDoc.exists()) shippingSettings = shipDoc.data()
            } catch { /* use defaults */ }
        }

        const shippingCost = deliveryInfo.location === 'outsideDhaka'
            ? (shippingSettings?.outsideDhaka?.cost ?? 120)
            : (shippingSettings?.insideDhaka?.cost ?? 70)

        // ── 9. Server-side Coupon Validation ────────────────────────────
        let coupon = null
        let discountAmount = 0

        if (couponCode) {
            try {
                const couponSnap = await getDocs(collection(db, 'coupons'))
                const allCoupons = couponSnap.docs.map(d => ({ id: d.id, ...d.data() }))
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
            } catch { /* skip coupon on error */ }
        }

        // ── 10. Calculate final total (SERVER-SIDE) ─────────────────────
        const finalTotal = Math.max(0, serverCalculatedSubtotal - discountAmount + shippingCost)

        // ── 11. Duplicate Order Check ───────────────────────────────────
        const productIds = validatedItems.map(i => i.productId)
        const duplicateResult = await checkDuplicateOrder({
            phone: normalizedPhone,
            productIds,
            address: deliveryInfo.address,
            totalAmount: finalTotal,
            windowMinutes: config.duplicateOrderWindowMinutes,
        })

        if (duplicateResult.isDuplicate) {
            signals.duplicateOrder = true
        }

        // ── 12. Order History Analysis ──────────────────────────────────
        const history = await getPhoneOrderHistory(normalizedPhone)
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

        // COD rate limit (per day)
        if (signals.isCOD) {
            const codDayCount = await countRecentOrdersByPhone(normalizedPhone, 24)
            if (codDayCount >= config.maxCODOrdersPerPhonePerDay) {
                signals.rapidOrders = true
            }
        }

        // ── 14. Calculate Risk Score ────────────────────────────────────
        const { score: riskScore, level: riskLevel, reasons: riskReasons } = calculateRiskScore(signals, config)

        // ── 15. Decision ────────────────────────────────────────────────
        if (riskLevel === 'HIGH') {
            // Log the blocked attempt
            await logFraudEvent({
                type: 'ORDER_BLOCKED',
                phone: normalizedPhone,
                ip,
                riskScore,
                riskLevel,
                reason: riskReasons.join(', '),
            })

            // Don't expose internal fraud reasons to the customer
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
            address: {
                id: `addr_${Date.now()}`,
                name: deliveryInfo.name,
                phone: deliveryInfo.phone,
                normalizedPhone,
                street: deliveryInfo.address,
                city: deliveryInfo.location === 'insideDhaka' ? 'Dhaka' : 'Outside Dhaka',
                country: 'Bangladesh',
            },
            user: {
                id: userId || 'user_guest',
                name: deliveryInfo.name,
                phone: deliveryInfo.phone,
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

        // Save to Firestore
        if (isFirebaseConfigured()) {
            try {
                await setDoc(doc(db, 'orders', orderId), newOrder)
            } catch (error) {
                console.error('[OrderAPI] Failed to save order to Firestore:', error)
                // Continue — order will still be in the response for Redux hydration
            }
        }

        // Mark idempotency key as processed
        if (idempotencyKey) {
            processedKeys.set(idempotencyKey, Date.now())
        }

        // Log successful order
        await logFraudEvent({
            type: 'ORDER_ATTEMPT',
            orderId,
            phone: normalizedPhone,
            ip,
            riskScore,
            riskLevel,
            reason: riskLevel === 'MEDIUM' ? 'মাঝারি ঝুঁকি — পর্যালোচনা প্রয়োজন' : 'স্বাভাবিক অর্ডার',
            metadata: { paymentMethod, total: finalTotal },
        })

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

        await logFraudEvent({
            type: 'ORDER_ATTEMPT',
            ip,
            reason: `Server error: ${error.message}`,
        })

        return NextResponse.json(
            { error: 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', code: 'SERVER_ERROR' },
            { status: 500 }
        )
    }
}
