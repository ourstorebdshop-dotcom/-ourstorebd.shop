/**
 * Client-side admin Firestore operations.
 * 
 * Drop-in replacement for saveDocToFirestore/deleteDocFromFirestore/syncCollectionToFirestore
 * from lib/firestore.js. Same function signatures, same return values.
 * 
 * Instead of writing to Firestore directly (which requires Firebase Auth),
 * these functions call the secure /api/admin/firestore API route which:
 * 1. Verifies the admin session cookie
 * 2. Uses Firebase Admin SDK to write (bypasses Firestore rules)
 */

/**
 * Handle 401 session-expired responses consistently.
 * Shows a clear toast and triggers re-login flow.
 */
let _sessionExpiredShown = false
function handleSessionExpired(res) {
    if (res.status === 401 && !_sessionExpiredShown) {
        _sessionExpiredShown = true
        // Clear stale session
        try { localStorage.removeItem('gocart_admin_session') } catch {}
        // Use setTimeout to avoid blocking the current call chain
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.error('Admin session expired! Please re-login.', { duration: 5000, id: 'session-expired' })
                }).catch(() => {
                    alert('Admin session expired! Please re-login.')
                })
                // Reload to trigger login screen after a brief delay
                setTimeout(() => { window.location.reload() }, 2000)
            }
            _sessionExpiredShown = false
        }, 100)
    }
    return res.status === 401
}

const ADMIN_HEADERS = {
    'Content-Type': 'application/json',
    'X-Admin-Request': '1',
}

/**
 * Save a document via the admin API
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 * @returns {Promise<boolean>}
 */
export async function saveDocToFirestore(collectionName, docId, data) {
    try {
        const res = await fetch('/api/admin/firestore', {
            method: 'POST',
            headers: ADMIN_HEADERS,
            credentials: 'include',
            body: JSON.stringify({
                action: 'save',
                collection: collectionName,
                docId: String(docId),
                data,
            }),
        })
        const result = await res.json()
        if (handleSessionExpired(res)) return false
        if (!result.success) {
            console.error(`[AdminAPI] Failed to save ${collectionName}/${docId}:`, result.error)
        }
        return result.success === true
    } catch (e) {
        console.error(`[AdminAPI] Network error saving ${collectionName}/${docId}:`, e)
        return false
    }
}

/**
 * Delete a document via the admin API
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<boolean>}
 */
export async function deleteDocFromFirestore(collectionName, docId) {
    try {
        const res = await fetch('/api/admin/firestore', {
            method: 'POST',
            headers: ADMIN_HEADERS,
            credentials: 'include',
            body: JSON.stringify({
                action: 'delete',
                collection: collectionName,
                docId: String(docId),
            }),
        })
        const result = await res.json()
        if (handleSessionExpired(res)) return false
        if (!result.success) {
            console.error(`[AdminAPI] Failed to delete ${collectionName}/${docId}:`, result.error)
        }
        return result.success === true
    } catch (e) {
        console.error(`[AdminAPI] Network error deleting ${collectionName}/${docId}:`, e)
        return false
    }
}

/**
 * Sync a collection via the admin API (delete removed docs, upsert current)
 * @param {string} collectionName
 * @param {Array} items
 * @returns {Promise<boolean>}
 */
export async function syncCollectionToFirestore(collectionName, items) {
    try {
        const res = await fetch('/api/admin/firestore', {
            method: 'POST',
            headers: ADMIN_HEADERS,
            credentials: 'include',
            body: JSON.stringify({
                action: 'sync',
                collection: collectionName,
                items,
            }),
        })
        const result = await res.json()
        if (handleSessionExpired(res)) return false
        if (!result.success) {
            console.error(`[AdminAPI] Failed to sync ${collectionName}:`, result.error)
        }
        return result.success === true
    } catch (e) {
        console.error(`[AdminAPI] Network error syncing ${collectionName}:`, e)
        return false
    }
}

/**
 * Load all documents from a collection via admin API
 * @param {string} collectionName
 * @returns {Promise<Array>}
 */
export async function loadCollectionFromFirestore(collectionName) {
    try {
        const res = await fetch('/api/admin/firestore', {
            method: 'POST',
            headers: ADMIN_HEADERS,
            credentials: 'include',
            body: JSON.stringify({
                action: 'getCollection',
                collection: collectionName,
            }),
        })
        const result = await res.json()
        if (result.success && Array.isArray(result.data)) {
            return result.data
        }
        return []
    } catch (e) {
        console.error(`[AdminAPI] Network error loading collection ${collectionName}:`, e)
        return []
    }
}

/**
 * Load a single document via admin API
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<object|null>}
 */
export async function loadDocFromFirestore(collectionName, docId) {
    try {
        const res = await fetch('/api/admin/firestore', {
            method: 'POST',
            headers: ADMIN_HEADERS,
            credentials: 'include',
            body: JSON.stringify({
                action: 'getDoc',
                collection: collectionName,
                docId: String(docId),
            }),
        })
        const result = await res.json()
        if (result.success) {
            return result.data || null
        }
        return null
    } catch (e) {
        console.error(`[AdminAPI] Network error loading ${collectionName}/${docId}:`, e)
        return null
    }
}

/**
 * Clear an entire collection via admin API
 * @param {string} collectionName
 * @returns {Promise<boolean>}
 */
export async function clearCollectionInFirestore(collectionName) {
    try {
        const res = await fetch('/api/admin/firestore', {
            method: 'POST',
            headers: ADMIN_HEADERS,
            credentials: 'include',
            body: JSON.stringify({
                action: 'clearCollection',
                collection: collectionName,
            }),
        })
        const result = await res.json()
        return result.success === true
    } catch (e) {
        console.error(`[AdminAPI] Network error clearing collection ${collectionName}:`, e)
        return false
    }
}

/**
 * Check if Firebase is configured (always true when using API route)
 */
export function isFirebaseConfigured() {
    return true
}
