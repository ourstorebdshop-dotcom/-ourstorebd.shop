'use client'
import { useRef, useEffect } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '../lib/store'
import { setProduct } from '@/lib/features/product/productSlice'
import { hydrateCoupons } from '@/lib/features/coupon/couponSlice'
import { hydrateBanners } from '@/lib/features/banner/bannerSlice'
import { hydrateUser, hydrateSavedUsers } from '@/lib/features/user/userSlice'
import { hydrateOrders } from '@/lib/features/order/orderSlice'
import { hydrateCart } from '@/lib/features/cart/cartSlice'
import { hydrateContact } from '@/lib/features/contact/contactSlice'
import { hydrateWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { hydrateCategories } from '@/lib/features/category/categorySlice'
import { hydrateShipping } from '@/lib/features/shipping/shippingSlice'
import { hydrateFraud } from '@/lib/features/fraud/fraudSlice'
import { hydrateCashflow } from '@/lib/features/cashflow/cashflowSlice'
import { hydrateHero } from '@/lib/features/hero/heroSlice'
import { hydrateApiSettings } from '@/lib/features/apiSettings/apiSettingsSlice'
import { hydrateHeaderFooter } from '@/lib/features/headerFooter/headerFooterSlice'
import { hydrateTracking } from '@/lib/features/tracking/trackingSlice'
import { hydrateFavicon } from '@/lib/features/favicon/faviconSlice'
import { hydrateIntegrations } from '@/lib/features/integrations/integrationsSlice'
import {
    isFirebaseConfigured,
    loadDocFromFirestore,
    deleteDocFromFirestore,
    loadCollectionFromFirestore,
    subscribeToDoc,
    subscribeToCollection,
} from '@/lib/firestore'
import { setAdminUnreadCount } from '@/lib/features/chat/chatSlice'
import { subscribeToAdminUnreadCount } from '@/lib/chatFirestore'

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
const FRAUD_STORAGE_KEY = 'gocart_fraud'
const CASHFLOW_STORAGE_KEY = 'gocart_cashflow'
const API_SETTINGS_STORAGE_KEY = 'gocart_api_settings'
const HEADER_FOOTER_STORAGE_KEY = 'gocart_header_footer'
const TRACKING_STORAGE_KEY = 'gocart_tracking_settings'
const FAVICON_STORAGE_KEY = 'gocart_favicon_settings'

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


export default function StoreProvider({ children }) {
    const storeRef = useRef(undefined)
    const isReceivingRef = useRef(false)
    const prevProductsRef = useRef(null)

    if (!storeRef.current) {
        storeRef.current = makeStore()
        prevProductsRef.current = storeRef.current.getState().product.list
        // Synchronous user hydration — MUST happen before first render
        // so profile page doesn't flash guest view
        if (typeof window !== 'undefined') {
            try {
                const deletedIds = JSON.parse(localStorage.getItem('gocart_deleted_user_ids') || '[]')
                const savedUserList = localStorage.getItem(SAVED_USERS_STORAGE_KEY)
                if (savedUserList !== null) {
                    let parsedUsers = JSON.parse(savedUserList)
                    if (Array.isArray(parsedUsers)) {
                        parsedUsers = parsedUsers.filter(u => u.name !== 'Google Customer' && !deletedIds.includes(u.id))
                        storeRef.current.dispatch(hydrateSavedUsers(parsedUsers))
                    }
                }
                const savedCurrentUser = localStorage.getItem(USER_STORAGE_KEY)
                if (savedCurrentUser) {
                    const parsedUser = JSON.parse(savedCurrentUser)
                    if (parsedUser && parsedUser.id && parsedUser.name !== 'Google Customer' && !deletedIds.includes(parsedUser.id)) {
                        storeRef.current.dispatch(hydrateUser(parsedUser))
                    }
                }
            } catch (e) { /* ignore */ }
        }
    }

    useEffect(() => {
        const store = storeRef.current
        const firebaseEnabled = isFirebaseConfigured()

        // Guard counter: prevents the subscribe handler from writing stale data
        // back while Firestore hydration is in progress.
        let firestoreReceiveDepth = 0

        // Declare and initialize all state tracking variables at the very top of useEffect
        // to completely eliminate any Temporal Dead Zone (TDZ) risk across async callbacks/listeners.
        let prevCoupons = store.getState().coupon?.coupons
        let prevBanners = store.getState().banner?.banners
        let prevHero = store.getState().hero
        let prevUser = store.getState().user?.currentUser
        let prevSavedUsers = store.getState().user?.savedUsers
        let prevOrders = store.getState().order?.orders
        let prevCart = store.getState().cart
        let prevContact = store.getState().contact
        let prevWishlist = store.getState().wishlist?.items
        let prevCategories = store.getState().category?.categories
        let prevShipping = store.getState().shipping
        let prevFraud = store.getState().fraud
        let prevCashflow = store.getState().cashflow
        let prevApiSettings = store.getState().apiSettings
        let prevHeaderFooter = store.getState().headerFooter
        let prevTracking = store.getState().tracking
        let prevFavicon = store.getState().favicon
        let prevIntegrations = store.getState().integrations

        function getDeletedUserIds() {
            try {
                const raw = localStorage.getItem('gocart_deleted_user_ids')
                if (!raw) return []
                const parsed = JSON.parse(raw)
                return Array.isArray(parsed) ? parsed : []
            } catch {
                return []
            }
        }

        // ===== ONE-TIME CLEANUP: clear corrupted localStorage & default dummy wishlist =====
        try {
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
                    const deleted = getDeletedUserIds()
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
        } catch (e) {
            console.warn('One-time storage migration failed:', e)
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
                    }
                }
            } catch (e) {
                console.warn('Failed to load coupons from localStorage:', e)
            }
        }

        function lsLoadBanners() {
            try {
                const saved = localStorage.getItem(BANNER_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        const seen = new Set()
                        const deduped = parsed.filter(b => {
                            if (!b.id || seen.has(b.id)) return false
                            seen.add(b.id)
                            return true
                        })
                        store.dispatch(hydrateBanners(deduped))
                    }
                }
            } catch (e) {
                console.warn('Failed to load banners from localStorage:', e)
            }
        }

        function lsLoadHero() {
            try {
                const saved = localStorage.getItem(HERO_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateHero(parsed))
                    }
                }
            } catch (e) {
                console.warn('Failed to load hero banner from localStorage:', e)
            }
        }

        function lsLoadCategories() {
            try {
                const saved = localStorage.getItem(CATEGORY_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        store.dispatch(hydrateCategories(parsed))
                    }
                }
            } catch (e) {
                console.warn('Failed to load categories from localStorage:', e)
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

        function lsLoadFraud() {
            try {
                const saved = localStorage.getItem(FRAUD_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateFraud(parsed))
                    }
                }
            } catch (e) { console.warn('Failed to load fraud settings from localStorage:', e) }
        }

        function lsLoadContact() {
            try {
                const saved = localStorage.getItem(CONTACT_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateContact(parsed))
                    }
                }
            } catch (e) {
                console.warn('Failed to load contact state from localStorage:', e)
            }
        }

        function lsLoadHeaderFooter() {
            try {
                const saved = localStorage.getItem(HEADER_FOOTER_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateHeaderFooter(parsed))
                    }
                }
            } catch (e) {
                console.warn('Failed to load header/footer from localStorage:', e)
            }
        }

        function lsLoadTracking() {
            try {
                const saved = localStorage.getItem(TRACKING_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateTracking(parsed))
                    }
                }
            } catch (e) {
                console.warn('Failed to load tracking settings from localStorage:', e)
            }
        }

        function applyFaviconToDocument(faviconUrl, appleTouchIconUrl, updatedAt) {
            if (typeof document === 'undefined' || !faviconUrl) return

            const updateLinkTag = (rel, href) => {
                if (!href) return
                const finalHref = href.startsWith('data:')
                    ? href
                    : `${href}${href.includes('?') ? '&' : '?'}v=${updatedAt || Date.now()}`
                let link = document.querySelector(`link[rel='${rel}']`)
                if (!link) {
                    link = document.createElement('link')
                    link.rel = rel
                    document.head.appendChild(link)
                }
                link.href = finalHref
            }

            updateLinkTag('icon', faviconUrl)
            updateLinkTag('shortcut icon', faviconUrl)
            if (appleTouchIconUrl) {
                updateLinkTag('apple-touch-icon', appleTouchIconUrl)
            }
        }

        function lsLoadFavicon() {
            try {
                const saved = localStorage.getItem(FAVICON_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateFavicon(parsed))
                        if (parsed.faviconUrl) {
                            applyFaviconToDocument(parsed.faviconUrl, parsed.appleTouchIconUrl, parsed.updatedAt)
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to load favicon settings from localStorage:', e)
            }
        }

        function lsLoadAllAdmin() {
            lsLoadProducts()
            lsLoadCoupons()
            lsLoadBanners()
            lsLoadHero()
            lsLoadCategories()
            lsLoadShipping()
            lsLoadFraud()
            lsLoadContact()
            lsLoadHeaderFooter()
            lsLoadTracking()
            lsLoadFavicon()
        }

        function lsLoadUserSpecific() {
            // Users & Current Session
            try {
                const deletedIds = getDeletedUserIds()
                const savedUserList = localStorage.getItem(SAVED_USERS_STORAGE_KEY)
                if (savedUserList !== null) {
                    let parsedUsers = JSON.parse(savedUserList)
                    if (Array.isArray(parsedUsers)) {
                        parsedUsers = parsedUsers.filter(u => u.name !== 'Google Customer' && !deletedIds.includes(u.id))
                        store.dispatch(hydrateSavedUsers(parsedUsers))
                    } else {
                        store.dispatch(hydrateSavedUsers([]))
                    }
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
                    }
                }
            } catch (e) {
                console.warn('Failed to load orders from localStorage:', e)
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
                        const cleaned = parsed.filter(id => typeof id === 'string' && !DUMMY_IDS.has(id))
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
                    }
                }
            } catch (e) {
                console.warn('Failed to load cash flow from localStorage:', e)
            }

            // API & Integration Settings
            try {
                const savedApiSettings = localStorage.getItem(API_SETTINGS_STORAGE_KEY)
                if (savedApiSettings) {
                    const parsed = JSON.parse(savedApiSettings)
                    if (parsed && typeof parsed === 'object') {
                        store.dispatch(hydrateApiSettings(parsed))
                    }
                }
            } catch (e) {
                console.warn('Failed to load api settings from localStorage:', e)
            }
        }

        // ===== CACHE-FIRST HYDRATION (localStorage only — no demo data written to Firestore) =====
        // Guard: prevent the subscribe handler from syncing stale/default localStorage
        // data back to Firestore during initial hydration. The guard is held until
        // hydrateData() completes in its finally block, guaranteeing Firestore is the authoritative source.
        firestoreReceiveDepth++
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
                        ordersRes,
                        heroRes,
                        shippingRes,
                        contactRes,
                        headerFooterRes,
                        customersRes,
                        faviconRes,
                        fraudRes,
                        cashflowRes,
                        apiSettingsRes,
                        trackingRes,
                        integrationsRes,
                    ] = await Promise.allSettled([
                        loadCollectionFromFirestore('products'),
                        loadCollectionFromFirestore('categories'),
                        loadCollectionFromFirestore('banners'),
                        loadCollectionFromFirestore('coupons'),
                        loadCollectionFromFirestore('orders'),
                        loadDocFromFirestore('settings', 'hero'),
                        loadDocFromFirestore('settings', 'shipping'),
                        loadDocFromFirestore('settings', 'contact'),
                        loadDocFromFirestore('settings', 'header_footer'),
                        loadCollectionFromFirestore('customers'),
                        loadDocFromFirestore('settings', 'favicon'),
                        loadDocFromFirestore('settings', 'fraud'),
                        loadDocFromFirestore('settings', 'cashflow'),
                        loadDocFromFirestore('settings', 'api_settings'),
                        loadDocFromFirestore('settings', 'tracking'),
                        loadDocFromFirestore('settings', 'integrations'),
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
                    if (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) {
                        store.dispatch(hydrateCategories(categoriesRes.value))
                        try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoriesRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 3. Banners ---
                    if (bannersRes.status === 'fulfilled' && Array.isArray(bannersRes.value)) {
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
                    if (couponsRes.status === 'fulfilled' && Array.isArray(couponsRes.value)) {
                        store.dispatch(hydrateCoupons(couponsRes.value))
                        try { localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(couponsRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 4b. Orders ---
                    if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
                        const fsOrders = ordersRes.value.filter(o => o && o.id)
                        store.dispatch(hydrateOrders(fsOrders))
                        prevOrders = fsOrders
                        try { localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(fsOrders)) } catch (e) { /* ignore */ }
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
                            messages: Array.isArray(fsContact.messages) ? fsContact.messages : [],
                            storeInfo: fsContact.storeInfo || {}
                        }))
                        try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(fsContact)) } catch (e) { /* ignore */ }
                    }

                    // --- 8. Header & Footer ---
                    if (headerFooterRes.status === 'fulfilled' && headerFooterRes.value) {
                        store.dispatch(hydrateHeaderFooter(headerFooterRes.value))
                        try { localStorage.setItem(HEADER_FOOTER_STORAGE_KEY, JSON.stringify(headerFooterRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 8b. Favicon Settings ---
                    if (faviconRes?.status === 'fulfilled' && faviconRes.value) {
                        store.dispatch(hydrateFavicon(faviconRes.value))
                        try { localStorage.setItem(FAVICON_STORAGE_KEY, JSON.stringify(faviconRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 8c. Fraud Guard Settings ---
                    if (fraudRes?.status === 'fulfilled' && fraudRes.value) {
                        store.dispatch(hydrateFraud(fraudRes.value))
                        try { localStorage.setItem(FRAUD_STORAGE_KEY, JSON.stringify(fraudRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 8d. Cash Flow Data ---
                    if (cashflowRes?.status === 'fulfilled' && cashflowRes.value) {
                        store.dispatch(hydrateCashflow(cashflowRes.value))
                        try { localStorage.setItem(CASHFLOW_STORAGE_KEY, JSON.stringify(cashflowRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 8e. API Settings ---
                    if (apiSettingsRes?.status === 'fulfilled' && apiSettingsRes.value) {
                        store.dispatch(hydrateApiSettings(apiSettingsRes.value))
                        try { localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(apiSettingsRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 8f. Tracking & Pixel Settings ---
                    if (trackingRes?.status === 'fulfilled' && trackingRes.value) {
                        store.dispatch(hydrateTracking(trackingRes.value))
                        try { localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(trackingRes.value)) } catch (e) { /* ignore */ }
                    }

                    // --- 9. Customers (Firestore is source of truth) ---
                    if (customersRes.status === 'fulfilled' && Array.isArray(customersRes.value)) {
                        const fsCustomers = customersRes.value
                        const deletedIds = getDeletedUserIds()
                        const filtered = fsCustomers.filter(u => u && u.id && !deletedIds.includes(u.id))
                        store.dispatch(hydrateSavedUsers(filtered))
                        try { localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(filtered)) } catch (e) { /* ignore */ }
                    }

                    // --- 10. Integrations ---
                    if (integrationsRes?.status === 'fulfilled' && integrationsRes.value) {
                        store.dispatch(hydrateIntegrations(integrationsRes.value))
                        prevIntegrations = integrationsRes.value
                    }
                } catch (e) {
                    console.warn('[Firestore] Background parallel hydration failed:', e)
                } finally {
                    firestoreReceiveDepth--
                }
            } else {
                firestoreReceiveDepth--
            }
        }

        // Immediately trigger network hydration on mount (do not delay with idle callback)
        hydrateData()

        // ===== REAL-TIME LISTENERS (Firestore → Redux) =====
        const unsubscribers = []

        if (firebaseEnabled) {
            // Products real-time listener
            unsubscribers.push(
                subscribeToCollection('products', (docs) => {
                    if (docs && Array.isArray(docs)) {
                        const cleaned = docs.filter(p => !isDemoProduct(p))
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(setProduct(cleaned))
                        prevProductsRef.current = cleaned
                        try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(cleaned)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Categories real-time listener
            unsubscribers.push(
                subscribeToCollection('categories', (docs) => {
                    if (docs && Array.isArray(docs)) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateCategories(docs))
                        try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(docs)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Banners real-time listener
            unsubscribers.push(
                subscribeToCollection('banners', (docs) => {
                    if (docs && Array.isArray(docs)) {
                        const seen = new Set()
                        const deduped = docs.filter(b => {
                            if (!b.id || seen.has(b.id)) return false
                            seen.add(b.id)
                            return true
                        })
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateBanners(deduped))
                        try { localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(deduped)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Coupons real-time listener
            unsubscribers.push(
                subscribeToCollection('coupons', (docs) => {
                    if (docs && Array.isArray(docs)) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateCoupons(docs))
                        try { localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(docs)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Orders real-time listener (syncs order changes across all devices/tabs immediately)
            unsubscribers.push(
                subscribeToCollection('orders', (docs) => {
                    if (docs && Array.isArray(docs)) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateOrders(docs))
                        prevOrders = docs
                        try { localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(docs)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Hero Banner real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'hero', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateHero(data))
                        try { localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Shipping real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'shipping', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateShipping(data))
                        try { localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Contact/Store Info real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'contact', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateContact({
                            messages: Array.isArray(data.messages) ? data.messages : [],
                            storeInfo: data.storeInfo || {}
                        }))
                        try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Header & Footer real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'header_footer', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateHeaderFooter(data))
                        try { localStorage.setItem(HEADER_FOOTER_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Tracking & Advertising real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'tracking', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateTracking(data))
                        try { localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Favicon real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'favicon', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateFavicon(data))
                        try { localStorage.setItem(FAVICON_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                        applyFaviconToDocument(data.faviconUrl, data.appleTouchIconUrl, data.updatedAt)
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Fraud settings real-time listener (always active so navigation to /admin gets immediate updates)
            unsubscribers.push(
                subscribeToDoc('settings', 'fraud', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateFraud(data))
                        try { localStorage.setItem(FRAUD_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Cash Flow real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'cashflow', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateCashflow(data))
                        try { localStorage.setItem(CASHFLOW_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // API Settings real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'api_settings', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateApiSettings(data))
                        try { localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(data)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Chat admin unread count real-time listener (lightweight — counts only)
            unsubscribers.push(
                subscribeToAdminUnreadCount((count) => {
                    store.dispatch(setAdminUnreadCount(count))
                })
            )

            // Integrations real-time listener
            unsubscribers.push(
                subscribeToDoc('settings', 'integrations', (data) => {
                    if (data) {
                    firestoreReceiveDepth++
                    try {
                        store.dispatch(hydrateIntegrations(data))
                        prevIntegrations = data
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )

            // Customers real-time listener
            unsubscribers.push(
                subscribeToCollection('customers', (docs) => {
                    if (docs && Array.isArray(docs)) {
                    firestoreReceiveDepth++
                    try {
                        const deletedIds = getDeletedUserIds()
                        const filtered = docs.filter(u => u && u.id && !deletedIds.includes(u.id))
                        store.dispatch(hydrateSavedUsers(filtered))
                        try { localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(filtered)) } catch (e) { /* ignore */ }
                    } finally { firestoreReceiveDepth-- }
                    }
                })
            )
        }

        // ===== BroadcastChannel for product sync across tabs =====
        // Wrapped in try-catch: BroadcastChannel is NOT supported in all mobile browsers
        // (e.g. older Samsung Internet, some WebView browsers). Without this guard,
        // an uncaught error here kills the entire useEffect — disabling ALL Firestore
        // listeners, localStorage persistence, and data sync on mobile.
        let channel = null
        try {
            channel = new BroadcastChannel(CHANNEL_NAME)
        } catch (e) {
            // BroadcastChannel unsupported — cross-tab product sync disabled, everything else works
        }

        if (channel) {
            channel.onmessage = (event) => {
                if (event.data?.type === 'PRODUCT_UPDATE' && storeRef.current) {
                    isReceivingRef.current = true
                    store.dispatch(setProduct(event.data.products))
                    prevProductsRef.current = event.data.products
                    isReceivingRef.current = false
                }
            }
        }

        // ===== SUBSCRIBE: persist state changes to localStorage only =====
        // NOTE: Firestore writes are handled EXCLUSIVELY by admin page handlers.
        // This subscribe handler is localStorage-only to prevent competing writers.
        const unsubscribe = store.subscribe(() => {
            const state = store.getState()

            // --- Coupons (localStorage cache) ---
            const currentCoupons = state.coupon.coupons
            if (currentCoupons !== prevCoupons) {
                prevCoupons = currentCoupons
                try { localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(currentCoupons)) } catch (e) { /* ignore */ }
            }

            // --- Banners (localStorage cache) ---
            const currentBanners = state.banner.banners
            if (currentBanners !== prevBanners) {
                prevBanners = currentBanners
                try { localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(currentBanners)) } catch (e) { /* ignore */ }
            }

            // --- Hero Banner (localStorage cache) ---
            const currentHero = state.hero
            if (currentHero !== prevHero) {
                prevHero = currentHero
                try { localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(currentHero)) } catch (e) { /* ignore */ }
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

            // --- Saved Users (localStorage cache) ---
            const currentSavedUsers = state.user.savedUsers
            if (currentSavedUsers !== prevSavedUsers) {
                prevSavedUsers = currentSavedUsers
                try {
                    const deletedIds = getDeletedUserIds()
                    const sanitized = currentSavedUsers.filter(u => !deletedIds.includes(u.id))
                    localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(sanitized))
                } catch (e) { /* ignore */ }
            }

            // --- Orders (localStorage cache) ---
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

            // --- Contact (localStorage cache) ---
            const currentContact = state.contact
            if (currentContact !== prevContact) {
                prevContact = currentContact
                try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(currentContact)) } catch (e) { /* ignore */ }
            }

            // --- Wishlist (localStorage only — user-specific) ---
            const currentWishlist = state.wishlist?.items
            if (currentWishlist !== prevWishlist) {
                prevWishlist = currentWishlist
                try { localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(currentWishlist)) } catch (e) { /* ignore */ }
            }

            // --- Categories (localStorage cache) ---
            const currentCategories = state.category?.categories
            if (currentCategories !== prevCategories) {
                prevCategories = currentCategories
                try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(currentCategories)) } catch (e) { /* ignore */ }
            }

            // --- Shipping (localStorage cache) ---
            const currentShipping = state.shipping
            if (currentShipping !== prevShipping) {
                prevShipping = currentShipping
                try { localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(currentShipping)) } catch (e) { /* ignore */ }
            }

            // --- Fraud (localStorage cache) ---
            const currentFraud = state.fraud
            if (currentFraud !== prevFraud) {
                prevFraud = currentFraud
                try { localStorage.setItem(FRAUD_STORAGE_KEY, JSON.stringify(currentFraud)) } catch (e) { /* ignore */ }
            }

            // --- Cash Flow (localStorage cache) ---
            const currentCashflow = state.cashflow
            if (currentCashflow !== prevCashflow) {
                prevCashflow = currentCashflow
                try { localStorage.setItem(CASHFLOW_STORAGE_KEY, JSON.stringify(currentCashflow)) } catch (e) { /* ignore */ }
            }

            // --- API Settings (localStorage cache) ---
            const currentApiSettings = state.apiSettings
            if (currentApiSettings !== prevApiSettings) {
                prevApiSettings = currentApiSettings
                try { localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(currentApiSettings)) } catch (e) { /* ignore */ }
            }

            // --- Header & Footer (localStorage cache) ---
            const currentHeaderFooter = state.headerFooter
            if (currentHeaderFooter !== prevHeaderFooter) {
                prevHeaderFooter = currentHeaderFooter
                try { localStorage.setItem(HEADER_FOOTER_STORAGE_KEY, JSON.stringify(currentHeaderFooter)) } catch (e) { /* ignore */ }
            }

            // --- Tracking & Advertising Settings (localStorage cache) ---
            const currentTracking = state.tracking
            if (currentTracking !== prevTracking) {
                prevTracking = currentTracking
                try { localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(currentTracking)) } catch (e) { /* ignore */ }
            }

            // --- Favicon Settings (localStorage cache + DOM update) ---
            const currentFavicon = state.favicon
            if (currentFavicon !== prevFavicon) {
                prevFavicon = currentFavicon
                try { localStorage.setItem(FAVICON_STORAGE_KEY, JSON.stringify(currentFavicon)) } catch (e) { /* ignore */ }
                applyFaviconToDocument(currentFavicon.faviconUrl, currentFavicon.appleTouchIconUrl, currentFavicon.updatedAt)
            }

            // --- Integrations (no localStorage — Firestore only via admin page) ---
            const currentIntegrations = state.integrations
            if (currentIntegrations !== prevIntegrations) {
                prevIntegrations = currentIntegrations
            }

            // --- Products: BroadcastChannel + localStorage ---
            if (!isReceivingRef.current) {
                const currentProducts = state.product.list
                if (currentProducts !== prevProductsRef.current) {
                    prevProductsRef.current = currentProducts
                    if (channel) {
                        try { channel.postMessage({ type: 'PRODUCT_UPDATE', products: currentProducts }) } catch (e) { /* ignore */ }
                    }
                    try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(currentProducts)) } catch (e) { /* ignore */ }
                }
            }
        })

        // ===== Cross-tab user sync via storage event =====
        // When another tab registers/updates users in localStorage, sync to this tab's Redux
        const onStorageChange = (e) => {
            if (!storeRef.current) return
            try {
                if (e.key === SAVED_USERS_STORAGE_KEY && e.newValue) {
                    const parsed = JSON.parse(e.newValue)
                    if (Array.isArray(parsed)) {
                        const deletedIds = getDeletedUserIds()
                        const filtered = parsed.filter(u => u.name !== 'Google Customer' && !deletedIds.includes(u.id))
                        store.dispatch(hydrateSavedUsers(filtered))
                    }
                }
                if (e.key === USER_STORAGE_KEY) {
                    if (e.newValue) {
                        const parsed = JSON.parse(e.newValue)
                        if (parsed && parsed.id) {
                            store.dispatch(hydrateUser(parsed))
                        }
                    } else {
                        // User logged out in another tab
                        store.dispatch(hydrateUser(null))
                    }
                }
                if (e.key === FAVICON_STORAGE_KEY && e.newValue) {
                    const parsed = JSON.parse(e.newValue)
                    if (parsed && parsed.faviconUrl) {
                        store.dispatch(hydrateFavicon(parsed))
                        applyFaviconToDocument(parsed.faviconUrl, parsed.appleTouchIconUrl, parsed.updatedAt)
                    }
                }
            } catch (err) { /* ignore parse errors */ }
        }
        window.addEventListener('storage', onStorageChange)

        // ===== Mobile browser resume: re-fetch fresh data when page becomes visible =====
        // Mobile browsers aggressively suspend tabs/WebSocket connections when backgrounded.
        // When the user switches back, Firestore listeners may be stale or disconnected.
        // This ensures fresh data is always fetched on tab resume — critical for mobile.
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && firebaseEnabled) {
                hydrateData()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // ===== bfcache (back-forward cache) recovery =====
        // Mobile browsers use bfcache to instantly restore pages on back/forward navigation.
        // When a page is restored from bfcache (event.persisted === true), JavaScript state
        // is frozen from the previous visit — Firestore listeners are dead, data is stale.
        const handlePageShow = (event) => {
            if (event.persisted && firebaseEnabled) {
                hydrateData()
            }
        }
        window.addEventListener('pageshow', handlePageShow)

        return () => {
            unsubscribe()
            if (channel) {
                try { channel.close() } catch (e) { /* ignore */ }
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('pageshow', handlePageShow)
            window.removeEventListener('storage', onStorageChange)
            // Cleanup Firestore real-time listeners
            unsubscribers.forEach(unsub => unsub())
        }
    }, [])

    return <Provider store={storeRef.current}>{children}</Provider>
}