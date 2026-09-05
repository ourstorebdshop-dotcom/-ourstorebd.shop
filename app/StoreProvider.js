'use client'
import { useRef, useEffect } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '../lib/store'
import { setProduct } from '@/lib/features/product/productSlice'
import { hydrateCoupons } from '@/lib/features/coupon/couponSlice'
import { hydrateBanners, defaultBanners } from '@/lib/features/banner/bannerSlice'
import { hydrateUser, hydrateSavedUsers, defaultUsers } from '@/lib/features/user/userSlice'
import { hydrateOrders } from '@/lib/features/order/orderSlice'
import { hydrateCart } from '@/lib/features/cart/cartSlice'
import { hydrateContact, defaultMessages, defaultStoreInfo } from '@/lib/features/contact/contactSlice'
import { hydrateWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { hydrateCategories, defaultCategories } from '@/lib/features/category/categorySlice'
import { hydrateShipping, defaultShippingSettings } from '@/lib/features/shipping/shippingSlice'
import { hydrateCashflow, defaultCashflowData } from '@/lib/features/cashflow/cashflowSlice'
import { hydrateHero, defaultHeroData } from '@/lib/features/hero/heroSlice'
import { hydrateApiSettings, defaultApiSettings } from '@/lib/features/apiSettings/apiSettingsSlice'
import { couponDummyData, orderDummyData } from '@/assets/assets'
import {
    isFirebaseConfigured,
    saveDocToFirestore,
    loadDocFromFirestore,
    loadCollectionFromFirestore,
    syncCollectionToFirestore,
    subscribeToDoc,
    subscribeToCollection,
} from '@/lib/firestore'

const CHANNEL_NAME = 'gocart_product_sync'
const PRODUCT_STORAGE_KEY = 'gocart_products'
const COUPON_STORAGE_KEY = 'gocart_coupons'
const BANNER_STORAGE_KEY = 'gocart_banners'
const HERO_STORAGE_KEY = 'gocart_hero_banner'
const USER_STORAGE_KEY = 'gocart_current_user'
const SAVED_USERS_STORAGE_KEY = 'gocart_users'
const ORDER_STORAGE_KEY = 'gocart_orders'
const CART_STORAGE_KEY = 'gocart_cart'
const CONTACT_STORAGE_KEY = 'gocart_contact'
const WISHLIST_STORAGE_KEY = 'ourstore_wishlist'
const CATEGORY_STORAGE_KEY = 'gocart_categories'
const SHIPPING_STORAGE_KEY = 'gocart_shipping'
const CASHFLOW_STORAGE_KEY = 'gocart_cashflow'
const API_SETTINGS_STORAGE_KEY = 'gocart_api_settings'

// Flag to track whether we're receiving data from Firestore (to avoid write loops)
let isReceivingFromFirestore = false

export default function StoreProvider({ children }) {
    const storeRef = useRef(undefined)
    const isReceivingRef = useRef(false)
    const prevProductsRef = useRef(null)

    if (!storeRef.current) {
        storeRef.current = makeStore()
        prevProductsRef.current = storeRef.current.getState().product.list
    }

    useEffect(() => {
        const store = storeRef.current
        const firebaseEnabled = isFirebaseConfigured()

        // ===== ONE-TIME CLEANUP: clear corrupted localStorage =====
        const MIGRATION_KEY = 'gocart_data_v6'
        if (!localStorage.getItem(MIGRATION_KEY)) {
            localStorage.removeItem(CART_STORAGE_KEY)
            localStorage.setItem(MIGRATION_KEY, '1')
        }

        // ===== localStorage hydration helpers =====
        function lsLoadProducts() {
            try {
                const saved = localStorage.getItem(PRODUCT_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        store.dispatch(setProduct(parsed))
                        prevProductsRef.current = parsed
                    }
                }
            } catch (e) { console.warn('Failed to load products from localStorage:', e) }
        }

        function lsLoadCoupons() {
            try {
                const saved = localStorage.getItem(COUPON_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        store.dispatch(hydrateCoupons(parsed))
                    } else {
                        store.dispatch(hydrateCoupons(couponDummyData.map(c => ({ ...c }))))
                    }
                } else {
                    store.dispatch(hydrateCoupons(couponDummyData.map(c => ({ ...c }))))
                }
            } catch (e) {
                console.warn('Failed to load coupons from localStorage:', e)
                store.dispatch(hydrateCoupons(couponDummyData.map(c => ({ ...c }))))
            }
        }

        function lsLoadBanners() {
            try {
                const saved = localStorage.getItem(BANNER_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const seen = new Set()
                        const deduped = parsed.filter(b => {
                            if (!b.id || seen.has(b.id)) return false
                            seen.add(b.id)
                            return true
                        })
                        store.dispatch(hydrateBanners(deduped))
                    } else {
                        store.dispatch(hydrateBanners(defaultBanners))
                    }
                } else {
                    store.dispatch(hydrateBanners(defaultBanners))
                }
            } catch (e) {
                console.warn('Failed to load banners from localStorage:', e)
                store.dispatch(hydrateBanners(defaultBanners))
            }
        }

        function lsLoadHero() {
            try {
                const saved = localStorage.getItem(HERO_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateHero(parsed))
                    } else {
                        store.dispatch(hydrateHero(defaultHeroData))
                    }
                } else {
                    store.dispatch(hydrateHero(defaultHeroData))
                }
            } catch (e) {
                console.warn('Failed to load hero banner from localStorage:', e)
                store.dispatch(hydrateHero(defaultHeroData))
            }
        }

        function lsLoadCategories() {
            try {
                const saved = localStorage.getItem(CATEGORY_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        store.dispatch(hydrateCategories(parsed))
                    } else {
                        store.dispatch(hydrateCategories(defaultCategories))
                    }
                } else {
                    store.dispatch(hydrateCategories(defaultCategories))
                }
            } catch (e) {
                console.warn('Failed to load categories from localStorage:', e)
                store.dispatch(hydrateCategories(defaultCategories))
            }
        }

        function lsLoadShipping() {
            try {
                const saved = localStorage.getItem(SHIPPING_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateShipping(parsed))
                    }
                }
            } catch (e) { console.warn('Failed to load shipping settings from localStorage:', e) }
        }

        function lsLoadContact() {
            try {
                const saved = localStorage.getItem(CONTACT_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateContact(parsed))
                    }
                } else {
                    store.dispatch(hydrateContact({ messages: defaultMessages, storeInfo: defaultStoreInfo }))
                }
            } catch (e) {
                console.warn('Failed to load contact state from localStorage:', e)
                store.dispatch(hydrateContact({ messages: defaultMessages, storeInfo: defaultStoreInfo }))
            }
        }

        function lsLoadAllAdmin() {
            lsLoadProducts()
            lsLoadCoupons()
            lsLoadBanners()
            lsLoadHero()
            lsLoadCategories()
            lsLoadShipping()
            lsLoadContact()
        }

        function lsLoadUserSpecific() {
            // Users & Current Session
            try {
                const savedUserList = localStorage.getItem(SAVED_USERS_STORAGE_KEY)
                if (savedUserList) {
                    let parsedUsers = JSON.parse(savedUserList)
                    if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
                        parsedUsers = parsedUsers.filter(u => u.name !== 'Google Customer')
                        store.dispatch(hydrateSavedUsers(parsedUsers))
                    }
                } else {
                    store.dispatch(hydrateSavedUsers(defaultUsers))
                }
                const savedCurrentUser = localStorage.getItem(USER_STORAGE_KEY)
                if (savedCurrentUser) {
                    const parsedUser = JSON.parse(savedCurrentUser)
                    if (parsedUser && parsedUser.id && parsedUser.name !== 'Google Customer') {
                        store.dispatch(hydrateUser(parsedUser))
                    } else if (parsedUser && parsedUser.name === 'Google Customer') {
                        localStorage.removeItem(USER_STORAGE_KEY)
                    }
                }
            } catch (e) { console.warn('Failed to load user state from localStorage:', e) }

            // Orders
            try {
                const savedOrders = localStorage.getItem(ORDER_STORAGE_KEY)
                if (savedOrders) {
                    const parsed = JSON.parse(savedOrders)
                    if (Array.isArray(parsed)) {
                        store.dispatch(hydrateOrders(parsed))
                    } else {
                        store.dispatch(hydrateOrders(orderDummyData))
                    }
                } else {
                    store.dispatch(hydrateOrders(orderDummyData))
                }
            } catch (e) {
                console.warn('Failed to load orders from localStorage:', e)
                store.dispatch(hydrateOrders(orderDummyData))
            }

            // Cart
            try {
                const savedCart = localStorage.getItem(CART_STORAGE_KEY)
                if (savedCart) {
                    const parsed = JSON.parse(savedCart)
                    if (parsed && typeof parsed.total === 'number') {
                        store.dispatch(hydrateCart(parsed))
                    }
                }
            } catch (e) { console.warn('Failed to load cart from localStorage:', e) }

            // Wishlist
            try {
                const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
                if (savedWishlist) {
                    const parsed = JSON.parse(savedWishlist)
                    if (Array.isArray(parsed)) {
                        store.dispatch(hydrateWishlist(parsed))
                    }
                }
            } catch (e) { console.warn('Failed to load wishlist from localStorage:', e) }

            // Cash Flow Management
            try {
                const savedCashflow = localStorage.getItem(CASHFLOW_STORAGE_KEY)
                if (savedCashflow) {
                    const parsed = JSON.parse(savedCashflow)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateCashflow(parsed))
                    } else {
                        store.dispatch(hydrateCashflow(defaultCashflowData))
                    }
                } else {
                    store.dispatch(hydrateCashflow(defaultCashflowData))
                }
            } catch (e) {
                console.warn('Failed to load cash flow from localStorage:', e)
                store.dispatch(hydrateCashflow(defaultCashflowData))
            }

            // API & Integration Settings
            try {
                const savedApiSettings = localStorage.getItem(API_SETTINGS_STORAGE_KEY)
                if (savedApiSettings) {
                    const parsed = JSON.parse(savedApiSettings)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateApiSettings(parsed))
                    } else {
                        store.dispatch(hydrateApiSettings(defaultApiSettings))
                    }
                } else {
                    store.dispatch(hydrateApiSettings(defaultApiSettings))
                }
            } catch (e) {
                console.warn('Failed to load api settings from localStorage:', e)
                store.dispatch(hydrateApiSettings(defaultApiSettings))
            }
        }

        // ===== HYDRATE from Firestore (primary) or localStorage (fallback) =====
        async function hydrateData() {
            if (firebaseEnabled) {
                try {
                    // --- Products ---
                    let fsProducts = await loadCollectionFromFirestore('products')
                    try {
                        const saved = localStorage.getItem(PRODUCT_STORAGE_KEY)
                        if (saved) {
                            const localProducts = JSON.parse(saved)
                            if (Array.isArray(localProducts) && localProducts.length > 0) {
                                if (!fsProducts || fsProducts.length === 0) {
                                    fsProducts = localProducts
                                    syncCollectionToFirestore('products', localProducts)
                                } else {
                                    // Upload any local products not yet in Firestore
                                    const fsIds = new Set(fsProducts.map(p => String(p.id)))
                                    const missingLocals = localProducts.filter(p => p.id && !fsIds.has(String(p.id)))
                                    if (missingLocals.length > 0) {
                                        missingLocals.forEach(p => saveDocToFirestore('products', p.id, p))
                                        fsProducts = [...missingLocals, ...fsProducts]
                                    }
                                }
                            }
                        }
                    } catch (e) { console.warn('Product merge error:', e) }

                    if (fsProducts && fsProducts.length > 0) {
                        store.dispatch(setProduct(fsProducts))
                        prevProductsRef.current = fsProducts
                        try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(fsProducts)) } catch (e) { /* ignore */ }
                    } else {
                        lsLoadProducts()
                    }

                    // --- Categories ---
                    let fsCategories = await loadCollectionFromFirestore('categories')
                    if (!fsCategories || fsCategories.length === 0) {
                        try {
                            const savedCat = localStorage.getItem(CATEGORY_STORAGE_KEY)
                            const localCats = savedCat ? JSON.parse(savedCat) : defaultCategories
                            if (Array.isArray(localCats) && localCats.length > 0) {
                                fsCategories = localCats
                                syncCollectionToFirestore('categories', localCats)
                            }
                        } catch (e) { /* ignore */ }
                    }
                    if (fsCategories && fsCategories.length > 0) {
                        store.dispatch(hydrateCategories(fsCategories))
                        try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(fsCategories)) } catch (e) { /* ignore */ }
                    } else {
                        lsLoadCategories()
                    }

                    // --- Banners ---
                    let fsBanners = await loadCollectionFromFirestore('banners')
                    if (!fsBanners || fsBanners.length === 0) {
                        try {
                            const savedBanners = localStorage.getItem(BANNER_STORAGE_KEY)
                            const localBanners = savedBanners ? JSON.parse(savedBanners) : defaultBanners
                            if (Array.isArray(localBanners) && localBanners.length > 0) {
                                fsBanners = localBanners
                                syncCollectionToFirestore('banners', localBanners)
                            }
                        } catch (e) { /* ignore */ }
                    }
                    if (fsBanners && fsBanners.length > 0) {
                        const seen = new Set()
                        const deduped = fsBanners.filter(b => {
                            if (!b.id || seen.has(b.id)) return false
                            seen.add(b.id)
                            return true
                        })
                        store.dispatch(hydrateBanners(deduped))
                        try { localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(deduped)) } catch (e) { /* ignore */ }
                    } else {
                        lsLoadBanners()
                    }

                    // --- Coupons ---
                    let fsCoupons = await loadCollectionFromFirestore('coupons')
                    if (!fsCoupons || fsCoupons.length === 0) {
                        try {
                            const savedCoupons = localStorage.getItem(COUPON_STORAGE_KEY)
                            const localCoupons = savedCoupons ? JSON.parse(savedCoupons) : couponDummyData
                            if (Array.isArray(localCoupons) && localCoupons.length > 0) {
                                fsCoupons = localCoupons
                                syncCollectionToFirestore('coupons', localCoupons)
                            }
                        } catch (e) { /* ignore */ }
                    }
                    if (fsCoupons && fsCoupons.length > 0) {
                        store.dispatch(hydrateCoupons(fsCoupons))
                        try { localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(fsCoupons)) } catch (e) { /* ignore */ }
                    } else {
                        lsLoadCoupons()
                    }

                    // --- Hero Banner ---
                    let fsHero = await loadDocFromFirestore('settings', 'hero')
                    if (!fsHero) {
                        try {
                            const savedHero = localStorage.getItem(HERO_STORAGE_KEY)
                            const localHero = savedHero ? JSON.parse(savedHero) : defaultHeroData
                            if (localHero) {
                                fsHero = localHero
                                saveDocToFirestore('settings', 'hero', localHero)
                            }
                        } catch (e) { /* ignore */ }
                    }
                    if (fsHero) {
                        store.dispatch(hydrateHero(fsHero))
                        try { localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(fsHero)) } catch (e) { /* ignore */ }
                    } else {
                        lsLoadHero()
                    }

                    // --- Shipping Settings ---
                    let fsShipping = await loadDocFromFirestore('settings', 'shipping')
                    if (!fsShipping) {
                        try {
                            const savedShipping = localStorage.getItem(SHIPPING_STORAGE_KEY)
                            if (savedShipping) {
                                const localShipping = JSON.parse(savedShipping)
                                if (localShipping) {
                                    fsShipping = localShipping
                                    saveDocToFirestore('settings', 'shipping', localShipping)
                                }
                            }
                        } catch (e) { /* ignore */ }
                    }
                    if (fsShipping) {
                        store.dispatch(hydrateShipping(fsShipping))
                    } else {
                        lsLoadShipping()
                    }

                    // --- Contact/Store Info ---
                    let fsContact = await loadDocFromFirestore('settings', 'contact')
                    if (!fsContact) {
                        try {
                            const savedContact = localStorage.getItem(CONTACT_STORAGE_KEY)
                            if (savedContact) {
                                const localContact = JSON.parse(savedContact)
                                if (localContact) {
                                    fsContact = localContact
                                    saveDocToFirestore('settings', 'contact', localContact)
                                }
                            }
                        } catch (e) { /* ignore */ }
                    }
                    if (fsContact) {
                        store.dispatch(hydrateContact({
                            messages: fsContact.messages || defaultMessages,
                            storeInfo: fsContact.storeInfo || defaultStoreInfo
                        }))
                    } else {
                        lsLoadContact()
                    }

                } catch (e) {
                    console.warn('[Firestore] Initial hydration failed, falling back to localStorage:', e)
                    lsLoadAllAdmin()
                }
            } else {
                // Firebase not configured — use localStorage only
                lsLoadAllAdmin()
            }

            // User-specific data always loads from localStorage
            lsLoadUserSpecific()
        }

        hydrateData()

        // ===== REAL-TIME LISTENERS (Firestore → Redux) =====
        const unsubscribers = []

        if (firebaseEnabled) {
            // Products real-time listener
            unsubscribers.push(
                subscribeToCollection('products', (docs) => {
                    if (docs && docs.length > 0) {
                        isReceivingFromFirestore = true
                        store.dispatch(setProduct(docs))
                        prevProductsRef.current = docs
                        try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(docs)) } catch (e) { /* ignore */ }
                        isReceivingFromFirestore = false
                    }
                })
            )

            // Categories real-time listener
            unsubscribers.push(
                subscribeToCollection('categories', (docs) => {
                    if (docs && docs.length > 0) {
                        isReceivingFromFirestore = true
                        store.dispatch(hydrateCategories(docs))
                        try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(docs)) } catch (e) { /* ignore */ }
                        isReceivingFromFirestore = false
                    }
                })
            )

            // Banners real-time listener
            unsubscribers.push(
                subscribeToCollection('banners', (docs) => {
                    if (docs && docs.length > 0) {
                        const seen = new Set()
                        const deduped = docs.filter(b => {
                            if (!b.id || seen.has(b.id)) return false
                            seen.add(b.id)
                            return true
                        })
                        isReceivingFromFirestore = true
                        store.dispatch(hydrateBanners(deduped))
                        try { localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(deduped)) } catch (e) { /* ignore */ }
                        isReceivingFromFirestore = false
                    }
                })
            )

            // Coupons real-time listener
            unsubscribers.push(
                subscribeToCollection('coupons', (docs) => {
                    if (docs && docs.length > 0) {
                        isReceivingFromFirestore = true
                        store.dispatch(hydrateCoupons(docs))
                        try { localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(docs)) } catch (e) { /* ignore */ }
                        isReceivingFromFirestore = false
                    }
                })
            )

            // Hero Banner real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'hero', (data) => {
                    if (data) {
                        isReceivingFromFirestore = true
                        store.dispatch(hydrateHero(data))
                        try { localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                        isReceivingFromFirestore = false
                    }
                })
            )

            // Shipping real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'shipping', (data) => {
                    if (data) {
                        isReceivingFromFirestore = true
                        store.dispatch(hydrateShipping(data))
                        try { localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                        isReceivingFromFirestore = false
                    }
                })
            )

            // Contact/Store Info real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'contact', (data) => {
                    if (data) {
                        isReceivingFromFirestore = true
                        store.dispatch(hydrateContact({
                            messages: data.messages || defaultMessages,
                            storeInfo: data.storeInfo || defaultStoreInfo
                        }))
                        try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                        isReceivingFromFirestore = false
                    }
                })
            )
        }

        // ===== BroadcastChannel for product sync across tabs =====
        const channel = new BroadcastChannel(CHANNEL_NAME)

        channel.onmessage = (event) => {
            if (event.data?.type === 'PRODUCT_UPDATE' && storeRef.current) {
                isReceivingRef.current = true
                store.dispatch(setProduct(event.data.products))
                prevProductsRef.current = event.data.products
                isReceivingRef.current = false
            }
        }

        // ===== SUBSCRIBE: persist state changes to localStorage + Firestore =====
        let prevCoupons = store.getState().coupon.coupons
        let prevBanners = store.getState().banner.banners
        let prevHero = store.getState().hero
        let prevUser = store.getState().user.currentUser
        let prevSavedUsers = store.getState().user.savedUsers
        let prevOrders = store.getState().order.orders
        let prevCart = store.getState().cart
        let prevContact = store.getState().contact
        let prevWishlist = store.getState().wishlist?.items
        let prevCategories = store.getState().category?.categories
        let prevShipping = store.getState().shipping
        let prevCashflow = store.getState().cashflow
        let prevApiSettings = store.getState().apiSettings

        const unsubscribe = store.subscribe(() => {
            const state = store.getState()

            // --- Coupons (Firestore + localStorage) ---
            const currentCoupons = state.coupon.coupons
            if (currentCoupons !== prevCoupons) {
                prevCoupons = currentCoupons
                try { localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(currentCoupons)) } catch (e) { /* ignore */ }
                if (firebaseEnabled && !isReceivingFromFirestore) {
                    syncCollectionToFirestore('coupons', currentCoupons)
                }
            }

            // --- Banners (Firestore + localStorage) ---
            const currentBanners = state.banner.banners
            if (currentBanners !== prevBanners) {
                prevBanners = currentBanners
                try { localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(currentBanners)) } catch (e) { /* ignore */ }
                if (firebaseEnabled && !isReceivingFromFirestore) {
                    syncCollectionToFirestore('banners', currentBanners)
                }
            }

            // --- Hero Banner (Firestore + localStorage) ---
            const currentHero = state.hero
            if (currentHero !== prevHero) {
                prevHero = currentHero
                try { localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(currentHero)) } catch (e) { /* ignore */ }
                if (firebaseEnabled && !isReceivingFromFirestore) {
                    saveDocToFirestore('settings', 'hero', currentHero)
                }
            }

            // --- User (localStorage only — user-specific) ---
            const currentUser = state.user.currentUser
            if (currentUser !== prevUser) {
                prevUser = currentUser
                try {
                    if (currentUser) {
                        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser))
                    } else {
                        localStorage.removeItem(USER_STORAGE_KEY)
                    }
                } catch (e) { /* ignore */ }
            }

            // --- Saved Users (localStorage only) ---
            const currentSavedUsers = state.user.savedUsers
            if (currentSavedUsers !== prevSavedUsers) {
                prevSavedUsers = currentSavedUsers
                try { localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(currentSavedUsers)) } catch (e) { /* ignore */ }
            }

            // --- Orders (localStorage only for now) ---
            const currentOrders = state.order.orders
            if (currentOrders !== prevOrders) {
                prevOrders = currentOrders
                try { localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(currentOrders)) } catch (e) { /* ignore */ }
            }

            // --- Cart (localStorage only — user-specific) ---
            const currentCart = state.cart
            if (currentCart !== prevCart) {
                prevCart = currentCart
                try {
                    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
                        cartItems: currentCart.cartItems,
                        total: currentCart.total
                    }))
                } catch (e) { /* ignore */ }
            }

            // --- Contact (Firestore + localStorage) ---
            const currentContact = state.contact
            if (currentContact !== prevContact) {
                prevContact = currentContact
                try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(currentContact)) } catch (e) { /* ignore */ }
                if (firebaseEnabled && !isReceivingFromFirestore) {
                    saveDocToFirestore('settings', 'contact', currentContact)
                }
            }

            // --- Wishlist (localStorage only — user-specific) ---
            const currentWishlist = state.wishlist?.items
            if (currentWishlist !== prevWishlist) {
                prevWishlist = currentWishlist
                try { localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(currentWishlist)) } catch (e) { /* ignore */ }
            }

            // --- Categories (Firestore + localStorage) ---
            const currentCategories = state.category?.categories
            if (currentCategories !== prevCategories) {
                prevCategories = currentCategories
                try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(currentCategories)) } catch (e) { /* ignore */ }
                if (firebaseEnabled && !isReceivingFromFirestore) {
                    syncCollectionToFirestore('categories', currentCategories)
                }
            }

            // --- Shipping (Firestore + localStorage) ---
            const currentShipping = state.shipping
            if (currentShipping !== prevShipping) {
                prevShipping = currentShipping
                try { localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(currentShipping)) } catch (e) { /* ignore */ }
                if (firebaseEnabled && !isReceivingFromFirestore) {
                    saveDocToFirestore('settings', 'shipping', currentShipping)
                }
            }

            // --- Cash Flow (localStorage only — admin internal) ---
            const currentCashflow = state.cashflow
            if (currentCashflow !== prevCashflow) {
                prevCashflow = currentCashflow
                try { localStorage.setItem(CASHFLOW_STORAGE_KEY, JSON.stringify(currentCashflow)) } catch (e) { /* ignore */ }
            }

            // --- API Settings (localStorage only — contains secrets) ---
            const currentApiSettings = state.apiSettings
            if (currentApiSettings !== prevApiSettings) {
                prevApiSettings = currentApiSettings
                try { localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(currentApiSettings)) } catch (e) { /* ignore */ }
            }

            // --- Products: BroadcastChannel + localStorage + Firestore ---
            if (!isReceivingRef.current && !isReceivingFromFirestore) {
                const currentProducts = state.product.list
                if (currentProducts !== prevProductsRef.current) {
                    prevProductsRef.current = currentProducts
                    channel.postMessage({ type: 'PRODUCT_UPDATE', products: currentProducts })
                    try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(currentProducts)) } catch (e) { /* ignore */ }
                    if (firebaseEnabled) {
                        syncCollectionToFirestore('products', currentProducts)
                    }
                }
            }
        })

        return () => {
            unsubscribe()
            channel.close()
            // Cleanup Firestore real-time listeners
            unsubscribers.forEach(unsub => unsub())
        }
    }, [])

    return <Provider store={storeRef.current}>{children}</Provider>
}