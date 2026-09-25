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
import { saveDocToFirestore, deleteDocFromFirestore, isFirebaseConfigured } from '@/lib/firestoreAdminApi'
import { compressImage } from '@/lib/imageCompressor'
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
    Camera,
    Image as ImageIcon,
    Upload,
    Loader2,
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
    const [newCatImage, setNewCatImage] = useState(null)
    const [newCatImageLoading, setNewCatImageLoading] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editingName, setEditingName] = useState('')
    const [deleteConfirmId, setDeleteConfirmId] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [reorderingId, setReorderingId] = useState(null)
    const [uploadingId, setUploadingId] = useState(null)

    // Image Modal State
    const [imageModalCat, setImageModalCat] = useState(null)
    const [modalImagePreview, setModalImagePreview] = useState(null)
    const [modalUrlInput, setModalUrlInput] = useState('')

    // Open image modal
    const openImageModal = (cat) => {
        setImageModalCat(cat)
        setModalImagePreview(cat.image || null)
        setModalUrlInput(cat.image && !cat.image.startsWith('data:') ? cat.image : '')
    }

    // Close image modal
    const closeImageModal = () => {
        setImageModalCat(null)
        setModalImagePreview(null)
        setModalUrlInput('')
    }

    // Direct Image Upload from file input
    const handleImageUpload = async (cat, file) => {
        if (!file || !cat) return
        setUploadingId(cat.id)
        try {
            const compressed = await compressImage(file, 200, 200, 0.85)
            if (!compressed) {
                toast.error('ইমেজ প্রসেস করা যায়নি')
                return
            }
            if (isFirebaseConfigured()) {
                const ok = await saveDocToFirestore('categories', cat.id, { image: compressed })
                if (!ok) {
                    toast.error('ডাটাবেজে ইমেজ সেভ করা যায়নি!')
                    return
                }
            }
            dispatch(updateCategory({ id: cat.id, image: compressed }))
            toast.success(`"${cat.name}" এর ইমেজ সফলভাবে আপডেট হয়েছে!`)
        } catch (err) {
            console.error('Category image upload error:', err)
            toast.error('ইমেজ আপলোড ব্যর্থ হয়েছে')
        } finally {
            setUploadingId(null)
        }
    }

    // Remove Image
    const handleRemoveImage = async (cat) => {
        if (!cat) return
        setIsSaving(true)
        try {
            if (isFirebaseConfigured()) {
                const ok = await saveDocToFirestore('categories', cat.id, { image: null })
                if (!ok) {
                    toast.error('ডাটাবেজে পরিবর্তন সেভ করা যায়নি!')
                    return
                }
            }
            dispatch(updateCategory({ id: cat.id, image: null }))
            if (imageModalCat?.id === cat.id) {
                setModalImagePreview(null)
                setModalUrlInput('')
            }
            toast.success(`"${cat.name}" এর ইমেজ মুছে ফেলা হয়েছে!`)
        } catch (err) {
            console.error('Remove image error:', err)
            toast.error('ইমেজ মুছতে সমস্যা হয়েছে')
        } finally {
            setIsSaving(false)
        }
    }

    // Save Image from Modal
    const handleSaveModalImage = async () => {
        if (!imageModalCat || isSaving) return
        setIsSaving(true)
        try {
            const finalImage = modalImagePreview || null
            if (isFirebaseConfigured()) {
                const ok = await saveDocToFirestore('categories', imageModalCat.id, { image: finalImage })
                if (!ok) {
                    toast.error('ডাটাবেজে ইমেজ সেভ করা যায়নি!')
                    return
                }
            }
            dispatch(updateCategory({ id: imageModalCat.id, image: finalImage }))
            toast.success(`"${imageModalCat.name}" এর ইমেজ সংরক্ষিত হয়েছে!`)
            closeImageModal()
        } catch (err) {
            console.error('Save modal image error:', err)
            toast.error('ইমেজ সংরক্ষণ ব্যর্থ হয়েছে')
        } finally {
            setIsSaving(false)
        }
    }

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
    const handleAdd = async () => {
        if (isSaving) return
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
        setIsSaving(true)
        try {
            const newId = 'cat_' + Date.now()
            const newCat = { id: newId, name, order: categories.length, visible: true, image: newCatImage || null }
            if (isFirebaseConfigured()) {
                const ok = await saveDocToFirestore('categories', newId, newCat)
                if (!ok) { toast.error('ডাটাবেজে সেভ করতে সমস্যা হয়েছে'); return }
            }
            dispatch(addCategory({ name, id: newId, image: newCatImage || null }))
            setNewCatName('')
            setNewCatImage(null)
            toast.success(`"${name}" ক্যাটাগরি সফলভাবে যোগ করা হয়েছে!`)
        } finally {
            setIsSaving(false)
        }
    }

    // Start editing
    const startEdit = (cat) => {
        setEditingId(cat.id)
        setEditingName(cat.name)
        setDeleteConfirmId(null) // Reset delete confirm when starting edit
    }

    // Save edit
    const saveEdit = async () => {
        if (isSaving) return
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
        setIsSaving(true)
        try {
            const oldName = categories.find(c => c.id === editingId)?.name
            if (isFirebaseConfigured()) {
                const ok = await saveDocToFirestore('categories', editingId, { name })
                if (!ok) {
                    toast.error('ক্যাটাগরি ডাটাবেজে সেভ করা যায়নি!')
                    return
                }
            }
            dispatch(updateCategory({ id: editingId, name }))
            // Update all products that reference the old category name
            if (oldName && oldName !== name) {
                const productsToUpdate = allProducts.filter(p => {
                    if (p.category === oldName) return true
                    if (p.categories && Array.isArray(p.categories) && p.categories.includes(oldName)) return true
                    return false
                })
                const updatePromises = productsToUpdate.map(p => {
                    let updatedProduct = { ...p }
                    if (p.category === oldName) updatedProduct.category = name
                    if (p.categories && Array.isArray(p.categories) && p.categories.includes(oldName)) {
                        updatedProduct.categories = p.categories.map(c => c === oldName ? name : c)
                    }
                    dispatch(updateProduct(updatedProduct))
                    if (isFirebaseConfigured()) {
                        return saveDocToFirestore('products', updatedProduct.id || updatedProduct._id, updatedProduct)
                    }
                    return Promise.resolve(true)
                })
                const results = await Promise.allSettled(updatePromises)
                const failed = results.filter(r => r.status === 'rejected' || r.value === false)
                if (failed.length > 0) {
                    toast.error(`${failed.length}টি প্রোডাক্টের ক্যাটাগরি আপডেট ব্যর্থ হয়েছে`)
                }
            }
            setEditingId(null)
            setEditingName('')
            toast.success('ক্যাটাগরির নাম আপডেট করা হয়েছে!')
        } finally {
            setIsSaving(false)
        }
    }

    // Cancel edit
    const cancelEdit = () => {
        setEditingId(null)
        setEditingName('')
    }

    // Toggle visibility
    const toggleVisibility = async (cat) => {
        if (isSaving) return
        setIsSaving(true)
        try {
            if (isFirebaseConfigured()) {
                const ok = await saveDocToFirestore('categories', cat.id, { visible: !cat.visible })
                if (!ok) { toast.error('ডাটাবেজে সেভ করা যায়নি'); return }
            }
            dispatch(updateCategory({ id: cat.id, visible: !cat.visible }))
            toast.success(cat.visible ? `"${cat.name}" লুকানো হয়েছে` : `"${cat.name}" দৃশ্যমান করা হয়েছে`)
        } finally {
            setIsSaving(false)
        }
    }

    // Move up / down
    const moveUp = async (id) => {
        if (reorderingId) return
        setReorderingId(id)
        try {
            const sorted = [...categories].sort((a, b) => (a?.order || 0) - (b?.order || 0))
            const index = sorted.findIndex(c => c?.id === id)
            if (index <= 0) return

            const prevCat = sorted[index - 1]
            const currCat = sorted[index]
            const prevOrder = prevCat?.order ?? (index - 1)
            const currOrder = currCat?.order ?? index

            dispatch(reorderCategory({ id, direction: 'up' }))

            if (isFirebaseConfigured() && prevCat?.id && currCat?.id) {
                await Promise.all([
                    saveDocToFirestore('categories', currCat.id, { order: prevOrder }),
                    saveDocToFirestore('categories', prevCat.id, { order: currOrder })
                ])
            }
        } finally {
            setReorderingId(null)
        }
    }

    const moveDown = async (id) => {
        if (reorderingId) return
        setReorderingId(id)
        try {
            const sorted = [...categories].sort((a, b) => (a?.order || 0) - (b?.order || 0))
            const index = sorted.findIndex(c => c?.id === id)
            if (index < 0 || index >= sorted.length - 1) return

            const nextCat = sorted[index + 1]
            const currCat = sorted[index]
            const nextOrder = nextCat?.order ?? (index + 1)
            const currOrder = currCat?.order ?? index

            dispatch(reorderCategory({ id, direction: 'down' }))

            if (isFirebaseConfigured() && nextCat?.id && currCat?.id) {
                await Promise.all([
                    saveDocToFirestore('categories', currCat.id, { order: nextOrder }),
                    saveDocToFirestore('categories', nextCat.id, { order: currOrder })
                ])
            }
        } finally {
            setReorderingId(null)
        }
    }

    // Delete
    const confirmDelete = async (id) => {
        if (isDeleting) return
        setIsDeleting(true)
        try {
            const cat = categories.find(c => c.id === id)
            if (isFirebaseConfigured()) {
                const ok = await deleteDocFromFirestore('categories', id)
                if (!ok) { toast.error('ডাটাবেজ থেকে মুছতে সমস্যা হয়েছে'); return }
            }
            dispatch(deleteCategory(id))
            setDeleteConfirmId(null)
            setEditingId(null) // Reset edit state
            toast.success(`"${cat?.name || ''}" ক্যাটাগরি মুছে ফেলা হয়েছে!`)
        } finally {
            setIsDeleting(false)
        }
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
                        ক্যাটাগরি যোগ, ইমেজ আপলোড/পরিবর্তন, নাম ও ক্রম পরিবর্তন করুন
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Optional Image Picker for New Category */}
                    <div className="relative shrink-0 flex items-center gap-2">
                        <label
                            htmlFor="new-cat-img-input"
                            className="w-11 h-11 rounded-xl border-2 border-dashed border-slate-300 hover:border-green-500 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer transition relative group shadow-2xs"
                            title="ক্যাটাগরি ইমেজ নির্বাচন করুন (ঐচ্ছিক)"
                        >
                            {newCatImage ? (
                                <>
                                    <img src={newCatImage} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Camera size={14} />
                                    </div>
                                </>
                            ) : newCatImageLoading ? (
                                <Loader2 size={16} className="text-green-600 animate-spin" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-green-600 transition">
                                    <ImageIcon size={18} />
                                    <span className="text-[8px] font-bold text-slate-400 group-hover:text-green-600 scale-90 leading-none mt-0.5">
                                        +ছবি
                                    </span>
                                </div>
                            )}
                        </label>
                        <input
                            id="new-cat-img-input"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setNewCatImageLoading(true)
                                try {
                                    const compressed = await compressImage(file, 200, 200, 0.85)
                                    if (compressed) {
                                        setNewCatImage(compressed)
                                        toast.success('ইমেজ নির্বাচিত হয়েছে!')
                                    } else {
                                        toast.error('ইমেজ প্রসেস করা যায়নি')
                                    }
                                } catch {
                                    toast.error('ইমেজ আপলোড ব্যর্থ হয়েছে')
                                } finally {
                                    setNewCatImageLoading(false)
                                    e.target.value = ''
                                }
                            }}
                        />
                        {newCatImage && (
                            <button
                                type="button"
                                onClick={() => setNewCatImage(null)}
                                className="w-5 h-5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer"
                                title="ইমেজ বাতিল করুন"
                            >
                                ×
                            </button>
                        )}
                    </div>

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
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        যোগ করুন
                    </button>
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-base font-bold text-slate-700">সকল ক্যাটাগরি</h2>
                    <p className="text-xs text-slate-400 mt-0.5">ছবি আইকনে ক্লিক করে সরাসরি ইমেজ আপলোড বা পরিবর্তন করুন, তীর চিহ্ন দিয়ে ক্রম পরিবর্তন করুন</p>
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

                                {/* Category Image Thumbnail (Click to upload/change image) */}
                                <div className="relative shrink-0">
                                    <label
                                        htmlFor={`cat-img-${cat.id}`}
                                        className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:border-green-500 flex items-center justify-center overflow-hidden cursor-pointer transition relative group/thumb shadow-2xs"
                                        title="ইমেজ আপলোড বা পরিবর্তন করতে ক্লিক করুন"
                                    >
                                        {uploadingId === cat.id ? (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                <Loader2 size={16} className="text-green-600 animate-spin" />
                                            </div>
                                        ) : cat.image ? (
                                            <>
                                                <img
                                                    src={cat.image}
                                                    alt={cat.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Camera size={13} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-300 group-hover/thumb:text-green-600 transition">
                                                <ImageIcon size={18} />
                                                <span className="text-[8px] font-bold text-slate-400 group-hover/thumb:text-green-600 scale-90 leading-none mt-0.5">
                                                    +ছবি
                                                </span>
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        id={`cat-img-${cat.id}`}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/gif"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(cat, file)
                                            e.target.value = ''
                                        }}
                                    />
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
                                    {/* Image Upload/Modal Button */}
                                    <button
                                        onClick={() => openImageModal(cat)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                        title="ইমেজ অপশন (আপলোড / পরিবর্তন / URL)"
                                    >
                                        <Camera size={16} />
                                    </button>

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

                                    {/* Edit Name */}
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

            {/* Image Upload & Management Modal */}
            {imageModalCat && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                    <ImageIcon size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">ক্যাটাগরি ইমেজ</h3>
                                    <p className="text-xs text-slate-500">{imageModalCat.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeImageModal}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <XIcon size={18} />
                            </button>
                        </div>

                        {/* Image Preview Box */}
                        <div className="flex flex-col items-center justify-center py-5 bg-slate-50 rounded-xl border border-slate-200/80">
                            {modalImagePreview ? (
                                <div className="relative group">
                                    <img
                                        src={modalImagePreview}
                                        alt={imageModalCat.name}
                                        className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setModalImagePreview(null); setModalUrlInput(''); }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition cursor-pointer"
                                        title="ইমেজ সরান"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-3">
                                    <ImageIcon size={36} className="mx-auto mb-1 text-slate-300" />
                                    <p className="text-xs font-medium">কোনো ইমেজ যুক্ত নেই</p>
                                    <p className="text-[10px] text-slate-400">নিচ থেকে ফাইল আপলোড করুন অথবা URL দিন</p>
                                </div>
                            )}
                        </div>

                        {/* File Upload Button */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">ফাইল থেকে আপলোড করুন:</label>
                            <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-slate-300 hover:border-green-500 rounded-xl cursor-pointer transition text-xs font-semibold text-slate-700 hover:text-green-700">
                                <Upload size={16} />
                                ডিভাইস থেকে ইমেজ সিলেক্ট করুন
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return
                                        try {
                                            const compressed = await compressImage(file, 200, 200, 0.85)
                                            if (compressed) {
                                                setModalImagePreview(compressed)
                                                setModalUrlInput('')
                                                toast.success('ইমেজ নির্বাচিত হয়েছে!')
                                            } else {
                                                toast.error('ইমেজ প্রসেস করা যায়নি')
                                            }
                                        } catch {
                                            toast.error('ইমেজ লোড ব্যর্থ হয়েছে')
                                        }
                                        e.target.value = ''
                                    }}
                                />
                            </label>
                        </div>

                        {/* OR URL Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                <div className="flex-1 h-px bg-slate-200" />
                                অথবা ইমেজ URL দিন
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>
                            <input
                                type="url"
                                value={modalUrlInput}
                                onChange={(e) => {
                                    setModalUrlInput(e.target.value)
                                    if (e.target.value.trim()) {
                                        setModalImagePreview(e.target.value.trim())
                                    }
                                }}
                                placeholder="https://example.com/category-image.png"
                                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            {imageModalCat.image ? (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(imageModalCat)}
                                    disabled={isSaving}
                                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <Trash2 size={13} />
                                    ইমেজ মুছুন
                                </button>
                            ) : <div />}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={closeImageModal}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveModalImage}
                                    disabled={isSaving}
                                    className="px-5 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <SaveIcon size={14} />}
                                    সংরক্ষণ করুন
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Help / Tips */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} />
                    ক্যাটাগরি ম্যানেজমেন্ট গাইড
                </h3>
                <ul className="text-xs text-blue-700 space-y-1.5 list-disc list-inside">
                    <li><strong>ইমেজ আপলোড / পরিবর্তন:</strong> তালিকার ছবির বক্সে বা ক্যামেরা আইকনে ক্লিক করে সরাসরি ছবি আপলোড বা URL সেট করুন — এটি ইউজার সাইডের Navbar Categories ড্রপডাউনে প্রদর্শিত হবে।</li>
                    <li><strong>ক্রম পরিবর্তন:</strong> উপর/নিচ তীর চিহ্ন (▲ ▼) দিয়ে ক্যাটাগরির পজিশন বদলান — এই ক্রমেই Navbar-এর Categories ড্রপডাউনে দেখাবে।</li>
                    <li><strong>নাম পরিবর্তন:</strong> পেন্সিল আইকনে ক্লিক করে নতুন নাম দিন, Enter চাপুন বা সবুজ টিক দিন।</li>
                    <li><strong>লুকানো/দৃশ্যমান:</strong> চোখের আইকনে ক্লিক করলে ক্যাটাগরি Navbar থেকে লুকানো বা দেখানো যাবে।</li>
                    <li><strong>নতুন ক্যাটাগরি:</strong> উপরে নাম ও ঐচ্ছিক ছবি দিয়ে &quot;যোগ করুন&quot; বাটনে ক্লিক করুন।</li>
                    <li><strong>মুছে ফেলা:</strong> ট্র্যাশ আইকনে ক্লিক করলে নিশ্চিতকরণ চাইবে — এটি শুধু ক্যাটাগরি মুছবে, পণ্য মুছবে না।</li>
                </ul>
            </div>
        </div>
    )
}

