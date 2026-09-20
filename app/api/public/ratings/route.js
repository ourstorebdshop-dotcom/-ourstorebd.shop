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

        // Sanitize review — only allow safe fields
        const safeReview = {
            id: review.id || `review_${Date.now()}`,
            rating: review.rating,
            title: typeof review.title === 'string' ? review.title.slice(0, 200) : '',
            comment: typeof review.comment === 'string' ? review.comment.slice(0, 2000) : '',
            user: review.user ? {
                id: review.user.id || '',
                name: typeof review.user.name === 'string' ? review.user.name.slice(0, 100) : 'Anonymous',
            } : { id: '', name: 'Anonymous' },
            createdAt: review.createdAt || new Date().toISOString(),
            isVisible: true,
            status: 'approved',
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

        const success = await serverSaveDoc('products', productId, { rating: updatedRatings })
        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Failed to save rating' },
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
