import { createSlice } from '@reduxjs/toolkit'

export const defaultFaviconSettings = {
    faviconUrl: '/favicon.ico',
    appleTouchIconUrl: '/apple-icon.png',
    siteTitle: 'Our Store BD',
    updatedAt: null,
    fileName: '',
    fileSize: null,
    fileType: '',
    dimensions: { width: 32, height: 32 },
}

const faviconSlice = createSlice({
    name: 'favicon',
    initialState: defaultFaviconSettings,
    reducers: {
        hydrateFavicon: (state, action) => {
            if (!action.payload) return state
            return {
                ...state,
                ...action.payload,
            }
        },
        updateFavicon: (state, action) => {
            return {
                ...state,
                ...action.payload,
                updatedAt: Date.now(),
            }
        },
        resetFavicon: () => {
            return {
                ...defaultFaviconSettings,
                updatedAt: Date.now(),
            }
        },
    },
})

export const { hydrateFavicon, updateFavicon, resetFavicon } = faviconSlice.actions
export default faviconSlice.reducer
