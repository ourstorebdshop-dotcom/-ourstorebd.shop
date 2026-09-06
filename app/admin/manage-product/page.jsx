'use client'
import { useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import { useDispatch, useSelector } from "react-redux"
import { updateProduct, deleteProduct as deleteProductAction, toggleProductStock } from "@/lib/features/product/productSlice"
import { saveDocToFirestore, deleteDocFromFirestore } from "@/lib/firestore"
import { isDemoProduct } from "@/app/StoreProvider"
import { 
    SearchIcon, 
    PencilIcon, 
    Trash2Icon, 
    EyeIcon, 
    XIcon, 
    PlusIcon, 
    FilterIcon,
    ShoppingBagIcon,
    CheckCircle2Icon,
    XCircleIcon,
    TagIcon,
    CheckIcon,
    Clock,
    TrendingUp
} from "lucide-react"

export default function AdminManageProducts() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()
    const products = useSelector(state => state.product.list)

    // Dynamic categories from Redux store
    const reduxCategories = useSelector(state => state.category?.categories || [])
    const categoryList = [...reduxCategories]
        .filter(c => c.visible)
        .sort((a, b) => a.order - b.order)
        .map(c => c.name)

    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")

    // Modals state
    const [editingProduct, setEditingProduct] = useState(null)
    const [viewingProduct, setViewingProduct] = useState(null)
    const [deletingProductId, setDeletingProductId] = useState(null)

    const categories = ["All", ...new Set(products.flatMap(p => {
        if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) return p.categories
        if (p.category) return [p.category]
        return []
    }))]

    // Toggle product stock
    const toggleStock = (productId) => {
        const p = products.find(p => p.id === productId)
        const newStock = !p?.inStock
        dispatch(toggleProductStock(productId))
        saveDocToFirestore('products', productId, { inStock: newStock })
        toast.success(`Product "${p?.name}" marked as ${newStock ? 'In Stock' : 'Out of Stock'}`)
    }

    // Handle Edit Submit
    const handleEditSubmit = (e) => {
        e.preventDefault()

        const mrpVal = parseFloat(editingProduct.mrp)
        const priceVal = parseFloat(editingProduct.price)

        if (!mrpVal || mrpVal <= 0) {
            toast.error('সঠিক Actual Price দিন')
            return
        }
        if (!priceVal || priceVal <= 0) {
            toast.error('সঠিক Offer Price দিন')
            return
        }
        if (priceVal > mrpVal) {
            toast.error('Offer Price, Actual Price-এর চেয়ে বেশি হতে পারে না')
            return
        }

        const editedCategories = editingProduct.categories || (editingProduct.category ? [editingProduct.category] : [])
        if (editedCategories.length === 0) {
            toast.error('অন্তত একটি ক্যাটাগরি সিলেক্ট করুন')
            return
        }

        if (!editingProduct.name.trim()) {
            toast.error('প্রোডাক্টের নাম দিন')
            return
        }

        const updatedProduct = {
            ...editingProduct,
            name: editingProduct.name.trim(),
            description: editingProduct.description.trim(),
            mrp: mrpVal,
            price: priceVal,
            categories: editedCategories,
            category: editedCategories[0] || '',
            updatedAt: new Date().toISOString()
        }

        dispatch(updateProduct(updatedProduct))
        saveDocToFirestore('products', updatedProduct.id, updatedProduct)
        // Immediate localStorage cache update
        try {
            const saved = localStorage.getItem('gocart_products')
            if (saved) {
                const parsed = JSON.parse(saved)
                const idx = parsed.findIndex(p => p.id === updatedProduct.id)
                if (idx !== -1) parsed[idx] = updatedProduct
                localStorage.setItem('gocart_products', JSON.stringify(parsed))
            }
        } catch (err) { /* ignore */ }

        toast.success(`"${editingProduct.name}" সফলভাবে আপডেট হয়েছে!`)
        setEditingProduct(null)
    }

    // Handle Delete Confirm
    const handleDeleteConfirm = async () => {
        const prod = products.find(p => p.id === deletingProductId)
        dispatch(deleteProductAction(deletingProductId))
        deleteDocFromFirestore('products', deletingProductId)

        // Immediate localStorage cache update
        try {
            const saved = localStorage.getItem('gocart_products')
            if (saved) {
                const parsed = JSON.parse(saved)
                const remaining = parsed.filter(p => p.id !== deletingProductId)
                localStorage.setItem('gocart_products', JSON.stringify(remaining))
            }
        } catch (err) { /* ignore */ }

        toast.success(`Product "${prod?.name || ''}" deleted successfully!`)
        setDeletingProductId(null)
    }

    // Demo products detection & purge
    const demoProducts = products.filter(isDemoProduct)
    const demoCount = demoProducts.length

    const handlePurgeDemoProducts = async () => {
        if (demoCount === 0) {
            toast.success('কোনো ডেমো প্রোডাক্ট নেই')
            return
        }
        const toastId = toast.loading(`${demoCount}টি ডেমো প্রোডাক্ট মুছে ফেলা হচ্ছে...`)
        try {
            for (const dp of demoProducts) {
                dispatch(deleteProductAction(dp.id))
                await deleteDocFromFirestore('products', dp.id)
            }
            try {
                const saved = localStorage.getItem('gocart_products')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    const cleaned = parsed.filter(p => !isDemoProduct(p))
                    localStorage.setItem('gocart_products', JSON.stringify(cleaned))
                }
            } catch (err) { /* ignore */ }
            toast.success(`${demoCount}টি ডেমো প্রোডাক্ট সফলভাবে মুছে ফেলা হয়েছে!`, { id: toastId })
        } catch (e) {
            console.error('Error purging demo products:', e)
            toast.error('ডেমো প্রোডাক্ট মুছতে সমস্যা হয়েছে', { id: toastId })
        }
    }

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                              p.description?.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = selectedCategory === "All" || (p.categories && Array.isArray(p.categories) ? p.categories.includes(selectedCategory) : p.category === selectedCategory)
        return matchesSearch && matchesCategory
    })

    const totalProducts = products.length
    const inStockCount = products.filter(p => p.inStock).length
    const outOfStockCount = totalProducts - inStockCount

    return (
        <div className="text-slate-700 mb-28 max-w-6xl">
            {/* Header & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
                        Manage <span className="text-green-600">Products</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        View, edit, toggle stock, and delete products from your store inventory
                    </p>
                </div>
                {demoCount > 0 && (
                    <button
                        type="button"
                        onClick={handlePurgeDemoProducts}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer shadow-sm flex items-center gap-2"
                    >
                        <Trash2Icon size={15} />
                        সব ডেমো প্রোডাক্ট মুছুন ({demoCount})
                    </button>
                )}
            </div>

            {/* Demo Products Warning Banner */}
            {demoCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-amber-800 text-sm">
                        <span className="text-lg">⚠️</span>
                        <span>
                            ডাটাবেজে <strong>{demoCount}টি ডেমো প্রোডাক্ট</strong> রয়েছে। এগুলো লাইভ স্টোরে অপ্রয়োজনীয় স্পেস নিচ্ছে।
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handlePurgeDemoProducts}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                        <Trash2Icon size={14} />
                        সব ডেমো প্রোডাক্ট মুছুন
                    </button>
                </div>
            )}

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <ShoppingBagIcon size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Total Items</p>
                        <p className="text-xl font-bold text-slate-800">{totalProducts}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <CheckCircle2Icon size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">In Stock</p>
                        <p className="text-xl font-bold text-green-600">{inStockCount}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        <XCircleIcon size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Out of Stock</p>
                        <p className="text-xl font-bold text-red-500">{outOfStockCount}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <TagIcon size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Categories</p>
                        <p className="text-xl font-bold text-slate-800">{categories.length - 1}</p>
                    </div>
                </div>
            </div>

            {/* Search & Category Filter Controls */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xs">
                <div className="relative w-full sm:w-80">
                    <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products by name..."
                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <XIcon size={16} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <FilterIcon size={16} className="text-slate-400 shrink-0" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full sm:w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
                    >
                        {categories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3.5">Product</th>
                                <th className="px-5 py-3.5 hidden md:table-cell">Category</th>
                                <th className="px-5 py-3.5 hidden md:table-cell">MRP</th>
                                <th className="px-5 py-3.5">Price</th>
                                <th className="px-5 py-3.5 text-center">In Stock</th>
                                <th className="px-5 py-3.5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    width={48}
                                                    height={48}
                                                    className="w-12 h-12 object-cover border border-slate-200 rounded-lg p-1 shrink-0 bg-slate-50"
                                                    src={product.images?.[0] || '/placeholder.svg'}
                                                    alt={product.name || 'Product'}
                                                />
                                                <div>
                                                    <p className="font-semibold text-slate-800">{product.name}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1 max-w-xs md:hidden">{product.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {(product.categories && Array.isArray(product.categories) ? product.categories : [product.category]).map(cat => (
                                                    <span key={cat} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell text-slate-400 line-through">
                                            {currency} {product.mrp?.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 font-bold text-slate-800">
                                            {currency} {product.price?.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    onChange={() => toggleStock(product.id)}
                                                    checked={product.inStock}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* View Button */}
                                                <button
                                                    onClick={() => setViewingProduct(product)}
                                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <EyeIcon size={17} />
                                                </button>

                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => setEditingProduct({ ...product })}
                                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit Product"
                                                >
                                                    <PencilIcon size={17} />
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => setDeletingProductId(product.id)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete Product"
                                                >
                                                    <Trash2Icon size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-400">
                                        কোনো প্রোডাক্ট পাওয়া যায়নি। অন্য কিওয়ার্ড দিয়ে অনুসন্ধান করুন।
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT PRODUCT MODAL */}
            {editingProduct && (
                <div onClick={() => setEditingProduct(null)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                            <h3 className="text-lg font-bold text-slate-800">Edit Product</h3>
                            <button onClick={() => setEditingProduct(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                <XIcon size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                            <div>
                                <label className="block font-medium text-slate-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={editingProduct.description}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1">MRP ({currency})</label>
                                    <input
                                        type="number"
                                        value={editingProduct.mrp}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, mrp: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1">Offer Price ({currency})</label>
                                    <input
                                        type="number"
                                        value={editingProduct.price}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Homepage Section Selection */}
                            <div>
                                <label className="block font-medium text-slate-700 mb-2">হোমপেজ সেকশন</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sections = editingProduct.sections || []
                                            const updated = sections.includes('latest')
                                                ? sections.filter(s => s !== 'latest')
                                                : [...sections, 'latest']
                                            setEditingProduct({ ...editingProduct, sections: updated })
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border ${
                                            (editingProduct.sections || []).includes('latest')
                                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                            (editingProduct.sections || []).includes('latest') ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                        }`}>
                                            {(editingProduct.sections || []).includes('latest') && <CheckIcon size={10} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <Clock size={13} />
                                        Latest Products
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sections = editingProduct.sections || []
                                            const updated = sections.includes('bestSelling')
                                                ? sections.filter(s => s !== 'bestSelling')
                                                : [...sections, 'bestSelling']
                                            setEditingProduct({ ...editingProduct, sections: updated })
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border ${
                                            (editingProduct.sections || []).includes('bestSelling')
                                                ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                            (editingProduct.sections || []).includes('bestSelling') ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                                        }`}>
                                            {(editingProduct.sections || []).includes('bestSelling') && <CheckIcon size={10} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <TrendingUp size={13} />
                                        Best Selling
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5">হোমপেজের কোন সেকশনে দেখাবে সিলেক্ট করুন</p>
                            </div>

                            {/* Multi-Category Selection */}
                            <div>
                                <label className="block font-medium text-slate-700 mb-2">
                                    ক্যাটাগরি সিলেক্ট করুন
                                    {(editingProduct.categories || []).length > 0 && (
                                        <span className="ml-2 text-[10px] font-normal text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                            {(editingProduct.categories || []).length}টি
                                        </span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {categoryList.map((catName) => {
                                        const cats = editingProduct.categories || (editingProduct.category ? [editingProduct.category] : [])
                                        const isSelected = cats.includes(catName)
                                        return (
                                            <button
                                                type="button"
                                                key={catName}
                                                onClick={() => {
                                                    const currentCats = editingProduct.categories || (editingProduct.category ? [editingProduct.category] : [])
                                                    const updatedCats = isSelected
                                                        ? currentCats.filter(c => c !== catName)
                                                        : [...currentCats, catName]
                                                    setEditingProduct({
                                                        ...editingProduct,
                                                        categories: updatedCats,
                                                        category: updatedCats[0] || ''
                                                    })
                                                }}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border ${
                                                    isSelected
                                                        ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-green-300'
                                                }`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center transition-all shrink-0 ${
                                                    isSelected ? 'bg-green-600 border-green-600' : 'border-slate-300'
                                                }`}>
                                                    {isSelected && <CheckIcon size={9} className="text-white" strokeWidth={3} />}
                                                </div>
                                                {catName}
                                            </button>
                                        )
                                    })}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5">একাধিক ক্যাটাগরি সিলেক্ট করতে পারবেন</p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={editingProduct.inStock}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                                <span className="text-sm font-medium text-slate-700">In Stock Available</span>
                            </div>

                            {/* Colors Edit */}
                            <div>
                                <label className="block font-medium text-slate-700 mb-1">Colors</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(editingProduct.colors || []).map((color) => (
                                        <span key={color} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-1.5 py-0.5">
                                            <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: color }} />
                                            <button type="button" onClick={() => setEditingProduct({ ...editingProduct, colors: (editingProduct.colors || []).filter(c => c !== color) })} className="text-slate-400 hover:text-red-500">
                                                <XIcon size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="color" id="editColorPicker" defaultValue="#000000" className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" />
                                    <button type="button" onClick={() => {
                                        const picker = document.getElementById('editColorPicker')
                                        const color = picker.value
                                        if (!(editingProduct.colors || []).includes(color)) {
                                            setEditingProduct({ ...editingProduct, colors: [...(editingProduct.colors || []), color] })
                                        }
                                    }} className="text-xs bg-slate-800 text-white px-2 py-1 rounded hover:bg-slate-900 transition flex items-center gap-1">
                                        <PlusIcon size={12} /> Add
                                    </button>
                                </div>
                            </div>

                            {/* Sizes Edit */}
                            <div>
                                <label className="block font-medium text-slate-700 mb-1">Sizes</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(editingProduct.sizes || []).map((size) => (
                                        <span key={size} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 text-xs">
                                            {size}
                                            <button type="button" onClick={() => setEditingProduct({ ...editingProduct, sizes: (editingProduct.sizes || []).filter(s => s !== size) })} className="text-slate-400 hover:text-red-500">
                                                <XIcon size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="text" id="editSizeInput" placeholder="e.g. S, M, L" className="w-32 px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none" onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            const val = e.target.value.trim()
                                            if (val && !(editingProduct.sizes || []).includes(val)) {
                                                setEditingProduct({ ...editingProduct, sizes: [...(editingProduct.sizes || []), val] })
                                                e.target.value = ''
                                            }
                                        }
                                    }} />
                                    <button type="button" onClick={() => {
                                        const input = document.getElementById('editSizeInput')
                                        const val = input.value.trim()
                                        if (val && !(editingProduct.sizes || []).includes(val)) {
                                            setEditingProduct({ ...editingProduct, sizes: [...(editingProduct.sizes || []), val] })
                                            input.value = ''
                                        }
                                    }} className="text-xs bg-slate-800 text-white px-2 py-1 rounded hover:bg-slate-900 transition flex items-center gap-1">
                                        <PlusIcon size={12} /> Add
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingProduct(null)}
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

            {/* QUICK VIEW MODAL */}
            {viewingProduct && (
                <div onClick={() => setViewingProduct(null)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 relative">
                        <button onClick={() => setViewingProduct(null)} className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                            <XIcon size={20} />
                        </button>

                        <div className="flex items-start gap-4 mb-4">
                            <Image
                                width={80}
                                height={80}
                                src={viewingProduct.images?.[0] || '/placeholder.svg'}
                                alt={viewingProduct.name || 'Product'}
                                className="w-20 h-20 object-cover border border-slate-200 rounded-xl p-1 bg-slate-50 shrink-0"
                            />
                            <div>
                                <div className="flex flex-wrap gap-1 mb-1">
                                    {(viewingProduct.categories && Array.isArray(viewingProduct.categories) && viewingProduct.categories.length > 0
                                        ? viewingProduct.categories
                                        : [viewingProduct.category]
                                    ).filter(Boolean).map(cat => (
                                        <span key={cat} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[11px] font-semibold">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{viewingProduct.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-lg font-bold text-slate-800">{currency} {viewingProduct.price?.toLocaleString()}</span>
                                    {viewingProduct.mrp && viewingProduct.mrp > viewingProduct.price && (
                                        <span className="text-sm text-slate-400 line-through">{currency} {viewingProduct.mrp?.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                            {/* Homepage Sections */}
                            {viewingProduct.sections && viewingProduct.sections.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 shrink-0">সেকশন:</span>
                                    <div className="flex gap-1.5">
                                        {viewingProduct.sections.includes('latest') && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">
                                                <Clock size={10} /> Latest
                                            </span>
                                        )}
                                        {viewingProduct.sections.includes('bestSelling') && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-[11px] font-medium">
                                                <TrendingUp size={10} /> Best Selling
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="font-semibold text-slate-700 mb-1">Description:</p>
                                <p className="text-slate-600 leading-relaxed">{viewingProduct.description}</p>
                            </div>
                            {viewingProduct.colors && viewingProduct.colors.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500">Colors:</span>
                                    <div className="flex gap-1.5">
                                        {viewingProduct.colors.map(c => (
                                            <span key={c} className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: c }} title={c} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {viewingProduct.sizes && viewingProduct.sizes.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500">Sizes:</span>
                                    <div className="flex gap-1.5">
                                        {viewingProduct.sizes.map(s => (
                                            <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-500">Stock Status:</span>
                                <span className={`font-semibold ${viewingProduct.inStock ? 'text-green-600' : 'text-red-500'}`}>
                                    {viewingProduct.inStock ? 'In Stock ✅' : 'Out of Stock ❌'}
                                </span>
                            </div>
                            {/* Created / Updated timestamps */}
                            <div className="flex flex-col gap-1 pt-2 border-t border-slate-50 text-xs text-slate-400">
                                {viewingProduct.createdAt && (
                                    <div className="flex justify-between">
                                        <span>তৈরি হয়েছে:</span>
                                        <span>{new Date(viewingProduct.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                )}
                                {viewingProduct.updatedAt && (
                                    <div className="flex justify-between">
                                        <span>আপডেট হয়েছে:</span>
                                        <span>{new Date(viewingProduct.updatedAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-5 border-t border-slate-100 mt-5">
                            <button
                                onClick={() => setViewingProduct(null)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingProductId && (
                <div onClick={() => setDeletingProductId(null)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2Icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Delete Product?</h3>
                        {(() => {
                            const delProd = products.find(p => p.id === deletingProductId)
                            return delProd ? (
                                <div className="flex items-center gap-3 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
                                    <Image
                                        width={40}
                                        height={40}
                                        src={delProd.images?.[0] || '/placeholder.svg'}
                                        alt={delProd.name || 'Product'}
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{delProd.name}</p>
                                        <p className="text-xs text-slate-400">{currency} {delProd.price?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ) : null
                        })()}
                        <p className="text-sm text-slate-500 mt-3">
                            Are you sure you want to delete this product? This action cannot be undone.
                        </p>

                        <div className="flex gap-3 justify-center mt-6">
                            <button
                                onClick={() => setDeletingProductId(null)}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition shadow-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
