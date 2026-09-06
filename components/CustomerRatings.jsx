'use client'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import Image from 'next/image'
import Link from 'next/link'
import { StarIcon, QuoteIcon, CheckCircle2 } from 'lucide-react'
import Title from './Title'

const AVATAR_COLORS = ["#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#06B6D4", "#6366F1", "#14B8A6"]

const getAvatarColor = (name = "") => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
}

const defaultTestimonials = [
    {
        id: 't_1',
        name: "Rakib Hasan",
        location: "Dhaka",
        rating: 5,
        text: "I bought a smartwatch from Our Store BD. The product quality is amazing and the delivery was super fast. Will definitely buy again!",
        avatar: "R",
        color: "#10B981",
    },
    {
        id: 't_2',
        name: "Fatima Akter",
        location: "Chittagong",
        rating: 5,
        text: "Bought headphones and the sound quality is excellent! Customer service is also great. Thank you Our Store BD!",
        avatar: "F",
        color: "#8B5CF6",
    },
    {
        id: 't_3',
        name: "Arif Rahman",
        location: "Sylhet",
        rating: 4,
        text: "Wonderful shopping experience! Products are original and prices are very reasonable. Highly recommend to everyone.",
        avatar: "A",
        color: "#F59E0B",
    },
    {
        id: 't_4',
        name: "Nusrat Jahan",
        location: "Rajshahi",
        rating: 5,
        text: "I bought a speaker and the quality is outstanding! Packaging was also beautiful. Our Store BD is the best!",
        avatar: "N",
        color: "#EF4444",
    },
    {
        id: 't_5',
        name: "Kamal Uddin",
        location: "Khulna",
        rating: 5,
        text: "The 7-day return policy gave me confidence to order. Very happy with the product! Trusted shop indeed.",
        avatar: "K",
        color: "#3B82F6",
    },
    {
        id: 't_6',
        name: "Sumaya Islam",
        location: "Comilla",
        rating: 4,
        text: "Loved the free shipping! Product quality is top-notch and delivery was right on time. Will shop again for sure!",
        avatar: "S",
        color: "#EC4899",
    },
]

const CustomerRatings = () => {
    const products = useSelector(state => state.product?.list || [])

    // Dynamically extract all real customer ratings and reviews from all products
    const realCustomerReviews = useMemo(() => {
        const list = []
        const seenUserProduct = new Set()

        products.forEach(p => {
            if (Array.isArray(p.rating)) {
                p.rating.forEach(r => {
                    if (r && (r.review || r.rating)) {
                        const key = `${r.user?.id || r.user?.email || r.user?.name}_${p.id}`
                        if (!seenUserProduct.has(key)) {
                            seenUserProduct.add(key)
                            list.push({
                                id: r.id || `real_${p.id}_${Math.random()}`,
                                name: r.user?.name || "Customer",
                                location: r.user?.location || "Bangladesh",
                                rating: Math.max(1, Math.min(5, Math.round(Number(r.rating)) || 5)),
                                text: r.review || "পণ্যটির কোয়ালিটি চমৎকার, ডেলিভারি খুব দ্রুত পেয়েছি!",
                                avatar: (r.user?.name || "U").charAt(0).toUpperCase(),
                                image: r.user?.image || r.user?.avatar || null,
                                color: getAvatarColor(r.user?.name || "Customer"),
                                productName: p.name,
                                productId: p.id,
                                createdAt: r.createdAt || new Date().toISOString(),
                                isVerifiedBuyer: true,
                            })
                        }
                    }
                })
            }
        })

        // Sort real customer reviews by newest first
        return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }, [products])

    // Statistics (Average score, review count, 5-4-3-2-1 star breakdown):
    // If real customer reviews exist, calculate 100% from real customer reviews!
    // Otherwise fallback to default testimonials when there are no reviews yet.
    const reviewsForStats = realCustomerReviews.length > 0 ? realCustomerReviews : defaultTestimonials

    const totalReviews = reviewsForStats.length
    const avgRating = totalReviews > 0
        ? (reviewsForStats.reduce((sum, t) => sum + (Number(t.rating) || 5), 0) / totalReviews).toFixed(1)
        : "5.0"

    // Carousel display cards:
    // If real reviews exist, put them first. If fewer than 6, supplement with testimonials so marquee scrolls smoothly.
    const displayReviews = useMemo(() => {
        if (realCustomerReviews.length === 0) {
            return defaultTestimonials
        }
        if (realCustomerReviews.length >= 6) {
            return realCustomerReviews
        }
        return [...realCustomerReviews, ...defaultTestimonials]
    }, [realCustomerReviews])

    // Duplicate testimonials for seamless infinite marquee loop
    const duplicated = [...displayReviews, ...displayReviews]

    return (
        <div className='px-4 sm:px-6 my-12 sm:my-20 max-w-6xl mx-auto'>
            <Title
                visibleButton={false}
                title='Customer Reviews'
                description="See what our happy customers have to say — discover why they love shopping at Our Store BD."
            />

            {/* Rating Summary */}
            <div className='flex items-center justify-center gap-8 mt-12 mb-10'>
                <div className='flex flex-col items-center'>
                    <p className='text-5xl font-bold text-slate-800'>{avgRating}</p>
                    <div className='flex mt-2'>
                        {Array(5).fill('').map((_, i) => (
                            <StarIcon
                                key={i}
                                size={18}
                                className='text-transparent'
                                fill={i < Math.round(Number(avgRating)) ? "#F59E0B" : "#D1D5DB"}
                            />
                        ))}
                    </div>
                    <p className='text-sm text-slate-500 mt-1'>
                        Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                </div>

                {/* Rating Bars */}
                <div className='hidden sm:flex flex-col gap-1.5'>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = reviewsForStats.filter(t => Math.round(Number(t.rating)) === star).length
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                        return (
                            <div key={star} className='flex items-center gap-2 text-sm'>
                                <span className='text-slate-500 w-3'>{star}</span>
                                <StarIcon size={12} fill="#F59E0B" className='text-transparent' />
                                <div className='w-36 h-2 bg-slate-100 rounded-full overflow-hidden'>
                                    <div
                                        className='h-full bg-yellow-400 rounded-full transition-all duration-500'
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className='text-slate-400 text-xs w-5'>{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Smooth Infinite Marquee */}
            <div className='overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]'>
                <div
                    className='flex gap-6 w-max animate-marquee hover:[animation-play-state:paused]'
                >
                    {duplicated.map((review, idx) => (
                        <div
                            key={`${review.id}-${idx}`}
                            className='w-[340px] shrink-0 bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 group flex flex-col justify-between'
                        >
                            <div>
                                {/* Quote Icon */}
                                <div className='mb-4 flex items-center justify-between'>
                                    <QuoteIcon size={24} className='text-green-400 opacity-40 group-hover:opacity-70 transition' />
                                    {review.productName && (
                                        <Link
                                            href={`/product/${review.productId}`}
                                            className='text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-0.5 rounded-full transition truncate max-w-[170px]'
                                            title={review.productName}
                                        >
                                            {review.productName}
                                        </Link>
                                    )}
                                </div>

                                {/* Review Text */}
                                <p className='text-slate-600 text-sm leading-relaxed mb-5 min-h-[60px] line-clamp-3'>
                                    &ldquo;{review.text}&rdquo;
                                </p>
                            </div>

                            <div>
                                {/* Stars */}
                                <div className='flex gap-0.5 mb-4'>
                                    {Array(5).fill('').map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            size={14}
                                            className='text-transparent'
                                            fill={i < review.rating ? "#F59E0B" : "#D1D5DB"}
                                        />
                                    ))}
                                </div>

                                {/* Reviewer Info */}
                                <div className='flex items-center justify-between pt-4 border-t border-slate-100'>
                                    <div className='flex items-center gap-3'>
                                        <div
                                            className='w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden shadow-sm'
                                            style={{ backgroundColor: review.color }}
                                        >
                                            {review.image ? (
                                                <Image
                                                    src={review.image}
                                                    alt={review.name}
                                                    width={40}
                                                    height={40}
                                                    className='size-full object-cover'
                                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                                />
                                            ) : (
                                                review.avatar
                                            )}
                                        </div>
                                        <div>
                                            <div className='flex items-center gap-1'>
                                                <p className='text-sm font-semibold text-slate-800 truncate max-w-[130px]'>{review.name}</p>
                                                {review.isVerifiedBuyer && (
                                                    <CheckCircle2 size={12} className='text-green-600 shrink-0' title='Verified Buyer' />
                                                )}
                                            </div>
                                            <p className='text-xs text-slate-400 truncate max-w-[140px]'>
                                                {review.location}{review.location && !review.location.includes('Bangladesh') ? ', Bangladesh' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {review.isVerifiedBuyer && (
                                        <span className='text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200'>
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CustomerRatings

