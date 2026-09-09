import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    writeBatch,
    Timestamp,
} from 'firebase/firestore'
import { db, firebaseConfig } from './firebase'

// ===== Check if Firebase is configured =====
function isFirebaseReady() {
    return !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId)
}

// ===== Sanitize message text (XSS prevention) =====
export function sanitizeMessageText(text) {
    if (typeof text !== 'string') return ''
    return text
        .trim()
        .slice(0, 2000) // Max 2000 chars
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
}

// ===== Decode sanitized text for display =====
export function decodeSanitizedText(text) {
    if (typeof text !== 'string') return ''
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
}

// ===== Generate guest session ID =====
export function getGuestSessionId() {
    if (typeof window === 'undefined') return null
    const KEY = 'gocart_chat_guest_session'
    let sessionId = localStorage.getItem(KEY)
    if (!sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        localStorage.setItem(KEY, sessionId)
    }
    return sessionId
}

// ===== Convert Firestore Timestamp to ISO string =====
function tsToISO(ts) {
    if (!ts) return new Date().toISOString()
    if (ts.toDate) return ts.toDate().toISOString()
    if (ts.seconds) return new Date(ts.seconds * 1000).toISOString()
    return new Date(ts).toISOString()
}

// ===== CONVERSATION OPERATIONS =====

/**
 * Get or create a conversation for a customer
 * @param {object} customerInfo - { customerId, guestSessionId, name, email, phone }
 * @returns {object|null} conversation object with id
 */
export async function getOrCreateConversation(customerInfo) {
    if (!isFirebaseReady()) return null

    const { customerId, guestSessionId, name, email, phone } = customerInfo

    try {
        // Try to find existing conversation
        const convsRef = collection(db, 'conversations')
        let q

        if (customerId) {
            q = query(convsRef, where('customerId', '==', customerId), limit(1))
        } else if (guestSessionId) {
            q = query(convsRef, where('guestSessionId', '==', guestSessionId), limit(1))
        } else {
            return null
        }

        const snap = await getDocs(q)
        if (!snap.empty) {
            const docSnap = snap.docs[0]
            const data = docSnap.data()
            return {
                id: docSnap.id,
                ...data,
                lastMessageAt: tsToISO(data.lastMessageAt),
                createdAt: tsToISO(data.createdAt),
                updatedAt: tsToISO(data.updatedAt),
            }
        }

        // Create new conversation
        const newConv = {
            customerId: customerId || null,
            guestSessionId: guestSessionId || null,
            customerName: name || 'Guest',
            customerEmail: email || '',
            customerPhone: phone || '',
            status: 'open',
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            adminUnread: 0,
            customerUnread: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }

        const docRef = await addDoc(convsRef, newConv)
        return {
            id: docRef.id,
            ...newConv,
            lastMessageAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    } catch (e) {
        console.error('[Chat] Failed to get/create conversation:', e)
        return null
    }
}

/**
 * Check if a conversation document exists
 */
export async function checkConversationExists(conversationId) {
    if (!isFirebaseReady() || !conversationId) return false
    try {
        const snap = await getDoc(doc(db, 'conversations', conversationId))
        return snap.exists()
    } catch {
        return false
    }
}

/**
 * Update conversation fields
 */
export async function updateConversationDoc(conversationId, updates) {
    if (!isFirebaseReady() || !conversationId) return false
    try {
        const ref = doc(db, 'conversations', conversationId)
        const snap = await getDoc(ref)
        if (!snap.exists()) return false
        await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() })
        return true
    } catch (e) {
        console.warn('[Chat] Failed to update conversation:', e?.message || e)
        return false
    }
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(conversationId, status) {
    return updateConversationDoc(conversationId, { status })
}

/**
 * Delete a conversation and all its messages permanently
 * @param {string} conversationId
 * @returns {Promise<boolean>}
 */
export async function deleteConversation(conversationId) {
    if (!isFirebaseReady() || !conversationId) return false

    try {
        // 1. Delete all messages inside the conversation subcollection in batches
        const messagesRef = collection(db, 'conversations', conversationId, 'messages')
        const snap = await getDocs(messagesRef)

        if (!snap.empty) {
            const docs = snap.docs
            for (let i = 0; i < docs.length; i += 400) {
                const batch = writeBatch(db)
                const chunk = docs.slice(i, i + 400)
                chunk.forEach(d => {
                    batch.delete(d.ref)
                })
                await batch.commit()
            }
        }

        // 2. Delete the conversation document itself
        await deleteDoc(doc(db, 'conversations', conversationId))
        return true
    } catch (e) {
        console.error('[Chat] Failed to delete conversation:', e)
        return false
    }
}

/**
 * Delete a single message from a conversation
 * @param {string} conversationId
 * @param {string} messageId
 * @returns {Promise<boolean>}
 */
export async function deleteMessage(conversationId, messageId) {
    if (!isFirebaseReady() || !conversationId || !messageId) return false

    try {
        await deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageId))
        return true
    } catch (e) {
        console.error('[Chat] Failed to delete message:', e)
        return false
    }
}


// ===== MESSAGE OPERATIONS =====

/**
 * Send a message in a conversation
 * @param {string} conversationId
 * @param {string} messageText
 * @param {string} senderId - user ID or 'admin'
 * @param {'customer'|'admin'} senderType
 * @returns {object|null} the created message
 */
export async function sendMessage(conversationId, messageText, senderId, senderType) {
    if (!isFirebaseReady() || !conversationId) return null

    const sanitized = sanitizeMessageText(messageText)
    if (!sanitized) return null

    try {
        const convRef = doc(db, 'conversations', conversationId)
        const convSnap = await getDoc(convRef)
        if (!convSnap.exists()) {
            console.warn('[Chat] Conversation does not exist anymore')
            return null
        }

        const messagesRef = collection(db, 'conversations', conversationId, 'messages')

        const newMsg = {
            senderId: senderId || 'unknown',
            senderType: senderType, // 'customer' or 'admin'
            message: sanitized,
            isRead: false,
            createdAt: serverTimestamp(),
        }

        const docRef = await addDoc(messagesRef, newMsg)

        // Update conversation metadata
        const convUpdates = {
            lastMessage: sanitized.slice(0, 100),
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }

        // Increment unread for the other side
        if (senderType === 'customer') {
            const currentUnread = convSnap.data()?.adminUnread || 0
            convUpdates.adminUnread = currentUnread + 1
            const currentStatus = convSnap.data()?.status || 'open'
            if (currentStatus === 'resolved' || currentStatus === 'archived') {
                convUpdates.status = 'open'
            }
        } else {
            const currentUnread = convSnap.data()?.customerUnread || 0
            convUpdates.customerUnread = currentUnread + 1
        }

        await updateDoc(convRef, convUpdates)

        return {
            id: docRef.id,
            ...newMsg,
            createdAt: new Date().toISOString(),
        }
    } catch (e) {
        console.warn('[Chat] Failed to send message:', e?.message || e)
        return null
    }
}

/**
 * Load messages for a conversation (paginated, newest first)
 */
export async function loadMessages(conversationId, messageLimit = 50) {
    if (!isFirebaseReady() || !conversationId) return []

    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages')
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(messageLimit))
        const snap = await getDocs(q)

        return snap.docs
            .map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: tsToISO(d.data().createdAt),
            }))
            .reverse() // Oldest first for display
    } catch (e) {
        console.error('[Chat] Failed to load messages:', e)
        return []
    }
}

/**
 * Load older messages before a given timestamp
 */
export async function loadOlderMessages(conversationId, beforeISO, messageLimit = 30) {
    if (!isFirebaseReady() || !conversationId || !beforeISO) return []

    try {
        const beforeTs = Timestamp.fromDate(new Date(beforeISO))
        const messagesRef = collection(db, 'conversations', conversationId, 'messages')
        const q = query(
            messagesRef,
            orderBy('createdAt', 'desc'),
            startAfter(beforeTs),
            limit(messageLimit)
        )
        const snap = await getDocs(q)

        return snap.docs
            .map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: tsToISO(d.data().createdAt),
            }))
            .reverse()
    } catch (e) {
        console.error('[Chat] Failed to load older messages:', e)
        return []
    }
}

/**
 * Mark all messages as read for a given side
 */
export async function markMessagesAsRead(conversationId, forSenderType) {
    if (!isFirebaseReady() || !conversationId) return

    try {
        const convRef = doc(db, 'conversations', conversationId)
        const convSnap = await getDoc(convRef)
        if (!convSnap.exists()) {
            // Conversation was deleted; return safely without error
            return
        }

        // Reset unread count on the conversation
        const unreadField = forSenderType === 'admin' ? 'adminUnread' : 'customerUnread'
        await updateDoc(convRef, {
            [unreadField]: 0,
            updatedAt: serverTimestamp(),
        })

        // Batch mark messages as read
        const messagesRef = collection(db, 'conversations', conversationId, 'messages')
        const otherType = forSenderType === 'admin' ? 'customer' : 'admin'
        const q = query(
            messagesRef,
            where('senderType', '==', otherType),
            where('isRead', '==', false)
        )
        const snap = await getDocs(q)

        if (!snap.empty) {
            const batch = writeBatch(db)
            snap.docs.forEach(d => {
                batch.update(d.ref, { isRead: true })
            })
            await batch.commit()
        }
    } catch (e) {
        console.warn('[Chat] Failed to mark messages as read:', e?.message || e)
    }
}

// ===== REAL-TIME SUBSCRIPTIONS =====

/**
 * Subscribe to messages in a conversation (real-time)
 * @returns {function} unsubscribe function
 */
export function subscribeToMessages(conversationId, callback) {
    if (!isFirebaseReady() || !conversationId) return () => {}

    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages')
        const q = query(messagesRef, orderBy('createdAt', 'asc'))

        return onSnapshot(q, (snap) => {
            const messages = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: tsToISO(d.data().createdAt),
            }))
            callback(messages)
        }, (error) => {
            console.warn('[Chat] Message listener error:', error)
        })
    } catch (e) {
        console.warn('[Chat] Failed to subscribe to messages:', e)
        return () => {}
    }
}

/**
 * Subscribe to all conversations (admin-side, real-time)
 * @returns {function} unsubscribe function
 */
export function subscribeToAllConversations(callback) {
    if (!isFirebaseReady()) return () => {}

    try {
        const convsRef = collection(db, 'conversations')
        const q = query(convsRef, orderBy('lastMessageAt', 'desc'))

        return onSnapshot(q, (snap) => {
            const conversations = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                lastMessageAt: tsToISO(d.data().lastMessageAt),
                createdAt: tsToISO(d.data().createdAt),
                updatedAt: tsToISO(d.data().updatedAt),
            }))
            callback(conversations)
        }, (error) => {
            console.warn('[Chat] Conversations listener error:', error)
        })
    } catch (e) {
        console.warn('[Chat] Failed to subscribe to conversations:', e)
        return () => {}
    }
}

/**
 * Subscribe to a customer's own conversation (customer-side, real-time)
 * @returns {function} unsubscribe function
 */
export function subscribeToCustomerConversation(customerId, guestSessionId, callback) {
    if (!isFirebaseReady()) return () => {}

    try {
        const convsRef = collection(db, 'conversations')
        let q

        if (customerId) {
            q = query(convsRef, where('customerId', '==', customerId), limit(1))
        } else if (guestSessionId) {
            q = query(convsRef, where('guestSessionId', '==', guestSessionId), limit(1))
        } else {
            return () => {}
        }

        return onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const d = snap.docs[0]
                const data = d.data()
                callback({
                    id: d.id,
                    ...data,
                    lastMessageAt: tsToISO(data.lastMessageAt),
                    createdAt: tsToISO(data.createdAt),
                    updatedAt: tsToISO(data.updatedAt),
                })
            } else {
                callback(null)
            }
        }, (error) => {
            console.warn('[Chat] Customer conversation listener error:', error)
        })
    } catch (e) {
        console.warn('[Chat] Failed to subscribe to customer conversation:', e)
        return () => {}
    }
}

/**
 * Subscribe to admin unread count across all conversations
 * Lightweight listener for the sidebar badge
 * @returns {function} unsubscribe function
 */
export function subscribeToAdminUnreadCount(callback) {
    if (!isFirebaseReady()) return () => {}

    try {
        const convsRef = collection(db, 'conversations')

        return onSnapshot(convsRef, (snap) => {
            let total = 0
            snap.docs.forEach(d => {
                total += (d.data().adminUnread || 0)
            })
            callback(total)
        }, (error) => {
            console.warn('[Chat] Admin unread listener error:', error)
        })
    } catch (e) {
        console.warn('[Chat] Failed to subscribe to admin unread count:', e)
        return () => {}
    }
}
