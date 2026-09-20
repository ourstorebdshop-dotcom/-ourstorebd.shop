import { NextResponse } from 'next/server'
import { serverSaveDoc } from '@/lib/firestoreServer'

/**
 * Public API for customer registration/updates.
 * No admin session required — customers can register and update their profile.
 * Server-side validation ensures only safe fields are written.
 */
export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body || !body.id) {
            return NextResponse.json(
                { success: false, error: 'Customer ID required' },
                { status: 400 }
            )
        }

        // Whitelist allowed fields to prevent arbitrary data injection
        const allowed = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'area',
            'postcode', 'googleId', 'photoURL', 'createdAt', 'updatedAt',
            'orderCount', 'totalSpent', 'lastOrderAt', 'provider',
        ]
        const sanitized = {}
        for (const key of allowed) {
            if (body[key] !== undefined) {
                sanitized[key] = body[key]
            }
        }

        if (!sanitized.id) {
            return NextResponse.json(
                { success: false, error: 'Valid customer ID required' },
                { status: 400 }
            )
        }

        const success = await serverSaveDoc('customers', sanitized.id, sanitized)
        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Failed to save customer data' },
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
