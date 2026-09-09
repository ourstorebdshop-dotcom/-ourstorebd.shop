'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
    Headphones,
    Search,
    X,
    Send,
    SendHorizonal,
    ChevronLeft,
    Circle,
    Clock,
    CheckCircle2,
    Archive,
    MessageCircle,
    User,
    Phone,
    Mail,
    Filter,
    ArrowUpDown,
    Inbox,
    Loader2,
    AlertCircle,
    Check,
    ChevronUp,
    Trash2,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { bn } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
    setConversations,
    setActiveConversation,
    setMessages,
    addMessage,
    removeConversation,
    removeMessage,
    setAdminUnreadCount,
} from '@/lib/features/chat/chatSlice'
import {
    subscribeToAllConversations,
    subscribeToMessages,
    sendMessage,
    loadMessages,
    loadOlderMessages,
    markMessagesAsRead,
    updateConversationStatus,
    updateConversationDoc,
    deleteConversation,
    deleteMessage,
    decodeSanitizedText,
} from '@/lib/chatFirestore'

// ===== STATUS CONFIG =====
const STATUS_CONFIG = {
    open: { label: 'Open', color: 'text-green-700 bg-green-50 border-green-200', icon: Circle, dot: 'bg-green-500' },
    pending: { label: 'Pending', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock, dot: 'bg-amber-500' },
    resolved: { label: 'Resolved', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: CheckCircle2, dot: 'bg-blue-500' },
    archived: { label: 'Archived', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: Archive, dot: 'bg-slate-400' },
}

// ===== FORMAT HELPERS =====
function formatRelativeTime(isoStr) {
    if (!isoStr) return ''
    try {
        return formatDistanceToNow(new Date(isoStr), { addSuffix: true, locale: bn })
    } catch {
        return ''
    }
}

function formatMessageTimestamp(isoStr) {
    if (!isoStr) return ''
    try {
        const date = new Date(isoStr)
        const now = new Date()
        const diffHours = (now - date) / 3600000

        if (diffHours < 24) {
            return format(date, 'p') // e.g. "2:30 PM"
        }
        return format(date, 'dd MMM, p') // e.g. "09 Sep, 2:30 PM"
    } catch {
        return ''
    }
}

// ===== ADMIN CHAT PAGE COMPONENT =====
export default function AdminChatPage() {
    const dispatch = useDispatch()

    // Redux state
    const conversations = useSelector(state => state.chat.conversations)
    const activeConversationId = useSelector(state => state.chat.activeConversationId)
    const messagesMap = useSelector(state => state.chat.messages)
    const activeMessages = activeConversationId ? (messagesMap[activeConversationId] || []) : []
    const adminUnreadCount = useSelector(state => state.chat.adminUnreadCount)

    // Local state
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [sortBy, setSortBy] = useState('latest') // 'latest' | 'unread'
    const [composerText, setComposerText] = useState('')
    const [sending, setSending] = useState(false)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [hasOlderMessages, setHasOlderMessages] = useState(false)
    const [mobileShowChat, setMobileShowChat] = useState(false)
    const [convToDelete, setConvToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Refs
    const messageUnsubRef = useRef(null)
    const bottomRef = useRef(null)
    const composerRef = useRef(null)
    const containerRef = useRef(null)

    // Active conversation data
    const activeConversation = conversations.find(c => c.id === activeConversationId) || null

    // ===== SUBSCRIBE TO ALL CONVERSATIONS =====
    useEffect(() => {
        const unsub = subscribeToAllConversations((convs) => {
            dispatch(setConversations(convs))
        })
        return () => unsub()
    }, [dispatch])

    // ===== SUBSCRIBE TO ACTIVE CONVERSATION MESSAGES =====
    useEffect(() => {
        if (!activeConversationId) return

        messageUnsubRef.current?.()
        setLoadingMessages(true)

        // Load initial messages
        loadMessages(activeConversationId, 50).then((msgs) => {
            dispatch(setMessages({ conversationId: activeConversationId, messages: msgs }))
            setHasOlderMessages(msgs.length >= 50)
            setLoadingMessages(false)
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'instant' })
            }, 50)
        })

        // Subscribe to real-time updates
        messageUnsubRef.current = subscribeToMessages(activeConversationId, (msgs) => {
            dispatch(setMessages({ conversationId: activeConversationId, messages: msgs }))
        })

        // Mark as read
        markMessagesAsRead(activeConversationId, 'admin')

        return () => {
            messageUnsubRef.current?.()
        }
    }, [activeConversationId, dispatch])

    // Auto-scroll when new messages arrive
    useEffect(() => {
        if (activeMessages.length > 0) {
            const el = containerRef.current
            if (el) {
                const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
                if (distanceFromBottom < 150) {
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
                }
            }
        }
    }, [activeMessages.length])

    // ===== FILTERED & SORTED CONVERSATIONS =====
    const filteredConversations = useMemo(() => {
        let result = [...conversations]

        // Status filter
        if (statusFilter !== 'ALL') {
            result = result.filter(c => c.status === statusFilter.toLowerCase())
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(c =>
                (c.customerName || '').toLowerCase().includes(q) ||
                (c.customerEmail || '').toLowerCase().includes(q) ||
                (c.customerPhone || '').includes(q) ||
                (c.lastMessage || '').toLowerCase().includes(q)
            )
        }

        // Sort
        if (sortBy === 'unread') {
            result.sort((a, b) => (b.adminUnread || 0) - (a.adminUnread || 0))
        }
        // 'latest' is default from Firestore orderBy

        return result
    }, [conversations, statusFilter, searchQuery, sortBy])

    // ===== KPI METRICS =====
    const metrics = useMemo(() => ({
        total: conversations.length,
        open: conversations.filter(c => c.status === 'open').length,
        pending: conversations.filter(c => c.status === 'pending').length,
        resolved: conversations.filter(c => c.status === 'resolved').length,
        unread: adminUnreadCount,
    }), [conversations, adminUnreadCount])

    // ===== HANDLERS =====
    const handleSelectConversation = useCallback((convId) => {
        dispatch(setActiveConversation(convId))
        setMobileShowChat(true)
        setComposerText('')
    }, [dispatch])

    const handleBack = useCallback(() => {
        setMobileShowChat(false)
        dispatch(setActiveConversation(null))
    }, [dispatch])

    const handleSendMessage = async () => {
        if (!composerText.trim() || !activeConversationId || sending) return

        const text = composerText.trim()
        setComposerText('')
        setSending(true)

        try {
            const result = await sendMessage(activeConversationId, text, 'admin', 'admin')
            if (!result) {
                toast.error('মেসেজ পাঠানো যায়নি!')
                setComposerText(text)
            }
        } catch {
            toast.error('মেসেজ পাঠানো যায়নি!')
            setComposerText(text)
        } finally {
            setSending(false)
            composerRef.current?.focus()
        }
    }

    const handleComposerKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleStatusChange = async (convId, newStatus) => {
        const success = await updateConversationStatus(convId, newStatus)
        if (success) {
            toast.success(`Status changed to ${newStatus}`)
        } else {
            toast.error('Status update failed')
        }
    }

    const handleConfirmDelete = async () => {
        if (!convToDelete || isDeleting) return
        setIsDeleting(true)
        try {
            const convId = convToDelete.id
            const success = await deleteConversation(convId)
            if (success) {
                toast.success('কনভারসেশন ডিলিট হয়েছে!')
                dispatch(removeConversation(convId))
                if (activeConversationId === convId) {
                    dispatch(setActiveConversation(null))
                    setMobileShowChat(false)
                }
                setConvToDelete(null)
            } else {
                toast.error('কনভারসেশন ডিলিট করা যায়নি!')
            }
        } catch (err) {
            console.error('[Chat] Delete conversation error:', err)
            toast.error('কনভারসেশন ডিলিট করা যায়নি!')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteSingleMessage = async (messageId) => {
        if (!activeConversationId) return
        if (!window.confirm('এই মেসেজটি কি ডিলিট করতে চান?')) return

        try {
            const success = await deleteMessage(activeConversationId, messageId)
            if (success) {
                toast.success('মেসেজ ডিলিট হয়েছে!')
                dispatch(removeMessage({ conversationId: activeConversationId, messageId }))
            } else {
                toast.error('মেসেজ ডিলিট করা যায়নি!')
            }
        } catch (err) {
            console.error('[Chat] Delete message error:', err)
            toast.error('মেসেজ ডিলিট করা যায়নি!')
        }
    }

    const handleLoadOlder = async () => {
        if (!activeConversationId || activeMessages.length === 0) return
        const oldest = activeMessages[0]
        const olderMsgs = await loadOlderMessages(activeConversationId, oldest.createdAt, 30)
        if (olderMsgs.length > 0) {
            dispatch(setMessages({
                conversationId: activeConversationId,
                messages: [...olderMsgs, ...activeMessages]
            }))
        }
        if (olderMsgs.length < 30) setHasOlderMessages(false)
    }

    // Auto-resize composer textarea
    useEffect(() => {
        const el = composerRef.current
        if (el) {
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 100) + 'px'
        }
    }, [composerText])

    // ===== RENDER =====
    return (
        <div className="h-[calc(100vh-100px)] sm:h-[calc(100vh-80px)] flex flex-col max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 shrink-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Headphones className="text-green-600" size={24} />
                        <span>Live Chat Support</span>
                        {adminUnreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold animate-chat-badge-pulse">
                                {adminUnreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time customer support conversations</p>
                </div>

                {/* KPI Mini Cards */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {[
                        { label: 'Open', val: metrics.open, color: 'text-green-700 bg-green-50 border-green-200' },
                        { label: 'Pending', val: metrics.pending, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                        { label: 'Unread', val: metrics.unread, color: 'text-red-700 bg-red-50 border-red-200' },
                    ].map(kpi => (
                        <div key={kpi.label} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${kpi.color}`}>
                            {kpi.val} {kpi.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-h-0">

                {/* ===== LEFT: CONVERSATION LIST ===== */}
                <div className={`flex flex-col border-r border-slate-100 w-full sm:w-[340px] lg:w-[360px] shrink-0 ${
                    mobileShowChat ? 'hidden sm:flex' : 'flex'
                }`}>
                    {/* Search + Filters */}
                    <div className="p-3 border-b border-slate-100 space-y-2 shrink-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search customers..."
                                className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {['ALL', 'open', 'pending', 'resolved', 'archived'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition whitespace-nowrap cursor-pointer ${
                                        statusFilter === st
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {st === 'ALL' ? 'All' : st}
                                </button>
                            ))}
                            <button
                                onClick={() => setSortBy(s => s === 'latest' ? 'unread' : 'latest')}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition ml-auto shrink-0"
                                title={sortBy === 'latest' ? 'Sort by unread' : 'Sort by latest'}
                            >
                                <ArrowUpDown size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <Inbox size={40} className="text-slate-300 mb-3" />
                                <p className="text-sm font-semibold text-slate-600">No conversations</p>
                                <p className="text-xs text-slate-400 mt-1">Customer messages will appear here</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const isActive = conv.id === activeConversationId
                                const statusCfg = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open

                                return (
                                    <div
                                        key={conv.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleSelectConversation(conv.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handleSelectConversation(conv.id)
                                            }
                                        }}
                                        className={`group relative w-full text-left p-3.5 border-b border-slate-50 hover:bg-slate-50/80 transition cursor-pointer select-none ${
                                            isActive ? 'bg-green-50/60 border-l-[3px] border-l-green-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                                isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {(conv.customerName || 'G').charAt(0).toUpperCase()}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-sm truncate ${
                                                        conv.adminUnread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                                                    }`}>
                                                        {conv.customerName || 'Guest'}
                                                    </span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                            {formatRelativeTime(conv.lastMessageAt)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setConvToDelete(conv)
                                                            }}
                                                            title="Delete conversation"
                                                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 -mr-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                                    <p className={`text-xs truncate ${
                                                        conv.adminUnread > 0 ? 'text-slate-600 font-medium' : 'text-slate-400'
                                                    }`}>
                                                        {decodeSanitizedText(conv.lastMessage || 'No messages yet')}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                        {conv.adminUnread > 0 && (
                                                            <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-green-600 text-white text-[9px] font-extrabold">
                                                                {conv.adminUnread}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* ===== RIGHT: ACTIVE CHAT ===== */}
                <div className={`flex-1 flex flex-col min-w-0 ${
                    !mobileShowChat ? 'hidden sm:flex' : 'flex'
                }`}>
                    {!activeConversation ? (
                        /* No conversation selected */
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
                                <MessageCircle size={32} />
                            </div>
                            <h3 className="text-base font-bold text-slate-600">Select a conversation</h3>
                            <p className="text-xs text-slate-400 mt-1.5 max-w-[280px]">
                                Choose a customer conversation from the left panel to start managing their support request.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    {/* Mobile back button */}
                                    <button
                                        onClick={handleBack}
                                        className="sm:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                                        {(activeConversation.customerName || 'G').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">
                                            {activeConversation.customerName || 'Guest'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            {activeConversation.customerPhone && (
                                                <span className="flex items-center gap-0.5">
                                                    <Phone size={9} />
                                                    {activeConversation.customerPhone}
                                                </span>
                                            )}
                                            {activeConversation.customerEmail && (
                                                <span className="flex items-center gap-0.5">
                                                    <Mail size={9} />
                                                    {activeConversation.customerEmail}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {/* Status selector */}
                                    <select
                                        value={activeConversation.status}
                                        onChange={(e) => handleStatusChange(activeConversation.id, e.target.value)}
                                        className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border outline-none cursor-pointer uppercase tracking-wide ${
                                            STATUS_CONFIG[activeConversation.status]?.color || ''
                                        }`}
                                    >
                                        <option value="open">Open</option>
                                        <option value="pending">Pending</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="archived">Archived</option>
                                    </select>

                                    {/* Delete conversation button */}
                                    <button
                                        type="button"
                                        onClick={() => setConvToDelete(activeConversation)}
                                        className="flex items-center gap-1 text-[11px] font-medium py-1 px-2.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition cursor-pointer"
                                        title="Delete conversation"
                                    >
                                        <Trash2 size={13} />
                                        <span className="hidden sm:inline">Delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={containerRef}
                                className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar"
                            >
                                {/* Load older button */}
                                {hasOlderMessages && (
                                    <div className="flex justify-center pb-2">
                                        <button
                                            onClick={handleLoadOlder}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                                        >
                                            <ChevronUp size={13} />
                                            Load older messages
                                        </button>
                                    </div>
                                )}

                                {/* Loading state */}
                                {loadingMessages && activeMessages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10">
                                        <Loader2 size={24} className="text-green-500 animate-spin mb-2" />
                                        <p className="text-xs text-slate-400">Loading messages...</p>
                                    </div>
                                )}

                                {/* Empty state */}
                                {!loadingMessages && activeMessages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <MessageCircle size={28} className="text-slate-300 mb-2" />
                                        <p className="text-xs text-slate-400">No messages in this conversation yet.</p>
                                    </div>
                                )}

                                {/* Message bubbles */}
                                {activeMessages.map((msg) => {
                                    const isAdmin = msg.senderType === 'admin'
                                    const decoded = decodeSanitizedText(msg.message || '')

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`group flex items-end gap-1.5 animate-chat-message-in ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSingleMessage(msg.id)}
                                                    title="Delete message"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-red-500 rounded-md mb-1 cursor-pointer"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                            <div className="max-w-[75%]">
                                                <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words whitespace-pre-wrap ${
                                                    isAdmin
                                                        ? 'bg-green-600 text-white rounded-br-md'
                                                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                                }`}>
                                                    {decoded}
                                                </div>
                                                <div className={`flex items-center gap-1.5 mt-1 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-[10px] text-slate-400">
                                                        {formatMessageTimestamp(msg.createdAt)}
                                                    </span>
                                                    {isAdmin && (
                                                        <Check size={10} className={msg.isRead ? 'text-green-500' : 'text-slate-400'} />
                                                    )}
                                                </div>
                                            </div>
                                            {!isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSingleMessage(msg.id)}
                                                    title="Delete message"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-red-500 rounded-md mb-1 cursor-pointer"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}

                                <div ref={bottomRef} />
                            </div>

                            {/* Composer */}
                            <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={composerRef}
                                        value={composerText}
                                        onChange={(e) => setComposerText(e.target.value)}
                                        onKeyDown={handleComposerKeyDown}
                                        placeholder="Reply to customer..."
                                        rows={1}
                                        disabled={sending}
                                        className="flex-1 resize-none px-3.5 py-2.5 text-[13px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition placeholder:text-slate-400 disabled:opacity-50"
                                        style={{ minHeight: '40px', maxHeight: '100px' }}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!composerText.trim() || sending}
                                        className={`shrink-0 p-2.5 rounded-xl transition active:scale-95 ${
                                            composerText.trim() && !sending
                                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-600/20'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                        aria-label="Send message"
                                    >
                                        {sending ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <SendHorizonal size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {convToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <Trash2 size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-slate-800">Delete Conversation?</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Are you sure you want to delete this conversation with{' '}
                                    <strong className="text-slate-700">{convToDelete.customerName || 'Guest'}</strong>?
                                    All messages will be permanently removed.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2.5 mt-5">
                            <button
                                type="button"
                                onClick={() => setConvToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={13} />
                                        <span>Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
