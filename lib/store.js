import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './features/cart/cartSlice'
import productReducer from './features/product/productSlice'
import addressReducer from './features/address/addressSlice'
import ratingReducer from './features/rating/ratingSlice'
import bannerReducer from './features/banner/bannerSlice'
import couponReducer from './features/coupon/couponSlice'
import userReducer from './features/user/userSlice'
import orderReducer from './features/order/orderSlice'
import contactReducer from './features/contact/contactSlice'
import wishlistReducer from './features/wishlist/wishlistSlice'
import categoryReducer from './features/category/categorySlice'
import shippingReducer from './features/shipping/shippingSlice'
import cashflowReducer from './features/cashflow/cashflowSlice'
import heroReducer from './features/hero/heroSlice'
import apiSettingsReducer from './features/apiSettings/apiSettingsSlice'

export const makeStore = () => {
    return configureStore({
        reducer: {
            cart: cartReducer,
            product: productReducer,
            address: addressReducer,
            rating: ratingReducer,
            banner: bannerReducer,
            coupon: couponReducer,
            user: userReducer,
            order: orderReducer,
            contact: contactReducer,
            wishlist: wishlistReducer,
            category: categoryReducer,
            shipping: shippingReducer,
            cashflow: cashflowReducer,
            hero: heroReducer,
            apiSettings: apiSettingsReducer,
        },
    })
}