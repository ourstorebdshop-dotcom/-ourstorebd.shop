'use client'

import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { MessageCircle, X } from 'lucide-react'
import { toggleWidget, setCustomerUnreadCount, setCustomerConversationId } from '@/lib/features/chat/chatSlice'
import { subscribeToCustomerConversation, getGuestSessionId } from '@/lib/chatFirestore'
import dynamic from 'next/dynamic'

// Lazy load the full chat widget
const ChatWidget = dynamic(() => import('./ChatWidget'), {
    ssr: false,
    loading: () => null,
})

const ChatButton = () => {
    const dispatch = useDispatch()
    const isOpen = useSelector(state => state.chat.isWidgetOpen)
    const unreadCount = useSelector(state => state.chat.customerUnreadCount)
    const currentUser = useSelector(state => state.user.currentUser)

    // Subscribe to customer conversation for unread count badge
    useEffect(() => {
        const customerId = currentUser?.id || null
        const guestSessionId = !customerId ? getGuestSessionId() : null

        if (!customerId && !guestSessionId) return

        const unsub = subscribeToCustomerConversation(
            customerId,
            guestSessionId,
            (conv) => {
                if (conv) {
                    dispatch(setCustomerConversationId(conv.id))
                    dispatch(setCustomerUnreadCount(conv.customerUnread || 0))
                } else {
                    dispatch(setCustomerConversationId(null))
                    dispatch(setCustomerUnreadCount(0))
                }
            }
        )

        return () => unsub()
    }, [currentUser?.id, dispatch])

    const handleToggle = () => {
        dispatch(toggleWidget())
    }

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={handleToggle}
                className={`fixed z-40 flex items-center justify-center transition-all duration-300 ease-out
                    w-11 h-11 sm:w-12 sm:h-12
                    rounded-full
                    bottom-[84px] right-3.5
                    sm:bottom-6 sm:right-6
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300
                    ${isOpen
                        ? 'bg-slate-700 hover:bg-slate-800 rotate-0 scale-95 shadow-lg'
                        : 'bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 hover:scale-105 active:scale-95'
                    }
                `}
                aria-label={isOpen ? 'Close chat' : 'Open customer support chat'}
                aria-expanded={isOpen}
                role="button"
            >
                {/* Icon */}
                <span className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                    {isOpen ? (
                        <X size={19} className="text-white" />
                    ) : (
                        <MessageCircle size={19} className="text-white" />
                    )}
                </span>

                {/* Live Online Signal Indicator Dot (when no unread messages) */}
                {!isOpen && unreadCount === 0 && (
                    <span className="absolute top-0 right-0 flex h-3 w-3 -mt-0.5 -mr-0.5" title="Online">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white shadow-xs" />
                    </span>
                )}

                {/* Unread badge */}
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-extrabold shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Widget (lazy-loaded) */}
            {isOpen && <ChatWidget />}
        </>
    )
}

export default ChatButton
