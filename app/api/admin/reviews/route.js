import { NextResponse } from 'next/server'
import { verifyAdminSessionToken, extractAdminToken, COOKIE_NAME } from '@/lib/security/auth'
import { serverSaveDoc as saveDocToFirestore, serverLoadDoc as loadDocFromFirestore } from '@/lib/firestoreServer'

function isFirebaseConfigured() { return true }

/**
 * Server-side Admin Reviews API Guard
 * Enforces admin cryptographic session token authentication and strict input validation.
 */
export async function POST(request) {
    try {
        // 1. Authenticate Admin Session
        const token = extractAdminToken(request)

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Admin session token required' },
                { status: 401 }
            )
        }

        const authResult = verifyAdminSessionToken(token)
        if (!authResult.valid) {
            return NextResponse.json(
                { success: false, error: `Unauthorized: ${authResult.error || 'Invalid admin token'}` },
                { status: 401 }
            )
        }

        // 2. Parse and validate request body
        const body = await request.json()
        const { action, productId, reviewId, reviewData } = body

        if (!productId || typeof productId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Valid Product ID is required' },
                { status: 400 }
            )
        }

        // 3. Load product from Firestore if configured
        let product = null
        if (isFirebaseConfigured()) {
            product = await loadDocFromFirestore('products', productId)
        }

        const currentRatings = Array.isArray(product?.rating) ? [...product.rating] : []

        // 4. Handle Actions
        switch (action) {
            case 'ADD': {
                const { userName, reviewText, rating, userLocation, isVisible } = reviewData || {}
                
                if (!userName || !userName.trim()) {
                    return NextResponse.json(
                        { success: false, error: 'Customer name is required' },
                        { status: 400 }
                    )
                }

                if (!reviewText || !reviewText.trim()) {
                    return NextResponse.json(
                        { success: false, error: 'Review text is required' },
                        { status: 400 }
                    )
                }

                const ratingNum = Number(rating)
                if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
                    return NextResponse.json(
                        { success: false, error: 'Rating must be between 1 and 5' },
                        { status: 400 }
                    )
                }

                const newId = `rat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                const visibleBool = isVisible !== false
                const newReview = {
                    id: newId,
                    rating: ratingNum,
                    review: reviewText.trim(),
                    productId,
                    user: {
                        id: `user_admin_${Date.now()}`,
                        name: userName.trim(),
                        location: (userLocation && userLocation.trim()) || "Bangladesh",
                        image: ""
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isVisible: visibleBool,
                    status: visibleBool ? 'approved' : 'hidden'
                }

                const updatedRatings = [newReview, ...currentRatings]
                if (isFirebaseConfigured() && product) {
                    await saveDocToFirestore('products', productId, { rating: updatedRatings })
                }

                return NextResponse.json({
                    success: true,
                    action: 'ADD',
                    review: newReview,
                    updatedRatings
                })
            }

            case 'UPDATE': {
                if (!reviewId || typeof reviewId !== 'string') {
                    return NextResponse.json(
                        { success: false, error: 'Review ID is required' },
                        { status: 400 }
                    )
                }

                const { userName, reviewText, rating, userLocation, isVisible } = reviewData || {}
                const ratingNum = Number(rating)
                if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
                    return NextResponse.json(
                        { success: false, error: 'Rating must be between 1 and 5' },
                        { status: 400 }
                    )
                }

                const visibleBool = isVisible !== false
                let found = false
                const updatedRatings = currentRatings.map((r, idx) => {
                    const isMatch = (r.id && r.id === reviewId) || (!r.id && `gen_${productId}_${idx}` === reviewId)
                    if (isMatch) {
                        found = true
                        return {
                            ...r,
                            id: r.id || reviewId,
                            rating: ratingNum,
                            review: (reviewText || r.review || "").trim(),
                            user: {
                                ...(r.user || {}),
                                name: (userName || r.user?.name || "Customer").trim(),
                                location: (userLocation || r.user?.location || "Bangladesh").trim()
                            },
                            isVisible: visibleBool,
                            status: visibleBool ? 'approved' : 'hidden',
                            updatedAt: new Date().toISOString()
                        }
                    }
                    return r
                })

                if (!found && currentRatings.length > 0) {
                    return NextResponse.json(
                        { success: false, error: 'Review not found on specified product' },
                        { status: 404 }
                    )
                }

                if (isFirebaseConfigured() && product) {
                    await saveDocToFirestore('products', productId, { rating: updatedRatings })
                }

                return NextResponse.json({
                    success: true,
                    action: 'UPDATE',
                    reviewId,
                    updatedRatings
                })
            }

            case 'TOGGLE_VISIBILITY': {
                if (!reviewId || typeof reviewId !== 'string') {
                    return NextResponse.json(
                        { success: false, error: 'Review ID is required' },
                        { status: 400 }
                    )
                }

                let newVisibleState = true
                const updatedRatings = currentRatings.map((r, idx) => {
                    const isMatch = (r.id && r.id === reviewId) || (!r.id && `gen_${productId}_${idx}` === reviewId)
                    if (isMatch) {
                        const currentVis = r.isVisible !== false && r.status !== 'hidden'
                        newVisibleState = !currentVis
                        return {
                            ...r,
                            id: r.id || reviewId,
                            isVisible: newVisibleState,
                            status: newVisibleState ? 'approved' : 'hidden',
                            updatedAt: new Date().toISOString()
                        }
                    }
                    return r
                })

                if (isFirebaseConfigured() && product) {
                    await saveDocToFirestore('products', productId, { rating: updatedRatings })
                }

                return NextResponse.json({
                    success: true,
                    action: 'TOGGLE_VISIBILITY',
                    reviewId,
                    isVisible: newVisibleState,
                    updatedRatings
                })
            }

            case 'DELETE': {
                if (!reviewId || typeof reviewId !== 'string') {
                    return NextResponse.json(
                        { success: false, error: 'Review ID is required' },
                        { status: 400 }
                    )
                }

                const updatedRatings = currentRatings.filter((r, idx) => {
                    const isMatch = (r.id && r.id === reviewId) || (!r.id && `gen_${productId}_${idx}` === reviewId)
                    return !isMatch
                })

                if (isFirebaseConfigured() && product) {
                    await saveDocToFirestore('products', productId, { rating: updatedRatings })
                }

                return NextResponse.json({
                    success: true,
                    action: 'DELETE',
                    reviewId,
                    updatedRatings
                })
            }

            default:
                return NextResponse.json(
                    { success: false, error: `Invalid action: ${action}` },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('Error in /api/admin/reviews:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error occurred' },
            { status: 500 }
        )
    }
}
