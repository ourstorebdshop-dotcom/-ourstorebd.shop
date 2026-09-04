'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
    addBanner, updateBanner, deleteBanner, toggleBannerActive, resetBanners
} from '@/lib/features/banner/bannerSlice'
import toast from 'react-hot-toast'
import {
    PlusIcon, PencilIcon, Trash2Icon, XIcon, MegaphoneIcon,
    EyeIcon, EyeOffIcon, GripVerticalIcon, CopyIcon, ExternalLinkIcon,
    ToggleLeftIcon, ToggleRightIcon, PaletteIcon, TypeIcon, RotateCcwIcon,
    SparklesIcon
} from 'lucide-react'
import HeroBannerEditor from '@/components/admin/HeroBannerEditor'

// Preset gradients with CSS values for inline styles
const presetGradients = [
    { label: 'Purple → Orange', value: 'from-violet-500 via-[#9938CA] to-[#E0724A]', css: 'linear-gradient(to right, #8b5cf6, #9938CA, #E0724A)' },
    { label: 'Rose → Orange', value: 'from-rose-500 via-pink-500 to-orange-500', css: 'linear-gradient(to right, #f43f5e, #ec4899, #f97316)' },
    { label: 'Blue → Cyan', value: 'from-blue-600 via-blue-500 to-cyan-400', css: 'linear-gradient(to right, #2563eb, #3b82f6, #22d3ee)' },
    { label: 'Green → Teal', value: 'from-emerald-600 via-green-500 to-teal-400', css: 'linear-gradient(to right, #059669, #22c55e, #2dd4bf)' },
    { label: 'Indigo → Purple', value: 'from-indigo-600 via-purple-500 to-pink-500', css: 'linear-gradient(to right, #4f46e5, #a855f7, #ec4899)' },
    { label: 'Slate → Gray', value: 'from-slate-800 via-slate-700 to-slate-600', css: 'linear-gradient(to right, #1e293b, #334155, #475569)' },
    { label: 'Amber → Red', value: 'from-amber-500 via-orange-500 to-red-500', css: 'linear-gradient(to right, #f59e0b, #f97316, #ef4444)' },
    { label: 'Cyan → Blue', value: 'from-cyan-400 via-blue-500 to-indigo-600', css: 'linear-gradient(to right, #22d3ee, #3b82f6, #4f46e5)' },
]

// Helper: get CSS gradient from Tailwind class name
const getGradientCSS = (gradientValue) => {
    const found = presetGradients.find(g => g.value === gradientValue)
    return found ? found.css : 'linear-gradient(to right, #8b5cf6, #9938CA, #E0724A)'
}

// Helper: build background style for a banner
const getBannerBgStyle = (banner) => {
    const style = { color: banner.textColor || '#ffffff' }
    if (banner.bgType === 'gradient' && banner.bgGradient) {
        style.background = getGradientCSS(banner.bgGradient)
    } else if (banner.bgType === 'solid') {
        style.backgroundColor = banner.bgColor || '#7c3aed'
    } else {
        style.background = 'linear-gradient(to right, #8b5cf6, #9938CA, #E0724A)'
    }
    return style
}

const emptyBanner = {
    message: '',
    couponCode: '',
    buttonText: '',
    bgType: 'gradient',
    bgGradient: presetGradients[0].value,
    bgColor: '#7c3aed',
    textColor: '#ffffff',
    linkUrl: '',
    position: 'top',
    isActive: true,
    showOnPages: 'all',
    startDate: '',
    endDate: '',
}

export default function AdminBanners() {
    const dispatch = useDispatch()
    const { banners } = useSelector(state => state.banner)

    const [mainTab, setMainTab] = useState('hero') // 'hero' | 'announcement'
    const [showForm, setShowForm] = useState(false)
    const [editingBanner, setEditingBanner] = useState(null)
    const [deletingBannerId, setDeletingBannerId] = useState(null)
    const [formData, setFormData] = useState({ ...emptyBanner })
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    const handleReset = () => {
        dispatch(resetBanners())
        toast.success('Banners reset to defaults!')
        setShowResetConfirm(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.message.trim()) {
            toast.error('Please enter a banner message')
            return
        }

        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            toast.error('End date must be after start date')
            return
        }

        if (formData.endDate && new Date(formData.endDate) < new Date()) {
            toast.error('End date cannot be in the past')
            return
        }

        if (editingBanner) {
            dispatch(updateBanner({ ...formData, id: editingBanner.id }))
            toast.success('Banner updated successfully!')
            setEditingBanner(null)
        } else {
            dispatch(addBanner(formData))
            toast.success('Banner created successfully!')
        }

        setFormData({ ...emptyBanner })
        setShowForm(false)
    }

    const handleEdit = (banner) => {
        setFormData({ ...banner })
        setEditingBanner(banner)
        setShowForm(true)
    }

    const handleDelete = () => {
        dispatch(deleteBanner(deletingBannerId))
        toast.success('Banner deleted!')
        setDeletingBannerId(null)
    }

    const handleToggle = (id) => {
        dispatch(toggleBannerActive(id))
        const banner = banners.find(b => b.id === id)
        toast.success(`Banner ${banner?.isActive ? 'deactivated' : 'activated'}!`)
    }

    const handleCancel = () => {
        setFormData({ ...emptyBanner })
        setEditingBanner(null)
        setShowForm(false)
    }

    const activeBanners = banners.filter(b => b.isActive).length

    return (
        <div className="text-slate-700 mb-40 max-w-6xl">
            {/* Primary Mode Switcher: Hero Banner vs Announcement Bar */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 mb-8 max-w-xl border border-slate-200 shadow-xs">
                <button
                    type="button"
                    onClick={() => setMainTab('hero')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                        mainTab === 'hero'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <SparklesIcon size={18} className={mainTab === 'hero' ? 'text-green-600' : 'text-slate-400'} />
                    <span>হিরো ব্যানার (Hero Banner)</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMainTab('announcement')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                        mainTab === 'announcement'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <MegaphoneIcon size={18} className={mainTab === 'announcement' ? 'text-slate-800' : 'text-slate-400'} />
                    <span>টপ অ্যানাউন্সমেন্ট বার (Top Bar)</span>
                </button>
            </div>

            {mainTab === 'hero' ? (
                <HeroBannerEditor />
            ) : (
                <>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
                        Promotional <span className="text-green-600">Banners</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Manage announcement banners displayed on your storefront
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition"
                        title="Reset to default banners"
                    >
                        <RotateCcwIcon size={14} />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                        onClick={() => { setShowForm(!showForm); setEditingBanner(null); setFormData({ ...emptyBanner }) }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition shadow-xs active:scale-[0.98]"
                    >
                        <PlusIcon size={18} />
                        <span>New Banner</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <MegaphoneIcon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Total Banners</p>
                            <p className="text-xl font-bold text-slate-800">{banners.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                            <EyeIcon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Active</p>
                            <p className="text-xl font-bold text-slate-800">{activeBanners}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                            <EyeOffIcon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Inactive</p>
                            <p className="text-xl font-bold text-slate-800">{banners.length - activeBanners}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <MegaphoneIcon className="text-green-600" size={20} />
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                            </h2>
                        </div>
                        <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                            <XIcon size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                        {/* Banner Message */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Banner Message <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="e.g. Get 20% OFF on Your First Order!"
                                className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg"
                                required
                            />
                        </div>

                        {/* Button Text & Action */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Button Text</label>
                                <input
                                    type="text"
                                    name="buttonText"
                                    value={formData.buttonText}
                                    onChange={handleChange}
                                    placeholder="e.g. Claim Offer (leave empty for no button)"
                                    className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Coupon Code</label>
                                <input
                                    type="text"
                                    name="couponCode"
                                    value={formData.couponCode}
                                    onChange={handleChange}
                                    placeholder="e.g. NEW20 (copies on click)"
                                    className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Link URL</label>
                                <input
                                    type="text"
                                    name="linkUrl"
                                    value={formData.linkUrl}
                                    onChange={handleChange}
                                    placeholder="e.g. /shop (navigates on click)"
                                    className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Background Style */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">
                                <PaletteIcon size={14} className="inline mr-1" />
                                Background Style
                            </label>
                            <div className="flex gap-3 mb-3">
                                <label className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition ${formData.bgType === 'gradient' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}>
                                    <input
                                        type="radio"
                                        name="bgType"
                                        value="gradient"
                                        checked={formData.bgType === 'gradient'}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-medium">Gradient</span>
                                </label>
                                <label className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition ${formData.bgType === 'solid' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}>
                                    <input
                                        type="radio"
                                        name="bgType"
                                        value="solid"
                                        checked={formData.bgType === 'solid'}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-medium">Solid Color</span>
                                </label>
                            </div>

                            {formData.bgType === 'gradient' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {presetGradients.map((g) => (
                                        <button
                                            key={g.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, bgGradient: g.value }))}
                                            className={`relative h-10 rounded-lg border-2 transition ${formData.bgGradient === g.value ? 'border-slate-800 ring-2 ring-slate-300' : 'border-transparent'}`}
                                            style={{ background: g.css }}
                                            title={g.label}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium drop-shadow-sm">
                                                {g.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        name="bgColor"
                                        value={formData.bgColor}
                                        onChange={handleChange}
                                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        name="bgColor"
                                        value={formData.bgColor}
                                        onChange={handleChange}
                                        className="w-32 p-2.5 border border-slate-200 outline-none focus:border-green-500 rounded-lg text-xs font-mono"
                                        placeholder="#7c3aed"
                                    />
                                    <span className="text-xs text-slate-400">Background Color</span>
                                </div>
                            )}
                        </div>

                        {/* Schedule */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Start Date (optional)</label>
                                <input
                                    type="datetime-local"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">End Date (optional)</label>
                                <input
                                    type="datetime-local"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3 pt-1">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                />
                                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                            <span className="text-xs text-slate-700 font-medium">Active (Show on storefront)</span>
                        </div>

                        {/* Live Preview */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">
                                <EyeIcon size={14} className="inline mr-1" />
                                Live Preview
                            </label>
                            <div
                                className="w-full px-6 py-2.5 rounded-lg text-sm font-medium text-center"
                                style={getBannerBgStyle(formData)}
                            >
                                <div className="flex items-center justify-center gap-4">
                                    <p>{formData.message || 'Your banner message here...'}</p>
                                    {formData.buttonText && (
                                        <span className="font-normal text-gray-800 bg-white px-4 py-1 rounded-full text-xs">
                                            {formData.buttonText}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition shadow-xs"
                            >
                                {editingBanner ? 'Save Changes' : 'Create Banner'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Banners List */}
            <div className="space-y-3">
                {banners.length > 0 ? banners.map((banner, index) => {
                    return (
                        <div
                            key={banner.id}
                            className={`bg-white border rounded-xl shadow-xs overflow-hidden transition ${banner.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}
                        >
                            {/* Mini Preview Bar */}
                            <div
                                className="px-4 py-2 text-xs font-medium text-center"
                                style={getBannerBgStyle(banner)}
                            >
                                {banner.message}
                                {banner.buttonText && (
                                    <span className="ml-3 font-normal bg-white/90 text-gray-700 px-3 py-0.5 rounded-full text-[10px]">
                                        {banner.buttonText}
                                    </span>
                                )}
                            </div>

                            {/* Banner Details */}
                            <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="flex items-center gap-1 text-slate-300">
                                        <GripVerticalIcon size={16} />
                                        <span className="text-xs font-bold text-slate-400 w-5">{index + 1}</span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-800 truncate">{banner.message}</p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            {banner.couponCode && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 font-mono font-bold">
                                                    <CopyIcon size={10} />
                                                    {banner.couponCode}
                                                </span>
                                            )}
                                            {banner.linkUrl && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200">
                                                    <ExternalLinkIcon size={10} />
                                                    {banner.linkUrl}
                                                </span>
                                            )}
                                            {banner.startDate && (
                                                <span className="text-[10px] text-slate-400">
                                                    From: {new Date(banner.startDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {banner.endDate && (
                                                <span className="text-[10px] text-slate-400">
                                                    Until: {new Date(banner.endDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {(() => {
                                                const now = new Date()
                                                const isExpired = banner.endDate && new Date(banner.endDate) < now
                                                const isScheduled = banner.startDate && new Date(banner.startDate) > now
                                                if (isExpired) return (
                                                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-red-50 text-red-500 border-red-200">Expired</span>
                                                )
                                                if (isScheduled) return (
                                                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-amber-50 text-amber-600 border-amber-200">Scheduled</span>
                                                )
                                                return (
                                                    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold border ${banner.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                        {banner.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleToggle(banner.id)}
                                        className={`p-1.5 rounded-lg transition ${banner.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                        title={banner.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {banner.isActive ? <ToggleRightIcon size={20} /> : <ToggleLeftIcon size={20} />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(banner)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <PencilIcon size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingBannerId(banner.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        title="Delete"
                                    >
                                        <Trash2Icon size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                        <MegaphoneIcon size={40} className="mx-auto mb-3 text-slate-200" />
                        <p className="text-sm text-slate-400 font-medium">No banners created yet</p>
                        <p className="text-xs text-slate-300 mt-1">Click &quot;New Banner&quot; to create your first promotional banner</p>
                    </div>
                )}
            </div>

            {/* DELETE MODAL */}
            {deletingBannerId && (
                <div onClick={() => setDeletingBannerId(null)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2Icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Delete Banner?</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            Are you sure you want to delete this banner? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center mt-6">
                            <button
                                onClick={() => setDeletingBannerId(null)}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition shadow-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Reset Confirm Modal */}
            {showResetConfirm && (
                <div onClick={() => setShowResetConfirm(false)} className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RotateCcwIcon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Reset Banners?</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            This will replace all banners with the default set. Custom banners will be lost.
                        </p>
                        <div className="flex gap-3 justify-center mt-6">
                            <button onClick={() => setShowResetConfirm(false)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">Cancel</button>
                            <button onClick={handleReset} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition shadow-xs">Reset</button>
                        </div>
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    )
}
