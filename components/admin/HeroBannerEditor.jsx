'use client'

import React, { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateHero, resetHero, defaultHeroData } from '@/lib/features/hero/heroSlice'
import { heroBgPresets } from '@/components/Hero'
import { assets } from '@/assets/assets'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
    SaveIcon, RotateCcwIcon, UploadIcon, EyeIcon, SmartphoneIcon,
    MonitorIcon, CheckCircle2Icon, AlertCircleIcon, ExternalLinkIcon,
    SparklesIcon, LayersIcon, PaletteIcon, TagIcon, TypeIcon, ImageIcon,
    SlidersIcon, ArrowRightIcon, ChevronRightIcon, HelpCircleIcon
} from 'lucide-react'

// Compress uploaded image via HTML5 canvas to prevent localStorage quota exhaustion
const compressImage = (file, maxWidth = 900, maxHeight = 900, quality = 0.85) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = document.createElement('img')
            img.src = event.target.result
            img.onload = () => {
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width)
                        width = maxWidth
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height)
                        height = maxHeight
                    }
                }

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                // Output as compressed JPEG or PNG
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
                resolve(compressedDataUrl)
            }
            img.onerror = (err) => reject(err)
        }
        reader.onerror = (err) => reject(err)
    })
}

export default function HeroBannerEditor() {
    const dispatch = useDispatch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const heroState = useSelector(state => state.hero) || defaultHeroData

    // Local draft state initialized from Redux
    const [draft, setDraft] = useState(() => ({
        showHero: heroState.showHero !== undefined ? heroState.showHero : defaultHeroData.showHero,
        showMarquee: heroState.showMarquee !== undefined ? heroState.showMarquee : defaultHeroData.showMarquee,
        mainBanner: { ...defaultHeroData.mainBanner, ...(heroState.mainBanner || {}) },
        sideCard1: { ...defaultHeroData.sideCard1, ...(heroState.sideCard1 || {}) },
        sideCard2: { ...defaultHeroData.sideCard2, ...(heroState.sideCard2 || {}) },
    }))

    const [activeSubTab, setActiveSubTab] = useState('main') // 'main' | 'card1' | 'card2' | 'settings'
    const [previewDevice, setPreviewDevice] = useState('desktop') // 'desktop' | 'mobile'
    const [showResetModal, setShowResetModal] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // File input refs
    const mainImgInputRef = useRef(null)
    const card1ImgInputRef = useRef(null)
    const card2ImgInputRef = useRef(null)

    // Handlers for updating deep nested state
    const updateMainBanner = (fields) => {
        setDraft(prev => ({
            ...prev,
            mainBanner: { ...prev.mainBanner, ...fields }
        }))
    }

    const updateSideCard1 = (fields) => {
        setDraft(prev => ({
            ...prev,
            sideCard1: { ...prev.sideCard1, ...fields }
        }))
    }

    const updateSideCard2 = (fields) => {
        setDraft(prev => ({
            ...prev,
            sideCard2: { ...prev.sideCard2, ...fields }
        }))
    }

    // Image Upload Handlers
    const handleImageUpload = async (e, target) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল আপলোড করুন')
            return
        }

        try {
            toast.loading('ছবি প্রসেস হচ্ছে...', { id: 'img-upload' })
            const compressed = await compressImage(file)
            toast.success('ছবি সফলভাবে আপলোড হয়েছে!', { id: 'img-upload' })

            if (target === 'main') updateMainBanner({ image: compressed })
            else if (target === 'card1') updateSideCard1({ image: compressed })
            else if (target === 'card2') updateSideCard2({ image: compressed })
        } catch (err) {
            toast.error('ছবি আপলোড করতে ব্যর্থ হয়েছে', { id: 'img-upload' })
        }
    }

    // Save changes to Redux & LocalStorage
    const handleSave = () => {
        setIsSaving(true)
        try {
            dispatch(updateHero(draft))
            toast.success('হিরো ব্যানারের সমস্ত পরিবর্তন সফলভাবে সেভ হয়েছে! 🎉')
        } catch (e) {
            toast.error('সেভ করতে সমস্যা হয়েছে')
        } finally {
            setIsSaving(false)
        }
    }

    // Reset to initial default look
    const handleConfirmReset = () => {
        dispatch(resetHero())
        setDraft(JSON.parse(JSON.stringify(defaultHeroData)))
        setShowResetModal(false)
        toast.success('হিরো ব্যানার মূল ডিফল্ট অবস্থায় ফিরিয়ে আনা হয়েছে!')
    }

    const { mainBanner, sideCard1, sideCard2 } = draft

    // Live preview styling helpers
    const previewMainPreset = heroBgPresets[mainBanner.bgPreset] || heroBgPresets.green
    const previewMainBgClass = mainBanner.bgPreset === 'custom' ? '' : (previewMainPreset.class || 'bg-green-200')
    const previewMainBgStyle = mainBanner.bgPreset === 'custom' && mainBanner.bgColor ? { backgroundColor: mainBanner.bgColor } : {}

    const previewCard1Preset = heroBgPresets[sideCard1.bgPreset] || heroBgPresets.orange
    const previewCard1BgClass = sideCard1.bgPreset === 'custom' ? '' : (previewCard1Preset.class || 'bg-orange-200')
    const previewCard1BgStyle = sideCard1.bgPreset === 'custom' && sideCard1.bgColor ? { backgroundColor: sideCard1.bgColor } : {}

    const previewCard2Preset = heroBgPresets[sideCard2.bgPreset] || heroBgPresets.blue
    const previewCard2BgClass = sideCard2.bgPreset === 'custom' ? '' : (previewCard2Preset.class || 'bg-blue-200')
    const previewCard2BgStyle = sideCard2.bgPreset === 'custom' && sideCard2.bgColor ? { backgroundColor: sideCard2.bgColor } : {}

    return (
        <div className="space-y-8">
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                            <SparklesIcon size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">হিরো ব্যানার ফুল এক্সেস (Hero Studio)</h2>
                            <p className="text-xs sm:text-sm text-slate-500">
                                হোমপেজের সম্পূর্ণ হিরো ব্যানার (প্রধান ব্যানার + পাশের দুটি কার্ড) খুব সহজে পরিবর্তন করুন
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        href="/"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                        <ExternalLinkIcon size={14} />
                        ওয়েবসাইট দেখুন
                    </Link>

                    <button
                        onClick={() => setShowResetModal(true)}
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                    >
                        <RotateCcwIcon size={14} />
                        ডিফল্ট রিসেট
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        type="button"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-98 rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                        <SaveIcon size={16} />
                        {isSaving ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
                    </button>
                </div>
            </div>

            {/* Interactive Live Preview Box */}
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
                    <div className="flex items-center gap-2">
                        <EyeIcon size={18} className="text-green-400" />
                        <span className="font-semibold text-sm">লাইভ প্রিভিউ (Live Preview)</span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                            রিয়েল-টাইম আপডেট
                        </span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button
                            type="button"
                            onClick={() => setPreviewDevice('desktop')}
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
                                previewDevice === 'desktop' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <MonitorIcon size={14} />
                            ডেস্কটপ
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewDevice('mobile')}
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
                                previewDevice === 'mobile' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <SmartphoneIcon size={14} />
                            মোবাইল
                        </button>
                    </div>
                </div>

                {/* Preview Frame Container */}
                <div className="flex justify-center items-center py-2 overflow-x-auto">
                    <div
                        className={`transition-all duration-300 bg-white text-slate-800 rounded-2xl p-4 sm:p-6 shadow-inner ${
                            previewDevice === 'mobile'
                                ? 'w-full max-w-[390px] border-4 border-slate-700 rounded-3xl p-3'
                                : 'w-full max-w-5xl'
                        }`}
                    >
                        {!draft.showHero ? (
                            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <AlertCircleIcon className="mx-auto mb-2 text-amber-500" size={28} />
                                <p className="font-semibold text-sm text-slate-600">হিরো ব্যানার বন্ধ করা আছে (Hidden)</p>
                                <p className="text-xs mt-1 text-slate-400">সাধারণ সেটিংস থেকে চালু করুন</p>
                            </div>
                        ) : (
                            <div className={`flex ${previewDevice === 'mobile' ? 'flex-col' : 'max-xl:flex-col'} gap-4`}>
                                {/* Preview: Main Card */}
                                <div
                                    className={`relative flex-1 flex flex-col ${previewMainBgClass} rounded-2xl overflow-hidden group min-h-[260px]`}
                                    style={previewMainBgStyle}
                                >
                                    <div className="p-4 sm:p-8 z-10">
                                        {/* Badge */}
                                        {mainBanner.showBadge && (
                                            <div className={`inline-flex items-center gap-2 ${previewMainPreset.badgeClass || 'bg-green-300 text-green-700'} pr-3 p-1 rounded-full text-xs font-medium mb-2`}>
                                                {mainBanner.badgeTag && (
                                                    <span className={`${previewMainPreset.badgeTag || 'bg-green-600'} px-2.5 py-0.5 rounded-full text-white text-[11px] font-bold`}>
                                                        {mainBanner.badgeTag}
                                                    </span>
                                                )}
                                                <span className="truncate max-w-[200px]">{mainBanner.badgeText}</span>
                                                <ChevronRightIcon size={14} />
                                            </div>
                                        )}

                                        {/* Heading */}
                                        <h2 className="text-xl sm:text-3xl leading-tight my-2 font-bold bg-gradient-to-r from-slate-700 to-[#A0FF74] bg-clip-text text-transparent max-w-sm">
                                            {mainBanner.title || 'শিরোনাম লিখুন'}
                                        </h2>

                                        {/* Price */}
                                        {mainBanner.showPrice && (
                                            <div className="text-slate-800 text-xs font-medium mt-3">
                                                <p className="text-slate-600">{mainBanner.priceLabel}</p>
                                                <p className="text-2xl font-bold">{currency}{mainBanner.priceValue}</p>
                                            </div>
                                        )}

                                        {/* Button */}
                                        {mainBanner.showButton && (
                                            <div className="mt-4">
                                                <span className="inline-block bg-slate-800 text-white text-xs py-2 px-5 rounded-md font-medium shadow-sm">
                                                    {mainBanner.buttonText || 'LEARN MORE'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Main Image */}
                                    {mainBanner.image ? (
                                        <img
                                            className="sm:absolute bottom-0 right-0 md:right-4 w-full sm:max-w-[200px] max-h-52 object-contain z-0 self-end"
                                            src={mainBanner.image}
                                            alt={mainBanner.title}
                                        />
                                    ) : (
                                        <Image
                                            className="sm:absolute bottom-0 right-0 md:right-4 w-full sm:max-w-[200px] object-contain"
                                            src={assets.hero_model_img}
                                            alt="Shop gadgets"
                                        />
                                    )}
                                </div>

                                {/* Preview: Side Cards */}
                                {(sideCard1.showCard || sideCard2.showCard) && (
                                    <div className={`flex ${previewDevice === 'mobile' ? 'flex-col' : 'flex-col sm:flex-row xl:flex-col'} gap-3 w-full ${previewDevice === 'mobile' ? '' : 'xl:max-w-xs'}`}>
                                        {sideCard1.showCard && (
                                            <div
                                                className={`flex-1 flex items-center justify-between p-4 px-5 rounded-2xl ${previewCard1BgClass}`}
                                                style={previewCard1BgStyle}
                                            >
                                                <div>
                                                    <p className="text-lg font-bold bg-gradient-to-r from-slate-800 to-[#FFAD51] bg-clip-text text-transparent">
                                                        {sideCard1.title || 'Best products'}
                                                    </p>
                                                    <p className="flex items-center gap-1 mt-2 text-xs text-slate-600 font-medium">
                                                        {sideCard1.buttonText || 'View more'} <ArrowRightIcon size={14} />
                                                    </p>
                                                </div>
                                                {sideCard1.image ? (
                                                    <img className="w-18 max-h-18 object-contain" src={sideCard1.image} alt={sideCard1.title} />
                                                ) : (
                                                    <Image className="w-18 object-contain" src={assets.hero_product_img1} alt="Product 1" />
                                                )}
                                            </div>
                                        )}

                                        {sideCard2.showCard && (
                                            <div
                                                className={`flex-1 flex items-center justify-between p-4 px-5 rounded-2xl ${previewCard2BgClass}`}
                                                style={previewCard2BgStyle}
                                            >
                                                <div>
                                                    <p className="text-lg font-bold bg-gradient-to-r from-slate-800 to-[#78B2FF] bg-clip-text text-transparent">
                                                        {sideCard2.title || '20% discounts'}
                                                    </p>
                                                    <p className="flex items-center gap-1 mt-2 text-xs text-slate-600 font-medium">
                                                        {sideCard2.buttonText || 'View more'} <ArrowRightIcon size={14} />
                                                    </p>
                                                </div>
                                                {sideCard2.image ? (
                                                    <img className="w-18 max-h-18 object-contain" src={sideCard2.image} alt={sideCard2.title} />
                                                ) : (
                                                    <Image className="w-18 object-contain" src={assets.hero_product_img2} alt="Product 2" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sub Tabs Selector */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
                <button
                    type="button"
                    onClick={() => setActiveSubTab('main')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                        activeSubTab === 'main'
                            ? 'border-green-600 text-green-600 bg-green-50/50 rounded-t-xl'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <SparklesIcon size={16} />
                    ১. প্রধান হিরো ব্যানার (Main Card)
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSubTab('card1')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                        activeSubTab === 'card1'
                            ? 'border-orange-500 text-orange-600 bg-orange-50/50 rounded-t-xl'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <LayersIcon size={16} />
                    ২. ডান পাশের কার্ড ১ ({sideCard1.title})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSubTab('card2')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                        activeSubTab === 'card2'
                            ? 'border-blue-500 text-blue-600 bg-blue-50/50 rounded-t-xl'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <LayersIcon size={16} />
                    ৩. ডান পাশের কার্ড ২ ({sideCard2.title})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSubTab('settings')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                        activeSubTab === 'settings'
                            ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-xl'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <SlidersIcon size={16} />
                    ৪. সাধারণ সেটিংস (Settings)
                </button>
            </div>

            {/* TAB CONTENT 1: Main Banner */}
            {activeSubTab === 'main' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
                    {/* Section 1: Badge Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <TagIcon size={18} className="text-green-600" />
                                <h3 className="font-bold text-slate-800">অফার ব্যাজ সেটিংস (Badge Options)</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={mainBanner.showBadge}
                                    onChange={(e) => updateMainBanner({ showBadge: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                <span className="ml-2 text-xs font-semibold text-slate-600">
                                    {mainBanner.showBadge ? 'চালু আছে' : 'বন্ধ'}
                                </span>
                            </label>
                        </div>

                        {mainBanner.showBadge && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        ব্যাজ ট্যাগ (Badge Tag)
                                    </label>
                                    <input
                                        type="text"
                                        value={mainBanner.badgeTag}
                                        onChange={(e) => updateMainBanner({ badgeTag: e.target.value })}
                                        placeholder="যেমন: NEWS, HOT, OFFER"
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">সবুজ বাটন আকারে প্রদর্শিত হবে</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        ব্যাজ বার্তা (Badge Announcement Text)
                                    </label>
                                    <input
                                        type="text"
                                        value={mainBanner.badgeText}
                                        onChange={(e) => updateMainBanner({ badgeText: e.target.value })}
                                        placeholder="যেমন: Free Shipping on Orders Above ৳500!"
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Headline & Price */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <TypeIcon size={18} className="text-green-600" />
                            <h3 className="font-bold text-slate-800">শিরোনাম ও দাম (Headline & Price)</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    মূল শিরোনাম (Main Title)
                                </label>
                                <textarea
                                    rows={2}
                                    value={mainBanner.title}
                                    onChange={(e) => updateMainBanner({ title: e.target.value })}
                                    placeholder="Gadgets you'll love. Prices you'll trust."
                                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-slate-600">
                                            দামের সেকশন (Price Box)
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={mainBanner.showPrice}
                                                onChange={(e) => updateMainBanner({ showPrice: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        disabled={!mainBanner.showPrice}
                                        value={mainBanner.priceLabel}
                                        onChange={(e) => updateMainBanner({ priceLabel: e.target.value })}
                                        placeholder="Starts from"
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-60"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        শুরুর দাম (Price Amount)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">
                                            {currency}
                                        </span>
                                        <input
                                            type="text"
                                            disabled={!mainBanner.showPrice}
                                            value={mainBanner.priceValue}
                                            onChange={(e) => updateMainBanner({ priceValue: e.target.value })}
                                            placeholder="4.90"
                                            className="w-full pl-8 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-60"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Action Button */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <SparklesIcon size={18} className="text-green-600" />
                                <h3 className="font-bold text-slate-800">অ্যাকশন বাটন (Call-To-Action Button)</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={mainBanner.showButton}
                                    onChange={(e) => updateMainBanner({ showButton: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        {mainBanner.showButton && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        বাটন লেখা (Button Label)
                                    </label>
                                    <input
                                        type="text"
                                        value={mainBanner.buttonText}
                                        onChange={(e) => updateMainBanner({ buttonText: e.target.value })}
                                        placeholder="LEARN MORE"
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        বাটন লিংক (Target Link URL)
                                    </label>
                                    <input
                                        type="text"
                                        value={mainBanner.buttonLink}
                                        onChange={(e) => updateMainBanner({ buttonLink: e.target.value })}
                                        placeholder="/shop অথবা /product/xxx"
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Banner Image Upload */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <ImageIcon size={18} className="text-green-600" />
                            <h3 className="font-bold text-slate-800">প্রধান ব্যানার ছবি (Model Image)</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <div className="w-32 h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0">
                                {mainBanner.image ? (
                                    <img src={mainBanner.image} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <Image src={assets.hero_model_img} alt="Default Model" className="w-full h-full object-contain" />
                                )}
                            </div>

                            <div className="flex-1 space-y-3 w-full">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => mainImgInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
                                    >
                                        <UploadIcon size={14} />
                                        নতুন ছবি আপলোড করুন
                                    </button>

                                    {mainBanner.image && (
                                        <button
                                            type="button"
                                            onClick={() => updateMainBanner({ image: '' })}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                                        >
                                            <RotateCcwIcon size={14} />
                                            অরিজিনাল ছবিতে ফিরুন
                                        </button>
                                    )}

                                    <input
                                        type="file"
                                        ref={mainImgInputRef}
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'main')}
                                        className="hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                        অথবা সরাসরি ছবির URL দিন (Image URL):
                                    </label>
                                    <input
                                        type="url"
                                        value={mainBanner.image}
                                        onChange={(e) => updateMainBanner({ image: e.target.value })}
                                        placeholder="https://example.com/model-image.png"
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    💡 পিএনজি (PNG) ব্যাকগ্রাউন্ড রিমুভড ছবি সবচেয়ে সুন্দর দেখাবে। সাইজ স্বয়ংক্রিয়ভাবে অপটিমাইজ হবে।
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Background Color Theme */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <PaletteIcon size={18} className="text-green-600" />
                            <h3 className="font-bold text-slate-800">ব্যাকগ্রাউন্ড কালার থিম (Color Theme)</h3>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2.5">প্রিসেট কালার নির্বাচন করুন:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {Object.entries(heroBgPresets).map(([key, preset]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => updateMainBanner({ bgPreset: key })}
                                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                                            mainBanner.bgPreset === key
                                                ? 'border-green-600 bg-green-50/50 ring-2 ring-green-500/20 font-bold'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <span
                                            className="w-5 h-5 rounded-full border border-slate-300 shrink-0"
                                            style={{ backgroundColor: preset.hex || '#ffffff' }}
                                        />
                                        <span className="text-xs text-slate-700 truncate">{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {mainBanner.bgPreset === 'custom' && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                                <input
                                    type="color"
                                    value={mainBanner.bgColor || '#bbf7d0'}
                                    onChange={(e) => updateMainBanner({ bgColor: e.target.value })}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                />
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">কাস্টম কালার কোড (Hex)</label>
                                    <input
                                        type="text"
                                        value={mainBanner.bgColor || '#bbf7d0'}
                                        onChange={(e) => updateMainBanner({ bgColor: e.target.value })}
                                        placeholder="#bbf7d0"
                                        className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-md"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT 2: Side Card 1 */}
            {activeSubTab === 'card1' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800">ডান পাশের উপরের কার্ড (Card 1: Best products)</h3>
                            <p className="text-xs text-slate-500">হোমপেজের ডান পাশের প্রথম প্রমোশনাল বক্স</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sideCard1.showCard}
                                onChange={(e) => updateSideCard1({ showCard: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            <span className="ml-2 text-xs font-semibold text-slate-600">
                                {sideCard1.showCard ? 'প্রদর্শন হচ্ছে' : 'লুকানো'}
                            </span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">কার্ড শিরোনাম (Title)</label>
                            <input
                                type="text"
                                value={sideCard1.title}
                                onChange={(e) => updateSideCard1({ title: e.target.value })}
                                placeholder="Best products"
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">বাটন লেখা (Action Text)</label>
                            <input
                                type="text"
                                value={sideCard1.buttonText}
                                onChange={(e) => updateSideCard1({ buttonText: e.target.value })}
                                placeholder="View more"
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">ক্লিক লিংক URL (Link)</label>
                            <input
                                type="text"
                                value={sideCard1.link}
                                onChange={(e) => updateSideCard1({ link: e.target.value })}
                                placeholder="/shop অথবা যেকোনো লিংক"
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Image */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-600 mb-3">কার্ড ১ এর ছবি (Product Image)</label>
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="w-24 h-24 rounded-xl bg-orange-50 border border-orange-200 overflow-hidden flex items-center justify-center relative shrink-0">
                                {sideCard1.image ? (
                                    <img src={sideCard1.image} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <Image src={assets.hero_product_img1} alt="Default AirPods" className="w-full h-full object-contain" />
                                )}
                            </div>

                            <div className="flex-1 space-y-2.5 w-full">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => card1ImgInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
                                    >
                                        <UploadIcon size={14} /> ছবি আপলোড
                                    </button>
                                    {sideCard1.image && (
                                        <button
                                            type="button"
                                            onClick={() => updateSideCard1({ image: '' })}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                                        >
                                            <RotateCcwIcon size={14} /> ডিফল্ট এয়ারপডস ছবি
                                        </button>
                                    )}
                                    <input
                                        type="file"
                                        ref={card1ImgInputRef}
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'card1')}
                                        className="hidden"
                                    />
                                </div>
                                <input
                                    type="url"
                                    value={sideCard1.image}
                                    onChange={(e) => updateSideCard1({ image: e.target.value })}
                                    placeholder="বা ইমেজ URL দিন"
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Color */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-600 mb-2.5">ব্যাকগ্রাউন্ড কালার প্রিসেট:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(heroBgPresets).map(([key, preset]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => updateSideCard1({ bgPreset: key })}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition ${
                                        sideCard1.bgPreset === key
                                            ? 'border-orange-500 bg-orange-50 font-bold'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <span
                                        className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                                        style={{ backgroundColor: preset.hex || '#ffffff' }}
                                    />
                                    <span className="truncate">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 3: Side Card 2 */}
            {activeSubTab === 'card2' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800">ডান পাশের নিচের কার্ড (Card 2: 20% discounts)</h3>
                            <p className="text-xs text-slate-500">হোমপেজের ডান পাশের দ্বিতীয় প্রমোশনাল বক্স</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sideCard2.showCard}
                                onChange={(e) => updateSideCard2({ showCard: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-2 text-xs font-semibold text-slate-600">
                                {sideCard2.showCard ? 'প্রদর্শন হচ্ছে' : 'লুকানো'}
                            </span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">কার্ড শিরোনাম (Title)</label>
                            <input
                                type="text"
                                value={sideCard2.title}
                                onChange={(e) => updateSideCard2({ title: e.target.value })}
                                placeholder="20% discounts"
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">বাটন লেখা (Action Text)</label>
                            <input
                                type="text"
                                value={sideCard2.buttonText}
                                onChange={(e) => updateSideCard2({ buttonText: e.target.value })}
                                placeholder="View more"
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">ক্লিক লিংক URL (Link)</label>
                            <input
                                type="text"
                                value={sideCard2.link}
                                onChange={(e) => updateSideCard2({ link: e.target.value })}
                                placeholder="/shop অথবা যেকোনো লিংক"
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Image */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-600 mb-3">কার্ড ২ এর ছবি (Product Image)</label>
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="w-24 h-24 rounded-xl bg-blue-50 border border-blue-200 overflow-hidden flex items-center justify-center relative shrink-0">
                                {sideCard2.image ? (
                                    <img src={sideCard2.image} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <Image src={assets.hero_product_img2} alt="Default Watch" className="w-full h-full object-contain" />
                                )}
                            </div>

                            <div className="flex-1 space-y-2.5 w-full">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => card2ImgInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
                                    >
                                        <UploadIcon size={14} /> ছবি আপলোড
                                    </button>
                                    {sideCard2.image && (
                                        <button
                                            type="button"
                                            onClick={() => updateSideCard2({ image: '' })}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                                        >
                                            <RotateCcwIcon size={14} /> ডিফল্ট স্মার্টওয়াচ ছবি
                                        </button>
                                    )}
                                    <input
                                        type="file"
                                        ref={card2ImgInputRef}
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'card2')}
                                        className="hidden"
                                    />
                                </div>
                                <input
                                    type="url"
                                    value={sideCard2.image}
                                    onChange={(e) => updateSideCard2({ image: e.target.value })}
                                    placeholder="বা ইমেজ URL দিন"
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Color */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-600 mb-2.5">ব্যাকগ্রাউন্ড কালার প্রিসেট:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(heroBgPresets).map(([key, preset]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => updateSideCard2({ bgPreset: key })}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition ${
                                        sideCard2.bgPreset === key
                                            ? 'border-blue-500 bg-blue-50 font-bold'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <span
                                        className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                                        style={{ backgroundColor: preset.hex || '#ffffff' }}
                                    />
                                    <span className="truncate">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 4: Global Settings */}
            {activeSubTab === 'settings' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-800 pb-3 border-b border-slate-100">
                        সাধারণ সেটিংস (Global Section Controls)
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <p className="font-semibold text-sm text-slate-800">সম্পূর্ণ হিরো সেকশন দৃশ্যমানতা</p>
                                <p className="text-xs text-slate-500">বন্ধ করলে হোমপেজে হিরো ব্যানার প্রদর্শন হবে না</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={draft.showHero}
                                    onChange={(e) => setDraft(prev => ({ ...prev, showHero: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <p className="font-semibold text-sm text-slate-800">ক্যাটাগরি মারকুই স্ক্রলার (Categories Marquee)</p>
                                <p className="text-xs text-slate-500">হিরো ব্যানারের নিচে চলমান ক্যাটাগরি আইকনগুলো অন/অফ করুন</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={draft.showMarquee}
                                    onChange={(e) => setDraft(prev => ({ ...prev, showMarquee: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Save Bar */}
            <div className="sticky bottom-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl flex items-center justify-between z-30">
                <p className="text-xs text-slate-500 hidden sm:block">
                    💡 কোনো কিছু পরিবর্তন করার পর অবশ্যই <strong>"পরিবর্তন সেভ করুন"</strong> বাটনে চাপুন।
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setShowResetModal(true)}
                        type="button"
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                        রিসেট
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        type="button"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:scale-98 rounded-xl shadow-md transition disabled:opacity-50"
                    >
                        <SaveIcon size={16} />
                        {isSaving ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
                    </button>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                            <AlertCircleIcon size={26} />
                        </div>
                        <div className="text-center space-y-1.5">
                            <h3 className="font-bold text-slate-800 text-lg">হিরো ব্যানার রিসেট করতে চান?</h3>
                            <p className="text-xs text-slate-500">
                                আপনার করা সমস্ত কাস্টম লেখা, ছবি ও কালার মুছে গিয়ে সাইটের মূল ডিফল্ট ব্যানার ফিরে আসবে।
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowResetModal(false)}
                                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                            >
                                বাতিল
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmReset}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
                            >
                                হ্যাঁ, রিসেট করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
