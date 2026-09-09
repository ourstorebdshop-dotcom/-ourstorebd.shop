'use client'

import { Check, Clock, AlertCircle, RotateCcw } from 'lucide-react'
import { decodeSanitizedText } from '@/lib/chatFirestore'

/**
 * Format relative time for chat messages
 */
function formatMessageTime(isoString) {
    if (!isoString) return ''
    try {
        const date = new Date(isoString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)

        if (diffMins < 1) return 'এইমাত্র'
        if (diffMins < 60) return `${diffMins} মিনিট আগে`
        if (diffHours < 24) {
            return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true })
        }
        return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
        return ''
    }
}

const MessageBubble = ({ message, isCustomer, onRetry }) => {
    const isError = message._status === 'error'
    const isSending = message._status === 'sending'

    const decoded = decodeSanitizedText(message.message || '')

    return (
        <div
            className={`flex animate-chat-message-in ${isCustomer ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-[80%] sm:max-w-[75%] group ${isCustomer ? 'order-1' : 'order-1'}`}
            >
                {/* Message bubble */}
                <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words whitespace-pre-wrap ${
                        isCustomer
                            ? 'bg-green-600 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    } ${isSending ? 'opacity-70' : ''} ${isError ? 'opacity-80' : ''}`}
                >
                    {decoded}
                </div>

                {/* Timestamp + status row */}
                <div
                    className={`flex items-center gap-1.5 mt-1 px-1 ${
                        isCustomer ? 'justify-end' : 'justify-start'
                    }`}
                >
                    <span className="text-[10px] text-slate-400">
                        {formatMessageTime(message.createdAt)}
                    </span>

                    {/* Sending indicator */}
                    {isSending && (
                        <Clock size={10} className="text-slate-400 animate-pulse" />
                    )}

                    {/* Sent indicator */}
                    {isCustomer && !isSending && !isError && (
                        <Check size={10} className={message.isRead ? 'text-green-500' : 'text-slate-400'} />
                    )}

                    {/* Error + retry */}
                    {isError && (
                        <button
                            onClick={() => onRetry?.(message)}
                            className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-600 transition"
                            title="Retry sending"
                        >
                            <AlertCircle size={10} />
                            <RotateCcw size={9} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MessageBubble
