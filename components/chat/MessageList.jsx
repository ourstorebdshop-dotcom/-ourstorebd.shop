'use client'

import { useRef, useEffect, useState } from 'react'
import { MessageCircle, ChevronUp } from 'lucide-react'
import MessageBubble from './MessageBubble'

const MessageList = ({ messages = [], customerId, guestSessionId, onLoadOlder, hasOlder = false, loading = false }) => {
    const bottomRef = useRef(null)
    const containerRef = useRef(null)
    const [autoScroll, setAutoScroll] = useState(true)
    const prevMessagesLenRef = useRef(0)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (autoScroll && messages.length > prevMessagesLenRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: messages.length <= 1 ? 'instant' : 'smooth' })
        }
        prevMessagesLenRef.current = messages.length
    }, [messages.length, autoScroll])

    // Initial scroll to bottom
    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' })
        }
    }, [])

    // Track if user scrolled up (disable auto-scroll)
    const handleScroll = () => {
        const el = containerRef.current
        if (!el) return
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        setAutoScroll(distanceFromBottom < 80)
    }

    // Determine if a message is from the customer
    const isCustomerMessage = (msg) => {
        return msg.senderType === 'customer'
    }

    // Empty state
    if (!loading && messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mb-4">
                    <MessageCircle size={28} />
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">
                    আমাদের সাথে কথা বলুন!
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                    আমরা আপনার যেকোনো প্রশ্ন ও সমস্যায় সাহায্য করতে প্রস্তুত। নিচে আপনার মেসেজ লিখুন।
                </p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 no-scrollbar"
        >
            {/* Load older messages */}
            {hasOlder && (
                <div className="flex justify-center pb-2">
                    <button
                        onClick={onLoadOlder}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                    >
                        <ChevronUp size={13} />
                        পুরনো মেসেজ দেখুন
                    </button>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && messages.length === 0 && (
                <div className="space-y-3 py-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                            <div className={`h-10 rounded-2xl animate-pulse ${
                                i % 2 === 0
                                    ? 'bg-green-100 w-[60%] rounded-br-md'
                                    : 'bg-slate-100 w-[55%] rounded-bl-md'
                            }`} />
                        </div>
                    ))}
                </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
                <MessageBubble
                    key={msg.id}
                    message={msg}
                    isCustomer={isCustomerMessage(msg)}
                />
            ))}

            <div ref={bottomRef} />
        </div>
    )
}

export default MessageList
