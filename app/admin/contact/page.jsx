'use client'

import React, { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
    updateMessageStatus, 
    updateAdminNote, 
    replyMessage, 
    deleteMessage, 
    deleteMultipleMessages, 
    updateStoreInfo,
    resetMessages
} from '@/lib/features/contact/contactSlice'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
    MessageSquare,
    Search,
    Filter,
    Phone,
    Mail,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Send,
    Settings,
    Edit3,
    ExternalLink,
    MapPin,
    Eye,
    Save,
    RotateCcw,
    X,
    User,
    Shield,
    Sparkles,
    Check,
    Archive,
    Inbox
} from 'lucide-react'

export default function AdminContactMessages() {
    const dispatch = useDispatch()
    const messages = useSelector(state => state.contact?.messages) || []
    const storeInfo = useSelector(state => state.contact?.storeInfo) || {}

    // Tabs: 'messages' | 'settings'
    const [activeTab, setActiveTab] = useState('messages')

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [subjectFilter, setSubjectFilter] = useState('ALL')

    // Selection for bulk actions
    const [selectedIds, setSelectedIds] = useState([])

    // Active Message Modal for viewing & replying
    const [viewingMessage, setViewingMessage] = useState(null)
    const [replyText, setReplyText] = useState('')
    const [adminNoteText, setAdminNoteText] = useState('')
    const [deletingMessageId, setDeletingMessageId] = useState(null)
    const [confirmingReset, setConfirmingReset] = useState(false)

    // Store Info Form State
    const [settingsForm, setSettingsForm] = useState({
        phone: storeInfo.phone || '',
        whatsapp: storeInfo.whatsapp || '',
        email: storeInfo.email || '',
        supportEmail: storeInfo.supportEmail || '',
        address: storeInfo.address || '',
        businessHours: storeInfo.businessHours || '',
        googleMapsEmbedUrl: storeInfo.googleMapsEmbedUrl || '',
        facebook: storeInfo.facebook || '',
        instagram: storeInfo.instagram || '',
        youtube: storeInfo.youtube || '',
        announcement: storeInfo.announcement || ''
    })

    // Update settingsForm whenever storeInfo changes
    React.useEffect(() => {
        if (storeInfo) {
            setSettingsForm({
                phone: storeInfo.phone || '',
                whatsapp: storeInfo.whatsapp || '',
                email: storeInfo.email || '',
                supportEmail: storeInfo.supportEmail || '',
                address: storeInfo.address || '',
                businessHours: storeInfo.businessHours || '',
                googleMapsEmbedUrl: storeInfo.googleMapsEmbedUrl || '',
                facebook: storeInfo.facebook || '',
                instagram: storeInfo.instagram || '',
                youtube: storeInfo.youtube || '',
                announcement: storeInfo.announcement || ''
            })
        }
    }, [storeInfo])

    // KPI Metrics
    const metrics = useMemo(() => {
        const total = messages.length
        const unread = messages.filter(m => m.status === 'NEW').length
        const replied = messages.filter(m => m.status === 'REPLIED').length
        const resolved = messages.filter(m => m.status === 'RESOLVED').length
        return { total, unread, replied, resolved }
    }, [messages])

    // Filtered & Searched Messages
    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            const matchesStatus = statusFilter === 'ALL' || msg.status === statusFilter
            const matchesSubject = subjectFilter === 'ALL' || msg.subject === subjectFilter
            
            const q = searchQuery.toLowerCase()
            const matchesSearch = !q || (
                (msg.name && msg.name.toLowerCase().includes(q)) ||
                (msg.email && msg.email.toLowerCase().includes(q)) ||
                (msg.phone && msg.phone.includes(q)) ||
                (msg.subject && msg.subject.toLowerCase().includes(q)) ||
                (msg.message && msg.message.toLowerCase().includes(q))
            )

            return matchesStatus && matchesSubject && matchesSearch
        })
    }, [messages, statusFilter, subjectFilter, searchQuery])

    // Handler: Open modal
    const openMessageModal = (msg) => {
        setViewingMessage(msg.id)
        setReplyText(msg.replyText || '')
        setAdminNoteText(msg.adminNote || '')
    }

    // Get fresh message data from Redux
    const activeMessage = viewingMessage
        ? messages.find(m => m.id === viewingMessage)
        : null

    // Handler: Save Reply
    const handleSendReply = () => {
        if (!viewingMessage) return
        if (!replyText.trim()) {
            toast.error("Please enter a reply text")
            return
        }

        dispatch(replyMessage({
            id: viewingMessage.id,
            replyText: replyText.trim()
        }))

        toast.success("Reply recorded & status updated to REPLIED!")
    }

    // Handler: Save Admin Note
    const handleSaveNote = () => {
        if (!viewingMessage) return
        dispatch(updateAdminNote({
            id: viewingMessage.id,
            note: adminNoteText.trim()
        }))
        toast.success("Internal note saved!")
    }

    // Handler: Status change
    const handleStatusChange = (id, newStatus) => {
        dispatch(updateMessageStatus({ id, status: newStatus }))
        toast.success(`Status changed to ${newStatus}`)
    }

    // Handler: Delete single
    const handleDeleteMessage = (id) => {
        dispatch(deleteMessage(id))
        setSelectedIds(prev => prev.filter(item => item !== id))
        if (viewingMessage === id) {
            setViewingMessage(null)
        }
        setDeletingMessageId(null)
        toast.success("Message deleted")
    }

    // Handler: Bulk Delete
    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return
        dispatch(deleteMultipleMessages(selectedIds))
        setSelectedIds([])
        toast.success("Selected messages deleted")
    }

    // Handler: Bulk Mark Resolved
    const handleBulkMarkResolved = () => {
        if (selectedIds.length === 0) return
        selectedIds.forEach(id => {
            dispatch(updateMessageStatus({ id, status: 'RESOLVED' }))
        })
        setSelectedIds([])
        toast.success("Selected messages marked as RESOLVED")
    }

    // Handler: Toggle Select All
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredMessages.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredMessages.map(m => m.id))
        }
    }

    // Handler: Save Store Settings
    const handleSaveSettings = (e) => {
        e.preventDefault()
        dispatch(updateStoreInfo(settingsForm))
        toast.success("Store contact settings updated and published live!")
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'NEW':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> NEW
                </span>
            case 'REPLIED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <Check size={12} /> REPLIED
                </span>
            case 'RESOLVED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={12} /> RESOLVED
                </span>
            case 'ARCHIVED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <Archive size={12} /> ARCHIVED
                </span>
            default:
                return null
        }
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header Title & Top Navigation Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
                        <MessageSquare className="text-green-600" />
                        <span>Customer Messages & Contact Control</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Manage customer inquiries, reply via WhatsApp/Email, and configure store contact info.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'messages' 
                                ? 'bg-white text-slate-900 shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Inbox size={16} />
                        <span>Inquiries ({messages.length})</span>
                        {metrics.unread > 0 && (
                            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-extrabold">
                                {metrics.unread}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'settings' 
                                ? 'bg-white text-slate-900 shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Settings size={16} />
                        <span>Store Contact Info</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Total Inquiries</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{metrics.total}</p>
                    </div>
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                        <MessageSquare size={20} />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-amber-800">New / Unread</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-1">{metrics.unread}</p>
                    </div>
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                        <AlertCircle size={20} />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-blue-800">Replied</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-1">{metrics.replied}</p>
                    </div>
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                        <Send size={20} />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-emerald-800">Resolved</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">{metrics.resolved}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                        <CheckCircle2 size={20} />
                    </div>
                </div>
            </div>

            {/* TAB 1: CUSTOMER MESSAGES */}
            {activeTab === 'messages' && (
                <div className="space-y-4">
                    {/* Controls Bar: Search & Status Filters */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, phone, message..."
                                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Status Filter Buttons */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
                                {['ALL', 'NEW', 'REPLIED', 'RESOLVED', 'ARCHIVED'].map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setStatusFilter(st)}
                                        className={`px-3 py-1.5 rounded-lg transition capitalize cursor-pointer ${
                                            statusFilter === st 
                                                ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {st === 'ALL' ? 'All Status' : st.toLowerCase()}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setConfirmingReset(true)}
                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                                title="Reset to default demo messages"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Bulk Selection Bar */}
                    {selectedIds.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-emerald-900 animate-fadeIn">
                            <span className="font-semibold">
                                {selectedIds.length} message(s) selected
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleBulkMarkResolved}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={14} />
                                    <span>Mark Resolved</span>
                                </button>
                                <button 
                                    onClick={handleBulkDelete}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition flex items-center gap-1.5"
                                >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages Table & Cards */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        {filteredMessages.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <Inbox size={48} className="mx-auto text-slate-300 mb-3" />
                                <p className="font-semibold text-base text-slate-700">No customer inquiries found</p>
                                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-4 w-10">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.length === filteredMessages.length && filteredMessages.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                                />
                                            </th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Subject & Message</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                        {filteredMessages.map((msg) => {
                                            const isSelected = selectedIds.includes(msg.id)
                                            const cleanWhatsApp = (msg.phone || '').replace(/[^0-9]/g, '')

                                            return (
                                                <tr 
                                                    key={msg.id}
                                                    className={`hover:bg-slate-50/80 transition cursor-pointer ${
                                                        isSelected ? 'bg-emerald-50/40' : ''
                                                    } ${msg.status === 'NEW' ? 'font-medium bg-amber-50/20' : ''}`}
                                                    onClick={() => openMessageModal(msg)}
                                                >
                                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                setSelectedIds(prev => 
                                                                    prev.includes(msg.id)
                                                                        ? prev.filter(i => i !== msg.id)
                                                                        : [...prev, msg.id]
                                                                )
                                                            }}
                                                            className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                                        />
                                                    </td>

                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 text-sm">
                                                                {msg.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800">{msg.name}</p>
                                                                <p className="text-xs text-slate-400">{msg.phone || msg.email || 'No phone/email'}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-4 max-w-xs sm:max-w-md">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                                                                {msg.subject}
                                                            </span>
                                                            {msg.adminNote && (
                                                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[10px] font-medium" title={msg.adminNote}>
                                                                    Note Attached
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-600 line-clamp-1">{msg.message}</p>
                                                    </td>

                                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={msg.status}
                                                            onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                                                            className={`text-xs font-semibold py-1 px-2.5 rounded-lg border outline-none cursor-pointer ${
                                                                msg.status === 'NEW' 
                                                                    ? 'bg-amber-50 border-amber-200 text-amber-800' 
                                                                    : msg.status === 'REPLIED'
                                                                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                                                                        : msg.status === 'RESOLVED'
                                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                                            : 'bg-slate-100 border-slate-200 text-slate-700'
                                                            }`}
                                                        >
                                                            <option value="NEW">NEW</option>
                                                            <option value="REPLIED">REPLIED</option>
                                                            <option value="RESOLVED">RESOLVED</option>
                                                            <option value="ARCHIVED">ARCHIVED</option>
                                                        </select>
                                                    </td>

                                                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                                                        {msg.createdAt ? format(new Date(msg.createdAt), 'dd MMM yyyy, p') : '-'}
                                                    </td>

                                                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* WhatsApp Shortcut */}
                                                            {msg.phone && (
                                                                <a 
                                                                    href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(`Hello ${msg.name}, thank you for contacting Our Store BD regarding your inquiry: "${msg.subject}".`)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                                                                    title="Reply via WhatsApp"
                                                                >
                                                                    <MessageSquare size={15} />
                                                                </a>
                                                            )}

                                                            {/* Email Shortcut */}
                                                            {msg.email && (
                                                                <a 
                                                                    href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject} - Our Store BD`)}&body=${encodeURIComponent(`Dear ${msg.name},\n\nThank you for reaching out to Our Store BD.\n\n`)}`}
                                                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                                    title="Reply via Email"
                                                                >
                                                                    <Mail size={15} />
                                                                </a>
                                                            )}

                                                            {/* Phone Call Shortcut */}
                                                            {msg.phone && (
                                                                <a 
                                                                    href={`tel:${msg.phone}`}
                                                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                                                    title="Call Customer"
                                                                >
                                                                    <Phone size={15} />
                                                                </a>
                                                            )}

                                                            {/* View Modal */}
                                                            <button 
                                                                onClick={() => openMessageModal(msg)}
                                                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                                                title="View Details"
                                                            >
                                                                <Eye size={15} />
                                                            </button>

                                                            {/* Delete */}
                                                            <button 
                                                                onClick={() => setDeletingMessageId(msg.id)}
                                                                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                                                                title="Delete Message"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: STORE CONTACT SETTINGS */}
            {activeTab === 'settings' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Settings Form */}
                    <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
                            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                                <Settings size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Store Contact & Support Information</h3>
                                <p className="text-xs text-slate-500">
                                    Changes made here immediately update the Contact page, Footer, and customer channels.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Helpline Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={settingsForm.phone}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                                        placeholder="+880 1712-345678"
                                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        WhatsApp Chat Number <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={settingsForm.whatsapp}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                                        placeholder="+880 1712-345678"
                                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Official Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="email" 
                                        required
                                        value={settingsForm.email}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                                        placeholder="ourstorebd.shop@gmail.com"
                                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Support / Helpdesk Email
                                    </label>
                                    <input 
                                        type="email" 
                                        value={settingsForm.supportEmail}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                                        placeholder="support@ourstorebd.shop"
                                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Physical Store & Dispatch Hub Address <span className="text-red-500">*</span>
                                </label>
                                <textarea 
                                    rows={2}
                                    required
                                    value={settingsForm.address}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                    placeholder="House #42, Road #11, Block-D, Dhanmondi, Dhaka-1209, Bangladesh"
                                    className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Operating Hours / Business Schedule
                                </label>
                                <input 
                                    type="text" 
                                    value={settingsForm.businessHours}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, businessHours: e.target.value })}
                                    placeholder="Sat – Thu: 9:00 AM – 10:00 PM (Friday: 2:00 PM – 10:00 PM)"
                                    className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Google Maps Embed URL (iframe src)
                                </label>
                                <input 
                                    type="text" 
                                    value={settingsForm.googleMapsEmbedUrl}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, googleMapsEmbedUrl: e.target.value })}
                                    placeholder="https://www.google.com/maps/embed?pb=..."
                                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition font-mono"
                                />
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                                >
                                    <Save size={18} />
                                    <span>Save & Publish Live (সংরক্ষণ করুন)</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Live Preview Box */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                                <Sparkles size={14} />
                                <span>Live Customer View Preview</span>
                            </div>

                            <div className="space-y-4 text-xs">
                                <div>
                                    <p className="text-slate-400">Phone</p>
                                    <p className="font-semibold text-sm text-slate-100">{settingsForm.phone || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">WhatsApp</p>
                                    <p className="font-semibold text-sm text-green-400">{settingsForm.whatsapp || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Email</p>
                                    <p className="font-semibold text-sm text-slate-100">{settingsForm.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Address</p>
                                    <p className="font-medium text-slate-200 leading-relaxed">{settingsForm.address || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Business Hours</p>
                                    <p className="font-medium text-slate-200">{settingsForm.businessHours || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILED MESSAGE & REPLY MODAL */}
            {activeMessage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                                    {activeMessage.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">{activeMessage.name}</h3>
                                    <p className="text-xs text-slate-500">
                                        {activeMessage.phone ? `${activeMessage.phone} • ` : ''}{activeMessage.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {getStatusBadge(activeMessage.status)}
                                <button 
                                    onClick={() => setViewingMessage(null)}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                            {/* Message Details Box */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span className="font-semibold text-slate-700 px-2 py-0.5 bg-white rounded border border-slate-200">
                                        Subject: {activeMessage.subject}
                                    </span>
                                    <span>
                                        {activeMessage.createdAt ? format(new Date(activeMessage.createdAt), 'PPpp') : ''}
                                    </span>
                                </div>
                                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap pt-1">
                                    {activeMessage.message}
                                </p>
                            </div>

                            {/* Direct Action Connect Bar */}
                            <div className="flex flex-wrap items-center gap-2">
                                {activeMessage.phone && (
                                    <a 
                                        href={`https://wa.me/${activeMessage.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${activeMessage.name}, regarding your message about ${activeMessage.subject}:`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
                                    >
                                        <MessageSquare size={14} />
                                        <span>Chat on WhatsApp</span>
                                    </a>
                                )}

                                {activeMessage.email && (
                                    <a 
                                        href={`mailto:${activeMessage.email}?subject=${encodeURIComponent(`Re: ${activeMessage.subject} - Our Store BD`)}`}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
                                    >
                                        <Mail size={14} />
                                        <span>Send Email</span>
                                    </a>
                                )}

                                {activeMessage.phone && (
                                    <a 
                                        href={`tel:${activeMessage.phone}`}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
                                    >
                                        <Phone size={14} />
                                        <span>Call Customer</span>
                                    </a>
                                )}
                            </div>

                            {/* Record Sent Reply / Reply Box */}
                            <div className="border-t border-slate-100 pt-4 space-y-2">
                                <label className="block font-bold text-slate-800 text-xs">
                                    Record Admin Reply (প্রদত্ত উত্তর সংরক্ষণ করুন)
                                </label>
                                <textarea 
                                    rows={3}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type what reply you provided to the customer via WhatsApp/Email/Phone..."
                                    className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 outline-none"
                                />
                                <button 
                                    onClick={handleSendReply}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
                                >
                                    <Send size={13} />
                                    <span>Save Reply & Mark Replied</span>
                                </button>
                            </div>

                            {/* Internal Staff Notes */}
                            <div className="border-t border-slate-100 pt-4 space-y-2">
                                <label className="block font-bold text-slate-800 text-xs">
                                    Internal Admin Notes (অভ্যন্তরীণ নোট)
                                </label>
                                <textarea 
                                    rows={2}
                                    value={adminNoteText}
                                    onChange={(e) => setAdminNoteText(e.target.value)}
                                    placeholder="Add private staff notes regarding this customer..."
                                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 outline-none"
                                />
                                <button 
                                    onClick={handleSaveNote}
                                    className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
                                >
                                    <Save size={13} />
                                    <span>Save Note</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                            <button 
                                onClick={() => setDeletingMessageId(activeMessage.id)}
                                className="px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                            >
                                <Trash2 size={15} />
                                <span>Delete Message</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleStatusChange(activeMessage.id, 'RESOLVED')}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={14} />
                                    <span>Mark as Resolved</span>
                                </button>
                                <button 
                                    onClick={() => setViewingMessage(null)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingMessageId && (
                <div onClick={() => setDeletingMessageId(null)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Delete Message?</h3>
                        <p className="text-sm text-slate-500 mt-2">এই মেসেজটি পার্মানেন্টলি ডিলিট হবে।</p>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setDeletingMessageId(null)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
                            >
                                বাতিল
                            </button>
                            <button
                                onClick={() => handleDeleteMessage(deletingMessageId)}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition"
                            >
                                ডিলিট করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESET CONFIRMATION MODAL */}
            {confirmingReset && (
                <div onClick={() => setConfirmingReset(false)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RotateCcw size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Reset Messages?</h3>
                        <p className="text-sm text-slate-500 mt-2">সকল মেসেজ ডিফল্ট ডেমো ডেটায় রিসেট হবে।</p>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setConfirmingReset(false)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
                            >
                                বাতিল
                            </button>
                            <button
                                onClick={() => { dispatch(resetMessages()); setConfirmingReset(false); toast.success('Messages reset to defaults!'); }}
                                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl transition"
                            >
                                রিসেট করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
