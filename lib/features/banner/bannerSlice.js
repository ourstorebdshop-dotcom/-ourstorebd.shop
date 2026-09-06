import { createSlice } from '@reduxjs/toolkit'

// Default banners (exported for StoreProvider hydration)
export const defaultBanners = [
    {
        id: 'banner_1',
        message: 'Get 20% OFF on Your First Order!',
        couponCode: 'NEW20',
        buttonText: 'Claim Offer',
        bgType: 'gradient',
        bgGradient: 'from-violet-500 via-[#9938CA] to-[#E0724A]',
        bgColor: '#7c3aed',
        textColor: '#ffffff',
        linkUrl: '',
        position: 'top',
        isActive: true,
        priority: 1,
        showOnPages: 'all',
        startDate: '',
        endDate: '',
        createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 'banner_2',
        message: '🔥 Flash Sale! Up to 50% OFF on Electronics',
        couponCode: '',
        buttonText: 'Shop Now',
        bgType: 'gradient',
        bgGradient: 'from-rose-500 via-pink-500 to-orange-500',
        bgColor: '#e11d48',
        textColor: '#ffffff',
        linkUrl: '/shop',
        position: 'top',
        isActive: false,
        priority: 2,
        showOnPages: 'all',
        startDate: '',
        endDate: '',
        createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 'banner_3',
        message: '🚚 Free Shipping on All Orders Above ৳500!',
        couponCode: '',
        buttonText: '',
        bgType: 'solid',
        bgGradient: '',
        bgColor: '#059669',
        textColor: '#ffffff',
        linkUrl: '',
        position: 'top',
        isActive: false,
        priority: 3,
        showOnPages: 'all',
        startDate: '',
        endDate: '',
        createdAt: '2026-01-01T00:00:00.000Z',
    },
]

const bannerSlice = createSlice({
    name: 'banner',
    initialState: {
        banners: defaultBanners,
        dismissedBanners: [],
    },
    reducers: {
        // Hydrate from localStorage — replaces entire banners array
        hydrateBanners: (state, action) => {
            state.banners = action.payload
        },
        addBanner: (state, action) => {
            const newBanner = {
                ...action.payload,
                id: `banner_${Date.now()}`,
                priority: state.banners.length + 1,
                createdAt: new Date().toISOString(),
            }
            state.banners.unshift(newBanner)
        },
        updateBanner: (state, action) => {
            const index = state.banners.findIndex(b => b.id === action.payload.id)
            if (index !== -1) {
                state.banners[index] = { ...action.payload }
            }
        },
        deleteBanner: (state, action) => {
            state.banners = state.banners.filter(b => b.id !== action.payload)
        },
        toggleBannerActive: (state, action) => {
            const index = state.banners.findIndex(b => b.id === action.payload)
            if (index !== -1) {
                state.banners[index].isActive = !state.banners[index].isActive
            }
        },
        dismissBanner: (state, action) => {
            state.dismissedBanners.push(action.payload)
        },
        reorderBanners: (state, action) => {
            const { fromIndex, toIndex } = action.payload
            const [moved] = state.banners.splice(fromIndex, 1)
            state.banners.splice(toIndex, 0, moved)
            state.banners.forEach((b, i) => { b.priority = i + 1 })
        },
        resetBanners: (state) => {
            state.banners = defaultBanners.map(b => ({ ...b }))
            state.dismissedBanners = []
        },
    }
})

export const {
    hydrateBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    dismissBanner,
    reorderBanners,
    resetBanners
} = bannerSlice.actions

export default bannerSlice.reducer
