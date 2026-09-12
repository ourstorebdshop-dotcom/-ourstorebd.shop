'use client'

import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import {
    ShieldAlertIcon,
    ShieldCheckIcon,
    ShieldXIcon,
    ShieldIcon,
    BanIcon,
    PlusIcon,
    Trash2Icon,
    SearchIcon,
    CheckCircle2Icon,
    AlertTriangleIcon,
    SlidersIcon,
    HistoryIcon,
    PhoneIcon,
    GlobeIcon,
    EyeIcon,
    SaveIcon,
    RefreshCwIcon,
    XIcon,
    ClockIcon,
    UserCheckIcon
} from 'lucide-react'
import {
    blockPhone,
    unblockPhone,
    blockIP,
    unblockIP,
    addToWatchlist,
    removeFromWatchlist,
    updateFraudSettings,
    trustPhone,
    untrustPhone
} from '@/lib/features/fraud/fraudSlice'
import { updateOrderStatus } from '@/lib/features/order/orderSlice'
import { FRAUD_DEFAULTS } from '@/lib/fraud/config'
import { normalizePhone, validateBDPhone } from '@/lib/fraud/phoneValidator'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firestore'

export default function AdminFraudPage() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()

    const fraudState = useSelector(state => state.fraud)
    const orders = useSelector(state => state.order?.orders) || []

    const blockedPhones = fraudState?.blockedPhones || []
    const blockedIPs = fraudState?.blockedIPs || []
    const watchlist = fraudState?.watchlist || []
    const trustedPhones = fraudState?.trustedPhones || []
    const savedSettings = fraudState?.settings || null
    const hasSyncedRef = useRef(false)

    // Active tab
    const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'blocked_phones' | 'blocked_ips' | 'watchlist' | 'settings' | 'logs'

    // Add modal states
    const [showAddPhoneModal, setShowAddPhoneModal] = useState(false)
    const [newPhoneInput, setNewPhoneInput] = useState('')
    const [newPhoneReason, setNewPhoneReason] = useState('')

    const [showAddIPModal, setShowAddIPModal] = useState(false)
    const [newIPInput, setNewIPInput] = useState('')

    const [showAddWatchlistModal, setShowAddWatchlistModal] = useState(false)
    const [watchPhoneInput, setWatchPhoneInput] = useState('')
    const [watchReasonInput, setWatchReasonInput] = useState('')

    // Search filter inside lists
    const [searchTerm, setSearchTerm] = useState('')

    // Settings state with safe fallbacks
    const [settingsForm, setSettingsForm] = useState({
        maxOrdersPerPhonePerHour: savedSettings?.maxOrdersPerPhonePerHour ?? FRAUD_DEFAULTS?.maxOrdersPerPhonePerHour ?? 3,
        maxOrdersPerIPPerHour: savedSettings?.maxOrdersPerIPPerHour ?? FRAUD_DEFAULTS?.maxOrdersPerIPPerHour ?? 5,
        duplicateOrderWindowMinutes: savedSettings?.duplicateOrderWindowMinutes ?? FRAUD_DEFAULTS?.duplicateOrderWindowMinutes ?? 30,
        minOrderSubmissionTimeMs: (savedSettings?.minOrderSubmissionTimeMs ?? FRAUD_DEFAULTS?.minOrderSubmissionTimeMs ?? 3000) / 1000,
        codRiskMultiplier: savedSettings?.codRiskMultiplier ?? FRAUD_DEFAULTS?.codRiskMultiplier ?? 1.5,
        requireVerificationForMediumRisk: savedSettings?.requireVerificationForMediumRisk ?? true,
        autoBlockHighRisk: savedSettings?.autoBlockHighRisk ?? false,
        riskThresholdMedium: savedSettings?.riskThresholds?.MEDIUM ?? savedSettings?.riskThresholds?.low ?? FRAUD_DEFAULTS?.riskThresholds?.low ?? 30,
        riskThresholdHigh: savedSettings?.riskThresholds?.HIGH ?? savedSettings?.riskThresholds?.medium ?? FRAUD_DEFAULTS?.riskThresholds?.medium ?? 60,
    })

    // Sync settingsForm only once when savedSettings first becomes available from Redux/Firestore
    useEffect(() => {
        if (hasSyncedRef.current) return
        if (savedSettings && typeof savedSettings === 'object' && Object.keys(savedSettings).length > 0) {
            hasSyncedRef.current = true
            setSettingsForm({
                maxOrdersPerPhonePerHour: savedSettings.maxOrdersPerPhonePerHour ?? FRAUD_DEFAULTS?.maxOrdersPerPhonePerHour ?? 3,
                maxOrdersPerIPPerHour: savedSettings.maxOrdersPerIPPerHour ?? FRAUD_DEFAULTS?.maxOrdersPerIPPerHour ?? 5,
                duplicateOrderWindowMinutes: savedSettings.duplicateOrderWindowMinutes ?? FRAUD_DEFAULTS?.duplicateOrderWindowMinutes ?? 30,
                minOrderSubmissionTimeMs: (savedSettings.minOrderSubmissionTimeMs ?? FRAUD_DEFAULTS?.minOrderSubmissionTimeMs ?? 3000) / 1000,
                codRiskMultiplier: savedSettings.codRiskMultiplier ?? FRAUD_DEFAULTS?.codRiskMultiplier ?? 1.5,
                requireVerificationForMediumRisk: savedSettings.requireVerificationForMediumRisk ?? true,
                autoBlockHighRisk: savedSettings.autoBlockHighRisk ?? false,
                riskThresholdMedium: savedSettings.riskThresholds?.MEDIUM ?? savedSettings.riskThresholds?.low ?? FRAUD_DEFAULTS?.riskThresholds?.low ?? 30,
                riskThresholdHigh: savedSettings.riskThresholds?.HIGH ?? savedSettings.riskThresholds?.medium ?? FRAUD_DEFAULTS?.riskThresholds?.medium ?? 60,
            })
        }
    }, [savedSettings])

    // Audit logs state
    const [auditLogs, setAuditLogs] = useState([])
    const [loadingLogs, setLoadingLogs] = useState(false)

    // Load audit logs from Firestore
    const fetchAuditLogs = async () => {
        if (!isFirebaseConfigured()) return
        setLoadingLogs(true)
        try {
            const q = query(collection(db, 'fraud_audit_log'), orderBy('timestamp', 'desc'), limit(50))
            const snapshot = await getDocs(q)
            const logs = []
            snapshot.forEach(doc => {
                logs.push({ id: doc.id, ...doc.data() })
            })
            setAuditLogs(logs)
        } catch (error) {
            console.error('Failed to fetch fraud logs:', error)
        } finally {
            setLoadingLogs(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchAuditLogs()
        }
    }, [activeTab])

    // Filter pending review orders
    const pendingReviewOrders = orders.filter(o => o.status === 'PENDING_REVIEW')
    const highRiskOrders = orders.filter(o => o.status === 'FRAUD_REJECTED' || (o._fraud?.riskLevel === 'HIGH'))

    // Handlers
    const handleApproveOrder = (orderId) => {
        dispatch(updateOrderStatus({ orderId, status: 'ORDER_PLACED' }))
        toast.success(`অর্ডারটি অনুমোদন করা হয়েছে (ORDER PLACED)`)
    }

    const handleRejectOrder = (orderId, phone) => {
        dispatch(updateOrderStatus({ orderId, status: 'FRAUD_REJECTED' }))
        toast.error(`অর্ডারটি বাতিল ও জালিয়াতি চিহ্নিত করা হয়েছে (FRAUD REJECTED)`)
    }

    const handleAddBlockedPhone = (e) => {
        e.preventDefault()
        const raw = newPhoneInput.trim()
        if (!raw) return
        const validation = validateBDPhone(raw)
        const normalized = validation.normalized || raw

        if (blockedPhones.includes(normalized)) {
            toast.error('এই নম্বরটি ইতিমধ্যে ব্লক তালিকায় আছে')
            return
        }

        dispatch(blockPhone(normalized))
        toast.success(`নম্বর ${normalized} ব্লক তালিকায় যুক্ত হয়েছে`)
        setNewPhoneInput('')
        setShowAddPhoneModal(false)
    }

    const handleAddBlockedIP = (e) => {
        e.preventDefault()
        const ip = newIPInput.trim()
        if (!ip) return

        if (blockedIPs.includes(ip)) {
            toast.error('এই IP-টি ইতিমধ্যে ব্লক আছে')
            return
        }

        dispatch(blockIP(ip))
        toast.success(`IP ${ip} ব্লক তালিকায় যুক্ত হয়েছে`)
        setNewIPInput('')
        setShowAddIPModal(false)
    }

    const handleAddWatchlist = (e) => {
        e.preventDefault()
        const raw = watchPhoneInput.trim()
        if (!raw) return
        const validation = validateBDPhone(raw)
        const normalized = validation.normalized || raw

        dispatch(addToWatchlist({
            phone: normalized,
            reason: watchReasonInput.trim() || 'ম্যানুয়াল ফ্ল্যাগ করা হয়েছে',
            addedAt: new Date().toISOString()
        }))
        toast.success(`নম্বর ${normalized} নজরদারিতে রাখা হয়েছে`)
        setWatchPhoneInput('')
        setWatchReasonInput('')
        setShowAddWatchlistModal(false)
    }

    const handleSaveSettings = (e) => {
        e.preventDefault()
        const payload = {
            maxOrdersPerPhonePerHour: Number(settingsForm.maxOrdersPerPhonePerHour),
            maxOrdersPerIPPerHour: Number(settingsForm.maxOrdersPerIPPerHour),
            duplicateOrderWindowMinutes: Number(settingsForm.duplicateOrderWindowMinutes),
            minOrderSubmissionTimeMs: Number(settingsForm.minOrderSubmissionTimeMs) * 1000,
            codRiskMultiplier: Number(settingsForm.codRiskMultiplier),
            requireVerificationForMediumRisk: Boolean(settingsForm.requireVerificationForMediumRisk),
            autoBlockHighRisk: Boolean(settingsForm.autoBlockHighRisk),
            riskThresholds: {
                LOW: 0,
                MEDIUM: Number(settingsForm.riskThresholdMedium),
                HIGH: Number(settingsForm.riskThresholdHigh),
            }
        }

        dispatch(updateFraudSettings(payload))
        toast.success('জালিয়াতি প্রতিরোধ সেটিংস সংরক্ষিত হয়েছে!')
    }

    return (
        <div className="text-slate-700 mb-28 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
                        <ShieldAlertIcon className="text-emerald-600" size={28} />
                        Fraud <span className="text-green-600">Guard</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        ভুয়া ও প্রতারণামূলক অর্ডার প্রতিরোধ, স্প্যাম বট ব্লকিং এবং ঝুঁকি বিশ্লেষণ নিয়ন্ত্রণ
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300/60 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        AI Engine Active
                    </span>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        activeTab === 'pending'
                            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between text-amber-600 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
                        <ShieldAlertIcon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{pendingReviewOrders.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">ম্যানুয়াল যাচাই প্রয়োজন</p>
                </button>

                <button
                    onClick={() => setActiveTab('blocked_phones')}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        activeTab === 'blocked_phones'
                            ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between text-rose-600 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Blocked Numbers</span>
                        <BanIcon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{blockedPhones.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">নিষিদ্ধ ফোন নম্বর</p>
                </button>

                <button
                    onClick={() => setActiveTab('blocked_ips')}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        activeTab === 'blocked_ips'
                            ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between text-purple-600 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Blocked IPs</span>
                        <GlobeIcon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{blockedIPs.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">নিষিদ্ধ IP অ্যাড্রেস</p>
                </button>

                <button
                    onClick={() => setActiveTab('watchlist')}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        activeTab === 'watchlist'
                            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between text-blue-600 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Watchlist</span>
                        <EyeIcon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{watchlist.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">নজরদারিতে থাকা গ্রাহক</p>
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border border-slate-200 rounded-xl p-2 mb-6 flex items-center gap-1.5 overflow-x-auto shadow-xs">
                <button
                    onClick={() => { setActiveTab('pending'); setSearchTerm(''); }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'pending'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <ShieldAlertIcon size={14} />
                    Pending Review ({pendingReviewOrders.length})
                </button>

                <button
                    onClick={() => { setActiveTab('blocked_phones'); setSearchTerm(''); }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'blocked_phones'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <PhoneIcon size={14} />
                    Blocked Numbers ({blockedPhones.length})
                </button>

                <button
                    onClick={() => { setActiveTab('blocked_ips'); setSearchTerm(''); }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'blocked_ips'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <GlobeIcon size={14} />
                    Blocked IPs ({blockedIPs.length})
                </button>

                <button
                    onClick={() => { setActiveTab('watchlist'); setSearchTerm(''); }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'watchlist'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <EyeIcon size={14} />
                    Watchlist ({watchlist.length})
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'settings'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <SlidersIcon size={14} />
                    Engine Settings
                </button>

                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'logs'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <HistoryIcon size={14} />
                    Audit Logs
                </button>
            </div>

            {/* TAB 1: PENDING REVIEW ORDERS */}
            {activeTab === 'pending' && (
                <div className="space-y-4">
                    {pendingReviewOrders.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ShieldCheckIcon size={28} />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">কোনো সন্দেহজনক অর্ডার পেন্ডিং নেই</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                সমস্ত ইনকামিং অর্ডার স্বাভাবিক রেঞ্জে আছে। মাঝারি বা উচ্চ ঝুঁকির অর্ডার আসলে এখানে পর্যালোচনার জন্য জমা হবে।
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingReviewOrders.map(order => {
                                const phone = order.address?.phone || order.user?.phone || ''
                                const isBlocked = blockedPhones.includes(phone)

                                return (
                                    <div key={order.id} className="bg-white border border-amber-200 rounded-xl p-5 shadow-xs transition hover:shadow-md">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-800 text-sm">{order.id}</span>
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold border border-amber-200 flex items-center gap-1">
                                                        <ShieldAlertIcon size={12} />
                                                        RISK SCORE: {order._fraud?.riskScore || 45}/100 ({order._fraud?.riskLevel || 'MEDIUM'})
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(order.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    গ্রাহক: <strong className="text-slate-700">{order.user?.name}</strong> | ফোন: <strong className="text-slate-700">{phone}</strong> | এলাকা: {order.address?.city}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">অর্ডার মূল্য ({order.paymentMethod})</p>
                                                <p className="text-xl font-bold text-green-600">{currency}{Number(order.total).toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        {/* Reasons / Flags */}
                                        <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 rounded-lg text-xs">
                                            <p className="font-semibold text-amber-900 mb-1 flex items-center gap-1">
                                                <AlertTriangleIcon size={13} className="text-amber-600" />
                                                ঝুঁকির কারণসমূহ (Triggered Signals):
                                            </p>
                                            <ul className="list-disc list-inside text-amber-800 space-y-0.5 pl-1">
                                                {order._fraud?.reasons && order._fraud.reasons.length > 0 ? (
                                                    order._fraud.reasons.map((r, i) => (
                                                        <li key={i}>{r}</li>
                                                    ))
                                                ) : (
                                                    <li>নতুন ফোন নম্বর ও COD অর্ডারে অস্বাভাবিক প্যাটার্ন</li>
                                                )}
                                                {order._fraud?.ip && (
                                                    <li>Client IP: <span className="font-mono">{order._fraud.ip}</span></li>
                                                )}
                                            </ul>
                                        </div>

                                        {/* Items preview */}
                                        <div className="mt-3 text-xs text-slate-600">
                                            <span className="font-medium text-slate-700">অর্ডারের পণ্য: </span>
                                            {(order.orderItems || []).map((item, idx) => (
                                                <span key={idx} className="mr-2">
                                                    {item.product?.name || item.name} (x{item.quantity})
                                                </span>
                                            ))}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isBlocked) {
                                                            dispatch(unblockPhone(phone))
                                                            toast.success(`Phone ${phone} unblocked`)
                                                        } else {
                                                            dispatch(blockPhone(phone))
                                                            toast.error(`Phone ${phone} blocked`)
                                                        }
                                                    }}
                                                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition cursor-pointer flex items-center gap-1 ${
                                                        isBlocked
                                                            ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <BanIcon size={12} />
                                                    {isBlocked ? 'নম্বর আনব্লক করুন' : 'গ্রাহকের নম্বর ব্লক করুন'}
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRejectOrder(order.id, phone)}
                                                    className="px-4 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                                                >
                                                    অর্ডার বাতিল ও রিজেক্ট
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApproveOrder(order.id)}
                                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1"
                                                >
                                                    <CheckCircle2Icon size={14} />
                                                    অর্ডারটি অনুমোদন করুন
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: BLOCKED PHONES */}
            {activeTab === 'blocked_phones' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-72">
                            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="ফোন নম্বর খুঁজুন..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-green-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddPhoneModal(true)}
                            className="w-full sm:w-auto px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <PlusIcon size={14} />
                            নতুন নম্বর ব্লক করুন
                        </button>
                    </div>

                    {blockedPhones.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs">
                            বর্তমানে কোনো ফোন নম্বর ব্লক তালিকায় নেই।
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">ফোন নম্বর</th>
                                        <th className="px-4 py-3">অবস্থা</th>
                                        <th className="px-4 py-3 text-right">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {blockedPhones
                                        .filter(p => p.includes(searchTerm))
                                        .map((phone, idx) => (
                                            <tr key={phone} className="hover:bg-slate-50/60">
                                                <td className="px-4 py-3 font-medium text-slate-400">{idx + 1}</td>
                                                <td className="px-4 py-3 font-mono font-bold text-slate-800">{phone}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                        BLOCKED
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            dispatch(unblockPhone(phone))
                                                            toast.success(`নম্বর ${phone} আনব্লক করা হয়েছে`)
                                                        }}
                                                        className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-slate-200 font-medium transition cursor-pointer"
                                                    >
                                                        আনব্লক
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: BLOCKED IPS */}
            {activeTab === 'blocked_ips' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-72">
                            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="IP অ্যাড্রেস খুঁজুন..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-green-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddIPModal(true)}
                            className="w-full sm:w-auto px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <PlusIcon size={14} />
                            নতুন IP ব্লক করুন
                        </button>
                    </div>

                    {blockedIPs.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs">
                            বর্তমানে কোনো IP ব্লক তালিকায় নেই।
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">IP অ্যাড্রেস</th>
                                        <th className="px-4 py-3">অবস্থা</th>
                                        <th className="px-4 py-3 text-right">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {blockedIPs
                                        .filter(ip => ip.includes(searchTerm))
                                        .map((ip, idx) => (
                                            <tr key={ip} className="hover:bg-slate-50/60">
                                                <td className="px-4 py-3 font-medium text-slate-400">{idx + 1}</td>
                                                <td className="px-4 py-3 font-mono font-bold text-slate-800">{ip}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                                        BLOCKED
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            dispatch(unblockIP(ip))
                                                            toast.success(`IP ${ip} আনব্লক করা হয়েছে`)
                                                        }}
                                                        className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-slate-200 font-medium transition cursor-pointer"
                                                    >
                                                        আনব্লক
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: WATCHLIST */}
            {activeTab === 'watchlist' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-72">
                            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="নজরদারি তালিকা খুঁজুন..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-green-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddWatchlistModal(true)}
                            className="w-full sm:w-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <PlusIcon size={14} />
                            নজরদারিতে যোগ করুন
                        </button>
                    </div>

                    {watchlist.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs">
                            বর্তমানে নজরদারি তালিকায় কোনো নম্বর নেই।
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">ফোন নম্বর</th>
                                        <th className="px-4 py-3">কারণ / নোট</th>
                                        <th className="px-4 py-3">যুক্ত করার তারিখ</th>
                                        <th className="px-4 py-3 text-right">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {watchlist
                                        .filter(w => w.phone.includes(searchTerm) || (w.reason || '').includes(searchTerm))
                                        .map((item, idx) => (
                                            <tr key={item.phone} className="hover:bg-slate-50/60">
                                                <td className="px-4 py-3 font-medium text-slate-400">{idx + 1}</td>
                                                <td className="px-4 py-3 font-mono font-bold text-slate-800">{item.phone}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.reason || '—'}</td>
                                                <td className="px-4 py-3 text-slate-400">
                                                    {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                dispatch(blockPhone(item.phone))
                                                                dispatch(removeFromWatchlist(item.phone))
                                                                toast.error(`Phone ${item.phone} moved to Blocklist`)
                                                            }}
                                                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 font-medium transition cursor-pointer"
                                                        >
                                                            ব্লক করুন
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                dispatch(removeFromWatchlist(item.phone))
                                                                toast.success('Removed from watchlist')
                                                            }}
                                                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded border border-slate-200 font-medium transition cursor-pointer"
                                                        >
                                                            মুছুন
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 5: ENGINE SETTINGS */}
            {activeTab === 'settings' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <SlidersIcon size={18} className="text-emerald-600" />
                                Fraud Prevention Thresholds & Rules
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                জালিয়াতি নির্ণয়ের প্যারামিটার এবং স্বয়ংক্রিয় ব্লকিং থ্রেশহোল্ড কনফিগার করুন
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        {/* Rate limits */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                                ১. রেট লিমিট নিয়ন্ত্রণ (Rate Limiting)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        প্রতি ঘণ্টায় সর্বোচ্চ অর্ডার (একটি ফোনে)
                                    </label>
                                    <p className="text-[11px] text-slate-400 mb-2">
                                        নির্দিষ্ট সময়ে একটি ফোন থেকে অতিরিক্ত অর্ডার আসলে ব্লক হবে।
                                    </p>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={settingsForm.maxOrdersPerPhonePerHour}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, maxOrdersPerPhonePerHour: e.target.value })}
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-green-500 bg-white"
                                    />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        প্রতি ঘণ্টায় সর্বোচ্চ অর্ডার (একটি IP-তে)
                                    </label>
                                    <p className="text-[11px] text-slate-400 mb-2">
                                        একই নেটওয়ার্ক/IP থেকে অতিরিক্ত বট অর্ডার ঠেকায়।
                                    </p>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={settingsForm.maxOrdersPerIPPerHour}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, maxOrdersPerIPPerHour: e.target.value })}
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-green-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Duplicate & Bot Timings */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                                ২. ডুপ্লিকেট অর্ডার ও বট টাইমিং (Duplicate & Bot Timing)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        ডুপ্লিকেট অর্ডার উইন্ডো (মিনিট)
                                    </label>
                                    <p className="text-[11px] text-slate-400 mb-2">
                                        একই গ্রাহক ও একই পণ্য এই সময়ের মধ্যে পুনরায় দিলে ডুপ্লিকেট হিসেবে চিহ্নিত হবে।
                                    </p>
                                    <input
                                        type="number"
                                        min="5"
                                        max="180"
                                        value={settingsForm.duplicateOrderWindowMinutes}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, duplicateOrderWindowMinutes: e.target.value })}
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-green-500 bg-white"
                                    />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        সর্বনিম্ন চেকআউট সময় (সেকেন্ড)
                                    </label>
                                    <p className="text-[11px] text-slate-400 mb-2">
                                        স্বাভাবিক মানুষ ফরম পূরণ করতে কয়েক সেকেন্ড নেয়। এর কম সময়ে দিলে বট চিহ্নিত হবে।
                                    </p>
                                    <input
                                        type="number"
                                        min="1"
                                        max="15"
                                        value={settingsForm.minOrderSubmissionTimeMs}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, minOrderSubmissionTimeMs: e.target.value })}
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-green-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Risk Thresholds */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                                ৩. ঝুঁকি স্কোর থ্রেশহোল্ড (Risk Scoring Thresholds 0-100)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        মাঝারি ঝুঁকি থ্রেশহোল্ড (Pending Review)
                                    </label>
                                    <p className="text-[11px] text-slate-400 mb-2">
                                        স্কোর এই মানে পৌঁছালে অর্ডারটি `PENDING_REVIEW`-তে যাবে। ডিফল্ট: 31
                                    </p>
                                    <input
                                        type="number"
                                        min="10"
                                        max="60"
                                        value={settingsForm.riskThresholdMedium}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, riskThresholdMedium: e.target.value })}
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-green-500 bg-white"
                                    />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        উচ্চ ঝুঁকি থ্রেশহোল্ড (Auto-Block)
                                    </label>
                                    <p className="text-[11px] text-slate-400 mb-2">
                                        স্কোর এই মানে পৌঁছালে অর্ডার সরাসরি প্রত্যাখ্যাত হবে। ডিফল্ট: 61
                                    </p>
                                    <input
                                        type="number"
                                        min="50"
                                        max="90"
                                        value={settingsForm.riskThresholdHigh}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, riskThresholdHigh: e.target.value })}
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-green-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                            >
                                <SaveIcon size={16} />
                                সেটিংস সংরক্ষণ করুন
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 6: AUDIT LOGS */}
            {activeTab === 'logs' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <HistoryIcon size={16} className="text-emerald-600" />
                            সাম্প্রতিক অডিট লগ (Last 50 Fraud Events)
                        </h2>
                        <button
                            type="button"
                            onClick={fetchAuditLogs}
                            disabled={loadingLogs}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer disabled:opacity-50"
                            title="রিফ্রেশ করুন"
                        >
                            <RefreshCwIcon size={15} className={loadingLogs ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {auditLogs.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs">
                            {loadingLogs ? 'লগ লোড হচ্ছে...' : 'কোনো অডিট লগ এন্ট্রি পাওয়া যায়নি। নতুন অর্ডার সম্পন্ন হলে এখানে সংরক্ষিত হবে।'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">সময়</th>
                                        <th className="px-4 py-3">ইভেন্ট টাইপ</th>
                                        <th className="px-4 py-3">ফোন / IP</th>
                                        <th className="px-4 py-3">রিস্ক স্কোর</th>
                                        <th className="px-4 py-3">বিবরণ / কারণ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {auditLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    log.type === 'ORDER_BLOCKED' || log.type === 'RATE_LIMIT_EXCEEDED'
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : log.type === 'DUPLICATE_DETECTED'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono">
                                                {log.phone || log.ip || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.riskScore !== undefined ? (
                                                    <span className={`font-bold ${log.riskScore >= 60 ? 'text-rose-600' : log.riskScore >= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {log.riskScore}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                                                {log.reason || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: ADD BLOCKED PHONE */}
            {showAddPhoneModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setShowAddPhoneModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <BanIcon size={16} className="text-rose-600" />
                                ফোন নম্বর ব্লক করুন
                            </h3>
                            <button onClick={() => setShowAddPhoneModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XIcon size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleAddBlockedPhone} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                    বাংলাদেশি ফোন নম্বর <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="017XXXXXXXX বা 01XXXXXXXXX"
                                    value={newPhoneInput}
                                    onChange={(e) => setNewPhoneInput(e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-rose-500"
                                    required
                                    autoFocus
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    এই নম্বর থেকে আর কোনো অর্ডার করা যাবে না।
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddPhoneModal(false)}
                                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                                >
                                    ব্লক করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD BLOCKED IP */}
            {showAddIPModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setShowAddIPModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <GlobeIcon size={16} className="text-purple-600" />
                                IP অ্যাড্রেস ব্লক করুন
                            </h3>
                            <button onClick={() => setShowAddIPModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XIcon size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleAddBlockedIP} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                    IP অ্যাড্রেস (IPv4 বা IPv6) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="103.xxx.xxx.xxx"
                                    value={newIPInput}
                                    onChange={(e) => setNewIPInput(e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-purple-500 font-mono"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddIPModal(false)}
                                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                                >
                                    ব্লক করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD TO WATCHLIST */}
            {showAddWatchlistModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setShowAddWatchlistModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <EyeIcon size={16} className="text-blue-600" />
                                নজরদারিতে যোগ করুন
                            </h3>
                            <button onClick={() => setShowAddWatchlistModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XIcon size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleAddWatchlist} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                    ফোন নম্বর <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="01XXXXXXXXX"
                                    value={watchPhoneInput}
                                    onChange={(e) => setWatchPhoneInput(e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                    ফ্ল্যাগ করার কারণ বা নোট
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="যেমন: বারবার ক্যান্সেল করে, ফেক লোকেশন..."
                                    value={watchReasonInput}
                                    onChange={(e) => setWatchReasonInput(e.target.value)}
                                    className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddWatchlistModal(false)}
                                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                                >
                                    যুক্ত করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
