import { createSlice } from '@reduxjs/toolkit'


const initialState = {
    orders: [],
}

const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        addOrder: (state, action) => {
            const newOrder = action.payload
            if (!newOrder || !newOrder.id) return
            if (!Array.isArray(state.orders)) state.orders = []
            const exists = state.orders.some(o => o?.id === newOrder.id)
            if (!exists) {
                state.orders.unshift(newOrder)
            }
        },
        updateOrderStatus: (state, action) => {
            if (!action.payload) return
            const { orderId, status } = action.payload
            if (!orderId || !status || !Array.isArray(state.orders)) return
            const existingOrder = state.orders.find(o => o?.id === orderId)
            if (existingOrder) {
                existingOrder.status = status
                existingOrder.updatedAt = new Date().toISOString()
            }
        },
        cancelOrder: (state, action) => {
            const orderId = action.payload
            if (!orderId || !Array.isArray(state.orders)) return
            const existingOrder = state.orders.find(o => o?.id === orderId)
            if (existingOrder) {
                existingOrder.status = 'CANCELLED'
                existingOrder.updatedAt = new Date().toISOString()
            }
        },
        deleteOrder: (state, action) => {
            if (!action.payload || !Array.isArray(state.orders)) return
            state.orders = state.orders.filter(o => o?.id !== action.payload)
        },
        hydrateOrders: (state, action) => {
            const list = Array.isArray(action.payload) ? [...action.payload].filter(Boolean) : []
            // Guard: don't overwrite existing orders with empty result (race condition fix)
            if (list.length === 0 && state.orders.length > 0) return
            list.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
            state.orders = list
        }
    }
})

export const {
    addOrder,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    hydrateOrders
} = orderSlice.actions

export default orderSlice.reducer
