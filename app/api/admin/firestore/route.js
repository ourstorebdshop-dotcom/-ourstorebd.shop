import { NextResponse } from 'next/server'
import { verifyAdminSessionToken } from '@/lib/security/auth'
import {
    serverSaveDoc,
    serverDeleteDoc,
    serverSyncCollection,
    serverLoadDoc,
    serverLoadCollection,
    serverClearCollection
} from '@/lib/firestoreServer'

// Allowlist of collections that the admin proxy can access
const ALLOWED_COLLECTIONS = new Set([
    'products', 'categories', 'banners', 'coupons', 'orders',
    'customers', 'settings', 'conversations', 'fraud_audit_log',
    'shipping', 'cashflow', 'contacts', 'headerFooter', 'hero',
    'apiSettings', 'tracking', 'favicon', 'integrations', 'wishlist'
])

/**
 * Secure Admin Firestore Proxy
 * 
 * All admin Firestore operations go through this route.
 * 1. Verifies admin session cookie
 * 2. Validates the request
 * 3. Uses Firebase Admin SDK to execute (bypasses Firestore rules)
 * 
 * Already protected by middleware.js (line 97-105) which checks
 * for the gocart_admin_session cookie on all /api/admin/* routes.
 */
export async function POST(request) {
    try {
        // 1. Extract and verify admin session
        const sessionCookie = request.cookies.get('gocart_admin_session')?.value
        if (!sessionCookie) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: No admin session' },
                { status: 401 }
            )
        }

        const session = verifyAdminSessionToken(sessionCookie)
        if (!session.valid) {
            return NextResponse.json(
                { success: false, error: `Unauthorized: ${session.error}` },
                { status: 401 }
            )
        }

        // 2. Parse request body
        const body = await request.json().catch(() => null)
        if (!body || !body.action) {
            return NextResponse.json(
                { success: false, error: 'Invalid request: action required' },
                { status: 400 }
            )
        }

        if (!body.collection) {
            return NextResponse.json(
                { success: false, error: 'Invalid request: collection required' },
                { status: 400 }
            )
        }

        // Validate collection against allowlist
        if (!ALLOWED_COLLECTIONS.has(body.collection)) {
            return NextResponse.json(
                { success: false, error: `Access denied: collection '${body.collection}' is not allowed` },
                { status: 403 }
            )
        }

        const { action, collection, docId, data, items } = body

        // 3. Execute the requested operation
        let opResult = { success: false, error: 'No operation performed' }

        switch (action) {
            case 'loadCollection':
            case 'getCollection': {
                const docs = await serverLoadCollection(collection)
                return NextResponse.json({ success: true, data: docs || [] })
            }

            case 'loadDoc':
            case 'getDoc': {
                if (!docId) {
                    return NextResponse.json(
                        { success: false, error: 'docId required for getDoc action' },
                        { status: 400 }
                    )
                }
                const doc = await serverLoadDoc(collection, docId)
                return NextResponse.json({ success: true, data: doc, exists: doc !== null })
            }

            case 'clearCollection': {
                opResult = await serverClearCollection(collection)
                break
            }

            case 'save':
                if (!docId) {
                    return NextResponse.json(
                        { success: false, error: 'docId required for save action' },
                        { status: 400 }
                    )
                }
                opResult = await serverSaveDoc(collection, docId, data || {})
                break

            case 'delete':
                if (!docId) {
                    return NextResponse.json(
                        { success: false, error: 'docId required for delete action' },
                        { status: 400 }
                    )
                }
                opResult = await serverDeleteDoc(collection, docId)
                break

            case 'sync':
                if (!Array.isArray(items)) {
                    return NextResponse.json(
                        { success: false, error: 'items array required for sync action' },
                        { status: 400 }
                    )
                }
                opResult = await serverSyncCollection(collection, items)
                break

            default:
                return NextResponse.json(
                    { success: false, error: `Unknown action: ${action}` },
                    { status: 400 }
                )
        }

        if (!opResult.success) {
            return NextResponse.json(
                { success: false, error: opResult.error || 'Firestore operation failed' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Admin Firestore API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
