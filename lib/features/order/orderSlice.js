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
            state.orders.unshift(action.payload)
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
            state.orders = action.payload
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
