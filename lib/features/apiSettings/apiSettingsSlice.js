import { createSlice } from '@reduxjs/toolkit'

export const defaultApiSettings = {
    googleAuth: {
        enabled: true,
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        clientSecret: '',
        autoSignup: true,
        lastUpdated: null,
    },
    smsGateway: {
        enabled: false,
        provider: 'Greenweb',
        apiKey: '',
        senderId: '',
    },
    paymentGateway: {
        bkashApiKey: '',
        bkashSecretKey: '',
        nagadMerchantId: '',
    }
}

const apiSettingsSlice = createSlice({
    name: 'apiSettings',
    initialState: defaultApiSettings,
    reducers: {
        hydrateApiSettings: (state, action) => {
            return {
                ...defaultApiSettings,
                ...action.payload,
                googleAuth: {
                    ...defaultApiSettings.googleAuth,
                    ...(action.payload?.googleAuth || {}),
                    // If env var is set and state doesn't have clientId, fallback to env var
                    clientId: action.payload?.googleAuth?.clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                },
                smsGateway: {
                    ...defaultApiSettings.smsGateway,
                    ...(action.payload?.smsGateway || {}),
                },
                paymentGateway: {
                    ...defaultApiSettings.paymentGateway,
                    ...(action.payload?.paymentGateway || {}),
                }
            }
        },
        updateGoogleAuth: (state, action) => {
            state.googleAuth = {
                ...state.googleAuth,
                ...action.payload,
                lastUpdated: new Date().toISOString(),
            }
        },
        updateSmsGateway: (state, action) => {
            state.smsGateway = {
                ...state.smsGateway,
                ...action.payload,
            }
        },
        updatePaymentGateway: (state, action) => {
            state.paymentGateway = {
                ...state.paymentGateway,
                ...action.payload,
            }
        },
        resetApiSettings: () => {
            return defaultApiSettings
        }
    }
})

export const {
    hydrateApiSettings,
    updateGoogleAuth,
    updateSmsGateway,
    updatePaymentGateway,
    resetApiSettings,
} = apiSettingsSlice.actions

export default apiSettingsSlice.reducer
