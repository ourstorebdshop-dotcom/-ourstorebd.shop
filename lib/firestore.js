import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    getDocs,
    onSnapshot,
} from 'firebase/firestore'
import { db, firebaseConfig } from './firebase'

// ===== Check if Firebase is configured =====
export function isFirebaseConfigured() {
    return !!(
        (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) ||
        (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    )
}

// Clean document data before sending to Firestore
function sanitizeDocData(data) {
    if (!data || typeof data !== 'object') return data
    const cleaned = {}
    for (const [key, value] of Object.entries(data)) {
        if (key === '_docId' || value === undefined) continue
        cleaned[key] = value
    }
    return cleaned
}

// ===== Single Document Operations =====

/**
 * Save a single document to Firestore
 * @param {string} collectionName - e.g. 'products', 'settings'
 * @param {string} docId - document ID
 * @param {object} data - data to save
 * @returns {Promise<boolean>}
 */
export async function saveDocToFirestore(collectionName, docId, data) {
    if (!isFirebaseConfigured()) return false
    try {
        const sanitized = sanitizeDocData(data)
        await setDoc(doc(db, collectionName, String(docId)), sanitized, { merge: true })
        return true
    } catch (e) {
        console.error(`[Firestore] Failed to save ${collectionName}/${docId}:`, e)
        return false
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
        const snap = await getDoc(doc(db, collectionName, String(docId)))
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
 * @returns {Promise<boolean>}
 */
export async function deleteDocFromFirestore(collectionName, docId) {
    if (!isFirebaseConfigured()) return false
    try {
        await deleteDoc(doc(db, collectionName, String(docId)))
        return true
    } catch (e) {
        console.error(`[Firestore] Failed to delete ${collectionName}/${docId}:`, e)
        return false
    }
}

// ===== Collection Operations =====

/**
 * Load all documents from a Firestore collection
 * @param {string} collectionName
 * @returns {Array|null}
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
 * Uses individual setDoc writes so one item failure never aborts other items.
 * @param {string} collectionName
 * @param {Array} items - each item must have an 'id' field used as doc ID
 */
export async function saveCollectionToFirestore(collectionName, items) {
    if (!isFirebaseConfigured() || !Array.isArray(items)) return
    try {
        const promises = items.map(item => {
            const docId = String(item.id || item._docId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
            const sanitized = sanitizeDocData(item)
            return setDoc(doc(db, collectionName, docId), sanitized, { merge: true })
                .catch(err => console.error(`[Firestore] Error saving ${collectionName}/${docId}:`, err))
        })
        await Promise.allSettled(promises)
    } catch (e) {
        console.error(`[Firestore] Failed to save collection ${collectionName}:`, e)
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
            doc(db, collectionName, String(docId)),
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
 * Uses individual setDoc and deleteDoc operations with Promise.allSettled
 * so that no single document failure aborts the rest of the collection.
 * @param {string} collectionName
 * @param {Array} items - current items (each must have 'id')
 */
export async function syncCollectionToFirestore(collectionName, items) {
    if (!isFirebaseConfigured() || !Array.isArray(items)) return
    try {
        // Get existing doc IDs
        const existingSnap = await getDocs(collection(db, collectionName))
        const existingIds = new Set(existingSnap.docs.map(d => d.id))
        const currentIds = new Set(items.map(i => String(i.id)).filter(Boolean))

        // 1. Delete docs that no longer exist
        const deletePromises = []
        existingIds.forEach(id => {
            if (!currentIds.has(id)) {
                deletePromises.push(
                    deleteDoc(doc(db, collectionName, id))
                        .catch(err => console.warn(`[Firestore] Error deleting ${collectionName}/${id}:`, err))
                )
            }
        })
        await Promise.allSettled(deletePromises)

        // 2. Upsert current items
        const savePromises = items.map(item => {
            if (!item.id) return Promise.resolve()
            const docId = String(item.id)
            const sanitized = sanitizeDocData(item)
            return setDoc(doc(db, collectionName, docId), sanitized, { merge: true })
                .catch(err => console.error(`[Firestore] Error saving ${collectionName}/${docId}:`, err))
        })
        await Promise.allSettled(savePromises)
    } catch (e) {
        console.error(`[Firestore] Failed to sync collection ${collectionName}:`, e)
    }
}
