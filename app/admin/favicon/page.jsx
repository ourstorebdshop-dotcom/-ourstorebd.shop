'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateFavicon, resetFavicon, defaultFaviconSettings } from '@/lib/features/favicon/faviconSlice'
import { processImageToFavicon, generateAppleTouchIcon, FAVICON_PRESETS, svgToDataUrl } from '@/lib/faviconHelper'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
    Upload,
    Globe,
    Check,
    RotateCcw,
    Save,
    Image as ImageIcon,
    Smartphone,
    Sun,
    Moon,
    ExternalLink,
    Sparkles,
    ShieldCheck,
    Layers,
    FileText,
    CheckCircle2,
    Sliders,
    X,
    Laptop,
    Eye,
    Link2,
    RefreshCw,
} from 'lucide-react'

export default function FaviconManagementPage() {
    const dispatch = useDispatch()
    const currentFaviconState = useSelector(state => state.favicon) || defaultFaviconSettings

    // Local editor state
    const [previewUrl, setPreviewUrl] = useState(currentFaviconState.faviconUrl || '/favicon.ico')
    const [applePreviewUrl, setApplePreviewUrl] = useState(currentFaviconState.appleTouchIconUrl || '/apple-icon.png')
    const [siteTitle, setSiteTitle] = useState(currentFaviconState.siteTitle || 'Our Store BD - Best Electronics & Gadgets')
    const [fileMeta, setFileMeta] = useState({
        name: currentFaviconState.fileName || 'current-favicon',
        size: currentFaviconState.fileSize || null,
        type: currentFaviconState.fileType || '',
    })

    // UI View toggles
    const [tabTheme, setTabTheme] = useState('light') // 'light' | 'dark'
    const [syncAppleTouch, setSyncAppleTouch] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [customUrlInput, setCustomUrlInput] = useState('')
    const [selectedPresetId, setSelectedPresetId] = useState(null)
    const [liveTabTesting, setLiveTabTesting] = useState(true)

    const fileInputRef = useRef(null)

    // Sync local state when Redux loads or changes externally
    useEffect(() => {
        if (currentFaviconState?.faviconUrl && !selectedPresetId && fileMeta.name === 'current-favicon') {
            setPreviewUrl(currentFaviconState.faviconUrl)
            setApplePreviewUrl(currentFaviconState.appleTouchIconUrl || currentFaviconState.faviconUrl)
        }
    }, [currentFaviconState])

    // Live test in active browser tab
    useEffect(() => {
        if (liveTabTesting && previewUrl && typeof document !== 'undefined') {
            let iconLink = document.querySelector("link[rel*='icon']")
            if (iconLink) {
                iconLink.href = previewUrl
            }
        }
    }, [liveTabTesting, previewUrl])

    // Handle File Drop / Select
    const handleFile = async (file) => {
        if (!file) return

        // Validate type
        const validTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
        const isIco = file.name.endsWith('.ico')
        if (!validTypes.includes(file.type) && !isIco) {
            toast.error('অনুপযুক্ত ফাইল ফরম্যাট! অনুগ্রহ করে .PNG, .ICO, .SVG, বা .JPG ফাইল ব্যবহার করুন।')
            return
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('ফাইল সাইজ ৫ মেগাবাইট (5MB) এর কম হতে হবে!')
            return
        }

        setIsProcessing(true)
        setSelectedPresetId(null)
        try {
            if (file.type === 'image/svg+xml') {
                const reader = new FileReader()
                reader.onload = async (e) => {
                    const dataUrl = e.target.result
                    setPreviewUrl(dataUrl)
                    if (syncAppleTouch) {
                        const appleIcon = await generateAppleTouchIcon(dataUrl, 180)
                        setApplePreviewUrl(appleIcon)
                    }
                    setFileMeta({
                        name: file.name,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        type: 'SVG Vector',
                    })
                    setIsProcessing(false)
                    toast.success('SVG ফেভিকন লোড হয়েছে!')
                }
                reader.readAsDataURL(file)
            } else if (isIco) {
                const reader = new FileReader()
                reader.onload = async (e) => {
                    const dataUrl = e.target.result
                    setPreviewUrl(dataUrl)
                    if (syncAppleTouch) {
                        const appleIcon = await generateAppleTouchIcon(dataUrl, 180)
                        setApplePreviewUrl(appleIcon)
                    }
                    setFileMeta({
                        name: file.name,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        type: 'ICO Icon',
                    })
                    setIsProcessing(false)
                    toast.success('ICO ফেভিকন লোড হয়েছে!')
                }
                reader.readAsDataURL(file)
            } else {
                // Process and resize using canvas
                const result = await processImageToFavicon(file, 64)
                setPreviewUrl(result.dataUrl)
                if (syncAppleTouch) {
                    const appleIcon = await generateAppleTouchIcon(result.dataUrl, 180)
                    setApplePreviewUrl(appleIcon)
                }
                setFileMeta({
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    type: file.type.replace('image/', '').toUpperCase(),
                })
                setIsProcessing(false)
                toast.success('ইমেজটি ফেভিকন সাইজে অপ্টিমাইজ করা হয়েছে!')
            }
        } catch (err) {
            console.error('Error processing image:', err)
            toast.error('ইমেজ প্রসেস করতে ব্যর্থ হয়েছে: ' + err.message)
            setIsProcessing(false)
        }
    }

    // Drag & drop handlers
    const onDragOver = (e) => {
        e.preventDefault()
        setDragActive(true)
    }
    const onDragLeave = () => {
        setDragActive(false)
    }
    const onDrop = (e) => {
        e.preventDefault()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    // Apply pre-made preset
    const handleSelectPreset = async (preset) => {
        setSelectedPresetId(preset.id)
        const dataUrl = svgToDataUrl(preset.svg)
        setPreviewUrl(dataUrl)
        if (syncAppleTouch) {
            const appleIcon = await generateAppleTouchIcon(dataUrl, 180, preset.bgColor)
            setApplePreviewUrl(appleIcon)
        }
        setFileMeta({
            name: `${preset.name}.svg`,
            size: '0.8 KB',
            type: 'Preset Badge',
        })
        toast.success(`"${preset.name}" প্রিসেট নির্বাচন করা হয়েছে!`)
    }

    // Apply custom URL
    const handleApplyCustomUrl = async () => {
        if (!customUrlInput.trim()) {
            toast.error('অনুগ্রহ করে একটি বৈধ ইমেজ URL লিখুন!')
            return
        }
        const cleanUrl = customUrlInput.trim()
        setPreviewUrl(cleanUrl)
        if (syncAppleTouch) {
            setApplePreviewUrl(cleanUrl)
        }
        setFileMeta({
            name: 'Custom URL Icon',
            size: 'External',
            type: 'URL Link',
        })
        setSelectedPresetId(null)
        setShowUrlInput(false)
        toast.success('কাস্টম URL আইকন সেট করা হয়েছে!')
    }

    // Save & update across site
    const handleSave = async () => {
        if (!previewUrl) {
            toast.error('কোনো ফেভিকন সিলেক্ট করা নেই!')
            return
        }

        setIsSaving(true)
        try {
            const updatePayload = {
                faviconUrl: previewUrl,
                appleTouchIconUrl: applePreviewUrl || previewUrl,
                siteTitle,
                fileName: fileMeta.name,
                fileSize: fileMeta.size,
                fileType: fileMeta.type,
            }

            // 1. Dispatch to Redux (which automatically updates localStorage & Firestore via StoreProvider)
            dispatch(updateFavicon(updatePayload))

            // 2. Call server API to write to public/favicon.ico on the server filesystem
            await fetch('/api/admin/favicon', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    faviconDataUrl: previewUrl,
                    appleTouchIconDataUrl: applePreviewUrl,
                }),
            }).catch(e => console.warn('Filesystem sync notice:', e.message))

            // 3. Immediately update active document head
            if (typeof document !== 'undefined') {
                const iconLink = document.querySelector("link[rel*='icon']")
                if (iconLink) iconLink.href = previewUrl
                const appleLink = document.querySelector("link[rel='apple-touch-icon']")
                if (appleLink && applePreviewUrl) appleLink.href = applePreviewUrl
            }

            toast.success('ফেভিকন সফলভাবে আপডেট ও পুরো ওয়েবসাইটে প্রয়োগ করা হয়েছে! 🎉', {
                duration: 4000,
            })
        } catch (err) {
            console.error('Save error:', err)
            toast.error('সংরক্ষণে সমস্যা হয়েছে: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    // Reset to default
    const handleReset = () => {
        if (confirm('আপনি কি ডিফল্ট ফেভিকনে ফিরে যেতে চান?')) {
            dispatch(resetFavicon())
            setPreviewUrl('/favicon.ico')
            setApplePreviewUrl('/apple-icon.png')
            setFileMeta({
                name: 'default-favicon.ico',
                size: 'Default',
                type: 'ICO',
            })
            setSelectedPresetId(null)
            toast.success('ডিফল্ট ফেভিকন রিস্টোর করা হয়েছে!')
        }
    }

    const hasUnsavedChanges = previewUrl !== currentFaviconState.faviconUrl

    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium tracking-wide">
                            <Sparkles size={14} className="text-yellow-300" />
                            <span>Branding & Browser Tab Identity</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Favicon Management (ফেভিকন ম্যানেজমেন্ট)
                        </h1>
                        <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
                            ওয়েবসাইটের ব্রাউজার ট্যাব আইকন (Favicon) এবং মোবাইল হোম-স্ক্রিন আইকন সহজে আপলোড, পরিবর্তন, প্রিভিউ ও রিয়েলটাইমে আপডেট করুন। পরিবর্তন করামাত্রই পুরো ওয়েবসাইটে লাইভ প্রয়োগ হবে।
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/"
                            target="_blank"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition backdrop-blur-sm border border-white/20"
                        >
                            <ExternalLink size={16} />
                            <span>ওয়েবসাইট ভিজিট করুন</span>
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-semibold shadow-md hover:shadow-lg transition transform active:scale-95 disabled:opacity-75 cursor-pointer"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span>সংরক্ষণ হচ্ছে...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>আপডেট ও সেভ করুন</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick status bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Globe size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">লাইভ স্ট্যাটাস</p>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            সক্রিয় (Active)
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                    <div className="truncate">
                        <p className="text-xs text-slate-500 font-medium">ফাইল ফরম্যাট</p>
                        <p className="text-sm font-bold text-slate-800 truncate">
                            {fileMeta.type || 'PNG / ICO'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Layers size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">ফাইল সাইজ</p>
                        <p className="text-sm font-bold text-slate-800">
                            {fileMeta.size || 'Optimized'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">ক্যাশ সিঙ্ক</p>
                        <p className="text-sm font-bold text-slate-800">
                            রিয়েল-টাইম (0ms)
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid: Editor on Left, Live Mockup on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Upload & Settings Area (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Upload Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Upload size={20} className="text-emerald-600" />
                                    <span>ফেভিকন আপলোড ও পরিবর্তন</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    আপনার লোগো বা আইকন ড্র্যাগ করুন বা ক্লিক করে ফাইল পছন্দ করুন
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                            >
                                <Link2 size={14} />
                                <span>{showUrlInput ? 'ফাইল আপলোড' : 'ইমেজ URL ব্যবহার'}</span>
                            </button>
                        </div>

                        {showUrlInput ? (
                            /* URL Input Mode */
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <label className="block text-xs font-semibold text-slate-700">
                                    সরাসরি ফেভিকন ইমেজ URL (Cloudinary / CDN):
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={customUrlInput}
                                        onChange={(e) => setCustomUrlInput(e.target.value)}
                                        placeholder="https://example.com/logo.png"
                                        className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyCustomUrl}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition cursor-pointer"
                                    >
                                        প্রয়োগ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Drag & Drop Upload Zone */
                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer group ${
                                    dragActive
                                        ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                                        : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/70'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".png,.ico,.svg,.webp,.jpg,.jpeg,image/png,image/x-icon,image/svg+xml,image/webp,image/jpeg"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    className="hidden"
                                />

                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition duration-200 shadow-xs">
                                        {isProcessing ? (
                                            <RefreshCw size={28} className="animate-spin text-emerald-600" />
                                        ) : (
                                            <Upload size={28} />
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {isProcessing ? 'অপ্টিমাইজ করা হচ্ছে...' : 'ক্লিক করে ফাইল আপলোড করুন অথবা টেনে আনুন'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            সমর্থিত ফরম্যাট: <span className="font-semibold text-slate-700">PNG, ICO, SVG, WEBP, JPG</span> (সর্বোচ্চ 5MB)
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                        <CheckCircle2 size={12} className="text-emerald-600" />
                                        <span>প্রস্তাবিত সাইজ: 32x32, 64x64 বা 512x512 স্কয়ার অনুপাত</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pre-made Presets */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-amber-500" />
                                    <span>প্রিমেড রেডি আইকন প্রিসেট (1-ক্লিক নির্বাচন)</span>
                                </label>
                                <span className="text-[11px] text-slate-500">তাত্ক্ষণিক ব্যবহারের জন্য</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {FAVICON_PRESETS.map((preset) => {
                                    const isSelected = selectedPresetId === preset.id
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => handleSelectPreset(preset)}
                                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                                                isSelected
                                                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-xs border border-black/5"
                                                dangerouslySetInnerHTML={{ __html: preset.svg }}
                                            />
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-slate-800 truncate">
                                                    {preset.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium">
                                                    {preset.category}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Preferences / Options */}
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={syncAppleTouch}
                                    onChange={(e) => setSyncAppleTouch(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div className="text-xs">
                                    <span className="font-semibold text-slate-800 group-hover:text-emerald-600 transition">
                                        Apple Touch Icon হিসেবেও একই আইকন সেট করুন
                                    </span>
                                    <p className="text-slate-500 text-[11px]">
                                        মোবাইল হোম-স্ক্রিন ও বুকমার্কের জন্য 180x180 সাইজে অটোমেটিক অপ্টিমাইজ হবে।
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={liveTabTesting}
                                    onChange={(e) => setLiveTabTesting(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div className="text-xs">
                                    <span className="font-semibold text-slate-800 group-hover:text-emerald-600 transition">
                                        বর্তমান ব্রাউজার ট্যাবে এখনই লাইভ টেস্ট করুন (Live Tab Test)
                                    </span>
                                    <p className="text-slate-500 text-[11px]">
                                        উপরে ব্রাউজারের ট্যাবের দিকে তাকালে সরাসরি এই আইকনটির পরিবর্তন দেখতে পাবেন।
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Reset & Quick Links Card */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
                                <RotateCcw size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">ডিফল্ট ফেভিকন রিস্টোর</p>
                                <p className="text-xs text-slate-500">আগের মূল আইকনে ফেরত যেতে চান?</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shrink-0"
                        >
                            রিসেট টু ডিফল্ট
                        </button>
                    </div>
                </div>

                {/* Right: Realistic Browser Mockup & Live Previews (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Browser Mockup Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Laptop size={18} className="text-slate-600" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    লাইভ ব্রাউজার প্রিভিউ (Live Browser Tab)
                                </span>
                            </div>

                            {/* Light / Dark Mode toggle for browser tab */}
                            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs">
                                <button
                                    type="button"
                                    onClick={() => setTabTheme('light')}
                                    className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition ${
                                        tabTheme === 'light'
                                            ? 'bg-white text-slate-900 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Sun size={12} />
                                    <span>লাইট</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTabTheme('dark')}
                                    className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition ${
                                        tabTheme === 'dark'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Moon size={12} />
                                    <span>ডার্ক</span>
                                </button>
                            </div>
                        </div>

                        {/* Realistic Browser Window */}
                        <div className={`p-4 transition-colors ${tabTheme === 'dark' ? 'bg-[#181a1f]' : 'bg-[#e7eaed]'}`}>
                            {/* Browser Top Window Chrome */}
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                                </div>
                            </div>

                            {/* Browser Tab Bar */}
                            <div className="flex items-end gap-1 px-1 overflow-hidden">
                                {/* Active Tab */}
                                <div
                                    className={`relative flex items-center gap-2 px-3 py-2 rounded-t-xl text-xs font-medium max-w-[240px] shadow-xs transition ${
                                        tabTheme === 'dark'
                                            ? 'bg-[#292a2d] text-slate-200'
                                            : 'bg-white text-slate-800'
                                    }`}
                                >
                                    {/* Favicon Display */}
                                    <img
                                        src={previewUrl}
                                        alt="Tab Favicon"
                                        className="w-4 h-4 object-contain shrink-0 rounded-xs"
                                        onError={(e) => { e.currentTarget.src = '/favicon.ico' }}
                                    />
                                    <span className="truncate text-[11px] font-semibold">
                                        {siteTitle}
                                    </span>
                                    <X size={12} className="shrink-0 ml-auto opacity-60 hover:opacity-100 cursor-pointer" />
                                </div>

                                {/* Inactive Tab */}
                                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-[11px] opacity-60 max-w-[130px] ${
                                    tabTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                                }`}>
                                    <span className="truncate">New Tab</span>
                                </div>

                                <div className={`px-2 py-1 text-sm font-bold opacity-60 ${tabTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                    +
                                </div>
                            </div>

                            {/* Browser Address Bar */}
                            <div className={`p-2 rounded-b-xl flex items-center gap-2 text-xs border-t transition ${
                                tabTheme === 'dark'
                                    ? 'bg-[#292a2d] border-[#383a40] text-slate-300'
                                    : 'bg-white border-slate-200 text-slate-600'
                            }`}>
                                <div className="flex items-center gap-2 opacity-50 px-1">
                                    <span className="cursor-pointer">&larr;</span>
                                    <span className="cursor-pointer">&rarr;</span>
                                    <RefreshCw size={11} className="cursor-pointer" />
                                </div>

                                <div className={`flex-1 flex items-center gap-2 px-3 py-1 rounded-full text-[11px] ${
                                    tabTheme === 'dark' ? 'bg-[#1e1f22] text-slate-300' : 'bg-slate-100 text-slate-700'
                                }`}>
                                    <span className="text-emerald-500 text-xs">🔒</span>
                                    <span className="font-mono truncate">https://ourstorebd.shop</span>
                                </div>
                            </div>

                            {/* Page Content Simulator */}
                            <div className={`p-5 rounded-b-lg mt-1 space-y-3 transition ${
                                tabTheme === 'dark' ? 'bg-[#202124] text-slate-300' : 'bg-white text-slate-700'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={previewUrl}
                                        alt="Brand Logo"
                                        className="w-8 h-8 rounded-lg object-contain shadow-xs border border-slate-200/50"
                                        onError={(e) => { e.currentTarget.src = '/favicon.ico' }}
                                    />
                                    <div>
                                        <p className="text-xs font-bold">Our Store BD</p>
                                        <p className="text-[10px] opacity-60">Best Electronics & Gadgets</p>
                                    </div>
                                </div>
                                <div className="h-2 w-3/4 rounded-full bg-slate-200/50" />
                                <div className="h-2 w-1/2 rounded-full bg-slate-200/30" />
                            </div>
                        </div>

                        {/* Title text editor for mockup */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Eye size={13} className="text-emerald-600" />
                                <span>প্রিভিউ ব্রাউজার ট্যাব টাইটেল:</span>
                            </label>
                            <input
                                type="text"
                                value={siteTitle}
                                onChange={(e) => setSiteTitle(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Our Store BD - Best Electronics & Gadgets"
                            />
                        </div>
                    </div>

                    {/* Multi-Resolution Matrix Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Sliders size={16} className="text-emerald-600" />
                                <span>বিভিন্ন সাইজে রেজোলিউশন প্রিভিউ (Resolution Grid)</span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                ক্ষুদ্র থেকে বৃহদাকার সব রেজোলিউশনে আইকনটি স্পষ্ট দেখাচ্ছে কি না তা যাচাই করুন
                            </p>
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-center">
                            {/* 16x16 */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-slate-500">16x16</span>
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt="16x16"
                                        className="w-4 h-4 object-contain"
                                        onError={(e) => { e.currentTarget.src = '/favicon.ico' }}
                                    />
                                </div>
                                <span className="text-[9px] text-slate-400">ট্যাব আইকন</span>
                            </div>

                            {/* 32x32 */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-slate-500">32x32</span>
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt="32x32"
                                        className="w-6 h-6 object-contain"
                                        onError={(e) => { e.currentTarget.src = '/favicon.ico' }}
                                    />
                                </div>
                                <span className="text-[9px] text-slate-400">রেটিনা ট্যাব</span>
                            </div>

                            {/* 48x48 */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-slate-500">48x48</span>
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt="48x48"
                                        className="w-7 h-7 object-contain"
                                        onError={(e) => { e.currentTarget.src = '/favicon.ico' }}
                                    />
                                </div>
                                <span className="text-[9px] text-slate-400">ডেস্কটপ</span>
                            </div>

                            {/* 64x64 */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-slate-500">64x64</span>
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt="64x64"
                                        className="w-8 h-8 object-contain"
                                        onError={(e) => { e.currentTarget.src = '/favicon.ico' }}
                                    />
                                </div>
                                <span className="text-[9px] text-slate-400">হাই-ডিপিআই</span>
                            </div>
                        </div>

                        {/* Apple Touch / Mobile App Icon */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center gap-4">
                            <div className="relative">
                                <img
                                    src={applePreviewUrl || previewUrl}
                                    alt="Apple Touch Icon"
                                    className="w-14 h-14 rounded-2xl object-cover shadow-md border border-white"
                                    onError={(e) => { e.currentTarget.src = '/apple-icon.png' }}
                                />
                                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                                    ✓
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Smartphone size={14} className="text-slate-600" />
                                    <span>Apple Touch Icon (180x180)</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    স্মার্টফোনে গ্রাহকরা হোম-স্ক্রিনে সাইটটি সেভ করলে এই সুন্দর অ্যাপ আইকনটি দেখতে পাবেন।
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Save CTA Card */}
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-emerald-900">
                                {hasUnsavedChanges ? 'পরিবর্তন সংরক্ষণ করুন' : 'ফেভিকন প্রস্তুত'}
                            </p>
                            <p className="text-xs text-emerald-700 mt-0.5">
                                {hasUnsavedChanges
                                    ? 'আপনার নির্বাচিত ফেভিকন পুরো সাইটে প্রয়োগ করতে সেভ করুন।'
                                    : 'বর্তমান ফেভিকন সক্রিয় রয়েছে।'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition transform active:scale-95 disabled:opacity-75 cursor-pointer flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span>সেভ হচ্ছে...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>আপডেট ও সেভ</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
