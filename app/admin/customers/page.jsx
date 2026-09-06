'use client'

import { useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import toast from "react-hot-toast"
import { deleteUser } from "@/lib/features/user/userSlice"
import {
    SearchIcon,
    DownloadIcon,
    EyeIcon,
    XIcon,
    UsersIcon,
    UserPlusIcon,
    ShoppingBagIcon,
    PhoneIcon,
    MailIcon,
    MapPinIcon,
    CalendarIcon,
    CopyIcon,
    CheckIcon,
    FilterIcon,
    TrendingUpIcon,
    XCircleIcon,
    Trash2Icon
} from "lucide-react"

export default function AdminCustomers() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()
    const savedUsers = useSelector(state => state.user.savedUsers)
    const orders = useSelector(state => state.order.orders)

    const [search, setSearch] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [sortBy, setSortBy] = useState("newest") // newest, oldest, name, orders, spent
    const [copiedField, setCopiedField] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    // Only show CUSTOMER role users (exclude admin)
    const customers = useMemo(() => {
        return savedUsers.filter(u => u.role !== 'ADMIN')
    }, [savedUsers])

    // Build customer data with order stats
    const customerData = useMemo(() => {
        return customers.map(customer => {
            const customerOrders = orders.filter(o =>
                o.userId === customer.id ||
                o.user?.id === customer.id ||
                o.user?.email === customer.email ||
                o.user?.phone === customer.phone
            )
            const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0)
            const lastOrderDate = customerOrders.length > 0
                ? customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.createdAt
                : null

            return {
                ...customer,
                orderCount: customerOrders.length,
                totalSpent,
                lastOrderDate,
                defaultAddress: customer.addresses?.find(a => a.isDefault) || customer.addresses?.[0] || null
            }
        })
    }, [customers, orders])

    // Filter & Sort
    const filteredCustomers = useMemo(() => {
        let result = customerData.filter(c => {
            const q = search.toLowerCase()
            return (
                c.name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phone?.includes(q) ||
                c.defaultAddress?.city?.toLowerCase().includes(q)
            )
        })

        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.joinedDate || 0) - new Date(a.joinedDate || 0))
                break
            case 'oldest':
                result.sort((a, b) => new Date(a.joinedDate || 0) - new Date(b.joinedDate || 0))
                break
            case 'name':
                result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                break
            case 'orders':
                result.sort((a, b) => b.orderCount - a.orderCount)
                break
            case 'spent':
                result.sort((a, b) => b.totalSpent - a.totalSpent)
                break
        }

        return result
    }, [customerData, search, sortBy])

    // Stats
    const stats = useMemo(() => {
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const newThisMonth = customerData.filter(c => c.joinedDate && new Date(c.joinedDate) >= thisMonth).length
        const withOrders = customerData.filter(c => c.orderCount > 0).length
        const totalRevenue = customerData.reduce((sum, c) => sum + c.totalSpent, 0)

        return {
            total: customerData.length,
            newThisMonth,
            withOrders,
            totalRevenue
        }
    }, [customerData])

    // Copy to clipboard
    const handleCopy = (text, field) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        toast.success('কপি করা হয়েছে!')
        setTimeout(() => setCopiedField(null), 2000)
    }

    // Delete customer — open confirmation
    const customerToDelete = customerData.find(c => c.id === deletingId) || null

    const confirmDeleteCustomer = () => {
        if (!customerToDelete) return
        try {
            const deleted = JSON.parse(localStorage.getItem('gocart_deleted_user_ids') || '[]')
            if (!deleted.includes(customerToDelete.id)) {
                deleted.push(customerToDelete.id)
                localStorage.setItem('gocart_deleted_user_ids', JSON.stringify(deleted))
            }
            const updated = savedUsers.filter(u => u.id !== customerToDelete.id)
            localStorage.setItem('gocart_users', JSON.stringify(updated))
        } catch (e) { /* ignore */ }

        dispatch(deleteUser(customerToDelete.id))
        toast.success(`${customerToDelete.name} পার্মানেন্টলি ডিলিট করা হয়েছে`)
        if (selectedCustomer?.id === customerToDelete.id) setSelectedCustomer(null)
        setDeletingId(null)
    }

    // Export to Excel (CSV with BOM for Bengali support)
    const handleExportExcel = () => {
        if (filteredCustomers.length === 0) {
            toast.error('এক্সপোর্ট করার মতো কোনো কাস্টমার নেই')
            return
        }

        const headers = [
            'নাম (Name)',
            'ইমেইল (Email)',
            'ফোন (Phone)',
            'শহর (City)',
            'ঠিকানা (Address)',
            'মোট অর্ডার (Total Orders)',
            `মোট খরচ (Total Spent) ${currency}`,
            'শেষ অর্ডার (Last Order)',
            'যোগদান (Joined Date)',
            'স্ট্যাটাস (Status)'
        ]

        const rows = filteredCustomers.map(c => [
            c.name || '',
            c.email || '',
            c.phone || '',
            c.defaultAddress?.city || '',
            c.defaultAddress?.street || '',
            c.orderCount,
            c.totalSpent.toFixed(2),
            c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('bn-BD') : 'N/A',
            c.joinedDate ? new Date(c.joinedDate).toLocaleDateString('bn-BD') : 'N/A',
            c.orderCount > 0 ? 'Active' : 'Inactive'
        ])

        // CSV with UTF-8 BOM for Excel Bengali support
        const csvContent = '\uFEFF' + [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const dateStr = new Date().toISOString().slice(0, 10)
        link.download = `OurStoreBD_Customers_${dateStr}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success(`${filteredCustomers.length} জন কাস্টমারের ডেটা এক্সপোর্ট হয়েছে!`)
    }

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        const date = new Date(dateStr)
        return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const statCards = [
        { title: 'মোট কাস্টমার', value: stats.total, icon: UsersIcon, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
        { title: 'এই মাসে নতুন', value: stats.newThisMonth, icon: UserPlusIcon, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
        { title: 'অর্ডার করেছেন', value: stats.withOrders, icon: ShoppingBagIcon, color: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-100' },
        { title: 'মোট রেভিনিউ', value: `${currency}${stats.totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUpIcon, color: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-100' },
    ]

    // Export single customer data
    function handleExportSingleCustomer(customer) {
        const headers = ['নাম', 'ইমেইল', 'ফোন', 'শহর', 'ঠিকানা', 'মোট অর্ডার', `মোট খরচ (${currency})`, 'যোগদান']
        const row = [
            customer.name || '',
            customer.email || '',
            customer.phone || '',
            customer.defaultAddress?.city || '',
            customer.defaultAddress?.street || '',
            customer.orderCount,
            customer.totalSpent.toFixed(2),
            customer.joinedDate ? new Date(customer.joinedDate).toLocaleDateString('bn-BD') : ''
        ]

        const csvContent = '\uFEFF' + [
            headers.join(','),
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Customer_${(customer.name || 'unknown').replace(/\s+/g, '_')}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success(`${customer.name}-এর ডেটা এক্সপোর্ট হয়েছে!`)
    }

    return (
        <div className="w-full max-w-7xl">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UsersIcon size={24} className="text-green-600" />
                        কাস্টমার ম্যানেজমেন্ট
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">সকল রেজিস্টার্ড কাস্টমারের তথ্য দেখুন ও এক্সপোর্ট করুন</p>
                </div>
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition shadow-sm active:scale-95"
                >
                    <DownloadIcon size={16} />
                    Excel এক্সপোর্ট ({filteredCustomers.length})
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {statCards.map((card, i) => (
                    <div key={i} className={`${card.color} rounded-2xl p-4 sm:p-5 border border-slate-100`}>
                        <div className="flex items-center gap-3">
                            <div className={`${card.iconBg} p-2.5 rounded-xl`}>
                                <card.icon size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] sm:text-xs font-medium opacity-70">{card.title}</p>
                                <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="নাম, ইমেইল, ফোন নম্বর বা শহর দিয়ে সার্চ করুন..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <FilterIcon size={15} className="text-slate-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 bg-white cursor-pointer"
                    >
                        <option value="newest">নতুন আগে</option>
                        <option value="oldest">পুরাতন আগে</option>
                        <option value="name">নাম অনুসারে</option>
                        <option value="orders">বেশি অর্ডার আগে</option>
                        <option value="spent">বেশি খরচ আগে</option>
                    </select>
                </div>
            </div>

            {/* Customer Table */}
            {filteredCustomers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                    <UsersIcon size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">কোনো কাস্টমার পাওয়া যায়নি</p>
                    <p className="text-xs text-slate-400 mt-1">সার্চ পরিবর্তন করে আবার চেষ্টা করুন</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">কাস্টমার</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">যোগাযোগ</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">শহর</th>
                                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">অর্ডার</th>
                                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">মোট খরচ</th>
                                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">স্ট্যাটাস</th>
                                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">অ্যাকশন</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50/60 transition">
                                        {/* Customer Info */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'U')}&background=e2e8f0&color=475569&bold=true`}
                                                    alt={customer.name}
                                                    className="w-9 h-9 rounded-full object-cover border-2 border-slate-100 shrink-0"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{customer.name}</p>
                                                    <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                                                        {formatDate(customer.joinedDate)} থেকে
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="px-4 py-3.5">
                                            <p className="text-xs text-slate-600 truncate max-w-[180px]">{customer.email || '—'}</p>
                                            <p className="text-xs text-slate-500 font-mono">{customer.phone || '—'}</p>
                                        </td>

                                        {/* City */}
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs text-slate-600">{customer.defaultAddress?.city || '—'}</span>
                                        </td>

                                        {/* Orders */}
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`text-sm font-bold ${customer.orderCount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                                {customer.orderCount}
                                            </span>
                                        </td>

                                        {/* Total Spent */}
                                        <td className="px-4 py-3.5 text-right">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {currency}{customer.totalSpent.toLocaleString('en-IN')}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3.5 text-center">
                                            {customer.orderCount > 0 ? (
                                                <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-semibold">
                                                    সক্রিয়
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[11px] font-semibold">
                                                    নিষ্ক্রিয়
                                                </span>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setSelectedCustomer(customer)}
                                                    className="p-2 hover:bg-green-50 text-slate-500 hover:text-green-600 rounded-lg transition"
                                                    title="বিস্তারিত দেখুন"
                                                >
                                                    <EyeIcon size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingId(customer.id)}
                                                    className="p-2 rounded-lg transition hover:bg-red-50 text-slate-400 hover:text-red-500"
                                                    title="ডিলিট করুন"
                                                >
                                                    <Trash2Icon size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            মোট <strong className="text-slate-700">{filteredCustomers.length}</strong> জন কাস্টমার দেখানো হচ্ছে
                        </p>
                        <button
                            onClick={handleExportExcel}
                            className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 transition"
                        >
                            <DownloadIcon size={13} />
                            CSV ডাউনলোড
                        </button>
                    </div>
                </div>
            )}

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <div
                    onClick={() => setSelectedCustomer(null)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={() => setSelectedCustomer(null)}
                            className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                        >
                            <XCircleIcon size={22} />
                        </button>

                        {/* Customer Header */}
                        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 mb-5">
                            <img
                                src={selectedCustomer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.name || 'U')}&size=120&background=e2e8f0&color=475569&bold=true`}
                                alt={selectedCustomer.name}
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-green-100"
                            />
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-slate-800 truncate">{selectedCustomer.name}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    কাস্টমার আইডি: <span className="font-mono">{selectedCustomer.id}</span>
                                </p>
                                {selectedCustomer.orderCount > 0 ? (
                                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[11px] font-semibold">
                                        সক্রিয় কাস্টমার
                                    </span>
                                ) : (
                                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[11px] font-semibold">
                                        নিষ্ক্রিয়
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-blue-700">{selectedCustomer.orderCount}</p>
                                <p className="text-[10px] font-medium text-blue-600">মোট অর্ডার</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-green-700">{currency}{selectedCustomer.totalSpent.toLocaleString('en-IN')}</p>
                                <p className="text-[10px] font-medium text-green-600">মোট খরচ</p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-purple-700">{selectedCustomer.addresses?.length || 0}</p>
                                <p className="text-[10px] font-medium text-purple-600">ঠিকানা</p>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">যোগাযোগ তথ্য</h3>
                            <div className="space-y-2.5">
                                {selectedCustomer.phone && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <PhoneIcon size={14} className="text-slate-400" />
                                            <span className="text-sm text-slate-700 font-mono">{selectedCustomer.phone}</span>
                                        </div>
                                        <button onClick={() => handleCopy(selectedCustomer.phone, 'phone')} className="p-1 hover:bg-slate-200 rounded transition">
                                            {copiedField === 'phone' ? <CheckIcon size={14} className="text-green-600" /> : <CopyIcon size={14} className="text-slate-400" />}
                                        </button>
                                    </div>
                                )}
                                {selectedCustomer.email && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <MailIcon size={14} className="text-slate-400" />
                                            <span className="text-sm text-slate-700">{selectedCustomer.email}</span>
                                        </div>
                                        <button onClick={() => handleCopy(selectedCustomer.email, 'email')} className="p-1 hover:bg-slate-200 rounded transition">
                                            {copiedField === 'email' ? <CheckIcon size={14} className="text-green-600" /> : <CopyIcon size={14} className="text-slate-400" />}
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2.5">
                                    <CalendarIcon size={14} className="text-slate-400" />
                                    <span className="text-sm text-slate-600">যোগদান: {formatDate(selectedCustomer.joinedDate)}</span>
                                </div>
                                {selectedCustomer.lastOrderDate && (
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBagIcon size={14} className="text-slate-400" />
                                        <span className="text-sm text-slate-600">শেষ অর্ডার: {formatDate(selectedCustomer.lastOrderDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Addresses */}
                        {selectedCustomer.addresses?.length > 0 && (
                            <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">ডেলিভারি ঠিকানাসমূহ</h3>
                                <div className="space-y-2">
                                    {selectedCustomer.addresses.map((addr, idx) => (
                                        <div key={addr.id || idx} className="bg-white rounded-xl p-3 border border-slate-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-2">
                                                    <MapPinIcon size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-700">{addr.label || addr.name}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{addr.street}, {addr.city} {addr.zip ? `- ${addr.zip}` : ''}</p>
                                                        {addr.phone && <p className="text-xs text-slate-400 font-mono mt-0.5">{addr.phone}</p>}
                                                    </div>
                                                </div>
                                                {addr.isDefault && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold shrink-0">ডিফল্ট</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => {
                                    const text = `${selectedCustomer.name}\n${selectedCustomer.phone || ''}\n${selectedCustomer.email || ''}`
                                    handleCopy(text, 'all')
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                            >
                                <CopyIcon size={14} />
                                কাস্টমার তথ্য কপি
                            </button>
                            <button
                                onClick={() => {
                                    handleExportSingleCustomer(selectedCustomer)
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
                            >
                                <DownloadIcon size={14} />
                                এক্সপোর্ট
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {customerToDelete && (
                <div
                    onClick={() => setDeletingId(null)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center"
                    >
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2Icon size={24} className="text-red-500" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-1">কাস্টমার ডিলিট করুন?</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            <strong className="text-slate-700">{customerToDelete.name}</strong> কে পার্মানেন্টলি ডিলিট করতে চান?
                        </p>

                        <div className="flex items-center justify-center gap-2 bg-slate-50 rounded-xl p-3 mb-5">
                            <img
                                src={customerToDelete.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customerToDelete.name || 'U')}&background=e2e8f0&color=475569&bold=true`}
                                alt={customerToDelete.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div className="text-left">
                                <p className="text-xs font-semibold text-slate-700">{customerToDelete.name}</p>
                                <p className="text-[11px] text-slate-400">{customerToDelete.phone || customerToDelete.email}</p>
                            </div>
                        </div>

                        <p className="text-[11px] text-red-500 mb-5 bg-red-50 rounded-lg py-2 px-3">
                            ⚠️ এই কাজটি ফেরানো যাবে না। সকল ডেটা মুছে যাবে।
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
                            >
                                বাতিল
                            </button>
                            <button
                                onClick={confirmDeleteCustomer}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Trash2Icon size={14} />
                                ডিলিট করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
