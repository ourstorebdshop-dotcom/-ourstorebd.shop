'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import {
    Zap,
    Send,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    Save,
    Eye,
    EyeOff,
    Copy,
    Check,
    ExternalLink,
    HelpCircle,
    Play,
    Trash2,
    Shield,
    Activity,
    Sliders,
    ArrowUpRight,
    Search,
    Clock,
    PhoneCall,
    ShoppingBag,
    KeyRound,
    Lock
} from 'lucide-react'
import {
    updateTelegramSettings,
    updateGoogleSheetsSettings,
    clearSyncLogs,
    recordSyncLog
} from '@/lib/features/integrations/integrationsSlice'
import { buildAppsScriptTemplate } from '@/lib/integrations/googleSheets'

export default function AdminIntegrationsPage() {
    const dispatch = useDispatch()
    const integrations = useSelector(state => state.integrations) || {}
    const orders = useSelector(state => state.order?.orders) || []

    // Active tab: 'overview' | 'telegram' | 'google_sheets' | 'logs'
    const [activeTab, setActiveTab] = useState('overview')
    const [isLoadingSettings, setIsLoadingSettings] = useState(true)

    // Local form states
    const [telegramForm, setTelegramForm] = useState({
        enabled: false,
        botToken: '',
        botTokenMasked: '',
        isTokenConfigured: false,
        chatId: '',
        includeCustomerDetails: true,
        includeOrderItems: true,
        includeActionButtons: true,
    })
    const [showBotToken, setShowBotToken] = useState(false)
    const [isTestingTelegram, setIsTestingTelegram] = useState(false)
    const [telegramTestResult, setTelegramTestResult] = useState(null)

    const [sheetsForm, setSheetsForm] = useState({
        enabled: false,
        mode: 'webhook',
        webhookUrl: '',
        authSecret: '',
        spreadsheetId: '',
        sheetName: 'Orders',
    })
    const [isTestingSheets, setIsTestingSheets] = useState(false)
    const [sheetsTestResult, setSheetsTestResult] = useState(null)
    const [copiedScript, setCopiedScript] = useState(false)
    const [copiedSecret, setCopiedSecret] = useState(false)

    // Sync state
    const [manualOrderId, setManualOrderId] = useState('')
    const [isSyncingOrder, setIsSyncingOrder] = useState(false)
    const [retryingLogId, setRetryingLogId] = useState(null)
    const [isRetryingAll, setIsRetryingAll] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Logs & Stats state from server
    const [serverLogs, setServerLogs] = useState([])
    const [serverStats, setServerStats] = useState({
        totalOrdersSynced: 0,
        telegramSuccessCount: 0,
        googleSheetsSuccessCount: 0,
        failedCount: 0,
        lastSyncTime: null,
    })
    const [logFilter, setLogFilter] = useState('all')

    // Fetch secure settings & logs from server API on mount
    const fetchServerData = useCallback(async () => {
        try {
            const [settingsRes, logsRes] = await Promise.allSettled([
                fetch('/api/integrations/settings'),
                fetch('/api/integrations/logs')
            ])

            if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
                const settingsData = await settingsRes.value.json()
                if (settingsData.success && settingsData.settings) {
                    const s = settingsData.settings
                    setTelegramForm({
                        enabled: Boolean(s.telegram?.enabled),
                        botToken: '',
                        botTokenMasked: s.telegram?.botTokenMasked || '',
                        isTokenConfigured: Boolean(s.telegram?.isTokenConfigured),
                        chatId: s.telegram?.chatId || '',
                        includeCustomerDetails: s.telegram?.includeCustomerDetails !== false,
                        includeOrderItems: s.telegram?.includeOrderItems !== false,
                        includeActionButtons: s.telegram?.includeActionButtons !== false,
                    })
                    setSheetsForm({
                        enabled: Boolean(s.googleSheets?.enabled),
                        mode: s.googleSheets?.mode || 'webhook',
                        webhookUrl: s.googleSheets?.webhookUrl || '',
                        authSecret: s.googleSheets?.authSecret || '',
                        spreadsheetId: s.googleSheets?.spreadsheetId || '',
                        sheetName: s.googleSheets?.sheetName || 'Orders',
                    })
                    // Sync Redux
                    dispatch(updateTelegramSettings(s.telegram))
                    dispatch(updateGoogleSheetsSettings(s.googleSheets))
                }
            }

            if (logsRes.status === 'fulfilled' && logsRes.value.ok) {
                const logsData = await logsRes.value.json()
                if (logsData.success) {
                    setServerLogs(logsData.logs || [])
                    setServerStats(logsData.stats || {})
                }
            }
        } catch (err) {
            console.warn('[Integrations] Failed to load server settings:', err)
        } finally {
            setIsLoadingSettings(false)
        }
    }, [dispatch])

    useEffect(() => {
        fetchServerData()
    }, [fetchServerData])

    // Save All Settings handler
    const handleSaveAll = async () => {
        setIsSaving(true)
        try {
            const payload = {
                telegram: {
                    enabled: telegramForm.enabled,
                    botToken: telegramForm.botToken, // only passed if user typed a new token
                    chatId: telegramForm.chatId,
                    includeCustomerDetails: telegramForm.includeCustomerDetails,
                    includeOrderItems: telegramForm.includeOrderItems,
                    includeActionButtons: telegramForm.includeActionButtons,
                },
                googleSheets: {
                    enabled: sheetsForm.enabled,
                    mode: sheetsForm.mode,
                    webhookUrl: sheetsForm.webhookUrl,
                    authSecret: sheetsForm.authSecret,
                    spreadsheetId: sheetsForm.spreadsheetId,
                    sheetName: sheetsForm.sheetName,
                },
            }

            const res = await fetch('/api/integrations/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (data.success) {
                toast.success('অর্ডার ইন্টিগ্রেশন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', { icon: '✅' })
                if (data.settings?.telegram) {
                    setTelegramForm(prev => ({
                        ...prev,
                        botToken: '',
                        botTokenMasked: data.settings.telegram.botTokenMasked,
                        isTokenConfigured: data.settings.telegram.isTokenConfigured,
                    }))
                }
                fetchServerData()
            } else {
                toast.error(data.error || 'সেটিংস সেভ করতে সমস্যা হয়েছে।')
            }
        } catch (err) {
            toast.error('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।')
        } finally {
            setIsSaving(false)
        }
    }

    // Test Telegram Connection
    const handleTestTelegram = async () => {
        if (!telegramForm.botToken?.trim() && !telegramForm.isTokenConfigured) {
            toast.error('অনুগ্রহ করে টেলিগ্রাম Bot Token প্রদান করুন।')
            return
        }
        setIsTestingTelegram(true)
        setTelegramTestResult(null)

        try {
            const res = await fetch('/api/integrations/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service: 'telegram',
                    config: {
                        botToken: telegramForm.botToken.trim(),
                        chatId: telegramForm.chatId.trim(),
                    }
                }),
            })

            const data = await res.json()
            setTelegramTestResult(data)
            if (data.success) {
                toast.success(data.message || 'Telegram Bot সফলভাবে কানেক্টেড!', { icon: '🤖' })
            } else {
                toast.error(data.error || 'Telegram সংযোগ ব্যর্থ হয়েছে।')
            }
        } catch (err) {
            setTelegramTestResult({ success: false, error: err.message })
            toast.error('টেলিগ্রাম টেস্ট রিকোয়েস্টে সমস্যা হয়েছে।')
        } finally {
            setIsTestingTelegram(false)
        }
    }

    // Test Google Sheets Connection
    const handleTestSheets = async () => {
        if (!sheetsForm.webhookUrl?.trim()) {
            toast.error('অনুগ্রহ করে Google Apps Script Webhook URL দিন।')
            return
        }
        setIsTestingSheets(true)
        setSheetsTestResult(null)

        try {
            const res = await fetch('/api/integrations/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service: 'google_sheets',
                    config: {
                        webhookUrl: sheetsForm.webhookUrl.trim(),
                        authSecret: sheetsForm.authSecret?.trim(),
                        sheetName: sheetsForm.sheetName?.trim(),
                    }
                }),
            })

            const data = await res.json()
            setSheetsTestResult(data)
            if (data.success) {
                toast.success(data.message || 'Google Sheets সফলভাবে কানেক্টেড!', { icon: '📊' })
            } else {
                toast.error(data.error || 'Google Sheets সংযোগ ব্যর্থ হয়েছে।')
            }
        } catch (err) {
            setSheetsTestResult({ success: false, error: err.message })
            toast.error('গুগল শিট টেস্ট রিকোয়েস্টে সমস্যা হয়েছে।')
        } finally {
            setIsTestingSheets(false)
        }
    }

    // Copy Google Apps Script Template with injected authSecret
    const handleCopyScript = () => {
        const scriptCode = buildAppsScriptTemplate(sheetsForm.authSecret)
        if (navigator.clipboard) {
            navigator.clipboard.writeText(scriptCode)
            setCopiedScript(true)
            toast.success('সিকিউর Google Apps Script কোড কপি করা হয়েছে!')
            setTimeout(() => setCopiedScript(false), 3000)
        }
    }

    // Copy authSecret
    const handleCopySecret = () => {
        if (navigator.clipboard && sheetsForm.authSecret) {
            navigator.clipboard.writeText(sheetsForm.authSecret)
            setCopiedSecret(true)
            toast.success('Auth Secret কপি করা হয়েছে!')
            setTimeout(() => setCopiedSecret(false), 2000)
        }
    }

    // Retry specific order sync
    const handleRetrySync = async (log) => {
        if (!log?.orderId) return
        setRetryingLogId(log.id)

        try {
            const res = await fetch('/api/integrations/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'retry',
                    orderId: log.orderId,
                    service: log.service || 'all',
                }),
            })

            const data = await res.json()
            if (data.success) {
                toast.success(`অর্ডার #${log.orderId} সফলভাবে Re-sync করা হয়েছে!`)
                fetchServerData()
            } else {
                toast.error(data.error || 'Re-sync ব্যর্থ হয়েছে।')
            }
        } catch (err) {
            toast.error('Re-sync রিকোয়েস্টে সমস্যা হয়েছে।')
        } finally {
            setRetryingLogId(null)
        }
    }

    // Bulk retry all failed orders
    const handleRetryAllFailed = async () => {
        setIsRetryingAll(true)
        try {
            const res = await fetch('/api/integrations/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'retry_all_failed' }),
            })

            const data = await res.json()
            if (data.success) {
                toast.success(data.message || `মোট ${data.successCount || 0}টি ব্যর্থ অর্ডার পুনরায় সিঙ্ক হয়েছে!`, { duration: 4000 })
                fetchServerData()
            } else {
                toast.error(data.error || 'বাল্ক রিট্রাই ব্যর্থ হয়েছে।')
            }
        } catch (err) {
            toast.error('বাল্ক রিট্রাই রিকোয়েস্টে সমস্যা হয়েছে।')
        } finally {
            setIsRetryingAll(false)
        }
    }

    // Manual sync by order ID
    const handleManualSync = async () => {
        const trimmed = manualOrderId.trim().replace(/^#/, '')
        if (!trimmed) {
            toast.error('অর্ডার আইডি উল্লেখ করুন।')
            return
        }

        setIsSyncingOrder(true)
        try {
            const res = await fetch('/api/integrations/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'manual_sync',
                    orderId: trimmed,
                    service: 'all',
                }),
            })

            const data = await res.json()
            if (data.success) {
                toast.success(`অর্ডার #${trimmed} Telegram ও Google Sheets-এ পাঠানো হয়েছে!`)
                setManualOrderId('')
                fetchServerData()
            } else {
                toast.error(data.error || 'সিঙ্ক ব্যর্থ হয়েছে।')
            }
        } catch (err) {
            toast.error('ম্যানুয়াল সিঙ্কে সমস্যা হয়েছে।')
        } finally {
            setIsSyncingOrder(false)
        }
    }

    // Clear logs
    const handleClearLogs = async () => {
        if (!confirm('আপনি কি নিশ্চিত যে সকল সিঙ্ক অডিট লগ মুছে ফেলতে চান?')) return

        try {
            const res = await fetch('/api/integrations/logs', { method: 'DELETE' })
            if (res.ok) {
                dispatch(clearSyncLogs())
                setServerLogs([])
                toast.success('সকল সিঙ্ক লগ সফলভাবে মুছে ফেলা হয়েছে!')
            }
        } catch (err) {
            toast.error('লগ মুছে ফেলতে ব্যর্থ হয়েছে।')
        }
    }

    // Computed statuses
    const isTelegramConfigured = Boolean(
        (telegramForm.botToken?.trim() || telegramForm.isTokenConfigured) &&
        telegramForm.chatId?.trim()
    )
    const isSheetsConfigured = Boolean(sheetsForm.webhookUrl?.trim())

    const currentLogs = serverLogs.length > 0 ? serverLogs : (integrations.syncLogs || [])
    const currentStats = serverStats.totalOrdersSynced !== undefined ? serverStats : (integrations.syncStats || {})

    const filteredLogs = currentLogs.filter(log => {
        if (logFilter === 'all') return true
        if (logFilter === 'telegram') return log.service === 'telegram'
        if (logFilter === 'google_sheets') return log.service === 'google_sheets'
        if (logFilter === 'failed') return log.status === 'FAILED'
        return true
    })

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">

            {/* Top Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                            <Zap size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                                    Order Automation & Integrations
                                </h1>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                    Production Ready
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                                Telegram Bot ও Google Sheets-এ নতুন অর্ডার স্বয়ংক্রিয়ভাবে পাঠানো ও সিঙ্ক নিয়ন্ত্রণ
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start md:self-auto">
                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}
                    </button>
                </div>
            </div>

            {/* Quick Status Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Telegram Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                                <Send size={18} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Telegram Bot</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            telegramForm.enabled && isTelegramConfigured
                                ? 'bg-emerald-100 text-emerald-700'
                                : telegramForm.enabled
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                            {telegramForm.enabled && isTelegramConfigured ? 'সক্রিয় (Active)' : telegramForm.enabled ? 'অসম্পূর্ণ' : 'নিষ্ক্রিয়'}
                        </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                        {isTelegramConfigured ? (
                            <p className="truncate">Chat ID: <code className="font-mono text-slate-700">{telegramForm.chatId}</code></p>
                        ) : (
                            <p className="text-amber-600">টোকেন ও চ্যাট আইডি দিন</p>
                        )}
                    </div>
                </div>

                {/* Card 2: Google Sheets Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <FileSpreadsheet size={18} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Google Sheets</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            sheetsForm.enabled && isSheetsConfigured
                                ? 'bg-emerald-100 text-emerald-700'
                                : sheetsForm.enabled
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                            {sheetsForm.enabled && isSheetsConfigured ? 'সক্রিয় (Active)' : sheetsForm.enabled ? 'অসম্পূর্ণ' : 'নিষ্ক্রিয়'}
                        </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                        {isSheetsConfigured ? (
                            <p className="truncate">Webhook কানেক্টেড ({sheetsForm.sheetName})</p>
                        ) : (
                            <p className="text-amber-600">Webhook URL দিন</p>
                        )}
                    </div>
                </div>

                {/* Card 3: Total Synced */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                <Activity size={18} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Total Synced</span>
                        </div>
                        <span className="text-lg font-extrabold text-slate-800">
                            {currentStats.totalOrdersSynced || 0}
                        </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        <span>শেষ সিঙ্ক: {currentStats.lastSyncTime ? new Date(currentStats.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'এখনো হয়নি'}</span>
                    </div>
                </div>

                {/* Card 4: Failed Sync */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${(currentStats.failedCount || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                                <AlertCircle size={18} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Failed Sync</span>
                        </div>
                        <span className={`text-lg font-extrabold ${(currentStats.failedCount || 0) > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            {currentStats.failedCount || 0}
                        </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 truncate">
                        {(currentStats.failedCount || 0) > 0 ? (
                            <span className="text-red-500 font-medium">ত্রুটি রয়েছে (লগ দেখুন)</span>
                        ) : (
                            <span className="text-emerald-600">কোনো ত্রুটি নেই</span>
                        )}
                    </div>
                </div>

            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 overflow-x-auto gap-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                        activeTab === 'overview'
                            ? 'border-emerald-600 text-emerald-700 font-semibold'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Sliders size={16} />
                    Overview & Flow
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('telegram')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                        activeTab === 'telegram'
                            ? 'border-emerald-600 text-emerald-700 font-semibold'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Send size={16} />
                    Telegram Bot
                    {telegramForm.enabled && isTelegramConfigured && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('google_sheets')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                        activeTab === 'google_sheets'
                            ? 'border-emerald-600 text-emerald-700 font-semibold'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <FileSpreadsheet size={16} />
                    Google Sheets
                    {sheetsForm.enabled && isSheetsConfigured && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('logs')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                        activeTab === 'logs'
                            ? 'border-emerald-600 text-emerald-700 font-semibold'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Activity size={16} />
                    Sync Logs & Management
                    {currentLogs.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                            {currentLogs.length}
                        </span>
                    )}
                </button>
            </div>

            {/* TAB 1: OVERVIEW & FLOW */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Architecture Explanation Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Zap size={18} className="text-emerald-600" />
                                স্বয়ংক্রিয় অর্ডার প্রসেসিং ফ্লো (Production Flow)
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                                <Shield size={13} />
                                Non-Blocking & Encrypted
                            </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 leading-relaxed">
                            গ্রাহক ওয়েবসাইটে অর্ডার সাবমিট করলে ফায়ারবেস ডাটাবেজে অর্ডারটি পার্মানেন্টলি সেভ হওয়ার সঙ্গে সঙ্গে ব্যাকগ্রাউন্ডে প্যারালালভাবে টেলিগ্রাম বট এবং গুগল শিটে অর্ডারের যাবতীয় তথ্য পৌঁছে যায়। কোনো একটি সার্ভিস ডাউন বা স্লো হলেও অর্ডারে কোনো বাধা সৃষ্টি হবে না।
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center space-y-1.5">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold mx-auto flex items-center justify-center text-xs">1</div>
                                <p className="text-xs font-bold text-slate-800">Website Order</p>
                                <p className="text-[11px] text-slate-500">গ্রাহক চেকআউট সম্পন্ন করবেন</p>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center space-y-1.5">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold mx-auto flex items-center justify-center text-xs">2</div>
                                <p className="text-xs font-bold text-slate-800">Database Storage</p>
                                <p className="text-[11px] text-slate-500">অর্ডার ভ্যালিডেট ও ডাটাবেজে সংরক্ষণ</p>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center space-y-1.5">
                                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 font-bold mx-auto flex items-center justify-center text-xs">3</div>
                                <p className="text-xs font-bold text-slate-800">Telegram Bot Alert</p>
                                <p className="text-[11px] text-slate-500">গ্রুপ বা ফোনে তাৎক্ষণিক নোটিফিকেশন</p>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center space-y-1.5">
                                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 font-bold mx-auto flex items-center justify-center text-xs">4</div>
                                <p className="text-xs font-bold text-slate-800">Google Sheets Sync</p>
                                <p className="text-[11px] text-slate-500">স্প্রেডশিটে নতুন রো স্বয়ংক্রিয় তৈরি</p>
                            </div>
                        </div>
                    </div>

                    {/* Manual Sync Bar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Play size={16} className="text-emerald-600" />
                                যেকোনো অর্ডার ম্যানুয়াল সিঙ্ক করুন (Manual Order Sync)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                নির্দিষ্ট কোনো পুরোনো বা বাদ পড়া অর্ডারের আইডি লিখে সরাসরি টেলিগ্রাম ও গুগল শিটে পাঠাতে পারেন।
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-60">
                                <input
                                    type="text"
                                    placeholder="Order ID (e.g. 172632...)"
                                    value={manualOrderId}
                                    onChange={(e) => setManualOrderId(e.target.value)}
                                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleManualSync}
                                disabled={isSyncingOrder || !manualOrderId.trim()}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 whitespace-nowrap"
                            >
                                {isSyncingOrder ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                                সিঙ্ক পাঠান
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: TELEGRAM BOT SETTINGS */}
            {activeTab === 'telegram' && (
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                        
                        {/* Header & Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Send size={18} className="text-sky-600" />
                                    Telegram Bot Configuration
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    নতুন অর্ডার এলে আপনার টেলিগ্রাম বট সরাসরি চ্যানেল বা গ্রুপে নোটিফিকেশন পাঠাবে
                                </p>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={telegramForm.enabled}
                                    onChange={(e) => setTelegramForm(prev => ({ ...prev, enabled: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                <span className="ml-3 text-sm font-semibold text-slate-700">
                                    {telegramForm.enabled ? 'সক্রিয় (Enabled)' : 'নিষ্ক্রিয় (Disabled)'}
                                </span>
                            </label>
                        </div>

                        {/* Form Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Bot Token with Masking indicator */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>Bot Token <span className="text-red-500">*</span></span>
                                    {telegramForm.isTokenConfigured && (
                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Lock size={10} />
                                            টোকেন সংরক্ষিত রয়েছে
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showBotToken ? 'text' : 'password'}
                                        placeholder={telegramForm.isTokenConfigured ? `${telegramForm.botTokenMasked} (পরিবর্তন করতে নতুন টোকেন লিখুন)` : "123456789:ABCdefGHIjklMNOpqrsTUV..."}
                                        value={telegramForm.botToken}
                                        onChange={(e) => setTelegramForm(prev => ({ ...prev, botToken: e.target.value }))}
                                        className="w-full text-xs font-mono px-3.5 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-emerald-500 focus:border-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowBotToken(!showBotToken)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {showBotToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    নিরাপত্তার স্বার্থে টোকেনটি সার্ভারে এনক্রিপ্টেড থাকে এবং ব্রাউজারে প্লেইনটেক্সট পাঠানো হয় না।
                                </p>
                            </div>

                            {/* Chat ID */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>Chat ID / Group ID <span className="text-red-500">*</span></span>
                                    <span className="text-[11px] text-slate-400 font-normal">e.g. 123456789 বা -100123456789</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="123456789 বা -100xxxxxxxxx"
                                    value={telegramForm.chatId}
                                    onChange={(e) => setTelegramForm(prev => ({ ...prev, chatId: e.target.value }))}
                                    className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Notification Options */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                            <h4 className="text-xs font-bold text-slate-700">নোটিফিকেশন অপশন ও কনটেন্ট:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={telegramForm.includeCustomerDetails}
                                        onChange={(e) => setTelegramForm(prev => ({ ...prev, includeCustomerDetails: e.target.checked }))}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>গ্রাহকের ঠিকানা ও মোবাইল</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={telegramForm.includeOrderItems}
                                        onChange={(e) => setTelegramForm(prev => ({ ...prev, includeOrderItems: e.target.checked }))}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>পণ্য ও পরিমাণের তালিকা</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={telegramForm.includeActionButtons}
                                        onChange={(e) => setTelegramForm(prev => ({ ...prev, includeActionButtons: e.target.checked }))}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>অ্যাকশন বাটন (View & Call)</span>
                                </label>
                            </div>
                        </div>

                        {/* Test Connection Button & Result Banner */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleTestTelegram}
                                disabled={isTestingTelegram || (!telegramForm.botToken?.trim() && !telegramForm.isTokenConfigured)}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                            >
                                {isTestingTelegram ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                {isTestingTelegram ? 'কানেকশন পরীক্ষা হচ্ছে...' : 'Test Connection (টেস্ট মেসেজ পাঠান)'}
                            </button>
                        </div>

                        {telegramTestResult && (
                            <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                                telegramTestResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {telegramTestResult.success ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />}
                                <div className="space-y-1">
                                    <p className="font-bold">{telegramTestResult.success ? 'টেস্ট সফল হয়েছে!' : 'টেস্ট ব্যর্থ হয়েছে'}</p>
                                    <p>{telegramTestResult.message || telegramTestResult.error}</p>
                                    {telegramTestResult.bot && (
                                        <p className="font-mono text-[11px] opacity-80">
                                            Bot Name: @{telegramTestResult.bot.username} (ID: {telegramTestResult.bot.id})
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: GOOGLE SHEETS SETTINGS */}
            {activeTab === 'google_sheets' && (
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                        
                        {/* Header & Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <FileSpreadsheet size={18} className="text-emerald-600" />
                                    Google Sheets Configuration
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    প্রতিটি সফল অর্ডারের তথ্য রিয়েলটাইমে গুগল স্প্রেডশিটে নতুন রো (Row) হিসেবে সংরক্ষিত হবে
                                </p>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sheetsForm.enabled}
                                    onChange={(e) => setSheetsForm(prev => ({ ...prev, enabled: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                <span className="ml-3 text-sm font-semibold text-slate-700">
                                    {sheetsForm.enabled ? 'সক্রিয় (Enabled)' : 'নিষ্ক্রিয় (Disabled)'}
                                </span>
                            </label>
                        </div>

                        {/* Webhook URL Input */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>Google Apps Script Webhook URL <span className="text-red-500">*</span></span>
                                    <span className="text-[11px] text-emerald-600 font-semibold">Upsert ও ডুপ্লিকেট রোধ সক্রিয়</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                                    value={sheetsForm.webhookUrl}
                                    onChange={(e) => setSheetsForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                    className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Sheet Name (ট্যাবের নাম)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Orders"
                                        value={sheetsForm.sheetName}
                                        onChange={(e) => setSheetsForm(prev => ({ ...prev, sheetName: e.target.value }))}
                                        className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Webhook Security Secret */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                        <span>Webhook Security Secret (authSecret)</span>
                                        <button
                                            type="button"
                                            onClick={handleCopySecret}
                                            className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                                        >
                                            {copiedSecret ? <Check size={11} /> : <Copy size={11} />}
                                            {copiedSecret ? 'কপি হয়েছে' : 'কপি করুন'}
                                        </button>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={sheetsForm.authSecret}
                                            className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-600"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        এই সিক্রেটটি নিচের কোডে স্বয়ংক্রিয়ভাবে যুক্ত রয়েছে যেন অননুমোদিত কেউ শিটে ডাটা না পাঠাতে পারে।
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Test Connection Button & Result */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleTestSheets}
                                disabled={isTestingSheets || !sheetsForm.webhookUrl?.trim()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                            >
                                {isTestingSheets ? <RefreshCw size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                                {isTestingSheets ? 'টেস্ট হচ্ছে...' : 'Test Connection (কানেকশন পরীক্ষা করুন)'}
                            </button>
                        </div>

                        {sheetsTestResult && (
                            <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                                sheetsTestResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {sheetsTestResult.success ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />}
                                <div className="space-y-1">
                                    <p className="font-bold">{sheetsTestResult.success ? 'কানেকশন সফল!' : 'কানেকশন ব্যর্থ হয়েছে'}</p>
                                    <p>{sheetsTestResult.message || sheetsTestResult.error}</p>
                                    {sheetsTestResult.securityActive && (
                                        <p className="text-emerald-700 font-medium">✓ Webhook Security Secret সক্রিয় রয়েছে</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Google Apps Script 1-Click Code Section */}
                        <div className="bg-slate-900 rounded-xl p-5 text-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                        <span>Google Apps Script প্রস্তুত কোড (Upsert + Security সহ)</span>
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        এই স্ক্রিপ্টটি আপনার গুগল শিটে অটোমেটিক হেডার, ডুপ্লিকেট রোধ এবং নতুন অর্ডার যোগ করে দেবে
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyScript}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                                >
                                    {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                                    {copiedScript ? 'কপি হয়েছে!' : 'সম্পূর্ণ কোড কপি করুন'}
                                </button>
                            </div>

                            <div className="bg-slate-950 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed border border-slate-800">
                                <pre>{buildAppsScriptTemplate(sheetsForm.authSecret)}</pre>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* TAB 4: SYNC LOGS & MANAGEMENT */}
            {activeTab === 'logs' && (
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
                        
                        {/* Header & Filter Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Activity size={18} className="text-emerald-600" />
                                    Sync History & Audit Logs
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    টেলিগ্রাম ও গুগল শিটে অর্ডার পাঠানোর রিয়েলটাইম ইতিহাস ও এরর রিপোর্ট
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Bulk Retry Button */}
                                {(currentStats.failedCount || 0) > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleRetryAllFailed}
                                        disabled={isRetryingAll}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                                    >
                                        <RefreshCw size={13} className={isRetryingAll ? 'animate-spin' : ''} />
                                        Retry All Failed ({currentStats.failedCount})
                                    </button>
                                )}

                                {/* Filter Select */}
                                <select
                                    value={logFilter}
                                    onChange={(e) => setLogFilter(e.target.value)}
                                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white"
                                >
                                    <option value="all">সকল লগ ({currentLogs.length})</option>
                                    <option value="telegram">Telegram Logs</option>
                                    <option value="google_sheets">Google Sheets Logs</option>
                                    <option value="failed">শুধুমাত্র ত্রুটি (Failed)</option>
                                </select>

                                {currentLogs.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearLogs}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 hover:border-red-200 transition"
                                        title="সকল লগ মুছে ফেলুন"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Logs Table */}
                        {filteredLogs.length > 0 ? (
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                        <tr>
                                            <th className="py-3 px-4">Order ID</th>
                                            <th className="py-3 px-4">Service</th>
                                            <th className="py-3 px-4">Customer</th>
                                            <th className="py-3 px-4">Time</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Details / Error</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                                    #{log.orderId}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 font-semibold ${
                                                        log.service === 'telegram' ? 'text-sky-600' : 'text-emerald-600'
                                                    }`}>
                                                        {log.service === 'telegram' ? <Send size={13} /> : <FileSpreadsheet size={13} />}
                                                        {log.service === 'telegram' ? 'Telegram' : 'Google Sheets'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-700">
                                                    {log.customerName || 'Customer'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                                                    {log.timestamp ? new Date(log.timestamp).toLocaleString([], {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        log.status === 'SUCCESS'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {log.status === 'SUCCESS' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                                                    {log.error ? (
                                                        <span className="text-red-500 font-mono" title={log.error}>
                                                            {log.error}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            {log.action === 'UPDATED' ? `Row ${log.row} আপডেট করা হয়েছে` : 'সফলভাবে সিঙ্ক সম্পন্ন'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRetrySync(log)}
                                                        disabled={retryingLogId === log.id}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold transition disabled:opacity-50 inline-flex items-center gap-1"
                                                    >
                                                        <RefreshCw size={11} className={retryingLogId === log.id ? 'animate-spin' : ''} />
                                                        Re-sync
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                                <Activity size={32} className="mx-auto text-slate-300" />
                                <p className="text-sm font-medium">কোনো সিঙ্ক লগ পাওয়া যায়নি</p>
                                <p className="text-xs text-slate-400">নতুন অর্ডার আসা শুরু করলে এখানে হিস্ট্রি ও স্ট্যাটাস প্রদর্শিত হবে।</p>
                            </div>
                        )}

                    </div>
                </div>
            )}

        </div>
    )
}
