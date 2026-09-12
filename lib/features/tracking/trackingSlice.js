import { createSlice } from '@reduxjs/toolkit'

export const defaultTrackingSettings = {
    meta: {
        enabled: false,
        pixelId: '',
        pixelId2: '',
        capiEnabled: false,
        accessToken: '',
        testEventCode: '',
        trackPurchases: true,
        trackAddToCart: true,
        trackInitiateCheckout: true,
        trackViewContent: true,
        trackSearch: true,
        trackLead: true,
        trackContact: true,
    },
    googleAds: {
        enabled: false,
        conversionId: '', // e.g. AW-123456789
        purchaseLabel: '',
        addToCartLabel: '',
        beginCheckoutLabel: '',
        enhancedConversions: true,
        trackPurchases: true,
        trackAddToCart: true,
        trackBeginCheckout: true,
    },
    ga4: {
        enabled: false,
        measurementId: '', // e.g. G-XXXXXXXXXX
        ecommerceEnabled: true,
        trackPageView: true,
        trackScroll: true,
        trackUserEngagement: true,
    },
    gtm: {
        enabled: false,
        containerId: '', // e.g. GTM-XXXXXXX
    },
    customScripts: {
        enabled: false,
        headScript: '',
        bodyTopScript: '',
        bodyBottomScript: '',
    },
    eventsConfig: {
        pageView: true,
        viewContent: true,
        search: true,
        addToCart: true,
        removeFromCart: true,
        viewCart: true,
        initiateCheckout: true,
        addPaymentInfo: true,
        addShippingInfo: true,
        purchase: true,
        lead: true,
        signUp: true,
        login: true,
        contact: true,
        wishlist: true,
        refund: true,
    },
    consent: {
        enabled: false,
        mode: 'banner',
        defaultGranted: false,
        bannerHeading: 'কুকিজ ও প্রাইভেসি সম্মতি',
        bannerText: 'আপনার কেনাকাটার অভিজ্ঞতা সেরা করতে এবং অফার প্রদর্শন করতে আমরা কুকিজ ও নিরাপদ ট্র্যাকিং ব্যবহার করি।',
        acceptBtnText: 'সম্মত আছি',
        declineBtnText: 'প্রত্যাখ্যান করুন',
    },
    debug: {
        debugMode: false,
        testEventMode: false,
    },
    logs: [],
    stats: {
        totalEvents: 0,
        purchases: 0,
        totalValue: 0,
        lastEventAt: null,
    },
}

const trackingSlice = createSlice({
    name: 'tracking',
    initialState: defaultTrackingSettings,
    reducers: {
        hydrateTracking: (state, action) => {
            if (!action.payload) return state
            const p = action.payload
            return {
                ...defaultTrackingSettings,
                ...p,
                meta: { ...defaultTrackingSettings.meta, ...(p.meta || {}) },
                googleAds: { ...defaultTrackingSettings.googleAds, ...(p.googleAds || {}) },
                ga4: { ...defaultTrackingSettings.ga4, ...(p.ga4 || {}) },
                gtm: { ...defaultTrackingSettings.gtm, ...(p.gtm || {}) },
                customScripts: { ...defaultTrackingSettings.customScripts, ...(p.customScripts || {}) },
                eventsConfig: { ...defaultTrackingSettings.eventsConfig, ...(p.eventsConfig || {}) },
                consent: { ...defaultTrackingSettings.consent, ...(p.consent || {}) },
                debug: { ...defaultTrackingSettings.debug, ...(p.debug || {}) },
                logs: Array.isArray(p.logs) ? p.logs.slice(0, 100) : (state.logs || []),
                stats: { ...defaultTrackingSettings.stats, ...(p.stats || {}) },
            }
        },
        updateMetaTracking: (state, action) => {
            state.meta = { ...state.meta, ...action.payload }
        },
        updateGoogleAdsTracking: (state, action) => {
            state.googleAds = { ...state.googleAds, ...action.payload }
        },
        updateGa4Tracking: (state, action) => {
            state.ga4 = { ...state.ga4, ...action.payload }
        },
        updateGtmTracking: (state, action) => {
            state.gtm = { ...state.gtm, ...action.payload }
        },
        updateCustomScripts: (state, action) => {
            state.customScripts = { ...state.customScripts, ...action.payload }
        },
        updateEventToggles: (state, action) => {
            state.eventsConfig = { ...state.eventsConfig, ...action.payload }
        },
        updateConsentSettings: (state, action) => {
            state.consent = { ...state.consent, ...action.payload }
        },
        updateDebugSettings: (state, action) => {
            state.debug = { ...state.debug, ...action.payload }
        },
        logTrackingEvent: (state, action) => {
            const event = action.payload
            if (!event) return
            
            // Add to in-memory logs (limit to 100 most recent)
            state.logs.unshift({
                id: event.id || `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                timestamp: event.timestamp || new Date().toISOString(),
                eventName: event.eventName,
                platforms: event.platforms || [],
                status: event.status || 'SUCCESS',
                source: event.source || 'BROWSER',
                eventId: event.eventId || null,
                orderId: event.orderId || null,
                value: event.value || 0,
                currency: event.currency || 'BDT',
                details: event.details || null,
                error: event.error || null,
            })
            if (state.logs.length > 100) {
                state.logs = state.logs.slice(0, 100)
            }

            // Update stats
            state.stats.totalEvents = (state.stats.totalEvents || 0) + 1
            state.stats.lastEventAt = new Date().toISOString()
            if (event.eventName === 'Purchase') {
                state.stats.purchases = (state.stats.purchases || 0) + 1
                if (typeof event.value === 'number') {
                    state.stats.totalValue = Number(((state.stats.totalValue || 0) + event.value).toFixed(2))
                }
            }
        },
        clearTrackingLogs: (state) => {
            state.logs = []
        },
        resetTrackingSettings: () => {
            return defaultTrackingSettings
        },
    },
})

export const {
    hydrateTracking,
    updateMetaTracking,
    updateGoogleAdsTracking,
    updateGa4Tracking,
    updateGtmTracking,
    updateCustomScripts,
    updateEventToggles,
    updateConsentSettings,
    updateDebugSettings,
    logTrackingEvent,
    clearTrackingLogs,
    resetTrackingSettings,
} = trackingSlice.actions

export default trackingSlice.reducer
