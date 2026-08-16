'use client'

import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { DeleteIcon, PencilIcon, SearchIcon, TicketIcon, PlusIcon, XIcon, CheckCircleIcon } from "lucide-react"
import { couponDummyData } from "@/assets/assets"

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([])
    const [search, setSearch] = useState('')
    const [deletingCouponCode, setDeletingCouponCode] = useState(null)
    const [editingCoupon, setEditingCoupon] = useState(null)

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount: '',
        forNewUser: false,
        forMember: false,
        isPublic: true,
        expiresAt: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    })

    const fetchCoupons = async () => {
        setCoupons(couponDummyData)
    }

    const handleAddCoupon = (e) => {
        e.preventDefault()

        if (!newCoupon.code.trim()) {
            toast.error('Please enter a valid coupon code')
            return
        }

        const formattedCode = newCoupon.code.toUpperCase().trim()

        if (coupons.some(c => c.code === formattedCode)) {
            toast.error('A coupon with this code already exists!')
            return
        }

        const couponToAdd = {
            ...newCoupon,
            code: formattedCode,
            discount: parseFloat(newCoupon.discount) || 10,
            expiresAt: new Date(newCoupon.expiresAt).toISOString(),
            createdAt: new Date().toISOString()
        }

        setCoupons(prev => [couponToAdd, ...prev])
        toast.success(`Coupon "${formattedCode}" created successfully!`)

        // Reset Form
        setNewCoupon({
            code: '',
            description: '',
            discount: '',
            forNewUser: false,
            forMember: false,
            isPublic: true,
            expiresAt: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        })
    }

    const handleChange = (e) => {
        setNewCoupon({ ...newCoupon, [e.target.name]: e.target.value })
    }

    const confirmDelete = () => {
        setCoupons(prev => prev.filter(c => c.code !== deletingCouponCode))
        toast.success(`Coupon "${deletingCouponCode}" deleted!`)
        setDeletingCouponCode(null)
    }

    const handleEditSave = (e) => {
        e.preventDefault()
        setCoupons(prev => prev.map(c => c.code === editingCoupon.code ? editingCoupon : c))
        toast.success(`Coupon "${editingCoupon.code}" updated!`)
        setEditingCoupon(null)
    }

    useEffect(() => {
        fetchCoupons()
    }, [])

    const filteredCoupons = coupons.filter(c => 
        c.code.toLowerCase().includes(search.toLowerCase()) || 
        c.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="text-slate-700 mb-40 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
                    Manage <span className="text-green-600">Coupons</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Create, edit, and delete promotional discount coupons for your store
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to Add Coupon */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs h-fit">
                    <div className="flex items-center gap-2 mb-4">
                        <TicketIcon className="text-green-600" size={20} />
                        <h2 className="text-lg font-bold text-slate-800">Create New Coupon</h2>
                    </div>

                    <form onSubmit={handleAddCoupon} className="space-y-4 text-sm">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Coupon Code</label>
                            <input
                                type="text"
                                placeholder="e.g. SUMMER50"
                                className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg uppercase tracking-wider font-semibold"
                                name="code"
                                value={newCoupon.code}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Discount (%)</label>
                            <input
                                type="number"
                                placeholder="20"
                                min={1}
                                max={100}
                                className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg"
                                name="discount"
                                value={newCoupon.discount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                placeholder="20% Off summer sale discount"
                                className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg"
                                name="description"
                                value={newCoupon.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date</label>
                            <input
                                type="date"
                                className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg"
                                name="expiresAt"
                                value={newCoupon.expiresAt}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="pt-2 space-y-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        name="forNewUser"
                                        checked={newCoupon.forNewUser}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, forNewUser: e.target.checked })}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                                <span className="text-xs text-slate-700 font-medium">For New Users Only</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        name="forMember"
                                        checked={newCoupon.forMember}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, forMember: e.target.checked })}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                                <span className="text-xs text-slate-700 font-medium">For Plus Members Only</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-medium rounded-lg transition shadow-xs flex items-center justify-center gap-2 mt-4"
                        >
                            <PlusIcon size={18} />
                            <span>Add Coupon</span>
                        </button>
                    </form>
                </div>

                {/* List Coupons */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-xs">
                        <div className="relative w-full sm:w-72">
                            <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search coupon code..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                            />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                            Total: {filteredCoupons.length}
                        </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-4 font-semibold">Code</th>
                                        <th className="py-3.5 px-4 font-semibold">Discount</th>
                                        <th className="py-3.5 px-4 font-semibold">Expiry</th>
                                        <th className="py-3.5 px-4 font-semibold">Conditions</th>
                                        <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCoupons.length > 0 ? (
                                        filteredCoupons.map((coupon) => (
                                            <tr key={coupon.code} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-mono font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs border border-green-200">
                                                        {coupon.code}
                                                    </span>
                                                    <p className="text-xs text-slate-400 mt-1">{coupon.description}</p>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-800">
                                                    {coupon.discount}% OFF
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-slate-500">
                                                    {format(new Date(coupon.expiresAt), 'yyyy-MM-dd')}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs">
                                                    {coupon.forNewUser && <span className="block text-blue-600 font-medium">• New User</span>}
                                                    {coupon.forMember && <span className="block text-purple-600 font-medium">• Member</span>}
                                                    {!coupon.forNewUser && !coupon.forMember && <span className="text-slate-400">All Users</span>}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setEditingCoupon({ ...coupon })}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Edit Coupon"
                                                        >
                                                            <PencilIcon size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingCouponCode(coupon.code)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete Coupon"
                                                        >
                                                            <DeleteIcon size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                                                No coupons found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE COUPON MODAL */}
            {deletingCouponCode && (
                <div onClick={() => setDeletingCouponCode(null)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DeleteIcon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Delete Coupon?</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            Are you sure you want to delete coupon <strong className="text-slate-800">{deletingCouponCode}</strong>?
                        </p>

                        <div className="flex gap-3 justify-center mt-6">
                            <button
                                onClick={() => setDeletingCouponCode(null)}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition shadow-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT COUPON MODAL */}
            {editingCoupon && (
                <div onClick={() => setEditingCoupon(null)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 relative">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Edit Coupon ({editingCoupon.code})</h3>
                            <button onClick={() => setEditingCoupon(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                <XIcon size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSave} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Discount (%)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={editingCoupon.discount}
                                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discount: parseFloat(e.target.value) || 0 })}
                                    className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 rounded-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={editingCoupon.description}
                                    onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                                    className="w-full p-2.5 border border-slate-200 outline-none focus:border-green-500 rounded-lg"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingCoupon(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition shadow-xs"
                                >
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