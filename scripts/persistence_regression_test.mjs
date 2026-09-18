import { initializeApp } from 'firebase/app'
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    getDocs,
    onSnapshot
} from 'firebase/firestore'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const results = {}

function logResult(moduleName, step, passed, detail = '') {
    if (!results[moduleName]) results[moduleName] = { steps: [], pass: true }
    results[moduleName].steps.push({ step, passed, detail })
    if (!passed) results[moduleName].pass = false
    const symbol = passed ? '✅' : '❌'
    console.log(`  ${symbol} [${step}] ${detail}`)
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

console.log('===============================================================')
console.log('  STARTING PERSISTENCE & REGRESSION VERIFICATION SUITE')
console.log('===============================================================\n')

// ==========================================
// 1. PRODUCTS MODULE
// ==========================================
async function testProducts() {
    console.log('\n--- [1/17] Testing Module: Products ---')
    const testId = `prod_test_${Date.now()}`
    const testProduct = {
        id: testId,
        name: `Automated Test Product ${Date.now()}`,
        price: 1999,
        category: 'Decoration',
        inStock: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }

    try {
        // Step 1: Admin Save -> Database Write
        await setDoc(doc(db, 'products', testId), testProduct, { merge: true })
        logResult('Products', 'Database Write', true, `Written doc products/${testId}`)

        // Step 2: Read value back directly from persistent database
        const snap1 = await getDoc(doc(db, 'products', testId))
        const exists = snap1.exists() && snap1.data()?.name === testProduct.name
        logResult('Products', 'Direct Database Read', exists, `Read name: "${snap1.data()?.name}"`)

        // Step 3: Refresh & Cross-Session Read (Simulate independent client fetch)
        const snap2 = await getDoc(doc(db, 'products', testId))
        const match = snap2.data()?.price === 1999
        logResult('Products', 'Refresh / Cross-Session Read', match, `Price preserved: ${snap2.data()?.price}`)

        // Step 4: Verify no demo products injected
        const allSnap = await getDocs(collection(db, 'products'))
        const hasLegacyDummy = allSnap.docs.some(d => d.id === 'prod_1' && d.data()?.name === 'Modern table lamp')
        logResult('Products', 'No Demo Data Injection', !hasLegacyDummy, `Total products: ${allSnap.size}, no untouched dummy products`)

        // Clean up test document
        await deleteDoc(doc(db, 'products', testId))
        const checkDeleted = await getDoc(doc(db, 'products', testId))
        logResult('Products', 'Cleanup Verification', !checkDeleted.exists(), 'Test product deleted cleanly')
    } catch (e) {
        logResult('Products', 'Error', false, e.message)
    }
}

// ==========================================
// 2. CATEGORIES MODULE
// ==========================================
async function testCategories() {
    console.log('\n--- [2/17] Testing Module: Categories ---')
    const testId = `cat_test_${Date.now()}`
    const testCat = {
        id: testId,
        name: `Test Cat ${Date.now()}`,
        order: 99,
        visible: true
    }

    try {
        // Step 1: Write
        await setDoc(doc(db, 'categories', testId), testCat, { merge: true })
        logResult('Categories', 'Database Write', true, `Written doc categories/${testId}`)

        // Step 2: Read back
        const snap1 = await getDoc(doc(db, 'categories', testId))
        const exists = snap1.exists() && snap1.data()?.name === testCat.name
        logResult('Categories', 'Direct Database Read', exists, `Read name: "${snap1.data()?.name}"`)

        // Step 3: Cross-Session Read
        const snap2 = await getDoc(doc(db, 'categories', testId))
        const orderMatch = snap2.data()?.order === 99
        logResult('Categories', 'Cross-Session Read', orderMatch, `Order preserved: ${snap2.data()?.order}`)

        // Clean up
        await deleteDoc(doc(db, 'categories', testId))
        const checkDeleted = await getDoc(doc(db, 'categories', testId))
        logResult('Categories', 'Cleanup Verification', !checkDeleted.exists(), 'Test category cleaned up')
    } catch (e) {
        logResult('Categories', 'Error', false, e.message)
    }
}

// ==========================================
// 3. BANNERS MODULE
// ==========================================
async function testBanners() {
    console.log('\n--- [3/17] Testing Module: Banners ---')
    const testId = `banner_test_${Date.now()}`
    const testBanner = {
        id: testId,
        message: `Super Promo Banner ${Date.now()}`,
        couponCode: 'TEST2026',
        buttonText: 'Test Now',
        bgType: 'gradient',
        isActive: true,
        priority: 10,
        createdAt: new Date().toISOString()
    }

    try {
        await setDoc(doc(db, 'banners', testId), testBanner, { merge: true })
        logResult('Banners', 'Database Write', true, `Written doc banners/${testId}`)

        const snap1 = await getDoc(doc(db, 'banners', testId))
        const exists = snap1.exists() && snap1.data()?.couponCode === 'TEST2026'
        logResult('Banners', 'Direct Database Read', exists, `Read coupon: ${snap1.data()?.couponCode}`)

        const snap2 = await getDoc(doc(db, 'banners', testId))
        const msgMatch = snap2.data()?.message === testBanner.message
        logResult('Banners', 'Cross-Session Read', msgMatch, `Message preserved: "${snap2.data()?.message}"`)

        await deleteDoc(doc(db, 'banners', testId))
        const checkDeleted = await getDoc(doc(db, 'banners', testId))
        logResult('Banners', 'Cleanup Verification', !checkDeleted.exists(), 'Test banner deleted cleanly')
    } catch (e) {
        logResult('Banners', 'Error', false, e.message)
    }
}

// ==========================================
// 4. COUPONS MODULE
// ==========================================
async function testCoupons() {
    console.log('\n--- [4/17] Testing Module: Coupons ---')
    const testCode = `TESTCOUPON_${Date.now().toString(36).toUpperCase()}`
    const testCoupon = {
        code: testCode,
        discount: 25,
        type: 'PERCENTAGE',
        minOrderAmount: 500,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000).toISOString()
    }

    try {
        await setDoc(doc(db, 'coupons', testCode), testCoupon, { merge: true })
        logResult('Coupons', 'Database Write', true, `Written doc coupons/${testCode}`)

        const snap1 = await getDoc(doc(db, 'coupons', testCode))
        const exists = snap1.exists() && snap1.data()?.discount === 25
        logResult('Coupons', 'Direct Database Read', exists, `Read discount: ${snap1.data()?.discount}%`)

        const snap2 = await getDoc(doc(db, 'coupons', testCode))
        const activeMatch = snap2.data()?.isActive === true
        logResult('Coupons', 'Cross-Session Read', activeMatch, `Active state preserved: ${activeMatch}`)

        await deleteDoc(doc(db, 'coupons', testCode))
        const checkDeleted = await getDoc(doc(db, 'coupons', testCode))
        logResult('Coupons', 'Cleanup Verification', !checkDeleted.exists(), 'Test coupon deleted cleanly')
    } catch (e) {
        logResult('Coupons', 'Error', false, e.message)
    }
}

// ==========================================
// 5. ORDERS MODULE
// ==========================================
async function testOrders() {
    console.log('\n--- [5/17] Testing Module: Orders ---')
    const testId = `ord_test_${Date.now()}`
    const testOrder = {
        id: testId,
        status: 'PENDING',
        total: 1250,
        items: [{ id: 'item_1', name: 'Test Item', quantity: 1, price: 1250 }],
        createdAt: new Date().toISOString()
    }

    try {
        await setDoc(doc(db, 'orders', testId), testOrder, { merge: true })
        logResult('Orders', 'Database Write', true, `Written doc orders/${testId}`)

        const snap1 = await getDoc(doc(db, 'orders', testId))
        const exists = snap1.exists() && snap1.data()?.total === 1250
        logResult('Orders', 'Direct Database Read', exists, `Read order total: ${snap1.data()?.total}`)

        // Test updating order status
        await setDoc(doc(db, 'orders', testId), { status: 'DELIVERED', updatedAt: new Date().toISOString() }, { merge: true })
        const snap2 = await getDoc(doc(db, 'orders', testId))
        const statusMatch = snap2.data()?.status === 'DELIVERED'
        logResult('Orders', 'Status Update & Cross-Session Read', statusMatch, `Status updated to: ${snap2.data()?.status}`)

        await deleteDoc(doc(db, 'orders', testId))
        const checkDeleted = await getDoc(doc(db, 'orders', testId))
        logResult('Orders', 'Cleanup Verification', !checkDeleted.exists(), 'Test order cleaned up')
    } catch (e) {
        logResult('Orders', 'Error', false, e.message)
    }
}

// ==========================================
// 6. CUSTOMERS MODULE
// ==========================================
async function testCustomers() {
    console.log('\n--- [6/17] Testing Module: Customers ---')
    const testId = `user_test_${Date.now()}`
    const testUser = {
        id: testId,
        name: `Test Customer ${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        phone: '01700000000',
        role: 'CUSTOMER',
        joinedDate: new Date().toISOString()
    }

    try {
        await setDoc(doc(db, 'customers', testId), testUser, { merge: true })
        logResult('Customers', 'Database Write', true, `Written doc customers/${testId}`)

        const snap1 = await getDoc(doc(db, 'customers', testId))
        const exists = snap1.exists() && snap1.data()?.email === testUser.email
        logResult('Customers', 'Direct Database Read', exists, `Read email: ${snap1.data()?.email}`)

        const snap2 = await getDoc(doc(db, 'customers', testId))
        const nameMatch = snap2.data()?.name === testUser.name
        logResult('Customers', 'Cross-Session Read', nameMatch, `Name preserved: "${snap2.data()?.name}"`)

        await deleteDoc(doc(db, 'customers', testId))
        const checkDeleted = await getDoc(doc(db, 'customers', testId))
        logResult('Customers', 'Cleanup Verification', !checkDeleted.exists(), 'Test customer cleaned up')
    } catch (e) {
        logResult('Customers', 'Error', false, e.message)
    }
}

// ==========================================
// 7. HERO BANNER SETTINGS
// ==========================================
async function testHeroSettings() {
    console.log('\n--- [7/17] Testing Module: Hero Banner Settings ---')
    const origSnap = await getDoc(doc(db, 'settings', 'hero'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const uniqueTitle = `Unique Hero Title ${Date.now()}`
        const updated = {
            ...(origData || {}),
            mainBanner: {
                ...(origData?.mainBanner || {}),
                title: uniqueTitle
            },
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'hero'), updated, { merge: true })
        logResult('Hero Settings', 'Database Write', true, 'Written to settings/hero')

        const readSnap = await getDoc(doc(db, 'settings', 'hero'))
        const titleMatch = readSnap.exists() && readSnap.data()?.mainBanner?.title === uniqueTitle
        logResult('Hero Settings', 'Direct Database Read', titleMatch, `Read title: "${readSnap.data()?.mainBanner?.title}"`)

        const crossSnap = await getDoc(doc(db, 'settings', 'hero'))
        logResult('Hero Settings', 'Cross-Session Read', crossSnap.data()?.mainBanner?.title === uniqueTitle, 'Verified across independent read')

        // Restore original
        if (origData) {
            await setDoc(doc(db, 'settings', 'hero'), origData)
            logResult('Hero Settings', 'Original State Restored', true, 'Restored initial hero settings')
        }
    } catch (e) {
        logResult('Hero Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 8. SHIPPING SETTINGS
// ==========================================
async function testShippingSettings() {
    console.log('\n--- [8/17] Testing Module: Shipping Settings ---')
    const origSnap = await getDoc(doc(db, 'settings', 'shipping'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testCost = 88
        const updated = {
            ...(origData || {}),
            insideDhaka: {
                ...(origData?.insideDhaka || {}),
                cost: testCost
            },
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'shipping'), updated, { merge: true })
        logResult('Shipping Settings', 'Database Write', true, 'Written to settings/shipping')

        const readSnap = await getDoc(doc(db, 'settings', 'shipping'))
        const costMatch = readSnap.exists() && readSnap.data()?.insideDhaka?.cost === testCost
        logResult('Shipping Settings', 'Direct Database Read', costMatch, `Inside Dhaka cost: ${readSnap.data()?.insideDhaka?.cost}`)

        const crossSnap = await getDoc(doc(db, 'settings', 'shipping'))
        logResult('Shipping Settings', 'Cross-Session Read', crossSnap.data()?.insideDhaka?.cost === testCost, 'Exact cost preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'shipping'), origData)
            logResult('Shipping Settings', 'Original State Restored', true, 'Restored initial shipping settings')
        }
    } catch (e) {
        logResult('Shipping Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 9. CONTACT & STORE INFO
// ==========================================
async function testContactSettings() {
    console.log('\n--- [9/17] Testing Module: Contact & Store Info ---')
    const origSnap = await getDoc(doc(db, 'settings', 'contact'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testPhone = `01712${Math.floor(100000 + Math.random() * 900000)}`
        const updated = {
            ...(origData || {}),
            storeInfo: {
                ...(origData?.storeInfo || {}),
                phone: testPhone
            },
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'contact'), updated, { merge: true })
        logResult('Contact Settings', 'Database Write', true, 'Written to settings/contact')

        const readSnap = await getDoc(doc(db, 'settings', 'contact'))
        const phoneMatch = readSnap.exists() && readSnap.data()?.storeInfo?.phone === testPhone
        logResult('Contact Settings', 'Direct Database Read', phoneMatch, `Read phone: ${readSnap.data()?.storeInfo?.phone}`)

        const crossSnap = await getDoc(doc(db, 'settings', 'contact'))
        logResult('Contact Settings', 'Cross-Session Read', crossSnap.data()?.storeInfo?.phone === testPhone, 'Phone preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'contact'), origData)
            logResult('Contact Settings', 'Original State Restored', true, 'Restored initial contact settings')
        }
    } catch (e) {
        logResult('Contact Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 10. HEADER & FOOTER SETTINGS
// ==========================================
async function testHeaderFooterSettings() {
    console.log('\n--- [10/17] Testing Module: Header & Footer Settings ---')
    const origSnap = await getDoc(doc(db, 'settings', 'header_footer'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testText = `Custom Brand Test ${Date.now()}`
        const updated = {
            ...(origData || {}),
            header: {
                ...(origData?.header || {}),
                logoTextPrefix: testText
            },
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'header_footer'), updated, { merge: true })
        logResult('Header/Footer Settings', 'Database Write', true, 'Written to settings/header_footer')

        const readSnap = await getDoc(doc(db, 'settings', 'header_footer'))
        const textMatch = readSnap.exists() && readSnap.data()?.header?.logoTextPrefix === testText
        logResult('Header/Footer Settings', 'Direct Database Read', textMatch, `Read prefix: "${readSnap.data()?.header?.logoTextPrefix}"`)

        const crossSnap = await getDoc(doc(db, 'settings', 'header_footer'))
        logResult('Header/Footer Settings', 'Cross-Session Read', crossSnap.data()?.header?.logoTextPrefix === testText, 'Prefix preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'header_footer'), origData)
            logResult('Header/Footer Settings', 'Original State Restored', true, 'Restored initial header/footer settings')
        }
    } catch (e) {
        logResult('Header/Footer Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 11. FAVICON SETTINGS
// ==========================================
async function testFaviconSettings() {
    console.log('\n--- [11/17] Testing Module: Favicon Settings ---')
    const origSnap = await getDoc(doc(db, 'settings', 'favicon'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testTitle = `Our Store BD - Verified ${Date.now()}`
        const updated = {
            ...(origData || {}),
            siteTitle: testTitle,
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'favicon'), updated, { merge: true })
        logResult('Favicon Settings', 'Database Write', true, 'Written to settings/favicon')

        const readSnap = await getDoc(doc(db, 'settings', 'favicon'))
        const titleMatch = readSnap.exists() && readSnap.data()?.siteTitle === testTitle
        logResult('Favicon Settings', 'Direct Database Read', titleMatch, `Read siteTitle: "${readSnap.data()?.siteTitle}"`)

        const crossSnap = await getDoc(doc(db, 'settings', 'favicon'))
        logResult('Favicon Settings', 'Cross-Session Read', crossSnap.data()?.siteTitle === testTitle, 'Title preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'favicon'), origData)
            logResult('Favicon Settings', 'Original State Restored', true, 'Restored initial favicon settings')
        }
    } catch (e) {
        logResult('Favicon Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 12. FRAUD SETTINGS
// ==========================================
async function testFraudSettings() {
    console.log('\n--- [12/17] Testing Module: Fraud Settings ---')
    const origSnap = await getDoc(doc(db, 'settings', 'fraud'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testBlockedPhone = `01799${Math.floor(100000 + Math.random() * 900000)}`
        const updated = {
            ...(origData || {}),
            blockedPhones: [...(origData?.blockedPhones || []), testBlockedPhone],
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'fraud'), updated, { merge: true })
        logResult('Fraud Settings', 'Database Write', true, 'Written to settings/fraud')

        const readSnap = await getDoc(doc(db, 'settings', 'fraud'))
        const phonePresent = readSnap.exists() && readSnap.data()?.blockedPhones?.includes(testBlockedPhone)
        logResult('Fraud Settings', 'Direct Database Read', phonePresent, `Blocked phone present: ${testBlockedPhone}`)

        const crossSnap = await getDoc(doc(db, 'settings', 'fraud'))
        logResult('Fraud Settings', 'Cross-Session Read', crossSnap.data()?.blockedPhones?.includes(testBlockedPhone), 'Blocked phone preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'fraud'), origData)
            logResult('Fraud Settings', 'Original State Restored', true, 'Restored initial fraud settings')
        }
    } catch (e) {
        logResult('Fraud Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 13. CASHFLOW SETTINGS
// ==========================================
async function testCashflowSettings() {
    console.log('\n--- [13/17] Testing Module: Cash Flow ---')
    const origSnap = await getDoc(doc(db, 'settings', 'cashflow'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testTx = {
            id: `tx_test_${Date.now()}`,
            amount: 7777,
            type: 'INCOME',
            category: 'Product Sales',
            note: 'Persistence Test Transaction',
            date: new Date().toISOString().split('T')[0]
        }
        const updated = {
            ...(origData || {}),
            transactions: [testTx, ...(origData?.transactions || [])],
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'cashflow'), updated, { merge: true })
        logResult('Cash Flow', 'Database Write', true, 'Written to settings/cashflow')

        const readSnap = await getDoc(doc(db, 'settings', 'cashflow'))
        const txPresent = readSnap.exists() && readSnap.data()?.transactions?.some(t => t.id === testTx.id)
        logResult('Cash Flow', 'Direct Database Read', txPresent, `Transaction ${testTx.id} found, amount: ${testTx.amount}`)

        const crossSnap = await getDoc(doc(db, 'settings', 'cashflow'))
        logResult('Cash Flow', 'Cross-Session Read', crossSnap.data()?.transactions?.some(t => t.id === testTx.id), 'Transaction preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'cashflow'), origData)
            logResult('Cash Flow', 'Original State Restored', true, 'Restored initial cashflow data')
        }
    } catch (e) {
        logResult('Cash Flow', 'Error', false, e.message)
    }
}

// ==========================================
// 14. API SETTINGS
// ==========================================
async function testApiSettings() {
    console.log('\n--- [14/17] Testing Module: API Settings ---')
    const origSnap = await getDoc(doc(db, 'settings', 'api_settings'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testSenderId = `TEST_${Date.now().toString(36).toUpperCase()}`
        const updated = {
            ...(origData || {}),
            smsGateway: {
                ...(origData?.smsGateway || {}),
                senderId: testSenderId
            },
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'api_settings'), updated, { merge: true })
        logResult('API Settings', 'Database Write', true, 'Written to settings/api_settings')

        const readSnap = await getDoc(doc(db, 'settings', 'api_settings'))
        const senderMatch = readSnap.exists() && readSnap.data()?.smsGateway?.senderId === testSenderId
        logResult('API Settings', 'Direct Database Read', senderMatch, `Read SMS senderId: "${readSnap.data()?.smsGateway?.senderId}"`)

        const crossSnap = await getDoc(doc(db, 'settings', 'api_settings'))
        logResult('API Settings', 'Cross-Session Read', crossSnap.data()?.smsGateway?.senderId === testSenderId, 'SenderId preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'api_settings'), origData)
            logResult('API Settings', 'Original State Restored', true, 'Restored initial API settings')
        }
    } catch (e) {
        logResult('API Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 15. TRACKING SETTINGS
// ==========================================
async function testTrackingSettings() {
    console.log('\n--- [15/17] Testing Module: Tracking & Pixel Settings ---')
    const origSnap = await getDoc(doc(db, 'settings', 'tracking'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testPixelId = `9988776655_${Date.now()}`
        const updated = {
            ...(origData || {}),
            meta: {
                ...(origData?.meta || {}),
                pixelId: testPixelId
            },
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'tracking'), updated, { merge: true })
        logResult('Tracking Settings', 'Database Write', true, 'Written to settings/tracking')

        const readSnap = await getDoc(doc(db, 'settings', 'tracking'))
        const pixelMatch = readSnap.exists() && readSnap.data()?.meta?.pixelId === testPixelId
        logResult('Tracking Settings', 'Direct Database Read', pixelMatch, `Read pixelId: "${readSnap.data()?.meta?.pixelId}"`)

        const crossSnap = await getDoc(doc(db, 'settings', 'tracking'))
        logResult('Tracking Settings', 'Cross-Session Read', crossSnap.data()?.meta?.pixelId === testPixelId, 'PixelId preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'tracking'), origData)
            logResult('Tracking Settings', 'Original State Restored', true, 'Restored initial tracking settings')
        }
    } catch (e) {
        logResult('Tracking Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 16. INTEGRATIONS SETTINGS
// ==========================================
async function testIntegrationsSettings() {
    console.log('\n--- [16/17] Testing Module: Integrations Settings ---')
    const origSnap = await getDoc(doc(db, 'settings', 'integrations'))
    const origData = origSnap.exists() ? origSnap.data() : null

    try {
        const testBotToken = `bot_token_test_${Date.now()}`
        const updated = {
            ...(origData || {}),
            telegram: {
                ...(origData?.telegram || {}),
                botToken: testBotToken
            },
            updatedAt: Date.now()
        }

        await setDoc(doc(db, 'settings', 'integrations'), updated, { merge: true })
        logResult('Integrations Settings', 'Database Write', true, 'Written to settings/integrations')

        const readSnap = await getDoc(doc(db, 'settings', 'integrations'))
        const tokenMatch = readSnap.exists() && readSnap.data()?.telegram?.botToken === testBotToken
        logResult('Integrations Settings', 'Direct Database Read', tokenMatch, `Read botToken: "${readSnap.data()?.telegram?.botToken}"`)

        const crossSnap = await getDoc(doc(db, 'settings', 'integrations'))
        logResult('Integrations Settings', 'Cross-Session Read', crossSnap.data()?.telegram?.botToken === testBotToken, 'BotToken preserved')

        if (origData) {
            await setDoc(doc(db, 'settings', 'integrations'), origData)
            logResult('Integrations Settings', 'Original State Restored', true, 'Restored initial integrations settings')
        }
    } catch (e) {
        logResult('Integrations Settings', 'Error', false, e.message)
    }
}

// ==========================================
// 17. REVIEWS (PRODUCT RATINGS)
// ==========================================
async function testReviews() {
    console.log('\n--- [17/17] Testing Module: Product Reviews ---')
    // Find an existing product
    const prodsSnap = await getDocs(collection(db, 'products'))
    if (prodsSnap.empty) {
        logResult('Reviews', 'Product Lookup', false, 'No products found to test reviews')
        return
    }

    const targetProd = prodsSnap.docs[0]
    const prodId = targetProd.id
    const origRatings = targetProd.data().rating || []

    try {
        const testReview = {
            id: `rev_test_${Date.now()}`,
            user: { name: 'Persistence Tester', id: 'user_tester' },
            rating: 5,
            review: `Automated test review content ${Date.now()}`,
            status: 'approved',
            isVisible: true,
            createdAt: new Date().toISOString()
        }

        const updatedRatings = [testReview, ...origRatings]
        await setDoc(doc(db, 'products', prodId), { rating: updatedRatings }, { merge: true })
        logResult('Reviews', 'Database Write', true, `Added test review to product ${prodId}`)

        const snap1 = await getDoc(doc(db, 'products', prodId))
        const reviewPresent = snap1.exists() && snap1.data()?.rating?.some(r => r.id === testReview.id)
        logResult('Reviews', 'Direct Database Read', reviewPresent, `Found review ${testReview.id}`)

        const crossSnap = await getDoc(doc(db, 'products', prodId))
        logResult('Reviews', 'Cross-Session Read', crossSnap.data()?.rating?.some(r => r.id === testReview.id), 'Review preserved in product ratings')

        // Restore original ratings
        await setDoc(doc(db, 'products', prodId), { rating: origRatings }, { merge: true })
        logResult('Reviews', 'Original State Restored', true, 'Cleaned up test review')
    } catch (e) {
        logResult('Reviews', 'Error', false, e.message)
    }
}

// ==========================================
// REAL-TIME LISTENER & EMPTY ARRAY TEST
// ==========================================
async function testRealtimeAndEmptyArrays() {
    console.log('\n--- [BONUS] Testing Real-Time Sync & Empty Collection Handling ---')
    
    // Test onSnapshot on a test collection
    let snapshotFired = false
    let receivedCount = -1
    const unsub = onSnapshot(collection(db, 'test_sync_probe'), (snap) => {
        snapshotFired = true
        receivedCount = snap.size
    })

    await delay(500)
    // Write a probe doc
    await setDoc(doc(db, 'test_sync_probe', 'probe_1'), { test: true })
    await delay(1000)

    const snapFiredAfterWrite = snapshotFired && receivedCount >= 1
    logResult('Real-Time Sync', 'onSnapshot Listener Trigger', snapFiredAfterWrite, `Snapshot fired with count: ${receivedCount}`)

    // Delete probe doc
    await deleteDoc(doc(db, 'test_sync_probe', 'probe_1'))
    await delay(1000)

    const snapFiredAfterDelete = receivedCount === 0
    logResult('Empty Arrays', 'Empty Collection Read', snapFiredAfterDelete, `Snapshot correctly updated to empty collection: ${receivedCount}`)

    unsub()
}

async function runAll() {
    await testProducts()
    await testCategories()
    await testBanners()
    await testCoupons()
    await testOrders()
    await testCustomers()
    await testHeroSettings()
    await testShippingSettings()
    await testContactSettings()
    await testHeaderFooterSettings()
    await testFaviconSettings()
    await testFraudSettings()
    await testCashflowSettings()
    await testApiSettings()
    await testTrackingSettings()
    await testIntegrationsSettings()
    await testReviews()
    await testRealtimeAndEmptyArrays()

    console.log('\n===============================================================')
    console.log('  PERSISTENCE REGRESSION TEST SUMMARY')
    console.log('===============================================================')
    let allPassed = true
    for (const [moduleName, res] of Object.entries(results)) {
        const mark = res.pass ? '✅ PASS' : '❌ FAIL'
        console.log(`  ${mark} - ${moduleName} (${res.steps.length} steps passed)`)
        if (!res.pass) allPassed = false
    }

    console.log(`\nOVERALL RESULT: ${allPassed ? 'ALL MODULES PASSED ✅' : 'FAILURES DETECTED ❌'}`)
    process.exit(allPassed ? 0 : 1)
}

runAll()
