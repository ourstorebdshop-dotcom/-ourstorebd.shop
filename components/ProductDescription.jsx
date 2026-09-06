'use client'
import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import Image from "next/image"
import { 
    StarIcon, 
    QuoteIcon, 
    CheckCircle2, 
    Lock, 
    LogIn, 
    Send, 
    Sparkles, 
    Edit3,
    Check
} from "lucide-react"
import toast from "react-hot-toast"
import { addProductReview } from "@/lib/features/product/productSlice"
import { saveDocToFirestore } from "@/lib/firestore"

// Curated avatar palette for reviewers without a custom image
const AVATAR_COLORS = ["#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#06B6D4"]

const getAvatarColor = (name = "") => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
}

const RATING_LABELS = {
    5: "অসাধারণ! সম্পূর্ণ সন্তুষ্ট ⭐⭐⭐⭐⭐",
    4: "খুব ভালো, পছন্দ হয়েছে ⭐⭐⭐⭐",
    3: "মোটামুটি ভালো ⭐⭐⭐",
    2: "তেমন সন্তোষজনক নয় ⭐⭐",
    1: "খুবই হতাশাজনক ⭐",
}

const ProductDescription = ({ product }) => {
    const dispatch = useDispatch()
    const { currentUser } = useSelector(state => state.user || {})

    const [selectedTab, setSelectedTab] = useState('Description')
    const ratings = Array.isArray(product?.rating) ? product.rating : []

    // Calculate rating statistics
    const totalReviews = ratings.length
    const avgRating = totalReviews > 0
        ? (ratings.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1)
        : "0.0"

    // Check if current user already submitted a review
    const existingReview = currentUser?.id
        ? ratings.find(r => r.user?.id === currentUser.id || (currentUser.email && r.user?.email === currentUser.email))
        : null

    // Form state
    const [userRating, setUserRating] = useState(5)
    const [hoverRating, setHoverRating] = useState(0)
    const [reviewText, setReviewText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Pre-fill if user has an existing review
    useEffect(() => {
        if (existingReview) {
            setUserRating(Math.round(Number(existingReview.rating)) || 5)
            setReviewText(existingReview.review || '')
        }
    }, [existingReview])

    const handleSubmitReview = async (e) => {
        e.preventDefault()

        if (!currentUser) {
            toast.error("রেটিং বা রিভিউ দিতে অনুগ্রহ করে আগে লগইন করুন")
            return
        }

        if (userRating < 1 || userRating > 5) {
            toast.error("অনুগ্রহ করে ১ থেকে ৫ স্টার নির্বাচন করুন")
            return
        }

        if (!reviewText.trim() || reviewText.trim().length < 3) {
            toast.error("অনুগ্রহ করে অন্তত কয়েকটি শব্দে আপনার রিভিউ লিখুন")
            return
        }

        setIsSubmitting(true)
        const toastId = toast.loading(existingReview ? "রিভিউ আপডেট হচ্ছে..." : "রিভিউ জমা হচ্ছে...")

        try {
            const newReview = {
                id: existingReview?.id || `rat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                rating: Number(userRating),
                review: reviewText.trim(),
                user: {
                    id: currentUser.id || `user_${Date.now()}`,
                    name: currentUser.name || "Customer",
                    image: currentUser.avatar || currentUser.image || "",
                    email: currentUser.email || "",
                    location: currentUser.addresses?.[0]?.city || currentUser.addresses?.[0]?.district || "Bangladesh",
                },
                productId: product.id,
                createdAt: existingReview?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            // 1. Update Redux store immediately
            dispatch(addProductReview({ productId: product.id, review: newReview }))

            // 2. Persist to Firestore
            const otherRatings = ratings.filter(r => r.user?.id !== currentUser.id && r.id !== newReview.id)
            const updatedRatings = [newReview, ...otherRatings]
            await saveDocToFirestore('products', product.id, { rating: updatedRatings })

            // 3. Update localStorage cache
            try {
                const stored = localStorage.getItem('gocart_products')
                if (stored) {
                    const list = JSON.parse(stored)
                    const idx = list.findIndex(p => p.id === product.id)
                    if (idx !== -1) {
                        list[idx].rating = updatedRatings
                        localStorage.setItem('gocart_products', JSON.stringify(list))
                    }
                }
            } catch (err) {
                console.warn("Failed to update product in localStorage:", err)
            }

            toast.success(
                existingReview 
                    ? "আপনার রিভিউ সফলভাবে আপডেট হয়েছে! 🎉" 
                    : "আপনার রিভিউ ও রেটিং সফলভাবে যুক্ত হয়েছে! ধন্যবাদ। ⭐",
                { id: toastId, duration: 4000 }
            )

            setIsEditing(false)
        } catch (error) {
            console.error("Error submitting review:", error)
            toast.error("রিভিউ সেভ করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন", { id: toastId })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div id="product-reviews-section" className="my-14 text-sm text-slate-600">

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 mb-8 max-w-2xl">
                <button
                    className={`px-4 py-3 font-semibold text-sm sm:text-base transition-all relative ${
                        selectedTab === 'Description'
                            ? 'text-slate-900 font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                    onClick={() => setSelectedTab('Description')}
                >
                    Description
                    {selectedTab === 'Description' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-green-600 rounded-t-full" />
                    )}
                </button>

                <button
                    className={`px-4 py-3 font-semibold text-sm sm:text-base transition-all relative flex items-center gap-2 ${
                        selectedTab === 'Reviews'
                            ? 'text-slate-900 font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                    onClick={() => setSelectedTab('Reviews')}
                >
                    Reviews
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition ${
                        selectedTab === 'Reviews'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                        {totalReviews}
                    </span>
                    {selectedTab === 'Reviews' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-green-600 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Description Tab Content */}
            {selectedTab === "Description" && (
                <div className="max-w-3xl leading-relaxed text-slate-700 text-base bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span>পণ্যের বিবরণ (Product Details)</span>
                    </h2>
                    <p className="whitespace-pre-line text-slate-600 leading-7">
                        {product.description || "এই পণ্যের কোনো বিস্তারিত বিবরণ পাওয়া যায়নি।"}
                    </p>
                </div>
            )}

            {/* Reviews Tab Content */}
            {selectedTab === "Reviews" && (
                <div className="max-w-5xl space-y-10">

                    {/* Section Header */}
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Customer Reviews
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base mt-1.5">
                            See what our verified buyers have to say — discover why customers trust Our Store BD.
                        </p>
                    </div>

                    {/* Rating Overview Card (Matching reference design) */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                            
                            {/* Left: Aggregate Score & Stars */}
                            <div className="md:col-span-5 flex flex-col items-center justify-center sm:border-r sm:border-slate-100 md:pr-6 text-center">
                                <span className="text-6xl sm:text-7xl font-extrabold text-slate-900 tracking-tight">
                                    {avgRating}
                                </span>
                                
                                <div className="flex items-center gap-1 mt-3">
                                    {Array(5).fill('').map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            size={22}
                                            className="text-transparent"
                                            fill={i < Math.round(Number(avgRating)) ? "#F59E0B" : "#E2E8F0"}
                                        />
                                    ))}
                                </div>

                                <p className="text-sm font-medium text-slate-500 mt-2">
                                    Based on <span className="font-bold text-slate-700">{totalReviews}</span> {totalReviews === 1 ? 'review' : 'reviews'}
                                </p>

                                {totalReviews > 0 && (
                                    <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                        <CheckCircle2 size={13} className="text-green-600" />
                                        <span>100% Verified Customer Feedback</span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Star Breakdown Progress Bars */}
                            <div className="md:col-span-7 flex flex-col justify-center space-y-2.5">
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = ratings.filter(r => Math.round(Number(r.rating)) === star).length
                                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                                    return (
                                        <div key={star} className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-1 w-10 shrink-0 font-bold text-slate-700">
                                                <span>{star}</span>
                                                <StarIcon size={14} fill="#F59E0B" className="text-transparent" />
                                            </div>

                                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>

                                            <div className="w-12 text-right shrink-0 text-xs font-semibold text-slate-500">
                                                {count} <span className="text-[10px] text-slate-400">({percentage.toFixed(0)}%)</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* Review Submission Section: Restricted to Logged-in Users */}
                    {/* ========================================================= */}
                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                        
                        {!currentUser ? (
                            /* GUEST NOTICE CARD: Prompt to Login */
                            <div className="text-center py-6 px-4 max-w-lg mx-auto">
                                <div className="size-14 mx-auto mb-4 rounded-2xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
                                    <Lock size={26} />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                                    শুধুমাত্র রেজিস্টার্ড গ্রাহকরা রেটিং দিতে পারবেন
                                </h3>
                                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                                    পণ্যটির মান ও ডেলিভারি নিয়ে আপনার নিজস্ব মতামত ও স্টার রেটিং জানাতে অনুগ্রহ করে ওয়েবসাইটে আপনার অ্যাকাউন্টে লগইন করুন।
                                </p>
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Link
                                        href={`/login?redirect=/product/${product.id}`}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <LogIn size={16} />
                                        <span>লগইন করুন (Login to Rate)</span>
                                    </Link>
                                    <Link
                                        href={`/login?redirect=/product/${product.id}`}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm rounded-xl transition-all"
                                    >
                                        <span>নতুন অ্যাকাউন্ট তৈরি করুন</span>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* AUTHENTICATED USER REVIEW FORM */
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="size-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
                                            style={{ backgroundColor: getAvatarColor(currentUser.name || 'User') }}
                                        >
                                            {currentUser.avatar ? (
                                                <Image 
                                                    src={currentUser.avatar} 
                                                    alt={currentUser.name} 
                                                    width={44} 
                                                    height={44} 
                                                    className="size-full rounded-full object-cover" 
                                                />
                                            ) : (
                                                (currentUser.name || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 text-base">
                                                    {currentUser.name}
                                                </h3>
                                                <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Check size={11} strokeWidth={3} /> Verified User
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {existingReview 
                                                    ? "আপনি ইতিমধ্যে একটি রিভিউ দিয়েছেন। চাইলে এটি আপডেট করতে পারেন।" 
                                                    : "পণ্যটি কেমন লেগেছে? আপনার সৎ মতামত দিয়ে অন্য ক্রেতাদের সাহায্য করুন।"}
                                            </p>
                                        </div>
                                    </div>

                                    {existingReview && !isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition"
                                        >
                                            <Edit3 size={13} />
                                            <span>রিভিউ এডিট করুন</span>
                                        </button>
                                    )}
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmitReview} className="space-y-6">
                                    {/* Star Rating Selector */}
                                    <div>
                                        <label className="block font-bold text-slate-800 text-sm mb-2">
                                            আপনার রেটিং নির্বাচন করুন: <span className="text-red-500">*</span>
                                        </label>
                                        
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-inner">
                                                {[1, 2, 3, 4, 5].map((star) => {
                                                    const isFilled = (hoverRating || userRating) >= star
                                                    return (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onMouseEnter={() => setHoverRating(star)}
                                                            onMouseLeave={() => setHoverRating(0)}
                                                            onClick={() => setUserRating(star)}
                                                            className="p-1 transition-transform hover:scale-115 active:scale-95 focus:outline-none"
                                                            title={`${star} Star`}
                                                        >
                                                            <StarIcon
                                                                size={28}
                                                                className="transition-colors duration-150 text-transparent"
                                                                fill={isFilled ? "#F59E0B" : "#D1D5DB"}
                                                            />
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            <span className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                                                {RATING_LABELS[hoverRating || userRating]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Review Comment Textarea */}
                                    <div>
                                        <label className="block font-bold text-slate-800 text-sm mb-2">
                                            আপনার মতামত ও অভিজ্ঞতা লিখুন: <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="পণ্যটির গুণগত মান, প্যাকেজিং, ব্যাটারি ব্যাকআপ বা ব্যবহার করার অনুভূতি কেমন ছিল? বিস্তারিত লিখুন..."
                                            className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition shadow-inner text-sm leading-relaxed"
                                            required
                                        />
                                        <div className="flex justify-between items-center text-xs text-slate-400 mt-1.5">
                                            <span>সৎ রিভিউ অন্য ক্রেতাদের সঠিক সিদ্ধান্ত নিতে সহায়তা করে</span>
                                            <span>{reviewText.trim().length} অক্ষর</span>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>সংরক্ষণ করা হচ্ছে...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={15} />
                                                    <span>{existingReview ? "রিভিউ আপডেট করুন" : "রিভিউ জমা দিন"}</span>
                                                </>
                                            )}
                                        </button>

                                        {isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false)
                                                    setUserRating(Math.round(Number(existingReview?.rating)) || 5)
                                                    setReviewText(existingReview?.review || '')
                                                }}
                                                className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-800"
                                            >
                                                বাতিল করুন
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* ========================================================= */}
                    {/* Customer Reviews List (Matching reference screenshot)     */}
                    {/* ========================================================= */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <span>সকল কাস্টমার রিভিউ</span>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                    {totalReviews} টি
                                </span>
                            </h3>
                        </div>

                        {totalReviews === 0 ? (
                            /* Friendly Empty State */
                            <div className="text-center py-12 px-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                                <div className="size-14 mx-auto mb-3 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                                    <Sparkles size={24} />
                                </div>
                                <h4 className="text-base font-bold text-slate-800">
                                    এখনও কোনো রিভিউ দেওয়া হয়নি
                                </h4>
                                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                                    আপনি কি এই পণ্যটি কিনেছেন বা ব্যবহার করেছেন? সবার প্রথম রিভিউটি দিয়ে শুরু করুন!
                                </p>
                            </div>
                        ) : (
                            /* Reviews Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {ratings.map((item, index) => {
                                    const reviewerName = item.user?.name || "সম্মানিত ক্রেতা"
                                    const reviewerAvatar = item.user?.image || item.user?.avatar
                                    const reviewerInitial = reviewerName.charAt(0).toUpperCase()
                                    const avatarColor = getAvatarColor(reviewerName)
                                    const isCurrentUserReview = currentUser?.id && item.user?.id === currentUser.id
                                    const ratingScore = Math.round(Number(item.rating)) || 5
                                    const location = item.user?.location || "Bangladesh"

                                    // Parse date
                                    let dateString = "সাম্প্রতিক রিভিউ"
                                    if (item.createdAt) {
                                        try {
                                            const d = new Date(item.createdAt)
                                            if (!isNaN(d.getTime())) {
                                                dateString = d.toLocaleDateString("bn-BD", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric"
                                                })
                                            }
                                        } catch (e) {
                                            dateString = new Date().toLocaleDateString()
                                        }
                                    }

                                    return (
                                        <div
                                            key={item.id || index}
                                            className={`bg-white border rounded-2xl p-6 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                                                isCurrentUserReview
                                                    ? 'border-green-300 ring-2 ring-green-100 bg-green-50/20'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div>
                                                {/* Top row: Quote icon + Stars */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <QuoteIcon size={22} className="text-green-500/40" />
                                                    <div className="flex items-center gap-0.5">
                                                        {Array(5).fill('').map((_, i) => (
                                                            <StarIcon
                                                                key={i}
                                                                size={15}
                                                                className="text-transparent"
                                                                fill={i < ratingScore ? "#F59E0B" : "#E2E8F0"}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Review text */}
                                                <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                                                    &ldquo;{item.review}&rdquo;
                                                </p>
                                            </div>

                                            {/* Bottom row: Reviewer info */}
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm overflow-hidden"
                                                        style={{ backgroundColor: avatarColor }}
                                                    >
                                                        {reviewerAvatar ? (
                                                            <Image
                                                                src={reviewerAvatar}
                                                                alt={reviewerName}
                                                                width={40}
                                                                height={40}
                                                                className="size-full object-cover"
                                                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                                                            />
                                                        ) : (
                                                            reviewerInitial
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-bold text-slate-800">
                                                                {reviewerName}
                                                            </p>
                                                            {isCurrentUserReview && (
                                                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                                    আপনি
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400">
                                                            {location}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-green-700 justify-end">
                                                        <CheckCircle2 size={12} className="text-green-600" />
                                                        <span>Verified Buyer</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        {dateString}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDescription