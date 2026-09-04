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

export default function StoreProvider({ children }) {
  const storeRef = useRef(undefined)
  const isReceivingRef = useRef(false)
  const prevProductsRef = useRef(null)

  if (!storeRef.current) {
    storeRef.current = makeStore()
    prevProductsRef.current = storeRef.current.getState().product.list
  }

  useEffect(() => {
    // ===== ONE-TIME CLEANUP: clear corrupted localStorage =====
    const MIGRATION_KEY = 'gocart_data_v6'
    if (!localStorage.getItem(MIGRATION_KEY)) {
      // Clear potentially corrupted cart data from previous versions
      localStorage.removeItem(CART_STORAGE_KEY)
      localStorage.setItem(MIGRATION_KEY, '1')
    }

    // ===== HYDRATE from localStorage (runs only on client) =====
    // Products: use localStorage if available, otherwise keep dummy data from initialState
    try {
      const savedProducts = localStorage.getItem(PRODUCT_STORAGE_KEY)
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts)
        if (Array.isArray(parsed) && parsed.length > 0) {
          storeRef.current.dispatch(setProduct(parsed))
          prevProductsRef.current = parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load products from localStorage:', e)
    }

    // Coupons: use localStorage if available, otherwise use dummy data
    try {
      const savedCoupons = localStorage.getItem(COUPON_STORAGE_KEY)
      if (savedCoupons) {
        const parsed = JSON.parse(savedCoupons)
        if (Array.isArray(parsed)) {
          storeRef.current.dispatch(hydrateCoupons(parsed))
        } else {
          storeRef.current.dispatch(hydrateCoupons(couponDummyData.map(c => ({ ...c }))))
        }
      } else {
        storeRef.current.dispatch(hydrateCoupons(couponDummyData.map(c => ({ ...c }))))
      }
    } catch (e) {
      console.warn('Failed to load coupons from localStorage:', e)
      storeRef.current.dispatch(hydrateCoupons(couponDummyData.map(c => ({ ...c }))))
    }

    // Banners: use localStorage if available, otherwise use default banners
    try {
      const savedBanners = localStorage.getItem(BANNER_STORAGE_KEY)
      if (savedBanners) {
        const parsed = JSON.parse(savedBanners)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set()
          const deduped = parsed.filter(b => {
            if (!b.id || seen.has(b.id)) return false
            seen.add(b.id)
            return true
          })
          storeRef.current.dispatch(hydrateBanners(deduped))
        } else {
          storeRef.current.dispatch(hydrateBanners(defaultBanners))
        }
      } else {
        storeRef.current.dispatch(hydrateBanners(defaultBanners))
      }
    } catch (e) {
      console.warn('Failed to load banners from localStorage:', e)
      storeRef.current.dispatch(hydrateBanners(defaultBanners))
    }

    // Users & Current Session
    try {
      const savedUserList = localStorage.getItem(SAVED_USERS_STORAGE_KEY)
      if (savedUserList) {
        let parsedUsers = JSON.parse(savedUserList)
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
          // Purge any temporary demo users
          parsedUsers = parsedUsers.filter(u => u.name !== 'Google Customer')
          storeRef.current.dispatch(hydrateSavedUsers(parsedUsers))
        }
      } else {
        storeRef.current.dispatch(hydrateSavedUsers(defaultUsers))
      }

      const savedCurrentUser = localStorage.getItem(USER_STORAGE_KEY)
      if (savedCurrentUser) {
        const parsedUser = JSON.parse(savedCurrentUser)
        if (parsedUser && parsedUser.id && parsedUser.name !== 'Google Customer') {
          storeRef.current.dispatch(hydrateUser(parsedUser))
        } else if (parsedUser && parsedUser.name === 'Google Customer') {
          localStorage.removeItem(USER_STORAGE_KEY)
        }
      }
    } catch (e) {
      console.warn('Failed to load user state from localStorage:', e)
    }

    // Orders
    try {
      const savedOrders = localStorage.getItem(ORDER_STORAGE_KEY)
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders)
        if (Array.isArray(parsedOrders)) {
          storeRef.current.dispatch(hydrateOrders(parsedOrders))
        } else {
          storeRef.current.dispatch(hydrateOrders(orderDummyData))
        }
      } else {
        storeRef.current.dispatch(hydrateOrders(orderDummyData))
      }
    } catch (e) {
      console.warn('Failed to load orders from localStorage:', e)
      storeRef.current.dispatch(hydrateOrders(orderDummyData))
    }

    // Cart
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        if (parsedCart && typeof parsedCart.total === 'number') {
          storeRef.current.dispatch(hydrateCart(parsedCart))
        }
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e)
    }

    // Contact & Messages
    try {
      const savedContact = localStorage.getItem(CONTACT_STORAGE_KEY)
      if (savedContact) {
        const parsed = JSON.parse(savedContact)
        if (parsed && typeof parsed === 'object') {
          storeRef.current.dispatch(hydrateContact(parsed))
        }
      } else {
        storeRef.current.dispatch(hydrateContact({ messages: defaultMessages, storeInfo: defaultStoreInfo }))
      }
    } catch (e) {
      console.warn('Failed to load contact state from localStorage:', e)
      storeRef.current.dispatch(hydrateContact({ messages: defaultMessages, storeInfo: defaultStoreInfo }))
    }

    // Wishlist
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist)
        if (Array.isArray(parsed)) {
          storeRef.current.dispatch(hydrateWishlist(parsed))
        }
      }
    } catch (e) {
      console.warn('Failed to load wishlist from localStorage:', e)
    }

    // Categories
    try {
      const savedCategories = localStorage.getItem(CATEGORY_STORAGE_KEY)
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories)
        if (Array.isArray(parsed) && parsed.length > 0) {
          storeRef.current.dispatch(hydrateCategories(parsed))
        } else {
          storeRef.current.dispatch(hydrateCategories(defaultCategories))
        }
      } else {
        storeRef.current.dispatch(hydrateCategories(defaultCategories))
      }
    } catch (e) {
      console.warn('Failed to load categories from localStorage:', e)
      storeRef.current.dispatch(hydrateCategories(defaultCategories))
    }

    // Shipping Settings
    try {
      const savedShipping = localStorage.getItem(SHIPPING_STORAGE_KEY)
      if (savedShipping) {
        const parsed = JSON.parse(savedShipping)
        if (parsed && typeof parsed === 'object') {
          storeRef.current.dispatch(hydrateShipping(parsed))
        }
      }
    } catch (e) {
      console.warn('Failed to load shipping settings from localStorage:', e)
    }

    // Cash Flow Management
    try {
      const savedCashflow = localStorage.getItem(CASHFLOW_STORAGE_KEY)
      if (savedCashflow) {
        const parsed = JSON.parse(savedCashflow)
        if (parsed && typeof parsed === 'object') {
          storeRef.current.dispatch(hydrateCashflow(parsed))
        } else {
          storeRef.current.dispatch(hydrateCashflow(defaultCashflowData))
        }
      } else {
        storeRef.current.dispatch(hydrateCashflow(defaultCashflowData))
      }
    } catch (e) {
      console.warn('Failed to load cash flow from localStorage:', e)
      storeRef.current.dispatch(hydrateCashflow(defaultCashflowData))
    }

    // Hero Banner Management
    try {
      const savedHero = localStorage.getItem(HERO_STORAGE_KEY)
      if (savedHero) {
        const parsed = JSON.parse(savedHero)
        if (parsed && typeof parsed === 'object') {
          storeRef.current.dispatch(hydrateHero(parsed))
        } else {
          storeRef.current.dispatch(hydrateHero(defaultHeroData))
        }
      } else {
        storeRef.current.dispatch(hydrateHero(defaultHeroData))
      }
    } catch (e) {
      console.warn('Failed to load hero banner from localStorage:', e)
      storeRef.current.dispatch(hydrateHero(defaultHeroData))
    }

    // API & Integration Settings
    try {
      const savedApiSettings = localStorage.getItem(API_SETTINGS_STORAGE_KEY)
      if (savedApiSettings) {
        const parsed = JSON.parse(savedApiSettings)
        if (parsed && typeof parsed === 'object') {
          storeRef.current.dispatch(hydrateApiSettings(parsed))
        } else {
          storeRef.current.dispatch(hydrateApiSettings(defaultApiSettings))
        }
      } else {
        storeRef.current.dispatch(hydrateApiSettings(defaultApiSettings))
      }
    } catch (e) {
      console.warn('Failed to load api settings from localStorage:', e)
      storeRef.current.dispatch(hydrateApiSettings(defaultApiSettings))
    }

    // ===== BroadcastChannel for product sync across tabs =====
    const channel = new BroadcastChannel(CHANNEL_NAME)

    channel.onmessage = (event) => {
      if (event.data?.type === 'PRODUCT_UPDATE' && storeRef.current) {
        isReceivingRef.current = true
        storeRef.current.dispatch(setProduct(event.data.products))
        prevProductsRef.current = event.data.products
        isReceivingRef.current = false
      }
    }

    // ===== SUBSCRIBE: persist state changes to localStorage =====
    let prevCoupons = storeRef.current.getState().coupon.coupons
    let prevBanners = storeRef.current.getState().banner.banners
    let prevHero = storeRef.current.getState().hero
    let prevUser = storeRef.current.getState().user.currentUser
    let prevSavedUsers = storeRef.current.getState().user.savedUsers
    let prevOrders = storeRef.current.getState().order.orders
    let prevCart = storeRef.current.getState().cart
    let prevContact = storeRef.current.getState().contact
    let prevWishlist = storeRef.current.getState().wishlist?.items
    let prevCategories = storeRef.current.getState().category?.categories
    let prevShipping = storeRef.current.getState().shipping
    let prevCashflow = storeRef.current.getState().cashflow
    let prevApiSettings = storeRef.current.getState().apiSettings

    const unsubscribe = storeRef.current.subscribe(() => {
      const state = storeRef.current.getState()

      const currentCoupons = state.coupon.coupons
      if (currentCoupons !== prevCoupons) {
        prevCoupons = currentCoupons
        try {
          localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(currentCoupons))
        } catch (e) { /* ignore */ }
      }

      const currentBanners = state.banner.banners
      if (currentBanners !== prevBanners) {
        prevBanners = currentBanners
        try {
          localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(currentBanners))
        } catch (e) { /* ignore */ }
      }

      const currentHero = state.hero
      if (currentHero !== prevHero) {
        prevHero = currentHero
        try {
          localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(currentHero))
        } catch (e) { /* ignore */ }
      }

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

      const currentSavedUsers = state.user.savedUsers
      if (currentSavedUsers !== prevSavedUsers) {
        prevSavedUsers = currentSavedUsers
        try {
          localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(currentSavedUsers))
        } catch (e) { /* ignore */ }
      }

      const currentOrders = state.order.orders
      if (currentOrders !== prevOrders) {
        prevOrders = currentOrders
        try {
          localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(currentOrders))
        } catch (e) { /* ignore */ }
      }

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

      const currentContact = state.contact
      if (currentContact !== prevContact) {
        prevContact = currentContact
        try {
          localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(currentContact))
        } catch (e) { /* ignore */ }
      }

      const currentWishlist = state.wishlist?.items
      if (currentWishlist !== prevWishlist) {
        prevWishlist = currentWishlist
        try {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(currentWishlist))
        } catch (e) { /* ignore */ }
      }

      const currentCategories = state.category?.categories
      if (currentCategories !== prevCategories) {
        prevCategories = currentCategories
        try {
          localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(currentCategories))
        } catch (e) { /* ignore */ }
      }

      const currentShipping = state.shipping
      if (currentShipping !== prevShipping) {
        prevShipping = currentShipping
        try {
          localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(currentShipping))
        } catch (e) { /* ignore */ }
      }

      const currentCashflow = state.cashflow
      if (currentCashflow !== prevCashflow) {
        prevCashflow = currentCashflow
        try {
          localStorage.setItem(CASHFLOW_STORAGE_KEY, JSON.stringify(currentCashflow))
        } catch (e) { /* ignore */ }
      }

      const currentApiSettings = state.apiSettings
      if (currentApiSettings !== prevApiSettings) {
        prevApiSettings = currentApiSettings
        try {
          localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(currentApiSettings))
        } catch (e) { /* ignore */ }
      }

      if (!isReceivingRef.current) {
        const currentProducts = state.product.list
        if (currentProducts !== prevProductsRef.current) {
          prevProductsRef.current = currentProducts
          channel.postMessage({ type: 'PRODUCT_UPDATE', products: currentProducts })
          try {
            localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(currentProducts))
          } catch (e) { /* ignore — may exceed quota with large base64 images */ }
        }
      }
    })

    return () => {
      unsubscribe()
      channel.close()
    }
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}