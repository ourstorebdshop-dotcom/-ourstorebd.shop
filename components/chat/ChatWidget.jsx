'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { User, Phone } from 'lucide-react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageComposer from './MessageComposer'
import {
    setCustomerConversationId,
    setMessages,
    addMessage,
    setCustomerUnreadCount,
    setWidgetOpen,
} from '@/lib/features/chat/chatSlice'
import {
    getOrCreateConversation,
    checkConversationExists,
    sendMessage,
    loadMessages,
    loadOlderMessages,
    subscribeToMessages,
    subscribeToCustomerConversation,
    markMessagesAsRead,
    getGuestSessionId,
} from '@/lib/chatFirestore'

const ChatWidget = () => {
    const dispatch = useDispatch()
    const isOpen = useSelector(state => state.chat.isWidgetOpen)
    const currentUser = useSelector(state => state.user.currentUser)
    const conversationId = useSelector(state => state.chat.customerConversationId)
    const messages = useSelector(state => state.chat.messages[conversationId] || [])

    // Guest info form state
    const [guestName, setGuestName] = useState('')
    const [guestPhone, setGuestPhone] = useState('')
    const [needsGuestInfo, setNeedsGuestInfo] = useState(false)
    const [submittingInfo, setSubmittingInfo] = useState(false)

    // Loading states
    const [initialLoading, setInitialLoading] = useState(false)
    const [hasOlder, setHasOlder] = useState(false)

    // Refs for cleanup
    const messageUnsubRef = useRef(null)
    const convUnsubRef = useRef(null)
    const isClosingRef = useRef(false)

    // Determine customer identity
    const getCustomerInfo = useCallback(() => {
        if (currentUser?.id) {
            return {
                customerId: currentUser.id,
                guestSessionId: null,
                name: currentUser.name || 'Customer',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
            }
        }
        return {
            customerId: null,
            guestSessionId: getGuestSessionId(),
            name: guestName || 'Guest',
            email: '',
            phone: guestPhone || '',
        }
    }, [currentUser, guestName, guestPhone])

    // Initialize conversation when widget opens
    useEffect(() => {
        if (!isOpen) return

        const initChat = async () => {
            const info = getCustomerInfo()

            // If guest and no name yet, show form
            if (!info.customerId && !info.name.trim()) {
                setNeedsGuestInfo(true)
                return
            }

            // Check if we already have a conversation
            if (conversationId) {
                const exists = await checkConversationExists(conversationId)
                if (exists) {
                    // Already loaded, just subscribe
                    subscribeToRealtime(conversationId)
                    markMessagesAsRead(conversationId, 'customer')
                    dispatch(setCustomerUnreadCount(0))
                    return
                } else {
                    // Conversation was deleted by admin! Reset customer state
                    dispatch(setCustomerConversationId(null))
                    dispatch(setMessages({ conversationId, messages: [] }))
                }
            }

            setInitialLoading(true)

            // Try to find existing conversation
            const conv = await getOrCreateConversation(info)
            if (conv) {
                dispatch(setCustomerConversationId(conv.id))

                // Load existing messages
                const msgs = await loadMessages(conv.id, 50)
                dispatch(setMessages({ conversationId: conv.id, messages: msgs }))
                setHasOlder(msgs.length >= 50)

                // Subscribe to real-time updates
                subscribeToRealtime(conv.id)

                // Mark as read
                markMessagesAsRead(conv.id, 'customer')
                dispatch(setCustomerUnreadCount(0))
            } else {
                // No existing conversation — it will be created on first message
                // Check if guest needs info
                if (!info.customerId) {
                    setNeedsGuestInfo(true)
                }
            }

            setInitialLoading(false)
        }

        initChat()

        return () => {
            // Don't unsubscribe here — keep listening even when widget closes
            // to update unread count. Cleanup on unmount instead.
        }
    }, [isOpen, currentUser?.id])

    // Cleanup subscriptions on unmount
    useEffect(() => {
        return () => {
            messageUnsubRef.current?.()
            convUnsubRef.current?.()
        }
    }, [])

    // Subscribe to customer conversation updates (for unread count)
    useEffect(() => {
        const info = getCustomerInfo()
        if (!info.customerId && !info.guestSessionId) return

        convUnsubRef.current?.()
        convUnsubRef.current = subscribeToCustomerConversation(
            info.customerId,
            info.guestSessionId,
            (conv) => {
                if (conv) {
                    dispatch(setCustomerConversationId(conv.id))
                    if (!isOpen) {
                        dispatch(setCustomerUnreadCount(conv.customerUnread || 0))
                    }
                } else {
                    dispatch(setCustomerConversationId(null))
                    dispatch(setCustomerUnreadCount(0))
                }
            }
        )

        return () => {
            convUnsubRef.current?.()
        }
    }, [currentUser?.id])

    // Real-time message subscription
    const subscribeToRealtime = useCallback((convId) => {
        messageUnsubRef.current?.()
        messageUnsubRef.current = subscribeToMessages(convId, (msgs) => {
            dispatch(setMessages({ conversationId: convId, messages: msgs }))

            // If widget is open, mark as read
            if (isOpen) {
                markMessagesAsRead(convId, 'customer')
                dispatch(setCustomerUnreadCount(0))
            }
        })
    }, [dispatch, isOpen])

    // Handle guest info submission
    const handleGuestInfoSubmit = async (e) => {
        e.preventDefault()
        if (!guestName.trim()) return

        setSubmittingInfo(true)
        setNeedsGuestInfo(false)

        const info = {
            customerId: null,
            guestSessionId: getGuestSessionId(),
            name: guestName.trim(),
            email: '',
            phone: guestPhone.trim(),
        }

        const conv = await getOrCreateConversation(info)
        if (conv) {
            dispatch(setCustomerConversationId(conv.id))
            const msgs = await loadMessages(conv.id, 50)
            dispatch(setMessages({ conversationId: conv.id, messages: msgs }))
            subscribeToRealtime(conv.id)
        }

        setSubmittingInfo(false)
    }

    // Handle sending a message
    const handleSend = async (text) => {
        const info = getCustomerInfo()

        let convId = conversationId

        // Create conversation if doesn't exist
        if (!convId) {
            const conv = await getOrCreateConversation(info)
            if (!conv) throw new Error('Failed to create conversation')
            convId = conv.id
            dispatch(setCustomerConversationId(conv.id))
            subscribeToRealtime(conv.id)
        }

        // Optimistic message
        const tempId = `temp_${Date.now()}`
        const tempMsg = {
            id: tempId,
            senderId: info.customerId || info.guestSessionId,
            senderType: 'customer',
            message: text,
            isRead: false,
            createdAt: new Date().toISOString(),
            _status: 'sending',
        }
        dispatch(addMessage({ conversationId: convId, message: tempMsg }))

        // Send to Firestore
        const result = await sendMessage(
            convId,
            text,
            info.customerId || info.guestSessionId,
            'customer'
        )

        if (!result) {
            // Mark as error
            dispatch(addMessage({
                conversationId: convId,
                message: { ...tempMsg, _status: 'error' }
            }))
            throw new Error('Failed to send')
        }
    }

    // Handle load older messages
    const handleLoadOlder = async () => {
        if (!conversationId || messages.length === 0) return
        const oldest = messages[0]
        const olderMsgs = await loadOlderMessages(conversationId, oldest.createdAt, 30)
        if (olderMsgs.length > 0) {
            dispatch(setMessages({
                conversationId,
                messages: [...olderMsgs, ...messages]
            }))
        }
        if (olderMsgs.length < 30) {
            setHasOlder(false)
        }
    }

    // Handle close
    const handleClose = () => {
        isClosingRef.current = true
        // Trigger close animation
        const el = document.getElementById('chat-widget-container')
        if (el) {
            el.classList.remove('animate-chat-slide-up')
            el.classList.add('animate-chat-slide-down')
            setTimeout(() => {
                dispatch(setWidgetOpen(false))
                isClosingRef.current = false
            }, 200)
        } else {
            dispatch(setWidgetOpen(false))
            isClosingRef.current = false
        }
    }

    if (!isOpen) return null

    return (
        <div
            id="chat-widget-container"
            className="fixed z-40 animate-chat-slide-up
                bottom-3 right-3 left-3 top-[60px]
                sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto
                sm:w-[380px] sm:h-[520px]
                flex flex-col
                bg-white rounded-2xl
                shadow-2xl shadow-black/15
                border border-slate-200
                overflow-hidden"
            role="dialog"
            aria-label="Customer support chat"
        >
            <ChatHeader onClose={handleClose} />

            {/* Guest info form (for non-logged-in users) */}
            {needsGuestInfo && !conversationId ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mb-4">
                        <User size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 mb-1 text-center">
                        আপনার তথ্য দিন
                    </h4>
                    <p className="text-xs text-slate-400 text-center mb-5">
                        আমরা আপনাকে আরও ভালোভাবে সাহায্য করতে পারব
                    </p>

                    <form onSubmit={handleGuestInfoSubmit} className="w-full max-w-[280px] space-y-3">
                        <div className="relative">
                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="আপনার নাম *"
                                required
                                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                            />
                        </div>
                        <div className="relative">
                            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="tel"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                placeholder="ফোন নম্বর (ঐচ্ছিক)"
                                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!guestName.trim() || submittingInfo}
                            className="w-full py-2.5 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submittingInfo ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    অপেক্ষা করুন...
                                </span>
                            ) : (
                                'চ্যাট শুরু করুন'
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <>
                    <MessageList
                        messages={messages}
                        loading={initialLoading}
                        hasOlder={hasOlder}
                        onLoadOlder={handleLoadOlder}
                    />
                    <MessageComposer
                        onSend={handleSend}
                        disabled={initialLoading}
                    />
                </>
            )}
        </div>
    )
}

export default ChatWidget
