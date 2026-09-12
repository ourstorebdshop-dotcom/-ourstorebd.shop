'use client'

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import {
    Activity,
    Radar,
    Target,
    BarChart3,
    Layers,
    Code2,
    Shield,
    Sliders,
    Bug,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Copy,
    Save,
    RefreshCw,
    Play,
    Trash2,
    ExternalLink,
    HelpCircle,
    Sparkles,
    Check,
    Radio,
    FileJson,
    ArrowUpRight,
    Search,
    ShoppingBag,
    CreditCard,
    DollarSign,
    Zap,
    Lock
} from 'lucide-react'
import {
    updateMetaTracking,
    updateGoogleAdsTracking,
    updateGa4Tracking,
    updateGtmTracking,
    updateCustomScripts,
    updateEventToggles,
    updateConsentSettings,
    updateDebugSettings,
    clearTrackingLogs,
    resetTrackingSettings,
    logTrackingEvent,
} from '@/lib/features/tracking/trackingSlice'
import { trackEvent, trackPurchase, trackAddToCart, trackPageView } from '@/lib/tracking/clientTracker'

export default function AdminTrackingPage() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()
    const tracking = useSelector(state => state.tracking) || {}

    // Active tab: 'dashboard' | 'meta' | 'google_ads' | 'ga4' | 'gtm' | 'events' | 'consent' | 'debug'
    const [activeTab, setActiveTab] = useState('dashboard')

    // Local form states
    const [metaForm, setMetaForm] = useState({
        enabled: false,
        pixelId: '',
        pixelId2: '',
        capiEnabled: false,
        accessToken: '',
        testEventCode: '',
        trackPurchases: true,
        trackAddToCart: true,
        trackInitiateCheckout: true,
        trackViewContent: true,
        trackSearch: true,
        trackLead: true,
        trackContact: true,
    })
    const [showMetaToken, setShowMetaToken] = useState(false)
    const [isTestingCapi, setIsTestingCapi] = useState(false)
    const [capiTestResult, setCapiTestResult] = useState(null)

    const [googleAdsForm, setGoogleAdsForm] = useState({
        enabled: false,
        conversionId: '',
        purchaseLabel: '',
        addToCartLabel: '',
        beginCheckoutLabel: '',
        enhancedConversions: true,
        trackPurchases: true,
        trackAddToCart: true,
        trackBeginCheckout: true,
    })

    const [ga4Form, setGa4Form] = useState({
        enabled: false,
        measurementId: '',
        ecommerceEnabled: true,
        trackPageView: true,
        trackScroll: true,
        trackUserEngagement: true,
    })

    const [gtmForm, setGtmForm] = useState({
        enabled: false,
        containerId: '',
    })

    const [customScriptsForm, setCustomScriptsForm] = useState({
        enabled: false,
        headScript: '',
        bodyTopScript: '',
        bodyBottomScript: '',
    })

    const [eventsConfigForm, setEventsConfigForm] = useState({
        pageView: true,
        viewContent: true,
        search: true,
        addToCart: true,
        removeFromCart: true,
        viewCart: true,
        initiateCheckout: true,
        addPaymentInfo: true,
        addShippingInfo: true,
        purchase: true,
        lead: true,
        signUp: true,
        login: true,
        contact: true,
        wishlist: true,
        refund: true,
    })

    const [consentForm, setConsentForm] = useState({
        enabled: false,
        mode: 'banner',
        defaultGranted: false,
        bannerHeading: 'কুকিজ ও প্রাইভেসি সম্মতি',
        bannerText: 'আপনার কেনাকাটার অভিজ্ঞতা সেরা করতে এবং অফার প্রদর্শন করতে আমরা কুকিজ ও নিরাপদ ট্র্যাকিং ব্যবহার করি।',
        acceptBtnText: 'সম্মত আছি',
        declineBtnText: 'প্রত্যাখ্যান করুন',
    })

    const [debugForm, setDebugForm] = useState({
        debugMode: false,
        testEventMode: false,
    })

    // Selected payload for JSON modal viewer
    const [viewingLog, setViewingLog] = useState(null)
    const [logFilter, setLogFilter] = useState('ALL')
    const [logSearch, setLogSearch] = useState('')

    // Sync from Redux on mount & tracking updates
    useEffect(() => {
        if (tracking.meta) setMetaForm({ ...tracking.meta })
        if (tracking.googleAds) setGoogleAdsForm({ ...tracking.googleAds })
        if (tracking.ga4) setGa4Form({ ...tracking.ga4 })
        if (tracking.gtm) setGtmForm({ ...tracking.gtm })
        if (tracking.customScripts) setCustomScriptsForm({ ...tracking.customScripts })
        if (tracking.eventsConfig) setEventsConfigForm({ ...tracking.eventsConfig })
        if (tracking.consent) setConsentForm({ ...tracking.consent })
        if (tracking.debug) setDebugForm({ ...tracking.debug })
    }, [tracking._hydrated])

    // Save Handlers
    const handleSaveMeta = (e) => {
        e?.preventDefault()
        dispatch(updateMetaTracking(metaForm))
        toast.success('Meta Pixel & CAPI সেটিংস সংরক্ষিত হয়েছে!')
    }

    const handleSaveGoogleAds = (e) => {
        e?.preventDefault()
        dispatch(updateGoogleAdsTracking(googleAdsForm))
        toast.success('Google Ads Conversion সেটিংস সংরক্ষিত হয়েছে!')
    }

    const handleSaveGa4 = (e) => {
        e?.preventDefault()
        dispatch(updateGa4Tracking(ga4Form))
        toast.success('Google Analytics 4 (GA4) সেটিংস সংরক্ষিত হয়েছে!')
    }

    const handleSaveGtm = (e) => {
        e?.preventDefault()
        dispatch(updateGtmTracking(gtmForm))
        dispatch(updateCustomScripts(customScriptsForm))
        toast.success('Google Tag Manager ও কাস্টম স্ক্রিপ্ট সেটিংস সংরক্ষিত হয়েছে!')
    }

    const handleSaveEvents = (e) => {
        e?.preventDefault()
        dispatch(updateEventToggles(eventsConfigForm))
        toast.success('ইভেন্ট ট্র্যাকিং কনফিগারেশন আপডেট হয়েছে!')
    }

    const handleSaveConsent = (e) => {
        e?.preventDefault()
        dispatch(updateConsentSettings(consentForm))
        toast.success('কুকি ও প্রাইভেসি কনসেন্ট সেটিংস সংরক্ষিত হয়েছে!')
    }

    const handleSaveDebug = (e) => {
        e?.preventDefault()
        dispatch(updateDebugSettings(debugForm))
        toast.success('ডিবাগ ও টেস্ট মোড সেটিংস আপডেট হয়েছে!')
    }

    // Direct CAPI Connection Test
    const handleTestCapiConnection = async () => {
        if (!metaForm.pixelId.trim() || !metaForm.accessToken.trim()) {
            toast.error('পরীক্ষা করার জন্য Pixel ID এবং Access Token প্রয়োজন!')
            return
        }

        setIsTestingCapi(true)
        setCapiTestResult(null)

        try {
            const res = await fetch('/api/tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'TEST_CONNECTION',
                    pixelId: metaForm.pixelId.trim(),
                    accessToken: metaForm.accessToken.trim(),
                    testEventCode: metaForm.testEventCode?.trim() || 'TEST_GOCART',
                }),
            })
            const data = await res.json()
            setCapiTestResult(data)

            if (data.success) {
                toast.success('Meta Conversions API সফলভাবে যুক্ত হয়েছে! ✅')
            } else {
                toast.error(data.error || 'Meta CAPI সংযোগ ব্যর্থ হয়েছে!')
            }
        } catch (err) {
            setCapiTestResult({ success: false, error: err.message })
            toast.error('টেস্ট রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে')
        } finally {
            setIsTestingCapi(false)
        }
    }

    // Interactive Test Simulator (fires real events for testing)
    const handleFireTestPurchase = () => {
        const dummyOrder = {
            id: `test_${Date.now().toString().slice(-6)}`,
            total: 2450,
            shippingCost: 70,
            coupon: { code: 'PROMO10' },
            orderItems: [
                { productId: 'prod_test_1', name: 'Smart Watch Series 9', price: 2450, quantity: 1 }
            ],
            user: { name: 'Rahim Ahmed', email: 'rahim.test@example.com', phone: '01712345678' },
            address: { name: 'Rahim Ahmed', phone: '01712345678', city: 'Dhaka' },
        }

        const eventId = trackPurchase(dummyOrder)
        toast.success(`টেস্ট Purchase ইভেন্ট ফায়ার করা হয়েছে! (Event ID: ${eventId || 'skipped'})`)
    }

    const handleFireTestAddToCart = () => {
        trackAddToCart({
            id: 'prod_test_demo',
            name: 'Wireless ANC Headphones Pro',
            price: 3200,
            category: 'Audio',
        }, 1)
        toast.success('টেস্ট AddToCart ইভেন্ট সফলভাবে ফায়ার করা হয়েছে!')
    }

    const handleFireTestPageView = () => {
        trackPageView(window.location.href)
        toast.success('টেস্ট PageView ইভেন্ট সফলভাবে ফায়ার করা হয়েছে!')
    }

    // Copy helper
    const copyToClipboard = (text, label) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
            toast.success(`${label} কপি করা হয়েছে!`)
        }
    }

    // Recent logs
    const rawLogs = tracking.logs || []
    const filteredLogs = rawLogs.filter(log => {
        if (logFilter !== 'ALL') {
            if (logFilter === 'PURCHASE' && log.eventName !== 'Purchase') return false
            if (logFilter === 'CAPI' && log.source !== 'SERVER_CAPI') return false
            if (logFilter === 'BROWSER' && log.source !== 'BROWSER') return false
            if (logFilter === 'FAILED' && log.status !== 'FAILED') return false
        }
        if (logSearch.trim()) {
            const q = logSearch.toLowerCase()
            const matchEvent = log.eventName?.toLowerCase().includes(q)
            const matchId = log.eventId?.toLowerCase().includes(q)
            const matchOrder = log.orderId?.toLowerCase().includes(q)
            return matchEvent || matchId || matchOrder
        }
        return true
    })

    const stats = tracking.stats || {}

    // Tabs configuration
    const tabs = [
        { id: 'dashboard', label: 'লাইভ ড্যাশবোর্ড', icon: Activity, count: rawLogs.length },
        { id: 'meta', label: 'Meta Pixel & CAPI', icon: Target, isConfigured: Boolean(metaForm.enabled && metaForm.pixelId) },
        { id: 'google_ads', label: 'Google Ads', icon: BarChart3, isConfigured: Boolean(googleAdsForm.enabled && googleAdsForm.conversionId) },
        { id: 'ga4', label: 'Google Analytics 4', icon: Layers, isConfigured: Boolean(ga4Form.enabled && ga4Form.measurementId) },
        { id: 'gtm', label: 'GTM & Custom Tags', icon: Code2, isConfigured: Boolean(gtmForm.enabled && gtmForm.containerId) },
        { id: 'events', label: 'ইভেন্ট কন্ট্রোল (17)', icon: Sliders },
        { id: 'consent', label: 'কুকি ও প্রাইভেসি', icon: Shield },
        { id: 'debug', label: 'ডিবাগ ও টেস্ট মোড', icon: Bug },
    ]

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* ── Page Header ────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                            <Radar size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                    Advertising & Tracking Management
                                </h1>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    A–Z Complete
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                ওয়েবসাইট কোড পরিবর্তন ছাড়াই Admin Panel থেকে Meta Ads, CAPI, Google Ads, GA4 ও GTM সম্পূর্ণ পরিচালনা করুন।
                            </p>
                        </div>
                    </div>

                    {/* Header Quick Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('debug')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95 cursor-pointer"
                        >
                            <Play size={14} className="text-emerald-600" />
                            <span>টেস্ট ইভেন্ট ফায়ার করুন</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                dispatch(resetTrackingSettings())
                                toast.success('ট্র্যাকিং সেটিংস ডিফল্ট মানে রিসেট করা হয়েছে')
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                            title="ডিফল্টে রিসেট করুন"
                        >
                            <RefreshCw size={14} />
                            <span>রিসেট</span>
                        </button>
                    </div>
                </div>

                {/* ── Tabs Navigation Bar ──────────────────────────────────────── */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                                {tab.isConfigured !== undefined && (
                                    <span className={`w-2 h-2 rounded-full ${tab.isConfigured ? (isActive ? 'bg-white' : 'bg-emerald-500') : 'bg-slate-300'}`} />
                                )}
                                {tab.count !== undefined && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    TAB 1: LIVE DASHBOARD & EVENT STREAM
                ───────────────────────────────────────────────────────────── */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Status Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            {/* Meta Pixel */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">Meta Pixel</span>
                                    <span className={`w-2.5 h-2.5 rounded-full ${metaForm.enabled && metaForm.pixelId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                </div>
                                <div className="mt-3">
                                    <p className="text-sm font-bold text-slate-900">
                                        {metaForm.enabled ? (metaForm.pixelId ? 'Active' : 'Missing ID') : 'Disabled'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {metaForm.pixelId ? `ID: ${metaForm.pixelId}` : 'নট কনফিগারড'}
                                    </p>
                                </div>
                            </div>

                            {/* Meta CAPI */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">Meta CAPI</span>
                                    <span className={`w-2.5 h-2.5 rounded-full ${metaForm.capiEnabled && metaForm.accessToken ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                </div>
                                <div className="mt-3">
                                    <p className="text-sm font-bold text-slate-900">
                                        {metaForm.capiEnabled ? (metaForm.accessToken ? 'Server Active' : 'No Token') : 'Disabled'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {metaForm.capiEnabled ? 'Server-to-Server' : 'অফলাইন'}
                                    </p>
                                </div>
                            </div>

                            {/* Google Ads */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">Google Ads</span>
                                    <span className={`w-2.5 h-2.5 rounded-full ${googleAdsForm.enabled && googleAdsForm.conversionId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                </div>
                                <div className="mt-3">
                                    <p className="text-sm font-bold text-slate-900">
                                        {googleAdsForm.enabled ? (googleAdsForm.conversionId ? 'Active' : 'Missing ID') : 'Disabled'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {googleAdsForm.conversionId || 'কনফিগারেশন বাকি'}
                                    </p>
                                </div>
                            </div>

                            {/* GA4 */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">Google Analytics 4</span>
                                    <span className={`w-2.5 h-2.5 rounded-full ${ga4Form.enabled && ga4Form.measurementId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                </div>
                                <div className="mt-3">
                                    <p className="text-sm font-bold text-slate-900">
                                        {ga4Form.enabled ? (ga4Form.measurementId ? 'Active' : 'Missing ID') : 'Disabled'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {ga4Form.measurementId || 'নট কনফিগারড'}
                                    </p>
                                </div>
                            </div>

                            {/* GTM */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">Google Tag Mgr</span>
                                    <span className={`w-2.5 h-2.5 rounded-full ${gtmForm.enabled && gtmForm.containerId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                </div>
                                <div className="mt-3">
                                    <p className="text-sm font-bold text-slate-900">
                                        {gtmForm.enabled ? (gtmForm.containerId ? 'Active' : 'Missing ID') : 'Disabled'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {gtmForm.containerId || 'নট কনফিগারড'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* KPI Stats Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-slate-500">Total Tracked Events</p>
                                    <Activity size={18} className="text-blue-500" />
                                </div>
                                <p className="text-2xl font-black text-slate-900 mt-2">
                                    {(stats.totalEvents || 0).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">সব প্ল্যাটফর্ম মিলিয়ে মোট ইভেন্ট</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-slate-500">Purchase Conversions</p>
                                    <ShoppingBag size={18} className="text-emerald-500" />
                                </div>
                                <p className="text-2xl font-black text-emerald-600 mt-2">
                                    {(stats.purchases || 0).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">সফল ও নির্ভুল পারচেজ ইভেন্ট</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-slate-500">Total Conversion Value</p>
                                    <DollarSign size={18} className="text-teal-500" />
                                </div>
                                <p className="text-2xl font-black text-slate-900 mt-2">
                                    {currency}{(stats.totalValue || 0).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">অ্যাট্রিবিউটেড বিক্রয় ভ্যালু</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-slate-500">Last Event Recorded</p>
                                    <Zap size={18} className="text-amber-500" />
                                </div>
                                <p className="text-sm font-bold text-slate-800 mt-2">
                                    {stats.lastEventAt ? new Date(stats.lastEventAt).toLocaleTimeString() : 'অপেক্ষমান'}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {stats.lastEventAt ? new Date(stats.lastEventAt).toLocaleDateString() : 'কোনো ইভেন্ট এখনো রেকর্ড হয়নি'}
                                </p>
                            </div>
                        </div>

                        {/* Event Stream & Audit Log */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        <Radio size={18} className="text-emerald-600 animate-pulse" />
                                        <span>লাইভ ইভেন্ট অ্যাক্টিভিটি স্ট্রিম</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        ব্রাউজার ও সার্ভার থেকে রিয়েল-টাইমে পাঠানো সমস্ত ট্র্যাকিং ইভেন্টের বিবরণ।
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={logSearch}
                                            onChange={(e) => setLogSearch(e.target.value)}
                                            placeholder="ইভেন্ট বা অর্ডার সার্চ..."
                                            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 w-36 sm:w-48"
                                        />
                                    </div>

                                    {/* Filter */}
                                    <select
                                        value={logFilter}
                                        onChange={(e) => setLogFilter(e.target.value)}
                                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none text-slate-600"
                                    >
                                        <option value="ALL">সকল ইভেন্ট</option>
                                        <option value="PURCHASE">শুধু Purchase</option>
                                        <option value="CAPI">Server CAPI</option>
                                        <option value="BROWSER">Browser Pixel</option>
                                        <option value="FAILED">ব্যর্থ ইভেন্ট</option>
                                    </select>

                                    {/* Clear Logs */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch(clearTrackingLogs())
                                            toast.success('লগ সাফ করা হয়েছে')
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition hover:bg-slate-50"
                                        title="লগ ক্লিয়ার করুন"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Logs Table */}
                            {filteredLogs.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                                <th className="py-3 px-4">টাইমস্ট্যাম্প</th>
                                                <th className="py-3 px-4">ইভেন্টের নাম</th>
                                                <th className="py-3 px-4">প্ল্যাটফর্মসমূহ</th>
                                                <th className="py-3 px-4">সোর্স</th>
                                                <th className="py-3 px-4">অর্ডার / ভ্যালু</th>
                                                <th className="py-3 px-4">স্ট্যাটাস</th>
                                                <th className="py-3 px-4 text-right">ডিটেইলস</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                                                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${log.eventName === 'Purchase' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                        <span>{log.eventName}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                            {log.platforms.map((p, idx) => (
                                                                <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                                                                    {p}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${log.source === 'SERVER_CAPI' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                                            {log.source === 'SERVER_CAPI' ? 'CAPI (Server)' : 'Browser'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {log.value > 0 ? (
                                                            <span className="font-semibold text-slate-900">
                                                                {currency}{log.value.toLocaleString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                        {log.orderId && (
                                                            <span className="block text-[10px] text-slate-400 font-mono">
                                                                #{log.orderId}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                            log.status === 'SUCCESS' 
                                                                ? 'bg-emerald-50 text-emerald-700' 
                                                                : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {log.status === 'SUCCESS' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                                                            <span>{log.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingLog(log)}
                                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline inline-flex items-center gap-1"
                                                        >
                                                            <FileJson size={13} />
                                                            <span>পেলোড</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <Activity size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                                    <p className="text-sm font-medium">কোনো ট্র্যাকিং লগ পাওয়া যায়নি</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        উপরের &quot;টেস্ট ইভেন্ট ফায়ার করুন&quot; বাটনে ক্লিক করে ইভেন্ট টেস্ট করতে পারেন।
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    TAB 2: META PIXEL & CONVERSIONS API (CAPI)
                ───────────────────────────────────────────────────────────── */}
                {activeTab === 'meta' && (
                    <form onSubmit={handleSaveMeta} className="space-y-6 animate-in fade-in duration-200">
                        {/* Meta Pixel Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        <Target size={20} className="text-blue-600" />
                                        <span>Meta Pixel (Facebook Pixel)</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        ব্রাউজার-সাইড ট্র্যাকিংয়ের জন্য Meta Pixel ID যুক্ত করুন।
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={metaForm.enabled}
                                        onChange={(e) => setMetaForm({ ...metaForm, enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Primary Pixel ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={metaForm.pixelId}
                                        onChange={(e) => setMetaForm({ ...metaForm, pixelId: e.target.value })}
                                        placeholder="e.g. 1234567890123456"
                                        className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Meta Events Manager-এর Data Sources সেকশন থেকে আপনার Pixel ID কপি করুন।
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Secondary Pixel ID (ঐচ্ছিক — Multiple Pixel Support)
                                    </label>
                                    <input
                                        type="text"
                                        value={metaForm.pixelId2}
                                        onChange={(e) => setMetaForm({ ...metaForm, pixelId2: e.target.value })}
                                        placeholder="e.g. 9876543210987654"
                                        className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        একাধিক এড একাউন্ট বা ব্যাকআপ পিক্সেল ব্যবহারের জন্য দ্বিতীয় পিক্সেল আইডি দিন।
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Meta CAPI Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                            <Shield size={20} className="text-emerald-600" />
                                            <span>Meta Conversions API (CAPI)</span>
                                        </h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                            Server-Side
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        অ্যাডব্লকার ও iOS রেস্ট্রিকশন বাইপাস করে 100% নির্ভুল সার্ভার-সাইড ট্র্যাকিং।
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={metaForm.capiEnabled}
                                        onChange={(e) => setMetaForm({ ...metaForm, capiEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-700">
                                            Conversions API Access Token <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                                            <Lock size={12} />
                                            <span>Server-side encrypted</span>
                                        </span>
                                    </div>
                                    <div className="relative mt-1.5">
                                        <input
                                            type={showMetaToken ? 'text' : 'password'}
                                            value={metaForm.accessToken}
                                            onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                                            placeholder="EAAB..."
                                            className="w-full px-3.5 py-2.5 pr-20 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowMetaToken(!showMetaToken)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                                                title={showMetaToken ? 'টোকেন লুকান' : 'টোকেন দেখুন'}
                                            >
                                                {showMetaToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(metaForm.accessToken, 'Access Token')}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                                                title="কপি করুন"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Meta Events Manager &gt; Settings &gt; Conversions API &gt; &quot;Generate access token&quot; থেকে জেনারেট করুন।
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700">
                                            Test Event Code (ঐচ্ছিক — Meta Events Manager টেস্টিং)
                                        </label>
                                        <input
                                            type="text"
                                            value={metaForm.testEventCode}
                                            onChange={(e) => setMetaForm({ ...metaForm, testEventCode: e.target.value })}
                                            placeholder="e.g. TEST12345"
                                            className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Events Manager &gt; Test Events ট্যাবে দেওয়া কোডটি প্রবেশ করালে টেস্ট লাইভ দেখা যাবে।
                                        </p>
                                    </div>

                                    <div className="flex flex-col justify-end">
                                        <button
                                            type="button"
                                            onClick={handleTestCapiConnection}
                                            disabled={isTestingCapi}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                                        >
                                            {isTestingCapi ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                                            <span>{isTestingCapi ? 'টেস্ট রিকোয়েস্ট পাঠানো হচ্ছে...' : 'Test CAPI Connection'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* CAPI Connection Result Alert */}
                                {capiTestResult && (
                                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                                        capiTestResult.success 
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                            : 'bg-rose-50 border-rose-200 text-rose-800'
                                    }`}>
                                        <div className="flex items-center gap-2 font-bold">
                                            {capiTestResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                            <span>{capiTestResult.message || (capiTestResult.success ? 'Success' : 'Failed')}</span>
                                        </div>
                                        {capiTestResult.metaResponse?.data && (
                                            <pre className="mt-2 p-2.5 bg-white/70 rounded-xl overflow-x-auto font-mono text-[11px]">
                                                {JSON.stringify(capiTestResult.metaResponse.data, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Deduplication Guarantee Alert */}
                        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                            <Shield className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                            <div className="text-xs text-emerald-900 leading-relaxed">
                                <p className="font-bold">100% Deduplication Guarantee Active:</p>
                                <p className="mt-0.5 text-emerald-800">
                                    প্রতিটি ইভেন্টে ব্রাউজার পিক্সেল ও সার্ভার CAPI একই ইউনিক <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">event_id</code> শেয়ার করে। এর ফলে Meta স্বয়ংক্রিয়ভাবে ডুপ্লিকেট বাদ দেয় এবং সর্বোচ্চ অ্যাট্রিবিউশন স্কোর নিশ্চিত করে।
                                </p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                            >
                                <Save size={16} />
                                <span>Meta সেটিংস সংরক্ষণ করুন</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    TAB 3: GOOGLE ADS CONVERSION TRACKING
                ───────────────────────────────────────────────────────────── */}
                {activeTab === 'google_ads' && (
                    <form onSubmit={handleSaveGoogleAds} className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        <BarChart3 size={20} className="text-rose-600" />
                                        <span>Google Ads Conversion Tracking</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Google Ads থেকে আসা সেলস ও কনভার্সন সঠিক মূল্যে ট্র্যাক করুন।
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={googleAdsForm.enabled}
                                        onChange={(e) => setGoogleAdsForm({ ...googleAdsForm, enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Google Ads Conversion ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={googleAdsForm.conversionId}
                                        onChange={(e) => setGoogleAdsForm({ ...googleAdsForm, conversionId: e.target.value })}
                                        placeholder="e.g. AW-1234567890"
                                        className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Google Ads একাউন্টের Tools &amp; Settings &gt; Conversions থেকে পাওয়া Conversion ID (AW-...).
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Purchase Conversion Label <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={googleAdsForm.purchaseLabel}
                                        onChange={(e) => setGoogleAdsForm({ ...googleAdsForm, purchaseLabel: e.target.value })}
                                        placeholder="e.g. AbC-dEfGhIjKlMnOp"
                                        className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        সফল অর্ডারের সময় এই লেবেল অনুযায়ী কনভার্সন রেকর্ড হবে।
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Add to Cart Conversion Label (ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={googleAdsForm.addToCartLabel}
                                        onChange={(e) => setGoogleAdsForm({ ...googleAdsForm, addToCartLabel: e.target.value })}
                                        placeholder="e.g. XyZ-123AbC456"
                                        className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Begin Checkout Conversion Label (ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="text"
                                        value={googleAdsForm.beginCheckoutLabel}
                                        onChange={(e) => setGoogleAdsForm({ ...googleAdsForm, beginCheckoutLabel: e.target.value })}
                                        placeholder="e.g. QwE-789RtY012"
                                        className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Enhanced Conversions</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            গ্রাহকের ইমেইল ও ফোন হ্যাশ করে পাঠিয়ে কনভার্সন রেট বৃদ্ধি করুন।
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={googleAdsForm.enhancedConversions}
                                            onChange={(e) => setGoogleAdsForm({ ...googleAdsForm, enhancedConversions: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                            >
                                <Save size={16} />
                                <span>Google Ads সেটিংস সংরক্ষণ করুন</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    TAB 4: GOOGLE ANALYTICS 4 (GA4)
                ───────────────────────────────────────────────────────────── */}
                {activeTab === 'ga4' && (
                    <form onSubmit={handleSaveGa4} className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        <Layers size={20} className="text-amber-500" />
                                        <span>Google Analytics 4 (GA4)</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        ওয়েবসাইটের ভিজিটর বিহেভিয়ার এবং ফুল ফানেল ই-কমার্স ট্র্যাকিং।
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={ga4Form.enabled}
                                        onChange={(e) => setGa4Form({ ...ga4Form, enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        GA4 Measurement ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={ga4Form.measurementId}
                                        onChange={(e) => setGa4Form({ ...ga4Form, measurementId: e.target.value })}
                                        placeholder="e.g. G-XXXXXXXXXX"
                                        className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Google Analytics &gt; Admin &gt; Data Streams &gt; Web Stream থেকে Measurement ID দিন।
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">E-commerce Tracking</p>
                                            <p className="text-[10px] text-slate-400">Cart, Checkout, Purchase</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={ga4Form.ecommerceEnabled}
                                            onChange={(e) => setGa4Form({ ...ga4Form, ecommerceEnabled: e.target.checked })}
                                            className="accent-emerald-600 size-4"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Page Views</p>
                                            <p className="text-[10px] text-slate-400">Automatic route track</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={ga4Form.trackPageView}
                                            onChange={(e) => setGa4Form({ ...ga4Form, trackPageView: e.target.checked })}
                                            className="accent-emerald-600 size-4"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Scroll & Engagement</p>
                                            <p className="text-[10px] text-slate-400">User behavior tracking</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={ga4Form.trackScroll}
                                            onChange={(e) => setGa4Form({ ...ga4Form, trackScroll: e.target.checked })}
                                            className="accent-emerald-600 size-4"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                            >
                                <Save size={16} />
                                <span>GA4 সেটিংস সংরক্ষণ করুন</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    TAB 5: GTM & CUSTOM SCRIPTS
                ───────────────────────────────────────────────────────────── */}
                {activeTab === 'gtm' && (
                    <form onSubmit={handleSaveGtm} className="space-y-6 animate-in fade-in duration-200">
                        {/* GTM Container */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        <Code2 size={20} className="text-blue-600" />
                                        <span>Google Tag Manager (GTM)</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        GTM Container-এর মাধ্যমে যেকোনো কাস্টম ট্যাগ সহজে লোড করুন।
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={gtmForm.enabled}
                                        onChange={(e) => setGtmForm({ ...gtmForm, enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                                </label>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700">
                                    GTM Container ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={gtmForm.containerId}
                                    onChange={(e) => setGtmForm({ ...gtmForm, containerId: e.target.value })}
                                    placeholder="e.g. GTM-XXXXXXX"
                                    className="w-full mt-1.5 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition font-mono"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Google Tag Manager একাউন্টের Container ID (GTM-...) দিন।
                                </p>
                            </div>
                        </div>

                        {/* Custom Scripts Sandbox */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        <Code2 size={20} className="text-indigo-600" />
                                        <span>কাস্টম স্ক্রিপ্ট ও ট্যাগ ইন্টিগ্রেশন (Safe Sandbox)</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        TikTok Pixel, Hotjar, Clarity বা অন্যান্য স্ক্রিপ্ট সরাসরি ওয়েবসাইটে যুক্ত করুন।
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={customScriptsForm.enabled}
                                        onChange={(e) => setCustomScriptsForm({ ...customScriptsForm, enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Header Script (&lt;head&gt; ট্যাগে ইনজেক্ট হবে)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={customScriptsForm.headScript}
                                        onChange={(e) => setCustomScriptsForm({ ...customScriptsForm, headScript: e.target.value })}
                                        placeholder="<!-- Custom <script> or meta tags here -->"
                                        className="w-full mt-1.5 p-3 text-xs bg-slate-900 text-emerald-400 font-mono rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Body Top Script (&lt;body&gt; এর শুরুতে)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={customScriptsForm.bodyTopScript}
                                        onChange={(e) => setCustomScriptsForm({ ...customScriptsForm, bodyTopScript: e.target.value })}
                                        placeholder="<!-- e.g. <noscript> tags or body tracking -->"
                                        className="w-full mt-1.5 p-3 text-xs bg-slate-900 text-emerald-400 font-mono rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Body Bottom / Footer Script (&lt;/body&gt; এর ঠিক আগে)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={customScriptsForm.bodyBottomScript}
                                        onChange={(e) => setCustomScriptsForm({ ...customScriptsForm, bodyBottomScript: e.target.value })}
                                        placeholder="<!-- e.g. Chat widgets, analytics tags -->"
                                        className="w-full mt-1.5 p-3 text-xs bg-slate-900 text-emerald-400 font-mono rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                            >
                                <Save size={16} />
                                <span>GTM ও স্ক্রিপ্ট সংরক্ষণ করুন</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    TAB 6: EVENTS CONFIGURATION (17 STANDARD EVENTS)
                ───────────────────────────────────────────────────────────── */}
                {activeTab === 'events' && (
                    <form onSubmit={handleSaveEvents} className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                    <Sliders size={20} className="text-emerald-600" />
                                    <span>Standard E-commerce Events Management</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    প্রয়োজন অনুযায়ী যেকোনো স্ট্যান্ডার্ড ইভেন্ট অন/অফ করুন। সংশ্লিষ্ট ডায়নামিক ডেটা স্বয়ংক্রিয়ভাবে পাঠানো হবে।
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { key: 'pageView', name: 'PageView', desc: 'প্রতিটি পেজ ভিজিটে স্বয়ংক্রিয়ভাবে ট্রিগার হয়' },
                                    { key: 'viewContent', name: 'ViewContent (view_item)', desc: 'প্রোডাক্ট ডিটেইলস পেজ ওপেন হলে' },
                                    { key: 'search', name: 'Search', desc: 'শপ পেজে সার্চ কুয়েরি চালালে' },
                                    { key: 'addToCart', name: 'AddToCart', desc: 'কার্টে পণ্য যোগ বা Order Now ক্লিক করলে' },
                                    { key: 'removeFromCart', name: 'RemoveFromCart', desc: 'কার্ট থেকে পণ্য ডিলিট করলে' },
                                    { key: 'viewCart', name: 'ViewCart', desc: 'কার্ট পেজ ভিজিট করলে' },
                                    { key: 'initiateCheckout', name: 'InitiateCheckout', desc: 'অর্ডার চেকআউট পেজ ওপেন করলে' },
                                    { key: 'addShippingInfo', name: 'AddShippingInfo', desc: 'ঢাকার ভিতরে/বাইরে নির্বাচন করলে' },
                                    { key: 'addPaymentInfo', name: 'AddPaymentInfo', desc: 'পেমেন্ট মেথড (COD, bKash) সিলেক্ট করলে' },
                                    { key: 'purchase', name: 'Purchase', desc: 'সফল অর্ডার সম্পন্ন হলে (Anti-duplicate protected)' },
                                    { key: 'lead', name: 'Lead', desc: 'কনটাক্ট ফর্ম বা কোয়েরি পাঠালে' },
                                    { key: 'signUp', name: 'SignUp (CompleteRegistration)', desc: 'নতুন একাউন্ট রেজিস্টার করলে' },
                                    { key: 'login', name: 'Login', desc: 'গ্রাহক লগইন সম্পন্ন করলে' },
                                    { key: 'contact', name: 'Contact', desc: 'WhatsApp বা হেল্পলাইনে কল বাটনে চাপলে' },
                                    { key: 'wishlist', name: 'Wishlist (AddToWishlist)', desc: 'পছন্দের তালিকায় পণ্য যুক্ত করলে' },
                                    { key: 'refund', name: 'Refund', desc: 'অর্ডার বাতিল বা রিফান্ড স্ট্যাটাসে গেলে' },
                                ].map((ev) => (
                                    <label
                                        key={ev.key}
                                        className={`flex items-start justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                                            eventsConfigForm[ev.key] !== false
                                                ? 'bg-emerald-50/40 border-emerald-200'
                                                : 'bg-slate-50 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="pr-2">
                                            <p className="text-xs font-bold text-slate-800">{ev.name}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{ev.desc}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={eventsConfigForm[ev.key] !== false}
                                            onChange={(e) => setEventsConfigForm({ ...eventsConfigForm, [ev.key]: e.target.checked })}
                                            className="accent-emerald-600 size-4 mt-0.5"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                            >
                                <Save size={16} />
                                <span>ইভেন্ট কনফিগারেশন সংরক্ষণ করুন</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    TAB 7: CONSENT & PRIVACY
                ───────────────────────────────────────────────────────────── */}
                {activeTab === 'consent' && (
                    <form onSubmit={handleSaveConsent} className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        <Shield size={20} className="text-emerald-600" />
                                        <span>Cookie & Tracking Consent Management</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Google Consent Mode v2 এবং Meta Pixel Consent নিয়মানুযায়ী ব্যবহারকারীর অনুমতি নিয়ন্ত্রণ করুন।
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={consentForm.enabled}
                                        onChange={(e) => setConsentForm({ ...consentForm, enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">ব্যানার হেডিং</label>
                                    <input
                                        type="text"
                                        value={consentForm.bannerHeading}
                                        onChange={(e) => setConsentForm({ ...consentForm, bannerHeading: e.target.value })}
                                        className="w-full mt-1.5 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700">অ্যাকসেপ্ট বাটন টেক্সট</label>
                                    <input
                                        type="text"
                                        value={consentForm.acceptBtnText}
                                        onChange={(e) => setConsentForm({ ...consentForm, acceptBtnText: e.target.value })}
                                        className="w-full mt-1.5 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-xs font-semibold text-slate-700">ব্যানার বার্তা</label>
                                    <textarea
                                        rows={2}
                                        value={consentForm.bannerText}
                                        onChange={(e) => setConsentForm({ ...consentForm, bannerText: e.target.value })}
                                        className="w-full mt-1.5 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                            >
                                <Save size={16} />
                                <span>প্রাইভেসি সেটিংস সংরক্ষণ করুন</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    TAB 8: DEBUG & TESTING SIMULATOR
                ───────────────────────────────────────────────────────────── */}
                {activeTab === 'debug' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <form onSubmit={handleSaveDebug} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                    <Bug size={20} className="text-emerald-600" />
                                    <span>Testing &amp; Debug Mode Settings</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    ব্রাউজার কনসোলে বিস্তারিত পেলোড দেখতে এবং টেস্ট ইভেন্ট কোড সক্রিয় করতে এই অপশনগুলো ব্যবহার করুন।
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Console Debug Mode</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            ব্রাউজারের DevTools Console-এ রঙিন [Tracking:Meta] এবং [Tracking:GA4] লগ দেখাবে।
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={debugForm.debugMode}
                                        onChange={(e) => setDebugForm({ ...debugForm, debugMode: e.target.checked })}
                                        className="accent-emerald-600 size-5"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Test Event Mode</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Meta CAPI-তে test_event_code স্বয়ংক্রিয়ভাবে সংযুক্ত করে টেস্ট সার্ভারে পাঠাবে।
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={debugForm.testEventMode}
                                        onChange={(e) => setDebugForm({ ...debugForm, testEventMode: e.target.checked })}
                                        className="accent-emerald-600 size-5"
                                    />
                                </label>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                                >
                                    <Save size={16} />
                                    <span>ডিবাগ সেটিংস সংরক্ষণ করুন</span>
                                </button>
                            </div>
                        </form>

                        {/* Interactive Event Simulator */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                    <Play size={20} className="text-blue-600" />
                                    <span>Interactive Event Simulator</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    ওয়েবসাইটে টেস্ট ইভেন্ট ফায়ার করে Meta Events Manager বা Google Ads-এ যাচাই করুন:
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleFireTestPurchase}
                                    className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition active:scale-95 cursor-pointer"
                                >
                                    <ShoppingBag size={22} className="text-emerald-600 mb-2" />
                                    <p className="text-xs font-bold text-emerald-900">Fire Test Purchase Event</p>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">
                                        ৳২,৪৫০ মূল্যের একটি ডেমো অর্ডার ইভেন্ট ফায়ার করবে (Meta CAPI + Pixel + Google Ads + GA4)।
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleFireTestAddToCart}
                                    className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition active:scale-95 cursor-pointer"
                                >
                                    <CreditCard size={22} className="text-blue-600 mb-2" />
                                    <p className="text-xs font-bold text-blue-900">Fire Test AddToCart</p>
                                    <p className="text-[11px] text-blue-700 mt-0.5">
                                        একটি ডেমো হেডফোন অ্যাড টু কার্ট ইভেন্ট সেন্ড করবে।
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleFireTestPageView}
                                    className="p-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition active:scale-95 cursor-pointer"
                                >
                                    <Activity size={22} className="text-purple-600 mb-2" />
                                    <p className="text-xs font-bold text-purple-900">Fire Test PageView</p>
                                    <p className="text-[11px] text-purple-700 mt-0.5">
                                        বর্তমান পেজ ভিজিটের PageView ইভেন্ট সেন্ড করবে।
                                    </p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    JSON PAYLOAD MODAL INSPECTOR
                ───────────────────────────────────────────────────────────── */}
                {viewingLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <FileJson size={18} className="text-emerald-600" />
                                        <span>ইভেন্ট পেলোড ডিটেইলস: {viewingLog.eventName}</span>
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                        ID: {viewingLog.eventId || viewingLog.id}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingLog(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="p-5 overflow-y-auto font-mono text-xs bg-slate-900 text-emerald-400 leading-relaxed">
                                <pre className="whitespace-pre-wrap break-all">
                                    {JSON.stringify(viewingLog, null, 2)}
                                </pre>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(JSON.stringify(viewingLog, null, 2), 'পেলোড')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                                >
                                    <Copy size={13} />
                                    <span>কপি JSON</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
