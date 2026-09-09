'use client'

import { useState, useRef, useEffect } from 'react'
import { SendHorizonal } from 'lucide-react'

const MessageComposer = ({ onSend, disabled = false }) => {
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const textareaRef = useRef(null)

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current
        if (el) {
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
        }
    }, [text])

    const handleSend = async () => {
        const trimmed = text.trim()
        if (!trimmed || sending || disabled) return

        setSending(true)
        try {
            await onSend(trimmed)
            setText('')
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        } catch {
            // Error handled by parent
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const charCount = text.length
    const isOverLimit = charCount > 2000
    const canSend = text.trim().length > 0 && !isOverLimit && !sending && !disabled

    return (
        <div className="px-3 py-2.5 border-t border-slate-100 bg-white rounded-b-2xl sm:rounded-b-2xl">
            <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="আপনার মেসেজ লিখুন..."
                        maxLength={2050}
                        rows={1}
                        disabled={disabled || sending}
                        className={`w-full resize-none px-3.5 py-2.5 text-[13px] bg-slate-50 border rounded-xl outline-none transition placeholder:text-slate-400 ${
                            isOverLimit
                                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                : 'border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Type your message"
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                    {charCount > 1800 && (
                        <span className={`absolute bottom-1 right-2 text-[9px] font-medium ${
                            isOverLimit ? 'text-red-500' : 'text-slate-400'
                        }`}>
                            {charCount}/2000
                        </span>
                    )}
                </div>

                <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={`shrink-0 p-2.5 rounded-xl transition active:scale-95 ${
                        canSend
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-600/20'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
                >
                    {sending ? (
                        <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <SendHorizonal size={18} />
                    )}
                </button>
            </div>

            <p className="text-[9px] text-slate-400 mt-1.5 px-1">
                Enter পাঠাতে • Shift+Enter নতুন লাইনে
            </p>
        </div>
    )
}

export default MessageComposer
