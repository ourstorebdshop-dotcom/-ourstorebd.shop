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
    deleteDocFromFirestore,
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

// Helper to identify untouched demo dummy products (e.g. prod_1 to prod_16)
const DUMMY_IDS = new Set([
    'prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5', 'prod_6', 'prod_7', 'prod_8',
    'prod_9', 'prod_10', 'prod_11', 'prod_12', 'prod_13', 'prod_14', 'prod_15', 'prod_16'
])
const DUMMY_NAMES = new Set([
    'Modern table lamp', 'Smart speaker gray', 'Smart watch white', 'Wireless headphones',
    'Camera 4k', 'Smart pen', 'Home theater 5.1', 'Wireless earbuds', 'Gaming mouse rgb',
    'Screen cleaner spray'
])
export function isDemoProduct(product) {
    if (!product) return false
    const idStr = String(product.id || '')
    if (DUMMY_IDS.has(idStr)) {
        if (DUMMY_NAMES.has(product.name)) return true
        if (typeof product.createdAt === 'string' && product.createdAt.includes('GMT+0530 (India Standard Time)')) return true
        const firstImg = product.images?.[0]
        if (typeof firstImg === 'string' && firstImg.includes('product_img')) return true
        if (typeof firstImg === 'object' && firstImg?.src?.includes('product_img')) return true
    }
    return false
}

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

        // ===== ONE-TIME CLEANUP: clear corrupted localStorage & default dummy wishlist =====
        const MIGRATION_KEY = 'gocart_data_v6'
        if (!localStorage.getItem(MIGRATION_KEY)) {
            localStorage.removeItem(CART_STORAGE_KEY)
            localStorage.setItem(MIGRATION_KEY, '1')
        }
        const WISHLIST_CLEANUP_KEY = 'gocart_wishlist_clean_v5'
        if (!localStorage.getItem(WISHLIST_CLEANUP_KEY)) {
            const savedWl = localStorage.getItem(WISHLIST_STORAGE_KEY)
            if (savedWl) {
                try {
                    const parsed = JSON.parse(savedWl)
                    if (Array.isArray(parsed)) {
                        // Strip any demo dummy product IDs (prod_1 to prod_16)
                        const cleaned = parsed.filter(id => typeof id === 'string' && !DUMMY_IDS.has(id))
                        if (cleaned.length > 0) {
                            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(cleaned))
                        } else {
                            localStorage.removeItem(WISHLIST_STORAGE_KEY)
                        }
                    } else {
                        localStorage.removeItem(WISHLIST_STORAGE_KEY)
                    }
                } catch (e) {
                    localStorage.removeItem(WISHLIST_STORAGE_KEY)
                }
            }
            localStorage.setItem(WISHLIST_CLEANUP_KEY, '1')
        }
        // ===== ONE-TIME CLEANUP: clear legacy demo products from localStorage =====
        const DEMO_CLEANUP_KEY = 'gocart_demo_clean_v2'
        if (!localStorage.getItem(DEMO_CLEANUP_KEY)) {
            try {
                const saved = localStorage.getItem(PRODUCT_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        const cleaned = parsed.filter(p => !isDemoProduct(p))
                        localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(cleaned))
                    }
                }
            } catch (e) { /* ignore */ }
            localStorage.setItem(DEMO_CLEANUP_KEY, '1')
        }

        // ===== ONE-TIME CLEANUP: clear legacy demo user from localStorage =====
        const DEMO_USER_CLEANUP_KEY = 'gocart_demo_user_clean_v1'
        if (!localStorage.getItem(DEMO_USER_CLEANUP_KEY)) {
            try {
                const deleted = JSON.parse(localStorage.getItem('gocart_deleted_user_ids') || '[]')
                if (!deleted.includes('user_demo_1')) {
                    deleted.push('user_demo_1')
                    localStorage.setItem('gocart_deleted_user_ids', JSON.stringify(deleted))
                }
                const saved = localStorage.getItem(SAVED_USERS_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        const cleaned = parsed.filter(u => u.id !== 'user_demo_1')
                        localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(cleaned))
                    }
                }
            } catch (e) { /* ignore */ }
            localStorage.setItem(DEMO_USER_CLEANUP_KEY, '1')
        }

        // ===== localStorage hydration helpers =====
        function lsLoadProducts() {
            try {
                const saved = localStorage.getItem(PRODUCT_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        const cleaned = parsed.filter(p => !isDemoProduct(p))
                        store.dispatch(setProduct(cleaned))
                        prevProductsRef.current = cleaned
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
                const deletedIds = JSON.parse(localStorage.getItem('gocart_deleted_user_ids') || '[]')
                const savedUserList = localStorage.getItem(SAVED_USERS_STORAGE_KEY)
                if (savedUserList !== null) {
                    let parsedUsers = JSON.parse(savedUserList)
                    if (Array.isArray(parsedUsers)) {
                        parsedUsers = parsedUsers.filter(u => u.name !== 'Google Customer' && !deletedIds.includes(u.id))
                        store.dispatch(hydrateSavedUsers(parsedUsers))
                    } else {
                        store.dispatch(hydrateSavedUsers([]))
                    }
                } else {
                    const initialUsers = defaultUsers.filter(u => !deletedIds.includes(u.id))
                    store.dispatch(hydrateSavedUsers(initialUsers))
                }
                const savedCurrentUser = localStorage.getItem(USER_STORAGE_KEY)
                if (savedCurrentUser) {
                    const parsedUser = JSON.parse(savedCurrentUser)
                    if (parsedUser && parsedUser.id && parsedUser.name !== 'Google Customer' && !deletedIds.includes(parsedUser.id)) {
                        store.dispatch(hydrateUser(parsedUser))
                    } else if (parsedUser && (parsedUser.name === 'Google Customer' || deletedIds.includes(parsedUser.id))) {
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
                        const cleaned = parsed.filter(id => typeof id === 'string' && !DEMO_PRODUCT_IDS.has(id))
                        store.dispatch(hydrateWishlist(cleaned))
                        if (cleaned.length !== parsed.length) {
                            try {
                                if (cleaned.length > 0) {
                                    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(cleaned))
                                } else {
                                    localStorage.removeItem(WISHLIST_STORAGE_KEY)
                                }
                            } catch (e) { /* ignore */ }
                        }
                    } else {
                        store.dispatch(hydrateWishlist([]))
                    }
                } else {
                    store.dispatch(hydrateWishlist([]))
                }
            } catch (e) {
                console.warn('Failed to load wishlist from localStorage:', e)
                store.dispatch(hydrateWishlist([]))
            }

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

        // ===== 0ms INSTANT CACHE-FIRST HYDRATION =====
        // Immediately load user session, cart, categories, banners, hero, products from localStorage!
        // This ensures the entire page renders with real data in 0ms with ZERO delay, pop-in, or login flicker!
        lsLoadUserSpecific()
        lsLoadAllAdmin()

        // ===== BACKGROUND PARALLEL FIRESTORE SYNC =====
        async function hydrateData() {
            if (firebaseEnabled) {
                try {
                    const [
                        productsRes,
                        categoriesRes,
                        bannersRes,
                        couponsRes,
                        heroRes,
                        shippingRes,
                        contactRes,
                    ] = await Promise.allSettled([
                        loadCollectionFromFirestore('products'),
                        loadCollectionFromFirestore('categories'),
                        loadCollectionFromFirestore('banners'),
                        loadCollectionFromFirestore('coupons'),
                        loadDocFromFirestore('settings', 'hero'),
                        loadDocFromFirestore('settings', 'shipping'),
                        loadDocFromFirestore('settings', 'contact'),
                    ])

                    // --- 1. Products ---
                    if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
                        let fsProducts = productsRes.value
                        const demoItems = fsProducts.filter(isDemoProduct)
                        if (demoItems.length > 0) {
                            demoItems.forEach(item => deleteDocFromFirestore('products', item.id))
                            fsProducts = fsProducts.filter(p => !isDemoProduct(p))
                        }
                        store.dispatch(setProduct(fsProducts))
                        prevProductsRef.current = fsProducts
                        try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(fsProducts)) } catch (e) { /* ignore */ }
                    }

                    // --- 2. Categories ---
                    if (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value) && categoriesRes.value.length > 0) {
                        store.dispatch(hydrateCategories(categoriesRes.value))
                        try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoriesRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 3. Banners ---
                    if (bannersRes.status === 'fulfilled' && Array.isArray(bannersRes.value) && bannersRes.value.length > 0) {
                        const seen = new Set()
                        const deduped = bannersRes.value.filter(b => {
                            if (!b.id || seen.has(b.id)) return false
                            seen.add(b.id)
                            return true
                        })
                        store.dispatch(hydrateBanners(deduped))
                        try { localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(deduped)) } catch (e) { /* ignore */ }
                    }

                    // --- 4. Coupons ---
                    if (couponsRes.status === 'fulfilled' && Array.isArray(couponsRes.value) && couponsRes.value.length > 0) {
                        store.dispatch(hydrateCoupons(couponsRes.value))
                        try { localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(couponsRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 5. Hero Banner ---
                    if (heroRes.status === 'fulfilled' && heroRes.value) {
                        store.dispatch(hydrateHero(heroRes.value))
                        try { localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(heroRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 6. Shipping Settings ---
                    if (shippingRes.status === 'fulfilled' && shippingRes.value) {
                        store.dispatch(hydrateShipping(shippingRes.value))
                        try { localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(shippingRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 7. Contact Info ---
                    if (contactRes.status === 'fulfilled' && contactRes.value) {
                        const fsContact = contactRes.value
                        store.dispatch(hydrateContact({
                            messages: fsContact.messages || defaultMessages,
                            storeInfo: fsContact.storeInfo || defaultStoreInfo
                        }))
                        try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(fsContact)) } catch (e) { /* ignore */ }
                    }
                } catch (e) {
                    console.warn('[Firestore] Background parallel hydration failed:', e)
                }
            }
        }

        hydrateData()

        // ===== REAL-TIME LISTENERS (Firestore → Redux) =====
        const unsubscribers = []

        if (firebaseEnabled) {
            // Products real-time listener
            unsubscribers.push(
                subscribeToCollection('products', (docs) => {
                    if (docs && Array.isArray(docs)) {
                        const cleaned = docs.filter(p => !isDemoProduct(p))
                        isReceivingFromFirestore = true
                        store.dispatch(setProduct(cleaned))
                        prevProductsRef.current = cleaned
                        try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(cleaned)) } catch (e) { /* ignore */ }
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
                try {
                    const deletedIds = JSON.parse(localStorage.getItem('gocart_deleted_user_ids') || '[]')
                    const sanitized = currentSavedUsers.filter(u => !deletedIds.includes(u.id))
                    localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(sanitized))
                } catch (e) { /* ignore */ }
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

            // --- Products: BroadcastChannel + localStorage ---
            if (!isReceivingRef.current && !isReceivingFromFirestore) {
                const currentProducts = state.product.list
                if (currentProducts !== prevProductsRef.current) {
                    prevProductsRef.current = currentProducts
                    channel.postMessage({ type: 'PRODUCT_UPDATE', products: currentProducts })
                    try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(currentProducts)) } catch (e) { /* ignore */ }
                    // Note: Atomic single-document operations in add-product/manage-product already update Firestore directly.
                    // syncCollectionToFirestore is deliberately omitted to prevent re-uploading the entire collection.
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