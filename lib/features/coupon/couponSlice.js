import { createSlice } from '@reduxjs/toolkit'
import { couponDummyData } from '@/assets/assets'

const couponSlice = createSlice({
    name: 'coupon',
    initialState: {
        coupons: [],
        _hydrated: false,
    },
    reducers: {
        hydrateCoupons: (state, action) => {
            state.coupons = action.payload
            state._hydrated = true
        },
        resetCoupons: (state) => {
            state.coupons = couponDummyData.map(c => ({ ...c }))
        },
        addCoupon: (state, action) => {
            state.coupons.unshift(action.payload)
        },
        updateCoupon: (state, action) => {
            const index = state.coupons.findIndex(c => c.code === action.payload.code)
            if (index !== -1) {
                state.coupons[index] = action.payload
            }
        },
        deleteCoupon: (state, action) => {
            state.coupons = state.coupons.filter(c => c.code !== action.payload)
        },
        toggleCouponActive: (state, action) => {
            const index = state.coupons.findIndex(c => c.code === action.payload)
            if (index !== -1) {
                state.coupons[index] = {
                    ...state.coupons[index],
                    isActive: !state.coupons[index].isActive
                }
            }
        },
        useCoupon: (state, action) => {
            const { code, savedAmount } = action.payload
            const index = state.coupons.findIndex(c => c.code === code)
            if (index !== -1) {
                state.coupons[index] = {
                    ...state.coupons[index],
                    usedCount: (state.coupons[index].usedCount || 0) + 1,
                    totalSavings: (state.coupons[index].totalSavings || 0) + (savedAmount || 0),
                }
            }
        },
    }
})

export const { hydrateCoupons, resetCoupons, addCoupon, updateCoupon, deleteCoupon, toggleCouponActive, useCoupon } = couponSlice.actions
export default couponSlice.reducer
