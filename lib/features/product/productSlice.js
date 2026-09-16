import { createSlice } from '@reduxjs/toolkit'

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        isHydrated: false,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = Array.isArray(action.payload) ? action.payload : []
            state.isHydrated = true
        },
        addProduct: (state, action) => {
            if (!action.payload) return
            if (!Array.isArray(state.list)) state.list = []
            state.list.unshift(action.payload)
            state.isHydrated = true
        },
        updateProduct: (state, action) => {
            if (!action.payload?.id || !Array.isArray(state.list)) return
            const index = state.list.findIndex(p => p.id === action.payload.id)
            if (index !== -1) {
                state.list[index] = action.payload
            }
        },
        deleteProduct: (state, action) => {
            if (!action.payload || !Array.isArray(state.list)) return
            state.list = state.list.filter(p => p.id !== action.payload)
        },
        toggleProductStock: (state, action) => {
            if (!action.payload || !Array.isArray(state.list)) return
            const product = state.list.find(p => p.id === action.payload)
            if (product) {
                product.inStock = !product.inStock
            }
        },
        addProductReview: (state, action) => {
            if (!action.payload) return
            const { productId, review } = action.payload
            if (!productId || !review || !Array.isArray(state.list)) return
            const product = state.list.find(p => p.id === productId)
            if (product) {
                if (!Array.isArray(product.rating)) {
                    product.rating = []
                }
                const existingIndex = product.rating.findIndex(r => (r.id && review.id && r.id === review.id) || (r.user?.id && review.user?.id && r.user.id === review.user.id))
                if (existingIndex !== -1) {
                    product.rating[existingIndex] = { ...product.rating[existingIndex], ...review }
                } else {
                    product.rating.unshift(review)
                }
            }
        },
        updateProductReview: (state, action) => {
            if (!action.payload) return
            const { productId, reviewId, updatedData } = action.payload
            if (!productId || !reviewId || !Array.isArray(state.list)) return
            const product = state.list.find(p => p.id === productId)
            if (product && Array.isArray(product.rating)) {
                const idx = product.rating.findIndex(r => r.id === reviewId)
                if (idx !== -1) {
                    product.rating[idx] = { ...product.rating[idx], ...updatedData, updatedAt: new Date().toISOString() }
                }
            }
        },
        deleteProductReview: (state, action) => {
            if (!action.payload) return
            const { productId, reviewId } = action.payload
            if (!productId || !reviewId || !Array.isArray(state.list)) return
            const product = state.list.find(p => p.id === productId)
            if (product && Array.isArray(product.rating)) {
                product.rating = product.rating.filter(r => r.id !== reviewId)
            }
        },
        toggleReviewVisibility: (state, action) => {
            if (!action.payload) return
            const { productId, reviewId } = action.payload
            if (!productId || !reviewId || !Array.isArray(state.list)) return
            const product = state.list.find(p => p.id === productId)
            if (product && Array.isArray(product.rating)) {
                const idx = product.rating.findIndex(r => r.id === reviewId)
                if (idx !== -1) {
                    const currentVisible = product.rating[idx].isVisible !== false && product.rating[idx].status !== 'hidden'
                    product.rating[idx].isVisible = !currentVisible
                    product.rating[idx].status = !currentVisible ? 'approved' : 'hidden'
                    product.rating[idx].updatedAt = new Date().toISOString()
                }
            }
        },
        clearProduct: (state) => {
            state.list = []
        }
    }
})

export const { 
    setProduct, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductStock, 
    addProductReview, 
    updateProductReview, 
    deleteProductReview, 
    toggleReviewVisibility, 
    clearProduct 
} = productSlice.actions

export default productSlice.reducer