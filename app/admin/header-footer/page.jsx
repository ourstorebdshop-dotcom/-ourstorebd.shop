'use client'

import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
    updateHeader,
    addHeaderNavLink,
    updateHeaderNavLink,
    deleteHeaderNavLink,
    toggleHeaderNavLink,
    reorderHeaderNavLinks,
    updateFooter,
    updateFooterBrand,
    updateFooterSocialSettings,
    addFooterSocialLink,
    updateFooterSocialLink,
    deleteFooterSocialLink,
    toggleFooterSocialLink,
    addFooterSection,
    updateFooterSection,
    deleteFooterSection,
    toggleFooterSection,
    addFooterSectionLink,
    updateFooterSectionLink,
    deleteFooterSectionLink,
    toggleFooterSectionLink,
    updateFooterBottomBar,
    resetHeaderFooter,
} from '@/lib/features/headerFooter/headerFooterSlice'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
    LayoutTemplate,
    Compass,
    PanelBottom,
    Eye,
    Plus,
    Trash2,
    Edit3,
    ArrowUp,
    ArrowDown,
    Save,
    RotateCcw,
    Check,
    X,
    ExternalLink,
    Search,
    Heart,
    ShoppingCart,
    User,
    ChevronDown,
    Phone,
    Mail,
    MapPin,
    Share2,
    Shield,
    Sparkles,
    CheckCircle2,
    Layers,
    SlidersHorizontal,
    Globe,
} from 'lucide-react'

// Available social platform definitions with friendly labels
const SOCIAL_PLATFORMS = [
    { key: 'facebook', label: 'Facebook', defaultUrl: 'https://facebook.com' },
    { key: 'instagram', label: 'Instagram', defaultUrl: 'https://instagram.com' },
    { key: 'twitter', label: 'Twitter / X', defaultUrl: 'https://twitter.com' },
    { key: 'linkedin', label: 'LinkedIn', defaultUrl: 'https://linkedin.com' },
    { key: 'youtube', label: 'YouTube', defaultUrl: 'https://youtube.com' },
    { key: 'whatsapp', label: 'WhatsApp', defaultUrl: 'https://wa.me/8801712345678' },
    { key: 'tiktok', label: 'TikTok', defaultUrl: 'https://tiktok.com' },
    { key: 'telegram', label: 'Telegram', defaultUrl: 'https://t.me/' },
    { key: 'pinterest', label: 'Pinterest', defaultUrl: 'https://pinterest.com' },
]

export default function AdminHeaderFooterPage() {
    const dispatch = useDispatch()
    const headerFooterState = useSelector(state => state.headerFooter)

    const header = headerFooterState?.header || {}
    const footer = headerFooterState?.footer || {}

    // Tabs: 'header' | 'footer' | 'preview'
    const [activeTab, setActiveTab] = useState('header')

    // Local form copies for smooth editing
    const [headerForm, setHeaderForm] = useState(header)
    const [footerForm, setFooterForm] = useState(footer)

    // Modals & Popups
    const [showAddNavModal, setShowAddNavModal] = useState(false)
    const [editingNavId, setEditingNavId] = useState(null)
    const [navFormData, setNavFormData] = useState({ label: '', path: '/', isExternal: false, isEnabled: true })

    const [showAddSocialModal, setShowAddSocialModal] = useState(false)
    const [editingSocialId, setEditingSocialId] = useState(null)
    const [socialFormData, setSocialFormData] = useState({ platform: 'facebook', name: 'Facebook', url: 'https://', isEnabled: true })

    const [showAddSectionModal, setShowAddSectionModal] = useState(false)
    const [sectionTitleInput, setSectionTitleInput] = useState('')

    const [activeSectionForLink, setActiveSectionForLink] = useState(null)
    const [sectionLinkFormData, setSectionLinkFormData] = useState({ text: '', path: '/', iconType: 'none', isEnabled: true })
    const [editingSectionLinkId, setEditingSectionLinkId] = useState(null)

    const [showResetConfirm, setShowResetConfirm] = useState(false)

    // Sync local state when Redux state updates
    useEffect(() => {
        if (header) setHeaderForm(header)
        if (footer) setFooterForm(footer)
    }, [header, footer])

    // =========================================================================
    // HEADER ACTIONS
    // =========================================================================
    const handleSaveHeader = (e) => {
        if (e) e.preventDefault()
        dispatch(updateHeader({
            logoType: headerForm.logoType,
            logoTextPrefix: headerForm.logoTextPrefix,
            logoTextMiddle: headerForm.logoTextMiddle,
            logoTextSuffix: headerForm.logoTextSuffix,
            logoImageUrl: headerForm.logoImageUrl,
            showSearch: headerForm.showSearch,
            searchPlaceholder: headerForm.searchPlaceholder,
            showCategoriesDropdown: headerForm.showCategoriesDropdown,
            categoriesDropdownLabel: headerForm.categoriesDropdownLabel,
            categoriesDropdownAllText: headerForm.categoriesDropdownAllText,
            showWishlist: headerForm.showWishlist,
            wishlistLabel: headerForm.wishlistLabel,
            showCart: headerForm.showCart,
            cartLabel: headerForm.cartLabel,
            showLogin: headerForm.showLogin,
            loginLabel: headerForm.loginLabel,
            isSticky: headerForm.isSticky,
        }))
        toast.success('হেডার সেটিংস সফলভাবে সংরক্ষিত ও লাইভ আপডেট হয়েছে!')
    }

    const openAddNavModal = () => {
        setEditingNavId(null)
        setNavFormData({ label: '', path: '/', isExternal: false, isEnabled: true })
        setShowAddNavModal(true)
    }

    const openEditNavModal = (link) => {
        setEditingNavId(link.id)
        setNavFormData({
            label: link.label,
            path: link.path,
            isExternal: !!link.isExternal,
            isEnabled: link.isEnabled !== false,
        })
        setShowAddNavModal(true)
    }

    const handleSaveNavLink = (e) => {
        e.preventDefault()
        if (!navFormData.label.trim()) {
            toast.error('লিংক লেবেল লিখুন')
            return
        }
        if (!navFormData.path.trim()) {
            toast.error('লিংক পাথ/URL লিখুন')
            return
        }

        if (editingNavId) {
            dispatch(updateHeaderNavLink({
                id: editingNavId,
                updates: { ...navFormData }
            }))
            toast.success('ন্যাভিগেশন লিংক আপডেট হয়েছে')
        } else {
            dispatch(addHeaderNavLink({ ...navFormData }))
            toast.success('নতুন ন্যাভিগেশন লিংক যুক্ত হয়েছে')
        }
        setShowAddNavModal(false)
    }

    const handleMoveNav = (index, direction) => {
        const links = [...(header.navLinks || [])]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= links.length) return
        const temp = links[index]
        links[index] = links[targetIndex]
        links[targetIndex] = temp
        dispatch(reorderHeaderNavLinks(links))
    }

    // =========================================================================
    // FOOTER ACTIONS
    // =========================================================================
    const handleSaveFooter = (e) => {
        if (e) e.preventDefault()
        dispatch(updateFooter({
            showFooter: footerForm.showFooter,
            brand: {
                showBrand: footerForm.brand?.showBrand,
                titlePrefix: footerForm.brand?.titlePrefix,
                titleMiddle: footerForm.brand?.titleMiddle,
                titleSuffix: footerForm.brand?.titleSuffix,
                logoUrl: footerForm.brand?.logoUrl,
                description: footerForm.brand?.description,
            },
            social: {
                showSocial: footerForm.social?.showSocial,
                links: footer.social?.links || [],
            },
            bottomBar: {
                showBottomBar: footerForm.bottomBar?.showBottomBar,
                copyrightText: footerForm.bottomBar?.copyrightText,
                showBadges: footerForm.bottomBar?.showBadges,
                badgesText: footerForm.bottomBar?.badgesText,
            }
        }))
        toast.success('ফুটার সেটিংস সফলভাবে সংরক্ষিত ও লাইভ আপডেট হয়েছে!')
    }

    // Social Links Handlers
    const openAddSocialModal = () => {
        setEditingSocialId(null)
        setSocialFormData({ platform: 'facebook', name: 'Facebook', url: 'https://facebook.com', isEnabled: true })
        setShowAddSocialModal(true)
    }

    const openEditSocialModal = (soc) => {
        setEditingSocialId(soc.id)
        setSocialFormData({
            platform: soc.platform || 'facebook',
            name: soc.name || 'Social',
            url: soc.url || 'https://',
            isEnabled: soc.isEnabled !== false,
        })
        setShowAddSocialModal(true)
    }

    const handleSaveSocialLink = (e) => {
        e.preventDefault()
        if (!socialFormData.url.trim()) {
            toast.error('সোশ্যাল প্রোফাইল URL প্রদান করুন')
            return
        }

        const foundPlatform = SOCIAL_PLATFORMS.find(p => p.key === socialFormData.platform)
        const finalName = socialFormData.name.trim() || foundPlatform?.label || 'Social Link'

        if (editingSocialId) {
            dispatch(updateFooterSocialLink({
                id: editingSocialId,
                updates: {
                    platform: socialFormData.platform,
                    name: finalName,
                    url: socialFormData.url.trim(),
                    isEnabled: socialFormData.isEnabled,
                }
            }))
            toast.success('সোশ্যাল লিংক আপডেট হয়েছে')
        } else {
            dispatch(addFooterSocialLink({
                platform: socialFormData.platform,
                name: finalName,
                url: socialFormData.url.trim(),
                isEnabled: socialFormData.isEnabled,
            }))
            toast.success('নতুন সোশ্যাল লিংক যুক্ত হয়েছে')
        }
        setShowAddSocialModal(false)
    }

    // Section Handlers
    const handleAddSection = (e) => {
        e.preventDefault()
        if (!sectionTitleInput.trim()) {
            toast.error('কলাম/সেকশন টাইটেল দিন')
            return
        }
        dispatch(addFooterSection({
            title: sectionTitleInput.trim(),
            links: []
        }))
        setSectionTitleInput('')
        setShowAddSectionModal(false)
        toast.success('নতুন ফুটার কলাম তৈরি হয়েছে')
    }

    const openAddSectionLink = (sectionId) => {
        setActiveSectionForLink(sectionId)
        setEditingSectionLinkId(null)
        setSectionLinkFormData({ text: '', path: '/', iconType: 'none', isEnabled: true })
    }

    const openEditSectionLink = (sectionId, link) => {
        setActiveSectionForLink(sectionId)
        setEditingSectionLinkId(link.id)
        setSectionLinkFormData({
            text: link.text,
            path: link.path,
            iconType: link.iconType || 'none',
            isEnabled: link.isEnabled !== false,
        })
    }

    const handleSaveSectionLink = (e) => {
        e.preventDefault()
        if (!sectionLinkFormData.text.trim()) {
            toast.error('লিংক টেক্সট দিন')
            return
        }
        if (!sectionLinkFormData.path.trim()) {
            toast.error('লিংক পাথ বা URL দিন')
            return
        }

        if (editingSectionLinkId) {
            dispatch(updateFooterSectionLink({
                sectionId: activeSectionForLink,
                linkId: editingSectionLinkId,
                updates: { ...sectionLinkFormData }
            }))
            toast.success('লিংক আপডেট হয়েছে')
        } else {
            dispatch(addFooterSectionLink({
                sectionId: activeSectionForLink,
                link: { ...sectionLinkFormData }
            }))
            toast.success('কলামে নতুন লিংক যুক্ত হয়েছে')
        }
        setActiveSectionForLink(null)
        setEditingSectionLinkId(null)
    }

    const handleResetAll = () => {
        dispatch(resetHeaderFooter())
        toast.success('হেডার ও ফুটার ডিফল্ট সেটিংসে রিসেট হয়েছে!')
        setShowResetConfirm(false)
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
            {/* Top Title Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
                        <LayoutTemplate className="text-green-600" />
                        <span>Header & Footer Manager (হেডার ও ফুটার কন্ট্রোল)</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        ওয়েবসাইটের সম্পূর্ণ হেডার মেনু, লোগো, ফুটার কলাম, সোশ্যাল আইকন ও কপিরাইট সম্পূর্ণ কন্ট্রোল করুন।
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                        title="সব ডিফল্ট অবস্থায় ফিরিয়ে নিন"
                    >
                        <RotateCcw size={15} />
                        <span>Reset Defaults</span>
                    </button>
                    <Link
                        href="/"
                        target="_blank"
                        className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <Eye size={15} />
                        <span>View Live Store</span>
                    </Link>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
                <button
                    onClick={() => setActiveTab('header')}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                        activeTab === 'header'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Compass size={17} className={activeTab === 'header' ? 'text-green-600' : 'text-slate-400'} />
                    <span>Header Settings (হেডার কন্ট্রোল)</span>
                </button>

                <button
                    onClick={() => setActiveTab('footer')}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                        activeTab === 'footer'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <PanelBottom size={17} className={activeTab === 'footer' ? 'text-green-600' : 'text-slate-400'} />
                    <span>Footer Settings (ফুটার কন্ট্রোল)</span>
                </button>

                <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                        activeTab === 'preview'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Eye size={17} className={activeTab === 'preview' ? 'text-green-600' : 'text-slate-400'} />
                    <span>Live Preview (লাইভ প্রিভিউ)</span>
                </button>

                <Link
                    href="/admin/favicon"
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 text-emerald-700 hover:text-emerald-900 hover:bg-white/80"
                >
                    <Globe size={17} className="text-emerald-600" />
                    <span>Favicon Settings (ফেভিকন) &rarr;</span>
                </Link>
            </div>

            {/* ================================================================= */}
            {/* TAB 1: HEADER SETTINGS */}
            {/* ================================================================= */}
            {activeTab === 'header' && (
                <div className="space-y-8">
                    {/* Favicon Callout */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <Globe size={20} />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-bold">ব্রাউজার ট্যাব আইকন (Favicon) পরিবর্তন করতে চান?</p>
                                <p className="text-[11px] text-emerald-700">ওয়েবসাইটের ব্রাউজার ট্যাব ও মোবাইল বুকমার্ক আইকন আপলোড ও লাইভ প্রিভিউ করুন।</p>
                            </div>
                        </div>
                        <Link
                            href="/admin/favicon"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shrink-0 self-start sm:self-auto shadow-xs"
                        >
                            <span>ফেভিকন ম্যানেজমেন্ট</span>
                            <span>&rarr;</span>
                        </Link>
                    </div>

                    {/* Section: Brand & Logo Controls */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles size={18} className="text-green-600" />
                                    <span>Brand Logo & Name (হেডার লোগো ও নাম)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    হেডারের ব্র্যান্ড টেক্সট অথবা ইমেজ লোগো নির্ধারণ করুন।
                                </p>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                                Realtime Active
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Logo Type Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">লোগোর ধরন (Logo Display Type)</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 flex-1">
                                        <input
                                            type="radio"
                                            name="logoType"
                                            value="text"
                                            checked={headerForm.logoType === 'text'}
                                            onChange={() => setHeaderForm({ ...headerForm, logoType: 'text' })}
                                            className="text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-xs font-semibold text-slate-800">টেক্সট ব্র্যান্ড (Stylized Text)</span>
                                    </label>

                                    <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 flex-1">
                                        <input
                                            type="radio"
                                            name="logoType"
                                            value="image"
                                            checked={headerForm.logoType === 'image'}
                                            onChange={() => setHeaderForm({ ...headerForm, logoType: 'image' })}
                                            className="text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-xs font-semibold text-slate-800">ইমেজ লোগো (Custom Image)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Sticky Header Toggle */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">স্টিকি হেডার (Sticky Navbar on Scroll)</label>
                                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">পৃষ্ঠা স্ক্রল করার সময় হেডার উপরে আটকে থাকবে</p>
                                        <p className="text-[11px] text-slate-500">Enable sticky positioning</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHeaderForm({ ...headerForm, isSticky: !headerForm.isSticky })}
                                        className={`w-12 h-6 rounded-full transition relative cursor-pointer ${
                                            headerForm.isSticky ? 'bg-green-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform shadow-xs ${
                                            headerForm.isSticky ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Text Logo Inputs */}
                        {headerForm.logoType === 'text' ? (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <p className="text-xs font-bold text-slate-700">টেক্সট ব্র্যান্ড নাম পার্টসমূহ (Custom Logo Text Parts):</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Prefix (সবুজ রঙ)</label>
                                        <input
                                            type="text"
                                            value={headerForm.logoTextPrefix || ''}
                                            onChange={(e) => setHeaderForm({ ...headerForm, logoTextPrefix: e.target.value })}
                                            placeholder="Our"
                                            className="w-full p-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Middle (কালো রঙ)</label>
                                        <input
                                            type="text"
                                            value={headerForm.logoTextMiddle || ''}
                                            onChange={(e) => setHeaderForm({ ...headerForm, logoTextMiddle: e.target.value })}
                                            placeholder="Store"
                                            className="w-full p-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Suffix (সবুজ রঙ)</label>
                                        <input
                                            type="text"
                                            value={headerForm.logoTextSuffix || ''}
                                            onChange={(e) => setHeaderForm({ ...headerForm, logoTextSuffix: e.target.value })}
                                            placeholder="BD"
                                            className="w-full p-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 flex items-center gap-2 text-xs text-slate-600">
                                    <span className="font-semibold">প্রিভিউ:</span>
                                    <div className="text-xl font-bold tracking-tight">
                                        <span className="text-green-600">{headerForm.logoTextPrefix || 'Our'}</span>{' '}
                                        <span className="text-slate-800">{headerForm.logoTextMiddle || 'Store'}</span>{' '}
                                        <span className="text-green-600">{headerForm.logoTextSuffix || 'BD'}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <label className="block text-xs font-bold text-slate-700">কাস্টম ইমেজ লোগো URL (Image Logo URL):</label>
                                <input
                                    type="text"
                                    value={headerForm.logoImageUrl || ''}
                                    onChange={(e) => setHeaderForm({ ...headerForm, logoImageUrl: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full p-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
                                />
                                {headerForm.logoImageUrl && (
                                    <div className="p-3 bg-white border rounded-xl inline-block">
                                        <img src={headerForm.logoImageUrl} alt="Logo preview" className="max-h-10 object-contain" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section: Navigation Menu Builder */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Compass size={18} className="text-green-600" />
                                    <span>Main Navigation Menu Builder (হেডার মেনু লিংকসমূহ)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    মেনু আইটেম যোগ করুন, সাজান, এডিট বা অন/অফ করুন।
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddNavModal}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                            >
                                <Plus size={16} />
                                <span>নতুন মেনু লিংক যোগ করুন</span>
                            </button>
                        </div>

                        {/* Special Category Dropdown Quick Toggle */}
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                                    <ChevronDown size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Categories Dropdown Menu (ক্যাটাগরি ড্রপডাউন)</p>
                                    <p className="text-[11px] text-slate-500">
                                        ক্যাটাগরি ড্রপডাউন মেনু হেডারে দেখাবে কি না তা নির্ধারণ করুন।
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={headerForm.categoriesDropdownLabel || ''}
                                    onChange={(e) => setHeaderForm({ ...headerForm, categoriesDropdownLabel: e.target.value })}
                                    placeholder="Categories"
                                    className="p-2 text-xs bg-white border border-slate-200 rounded-xl w-32 outline-none focus:border-green-500"
                                    title="ড্রপডাউনের নাম পরিবর্তন করুন"
                                />
                                <button
                                    type="button"
                                    onClick={() => setHeaderForm({ ...headerForm, showCategoriesDropdown: !headerForm.showCategoriesDropdown })}
                                    className={`w-12 h-6 rounded-full transition relative cursor-pointer ${
                                        headerForm.showCategoriesDropdown ? 'bg-green-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform shadow-xs ${
                                        headerForm.showCategoriesDropdown ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        {/* Nav Items Table/List */}
                        <div className="space-y-2">
                            {(header.navLinks || []).length === 0 ? (
                                <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                                    কোনো মেনু লিংক নেই। নতুন লিংক যোগ করুন।
                                </div>
                            ) : (
                                (header.navLinks || []).map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                                            item.isEnabled ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-50 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveNav(idx, 'up')}
                                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                                    title="উপরে নিন"
                                                >
                                                    <ArrowUp size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === (header.navLinks || []).length - 1}
                                                    onClick={() => handleMoveNav(idx, 'down')}
                                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                                    title="নিচে নিন"
                                                >
                                                    <ArrowDown size={12} />
                                                </button>
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{item.label}</p>
                                                    {item.isExternal && (
                                                        <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-md font-semibold flex items-center gap-1">
                                                            External <ExternalLink size={10} />
                                                        </span>
                                                    )}
                                                    {!item.isEnabled && (
                                                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-md font-semibold">
                                                            Disabled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-mono truncate">{item.path}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Enable/Disable Toggle */}
                                            <button
                                                type="button"
                                                onClick={() => dispatch(toggleHeaderNavLink(item.id))}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                                    item.isEnabled
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}
                                            >
                                                {item.isEnabled ? 'Active' : 'Hidden'}
                                            </button>

                                            {/* Edit */}
                                            <button
                                                type="button"
                                                onClick={() => openEditNavModal(item)}
                                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                                title="Edit"
                                            >
                                                <Edit3 size={15} />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    dispatch(deleteHeaderNavLink(item.id))
                                                    toast.success('মেনু লিংক মুছে ফেলা হয়েছে')
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Section: Header Feature Buttons & Search */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                        <div className="pb-4 border-b border-slate-100">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal size={18} className="text-green-600" />
                                <span>Header Action Buttons & Search Control</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                সার্চ বার, উইশলিস্ট, কার্ট এবং লগইন বাটনের প্রদর্শন ও লেবেল পরিবর্তন করুন।
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search Bar Settings */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Search size={16} className="text-slate-600" />
                                        <span className="text-xs font-bold text-slate-800">সার্চ বার (Search Bar)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHeaderForm({ ...headerForm, showSearch: !headerForm.showSearch })}
                                        className={`w-11 h-5 rounded-full transition relative cursor-pointer ${
                                            headerForm.showSearch ? 'bg-green-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition transform shadow-xs ${
                                            headerForm.showSearch ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Placeholder টেক্সট</label>
                                    <input
                                        type="text"
                                        value={headerForm.searchPlaceholder || ''}
                                        onChange={(e) => setHeaderForm({ ...headerForm, searchPlaceholder: e.target.value })}
                                        placeholder="Search products..."
                                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {/* Wishlist Button Settings */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Heart size={16} className="text-rose-500" />
                                        <span className="text-xs font-bold text-slate-800">উইশলিস্ট বাটন (Wishlist Button)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHeaderForm({ ...headerForm, showWishlist: !headerForm.showWishlist })}
                                        className={`w-11 h-5 rounded-full transition relative cursor-pointer ${
                                            headerForm.showWishlist ? 'bg-green-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition transform shadow-xs ${
                                            headerForm.showWishlist ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">বাটন লেবেল (Wishlist Label)</label>
                                    <input
                                        type="text"
                                        value={headerForm.wishlistLabel || ''}
                                        onChange={(e) => setHeaderForm({ ...headerForm, wishlistLabel: e.target.value })}
                                        placeholder="Wishlist"
                                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {/* Cart Button Settings */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart size={16} className="text-emerald-600" />
                                        <span className="text-xs font-bold text-slate-800">কার্ট বাটন (Cart Button)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHeaderForm({ ...headerForm, showCart: !headerForm.showCart })}
                                        className={`w-11 h-5 rounded-full transition relative cursor-pointer ${
                                            headerForm.showCart ? 'bg-green-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition transform shadow-xs ${
                                            headerForm.showCart ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">বাটন লেবেল (Cart Label)</label>
                                    <input
                                        type="text"
                                        value={headerForm.cartLabel || ''}
                                        onChange={(e) => setHeaderForm({ ...headerForm, cartLabel: e.target.value })}
                                        placeholder="Cart"
                                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {/* Login Button Settings */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-indigo-600" />
                                        <span className="text-xs font-bold text-slate-800">লগইন বাটন (Login / Profile)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHeaderForm({ ...headerForm, showLogin: !headerForm.showLogin })}
                                        className={`w-11 h-5 rounded-full transition relative cursor-pointer ${
                                            headerForm.showLogin ? 'bg-green-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition transform shadow-xs ${
                                            headerForm.showLogin ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">লগইন বাটন টেক্সট</label>
                                    <input
                                        type="text"
                                        value={headerForm.loginLabel || ''}
                                        onChange={(e) => setHeaderForm({ ...headerForm, loginLabel: e.target.value })}
                                        placeholder="Login"
                                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Header Button */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={handleSaveHeader}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <Save size={16} />
                                <span>Save Header Settings (হেডার সংরক্ষণ করুন)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: FOOTER SETTINGS */}
            {/* ================================================================= */}
            {activeTab === 'footer' && (
                <div className="space-y-8">
                    {/* Section: Global Footer Toggle & Brand Info */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles size={18} className="text-green-600" />
                                    <span>Footer Brand & About Section (ফুটার ব্র্যান্ড ও বিবরণ)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    ফুটারের ব্র্যান্ড বিবরণ ও পরিচিতি টেক্সট পরিবর্তন করুন।
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">ফুটার চালু আছে:</span>
                                <button
                                    type="button"
                                    onClick={() => setFooterForm({ ...footerForm, showFooter: !footerForm.showFooter })}
                                    className={`w-12 h-6 rounded-full transition relative cursor-pointer ${
                                        footerForm.showFooter ? 'bg-green-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform shadow-xs ${
                                        footerForm.showFooter ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div>
                                    <p className="text-xs font-bold text-slate-800">ব্র্যান্ড পরিচিতি কলাম প্রদর্শন (Show Brand Info Column)</p>
                                    <p className="text-[11px] text-slate-500">Enable or disable the left brand column</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFooterForm({
                                        ...footerForm,
                                        brand: { ...footerForm.brand, showBrand: !footerForm.brand?.showBrand }
                                    })}
                                    className={`w-12 h-6 rounded-full transition relative cursor-pointer ${
                                        footerForm.brand?.showBrand ? 'bg-green-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform shadow-xs ${
                                        footerForm.brand?.showBrand ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Prefix</label>
                                    <input
                                        type="text"
                                        value={footerForm.brand?.titlePrefix || ''}
                                        onChange={(e) => setFooterForm({
                                            ...footerForm,
                                            brand: { ...footerForm.brand, titlePrefix: e.target.value }
                                        })}
                                        placeholder="Our"
                                        className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Middle</label>
                                    <input
                                        type="text"
                                        value={footerForm.brand?.titleMiddle || ''}
                                        onChange={(e) => setFooterForm({
                                            ...footerForm,
                                            brand: { ...footerForm.brand, titleMiddle: e.target.value }
                                        })}
                                        placeholder="Store"
                                        className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Suffix</label>
                                    <input
                                        type="text"
                                        value={footerForm.brand?.titleSuffix || ''}
                                        onChange={(e) => setFooterForm({
                                            ...footerForm,
                                            brand: { ...footerForm.brand, titleSuffix: e.target.value }
                                        })}
                                        placeholder="BD"
                                        className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    দোকানের সংক্ষিপ্ত বিবরণ (Store Description Text):
                                </label>
                                <textarea
                                    rows={3}
                                    value={footerForm.brand?.description || ''}
                                    onChange={(e) => setFooterForm({
                                        ...footerForm,
                                        brand: { ...footerForm.brand, description: e.target.value }
                                    })}
                                    placeholder="Our Store BD is your trusted online electronics shop..."
                                    className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Social Media Links */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Share2 size={18} className="text-green-600" />
                                    <span>Social Media Links & Icons (সোশ্যাল মিডিয়া লিংকস)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Facebook, Instagram, YouTube, WhatsApp ইত্যাদি লিংক যুক্ত করুন বা সক্রিয়/নিষ্ক্রিয় করুন।
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openAddSocialModal}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                            >
                                <Plus size={16} />
                                <span>নতুন সোশ্যাল লিংক যোগ করুন</span>
                            </button>
                        </div>

                        {/* Social Links Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(footer.social?.links || []).map((soc) => (
                                <div
                                    key={soc.id}
                                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                                        soc.isEnabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-800">{soc.name}</span>
                                            {!soc.isEnabled && (
                                                <span className="text-[9px] px-1 bg-slate-200 text-slate-600 rounded">Disabled</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">{soc.url}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => dispatch(toggleFooterSocialLink(soc.id))}
                                            className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                                                soc.isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                            }`}
                                        >
                                            {soc.isEnabled ? 'Active' : 'Off'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEditSocialModal(soc)}
                                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-indigo-50"
                                            title="Edit"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                dispatch(deleteFooterSocialLink(soc.id))
                                                toast.success('সোশ্যাল লিংক মুছে ফেলা হয়েছে')
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section: Footer Navigation Columns & Links */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Layers size={18} className="text-green-600" />
                                    <span>Footer Columns & Quick Navigation (ফুটার কলাম ও লিংকসমূহ)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    ফুটারের যেকোনো কলাম (Quick Navigation, Contact Info) পরিবর্তন করুন বা নতুন কলাম তৈরি করুন।
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAddSectionModal(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                            >
                                <Plus size={16} />
                                <span>নতুন কলাম তৈরি করুন</span>
                            </button>
                        </div>

                        {/* Columns List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(footer.sections || []).map((section) => (
                                <div
                                    key={section.id}
                                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
                                >
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => dispatch(updateFooterSection({ id: section.id, updates: { title: e.target.value } }))}
                                                className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-wide bg-white px-2.5 py-1 rounded-lg border border-slate-200 focus:border-green-500 outline-none"
                                            />
                                            {!section.isEnabled && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-semibold">Hidden</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => dispatch(toggleFooterSection(section.id))}
                                                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                                                    section.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {section.isEnabled ? 'Visible' : 'Hidden'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    dispatch(deleteFooterSection(section.id))
                                                    toast.success('কলাম মুছে ফেলা হয়েছে')
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                                                title="Delete Column"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Links inside this section */}
                                    <div className="space-y-2">
                                        {(section.links || []).map((link) => (
                                            <div
                                                key={link.id}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className="font-semibold text-slate-700 truncate">{link.text}</p>
                                                    <p className="text-[11px] text-slate-400 font-mono truncate">{link.path}</p>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => dispatch(toggleFooterSectionLink({ sectionId: section.id, linkId: link.id }))}
                                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                            link.isEnabled ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                                                        }`}
                                                    >
                                                        {link.isEnabled ? 'Active' : 'Off'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditSectionLink(section.id, link)}
                                                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            dispatch(deleteFooterSectionLink({ sectionId: section.id, linkId: link.id }))
                                                            toast.success('লিংক মুছে ফেলা হয়েছে')
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add link button for this section */}
                                    <button
                                        type="button"
                                        onClick={() => openAddSectionLink(section.id)}
                                        className="w-full py-2 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        <span>এই কলামে নতুন লিংক যুক্ত করুন</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section: Footer Bottom Bar & Copyright */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Shield size={18} className="text-green-600" />
                                    <span>Copyright Bar & Trust Badges (কপিরাইট ও ব্যাজ বার)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    ফুটারের সর্বনিম্নে কপিরাইট টেক্সট এবং ব্যাজ/পলিসি টেক্সট পরিবর্তন করুন।
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setFooterForm({
                                    ...footerForm,
                                    bottomBar: { ...footerForm.bottomBar, showBottomBar: !footerForm.bottomBar?.showBottomBar }
                                })}
                                className={`w-12 h-6 rounded-full transition relative cursor-pointer ${
                                    footerForm.bottomBar?.showBottomBar ? 'bg-green-600' : 'bg-slate-300'
                                }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform shadow-xs ${
                                    footerForm.bottomBar?.showBottomBar ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    কপিরাইট টেক্সট (Copyright Text - <code className="text-green-600">{"{year}"}</code> স্বয়ংক্রিয়ভাবে বর্তমান বছর দেখাবে):
                                </label>
                                <input
                                    type="text"
                                    value={footerForm.bottomBar?.copyrightText || ''}
                                    onChange={(e) => setFooterForm({
                                        ...footerForm,
                                        bottomBar: { ...footerForm.bottomBar, copyrightText: e.target.value }
                                    })}
                                    placeholder="Copyright {year} © Our Store BD. All Rights Reserved. Made for Bangladesh 🇧🇩"
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                />
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">ট্রাস্ট ব্যাজ টেক্সট (100% Authentic, COD, Easy Return)</p>
                                        <p className="text-[11px] text-slate-500">Enable or edit badges text</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFooterForm({
                                            ...footerForm,
                                            bottomBar: { ...footerForm.bottomBar, showBadges: !footerForm.bottomBar?.showBadges }
                                        })}
                                        className={`w-11 h-5 rounded-full transition relative cursor-pointer ${
                                            footerForm.bottomBar?.showBadges ? 'bg-green-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition transform shadow-xs ${
                                            footerForm.bottomBar?.showBadges ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    value={footerForm.bottomBar?.badgesText || ''}
                                    onChange={(e) => setFooterForm({
                                        ...footerForm,
                                        bottomBar: { ...footerForm.bottomBar, badgesText: e.target.value }
                                    })}
                                    placeholder="100% Authentic Products • Cash on Delivery • 7-Day Easy Return"
                                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                />
                            </div>
                        </div>

                        {/* Save Footer Button */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={handleSaveFooter}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <Save size={16} />
                                <span>Save Footer Settings (ফুটার সংরক্ষণ করুন)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 3: LIVE PREVIEW */}
            {/* ================================================================= */}
            {activeTab === 'preview' && (
                <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl text-white space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <Eye size={16} />
                            <span>Live Render Preview (আপনার স্টোরের বর্তমান রূপ)</span>
                        </div>
                        <span className="text-xs text-slate-400">রিয়েল-টাইমে যেমন দেখাচ্ছে</span>
                    </div>

                    {/* Preview Navbar */}
                    <div className="bg-white text-slate-800 p-4 rounded-2xl shadow-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">হেডার প্রিভিউ:</p>
                        <div className="flex items-center justify-between">
                            <div className="text-xl font-bold tracking-tight">
                                <span className="text-green-600">{header.logoTextPrefix || 'Our'}</span>{' '}
                                <span>{header.logoTextMiddle || 'Store'}</span>{' '}
                                <span className="text-green-600">{header.logoTextSuffix || 'BD'}</span>
                            </div>

                            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-600">
                                {(header.navLinks || []).filter(l => l.isEnabled).map(link => (
                                    <span key={link.id} className="hover:text-green-600">{link.label}</span>
                                ))}
                                {header.showCategoriesDropdown && (
                                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                                        {header.categoriesDropdownLabel || 'Categories'} <ChevronDown size={12} />
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                                {header.showSearch && (
                                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-slate-400 text-[11px]">
                                        <Search size={13} />
                                        <span>{header.searchPlaceholder || 'Search products...'}</span>
                                    </div>
                                )}
                                {header.showWishlist && (
                                    <span className="flex items-center gap-1 text-slate-700">
                                        <Heart size={15} className="text-rose-500" />
                                        <span className="hidden md:inline">{header.wishlistLabel || 'Wishlist'}</span>
                                    </span>
                                )}
                                {header.showCart && (
                                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                        <ShoppingCart size={15} />
                                        <span className="hidden md:inline">{header.cartLabel || 'Cart'}</span>
                                    </span>
                                )}
                                {header.showLogin && (
                                    <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full font-semibold text-[11px]">
                                        {header.loginLabel || 'Login'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preview Footer */}
                    <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">ফুটার প্রিভিউ:</p>
                        <div className="flex flex-col md:flex-row justify-between gap-8 pb-6 border-b border-slate-200">
                            {footer.brand?.showBrand !== false && (
                                <div className="max-w-sm">
                                    <div className="text-xl font-bold tracking-tight">
                                        <span className="text-green-600">{footer.brand?.titlePrefix || 'Our'}</span>{' '}
                                        <span>{footer.brand?.titleMiddle || 'Store'}</span>{' '}
                                        <span className="text-green-600">{footer.brand?.titleSuffix || 'BD'}</span>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                                        {footer.brand?.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-4">
                                        {(footer.social?.links || []).filter(s => s.isEnabled).map(s => (
                                            <span key={s.id} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-200" title={s.name}>
                                                {s.name?.charAt(0)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-8 text-xs">
                                {(footer.sections || []).filter(sec => sec.isEnabled).map(sec => (
                                    <div key={sec.id} className="min-w-[120px]">
                                        <p className="font-bold text-slate-800 uppercase tracking-wide mb-3">{sec.title}</p>
                                        <ul className="space-y-2 text-slate-600">
                                            {(sec.links || []).filter(l => l.isEnabled).map(l => (
                                                <li key={l.id}>{l.text}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {footer.bottomBar?.showBottomBar !== false && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                                <p>{(footer.bottomBar?.copyrightText || '').replace('{year}', new Date().getFullYear())}</p>
                                {footer.bottomBar?.showBadges && (
                                    <p className="text-slate-400">{footer.bottomBar?.badgesText}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* MODAL: ADD / EDIT NAV LINK */}
            {/* ================================================================= */}
            {showAddNavModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                {editingNavId ? 'মেনু লিংক সম্পাদনা করুন' : 'নতুন হেডার মেনু লিংক যোগ করুন'}
                            </h3>
                            <button onClick={() => setShowAddNavModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNavLink} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">লিংক নাম (Label) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={navFormData.label}
                                    onChange={(e) => setNavFormData({ ...navFormData, label: e.target.value })}
                                    placeholder="যেমন: Blog, Track Order, Deals"
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">লিংক পাথ / URL <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={navFormData.path}
                                    onChange={(e) => setNavFormData({ ...navFormData, path: e.target.value })}
                                    placeholder="যেমন: /shop, /about, /track, https://..."
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isExternal"
                                    checked={navFormData.isExternal}
                                    onChange={(e) => setNavFormData({ ...navFormData, isExternal: e.target.checked })}
                                    className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                />
                                <label htmlFor="isExternal" className="text-xs font-medium text-slate-700 cursor-pointer">
                                    নতুন ট্যাবে খুলবে (Open link in new tab)
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddNavModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition cursor-pointer shadow-xs"
                                >
                                    সংরক্ষণ করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* MODAL: ADD / EDIT SOCIAL LINK */}
            {/* ================================================================= */}
            {showAddSocialModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                {editingSocialId ? 'সোশ্যাল মিডিয়া লিংক সম্পাদনা' : 'নতুন সোশ্যাল মিডিয়া যোগ করুন'}
                            </h3>
                            <button onClick={() => setShowAddSocialModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSocialLink} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">প্ল্যাটফর্ম নির্বাচন করুন</label>
                                <select
                                    value={socialFormData.platform}
                                    onChange={(e) => {
                                        const found = SOCIAL_PLATFORMS.find(p => p.key === e.target.value)
                                        setSocialFormData({
                                            ...socialFormData,
                                            platform: e.target.value,
                                            name: found?.label || 'Social Link',
                                            url: found?.defaultUrl || 'https://',
                                        })
                                    }}
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 cursor-pointer"
                                >
                                    {SOCIAL_PLATFORMS.map(p => (
                                        <option key={p.key} value={p.key}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">প্রোফাইল / পেজ URL <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={socialFormData.url}
                                    onChange={(e) => setSocialFormData({ ...socialFormData, url: e.target.value })}
                                    placeholder="https://facebook.com/yourpage"
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="socialEnabled"
                                    checked={socialFormData.isEnabled}
                                    onChange={(e) => setSocialFormData({ ...socialFormData, isEnabled: e.target.checked })}
                                    className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                />
                                <label htmlFor="socialEnabled" className="text-xs font-medium text-slate-700 cursor-pointer">
                                    সক্রিয় রাখুন (Enable and show in footer)
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddSocialModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition cursor-pointer shadow-xs"
                                >
                                    সংরক্ষণ করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* MODAL: ADD SECTION MODAL */}
            {/* ================================================================= */}
            {showAddSectionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">নতুন ফুটার কলাম তৈরি করুন</h3>
                            <button onClick={() => setShowAddSectionModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddSection} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">কলাম টাইটেল (যেমন: Policies, Help, Services)</label>
                                <input
                                    type="text"
                                    required
                                    value={sectionTitleInput}
                                    onChange={(e) => setSectionTitleInput(e.target.value)}
                                    placeholder="POLICIES & LEGAL"
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddSectionModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-xs"
                                >
                                    কলাম তৈরি করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* MODAL: ADD / EDIT SECTION LINK */}
            {/* ================================================================= */}
            {activeSectionForLink && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                {editingSectionLinkId ? 'কলাম লিংক সম্পাদনা' : 'কলামে নতুন লিংক যুক্ত করুন'}
                            </h3>
                            <button onClick={() => setActiveSectionForLink(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSectionLink} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">লিংক টেক্সট (Text) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={sectionLinkFormData.text}
                                    onChange={(e) => setSectionLinkFormData({ ...sectionLinkFormData, text: e.target.value })}
                                    placeholder="যেমন: Return Policy, +880 1712..., Email"
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">লিংক পাথ / URL <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={sectionLinkFormData.path}
                                    onChange={(e) => setSectionLinkFormData({ ...sectionLinkFormData, path: e.target.value })}
                                    placeholder="যেমন: /shop, tel:+880..., mailto:..."
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">আইকন ধরন (ঐচ্ছিক)</label>
                                <select
                                    value={sectionLinkFormData.iconType}
                                    onChange={(e) => setSectionLinkFormData({ ...sectionLinkFormData, iconType: e.target.value })}
                                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 cursor-pointer"
                                >
                                    <option value="none">কোনো আইকন নেই (Regular Link)</option>
                                    <option value="phone">Phone Icon (ফোন কল)</option>
                                    <option value="email">Email Icon (ইমেইল)</option>
                                    <option value="address">MapPin Icon (ঠিকানা)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveSectionForLink(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition cursor-pointer shadow-xs"
                                >
                                    সংরক্ষণ করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* RESET CONFIRMATION MODAL */}
            {/* ================================================================= */}
            {showResetConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                            <RotateCcw size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">ডিফল্ট সেটিংসে রিসেট নিশ্চিতকরণ</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                আপনি কি নিশ্চিত যে হেডার এবং ফুটারে করা সমস্ত পরিবর্তন মুছে ফেলে মূল ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowResetConfirm(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                বাতিল
                            </button>
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer"
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
