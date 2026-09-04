'use client'

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { addCoupon, updateCoupon, deleteCoupon, toggleCouponActive, resetCoupons } from "@/lib/features/coupon/couponSlice"
import { format } from "date-fns"
import toast from "react-hot-toast"
import {
    Trash2Icon, PencilIcon, SearchIcon, TicketIcon, PlusIcon, XIcon,
    CopyIcon, TicketPercentIcon, TagIcon, UsersIcon, TrendingUpIcon,
    CheckCircleIcon, ToggleLeftIcon, ToggleRightIcon, ChevronDownIcon,
    FilterIcon, ArrowUpDownIcon, EyeIcon, EyeOffIcon, CalendarIcon,
    RotateCcwIcon
} from "lucide-react"

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'

// ─── Helper: get coupon status ─────────────────────────
const getCouponStatus = (coupon) => {
    const now = new Date()
    const expiry = new Date(coupon.expiresAt)
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))

    if (!coupon.isActive) return { label: "Inactive", color: "bg-slate-100 text-slate-500 border-slate-200" }
    if (expiry < now) return { label: "Expired", color: "bg-red-50 text-red-600 border-red-200" }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { label: "Exhausted", color: "bg-orange-50 text-orange-600 border-orange-200" }
    if (daysLeft <= 7 && daysLeft > 0) return { label: `${daysLeft}d left`, color: "bg-amber-50 text-amber-600 border-amber-200" }
    return { label: "Active", color: "bg-emerald-50 text-emerald-600 border-emerald-200" }
}

// ─── Shared Input Component ────────────────────────────
const FormInput = ({ label, ...props }) => (
    <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
        <input
            {...props}
            className="w-full p-2.5 text-sm border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg transition"
        />
    </div>
)

// ─── Shared Toggle Component ───────────────────────────
const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
        <span className="text-xs text-slate-700 font-medium">{label}</span>
    </div>
)

// ─── Default coupon form values ────────────────────────
const getDefaultCoupon = () => ({
    code: '',
    description: '',
    discount: '',
    discountType: 'percentage',
    forNewUser: false,
    forMember: false,
    isPublic: true,
    isActive: true,
    maxUses: '',
    maxUsesPerUser: '1',
    minOrderAmount: '',
    maxDiscountAmount: '',
    expiresAt: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
})

// ═══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function AdminCoupons() {
    const dispatch = useDispatch()
    const coupons = useSelector(state => state.coupon.coupons)

    const [search, setSearch] = useState('')
    const [deletingCode, setDeletingCode] = useState(null)
    const [editingCoupon, setEditingCoupon] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [sortBy, setSortBy] = useState('newest')
    const [filterBy, setFilterBy] = useState('all')
    const [showSortDropdown, setShowSortDropdown] = useState(false)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [newCoupon, setNewCoupon] = useState(getDefaultCoupon())
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = () => { setShowSortDropdown(false); setShowFilterDropdown(false) }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [])

    // ─── ADD ───────────────────────────────────────────
    const handleAddCoupon = (e) => {
        e.preventDefault()
        if (!newCoupon.code.trim()) { toast.error('Please enter a coupon code'); return }
        if (!newCoupon.discount) { toast.error('Please enter a discount value'); return }
        if (newCoupon.discountType === 'percentage' && parseFloat(newCoupon.discount) > 100) { toast.error('Percentage discount cannot exceed 100%'); return }

        const formattedCode = newCoupon.code.toUpperCase().trim()
        if (coupons.some(c => c.code === formattedCode)) { toast.error('This coupon code already exists!'); return }

        dispatch(addCoupon({
            code: formattedCode,
            description: newCoupon.description || `${newCoupon.discount}${newCoupon.discountType === 'percentage' ? '%' : currency} discount`,
            discount: parseFloat(newCoupon.discount) || 10,
            discountType: newCoupon.discountType,
            forNewUser: newCoupon.forNewUser,
            forMember: newCoupon.forMember,
            isPublic: newCoupon.isPublic,
            isActive: newCoupon.isActive,
            maxUses: parseInt(newCoupon.maxUses) || 0,
            maxUsesPerUser: parseInt(newCoupon.maxUsesPerUser) || 1,
            minOrderAmount: parseFloat(newCoupon.minOrderAmount) || 0,
            maxDiscountAmount: parseFloat(newCoupon.maxDiscountAmount) || 0,
            usedCount: 0,
            totalSavings: 0,
            expiresAt: new Date(newCoupon.expiresAt).toISOString(),
            createdAt: new Date().toISOString()
        }))
        toast.success(`Coupon "${formattedCode}" created!`)
        setNewCoupon(getDefaultCoupon())
        setShowForm(false)
    }

    // ─── EDIT SAVE ─────────────────────────────────────
    const handleEditSave = (e) => {
        e.preventDefault()
        dispatch(updateCoupon({
            ...editingCoupon,
            discount: parseFloat(editingCoupon.discount) || 0,
            maxUses: parseInt(editingCoupon.maxUses) || 0,
            maxUsesPerUser: parseInt(editingCoupon.maxUsesPerUser) || 1,
            minOrderAmount: parseFloat(editingCoupon.minOrderAmount) || 0,
            maxDiscountAmount: parseFloat(editingCoupon.maxDiscountAmount) || 0,
        }))
        toast.success(`Coupon "${editingCoupon.code}" updated!`)
        setEditingCoupon(null)
    }

    // ─── DELETE ────────────────────────────────────────
    const confirmDelete = () => {
        dispatch(deleteCoupon(deletingCode))
        toast.success(`Coupon "${deletingCode}" deleted!`)
        setDeletingCode(null)
    }

    // ─── TOGGLE ────────────────────────────────────────
    const handleToggle = (code) => {
        dispatch(toggleCouponActive(code))
        const c = coupons.find(x => x.code === code)
        toast.success(`Coupon "${code}" ${c?.isActive ? 'deactivated' : 'activated'}!`)
    }

    // ─── COPY ──────────────────────────────────────────
    // ─── RESET TO DEFAULTS ─────────────────────────────
    const handleReset = () => {
        dispatch(resetCoupons())
        toast.success('Coupons reset to defaults!')
        setShowResetConfirm(false)
    }

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code)
        toast.success(`"${code}" copied!`)
    }

    // ─── FILTER & SORT ────────────────────────────────
    const filteredCoupons = coupons
        .filter(c => {
            const q = search.toLowerCase()
            const matchesSearch = c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
            if (!matchesSearch) return false

            const s = getCouponStatus(c)
            switch (filterBy) {
                case 'active': return s.label === 'Active' || s.label.includes('d left')
                case 'inactive': return s.label === 'Inactive'
                case 'expired': return s.label === 'Expired'
                case 'exhausted': return s.label === 'Exhausted'
                case 'newUser': return c.forNewUser
                case 'member': return c.forMember
                default: return true
            }
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest': return new Date(b.createdAt) - new Date(a.createdAt)
                case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt)
                case 'discountHigh': return b.discount - a.discount
                case 'discountLow': return a.discount - b.discount
                case 'mostUsed': return (b.usedCount || 0) - (a.usedCount || 0)
                case 'expiringSoon': return new Date(a.expiresAt) - new Date(b.expiresAt)
                default: return 0
            }
        })

    // ─── STATS ─────────────────────────────────────────
    const stats = {
        total: coupons.length,
        active: coupons.filter(c => { const s = getCouponStatus(c); return s.label === 'Active' || s.label.includes('d left') }).length,
        totalUsed: coupons.reduce((s, c) => s + (c.usedCount || 0), 0),
        totalSavings: coupons.reduce((s, c) => s + (c.totalSavings || 0), 0)
    }

    const filterOptions = [
        { value: 'all', label: 'All Coupons' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'expired', label: 'Expired' },
        { value: 'exhausted', label: 'Exhausted' },
        { value: 'newUser', label: 'New Users' },
        { value: 'member', label: 'Members' },
    ]

    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'discountHigh', label: 'Discount: High → Low' },
        { value: 'discountLow', label: 'Discount: Low → High' },
        { value: 'mostUsed', label: 'Most Used' },
        { value: 'expiringSoon', label: 'Expiring Soon' },
    ]

    // ═══════════════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════════════
    return (
        <div className="text-slate-700 mb-40 max-w-7xl">

            {/* ── Header ────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
                        Manage <span className="text-green-600">Coupons</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Create, edit, and manage promotional discount coupons
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition active:scale-[0.97]"
                        title="Reset to default coupons"
                    >
                        <RotateCcwIcon size={14} />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                        onClick={() => { setShowForm(true); setNewCoupon(getDefaultCoupon()) }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition active:scale-[0.97] shadow-xs"
                    >
                        <PlusIcon size={18} />
                        <span>Add Coupon</span>
                    </button>
                </div>
            </div>

            {/* ── Stats Cards ───────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[
                    { icon: TagIcon, label: 'Total Coupons', value: stats.total, iconBg: 'bg-blue-50 text-blue-600' },
                    { icon: CheckCircleIcon, label: 'Active', value: stats.active, iconBg: 'bg-emerald-50 text-emerald-600' },
                    { icon: UsersIcon, label: 'Total Uses', value: stats.totalUsed.toLocaleString(), iconBg: 'bg-purple-50 text-purple-600' },
                    { icon: TrendingUpIcon, label: 'Total Savings', value: `${currency}${stats.totalSavings.toLocaleString()}`, iconBg: 'bg-amber-50 text-amber-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                                <stat.icon size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{stat.label}</p>
                                <p className="text-lg sm:text-xl font-bold text-slate-800 truncate">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Search + Filter + Sort Bar ─────────── */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs mb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search coupons..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Filter */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowFilterDropdown(!showFilterDropdown); setShowSortDropdown(false) }}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition hover:bg-slate-50 ${filterBy !== 'all' ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}
                            >
                                <FilterIcon size={13} />
                                <span className="hidden xs:inline">{filterOptions.find(f => f.value === filterBy)?.label}</span>
                                <ChevronDownIcon size={13} />
                            </button>
                            {showFilterDropdown && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 min-w-[150px]">
                                    {filterOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={(e) => { e.stopPropagation(); setFilterBy(opt.value); setShowFilterDropdown(false) }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition ${filterBy === opt.value ? 'text-green-600 font-semibold bg-green-50/50' : 'text-slate-600'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowSortDropdown(!showSortDropdown); setShowFilterDropdown(false) }}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 transition hover:bg-slate-50"
                            >
                                <ArrowUpDownIcon size={13} />
                                <span className="hidden sm:inline">{sortOptions.find(s => s.value === sortBy)?.label}</span>
                                <ChevronDownIcon size={13} />
                            </button>
                            {showSortDropdown && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 min-w-[170px]">
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={(e) => { e.stopPropagation(); setSortBy(opt.value); setShowSortDropdown(false) }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition ${sortBy === opt.value ? 'text-green-600 font-semibold bg-green-50/50' : 'text-slate-600'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-full whitespace-nowrap">
                            {filteredCoupons.length} of {coupons.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Coupon List ────────────────────────── */}
            {filteredCoupons.length > 0 ? (
                <>
                    {/* Desktop Table (hidden on mobile) */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Code</th>
                                        <th className="py-3 px-4 font-semibold">Discount</th>
                                        <th className="py-3 px-4 font-semibold">Usage</th>
                                        <th className="py-3 px-4 font-semibold">Min Order</th>
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold">Conditions</th>
                                        <th className="py-3 px-4 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCoupons.map((coupon) => {
                                        const status = getCouponStatus(coupon)
                                        const usagePercent = coupon.maxUses ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100) : 0
                                        return (
                                            <tr key={coupon.code} className="hover:bg-slate-50/80 transition-colors group">
                                                {/* Code */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs border border-green-200">
                                                            {coupon.code}
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopy(coupon.code)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                                                            title="Copy code"
                                                        >
                                                            <CopyIcon size={13} />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1 max-w-[180px] truncate">{coupon.description}</p>
                                                </td>

                                                {/* Discount */}
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-800">
                                                        {coupon.discountType === 'fixed' ? `${currency}${coupon.discount}` : `${coupon.discount}%`}
                                                    </span>
                                                    <span className="text-xs text-slate-400 ml-1">OFF</span>
                                                    {coupon.maxDiscountAmount > 0 && coupon.discountType === 'percentage' && (
                                                        <p className="text-[10px] text-slate-400 mt-0.5">max {currency}{coupon.maxDiscountAmount}</p>
                                                    )}
                                                </td>

                                                {/* Usage */}
                                                <td className="py-3 px-4">
                                                    <div className="min-w-[80px]">
                                                        <p className="text-xs font-medium text-slate-700">
                                                            {coupon.usedCount || 0}
                                                            {coupon.maxUses > 0 && <span className="text-slate-400">/{coupon.maxUses}</span>}
                                                        </p>
                                                        {coupon.maxUses > 0 && (
                                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
                                                                <div
                                                                    className={`h-1.5 rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                                    style={{ width: `${usagePercent}%` }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                        {coupon.maxUsesPerUser > 0 && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{coupon.maxUsesPerUser}/user</p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Min Order */}
                                                <td className="py-3 px-4 text-xs">
                                                    {coupon.minOrderAmount > 0 ? (
                                                        <span className="text-slate-600 font-medium">{currency}{coupon.minOrderAmount}</span>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        {format(new Date(coupon.expiresAt), 'MMM dd, yyyy')}
                                                    </p>
                                                </td>

                                                {/* Conditions */}
                                                <td className="py-3 px-4 text-xs">
                                                    {coupon.forNewUser && <span className="block text-blue-600 font-medium">• New User</span>}
                                                    {coupon.forMember && <span className="block text-purple-600 font-medium">• Member</span>}
                                                    {!coupon.forNewUser && !coupon.forMember && <span className="text-slate-400">All Users</span>}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleToggle(coupon.code)}
                                                            className={`p-1.5 rounded-lg transition ${coupon.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {coupon.isActive ? <ToggleRightIcon size={18} /> : <ToggleLeftIcon size={18} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingCoupon({ ...coupon })}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingCode(coupon.code)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2Icon size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View (hidden on desktop) */}
                    <div className="md:hidden space-y-3">
                        {filteredCoupons.map((coupon) => {
                            const status = getCouponStatus(coupon)
                            const usagePercent = coupon.maxUses ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100) : 0
                            return (
                                <div key={coupon.code} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                                    {/* Top Row: Code + Status + Actions */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs border border-green-200">
                                                {coupon.code}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <button onClick={() => handleCopy(coupon.code)} className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg" title="Copy">
                                                <CopyIcon size={14} />
                                            </button>
                                            <button onClick={() => handleToggle(coupon.code)} className={`p-1.5 rounded-lg ${coupon.isActive ? 'text-green-600' : 'text-slate-400'}`} title="Toggle">
                                                {coupon.isActive ? <ToggleRightIcon size={16} /> : <ToggleLeftIcon size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-slate-500 mb-3">{coupon.description}</p>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                                        <div>
                                            <p className="text-slate-400 text-[10px] mb-0.5">Discount</p>
                                            <p className="font-bold text-slate-800">
                                                {coupon.discountType === 'fixed' ? `${currency}${coupon.discount}` : `${coupon.discount}%`}
                                                <span className="text-slate-400 font-normal ml-0.5">OFF</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-[10px] mb-0.5">Min Order</p>
                                            <p className="font-medium text-slate-700">
                                                {coupon.minOrderAmount > 0 ? `${currency}${coupon.minOrderAmount}` : '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-[10px] mb-0.5">Conditions</p>
                                            <p className="font-medium">
                                                {coupon.forNewUser ? <span className="text-blue-600">New User</span> :
                                                    coupon.forMember ? <span className="text-purple-600">Member</span> :
                                                        <span className="text-slate-400">All</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Usage Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span>Usage: {coupon.usedCount || 0}{coupon.maxUses > 0 ? `/${coupon.maxUses}` : ''}</span>
                                            <span>{coupon.maxUsesPerUser}/user</span>
                                        </div>
                                        {coupon.maxUses > 0 && (
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                    style={{ width: `${usagePercent}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Row: Expiry + Actions */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <CalendarIcon size={11} />
                                            <span>Expires: {format(new Date(coupon.expiresAt), 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setEditingCoupon({ ...coupon })} className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium">
                                                Edit
                                            </button>
                                            <button onClick={() => setDeletingCode(coupon.code)} className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition font-medium">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="text-center py-16 text-slate-400">
                        <TicketPercentIcon size={48} className="mx-auto mb-3 text-slate-200" />
                        <p className="font-medium text-sm">No coupons found</p>
                        <p className="text-xs mt-1">Try adjusting your search or filters, or create a new coupon</p>
                        <button
                            onClick={() => { setShowForm(true); setNewCoupon(getDefaultCoupon()) }}
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 transition"
                        >
                            <PlusIcon size={14} />
                            Create Coupon
                        </button>
                    </div>
                </div>
            )}


            {/* ═══════════════════════════════════════════
                ADD COUPON MODAL
            ═══════════════════════════════════════════ */}
            {showForm && (
                <div onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-5 sm:p-6 relative my-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div className="flex items-center gap-2">
                                <TicketIcon className="text-green-600" size={20} />
                                <h2 className="text-lg font-bold text-slate-800">Create New Coupon</h2>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                <XIcon size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddCoupon} className="space-y-4 text-sm">
                            <FormInput
                                label="Coupon Code"
                                type="text"
                                placeholder="e.g. SUMMER50"
                                name="code"
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon(p => ({ ...p, code: e.target.value }))}
                                style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                                required
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Discount Type</label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg bg-white transition"
                                        name="discountType"
                                        value={newCoupon.discountType}
                                        onChange={(e) => setNewCoupon(p => ({ ...p, discountType: e.target.value }))}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed ({currency})</option>
                                    </select>
                                </div>
                                <FormInput
                                    label={newCoupon.discountType === 'percentage' ? 'Discount (%)' : `Amount (${currency})`}
                                    type="number"
                                    placeholder={newCoupon.discountType === 'percentage' ? '20' : '15'}
                                    min={1}
                                    max={newCoupon.discountType === 'percentage' ? 100 : undefined}
                                    name="discount"
                                    value={newCoupon.discount}
                                    onChange={(e) => setNewCoupon(p => ({ ...p, discount: e.target.value }))}
                                    required
                                />
                            </div>

                            <FormInput
                                label="Description"
                                type="text"
                                placeholder="20% Off summer sale discount"
                                name="description"
                                value={newCoupon.description}
                                onChange={(e) => setNewCoupon(p => ({ ...p, description: e.target.value }))}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <FormInput label={`Min Order (${currency})`} type="number" placeholder="50" min={0} name="minOrderAmount" value={newCoupon.minOrderAmount} onChange={(e) => setNewCoupon(p => ({ ...p, minOrderAmount: e.target.value }))} />
                                <FormInput label={`Max Discount (${currency})`} type="number" placeholder="100" min={0} name="maxDiscountAmount" value={newCoupon.maxDiscountAmount} onChange={(e) => setNewCoupon(p => ({ ...p, maxDiscountAmount: e.target.value }))} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormInput label="Max Total Uses" type="number" placeholder="100 (0 = unlimited)" min={0} name="maxUses" value={newCoupon.maxUses} onChange={(e) => setNewCoupon(p => ({ ...p, maxUses: e.target.value }))} />
                                <FormInput label="Per User Limit" type="number" placeholder="1" min={1} name="maxUsesPerUser" value={newCoupon.maxUsesPerUser} onChange={(e) => setNewCoupon(p => ({ ...p, maxUsesPerUser: e.target.value }))} />
                            </div>

                            <FormInput
                                label="Expiry Date"
                                type="date"
                                name="expiresAt"
                                value={newCoupon.expiresAt}
                                onChange={(e) => setNewCoupon(p => ({ ...p, expiresAt: e.target.value }))}
                                required
                            />

                            <div className="pt-2 space-y-3">
                                <Toggle label="For New Users Only" checked={newCoupon.forNewUser} onChange={(e) => setNewCoupon(p => ({ ...p, forNewUser: e.target.checked, ...(e.target.checked && { forMember: false }) }))} />
                                <Toggle label="For Plus Members Only" checked={newCoupon.forMember} onChange={(e) => setNewCoupon(p => ({ ...p, forMember: e.target.checked, ...(e.target.checked && { forNewUser: false }) }))} />
                                <Toggle label="Active (Enable Coupon)" checked={newCoupon.isActive} onChange={(e) => setNewCoupon(p => ({ ...p, isActive: e.target.checked }))} />
                            </div>

                            <div className="flex gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition shadow-xs flex items-center justify-center gap-2">
                                    <PlusIcon size={16} />
                                    Add Coupon
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* ═══════════════════════════════════════════
                DELETE CONFIRM MODAL
            ═══════════════════════════════════════════ */}
            {deletingCode && (
                <div onClick={() => setDeletingCode(null)} className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2Icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Delete Coupon?</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            Are you sure you want to delete coupon <strong className="text-slate-800">{deletingCode}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center mt-6">
                            <button onClick={() => setDeletingCode(null)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition shadow-xs">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ═══════════════════════════════════════════
                RESET CONFIRM MODAL
            ═══════════════════════════════════════════ */}
            {showResetConfirm && (
                <div onClick={() => setShowResetConfirm(false)} className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RotateCcwIcon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Reset to Defaults?</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            This will replace all current coupons with the default sample data.
                            Any custom coupons will be lost.
                        </p>
                        <div className="flex gap-3 justify-center mt-6">
                            <button onClick={() => setShowResetConfirm(false)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">
                                Cancel
                            </button>
                            <button onClick={handleReset} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition shadow-xs">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* ═══════════════════════════════════════════
                EDIT COUPON MODAL
            ═══════════════════════════════════════════ */}
            {editingCoupon && (
                <div onClick={() => setEditingCoupon(null)} className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-5 sm:p-6 relative my-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Edit Coupon</h3>
                                <span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">{editingCoupon.code}</span>
                            </div>
                            <button onClick={() => setEditingCoupon(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                <XIcon size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSave} className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Discount Type</label>
                                    <select
                                        value={editingCoupon.discountType || 'percentage'}
                                        onChange={(e) => setEditingCoupon(p => ({ ...p, discountType: e.target.value }))}
                                        className="w-full p-2.5 text-sm border border-slate-200 outline-none focus:border-green-500 rounded-lg bg-white transition"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed ({currency})</option>
                                    </select>
                                </div>
                                <FormInput
                                    label={editingCoupon.discountType === 'fixed' ? `Amount (${currency})` : 'Discount (%)'}
                                    type="number"
                                    min={1}
                                    max={editingCoupon.discountType === 'percentage' ? 100 : undefined}
                                    value={editingCoupon.discount}
                                    onChange={(e) => setEditingCoupon(p => ({ ...p, discount: e.target.value }))}
                                    required
                                />
                            </div>

                            <FormInput
                                label="Description"
                                type="text"
                                value={editingCoupon.description}
                                onChange={(e) => setEditingCoupon(p => ({ ...p, description: e.target.value }))}
                                required
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <FormInput label={`Min Order (${currency})`} type="number" min={0} value={editingCoupon.minOrderAmount} onChange={(e) => setEditingCoupon(p => ({ ...p, minOrderAmount: e.target.value }))} />
                                <FormInput label={`Max Discount (${currency})`} type="number" min={0} value={editingCoupon.maxDiscountAmount} onChange={(e) => setEditingCoupon(p => ({ ...p, maxDiscountAmount: e.target.value }))} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormInput label="Max Total Uses" type="number" min={0} value={editingCoupon.maxUses} onChange={(e) => setEditingCoupon(p => ({ ...p, maxUses: e.target.value }))} />
                                <FormInput label="Per User Limit" type="number" min={1} value={editingCoupon.maxUsesPerUser} onChange={(e) => setEditingCoupon(p => ({ ...p, maxUsesPerUser: e.target.value }))} />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Expiry Date</label>
                                <input
                                    type="date"
                                    value={(() => { try { return format(new Date(editingCoupon.expiresAt), 'yyyy-MM-dd') } catch { return '' } })()}
                                    onChange={(e) => { if (e.target.value) setEditingCoupon(p => ({ ...p, expiresAt: new Date(e.target.value).toISOString() })) }}
                                    className="w-full p-2.5 text-sm border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg transition"
                                    required
                                />
                            </div>

                            <div className="pt-2 space-y-3 border-t border-slate-100 mt-2">
                                <div className="pt-2">
                                    <Toggle label="New Users Only" checked={editingCoupon.forNewUser} onChange={(e) => setEditingCoupon(p => ({ ...p, forNewUser: e.target.checked, ...(e.target.checked && { forMember: false }) }))} />
                                </div>
                                <Toggle label="Plus Members Only" checked={editingCoupon.forMember} onChange={(e) => setEditingCoupon(p => ({ ...p, forMember: e.target.checked, ...(e.target.checked && { forNewUser: false }) }))} />
                                <Toggle label="Active (Enable Coupon)" checked={editingCoupon.isActive} onChange={(e) => setEditingCoupon(p => ({ ...p, isActive: e.target.checked }))} />
                            </div>

                            <div className="flex gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => setEditingCoupon(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition shadow-xs">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}