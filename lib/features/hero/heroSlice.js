import { createSlice } from '@reduxjs/toolkit'

// Default Hero Banner configuration (exported for StoreProvider hydration & initial state)
export const defaultHeroData = {
    showHero: true,
    showMarquee: true,
    mainBanner: {
        showBadge: true,
        badgeTag: 'NEWS',
        badgeText: 'Free Shipping on Orders Above ৳500!',
        badgeLink: '',
        title: "Gadgets you'll love. Prices you'll trust.",
        showPrice: true,
        priceLabel: 'Starts from',
        priceValue: '4.90',
        showButton: true,
        buttonText: 'LEARN MORE',
        buttonLink: '/shop',
        image: '', // empty means use assets.hero_model_img
        bgPreset: 'green', // 'green', 'peach', 'blue', 'purple', 'rose', 'slate', 'custom'
        bgColor: '#bbf7d0', // bg-green-200 default
        textColor: '#1e293b',
    },
    sideCard1: {
        showCard: true,
        title: 'Best products',
        buttonText: 'View more',
        link: '/shop',
        image: '', // empty means use assets.hero_product_img1
        bgPreset: 'orange', // 'orange', 'blue', 'green', 'purple', 'rose', 'slate', 'custom'
        bgColor: '#fed7aa', // bg-orange-200 default
        textColor: '#475569',
    },
    sideCard2: {
        showCard: true,
        title: '20% discounts',
        buttonText: 'View more',
        link: '/shop',
        image: '', // empty means use assets.hero_product_img2
        bgPreset: 'blue', // 'blue', 'orange', 'green', 'purple', 'rose', 'slate', 'custom'
        bgColor: '#bfdbfe', // bg-blue-200 default
        textColor: '#475569',
    }
}

const heroSlice = createSlice({
    name: 'hero',
    initialState: defaultHeroData,
    reducers: {
        hydrateHero: (state, action) => {
            if (action.payload && typeof action.payload === 'object') {
                return {
                    ...defaultHeroData,
                    ...action.payload,
                    mainBanner: {
                        ...defaultHeroData.mainBanner,
                        ...(action.payload.mainBanner || {})
                    },
                    sideCard1: {
                        ...defaultHeroData.sideCard1,
                        ...(action.payload.sideCard1 || {})
                    },
                    sideCard2: {
                        ...defaultHeroData.sideCard2,
                        ...(action.payload.sideCard2 || {})
                    }
                }
            }
            return state
        },
        updateHero: (state, action) => {
            if (action.payload && typeof action.payload === 'object') {
                return {
                    ...state,
                    ...action.payload,
                    mainBanner: {
                        ...state.mainBanner,
                        ...(action.payload.mainBanner || {})
                    },
                    sideCard1: {
                        ...state.sideCard1,
                        ...(action.payload.sideCard1 || {})
                    },
                    sideCard2: {
                        ...state.sideCard2,
                        ...(action.payload.sideCard2 || {})
                    }
                }
            }
            return state
        },
        resetHero: () => {
            return JSON.parse(JSON.stringify(defaultHeroData))
        }
    }
})

export const { hydrateHero, updateHero, resetHero } = heroSlice.actions
export default heroSlice.reducer
