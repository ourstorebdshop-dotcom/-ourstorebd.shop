import { createSlice } from '@reduxjs/toolkit'

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        isHydrated: false,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload || []
            state.isHydrated = true
        },
        addProduct: (state, action) => {
            state.list.unshift(action.payload)
            state.isHydrated = true
        },
        updateProduct: (state, action) => {
            const index = state.list.findIndex(p => p.id === action.payload.id)
            if (index !== -1) {
                state.list[index] = action.payload
            }
        },
        deleteProduct: (state, action) => {
            state.list = state.list.filter(p => p.id !== action.payload)
        },
        toggleProductStock: (state, action) => {
            const product = state.list.find(p => p.id === action.payload)
            if (product) {
                product.inStock = !product.inStock
            }
        },
        addProductReview: (state, action) => {
            const { productId, review } = action.payload
            const product = state.list.find(p => p.id === productId)
            if (product) {
                if (!Array.isArray(product.rating)) {
                    product.rating = []
                }
                const existingIndex = product.rating.findIndex(r => r.user?.id && review.user?.id && r.user.id === review.user.id)
                if (existingIndex !== -1) {
                    product.rating[existingIndex] = review
                } else {
                    product.rating.unshift(review)
                }
            }
        },
        clearProduct: (state) => {
            state.list = []
        }
    }
})

export const { setProduct, addProduct, updateProduct, deleteProduct, toggleProductStock, addProductReview, clearProduct } = productSlice.actions

export default productSlice.reducer