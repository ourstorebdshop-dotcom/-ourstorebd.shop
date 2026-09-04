import { createSlice } from '@reduxjs/toolkit'

// Default shipping & payment settings
export const defaultShippingSettings = {
    insideDhaka: {
        cost: 70,
        deliveryTime: '১ - ২ কর্মদিবস',
        enabled: true,
    },
    outsideDhaka: {
        cost: 120,
        deliveryTime: '২ - ৪ কর্মদিবস',
        enabled: true,
    },
    paymentMethods: {
        COD: { enabled: true, label: 'ক্যাশ অন ডেলিভারি', icon: '📦', iconUrl: '', badge: 'সর্বাধিক জনপ্রিয়' },
        BKASH: {
            enabled: true, label: 'বিকাশ', icon: '🅱️', iconUrl: '', badge: '',
            accountNumber: '01577272145',
            accountType: 'পার্সোনাল',
            instructions: 'দয়া করে উপরের নাম্বারে সেন্ড মানি (Send Money) করুন এবং নিচের ট্রানসেকশন আইডি দিন।',
        },
        NAGAD: {
            enabled: true, label: 'নগদ', icon: '🟠', iconUrl: '', badge: '',
            accountNumber: '01577272145',
            accountType: 'পার্সোনাল',
            instructions: 'দয়া করে উপরের নাম্বারে সেন্ড মানি (Send Money) করুন এবং নিচের ট্রানসেকশন আইডি দিন।',
        },
        BANK: {
            enabled: true, label: 'ব্যাংক ট্রান্সফার', icon: '🏦', iconUrl: '', badge: '',
            bankName: 'The City Bank PLC',
            accountName: 'IR Feel Enterprise',
            accountNumber: '1203456789001',
            branch: 'Gulshan Branch, Dhaka',
            routingNumber: '225261234',
            instructions: 'দয়া করে উপরের ব্যাংক একাউন্টে ফান্ড ট্রান্সফার (NPSB, BEFTN, বা RTGS) করুন এবং নিচে আপনার প্রেরক তথ্য দিন।',
        },
    },
    quickContact: {
        whatsapp: {
            enabled: true,
            number: '01577272145',
            message: 'আমি এই প্রোডাক্টটা অর্ডার করতে চাই - {product_name}',
        },
        call: {
            enabled: true,
            number: '01577272145',
        }
    }
}

const shippingSlice = createSlice({
    name: 'shipping',
    initialState: defaultShippingSettings,
    reducers: {
        hydrateShipping: (state, action) => {
            return {
                ...defaultShippingSettings,
                ...action.payload,
                quickContact: {
                    ...defaultShippingSettings.quickContact,
                    ...(action.payload?.quickContact || {})
                }
            }
        },
        updateInsideDhaka: (state, action) => {
            state.insideDhaka = { ...state.insideDhaka, ...action.payload }
        },
        updateOutsideDhaka: (state, action) => {
            state.outsideDhaka = { ...state.outsideDhaka, ...action.payload }
        },
        updatePaymentMethod: (state, action) => {
            const { method, data } = action.payload
            if (state.paymentMethods[method]) {
                state.paymentMethods[method] = { ...state.paymentMethods[method], ...data }
            }
        },
        togglePaymentMethod: (state, action) => {
            const method = action.payload
            if (state.paymentMethods[method]) {
                state.paymentMethods[method].enabled = !state.paymentMethods[method].enabled
            }
        },
        updateQuickContact: (state, action) => {
            if (!state.quickContact) {
                state.quickContact = { ...defaultShippingSettings.quickContact }
            }
            state.quickContact = {
                ...state.quickContact,
                ...action.payload
            }
        },
        toggleQuickContact: (state, action) => {
            if (!state.quickContact) {
                state.quickContact = { ...defaultShippingSettings.quickContact }
            }
            const type = action.payload
            if (state.quickContact[type]) {
                state.quickContact[type].enabled = !state.quickContact[type].enabled
            }
        },
    }
})

export const { 
    hydrateShipping, 
    updateInsideDhaka, 
    updateOutsideDhaka, 
    updatePaymentMethod, 
    togglePaymentMethod,
    updateQuickContact,
    toggleQuickContact 
} = shippingSlice.actions
export default shippingSlice.reducer
