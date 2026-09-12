'use client'

/**
 * Universal Client Tracker for gocart
 * Dispatches standard e-commerce events to Meta Pixel, Meta CAPI, Google Ads, GA4, and GTM.
 * Built-in event deduplication, parameter formatting, error safety, and consent verification.
 */

// Storage key to prevent duplicate Purchase conversion firings on page reload
const TRACKED_PURCHASES_KEY = 'gocart_tracked_purchases'

/**
 * Helper to get tracking state from window or localStorage
 */
function getTrackingConfig() {
    if (typeof window === 'undefined') return null

    // Try Redux state if attached to window by TrackingManager
    if (window.__GOCART_TRACKING_CONFIG__) {
        return window.__GOCART_TRACKING_CONFIG__
    }

    // Fallback to localStorage
    try {
        const saved = localStorage.getItem('gocart_tracking_settings')
        if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }

    return null
}

/**
 * Check if a specific event is enabled in configuration
 */
function isEventEnabled(eventName, config) {
    if (!config) return true
    const cfg = config.eventsConfig || {}
    const map = {
        'PageView': 'pageView',
        'ViewContent': 'viewContent',
        'Search': 'search',
        'AddToCart': 'addToCart',
        'RemoveFromCart': 'removeFromCart',
        'ViewCart': 'viewCart',
        'InitiateCheckout': 'initiateCheckout',
        'AddPaymentInfo': 'addPaymentInfo',
        'AddShippingInfo': 'addShippingInfo',
        'Purchase': 'purchase',
        'Lead': 'lead',
        'SignUp': 'signUp',
        'Login': 'login',
        'Contact': 'contact',
        'Wishlist': 'wishlist',
        'Refund': 'refund',
    }
    const key = map[eventName]
    if (key && cfg[key] === false) {
        return false
    }
    return true
}

/**
 * Check if user has consented to tracking
 */
function hasUserConsent(config) {
    if (!config?.consent?.enabled) return true
    if (typeof window === 'undefined') return true
    const consent = localStorage.getItem('gocart_cookie_consent')
    if (consent === 'denied') return false
    if (consent === 'granted') return true
    return Boolean(config.consent.defaultGranted)
}

/**
 * Log to console when Debug Mode is active
 */
function debugLog(platform, eventName, payload, eventId) {
    const config = getTrackingConfig()
    if (config?.debug?.debugMode) {
        const styles = {
            Meta: 'background: #1877F2; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            GoogleAds: 'background: #EA4335; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            GA4: 'background: #F9AB00; color: #111; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            GTM: 'background: #246FDB; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            CAPI: 'background: #008060; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
        }
        console.log(
            `%c${platform}%c ${eventName} (ID: ${eventId || 'auto'})`,
            styles[platform] || 'background: #333; color: white;',
            'color: #059669; font-weight: 600;',
            payload
        )
    }
}

/**
 * Send event to Meta Conversions API via server-side endpoint
 */
async function sendToCAPI(eventName, customData, userData = {}, eventId) {
    const config = getTrackingConfig()
    if (!config?.meta?.capiEnabled || !config?.meta?.pixelId) return

    try {
        const payload = {
            action: 'DISPATCH_EVENT',
            eventName,
            eventId,
            eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
            customData,
            userData,
            testEventCode: config.debug?.testEventMode ? (config.meta.testEventCode || 'TEST_GOCART') : (config.meta.testEventCode || ''),
        }

        debugLog('CAPI', eventName, payload, eventId)

        fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(err => console.warn('[CAPI] Client fetch error:', err))
    } catch (e) {
        console.warn('[CAPI] Dispatch error:', e)
    }
}

/**
 * Record event in Redux logs for Admin Dashboard
 */
function recordAdminLog(eventName, platforms, eventId, value = 0, details = null, orderId = null) {
    if (typeof window !== 'undefined' && window.__GOCART_DISPATCH_TRACKING_LOG__) {
        try {
            window.__GOCART_DISPATCH_TRACKING_LOG__({
                eventName,
                platforms,
                eventId,
                orderId,
                value,
                currency: 'BDT',
                details,
                timestamp: new Date().toISOString(),
                source: 'BROWSER',
                status: 'SUCCESS',
            })
        } catch { /* ignore */ }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Universal Dispatcher
// ─────────────────────────────────────────────────────────────────────────────

export function trackEvent({
    eventName,             // Meta event name: 'Purchase', 'AddToCart', etc.
    ga4EventName,          // GA4 event name: 'purchase', 'add_to_cart', etc.
    googleAdsAction,       // 'purchase' | 'add_to_cart' | 'begin_checkout'
    customData = {},       // value, currency, contents, content_name, etc.
    userData = {},         // email, phone, name, city
    eventId = null,        // shared deduplication ID
    orderId = null,
}) {
    if (typeof window === 'undefined') return

    const config = getTrackingConfig()
    if (!isEventEnabled(eventName, config)) return
    if (!hasUserConsent(config)) return

    const finalEventId = eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const platformsDispatched = []

    // ── 1. Meta Pixel ─────────────────────────────────────────────────────────
    if (config?.meta?.enabled && config?.meta?.pixelId && typeof window.fbq === 'function') {
        try {
            const metaPayload = {
                currency: customData.currency || 'BDT',
                value: customData.value || 0,
                content_type: customData.content_type || 'product',
                ...(customData.contents ? { contents: customData.contents } : {}),
                ...(customData.content_name ? { content_name: customData.content_name } : {}),
                ...(customData.content_category ? { content_category: customData.content_category } : {}),
                ...(customData.content_ids ? { content_ids: customData.content_ids } : {}),
                ...(customData.num_items ? { num_items: customData.num_items } : {}),
                ...(customData.search_string ? { search_string: customData.search_string } : {}),
                ...(orderId ? { order_id: String(orderId) } : {}),
            }

            // Deduplication: pass exact eventID to fbq
            window.fbq('track', eventName, metaPayload, { eventID: finalEventId })
            debugLog('Meta', eventName, metaPayload, finalEventId)
            platformsDispatched.push('Meta Pixel')
        } catch (e) {
            console.warn('[Tracking:Meta] Error:', e)
        }
    }

    // ── 2. Meta Conversions API (CAPI) ────────────────────────────────────────
    if (config?.meta?.capiEnabled) {
        sendToCAPI(eventName, customData, userData, finalEventId)
        platformsDispatched.push('Meta CAPI')
    }

    // ── 3. Google Ads Conversion Tracking ─────────────────────────────────────
    if (config?.googleAds?.enabled && config?.googleAds?.conversionId && typeof window.gtag === 'function') {
        try {
            const adsCfg = config.googleAds
            let label = null
            if (googleAdsAction === 'purchase' && adsCfg.purchaseLabel) {
                label = adsCfg.purchaseLabel
            } else if (googleAdsAction === 'add_to_cart' && adsCfg.addToCartLabel) {
                label = adsCfg.addToCartLabel
            } else if (googleAdsAction === 'begin_checkout' && adsCfg.beginCheckoutLabel) {
                label = adsCfg.beginCheckoutLabel
            }

            if (label) {
                const sendTo = label.includes('/') ? label : `${adsCfg.conversionId}/${label}`
                const adsPayload = {
                    send_to: sendTo,
                    value: customData.value || 0,
                    currency: customData.currency || 'BDT',
                    ...(orderId ? { transaction_id: String(orderId) } : {}),
                }

                // Enhanced Conversions: attach user_data if available
                if (adsCfg.enhancedConversions && (userData.email || userData.phone)) {
                    window.gtag('set', 'user_data', {
                        ...(userData.email ? { email: userData.email } : {}),
                        ...(userData.phone ? { phone_number: userData.phone } : {}),
                        ...(userData.name ? { address: { first_name: userData.name.split(' ')[0] } } : {}),
                    })
                }

                window.gtag('event', 'conversion', adsPayload)
                debugLog('GoogleAds', googleAdsAction, adsPayload, finalEventId)
                platformsDispatched.push('Google Ads')
            }
        } catch (e) {
            console.warn('[Tracking:GoogleAds] Error:', e)
        }
    }

    // ── 4. Google Analytics 4 (GA4) ───────────────────────────────────────────
    if (config?.ga4?.enabled && config?.ga4?.measurementId && typeof window.gtag === 'function') {
        try {
            const finalGA4Event = ga4EventName || eventName.toLowerCase()
            const ga4Payload = {
                currency: customData.currency || 'BDT',
                value: customData.value || 0,
                ...(orderId ? { transaction_id: String(orderId) } : {}),
                ...(customData.items ? { items: customData.items } : {}),
                ...(customData.coupon ? { coupon: customData.coupon } : {}),
                ...(customData.shipping ? { shipping: customData.shipping } : {}),
                ...(customData.search_term ? { search_term: customData.search_term } : {}),
            }

            window.gtag('event', finalGA4Event, ga4Payload)
            debugLog('GA4', finalGA4Event, ga4Payload, finalEventId)
            platformsDispatched.push('GA4')
        } catch (e) {
            console.warn('[Tracking:GA4] Error:', e)
        }
    }

    // ── 5. Google Tag Manager (dataLayer) ─────────────────────────────────────
    if (config?.gtm?.enabled && typeof window.dataLayer !== 'undefined') {
        try {
            const gtmPayload = {
                event: ga4EventName || eventName,
                ecommerce: {
                    currency: customData.currency || 'BDT',
                    value: customData.value || 0,
                    ...(orderId ? { transaction_id: String(orderId) } : {}),
                    ...(customData.items ? { items: customData.items } : {}),
                },
                event_id: finalEventId,
            }
            window.dataLayer.push({ ecommerce: null }) // Clear previous ecommerce object per GTM best practice
            window.dataLayer.push(gtmPayload)
            debugLog('GTM', eventName, gtmPayload, finalEventId)
            platformsDispatched.push('GTM')
        } catch (e) {
            console.warn('[Tracking:GTM] Error:', e)
        }
    }

    // ── 6. Record for Admin Live Dashboard ────────────────────────────────────
    if (platformsDispatched.length > 0) {
        recordAdminLog(eventName, platformsDispatched, finalEventId, customData.value || 0, customData, orderId)
    }

    return finalEventId
}

// ─────────────────────────────────────────────────────────────────────────────
// 17 Standard E-commerce Event Methods
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. PageView
 */
export function trackPageView(pageUrl) {
    return trackEvent({
        eventName: 'PageView',
        ga4EventName: 'page_view',
        customData: { page_location: pageUrl || window.location.href },
    })
}

/**
 * 2. ViewContent / view_item
 */
export function trackViewContent(product) {
    if (!product) return
    const price = Number(product.offerPrice || product.price || 0)
    const prodId = String(product.id || product._id || '')
    const name = product.name || ''
    const category = product.category || 'General'

    return trackEvent({
        eventName: 'ViewContent',
        ga4EventName: 'view_item',
        customData: {
            content_name: name,
            content_category: category,
            content_ids: [prodId],
            content_type: 'product',
            value: price,
            currency: 'BDT',
            contents: [{ id: prodId, quantity: 1, item_price: price }],
            items: [{ item_id: prodId, item_name: name, item_category: category, price, quantity: 1 }],
        },
    })
}

/**
 * 3. Search
 */
export function trackSearch(searchQuery, resultsCount = 0) {
    if (!searchQuery) return
    return trackEvent({
        eventName: 'Search',
        ga4EventName: 'search',
        customData: {
            search_string: searchQuery,
            search_term: searchQuery,
            num_items: resultsCount,
        },
    })
}

/**
 * 4. AddToCart
 */
export function trackAddToCart(product, quantity = 1, selectedColor = null, selectedSize = null) {
    if (!product) return
    const price = Number(product.offerPrice || product.price || 0)
    const prodId = String(product.id || product._id || '')
    const name = product.name || ''
    const category = product.category || 'General'
    const totalVal = price * quantity

    return trackEvent({
        eventName: 'AddToCart',
        ga4EventName: 'add_to_cart',
        googleAdsAction: 'add_to_cart',
        customData: {
            content_name: name,
            content_category: category,
            content_ids: [prodId],
            content_type: 'product',
            value: totalVal,
            currency: 'BDT',
            contents: [{ id: prodId, quantity, item_price: price }],
            items: [{
                item_id: prodId,
                item_name: name,
                item_category: category,
                item_variant: selectedColor || selectedSize ? `${selectedColor || ''} ${selectedSize || ''}`.trim() : undefined,
                price,
                quantity,
            }],
        },
    })
}

/**
 * 5. RemoveFromCart
 */
export function trackRemoveFromCart(product, quantity = 1) {
    if (!product) return
    const price = Number(product.offerPrice || product.price || 0)
    const prodId = String(product.id || product._id || '')

    return trackEvent({
        eventName: 'RemoveFromCart',
        ga4EventName: 'remove_from_cart',
        customData: {
            content_ids: [prodId],
            value: price * quantity,
            currency: 'BDT',
            contents: [{ id: prodId, quantity, item_price: price }],
            items: [{ item_id: prodId, item_name: product.name, price, quantity }],
        },
    })
}

/**
 * 6. ViewCart
 */
export function trackViewCart(cartItems = [], totalPrice = 0) {
    const items = (cartItems || []).map(p => ({
        item_id: String(p.id || ''),
        item_name: p.name || '',
        price: Number(p.effectivePrice || p.price || 0),
        quantity: p.quantity || 1,
    }))

    return trackEvent({
        eventName: 'ViewCart',
        ga4EventName: 'view_cart',
        customData: {
            value: totalPrice,
            currency: 'BDT',
            num_items: cartItems.length,
            contents: items.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
            items,
        },
    })
}

/**
 * 7. InitiateCheckout / BeginCheckout
 */
export function trackInitiateCheckout(items = [], totalPrice = 0) {
    const formattedItems = (items || []).map(p => ({
        item_id: String(p.id || ''),
        item_name: p.name || '',
        price: Number(p.effectivePrice || p.price || 0),
        quantity: p.quantity || 1,
    }))

    return trackEvent({
        eventName: 'InitiateCheckout',
        ga4EventName: 'begin_checkout',
        googleAdsAction: 'begin_checkout',
        customData: {
            content_ids: formattedItems.map(i => i.item_id),
            content_type: 'product',
            value: totalPrice,
            currency: 'BDT',
            num_items: formattedItems.length,
            contents: formattedItems.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
            items: formattedItems,
        },
    })
}

/**
 * 8. AddShippingInfo
 */
export function trackAddShippingInfo(shippingTier, shippingCost = 0, totalValue = 0) {
    return trackEvent({
        eventName: 'AddShippingInfo',
        ga4EventName: 'add_shipping_info',
        customData: {
            shipping_tier: shippingTier,
            shipping: shippingCost,
            value: totalValue,
            currency: 'BDT',
        },
    })
}

/**
 * 9. AddPaymentInfo
 */
export function trackAddPaymentInfo(paymentMethod, totalValue = 0) {
    return trackEvent({
        eventName: 'AddPaymentInfo',
        ga4EventName: 'add_payment_info',
        customData: {
            payment_type: paymentMethod,
            value: totalValue,
            currency: 'BDT',
        },
    })
}

/**
 * 10. Purchase (with Deduplication & Anti-Reload Protection)
 */
export function trackPurchase(order) {
    if (!order || !order.id) return null

    // Check if this order was ALREADY tracked to prevent reload/duplicate counts
    try {
        const tracked = JSON.parse(localStorage.getItem(TRACKED_PURCHASES_KEY) || '[]')
        if (tracked.includes(String(order.id))) {
            console.log(`[Tracking] Purchase for order ${order.id} already tracked. Skipping duplicate.`)
            return null
        }
        // Save to tracked list
        tracked.push(String(order.id))
        localStorage.setItem(TRACKED_PURCHASES_KEY, JSON.stringify(tracked.slice(-50)))
    } catch { /* ignore */ }

    const orderItems = (order.orderItems || []).map(item => ({
        item_id: String(item.productId || item.id || ''),
        item_name: item.name || 'Product',
        price: Number(item.price || 0),
        quantity: item.quantity || 1,
    }))

    const totalVal = Number(order.total || 0)
    const eventId = `order_${order.id}` // Shared between Browser & Server CAPI!

    return trackEvent({
        eventName: 'Purchase',
        ga4EventName: 'purchase',
        googleAdsAction: 'purchase',
        eventId,
        orderId: order.id,
        customData: {
            value: totalVal,
            currency: 'BDT',
            order_id: String(order.id),
            num_items: orderItems.length,
            coupon: order.coupon?.code || undefined,
            shipping: order.shippingCost || 0,
            contents: orderItems.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
            items: orderItems,
        },
        userData: {
            email: order.user?.email || undefined,
            phone: order.address?.phone || order.user?.phone || undefined,
            name: order.address?.name || order.user?.name || undefined,
            city: order.address?.city || undefined,
        },
    })
}

/**
 * 11. Lead
 */
export function trackLead(leadData = {}) {
    return trackEvent({
        eventName: 'Lead',
        ga4EventName: 'generate_lead',
        customData: {
            content_name: leadData.category || 'General Inquiry',
            value: leadData.value || 0,
            currency: 'BDT',
        },
        userData: {
            email: leadData.email,
            phone: leadData.phone,
            name: leadData.name,
        },
    })
}

/**
 * 12. SignUp
 */
export function trackSignUp(userData = {}) {
    return trackEvent({
        eventName: 'CompleteRegistration',
        ga4EventName: 'sign_up',
        customData: {
            method: userData.method || 'Phone/Email',
        },
        userData: {
            email: userData.email,
            phone: userData.phone,
            name: userData.name,
        },
    })
}

/**
 * 13. Login
 */
export function trackLogin(userData = {}) {
    return trackEvent({
        eventName: 'Login',
        ga4EventName: 'login',
        customData: {
            method: userData.method || 'Phone/Password',
        },
        userData: {
            email: userData.email,
            phone: userData.phone,
        },
    })
}

/**
 * 14. Contact
 */
export function trackContact(contactData = {}) {
    return trackEvent({
        eventName: 'Contact',
        ga4EventName: 'contact',
        customData: {
            contact_channel: contactData.channel || 'Website Form',
        },
        userData: {
            email: contactData.email,
            phone: contactData.phone,
            name: contactData.name,
        },
    })
}

/**
 * 15. Wishlist
 */
export function trackWishlist(product) {
    if (!product) return
    const price = Number(product.offerPrice || product.price || 0)
    const prodId = String(product.id || product._id || '')

    return trackEvent({
        eventName: 'AddToWishlist',
        ga4EventName: 'add_to_wishlist',
        customData: {
            content_name: product.name || '',
            content_ids: [prodId],
            value: price,
            currency: 'BDT',
        },
    })
}

/**
 * 16. Refund
 */
export function trackRefund(order) {
    if (!order) return
    return trackEvent({
        eventName: 'Refund',
        ga4EventName: 'refund',
        orderId: order.id,
        customData: {
            order_id: String(order.id),
            value: Number(order.total || 0),
            currency: 'BDT',
        },
    })
}
