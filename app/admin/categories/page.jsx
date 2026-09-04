'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
} from '@/lib/features/category/categorySlice'
import { updateProduct } from '@/lib/features/product/productSlice'
import {
    Plus,
    PencilIcon,
    Trash2,
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff,
    SaveIcon,
    XIcon,
    Grid3X3,
    GripVertical,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminCategoriesPage() {
    const dispatch = useDispatch()
    const categories = useSelector(state => state.category?.categories || [])
    const allProducts = useSelector(state => state.product?.list || [])

    // Sort by order
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

    // State
    const [newCatName, setNewCatName] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editingName, setEditingName] = useState('')
    const [deleteConfirmId, setDeleteConfirmId] = useState(null)

    // Count products per category (supports multi-category)
    const getProductCount = (catName) => {
        return allProducts.filter(p => {
            if (p.categories && Array.isArray(p.categories)) {
                return p.categories.includes(catName)
            }
            return p.category === catName
        }).length
    }

    // Add new category
    const handleAdd = () => {
        const name = newCatName.trim()
        if (!name) {
            toast.error('ক্যাটাগরির নাম লিখুন')
            return
        }
        // Check duplicate
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            toast.error('এই নামে ক্যাটাগরি আগে থেকেই আছে')
            return
        }
        dispatch(addCategory({ name }))
        setNewCatName('')
        toast.success(`"${name}" ক্যাটাগরি সফলভাবে যোগ করা হয়েছে!`)
    }

    // Start editing
    const startEdit = (cat) => {
        setEditingId(cat.id)
        setEditingName(cat.name)
        setDeleteConfirmId(null) // Reset delete confirm when starting edit
    }

    // Save edit
    const saveEdit = () => {
        const name = editingName.trim()
        if (!name) {
            toast.error('ক্যাটাগরির নাম ফাঁকা রাখা যাবে না')
            return
        }
        // Check duplicate (excluding current)
        if (categories.some(c => c.id !== editingId && c.name.toLowerCase() === name.toLowerCase())) {
            toast.error('এই নামে অন্য ক্যাটাগরি আছে')
            return
        }
        const oldName = categories.find(c => c.id === editingId)?.name
        dispatch(updateCategory({ id: editingId, name }))
        // Update all products that reference the old category name
        if (oldName && oldName !== name) {
            allProducts.forEach(p => {
                let needsUpdate = false
                let updatedProduct = { ...p }
                if (p.category === oldName) {
                    updatedProduct.category = name
                    needsUpdate = true
                }
                if (p.categories && Array.isArray(p.categories) && p.categories.includes(oldName)) {
                    updatedProduct.categories = p.categories.map(c => c === oldName ? name : c)
                    needsUpdate = true
                }
                if (needsUpdate) {
                    dispatch(updateProduct(updatedProduct))
                }
            })
        }
        setEditingId(null)
        setEditingName('')
        toast.success('ক্যাটাগরির নাম আপডেট করা হয়েছে!')
    }

    // Cancel edit
    const cancelEdit = () => {
        setEditingId(null)
        setEditingName('')
    }

    // Toggle visibility
    const toggleVisibility = (cat) => {
        dispatch(updateCategory({ id: cat.id, visible: !cat.visible }))
        toast.success(cat.visible ? `"${cat.name}" লুকানো হয়েছে` : `"${cat.name}" দৃশ্যমান করা হয়েছে`)
    }

    // Move up / down
    const moveUp = (id) => {
        dispatch(reorderCategory({ id, direction: 'up' }))
    }

    const moveDown = (id) => {
        dispatch(reorderCategory({ id, direction: 'down' }))
    }

    // Delete
    const confirmDelete = (id) => {
        const cat = categories.find(c => c.id === id)
        dispatch(deleteCategory(id))
        setDeleteConfirmId(null)
        setEditingId(null) // Reset edit state
        toast.success(`"${cat?.name || ''}" ক্যাটাগরি মুছে ফেলা হয়েছে!`)
    }

    return (
        <div className="pb-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Grid3X3 size={28} className="text-green-600" />
                        Categories Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        ক্যাটাগরি যোগ, নাম পরিবর্তন, ক্রম পরিবর্তন ও কন্ট্রোল করুন
                    </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm">
                    <span className="text-green-800 font-semibold">{sortedCategories.length}</span>
                    <span className="text-green-600 ml-1">টি ক্যাটাগরি</span>
                </div>
            </div>

            {/* Add New Category */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs mb-6">
                <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-green-600" />
                    নতুন ক্যাটাগরি যোগ করুন
                </h2>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="ক্যাটাগরির নাম লিখুন (যেমন: Mobile, Laptop...)"
                        className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                        <Plus size={16} />
                        যোগ করুন
                    </button>
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-base font-bold text-slate-700">সকল ক্যাটাগরি</h2>
                    <p className="text-xs text-slate-400 mt-0.5">উপরে-নিচে তীর চিহ্ন দিয়ে ক্রম পরিবর্তন করুন, পেন্সিল আইকনে ক্লিক করে নাম পরিবর্তন করুন</p>
                </div>

                {sortedCategories.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <Grid3X3 size={48} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium">কোনো ক্যাটাগরি নেই</p>
                        <p className="text-xs mt-1">উপরে থেকে নতুন ক্যাটাগরি যোগ করুন</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {sortedCategories.map((cat, index) => (
                            <div
                                key={cat.id}
                                className={`flex items-center gap-3 px-5 sm:px-6 py-3.5 hover:bg-slate-50/50 transition group ${
                                    !cat.visible ? 'opacity-50 bg-slate-50' : ''
                                }`}
                            >
                                {/* Drag Handle & Order */}
                                <div className="flex items-center gap-1 text-slate-300 shrink-0">
                                    <GripVertical size={16} />
                                    <span className="text-xs font-mono text-slate-400 w-5 text-center">
                                        {index + 1}
                                    </span>
                                </div>

                                {/* Up / Down Buttons */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                    <button
                                        onClick={() => moveUp(cat.id)}
                                        disabled={index === 0}
                                        className="p-0.5 rounded hover:bg-green-100 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                                        title="উপরে সরান"
                                    >
                                        <ChevronUp size={14} className="text-green-700" />
                                    </button>
                                    <button
                                        onClick={() => moveDown(cat.id)}
                                        disabled={index === sortedCategories.length - 1}
                                        className="p-0.5 rounded hover:bg-green-100 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                                        title="নিচে সরান"
                                    >
                                        <ChevronDown size={14} className="text-green-700" />
                                    </button>
                                </div>

                                {/* Category Name */}
                                <div className="flex-1 min-w-0">
                                    {editingId === cat.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit()
                                                    if (e.key === 'Escape') cancelEdit()
                                                }}
                                                autoFocus
                                                className="flex-1 px-3 py-1.5 text-sm border border-green-400 rounded-lg outline-none focus:ring-2 focus:ring-green-100 transition"
                                            />
                                            <button
                                                onClick={saveEdit}
                                                className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition cursor-pointer"
                                                title="সংরক্ষণ করুন"
                                            >
                                                <SaveIcon size={14} />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition cursor-pointer"
                                                title="বাতিল"
                                            >
                                                <XIcon size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-700 truncate">
                                                {cat.name}
                                            </span>
                                            {!cat.visible && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                                                    লুকানো
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Product Count */}
                                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 shrink-0 min-w-[80px] justify-end">
                                    <span className="font-semibold text-slate-600">{getProductCount(cat.name)}</span>
                                    <span>টি পণ্য</span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {/* Visibility Toggle */}
                                    <button
                                        onClick={() => toggleVisibility(cat)}
                                        className={`p-2 rounded-lg transition cursor-pointer ${
                                            cat.visible
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-amber-500 hover:bg-amber-50'
                                        }`}
                                        title={cat.visible ? 'লুকান (Hide)' : 'দেখান (Show)'}
                                    >
                                        {cat.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>

                                    {/* Edit */}
                                    <button
                                        onClick={() => startEdit(cat)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                        title="নাম পরিবর্তন করুন (Rename)"
                                    >
                                        <PencilIcon size={16} />
                                    </button>

                                    {/* Delete */}
                                    {deleteConfirmId === cat.id ? (
                                        <div className="flex items-center gap-1 animate-[fadeIn_0.15s_ease-out]">
                                            {getProductCount(cat.name) > 0 && (
                                                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium mr-1">
                                                    {getProductCount(cat.name)}টি পণ্য আছে!
                                                </span>
                                            )}
                                            <button
                                                onClick={() => confirmDelete(cat.id)}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition text-xs font-bold cursor-pointer"
                                                title="নিশ্চিত মুছুন"
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                                title="বাতিল"
                                            >
                                                <XIcon size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setDeleteConfirmId(cat.id)
                                                setEditingId(null) // Reset edit state when starting delete
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                            title="মুছে ফেলুন (Delete)"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Help / Tips */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} />
                    ক্যাটাগরি ম্যানেজমেন্ট গাইড
                </h3>
                <ul className="text-xs text-blue-700 space-y-1.5 list-disc list-inside">
                    <li><strong>ক্রম পরিবর্তন:</strong> উপর/নিচ তীর চিহ্ন (▲ ▼) দিয়ে ক্যাটাগরির পজিশন বদলান — এই ক্রমেই Navbar-এর Categories ড্রপডাউনে দেখাবে।</li>
                    <li><strong>নাম পরিবর্তন:</strong> পেন্সিল আইকনে ক্লিক করে নতুন নাম দিন, Enter চাপুন বা সবুজ টিক দিন।</li>
                    <li><strong>লুকানো/দৃশ্যমান:</strong> চোখের আইকনে ক্লিক করলে ক্যাটাগরি Navbar থেকে লুকানো বা দেখানো যাবে।</li>
                    <li><strong>নতুন ক্যাটাগরি:</strong> উপরে নাম লিখে &quot;যোগ করুন&quot; বাটনে ক্লিক করুন — নতুন প্রোডাক্ট যোগ করার সময় এই ক্যাটাগরি পাবেন।</li>
                    <li><strong>মুছে ফেলা:</strong> ট্র্যাশ আইকনে ক্লিক করলে নিশ্চিতকরণ চাইবে — এটি শুধু ক্যাটাগরি মুছবে, পণ্য মুছবে না।</li>
                </ul>
            </div>
        </div>
    )
}
