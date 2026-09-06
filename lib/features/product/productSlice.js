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
        clearProduct: (state) => {
            state.list = []
        }
    }
})

export const { setProduct, addProduct, updateProduct, deleteProduct, toggleProductStock, clearProduct } = productSlice.actions

export default productSlice.reducer