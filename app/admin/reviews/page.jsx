'use client'

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-hot-toast"
import {
    Star,
    Search,
    Trash2,
    Eye,
    EyeOff,
    CheckCircle2,
    Filter,
    Plus,
    X,
    MessageSquare,
    Calendar,
    User,
    ExternalLink,
    Edit3,
    AlertTriangle,
    ShieldCheck,
    Check,
    SlidersHorizontal,
    TrendingUp
} from "lucide-react"
import {
    addProductReview,
    updateProductReview,
    deleteProductReview,
    toggleReviewVisibility
} from "@/lib/features/product/productSlice"
import { saveDocToFirestore, isFirebaseConfigured } from "@/lib/firestoreAdminApi"

const AVATAR_COLORS = [
    "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#3B82F6", 
    "#EC4899", "#06B6D4", "#6366F1", "#14B8A6"
]

const getAvatarColor = (name = "") => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
}

export default function AdminReviewsPage() {
    const dispatch = useDispatch()
    const products = useSelector(state => state.product.list || [])

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedProduct, setSelectedProduct] = useState("ALL")
    const [statusFilter, setStatusFilter] = useState("ALL") // "ALL" | "PUBLISHED" | "HIDDEN"
    const [ratingFilter, setRatingFilter] = useState("ALL") // "ALL" | "5" | "4" | "3" | "2" | "1"

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingReview, setEditingReview] = useState(null)
    const [deletingReview, setDeletingReview] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [togglingIds, setTogglingIds] = useState(new Set())

    // Form state for Add Review
    const [newReviewForm, setNewReviewForm] = useState({
        productId: "",
        userName: "",
        userLocation: "Bangladesh",
        rating: 5,
        reviewText: "",
        isVisible: true
    })

    // Flatten all reviews with attached product metadata
    const allReviews = useMemo(() => {
        const list = []
        products.forEach(p => {
            if (Array.isArray(p.rating)) {
                p.rating.forEach((r, idx) => {
                    if (r && (r.review !== undefined || r.rating !== undefined)) {
                        const reviewId = r.id || `gen_${p.id}_${idx}`
                        const isVisible = r.isVisible !== false && r.status !== 'hidden'
                        list.push({
                            ...r,
                            id: reviewId,
                            originalId: r.id,
                            productId: p.id,
                            productName: p.name || "Untitled Product",
                            productImage: Array.isArray(p.images) && p.images[0] ? p.images[0] : null,
                            productCategory: p.category || (Array.isArray(p.categories) ? p.categories[0] : "General"),
                            rating: Number(r.rating) || 5,
                            review: r.review || "",
                            userName: r.user?.name || "Customer",
                            userEmail: r.user?.email || "",
                            userAvatar: r.user?.image || r.user?.avatar || null,
                            userLocation: r.user?.location || "Bangladesh",
                            createdAt: r.createdAt || new Date().toISOString(),
                            isVisible: isVisible,
                            status: isVisible ? 'approved' : 'hidden'
                        })
                    }
                })
            }
        })

        // Sort by newest first
        return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }, [products])

    // Compute metrics
    const stats = useMemo(() => {
        const total = allReviews.length
        const published = allReviews.filter(r => r.isVisible).length
        const hidden = total - published
        const avg = total > 0
            ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
            : "0.0"

        const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        allReviews.forEach(r => {
            const rounded = Math.max(1, Math.min(5, Math.round(r.rating)))
            starCounts[rounded] = (starCounts[rounded] || 0) + 1
        })

        return { total, published, hidden, avg, starCounts }
    }, [allReviews])

    // Filtered reviews
    const filteredReviews = useMemo(() => {
        return allReviews.filter(r => {
            // Product filter
            if (selectedProduct !== "ALL" && r.productId !== selectedProduct) {
                return false
            }

            // Status filter
            if (statusFilter === "PUBLISHED" && !r.isVisible) return false
            if (statusFilter === "HIDDEN" && r.isVisible) return false

            // Rating filter
            if (ratingFilter !== "ALL" && Math.round(r.rating) !== Number(ratingFilter)) {
                return false
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const nameMatch = (r.userName || "").toLowerCase().includes(q)
                const reviewMatch = (r.review || "").toLowerCase().includes(q)
                const productMatch = (r.productName || "").toLowerCase().includes(q)
                const emailMatch = (r.userEmail || "").toLowerCase().includes(q)
                if (!nameMatch && !reviewMatch && !productMatch && !emailMatch) {
                    return false
                }
            }

            return true
        })
    }, [allReviews, selectedProduct, statusFilter, ratingFilter, searchQuery])

    // Helper: Persist updated ratings array for a product
    const persistProductRatings = async (productId, updatedRatings) => {
        // 1. Persist to Firestore
        if (isFirebaseConfigured()) {
            try {
                await saveDocToFirestore('products', productId, { rating: updatedRatings })
            } catch (err) {
                console.error("Failed to save review to Firestore:", err)
            }
        }

        // 2. Persist to localStorage cache
        try {
            const stored = localStorage.getItem('gocart_products')
            if (stored) {
                const list = JSON.parse(stored)
                const idx = list.findIndex(p => p.id === productId)
                if (idx !== -1) {
                    list[idx].rating = updatedRatings
                    localStorage.setItem('gocart_products', JSON.stringify(list))
                }
            }
        } catch (err) {
            console.warn("Failed to update localStorage:", err)
        }
    }

    // Toggle Review Visibility (Hide / Show) with race-condition guard
    const handleToggleVisibility = async (review) => {
        if (!review || !review.productId || !review.id) return
        if (togglingIds.has(review.id)) return

        setTogglingIds(prev => new Set(prev).add(review.id))

        const product = products.find(p => p.id === review.productId)
        if (!product) {
            toast.error("প্রোডাক্টটি খুঁজে পাওয়া যায়নি")
            setTogglingIds(prev => {
                const next = new Set(prev)
                next.delete(review.id)
                return next
            })
            return
        }

        const currentRatings = Array.isArray(product.rating) ? [...product.rating] : []
        const currentVisible = review.isVisible
        const newVisible = !currentVisible

        // Update in array
        const updatedRatings = currentRatings.map((r, idx) => {
            const isMatch = (r.id && r.id === review.id) || (review.originalId && r.id === review.originalId) || (!r.id && `gen_${product.id}_${idx}` === review.id)
            if (isMatch) {
                return {
                    ...r,
                    id: r.id || review.id,
                    isVisible: newVisible,
                    status: newVisible ? 'approved' : 'hidden',
                    updatedAt: new Date().toISOString()
                }
            }
            return r
        })

        // Redux update
        dispatch(toggleReviewVisibility({ productId: review.productId, reviewId: review.id }))

        // Persistence to Firestore & localStorage
        await persistProductRatings(review.productId, updatedRatings)

        // Server API authorization sync
        try {
            await fetch('/api/admin/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'TOGGLE_VISIBILITY',
                    productId: review.productId,
                    reviewId: review.id
                })
            })
        } catch (err) {
            console.warn("Server API sync:", err)
        }

        if (newVisible) {
            toast.success("রিভিউ ওয়েবসাইটে প্রকাশিত (Show) করা হয়েছে! ⭐")
        } else {
            toast.success("রিভিউ ওয়েবসাইট থেকে সফলভাবে হাইড (Hide) করা হয়েছে")
        }

        setTogglingIds(prev => {
            const next = new Set(prev)
            next.delete(review.id)
            return next
        })
    }

    // Delete Review with double-click guard
    const handleConfirmDelete = async () => {
        if (!deletingReview || isSaving) return
        setIsSaving(true)

        try {
            const product = products.find(p => p.id === deletingReview.productId)
            if (product) {
                const currentRatings = Array.isArray(product.rating) ? product.rating : []
                const updatedRatings = currentRatings.filter((r, idx) => {
                    const isMatch = (r.id && r.id === deletingReview.id) || 
                                    (deletingReview.originalId && r.id === deletingReview.originalId) ||
                                    (!r.id && `gen_${product.id}_${idx}` === deletingReview.id)
                    return !isMatch
                })

                dispatch(deleteProductReview({ productId: deletingReview.productId, reviewId: deletingReview.id }))
                await persistProductRatings(deletingReview.productId, updatedRatings)

                // Server API authorization sync
                try {
                    await fetch('/api/admin/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'DELETE',
                            productId: deletingReview.productId,
                            reviewId: deletingReview.id
                        })
                    })
                } catch (err) {
                    console.warn("Server API sync:", err)
                }

                toast.success("রিভিউটি সফলভাবে ডিলিট করা হয়েছে")
            } else {
                toast.error("প্রোডাক্টটি খুঁজে পাওয়া যায়নি")
            }
        } catch (err) {
            console.error(err)
            toast.error("রিভিউ ডিলিট করতে সমস্যা হয়েছে")
        } finally {
            setIsSaving(false)
            setDeletingReview(null)
        }
    }

    // Edit Review Submit with double-click guard and input validation
    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editingReview || isSaving) return

        if (!editingReview.userName.trim()) {
            return toast.error("কাস্টমারের নাম দিন")
        }
        if (!editingReview.review.trim()) {
            return toast.error("রিভিউ টেক্সট লিখুন")
        }

        const ratingNum = Math.max(1, Math.min(5, Math.round(Number(editingReview.rating)) || 5))

        setIsSaving(true)
        try {
            const product = products.find(p => p.id === editingReview.productId)
            if (product) {
                const currentRatings = Array.isArray(product.rating) ? [...product.rating] : []
                const updatedRatings = currentRatings.map((r, idx) => {
                    const isMatch = (r.id && r.id === editingReview.id) || 
                                    (editingReview.originalId && r.id === editingReview.originalId) ||
                                    (!r.id && `gen_${product.id}_${idx}` === editingReview.id)
                    if (isMatch) {
                        return {
                            ...r,
                            id: r.id || editingReview.id,
                            rating: ratingNum,
                            review: editingReview.review.trim(),
                            user: {
                                ...(r.user || {}),
                                name: editingReview.userName.trim(),
                                location: editingReview.userLocation.trim() || "Bangladesh"
                            },
                            isVisible: editingReview.isVisible,
                            status: editingReview.isVisible ? 'approved' : 'hidden',
                            updatedAt: new Date().toISOString()
                        }
                    }
                    return r
                })

                dispatch(updateProductReview({
                    productId: editingReview.productId,
                    reviewId: editingReview.id,
                    updatedData: {
                        rating: ratingNum,
                        review: editingReview.review.trim(),
                        user: {
                            name: editingReview.userName.trim(),
                            location: editingReview.userLocation.trim() || "Bangladesh"
                        },
                        isVisible: editingReview.isVisible,
                        status: editingReview.isVisible ? 'approved' : 'hidden'
                    }
                }))

                await persistProductRatings(editingReview.productId, updatedRatings)

                // Server API authorization sync
                try {
                    await fetch('/api/admin/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'UPDATE',
                            productId: editingReview.productId,
                            reviewId: editingReview.id,
                            reviewData: {
                                userName: editingReview.userName.trim(),
                                userLocation: editingReview.userLocation.trim(),
                                reviewText: editingReview.review.trim(),
                                rating: ratingNum,
                                isVisible: editingReview.isVisible
                            }
                        })
                    })
                } catch (err) {
                    console.warn("Server API sync:", err)
                }

                toast.success("রিভিউ সফলভাবে আপডেট করা হয়েছে! ✅")
            } else {
                toast.error("প্রোডাক্টটি খুঁজে পাওয়া যায়নি")
            }
        } catch (err) {
            console.error(err)
            toast.error("রিভিউ আপডেট করতে ব্যর্থ হয়েছে")
        } finally {
            setIsSaving(false)
            setEditingReview(null)
        }
    }

    // Add Review Submit with double-click guard and input validation
    const handleAddSubmit = async (e) => {
        e.preventDefault()
        if (isSaving) return

        if (!newReviewForm.productId) {
            return toast.error("অনুগ্রহ করে একটি প্রোডাক্ট সিলেক্ট করুন")
        }
        if (!newReviewForm.userName.trim()) {
            return toast.error("কাস্টমারের নাম লিখুন")
        }
        if (!newReviewForm.reviewText.trim()) {
            return toast.error("রিভিউ টেক্সট লিখুন")
        }

        const ratingNum = Math.max(1, Math.min(5, Math.round(Number(newReviewForm.rating)) || 5))

        setIsSaving(true)
        try {
            const product = products.find(p => p.id === newReviewForm.productId)
            if (product) {
                const newId = `rat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                const reviewObj = {
                    id: newId,
                    rating: ratingNum,
                    review: newReviewForm.reviewText.trim(),
                    productId: newReviewForm.productId,
                    user: {
                        id: `user_admin_created_${Date.now()}`,
                        name: newReviewForm.userName.trim(),
                        location: newReviewForm.userLocation.trim() || "Bangladesh",
                        image: ""
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isVisible: newReviewForm.isVisible,
                    status: newReviewForm.isVisible ? 'approved' : 'hidden'
                }

                const currentRatings = Array.isArray(product.rating) ? product.rating : []
                const updatedRatings = [reviewObj, ...currentRatings]

                dispatch(addProductReview({ productId: newReviewForm.productId, review: reviewObj }))
                await persistProductRatings(newReviewForm.productId, updatedRatings)

                // Server API authorization sync
                try {
                    await fetch('/api/admin/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'ADD',
                            productId: newReviewForm.productId,
                            reviewData: {
                                userName: newReviewForm.userName.trim(),
                                userLocation: newReviewForm.userLocation.trim(),
                                reviewText: newReviewForm.reviewText.trim(),
                                rating: ratingNum,
                                isVisible: newReviewForm.isVisible
                            }
                        })
                    })
                } catch (err) {
                    console.warn("Server API sync:", err)
                }

                toast.success("নতুন রিভিউ সফলভাবে যুক্ত করা হয়েছে! ⭐")
                setIsAddModalOpen(false)
                setNewReviewForm({
                    productId: "",
                    userName: "",
                    userLocation: "Bangladesh",
                    rating: 5,
                    reviewText: "",
                    isVisible: true
                })
            } else {
                toast.error("প্রোডাক্টটি খুঁজে পাওয়া যায়নি")
            }
        } catch (err) {
            console.error(err)
            toast.error("রিভিউ যুক্ত করতে সমস্যা হয়েছে")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto pb-16 space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Star className="text-amber-500 fill-amber-500 size-6" />
                        Customer Ratings & Reviews
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage all customer ratings, control website visibility, filter by product, and moderate feedback.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                    >
                        <Plus size={18} />
                        Add Review
                    </button>
                </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MessageSquare size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reviews</p>
                        <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published (Visible)</p>
                        <p className="text-2xl font-extrabold text-green-600 mt-0.5">{stats.published}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <EyeOff size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hidden (Suppressed)</p>
                        <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{stats.hidden}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-yellow-50 text-amber-500 flex items-center justify-center shrink-0">
                        <Star size={22} className="fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Rating</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-2xl font-extrabold text-slate-800">{stats.avg}</span>
                            <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer name, review keyword, or product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Product selector filter */}
                    <div className="w-full lg:w-64">
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition cursor-pointer"
                        >
                            <option value="ALL">All Products ({products.length})</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status filter */}
                    <div className="w-full sm:w-44">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition cursor-pointer"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PUBLISHED">Published (Visible)</option>
                            <option value="HIDDEN">Hidden (Not shown)</option>
                        </select>
                    </div>

                    {/* Rating filter */}
                    <div className="w-full sm:w-40">
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition cursor-pointer"
                        >
                            <option value="ALL">All Ratings</option>
                            <option value="5">⭐⭐⭐⭐⭐ (5 Star)</option>
                            <option value="4">⭐⭐⭐⭐ (4 Star)</option>
                            <option value="3">⭐⭐⭐ (3 Star)</option>
                            <option value="2">⭐⭐ (2 Star)</option>
                            <option value="1">⭐ (1 Star)</option>
                        </select>
                    </div>
                </div>

                {/* Filter info bar */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div>
                        Showing <span className="font-bold text-slate-800">{filteredReviews.length}</span> of <span className="font-bold text-slate-800">{allReviews.length}</span> total reviews
                    </div>
                    {(searchQuery || selectedProduct !== "ALL" || statusFilter !== "ALL" || ratingFilter !== "ALL") && (
                        <button
                            onClick={() => {
                                setSearchQuery("")
                                setSelectedProduct("ALL")
                                setStatusFilter("ALL")
                                setRatingFilter("ALL")
                            }}
                            className="text-green-600 hover:text-green-700 font-semibold underline cursor-pointer"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            </div>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <div className="size-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">কোনো রিভিউ পাওয়া যায়নি</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
                        আপনার বর্তমান ফিল্টার বা সার্চ অনুযায়ী কোনো কাস্টমার রিভিউ পাওয়া যায়নি। ফিল্টার রিসেট করুন অথবা নতুন রিভিউ যুক্ত করুন।
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery("")
                            setSelectedProduct("ALL")
                            setStatusFilter("ALL")
                            setRatingFilter("ALL")
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                        ফিল্টার রিসেট করুন
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4">Customer</th>
                                    <th className="py-3.5 px-4">Product</th>
                                    <th className="py-3.5 px-4">Rating</th>
                                    <th className="py-3.5 px-4">Review Content</th>
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredReviews.map((item) => {
                                    const avatarColor = getAvatarColor(item.userName)
                                    const initial = (item.userName || "C").charAt(0).toUpperCase()
                                    const dateFormatted = item.createdAt 
                                        ? new Date(item.createdAt).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })
                                        : "N/A"

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Customer */}
                                            <td className="py-4 px-4 align-top">
                                                <div className="flex items-center gap-3">
                                                    {item.userAvatar ? (
                                                        <Image
                                                            src={item.userAvatar}
                                                            alt={item.userName}
                                                            width={36}
                                                            height={36}
                                                            className="size-9 rounded-full object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="size-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                                                            style={{ backgroundColor: avatarColor }}
                                                        >
                                                            {initial}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-slate-800 leading-snug">
                                                            {item.userName}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {item.userLocation || "Bangladesh"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Product */}
                                            <td className="py-4 px-4 align-top">
                                                <div className="flex items-center gap-2.5 max-w-[220px]">
                                                    {item.productImage && (
                                                        <div className="size-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                                                            <Image
                                                                src={typeof item.productImage === 'string' ? item.productImage : item.productImage.src || ''}
                                                                alt={item.productName}
                                                                width={40}
                                                                height={40}
                                                                className="size-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/product/${item.productId}`}
                                                            target="_blank"
                                                            className="font-medium text-slate-800 hover:text-green-600 transition truncate block text-xs"
                                                            title={item.productName}
                                                        >
                                                            {item.productName}
                                                        </Link>
                                                        <span className="inline-block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                                            {item.productCategory}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rating Stars */}
                                            <td className="py-4 px-4 align-top whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }, (_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            className={i < Math.round(item.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-100"}
                                                        />
                                                    ))}
                                                    <span className="text-xs font-bold text-slate-700 ml-1">
                                                        {Number(item.rating).toFixed(1)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Review Content */}
                                            <td className="py-4 px-4 align-top max-w-[280px]">
                                                <p className="text-xs text-slate-700 leading-relaxed break-words">
                                                    {item.review ? `"${item.review}"` : <span className="text-slate-400 italic">No written comment</span>}
                                                </p>
                                            </td>

                                            {/* Date */}
                                            <td className="py-4 px-4 align-top whitespace-nowrap text-xs text-slate-500">
                                                {dateFormatted}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                                                {item.isVisible ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                                        <CheckCircle2 size={12} />
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <EyeOff size={12} />
                                                        Hidden
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1">
                                                    {/* Hide / Show Toggle Button */}
                                                    <button
                                                        onClick={() => handleToggleVisibility(item)}
                                                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                                            item.isVisible
                                                                ? 'text-amber-600 hover:bg-amber-50 border-amber-200'
                                                                : 'text-green-600 hover:bg-green-50 border-green-200'
                                                        }`}
                                                        title={item.isVisible ? "ওয়েবসাইট থেকে হাইড করুন" : "ওয়েবসাইটে শো করুন"}
                                                    >
                                                        {item.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>

                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => setEditingReview({ ...item })}
                                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition cursor-pointer"
                                                        title="রিভিউ এডিট করুন"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => setDeletingReview(item)}
                                                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                                                        title="রিভিউ ডিলিট করুন"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block md:hidden divide-y divide-slate-100">
                        {filteredReviews.map((item) => {
                            const avatarColor = getAvatarColor(item.userName)
                            const initial = (item.userName || "C").charAt(0).toUpperCase()
                            const dateFormatted = item.createdAt 
                                ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                : "N/A"

                            return (
                                <div key={item.id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="size-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                                                style={{ backgroundColor: avatarColor }}
                                            >
                                                {initial}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{item.userName}</p>
                                                <p className="text-[11px] text-slate-400">{dateFormatted}</p>
                                            </div>
                                        </div>

                                        {item.isVisible ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                                Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                Hidden
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span className="font-medium text-slate-700 truncate">{item.productName}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                                key={i}
                                                size={13}
                                                className={i < Math.round(item.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-100"}
                                            />
                                        ))}
                                        <span className="text-xs font-bold text-slate-700 ml-1">
                                            {Number(item.rating).toFixed(1)}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">
                                        "{item.review}"
                                    </p>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                            onClick={() => handleToggleVisibility(item)}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
                                                item.isVisible
                                                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                    : 'text-green-700 bg-green-50 border-green-200'
                                            }`}
                                        >
                                            {item.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                            {item.isVisible ? 'Hide' : 'Show'}
                                        </button>

                                        <button
                                            onClick={() => setEditingReview({ ...item })}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Edit3 size={14} />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => setDeletingReview(item)}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 border border-red-200 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* EDIT REVIEW MODAL */}
            {editingReview && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setEditingReview(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                            <Edit3 className="text-blue-600" size={20} />
                            Edit Customer Review
                        </h2>
                        <p className="text-xs text-slate-500 mb-5">
                            Product: <span className="font-semibold text-slate-700">{editingReview.productName}</span>
                        </p>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    value={editingReview.userName}
                                    onChange={(e) => setEditingReview({ ...editingReview, userName: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Location (City/District)
                                </label>
                                <input
                                    type="text"
                                    value={editingReview.userLocation}
                                    onChange={(e) => setEditingReview({ ...editingReview, userLocation: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                    placeholder="Dhaka, Bangladesh"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Rating (1 - 5 Stars)
                                </label>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                            key={i}
                                            size={28}
                                            className={`cursor-pointer transition ${
                                                i < editingReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
                                            }`}
                                            onClick={() => setEditingReview({ ...editingReview, rating: i + 1 })}
                                        />
                                    ))}
                                    <span className="text-sm font-bold text-slate-700 ml-2">
                                        {editingReview.rating} Star{editingReview.rating > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Review Content
                                </label>
                                <textarea
                                    rows={4}
                                    value={editingReview.review}
                                    onChange={(e) => setEditingReview({ ...editingReview, review: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Visibility status */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Website Visibility Status
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingReview({ ...editingReview, isVisible: true })}
                                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                                            editingReview.isVisible
                                                ? 'bg-green-50 border-green-400 text-green-700 ring-2 ring-green-100'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <CheckCircle2 size={16} />
                                        Published (Visible)
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setEditingReview({ ...editingReview, isVisible: false })}
                                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                                            !editingReview.isVisible
                                                ? 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-100'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <EyeOff size={16} />
                                        Hidden (Unpublished)
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingReview(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD NEW REVIEW MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                            <Plus className="text-green-600" size={20} />
                            Add Customer Review
                        </h2>
                        <p className="text-xs text-slate-500 mb-5">
                            Create a verified customer review for any product in your catalog.
                        </p>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Select Product *
                                </label>
                                <select
                                    value={newReviewForm.productId}
                                    onChange={(e) => setNewReviewForm({ ...newReviewForm, productId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 cursor-pointer"
                                    required
                                >
                                    <option value="">-- Choose a product --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Tanvir Ahmed"
                                        value={newReviewForm.userName}
                                        onChange={(e) => setNewReviewForm({ ...newReviewForm, userName: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Dhaka, Bangladesh"
                                        value={newReviewForm.userLocation}
                                        onChange={(e) => setNewReviewForm({ ...newReviewForm, userLocation: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Rating (Stars) *
                                </label>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                            key={i}
                                            size={28}
                                            className={`cursor-pointer transition ${
                                                i < newReviewForm.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
                                            }`}
                                            onClick={() => setNewReviewForm({ ...newReviewForm, rating: i + 1 })}
                                        />
                                    ))}
                                    <span className="text-sm font-bold text-slate-700 ml-2">
                                        {newReviewForm.rating} Stars
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Customer Feedback / Review *
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Write the customer's review feedback..."
                                    value={newReviewForm.reviewText}
                                    onChange={(e) => setNewReviewForm({ ...newReviewForm, reviewText: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Publishing Status
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewReviewForm({ ...newReviewForm, isVisible: true })}
                                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                                            newReviewForm.isVisible
                                                ? 'bg-green-50 border-green-400 text-green-700 ring-2 ring-green-100'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <CheckCircle2 size={16} />
                                        Publish Immediately
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewReviewForm({ ...newReviewForm, isVisible: false })}
                                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                                            !newReviewForm.isVisible
                                                ? 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-100'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <EyeOff size={16} />
                                        Keep Hidden
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? "Saving..." : "Create Review"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingReview && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="size-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">রিভিউ ডিলিট করতে চান?</h3>
                        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                            আপনি কি নিশ্চিত যে <span className="font-semibold text-slate-700">"{deletingReview.userName}"</span> এর দেওয়া রিভিউটি স্থায়ীভাবে মুছে ফেলতে চান? এটি ডাটাবেজ থেকেও মুছে যাবে।
                        </p>

                        <div className="p-3 bg-slate-50 rounded-xl text-left text-xs text-slate-600 mb-6 italic border border-slate-200">
                            "{deletingReview.review}"
                        </div>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setDeletingReview(null)}
                                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                বাতিল করুন
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isSaving}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {isSaving ? "ডিলিট হচ্ছে..." : "হ্যাঁ, ডিলিট করুন"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
