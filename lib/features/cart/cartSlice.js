import { createSlice } from '@reduxjs/toolkit'

// Helper: always compute total from cartItems (single source of truth)
const computeTotal = (cartItems) => {
    return Object.values(cartItems).reduce((sum, item) => {
        if (typeof item === 'number') return sum + item
        return sum + (item?.quantity || 0)
    }, 0)
}

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId, color, size } = action.payload
            if (state.cartItems[productId]) {
                // If item already exists, just increase quantity
                if (typeof state.cartItems[productId] === 'number') {
                    // Migrate old format to new format
                    state.cartItems[productId] = { quantity: state.cartItems[productId] + 1, color: color || null, size: size || null }
                } else {
                    state.cartItems[productId].quantity++
                }
            } else {
                state.cartItems[productId] = { quantity: 1, color: color || null, size: size || null }
            }
            state.total = computeTotal(state.cartItems)
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                const item = state.cartItems[productId]
                const qty = typeof item === 'number' ? item : item.quantity
                if (qty > 1) {
                    if (typeof item === 'number') {
                        state.cartItems[productId] = { quantity: qty - 1, color: null, size: null }
                    } else {
                        state.cartItems[productId].quantity--
                    }
                    state.total = computeTotal(state.cartItems)
                }
                // When qty is 1, it stays 1 and will not be deleted by minus.
                // Items must be deleted explicitly using the trash bin icon (deleteItemFromCart).
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            delete state.cartItems[productId]
            state.total = computeTotal(state.cartItems)
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
        hydrateCart: (state, action) => {
            if (action.payload) {
                state.cartItems = action.payload.cartItems || {}
                // Always recalculate total from actual cartItems (never trust stored total)
                state.total = computeTotal(state.cartItems)
            }
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart, hydrateCart } = cartSlice.actions

export default cartSlice.reducer
