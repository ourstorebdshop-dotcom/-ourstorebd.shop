'use client'

import OrdersAreaChart from "@/components/OrdersAreaChart"
import { useSelector, useDispatch } from "react-redux"
import { updateBanner, toggleBannerActive } from "@/lib/features/banner/bannerSlice"
import { useState } from "react"
import toast from "react-hot-toast"
import Link from "next/link"
import {
    CircleDollarSignIcon, ShoppingBasketIcon, TagsIcon,
    MegaphoneIcon, PencilIcon, XIcon, CheckIcon,
    ToggleLeftIcon, ToggleRightIcon
} from "lucide-react"
import { getLocalMonthStr } from "@/lib/features/cashflow/cashflowSlice"

// Preset gradients matching Banner.jsx
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

const getGradientCSS = (gradientValue) => {
    const found = presetGradients.find(g => g.value === gradientValue)
    return found ? found.css : 'linear-gradient(to right, #8b5cf6, #9938CA, #E0724A)'
}

export default function AdminDashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()
    const banners = useSelector(state => state.banner.banners)

    // Real-time data from Redux store
    const products = useSelector(state => state.product.list)
    const orders = useSelector(state => state.order.orders)

    const totalProducts = products.length
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const allOrders = orders.map(o => ({ createdAt: o.createdAt, total: o.total || 0 }))

    // Promo Banner Editor State
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState(null)

    // Get the first (top priority) banner
    const promoBanner = banners.length > 0
        ? [...banners].sort((a, b) => (a.priority || 99) - (b.priority || 99))[0]
        : null

    const startEdit = () => {
        if (promoBanner) {
            setEditData({ ...promoBanner })
            setIsEditing(true)
        }
    }

    const cancelEdit = () => {
        setEditData(null)
        setIsEditing(false)
    }

    const saveEdit = () => {
        if (!editData.message.trim()) {
            toast.error('Banner message is required')
            return
        }
        dispatch(updateBanner(editData))
        toast.success('Promo banner updated!')
        setIsEditing(false)
        setEditData(null)
    }

    const handleToggle = () => {
        if (promoBanner) {
            dispatch(toggleBannerActive(promoBanner.id))
            toast.success(`Banner ${promoBanner.isActive ? 'deactivated' : 'activated'}!`)
        }
    }

    // Cash Flow data
    const cashflowTransactions = useSelector(state => state.cashflow?.transactions) || []
    const currentMonthStr = getLocalMonthStr()
    const monthIncome = cashflowTransactions.filter(t => t.type === 'INCOME' && t.date?.startsWith(currentMonthStr)).reduce((s, t) => s + t.amount, 0)
    const monthExpense = cashflowTransactions.filter(t => t.type === 'EXPENSE' && t.date?.startsWith(currentMonthStr)).reduce((s, t) => s + t.amount, 0)
    const netCashFlow = monthIncome - monthExpense

    const dashboardCardsData = [
        { title: 'Total Products', value: totalProducts, icon: ShoppingBasketIcon },
        { title: 'Total Revenue', value: currency + totalRevenue, icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: totalOrders, icon: TagsIcon },
        {
            title: 'Net Cash Flow',
            value: (netCashFlow >= 0 ? '+' : '-') + currency + Math.abs(netCashFlow).toLocaleString('en-IN'),
            icon: CircleDollarSignIcon,
            href: '/admin/cash-flow',
            badge: 'ক্যাশ ফ্লো',
            color: netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
        },
    ]



    // Build preview style for banner
    const getBannerPreviewStyle = (banner) => {
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

    return (
        <div className="text-slate-500">
            <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

            {/* Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => {
                        const cardContent = (
                            <div className={`flex items-center justify-between gap-6 border border-slate-200 p-3 px-6 rounded-lg transition h-full ${
                                card.href ? 'hover:border-emerald-500 hover:shadow-sm cursor-pointer bg-slate-50/50' : ''
                            }`}>
                                <div className="flex flex-col gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <p>{card.title}</p>
                                        {card.badge && (
                                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                {card.badge}
                                            </span>
                                        )}
                                    </div>
                                    <b className={`text-2xl font-medium ${card.color || 'text-slate-700'}`}>{card.value}</b>
                                </div>
                                <card.icon size={50} className="w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full shrink-0" />
                            </div>
                        )

                        return card.href ? (
                            <Link key={index} href={card.href} className="block">
                                {cardContent}
                            </Link>
                        ) : (
                            <div key={index}>{cardContent}</div>
                        )
                    })
                }
            </div>

            {/* ═══════════════════════════════════════════
                PROMO BANNER QUICK EDITOR
            ═══════════════════════════════════════════ */}
            {promoBanner && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs mb-8 overflow-hidden">
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <MegaphoneIcon size={16} className="text-green-600" />
                            <h2 className="text-sm font-semibold text-slate-700">Promo Banner</h2>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${promoBanner.isActive
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}>
                                {promoBanner.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleToggle}
                                className={`p-1.5 rounded-lg transition ${promoBanner.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                title={promoBanner.isActive ? 'Deactivate' : 'Activate'}
                            >
                                {promoBanner.isActive ? <ToggleRightIcon size={18} /> : <ToggleLeftIcon size={18} />}
                            </button>
                            {!isEditing && (
                                <button
                                    onClick={startEdit}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Edit Banner"
                                >
                                    <PencilIcon size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="px-5 py-3">
                        <p className="text-[10px] text-slate-400 font-medium mb-2 uppercase tracking-wider">Live Preview</p>
                        <div
                            className="rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-between"
                            style={getBannerPreviewStyle(isEditing ? editData : promoBanner)}
                        >
                            <p className="flex-1">{(isEditing ? editData : promoBanner).message}</p>
                            {(isEditing ? editData : promoBanner).buttonText && (
                                <span className="ml-3 text-gray-800 bg-white px-4 py-1 rounded-full text-xs font-normal shrink-0">
                                    {(isEditing ? editData : promoBanner).buttonText}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Edit Form (Inline) */}
                    {isEditing && editData && (
                        <div className="px-5 pb-5 pt-2 space-y-4 border-t border-slate-100">
                            {/* Message */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Banner Message</label>
                                <input
                                    type="text"
                                    value={editData.message}
                                    onChange={(e) => setEditData(p => ({ ...p, message: e.target.value }))}
                                    className="w-full p-2.5 text-sm border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg transition"
                                    placeholder="e.g. Get 20% OFF on Your First Order!"
                                />
                            </div>

                            {/* Button Text + Coupon Code */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Button Text</label>
                                    <input
                                        type="text"
                                        value={editData.buttonText}
                                        onChange={(e) => setEditData(p => ({ ...p, buttonText: e.target.value }))}
                                        className="w-full p-2.5 text-sm border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg transition"
                                        placeholder="e.g. Claim Offer (empty = no button)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Coupon Code</label>
                                    <input
                                        type="text"
                                        value={editData.couponCode}
                                        onChange={(e) => setEditData(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))}
                                        className="w-full p-2.5 text-sm border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg transition font-mono uppercase tracking-wider"
                                        placeholder="e.g. NEW20"
                                    />
                                </div>
                            </div>

                            {/* Link URL */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Link URL <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input
                                    type="text"
                                    value={editData.linkUrl}
                                    onChange={(e) => setEditData(p => ({ ...p, linkUrl: e.target.value }))}
                                    className="w-full p-2.5 text-sm border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg transition"
                                    placeholder="e.g. /shop or https://..."
                                />
                            </div>

                            {/* Background Type */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Background Style</label>
                                <div className="flex gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditData(p => ({ ...p, bgType: 'gradient' }))}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition ${editData.bgType === 'gradient' ? 'bg-green-50 text-green-700 border-green-300 font-semibold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        Gradient
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditData(p => ({ ...p, bgType: 'solid' }))}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition ${editData.bgType === 'solid' ? 'bg-green-50 text-green-700 border-green-300 font-semibold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        Solid Color
                                    </button>
                                </div>

                                {editData.bgType === 'gradient' ? (
                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                        {presetGradients.map((g, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setEditData(p => ({ ...p, bgGradient: g.value }))}
                                                className={`h-8 rounded-lg border-2 transition ${editData.bgGradient === g.value ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent hover:border-slate-300'}`}
                                                style={{ background: g.css }}
                                                title={g.label}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={editData.bgColor || '#7c3aed'}
                                            onChange={(e) => setEditData(p => ({ ...p, bgColor: e.target.value }))}
                                            className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={editData.bgColor || '#7c3aed'}
                                            onChange={(e) => setEditData(p => ({ ...p, bgColor: e.target.value }))}
                                            className="w-28 p-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-green-500"
                                            placeholder="#7c3aed"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Text Color */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Text Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={editData.textColor || '#ffffff'}
                                        onChange={(e) => setEditData(p => ({ ...p, textColor: e.target.value }))}
                                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={editData.textColor || '#ffffff'}
                                        onChange={(e) => setEditData(p => ({ ...p, textColor: e.target.value }))}
                                        className="w-28 p-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-green-500"
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={cancelEdit}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1.5"
                                >
                                    <XIcon size={14} />
                                    Cancel
                                </button>
                                <button
                                    onClick={saveEdit}
                                    className="flex-1 sm:flex-none px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    <CheckIcon size={14} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Info (when not editing) */}
                    {!isEditing && (
                        <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="text-xs">
                                <p className="text-slate-400 text-[10px] mb-0.5">Button Text</p>
                                <p className="text-slate-700 font-medium">{promoBanner.buttonText || '—'}</p>
                            </div>
                            <div className="text-xs">
                                <p className="text-slate-400 text-[10px] mb-0.5">Coupon Code</p>
                                <p className="text-slate-700 font-mono font-bold">{promoBanner.couponCode || '—'}</p>
                            </div>
                            <div className="text-xs">
                                <p className="text-slate-400 text-[10px] mb-0.5">Link</p>
                                <p className="text-slate-700 font-medium truncate">{promoBanner.linkUrl || '—'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Area Chart */}
            <OrdersAreaChart allOrders={allOrders} />
        </div>
    )
}