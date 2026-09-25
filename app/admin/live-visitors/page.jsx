'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
    UsersIcon,
    RadioIcon,
    SmartphoneIcon,
    MonitorIcon,
    TabletIcon,
    GlobeIcon,
    RefreshCwIcon,
    PauseIcon,
    PlayIcon,
    SearchIcon,
    ClockIcon,
    ShieldCheckIcon,
    ExternalLinkIcon,
    ActivityIcon,
    CompassIcon,
    TrendingUpIcon,
    WifiIcon,
    WifiOffIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

const AUTO_REFRESH_INTERVAL_SECONDS = 4 // 4 seconds auto-refresh

export default function AdminLiveVisitors() {
    const [data, setData] = useState({
        count: 0,
        visitors: [],
        deviceBreakdown: { Desktop: 0, Mobile: 0, Tablet: 0 },
        browserBreakdown: {},
        topPages: [],
        avgDurationSeconds: 0,
        timestamp: Date.now(),
        timeoutWindowSeconds: 45,
    })

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(true)
    const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL_SECONDS)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterDevice, setFilterDevice] = useState('ALL')
    const [connectionStatus, setConnectionStatus] = useState('connected')

    const timerRef = useRef(null)
    const countdownRef = useRef(null)

    /**
     * Fetch latest active presence data from secure admin endpoint
     */
    const fetchLiveData = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true)
        try {
            const res = await fetch('/api/admin/presence', {
                method: 'GET',
                headers: {
                    'x-admin-request': '1',
                },
                cache: 'no-store',
            })

            if (res.ok) {
                const json = await res.json()
                if (json.success) {
                    setData({
                        count: json.count || 0,
                        visitors: Array.isArray(json.visitors) ? json.visitors : [],
                        deviceBreakdown: json.deviceBreakdown || { Desktop: 0, Mobile: 0, Tablet: 0 },
                        browserBreakdown: json.browserBreakdown || {},
                        topPages: Array.isArray(json.topPages) ? json.topPages : [],
                        avgDurationSeconds: json.avgDurationSeconds || 0,
                        timestamp: json.timestamp || Date.now(),
                        timeoutWindowSeconds: json.timeoutWindowSeconds || 45,
                    })
                    setConnectionStatus('connected')
                }
            } else if (res.status === 401) {
                setConnectionStatus('unauthorized')
            } else {
                setConnectionStatus('error')
            }
        } catch {
            setConnectionStatus('disconnected')
        } finally {
            setLoading(false)
            if (isManual) {
                setRefreshing(false)
                toast.success('লাইভ ভিজিটর ডেটা আপডেট হয়েছে')
            }
        }
    }, [])

    // Setup initial fetch and periodic auto-refresh timer
    useEffect(() => {
        fetchLiveData()

        if (!isAutoRefreshActive) return

        // 1-second interval for smooth countdown timer
        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    fetchLiveData()
                    return AUTO_REFRESH_INTERVAL_SECONDS
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [fetchLiveData, isAutoRefreshActive])

    // Toggle Auto Refresh
    const toggleAutoRefresh = () => {
        setIsAutoRefreshActive((prev) => {
            const next = !prev
            if (next) {
                setCountdown(AUTO_REFRESH_INTERVAL_SECONDS)
                fetchLiveData()
                toast.success('অটো-রিফ্রেশ চালু করা হয়েছে')
            } else {
                toast('অটো-রিফ্রেশ সাময়িক বন্ধ করা হয়েছে', { icon: '⏸️' })
            }
            return next
        })
    }

    // Format seconds into minutes/seconds string
    const formatDuration = (seconds) => {
        if (!seconds || seconds < 0) return '১ সে.'
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        if (m === 0) return `${s}s`
        return `${m}m ${s}s`
    }

    // Format last seen relative time
    const formatSecondsAgo = (seconds) => {
        if (seconds === undefined || seconds === null || seconds <= 2) return 'Just now'
        return `${seconds}s ago`
    }

    // Filter and search active visitors
    const filteredVisitors = useMemo(() => {
        return (data.visitors || []).filter((v) => {
            const matchesSearch =
                !searchQuery ||
                v.page?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.displayId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.browser?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.os?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.referrer?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesDevice = filterDevice === 'ALL' || v.deviceType === filterDevice

            return matchesSearch && matchesDevice
        })
    }, [data.visitors, searchQuery, filterDevice])

    const totalCount = data.count || 0
    const mobileCount = data.deviceBreakdown?.Mobile || 0
    const desktopCount = data.deviceBreakdown?.Desktop || 0
    const tabletCount = data.deviceBreakdown?.Tablet || 0

    const mobilePct = totalCount > 0 ? Math.round((mobileCount / totalCount) * 100) : 0
    const desktopPct = totalCount > 0 ? Math.round((desktopCount / totalCount) * 100) : 0

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="relative flex items-center justify-center">
                            <span className="relative flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <span>Live Visitors</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase tracking-wider">
                                Realtime
                            </span>
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        বর্তমানে ওয়েবসাইটে ব্রাউজ করছেন এমন অ্যাক্টিভ ভিজিটরদের লাইভ পর্যবেক্ষণ (গত {data.timeoutWindowSeconds} সেকেন্ডের হার্টবিট)
                    </p>
                </div>

                {/* Header Controls */}
                <div className="flex items-center gap-2.5">
                    {/* Connection indicator */}
                    <div
                        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                            connectionStatus === 'connected'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                        title={connectionStatus === 'connected' ? 'Connected to live presence server' : 'Connection issue'}
                    >
                        {connectionStatus === 'connected' ? (
                            <WifiIcon size={14} className="text-emerald-600" />
                        ) : (
                            <WifiOffIcon size={14} className="text-rose-600" />
                        )}
                        <span>{connectionStatus === 'connected' ? 'Live Connected' : 'Reconnecting...'}</span>
                    </div>

                    {/* Auto Refresh Toggle */}
                    <button
                        type="button"
                        onClick={toggleAutoRefresh}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                            isAutoRefreshActive
                                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        }`}
                        title={isAutoRefreshActive ? 'Pause Auto Refresh' : 'Resume Auto Refresh'}
                    >
                        {isAutoRefreshActive ? (
                            <>
                                <PauseIcon size={14} />
                                <span>অটো ({countdown}s)</span>
                            </>
                        ) : (
                            <>
                                <PlayIcon size={14} />
                                <span>চালু করুন</span>
                            </>
                        )}
                    </button>

                    {/* Manual Refresh Button */}
                    <button
                        type="button"
                        onClick={() => fetchLiveData(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCwIcon size={14} className={refreshing ? 'animate-spin' : ''} />
                        <span>রিফ্রেশ</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Live Active Visitors */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-15">
                        <RadioIcon size={80} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
                            Live Active Visitors
                        </span>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            {loading ? '...' : totalCount}
                        </span>
                        <span className="text-xs text-emerald-100 font-medium">জন ভিজিটর</span>
                    </div>
                    <div className="mt-2 text-[11px] text-emerald-100/90 flex items-center gap-1">
                        <ClockIcon size={12} />
                        <span>গত {data.timeoutWindowSeconds} সে.-এ হার্টবিট সক্রিয়</span>
                    </div>
                </div>

                {/* 2. Mobile Visitors */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Mobile Users
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <SmartphoneIcon size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {mobileCount}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">({mobilePct}%)</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${mobilePct}%` }}
                        ></div>
                    </div>
                </div>

                {/* 3. Desktop Visitors */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Desktop Users
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <MonitorIcon size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {desktopCount}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">({desktopPct}%)</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${desktopPct}%` }}
                        ></div>
                    </div>
                </div>

                {/* 4. Active Pages / Avg Duration */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Active Pages
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <CompassIcon size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {data.topPages?.length || 0}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">টি পেজ ব্রাউজ হচ্ছে</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                        <TrendingUpIcon size={12} className="text-violet-500" />
                        <span>গড় সময়কাল: {formatDuration(data.avgDurationSeconds)}</span>
                    </div>
                </div>
            </div>

            {/* Breakdown Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Active Pages */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <GlobeIcon size={18} className="text-slate-600" />
                            <h3 className="text-sm font-bold text-slate-800">বর্তমানে দেখা হচ্ছে এমন পেজসমূহ</h3>
                        </div>
                        <span className="text-xs text-slate-400">রিয়েল-টাইম ভিউয়ার্স</span>
                    </div>

                    {data.topPages && data.topPages.length > 0 ? (
                        <div className="space-y-3">
                            {data.topPages.slice(0, 6).map((item, idx) => {
                                const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 truncate max-w-[80%]">
                                                <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-mono text-slate-700 truncate font-medium">
                                                    {item.page}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                <span>{item.count} জন</span>
                                                <span className="text-slate-400 font-normal">({pct}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.max(pct, 5)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                            <ActivityIcon size={24} className="opacity-40 animate-pulse" />
                            <span>বর্তমানে কোনো পেজে লাইভ ভিজিটর নেই</span>
                        </div>
                    )}
                </div>

                {/* Device & Browser Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <SmartphoneIcon size={18} className="text-slate-600" />
                            <h3 className="text-sm font-bold text-slate-800">ডিভাইস ও ব্রাউজার বিশ্লেষণ</h3>
                        </div>

                        {/* Device Type Summary */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <SmartphoneIcon size={15} className="text-blue-500" />
                                    <span className="text-slate-700 font-medium">মোবাইল (Mobile)</span>
                                </div>
                                <span className="font-bold text-slate-900">{mobileCount} ({mobilePct}%)</span>
                            </div>

                            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <MonitorIcon size={15} className="text-indigo-500" />
                                    <span className="text-slate-700 font-medium">কম্পিউটার (Desktop)</span>
                                </div>
                                <span className="font-bold text-slate-900">{desktopCount} ({desktopPct}%)</span>
                            </div>

                            {tabletCount > 0 && (
                                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <TabletIcon size={15} className="text-emerald-500" />
                                        <span className="text-slate-700 font-medium">ট্যাবলেট (Tablet)</span>
                                    </div>
                                    <span className="font-bold text-slate-900">{tabletCount}</span>
                                </div>
                            )}
                        </div>

                        {/* Top Browsers */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                শীর্ষ ব্রাউজার
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(data.browserBreakdown || {}).length > 0 ? (
                                    Object.entries(data.browserBreakdown).map(([bName, bCount], idx) => (
                                        <span
                                            key={idx}
                                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                                        >
                                            {bName}: <b>{bCount}</b>
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-400">কোনো ব্রাউজার ডেটা নেই</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Privacy Guarantee Note */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/70 p-2 rounded-lg">
                        <ShieldCheckIcon size={14} className="shrink-0 text-emerald-600" />
                        <span>১০০% এননিমাস ট্র্যাকিং — কোনো ব্যক্তিগত তথ্য বা পাসওয়ার্ড সংগৃহীত হয় না</span>
                    </div>
                </div>
            </div>

            {/* Live Active Visitors Table Section */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                {/* Table Controls / Filter */}
                <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <UsersIcon size={18} className="text-slate-700" />
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                            সক্রিয় ভিজিটর সেশন তালিকা ({filteredVisitors.length})
                        </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {/* Search Bar */}
                        <div className="relative">
                            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="পেজ বা ডিভাইস খুঁজুন..."
                                className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>

                        {/* Device Filter */}
                        <select
                            value={filterDevice}
                            onChange={(e) => setFilterDevice(e.target.value)}
                            aria-label="ফিল্টার ডিভাইস"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="ALL">সব ডিভাইস</option>
                            <option value="Mobile">মোবাইল</option>
                            <option value="Desktop">ডেস্কটপ</option>
                            <option value="Tablet">ট্যাবলেট</option>
                        </select>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="py-3 px-4">ভিজিটর</th>
                                <th className="py-3 px-4">বর্তমান পেজ</th>
                                <th className="py-3 px-4">ডিভাইস ও ব্রাউজার</th>
                                <th className="py-3 px-4">রেফারার</th>
                                <th className="py-3 px-4">সময়কাল</th>
                                <th className="py-3 px-4">সর্বশেষ হার্টবিট</th>
                                <th className="py-3 px-4 text-right">স্ট্যাটাস</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredVisitors.length > 0 ? (
                                filteredVisitors.map((visitor, idx) => (
                                    <tr key={visitor.sessionId || idx} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Visitor ID */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] border border-emerald-100">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{visitor.displayId}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">
                                                        {visitor.sessionId.slice(0, 14)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Current Page */}
                                        <td className="py-3 px-4 max-w-xs">
                                            <a
                                                href={visitor.page}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 font-mono text-emerald-600 hover:text-emerald-700 hover:underline max-w-full truncate"
                                                title={`ভিজিট পেজ: ${visitor.page}`}
                                            >
                                                <span className="truncate">{visitor.page}</span>
                                                <ExternalLinkIcon size={11} className="shrink-0 opacity-60" />
                                            </a>
                                        </td>

                                        {/* Device & Browser */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                                {visitor.deviceType === 'Mobile' ? (
                                                    <SmartphoneIcon size={14} className="text-blue-500 shrink-0" />
                                                ) : visitor.deviceType === 'Tablet' ? (
                                                    <TabletIcon size={14} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                    <MonitorIcon size={14} className="text-indigo-500 shrink-0" />
                                                )}
                                                <span className="font-medium text-slate-700">
                                                    {visitor.deviceType} • {visitor.browser} ({visitor.os})
                                                </span>
                                            </div>
                                        </td>

                                        {/* Referrer */}
                                        <td className="py-3 px-4 text-slate-600">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium">
                                                {visitor.referrer || 'Direct'}
                                            </span>
                                        </td>

                                        {/* Session Duration */}
                                        <td className="py-3 px-4 text-slate-600 font-medium">
                                            {formatDuration(visitor.durationSeconds)}
                                        </td>

                                        {/* Last Seen Heartbeat */}
                                        <td className="py-3 px-4 text-slate-600">
                                            <span className="inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <span>{formatSecondsAgo(visitor.secondsAgo)}</span>
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-4 text-right">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                <span>Active</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RadioIcon size={32} className="opacity-30 text-emerald-600 animate-pulse" />
                                            <p className="text-sm font-semibold text-slate-600">
                                                {searchQuery || filterDevice !== 'ALL'
                                                    ? 'সার্চের ফলাফলে কোনো ভিজিটর পাওয়া যায়নি'
                                                    : 'বর্তমানে কোনো লাইভ ভিজিটর নেই'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                রিয়েল-টাইম ট্র্যাকিং সক্রিয় রয়েছে — কোনো ভিজিটর ওয়েবসাইট ভিজিট করলে এখানে দেখতে পাবেন
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
