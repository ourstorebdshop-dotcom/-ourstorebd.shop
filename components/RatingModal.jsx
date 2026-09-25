'use client'

import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Star, XIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { addProductReview } from '@/lib/features/product/productSlice'
import { addRating } from '@/lib/features/rating/ratingSlice'
import { isFirebaseConfigured } from '@/lib/firestore'

const RatingModal = ({ ratingModal, setRatingModal }) => {
    const dispatch = useDispatch()
    const { currentUser } = useSelector(state => state.user || {})
    const products = useSelector(state => state.product?.list || [])

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) {
            toast.error('Please select a rating (1-5 stars)');
            return;
        }
        if (review.trim() && review.trim().length < 3) {
            toast.error('Please write at least 3 characters for the review');
            return;
        }

        try {
            const prodId = ratingModal?.productId
            const product = products.find(p => p.id === prodId || p._id === prodId)
            const currentRatings = Array.isArray(product?.rating) ? [...product.rating] : []

            const newReview = {
                id: `rat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                rating: Number(rating),
                review: review.trim(),
                orderId: ratingModal?.orderId,
                productId: prodId,
                user: {
                    id: currentUser?.id || `user_${Date.now()}`,
                    name: currentUser?.name || "Customer",
                    email: currentUser?.email || "",
                    image: currentUser?.avatar || currentUser?.image || "",
                    location: currentUser?.addresses?.[0]?.city || "Bangladesh",
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isVisible: true,
                status: 'approved',
            }

            dispatch(addProductReview({ productId: prodId, review: newReview }))
            dispatch(addRating({ orderId: ratingModal?.orderId, productId: prodId, rating: Number(rating) }))

            const updatedRatings = [newReview, ...currentRatings]

            if (isFirebaseConfigured() && prodId) {
                await fetch('/api/public/ratings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: prodId, review: newReview }),
                })
            }

            try {
                const stored = localStorage.getItem('gocart_products')
                if (stored && prodId) {
                    const list = JSON.parse(stored)
                    const idx = list.findIndex(p => p.id === prodId || p._id === prodId)
                    if (idx !== -1) {
                        list[idx].rating = updatedRatings
                        localStorage.setItem('gocart_products', JSON.stringify(list))
                    }
                }
            } catch (err) { /* ignore */ }

            toast.success("রেটিং ও রিভিউ দেওয়ার জন্য ধন্যবাদ! ⭐")
        } catch (err) {
            console.error("Error submitting rating modal:", err)
        }

        setRatingModal(null);
    }

    return (
        <div className='fixed inset-0 z-120 flex items-center justify-center bg-black/10'>
            <div className='bg-white p-8 rounded-lg shadow-lg w-96 relative'>
                <button onClick={() => setRatingModal(null)} className='absolute top-3 right-3 text-gray-500 hover:text-gray-700'>
                    <XIcon size={20} />
                </button>
                <h2 className='text-xl font-medium text-slate-600 mb-4'>Rate Product</h2>
                <div className='flex items-center justify-center mb-4'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-8 cursor-pointer ${rating > i ? "text-green-400 fill-current" : "text-gray-300"}`}
                            onClick={() => setRating(i + 1)}
                        />
                    ))}
                </div>
                <textarea
                    className='w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400'
                    placeholder='Write your review (optional)'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                <button onClick={() => handleSubmit()} className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition cursor-pointer'>
                    Submit Rating
                </button>
            </div>
        </div>
    )
}

export default RatingModal