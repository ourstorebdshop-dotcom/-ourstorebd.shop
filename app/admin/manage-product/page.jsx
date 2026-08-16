'use client'

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { productDummyData } from "@/assets/assets"
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
    TagIcon
} from "lucide-react"

export default function AdminManageProducts() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")

    // Modals state
    const [editingProduct, setEditingProduct] = useState(null)
    const [viewingProduct, setViewingProduct] = useState(null)
    const [deletingProductId, setDeletingProductId] = useState(null)

    const categories = ["All", ...new Set(productDummyData.map(p => p.category))]

    const fetchProducts = async () => {
        setProducts(productDummyData)
        setLoading(false)
    }

    // Toggle product stock
    const toggleStock = (productId) => {
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const updated = !p.inStock
                toast.success(`Product "${p.name}" marked as ${updated ? 'In Stock' : 'Out of Stock'}`)
                return { ...p, inStock: updated }
            }
            return p
        }))
    }

    // Handle Edit Submit
    const handleEditSubmit = (e) => {
        e.preventDefault()
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p))
        toast.success(`"${editingProduct.name}" updated successfully!`)
        setEditingProduct(null)
    }

    // Handle Delete Confirm
    const handleDeleteConfirm = () => {
        const prod = products.find(p => p.id === deletingProductId)
        setProducts(prev => prev.filter(p => p.id !== deletingProductId))
        toast.success(`Product "${prod?.name || ''}" deleted successfully!`)
        setDeletingProductId(null)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    if (loading) return <Loading />

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                              p.description.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory
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
            </div>

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
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                />
                                                <div>
                                                    <p className="font-semibold text-slate-800">{product.name}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1 max-w-xs md:hidden">{product.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                                {product.category}
                                            </span>
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
                                        No products match your search/filter criteria.
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
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
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

                            <div>
                                <label className="block font-medium text-slate-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={editingProduct.category}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                                    required
                                />
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
                                src={viewingProduct.images[0]}
                                alt={viewingProduct.name}
                                className="w-20 h-20 object-cover border border-slate-200 rounded-xl p-1 bg-slate-50 shrink-0"
                            />
                            <div>
                                <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                                    {viewingProduct.category}
                                </span>
                                <h3 className="text-xl font-bold text-slate-800 mt-1">{viewingProduct.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-lg font-bold text-slate-800">{currency} {viewingProduct.price}</span>
                                    <span className="text-sm text-slate-400 line-through">{currency} {viewingProduct.mrp}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                            <div>
                                <p className="font-semibold text-slate-700 mb-1">Description:</p>
                                <p className="text-slate-600 leading-relaxed">{viewingProduct.description}</p>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-500">Stock Status:</span>
                                <span className={`font-semibold ${viewingProduct.inStock ? 'text-green-600' : 'text-red-500'}`}>
                                    {viewingProduct.inStock ? 'In Stock' : 'Out of Stock'}
                                </span>
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
                        <p className="text-sm text-slate-500 mt-2">
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
