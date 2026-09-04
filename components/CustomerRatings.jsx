'use client'
import { StarIcon, QuoteIcon } from 'lucide-react'
import Title from './Title'

const testimonials = [
    {
        id: 1,
        name: "Rakib Hasan",
        location: "Dhaka",
        rating: 5,
        text: "I bought a smartwatch from Our Store BD. The product quality is amazing and the delivery was super fast. Will definitely buy again!",
        avatar: "R",
        color: "#10B981",
    },
    {
        id: 2,
        name: "Fatima Akter",
        location: "Chittagong",
        rating: 5,
        text: "Bought headphones and the sound quality is excellent! Customer service is also great. Thank you Our Store BD!",
        avatar: "F",
        color: "#8B5CF6",
    },
    {
        id: 3,
        name: "Arif Rahman",
        location: "Sylhet",
        rating: 4,
        text: "Wonderful shopping experience! Products are original and prices are very reasonable. Highly recommend to everyone.",
        avatar: "A",
        color: "#F59E0B",
    },
    {
        id: 4,
        name: "Nusrat Jahan",
        location: "Rajshahi",
        rating: 5,
        text: "I bought a speaker and the quality is outstanding! Packaging was also beautiful. Our Store BD is the best!",
        avatar: "N",
        color: "#EF4444",
    },
    {
        id: 5,
        name: "Kamal Uddin",
        location: "Khulna",
        rating: 5,
        text: "The 7-day return policy gave me confidence to order. Very happy with the product! Trusted shop indeed.",
        avatar: "K",
        color: "#3B82F6",
    },
    {
        id: 6,
        name: "Sumaya Islam",
        location: "Comilla",
        rating: 4,
        text: "Loved the free shipping! Product quality is top-notch and delivery was right on time. Will shop again for sure!",
        avatar: "S",
        color: "#EC4899",
    },
]

const CustomerRatings = () => {

    // Calculate average rating
    const avgRating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    const totalReviews = testimonials.length

    // Duplicate testimonials for seamless loop
    const duplicated = [...testimonials, ...testimonials]

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
                                fill={i < Math.round(avgRating) ? "#F59E0B" : "#D1D5DB"}
                            />
                        ))}
                    </div>
                    <p className='text-sm text-slate-500 mt-1'>Based on {totalReviews} reviews</p>
                </div>

                {/* Rating Bars */}
                <div className='hidden sm:flex flex-col gap-1.5'>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = testimonials.filter(t => t.rating === star).length
                        const percentage = (count / totalReviews) * 100
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
                            className='w-[340px] shrink-0 bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 group'
                        >
                            {/* Quote Icon */}
                            <div className='mb-4'>
                                <QuoteIcon size={24} className='text-green-400 opacity-40 group-hover:opacity-70 transition' />
                            </div>

                            {/* Review Text */}
                            <p className='text-slate-600 text-sm leading-relaxed mb-5 min-h-[60px]'>
                                &ldquo;{review.text}&rdquo;
                            </p>

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
                            <div className='flex items-center gap-3 pt-4 border-t border-slate-100'>
                                <div
                                    className='w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm'
                                    style={{ backgroundColor: review.color }}
                                >
                                    {review.avatar}
                                </div>
                                <div>
                                    <p className='text-sm font-semibold text-slate-800'>{review.name}</p>
                                    <p className='text-xs text-slate-400'>{review.location}, Bangladesh</p>
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

