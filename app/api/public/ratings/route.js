import { NextResponse } from 'next/server'
import { serverLoadDoc, serverSaveDoc } from '@/lib/firestoreServer'

/**
 * Public API for product ratings/reviews.
 * No admin session required — customers can submit reviews.
 * Server-side validation ensures only rating data is modified.
 */
export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body || !body.productId || !body.review) {
            return NextResponse.json(
                { success: false, error: 'productId and review required' },
                { status: 400 }
            )
        }

        const { productId, review } = body

        // Validate review structure
        if (!review.rating || typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Rating must be a number between 1 and 5' },
                { status: 400 }
            )
        }

        // Load current product to get existing ratings
        const product = await serverLoadDoc('products', productId)
        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            )
        }

        // Extract written review text (supports both .review and .comment)
        const reviewText = typeof review.review === 'string'
            ? review.review.slice(0, 2000)
            : (typeof review.comment === 'string' ? review.comment.slice(0, 2000) : '')

        // Sanitize review — only allow safe fields
        const safeReview = {
            id: review.id || `review_${Date.now()}`,
            rating: review.rating,
            title: typeof review.title === 'string' ? review.title.slice(0, 200) : '',
            review: reviewText,
            comment: reviewText,
            orderId: review.orderId || null,
            productId: productId,
            user: review.user ? {
                id: review.user.id || '',
                name: typeof review.user.name === 'string' ? review.user.name.slice(0, 100) : 'Customer',
                email: typeof review.user.email === 'string' ? review.user.email.slice(0, 150) : '',
                image: typeof review.user.image === 'string' ? review.user.image.slice(0, 500) : (typeof review.user.avatar === 'string' ? review.user.avatar.slice(0, 500) : ''),
                avatar: typeof review.user.avatar === 'string' ? review.user.avatar.slice(0, 500) : (typeof review.user.image === 'string' ? review.user.image.slice(0, 500) : ''),
                location: typeof review.user.location === 'string' ? review.user.location.slice(0, 100) : 'Bangladesh',
            } : { id: '', name: 'Customer' },
            createdAt: review.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVisible: review.isVisible !== false && review.status !== 'hidden',
            status: review.status || 'approved',
        }

        // Merge into existing ratings
        const existingRatings = Array.isArray(product.rating) ? product.rating : []
        const existingIndex = existingRatings.findIndex(r =>
            (r.id && safeReview.id && r.id === safeReview.id) ||
            (r.user?.id && safeReview.user?.id && r.user.id === safeReview.user.id)
        )

        let updatedRatings
        if (existingIndex !== -1) {
            updatedRatings = [...existingRatings]
            updatedRatings[existingIndex] = { ...updatedRatings[existingIndex], ...safeReview, updatedAt: new Date().toISOString() }
        } else {
            updatedRatings = [safeReview, ...existingRatings]
        }

        const result = await serverSaveDoc('products', productId, { rating: updatedRatings })
        if (!result?.success) {
            return NextResponse.json(
                { success: false, error: result?.error || 'Failed to save rating' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Public Ratings API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
