import { createSlice } from '@reduxjs/toolkit'
import { orderDummyData } from '@/assets/assets'

const initialState = {
    orders: orderDummyData,
}

const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        addOrder: (state, action) => {
            const newOrder = action.payload
            if (!newOrder || !newOrder.id) return
            const exists = state.orders.some(o => o.id === newOrder.id)
            if (!exists) {
                state.orders.unshift(newOrder)
            }
        },
        updateOrderStatus: (state, action) => {
            const { orderId, status } = action.payload
            const existingOrder = state.orders.find(o => o.id === orderId)
            if (existingOrder) {
                existingOrder.status = status
                existingOrder.updatedAt = new Date().toISOString()
            }
        },
        cancelOrder: (state, action) => {
            const orderId = action.payload
            const existingOrder = state.orders.find(o => o.id === orderId)
            if (existingOrder) {
                existingOrder.status = 'CANCELLED'
                existingOrder.updatedAt = new Date().toISOString()
            }
        },
        deleteOrder: (state, action) => {
            state.orders = state.orders.filter(o => o.id !== action.payload)
        },
        hydrateOrders: (state, action) => {
            const list = Array.isArray(action.payload) ? [...action.payload] : []
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
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
