import { adminDb } from './firebaseAdmin.js'

/**
 * Server-side Firestore operations using Firebase Admin SDK.
 * These bypass Firestore security rules entirely.
 * Only use from Next.js API routes / server components.
 */

/**
 * Save a single document (create or merge)
 */
export async function serverSaveDoc(collectionName, docId, data) {
    if (!adminDb) return { success: false, error: 'Database unavailable' }
    try {
        const sanitized = sanitizeData(data)
        await adminDb.collection(collectionName).doc(String(docId)).set(sanitized, { merge: true })
        return { success: true }
    } catch (e) {
        console.error(`[FirestoreServer] Failed to save ${collectionName}/${docId}:`, e)
        return { success: false, error: e.message || String(e) }
    }
}

/**
 * Delete a single document
 */
export async function serverDeleteDoc(collectionName, docId) {
    if (!adminDb) return { success: false, error: 'Database unavailable' }
    try {
        await adminDb.collection(collectionName).doc(String(docId)).delete()
        return { success: true }
    } catch (e) {
        console.error(`[FirestoreServer] Failed to delete ${collectionName}/${docId}:`, e)
        return { success: false, error: e.message || String(e) }
    }
}

/**
 * Load a single document
 */
export async function serverLoadDoc(collectionName, docId) {
    if (!adminDb) return null
    try {
        const snap = await adminDb.collection(collectionName).doc(String(docId)).get()
        return snap.exists ? snap.data() : null
    } catch (e) {
        console.warn(`[FirestoreServer] Failed to load ${collectionName}/${docId}:`, e)
        return null
    }
}

/**
 * Load all documents from a collection
 */
export async function serverLoadCollection(collectionName) {
    if (!adminDb) return null
    try {
        const snap = await adminDb.collection(collectionName).get()
        if (snap.empty) return []
        return snap.docs.map(d => ({ id: d.id, _docId: d.id, ...d.data() }))
    } catch (e) {
        console.warn(`[FirestoreServer] Failed to load collection ${collectionName}:`, e)
        return null
    }
}

/**
 * Sync a collection: delete docs that no longer exist, upsert current items
 */
export async function serverSyncCollection(collectionName, items) {
    if (!adminDb) return { success: false, error: 'Database unavailable' }
    if (!Array.isArray(items)) return { success: false, error: 'items must be an array' }
    try {
        const existingSnap = await adminDb.collection(collectionName).get()
        const existingIds = new Set(existingSnap.docs.map(d => d.id))
        const currentIds = new Set(items.map(i => String(i.id || i.code || '')).filter(Boolean))

        // Delete removed docs (batch max 500)
        const toDeleteIds = []
        existingIds.forEach(id => {
            if (!currentIds.has(id)) {
                toDeleteIds.push(id)
            }
        })
        const deleteChunks = chunkArray(toDeleteIds, 450)
        for (const chunk of deleteChunks) {
            const batch = adminDb.batch()
            for (const id of chunk) {
                batch.delete(adminDb.collection(collectionName).doc(id))
            }
            await batch.commit()
        }

        // Upsert current items (batch max 500)
        const chunks = chunkArray(items, 450)
        for (const chunk of chunks) {
            const batch = adminDb.batch()
            for (const item of chunk) {
                const docId = String(item.id || item.code || '')
                if (!docId) continue
                const sanitized = sanitizeData(item)
                batch.set(adminDb.collection(collectionName).doc(docId), sanitized, { merge: true })
            }
            await batch.commit()
        }
        return { success: true }
    } catch (e) {
        console.error(`[FirestoreServer] Failed to sync collection ${collectionName}:`, e)
        return { success: false, error: e.message || String(e) }
    }
}

/**
 * Clear an entire collection
 */
export async function serverClearCollection(collectionName) {
    if (!adminDb) return { success: false, error: 'Database unavailable' }
    try {
        const snap = await adminDb.collection(collectionName).get()
        if (snap.empty) return { success: true }
        const chunks = chunkArray(snap.docs, 450)
        for (const chunk of chunks) {
            const batch = adminDb.batch()
            chunk.forEach(d => batch.delete(d.ref))
            await batch.commit()
        }
        return { success: true }
    } catch (e) {
        console.error(`[FirestoreServer] Failed to clear collection ${collectionName}:`, e)
        return { success: false, error: e.message || String(e) }
    }
}

// Remove undefined values and _docId before writing
function sanitizeData(data) {
    if (!data || typeof data !== 'object') return data
    const cleaned = {}
    for (const [key, value] of Object.entries(data)) {
        if (key === '_docId' || value === undefined) continue
        cleaned[key] = value
    }
    return cleaned
}

function chunkArray(arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size))
    }
    return chunks
}
