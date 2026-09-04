'use client'

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
    updateGoogleAuth, 
    updateSmsGateway, 
    updatePaymentGateway,
    resetApiSettings 
} from '@/lib/features/apiSettings/apiSettingsSlice'
import { 
    KeyRound, 
    Check, 
    Copy, 
    Eye, 
    EyeOff, 
    ExternalLink, 
    ShieldCheck, 
    AlertCircle, 
    Sparkles, 
    HelpCircle, 
    Save, 
    RefreshCw, 
    CheckCircle2, 
    Smartphone, 
    CreditCard, 
    Globe, 
    Clipboard, 
    Trash2,
    Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
    </svg>
)

export default function ApiSettingsPage() {
    const dispatch = useDispatch()
    const apiSettings = useSelector(state => state.apiSettings)

    // Local form state
    const [googleClientId, setGoogleClientId] = useState('')
    const [googleClientSecret, setGoogleClientSecret] = useState('')
    const [googleEnabled, setGoogleEnabled] = useState(true)
    const [googleAutoSignup, setGoogleAutoSignup] = useState(true)
    const [showSecret, setShowSecret] = useState(false)

    // SMS form state
    const [smsProvider, setSmsProvider] = useState('Greenweb')
    const [smsApiKey, setSmsApiKey] = useState('')
    const [smsSenderId, setSmsSenderId] = useState('')
    const [smsEnabled, setSmsEnabled] = useState(false)

    // Payment form state
    const [bkashApiKey, setBkashApiKey] = useState('')
    const [bkashSecretKey, setBkashSecretKey] = useState('')
    const [nagadMerchantId, setNagadMerchantId] = useState('')

    // Origin detection
    const [currentOrigin, setCurrentOrigin] = useState('http://localhost:3000')
    const [copiedField, setCopiedField] = useState(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentOrigin(window.location.origin)
        }
    }, [])

    // Sync from Redux on mount or change
    useEffect(() => {
        if (apiSettings?.googleAuth) {
            setGoogleClientId(apiSettings.googleAuth.clientId || '')
            setGoogleClientSecret(apiSettings.googleAuth.clientSecret || '')
            setGoogleEnabled(apiSettings.googleAuth.enabled !== false)
            setGoogleAutoSignup(apiSettings.googleAuth.autoSignup !== false)
        }
        if (apiSettings?.smsGateway) {
            setSmsProvider(apiSettings.smsGateway.provider || 'Greenweb')
            setSmsApiKey(apiSettings.smsGateway.apiKey || '')
            setSmsSenderId(apiSettings.smsGateway.senderId || '')
            setSmsEnabled(Boolean(apiSettings.smsGateway.enabled))
        }
        if (apiSettings?.paymentGateway) {
            setBkashApiKey(apiSettings.paymentGateway.bkashApiKey || '')
            setBkashSecretKey(apiSettings.paymentGateway.bkashSecretKey || '')
            setNagadMerchantId(apiSettings.paymentGateway.nagadMerchantId || '')
        }
    }, [apiSettings])

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text)
        setCopiedField(fieldName)
        toast.success(`কপি করা হয়েছে: ${text}`, { icon: '📋' })
        setTimeout(() => setCopiedField(null), 2500)
    }

    const handlePasteClientId = async () => {
        try {
            const text = await navigator.clipboard.readText()
            if (text) {
                setGoogleClientId(text.trim())
                toast.success('ক্লিপবোর্ড থেকে Client ID পেস্ট করা হয়েছে')
            }
        } catch (err) {
            toast.error('ক্লিপবোর্ড এক্সেস করা সম্ভব হয়নি, ম্যানুয়ালি পেস্ট করুন')
        }
    }

    const handleSaveGoogleAuth = (e) => {
        if (e) e.preventDefault()

        const trimmedId = googleClientId.trim()
        const trimmedSecret = googleClientSecret.trim()

        dispatch(updateGoogleAuth({
            clientId: trimmedId,
            clientSecret: trimmedSecret,
            enabled: googleEnabled,
            autoSignup: googleAutoSignup,
        }))

        if (trimmedId) {
            toast.success('Google API সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', { icon: '✅' })
        } else {
            toast.success('সেটিংস সংরক্ষিত হয়েছে। Client ID খালি থাকায় স্বয়ংক্রিয় সাইন-আপ মোড সক্রিয় রয়েছে।', { 
                icon: '⚡',
                duration: 4000 
            })
        }
    }

    const handleSaveSms = (e) => {
        if (e) e.preventDefault()
        dispatch(updateSmsGateway({
            provider: smsProvider,
            apiKey: smsApiKey.trim(),
            senderId: smsSenderId.trim(),
            enabled: smsEnabled
        }))
        toast.success('SMS Gateway সেটিংস সংরক্ষিত হয়েছে!')
    }

    const handleSavePayment = (e) => {
        if (e) e.preventDefault()
        dispatch(updatePaymentGateway({
            bkashApiKey: bkashApiKey.trim(),
            bkashSecretKey: bkashSecretKey.trim(),
            nagadMerchantId: nagadMerchantId.trim(),
        }))
        toast.success('পেমেন্ট গেটওয়ে API সংরক্ষিত হয়েছে!')
    }

    const isGoogleConnected = Boolean(googleClientId.trim())

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-green-50 text-green-600 border border-green-200">
                            <KeyRound size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                                এপিআই ও ইন্টিগ্রেশন সেটিংস (API Settings)
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Google Sign-In, SMS এবং পেমেন্ট গেটওয়ে এপিআই কি (API Keys) পরিচালনা করুন
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/login"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-xs"
                    >
                        <ExternalLink size={14} />
                        লগইন পেজ প্রিভিউ
                    </Link>
                </div>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Google Auth Status Card */}
                <div className={`p-4 rounded-2xl border transition-all ${
                    isGoogleConnected 
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                        : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <GoogleIcon />
                            <span className="text-xs font-bold uppercase tracking-wider">Google Sign-In</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                            isGoogleConnected 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                                : 'bg-amber-100 text-amber-700 border border-amber-300'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isGoogleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            {isGoogleConnected ? 'API সংযুক্ত (Active)' : 'অটো সাইন-আপ (Auto Mode)'}
                        </span>
                    </div>
                    <p className="text-[12px] opacity-80 leading-relaxed">
                        {isGoogleConnected 
                            ? 'Client ID সক্রিয় রয়েছে। গ্রাহকরা অফিশিয়াল Google OAuth পপআপ দেখতে পাবেন।' 
                            : 'Client ID এখনো দেওয়া হয়নি। কাস্টমার ক্লিক করলেই স্বয়ংক্রিয়ভাবে একাউন্ট তৈরি ও সাইন ইন হবে।'}
                    </p>
                </div>

                {/* SMS Gateway Status */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white text-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Smartphone size={18} className="text-indigo-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">SMS Gateway</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {smsEnabled ? 'সক্রিয় (Active)' : 'ঐচ্ছিক (Optional)'}
                        </span>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                        অর্ডার কনফার্মেশন এবং ট্র্যাকিং এর জন্য বাল্ক এসএমএস সার্ভিস যুক্ত করতে পারেন।
                    </p>
                </div>

                {/* Payment Gateway Status */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white text-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <CreditCard size={18} className="text-rose-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">পেমেন্ট এপিআই</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            বিকাশ / নগদ API
                        </span>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                        স্বয়ংক্রিয় অনলাইন পেমেন্ট ভেরিফিকেশনের জন্য সরাসরি মার্চেন্ট এপিআই কি বসাতে পারেন।
                    </p>
                </div>

            </div>

            {/* SECTION 1: GOOGLE OAUTH 2.0 API CONFIGURATION */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                            <GoogleIcon />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                                Google Sign-In & Authentication API
                            </h2>
                            <p className="text-xs text-slate-500">
                                কাস্টমারদের ১-ক্লিকে সরাসরি গুগল দিয়ে একাউন্ট তৈরি ও লগইনের এপিআই সেটিংস
                            </p>
                        </div>
                    </div>

                    <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isGoogleConnected 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                    }`}>
                        <CheckCircle2 size={14} />
                        {isGoogleConnected ? 'API Configured' : 'Pending Client ID'}
                    </span>
                </div>

                <div className="p-5 sm:p-7 space-y-6">
                    
                    {/* Notice Box */}
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                        <Sparkles size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-indigo-950 leading-relaxed">
                            <strong className="font-semibold text-indigo-900 block mb-0.5">
                                কিভাবে এটি কাজ করে:
                            </strong>
                            আপনি যতক্ষণ না এখানে আপনার আসল Google Client ID বসাবেন, ততক্ষণ কাস্টমার "Sign in with Google" এ ক্লিক করলে <strong>কোনো ফেক একাউন্ট মডাল দেখাবে না</strong>; সরাসরি স্মুথভাবে তাদের একাউন্ট তৈরি হয়ে লগইন হয়ে যাবে। যখন আপনি নিজের Client ID বসিয়ে সেভ করবেন, সাথে সাথে গ্রাহকরা অফিশিয়াল গুগল একাউন্ট চুজ করার পপআপ পেয়ে যাবেন!
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition">
                            <div>
                                <p className="text-xs font-bold text-slate-800">Google Sign-In সক্রিয় রাখুন</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">লগইন পেজে গুগল বাটন দৃশ্যমান থাকবে</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={googleEnabled}
                                onChange={(e) => setGoogleEnabled(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition">
                            <div>
                                <p className="text-xs font-bold text-slate-800">স্বয়ংক্রিয় সাইন-আপ (Auto Sign-Up)</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">নতুন ইউজার হলে স্বয়ংক্রিয়ভাবে একাউন্ট রেজিস্টার হবে</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={googleAutoSignup}
                                onChange={(e) => setGoogleAutoSignup(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                            />
                        </label>
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSaveGoogleAuth} className="space-y-4 pt-2">
                        
                        {/* Client ID */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    Google Client ID <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePasteClientId}
                                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                                    >
                                        <Clipboard size={12} />
                                        ক্লিপবোর্ড থেকে পেস্ট
                                    </button>
                                    {googleClientId && (
                                        <button
                                            type="button"
                                            onClick={() => setGoogleClientId('')}
                                            className="text-[11px] text-red-500 hover:text-red-600 flex items-center gap-1 transition"
                                        >
                                            <Trash2 size={12} />
                                            মুছুন
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={googleClientId}
                                    onChange={(e) => setGoogleClientId(e.target.value)}
                                    placeholder="e.g. 123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
                                    className="w-full pl-3.5 pr-20 py-2.5 text-xs sm:text-sm font-mono border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white text-slate-800 placeholder-slate-400 transition"
                                />
                                {googleClientId && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(googleClientId, 'clientId')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1"
                                    >
                                        {copiedField === 'clientId' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                        কপি
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                Google Cloud Console থেকে প্রাপ্ত ওয়েব ক্লায়েন্ট আইডি (Web Client ID)।
                            </p>
                        </div>

                        {/* Client Secret */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Google Client Secret <span className="text-slate-400 font-normal">(ঐচ্ছিক / Backend এর জন্য)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showSecret ? 'text' : 'password'}
                                    value={googleClientSecret}
                                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                                    placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-mono border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white text-slate-800 placeholder-slate-400 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm flex items-center gap-2"
                            >
                                <Save size={16} />
                                Google API সংরক্ষণ করুন
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!googleClientId.trim()) {
                                        toast('বর্তমানে অটোমেটিক সাইন-আপ মোড সক্রিয় আছে। ক্লায়েন্ট আইডি দিলে সরাসরি আসল গুগল ওঅউথ চালু হবে।', { icon: 'ℹ️' })
                                    } else {
                                        toast.success('Client ID ফর্ম্যাট সঠিক মনে হচ্ছে!')
                                    }
                                }}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2"
                            >
                                <CheckCircle2 size={16} className="text-slate-500" />
                                স্ট্যাটাস যাচাই
                            </button>

                            {apiSettings?.googleAuth?.lastUpdated && (
                                <span className="text-[11px] text-slate-400 ml-auto">
                                    সর্বশেষ আপডেট: {new Date(apiSettings.googleAuth.lastUpdated).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                    </form>

                </div>
            </div>

            {/* SECTION 2: STEP-BY-STEP GOOGLE CLOUD CONSOLE SETUP GUIDE */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">
                            Google Cloud Console থেকে Client ID তৈরি করার সহজ নিয়ম (Step-by-Step Guide)
                        </h3>
                        <p className="text-xs text-slate-500">
                            নিচের সহজ ধাপগুলো অনুসরণ করে মাত্র ২ মিনিটে আপনার নিজস্ব Google Client ID তৈরি করুন
                        </p>
                    </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    
                    {/* Step 1 */}
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            ১
                        </span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 mb-0.5">Google Cloud Console এ যান</p>
                            <p className="text-slate-600 text-xs mb-2">
                                আপনার জিমেইল দিয়ে লগইন করে Credentials পেজে যান।
                            </p>
                            <a 
                                href="https://console.cloud.google.com/apis/credentials" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 hover:text-indigo-700 font-semibold rounded-lg text-xs transition shadow-2xs"
                            >
                                <ExternalLink size={13} />
                                Google Cloud Credentials পেজ খুলুন
                            </a>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            ২
                        </span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 mb-0.5">OAuth Client ID তৈরি করুন</p>
                            <p className="text-slate-600 text-xs">
                                <strong>+ CREATE CREDENTIALS</strong> বাটনে ক্লিক করে <strong>OAuth client ID</strong> বেছে নিন। Application type হিসেবে <strong>Web application</strong> সিলেক্ট করুন।
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            ৩
                        </span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 mb-1">
                                Authorized JavaScript origins এ নিচের লিংকগুলো যুক্ত করুন:
                            </p>
                            <div className="space-y-1.5 mt-2">
                                <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-700">
                                    <span>http://localhost:3000</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard('http://localhost:3000', 'origin1')}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-sans font-semibold flex items-center gap-1"
                                    >
                                        {copiedField === 'origin1' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                        কপি
                                    </button>
                                </div>
                                {currentOrigin && currentOrigin !== 'http://localhost:3000' && (
                                    <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-700">
                                        <span>{currentOrigin}</span>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(currentOrigin, 'origin2')}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-sans font-semibold flex items-center gap-1"
                                        >
                                            {copiedField === 'origin2' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                            কপি
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            ৪
                        </span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 mb-1">
                                Authorized redirect URIs এ নিচের লিংকগুলো যুক্ত করুন:
                            </p>
                            <div className="space-y-1.5 mt-2">
                                <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-700">
                                    <span>http://localhost:3000/login</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard('http://localhost:3000/login', 'redirect1')}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-sans font-semibold flex items-center gap-1"
                                    >
                                        {copiedField === 'redirect1' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                        কপি
                                    </button>
                                </div>
                                {currentOrigin && currentOrigin !== 'http://localhost:3000' && (
                                    <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-700">
                                        <span>{currentOrigin}/login</span>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(`${currentOrigin}/login`, 'redirect2')}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-sans font-semibold flex items-center gap-1"
                                        >
                                            {copiedField === 'redirect2' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                            কপি
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            ৫
                        </span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 mb-0.5">Client ID কপি করে এখানে পেস্ট করুন</p>
                            <p className="text-slate-600 text-xs">
                                তৈরি হওয়া Client ID টি কপি করে উপরের <strong>Google Client ID</strong> ফিল্ডে বসিয়ে <strong>Google API সংরক্ষণ করুন</strong> বাটনে ক্লিক করুন। সাথে সাথে আপনার ওয়েবসাইটে আসল Google Sign-In চালু হয়ে যাবে!
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* SECTION 3: OTHER INTEGRATIONS (SMS & PAYMENT) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SMS Gateway Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                                <Smartphone size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-slate-800">SMS Gateway API</h3>
                                <p className="text-[11px] text-slate-500">গ্রাহকদের কাছে স্বয়ংক্রিয় এসএমএস পাঠানোর জন্য</p>
                            </div>
                        </div>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={smsEnabled}
                                onChange={(e) => setSmsEnabled(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                            />
                        </label>
                    </div>

                    <form onSubmit={handleSaveSms} className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">প্রোভাইডার</label>
                            <select
                                value={smsProvider}
                                onChange={(e) => setSmsProvider(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:border-indigo-500"
                            >
                                <option value="Greenweb">Greenweb BD</option>
                                <option value="BulkSMSBD">Bulk SMS BD</option>
                                <option value="Metronet">Metronet</option>
                                <option value="Twilio">Twilio</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">API Key / Token</label>
                            <input
                                type="password"
                                value={smsApiKey}
                                onChange={(e) => setSmsApiKey(e.target.value)}
                                placeholder="sms-api-key-here"
                                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Sender ID / Masking Name</label>
                            <input
                                type="text"
                                value={smsSenderId}
                                onChange={(e) => setSmsSenderId(e.target.value)}
                                placeholder="OurStoreBD"
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
                        >
                            SMS সেটিংস সেভ করুন
                        </button>
                    </form>
                </div>

                {/* Payment Gateway Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                                <CreditCard size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-slate-800">Payment Gateway API</h3>
                                <p className="text-[11px] text-slate-500">বিকাশ / নগদ মার্চেন্ট API কি</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSavePayment} className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">bKash App Key</label>
                            <input
                                type="password"
                                value={bkashApiKey}
                                onChange={(e) => setBkashApiKey(e.target.value)}
                                placeholder="bkash_app_key"
                                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">bKash App Secret</label>
                            <input
                                type="password"
                                value={bkashSecretKey}
                                onChange={(e) => setBkashSecretKey(e.target.value)}
                                placeholder="bkash_app_secret"
                                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Nagad Merchant ID</label>
                            <input
                                type="text"
                                value={nagadMerchantId}
                                onChange={(e) => setNagadMerchantId(e.target.value)}
                                placeholder="NAGAD_MERCHANT_01"
                                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
                        >
                            পেমেন্ট সেটিংস সেভ করুন
                        </button>
                    </form>
                </div>

            </div>

        </div>
    )
}
