import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    getDocs,
    onSnapshot,
    writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

// ===== Check if Firebase is configured =====
export function isFirebaseConfigured() {
    return !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    )
}

// ===== Single Document Operations =====

/**
 * Save a single document to Firestore
 * @param {string} collectionName - e.g. 'products', 'settings'
 * @param {string} docId - document ID
 * @param {object} data - data to save
 */
export async function saveDocToFirestore(collectionName, docId, data) {
    if (!isFirebaseConfigured()) return
    try {
        await setDoc(doc(db, collectionName, docId), data, { merge: true })
    } catch (e) {
        console.warn(`[Firestore] Failed to save ${collectionName}/${docId}:`, e)
    }
}

/**
 * Load a single document from Firestore
 * @param {string} collectionName
 * @param {string} docId
 * @returns {object|null}
 */
export async function loadDocFromFirestore(collectionName, docId) {
    if (!isFirebaseConfigured()) return null
    try {
        const snap = await getDoc(doc(db, collectionName, docId))
        return snap.exists() ? snap.data() : null
    } catch (e) {
        console.warn(`[Firestore] Failed to load ${collectionName}/${docId}:`, e)
        return null
    }
}

/**
 * Delete a single document from Firestore
 * @param {string} collectionName
 * @param {string} docId
 */
export async function deleteDocFromFirestore(collectionName, docId) {
    if (!isFirebaseConfigured()) return
    try {
        await deleteDoc(doc(db, collectionName, docId))
    } catch (e) {
        console.warn(`[Firestore] Failed to delete ${collectionName}/${docId}:`, e)
    }
}

// ===== Collection Operations =====

/**
 * Load all documents from a Firestore collection
 * @param {string} collectionName
 * @returns {Array}
 */
export async function loadCollectionFromFirestore(collectionName) {
    if (!isFirebaseConfigured()) return null
    try {
        const snap = await getDocs(collection(db, collectionName))
        if (snap.empty) return null
        return snap.docs.map(d => ({ _docId: d.id, ...d.data() }))
    } catch (e) {
        console.warn(`[Firestore] Failed to load collection ${collectionName}:`, e)
        return null
    }
}

/**
 * Save an entire array as individual documents in a collection.
 * Uses batched writes for efficiency.
 * @param {string} collectionName
 * @param {Array} items - each item must have an 'id' field used as doc ID
 */
export async function saveCollectionToFirestore(collectionName, items) {
    if (!isFirebaseConfigured() || !Array.isArray(items)) return
    try {
        const batch = writeBatch(db)
        items.forEach(item => {
            const docId = item.id || item._docId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
            const ref = doc(db, collectionName, docId)
            // Remove _docId meta field before saving
            const { _docId, ...cleanItem } = item
            batch.set(ref, cleanItem)
        })
        await batch.commit()
    } catch (e) {
        console.warn(`[Firestore] Failed to save collection ${collectionName}:`, e)
    }
}

// ===== Real-time Subscriptions =====

/**
 * Subscribe to real-time updates on a single document
 * @param {string} collectionName
 * @param {string} docId
 * @param {function} callback - called with document data (or null if deleted)
 * @returns {function} unsubscribe function
 */
export function subscribeToDoc(collectionName, docId, callback) {
    if (!isFirebaseConfigured()) return () => {}
    try {
        return onSnapshot(
            doc(db, collectionName, docId),
            (snap) => {
                callback(snap.exists() ? snap.data() : null)
            },
            (error) => {
                console.warn(`[Firestore] Listener error on ${collectionName}/${docId}:`, error)
            }
        )
    } catch (e) {
        console.warn(`[Firestore] Failed to subscribe to ${collectionName}/${docId}:`, e)
        return () => {}
    }
}

/**
 * Subscribe to real-time updates on an entire collection
 * @param {string} collectionName
 * @param {function} callback - called with array of documents
 * @returns {function} unsubscribe function
 */
export function subscribeToCollection(collectionName, callback) {
    if (!isFirebaseConfigured()) return () => {}
    try {
        return onSnapshot(
            collection(db, collectionName),
            (snap) => {
                const docs = snap.docs.map(d => ({ _docId: d.id, ...d.data() }))
                callback(docs)
            },
            (error) => {
                console.warn(`[Firestore] Listener error on collection ${collectionName}:`, error)
            }
        )
    } catch (e) {
        console.warn(`[Firestore] Failed to subscribe to collection ${collectionName}:`, e)
        return () => {}
    }
}

// ===== Bulk Sync Helper =====

/**
 * Sync a collection: delete docs that no longer exist, upsert current items.
 * Useful when admin deletes items.
 * @param {string} collectionName
 * @param {Array} items - current items (each must have 'id')
 */
export async function syncCollectionToFirestore(collectionName, items) {
    if (!isFirebaseConfigured() || !Array.isArray(items)) return
    try {
        // Get existing doc IDs
        const existingSnap = await getDocs(collection(db, collectionName))
        const existingIds = new Set(existingSnap.docs.map(d => d.id))
        const currentIds = new Set(items.map(i => i.id).filter(Boolean))

        const batch = writeBatch(db)

        // Delete docs that no longer exist
        existingIds.forEach(id => {
            if (!currentIds.has(id)) {
                batch.delete(doc(db, collectionName, id))
            }
        })

        // Upsert current items
        items.forEach(item => {
            if (item.id) {
                const { _docId, ...cleanItem } = item
                batch.set(doc(db, collectionName, item.id), cleanItem)
            }
        })

        await batch.commit()
    } catch (e) {
        console.warn(`[Firestore] Failed to sync collection ${collectionName}:`, e)
    }
}
