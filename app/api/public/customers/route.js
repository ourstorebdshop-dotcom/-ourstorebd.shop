import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminDb } from '@/lib/firebaseAdmin'
import { serverSaveDoc } from '@/lib/firestoreServer'
import { normalizePhone, phonesMatch } from '@/lib/fraud/phoneValidator'

function hashPassword(password) {
    if (!password) return ''
    return crypto.createHash('sha256').update(String(password) + '_gocart_salt').digest('hex')
}

/**
 * Public API for customer registration, authentication, and profile updates.
 * - action === 'register': Server-side validation, duplicate check in Firestore, password hashing, and persistence.
 * - action === 'login': Server-side credentials verification against Firestore for cross-browser/device support.
 * - default: Profile updates and customer data synchronization.
 */
export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body) {
            return NextResponse.json(
                { success: false, error: 'Invalid request body' },
                { status: 400 }
            )
        }

        // ── 1. Action: LOGIN ──────────────────────────────────────────
        if (body.action === 'login') {
            const { identifier, password } = body
            if (!identifier || !password) {
                return NextResponse.json(
                    { success: false, error: 'অনুগ্রহ করে ইমেইল/ফোন এবং পাসওয়ার্ড প্রদান করুন' },
                    { status: 400 }
                )
            }

            if (!adminDb) {
                return NextResponse.json(
                    { success: false, error: 'ডাটাবেজ সংযোগে সমস্যা হয়েছে' },
                    { status: 503 }
                )
            }

            const idStr = String(identifier).trim().toLowerCase()
            const isPhone = /^\+?\d[\d\s-]{7,}$/.test(idStr)

            const snap = await adminDb.collection('customers').get()
            const matchedDoc = snap.docs.find(doc => {
                const data = doc.data()
                if (isPhone) {
                    return data.phone && (phonesMatch(data.phone, idStr) || normalizePhone(data.phone) === normalizePhone(idStr))
                }
                return data.email && data.email.toLowerCase() === idStr
            })

            if (!matchedDoc) {
                return NextResponse.json(
                    { success: false, error: 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড!' },
                    { status: 401 }
                )
            }

            const customerData = matchedDoc.data()
            const expectedHash = hashPassword(password)
            const isMatch = customerData.passwordHash && customerData.passwordHash === expectedHash

            if (!isMatch) {
                return NextResponse.json(
                    { success: false, error: 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড!' },
                    { status: 401 }
                )
            }

            const { passwordHash: _ph, password: _pw, ...safeCustomer } = customerData
            return NextResponse.json({ success: true, customer: safeCustomer })
        }

        // ── 2. Action: REGISTER ───────────────────────────────────────
        if (body.action === 'register') {
            const { name, phone, email, password, addresses } = body
            if (!name || (!phone && !email) || !password) {
                return NextResponse.json(
                    { success: false, error: 'নাম, মোবাইল নাম্বার/ইমেইল এবং পাসওয়ার্ড আবশ্যক' },
                    { status: 400 }
                )
            }

            const normPhone = phone ? normalizePhone(phone) : ''
            const lowerEmail = email ? email.trim().toLowerCase() : ''

            if (adminDb) {
                const snap = await adminDb.collection('customers').get()
                const existing = snap.docs.find(doc => {
                    const data = doc.data()
                    if (lowerEmail && data.email && data.email.toLowerCase() === lowerEmail) return true
                    if (normPhone && data.phone && (phonesMatch(data.phone, normPhone) || normalizePhone(data.phone) === normPhone)) return true
                    return false
                })

                if (existing) {
                    return NextResponse.json(
                        { success: false, error: 'এই ইমেইল বা মোবাইল নাম্বার দিয়ে ইতিমধ্যে একাউন্ট খোলা আছে' },
                        { status: 409 }
                    )
                }
            }

            const customerId = body.id || `user_${Date.now()}`
            const newCustomer = {
                id: customerId,
                name: String(name).trim(),
                email: lowerEmail || `${normPhone}@customer.ourstorebd.com`,
                phone: normPhone,
                passwordHash: hashPassword(password),
                role: 'CUSTOMER',
                avatar: body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                addresses: Array.isArray(addresses) ? addresses : [],
                joinedDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            if (adminDb) {
                await adminDb.collection('customers').doc(customerId).set(newCustomer, { merge: true })
            }

            const { passwordHash: _ph, ...safeCustomer } = newCustomer
            return NextResponse.json({ success: true, customer: safeCustomer })
        }

        // ── 3. Default: Profile update / Legacy save ──────────────────
        if (!body.id) {
            return NextResponse.json(
                { success: false, error: 'Customer ID required' },
                { status: 400 }
            )
        }

        const allowed = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'area',
            'postcode', 'googleId', 'photoURL', 'createdAt', 'updatedAt',
            'orderCount', 'totalSpent', 'lastOrderAt', 'provider', 'addresses', 'avatar'
        ]
        const sanitized = {}
        for (const key of allowed) {
            if (body[key] !== undefined) {
                sanitized[key] = body[key]
            }
        }

        if (body.password) {
            sanitized.passwordHash = hashPassword(body.password)
        }

        if (!sanitized.id) {
            return NextResponse.json(
                { success: false, error: 'Valid customer ID required' },
                { status: 400 }
            )
        }

        const result = await serverSaveDoc('customers', sanitized.id, sanitized)
        if (!result?.success) {
            return NextResponse.json(
                { success: false, error: result?.error || 'Failed to save customer data' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Public Customers API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
