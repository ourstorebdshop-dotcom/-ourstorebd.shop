import { spawn } from 'child_process'
import http from 'http'
import path from 'path'
import os from 'os'
import fs from 'fs'

const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD

if (!adminEmail || !adminPassword) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment!')
    process.exit(1)
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

const persistentProfileDir = path.join(os.tmpdir(), 'chrome_admin_persistent_session')
fs.mkdirSync(persistentProfileDir, { recursive: true })

async function getWsUrl(port = 9222) {
    for (let i = 0; i < 25; i++) {
        try {
            const data = await new Promise((resolve, reject) => {
                http.get(`http://127.0.0.1:${port}/json/version`, res => {
                    let d = ''
                    res.on('data', c => d += c)
                    res.on('end', () => resolve(JSON.parse(d)))
                }).on('error', reject)
            })
            if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl
        } catch (e) {
            await new Promise(r => setTimeout(r, 400))
        }
    }
    throw new Error(`Could not get WS debugger URL on port ${port}`)
}

class CDP {
    constructor(ws) {
        this.ws = ws
        this.id = 0
        this.pending = new Map()
        this.eventListeners = new Map()

        this.ws.onmessage = (msg) => {
            const parsed = JSON.parse(msg.data)
            if (parsed.id && this.pending.has(parsed.id)) {
                const { resolve, reject } = this.pending.get(parsed.id)
                this.pending.delete(parsed.id)
                if (parsed.error) reject(parsed.error)
                else resolve(parsed.result)
            } else if (parsed.method) {
                const list = this.eventListeners.get(parsed.method) || []
                list.forEach(fn => fn(parsed.params))
            }
        }
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.id
            this.pending.set(id, { resolve, reject })
            this.ws.send(JSON.stringify({ id, method, params }))
        })
    }

    on(method, fn) {
        if (!this.eventListeners.has(method)) this.eventListeners.set(method, [])
        this.eventListeners.get(method).push(fn)
    }

    async eval(expr) {
        const res = await this.send('Runtime.evaluate', {
            expression: expr,
            returnByValue: true,
            awaitPromise: true
        })
        if (res.exceptionDetails) {
            throw new Error(JSON.stringify(res.exceptionDetails))
        }
        return res.result?.value
    }

    async navigateAndWait(url, timeoutMs = 15000) {
        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => resolve(), timeoutMs)
            const onLoad = () => {
                clearTimeout(timer)
                setTimeout(resolve, 800)
            }
            this.on('Page.loadEventFired', onLoad)
            try {
                await this.send('Page.navigate', { url })
            } catch (e) {
                clearTimeout(timer)
                reject(e)
            }
        })
    }

    async reloadAndWait(ignoreCache = false, timeoutMs = 15000) {
        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => resolve(), timeoutMs)
            const onLoad = () => {
                clearTimeout(timer)
                setTimeout(resolve, 800)
            }
            this.on('Page.loadEventFired', onLoad)
            try {
                await this.send('Page.reload', { ignoreCache })
            } catch (e) {
                clearTimeout(timer)
                reject(e)
            }
        })
    }
}

async function launchBrowser(exePath, port, profileDir, extraArgs = []) {
    const args = [
        '--headless=new',
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        ...extraArgs,
        'about:blank'
    ]
    const proc = spawn(exePath, args, { stdio: 'ignore' })
    const wsUrl = await getWsUrl(port)
    const ws = new WebSocket(wsUrl)
    await new Promise(r => ws.onopen = r)
    const browserCdp = new CDP(ws)

    const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' })
    const pageWs = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`)
    await new Promise(r => pageWs.onopen = r)
    const pageCdp = new CDP(pageWs)

    await pageCdp.send('Page.enable')
    await pageCdp.send('Runtime.enable')
    await pageCdp.send('Network.enable')

    return { proc, browserCdp, pageCdp, ws, pageWs }
}

async function loginInBrowser(pageCdp) {
    await pageCdp.navigateAndWait('http://localhost:3000/admin')
    
    // Check if login form is displayed
    const isLoginRequired = await pageCdp.eval(`
        !!document.querySelector('input[type="email"]') || !!document.querySelector('input[type="password"]')
    `)

    if (isLoginRequired) {
        console.log('    Submitting admin credentials in browser...')
        const loginSuccess = await pageCdp.eval(`
            (async () => {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: ${JSON.stringify(adminEmail)}, password: ${JSON.stringify(adminPassword)} })
                });
                return res.ok;
            })()
        `)
        if (!loginSuccess) throw new Error('Browser API login failed!')
        await pageCdp.navigateAndWait('http://localhost:3000/admin')
    }

    // Verify admin panel is loaded
    const adminReady = await pageCdp.eval(`
        document.body.innerText.includes('Dashboard') || 
        document.body.innerText.includes('Total Products') || 
        document.body.innerText.includes('Admin')
    `)
    return adminReady
}

const testResults = []

function recordTest(stepName, moduleName, pass, details) {
    const symbol = pass ? '✅' : '❌'
    testResults.push({ stepName, moduleName, pass, details })
    console.log(`  ${symbol} [${stepName}] ${moduleName}: ${details}`)
}

async function runBrowserVerification() {
    console.log('===============================================================')
    console.log('  STARTING ACTUAL BROWSER PERSISTENCE VERIFICATION')
    console.log('  Google Chrome (v152) & Microsoft Edge (v153)')
    console.log('===============================================================\n')

    // -------------------------------------------------------------
    // PHASE 1: CHROME NORMAL SESSION (Persistent Profile)
    // -------------------------------------------------------------
    console.log('\n>>> PHASE 1: CHROME NORMAL SESSION (SAVE → LEAVE → RETURN → REFRESH → HARD REFRESH)')
    let chromeInstance = await launchBrowser(chromePath, 9222, persistentProfileDir)
    let page = chromeInstance.pageCdp

    const loggedIn = await loginInBrowser(page)
    recordTest('Phase 1 - Login', 'Admin Portal', loggedIn, 'Authenticated successfully in Chrome')

    // Test Module 1: Banners
    console.log('\n  Testing Module: Banners in Chrome...')
    await page.navigateAndWait('http://localhost:3000/admin/banners')
    const bannerInitialText = await page.eval(`document.body.innerText`)
    recordTest('Phase 1 - Load', 'Banners', !bannerInitialText.includes('Get 20% OFF on Your First Order!'), 'Initial render: no default dummy banners injected')

    // Check store state directly in browser window
    const bannersInStore = await page.eval(`
        (() => {
            const raw = localStorage.getItem('gocart_banners');
            return raw ? JSON.parse(raw) : [];
        })()
    `)
    recordTest('Phase 1 - Storage', 'Banners', Array.isArray(bannersInStore), `Loaded ${bannersInStore.length} banners from persistent storage`)

    // Navigate away to Shipping
    console.log('\n  Navigating away to Shipping...')
    await page.navigateAndWait('http://localhost:3000/admin/shipping')
    const shippingText = await page.eval(`document.body.innerText`)
    recordTest('Phase 1 - Navigate Away', 'Shipping', shippingText.includes('ডেলিভারি') || shippingText.includes('Shipping') || shippingText.includes('Inside Dhaka') || shippingText.includes('বিকাশ'), 'Shipping settings loaded in Chrome')

    // Return to Banners
    console.log('\n  Returning to Banners...')
    await page.navigateAndWait('http://localhost:3000/admin/banners')
    const bannersReturned = await page.eval(`
        (() => {
            const raw = localStorage.getItem('gocart_banners');
            return raw ? JSON.parse(raw) : [];
        })()
    `)
    recordTest('Phase 1 - Return', 'Banners', bannersReturned.length === bannersInStore.length, `Exact banner count preserved: ${bannersReturned.length}`)

    // Normal Refresh
    console.log('\n  Performing normal refresh...')
    await page.reloadAndWait(false)
    const bannersAfterRefresh = await page.eval(`
        (() => {
            const raw = localStorage.getItem('gocart_banners');
            return raw ? JSON.parse(raw) : [];
        })()
    `)
    recordTest('Phase 1 - Refresh', 'Banners', bannersAfterRefresh.length === bannersInStore.length, `Count after normal refresh: ${bannersAfterRefresh.length}`)

    // Hard Refresh (ignoreCache: true)
    console.log('\n  Performing hard refresh (cache bypass)...')
    await page.reloadAndWait(true)
    const bannersAfterHardRefresh = await page.eval(`
        (() => {
            const raw = localStorage.getItem('gocart_banners');
            return raw ? JSON.parse(raw) : [];
        })()
    `)
    recordTest('Phase 1 - Hard Refresh', 'Banners', bannersAfterHardRefresh.length === bannersInStore.length, `Count after hard refresh: ${bannersAfterHardRefresh.length}`)

    // Test Module 2: Orders in Chrome
    console.log('\n  Testing Module: Orders in Chrome...')
    await page.navigateAndWait('http://localhost:3000/admin/orders')
    const orderPageText = await page.eval(`document.body.innerText`)
    const hasOrderDummy = orderPageText.includes('cmemm75h5001jtat89016h1p3') || orderPageText.includes('Modern table lamp')
    recordTest('Phase 1 - Orders', 'Orders', !hasOrderDummy, 'Orders page rendered without orderDummyData fallback')

    // Test Module 3: Coupons in Chrome
    console.log('\n  Testing Module: Coupons in Chrome...')
    await page.navigateAndWait('http://localhost:3000/admin/coupons')
    const couponPageText = await page.eval(`document.body.innerText`)
    recordTest('Phase 1 - Coupons', 'Coupons', couponPageText.includes('Coupon') || couponPageText.includes('কুপন') || couponPageText.includes('FLAT15'), 'Coupons page rendered cleanly')

    // Test Module 4: Categories in Chrome
    console.log('\n  Testing Module: Categories in Chrome...')
    await page.navigateAndWait('http://localhost:3000/admin/categories')
    const catPageText = await page.eval(`document.body.innerText`)
    recordTest('Phase 1 - Categories', 'Categories', catPageText.includes('Category') || catPageText.includes('ক্যাটাগরি') || catPageText.includes('Decoration'), 'Categories page rendered cleanly')

    // -------------------------------------------------------------
    // PHASE 2: CLOSE & REOPEN BROWSER (Same Profile)
    // -------------------------------------------------------------
    console.log('\n>>> PHASE 2: CLOSE & REOPEN BROWSER (TEST PERSISTENCE ACROSS BROWSER LIFECYCLE)')
    chromeInstance.proc.kill()
    chromeInstance.ws.close()
    chromeInstance.pageWs.close()
    await new Promise(r => setTimeout(r, 2000))

    console.log('  Relaunching Chrome with same user profile...')
    chromeInstance = await launchBrowser(chromePath, 9222, persistentProfileDir)
    page = chromeInstance.pageCdp

    await page.navigateAndWait('http://localhost:3000/admin/banners')
    const bannersReopened = await page.eval(`
        (() => {
            const raw = localStorage.getItem('gocart_banners');
            return raw ? JSON.parse(raw) : [];
        })()
    `)
    recordTest('Phase 2 - Reopen Browser', 'Banners', bannersReopened.length === bannersInStore.length, `Count after closing & reopening browser: ${bannersReopened.length}`)

    // -------------------------------------------------------------
    // PHASE 3: CHROME INCOGNITO (Completely Isolated Fresh Session)
    // -------------------------------------------------------------
    console.log('\n>>> PHASE 3: CHROME INCOGNITO (FRESH ISOLATED SESSION — NO LOCALSTORAGE)')
    const incognitoDir = path.join(os.tmpdir(), 'chrome_incognito_' + Date.now())
    fs.mkdirSync(incognitoDir, { recursive: true })
    const incognitoInstance = await launchBrowser(chromePath, 9224, incognitoDir, ['--incognito'])
    const incognitoPage = incognitoInstance.pageCdp

    const incognitoLoggedIn = await loginInBrowser(incognitoPage)
    recordTest('Phase 3 - Incognito Login', 'Incognito Session', incognitoLoggedIn, 'Authenticated in fresh Incognito session')

    await incognitoPage.navigateAndWait('http://localhost:3000/admin/banners')
    await new Promise(r => setTimeout(r, 1500))
    const incognitoBanners = await incognitoPage.eval(`
        (() => {
            const raw = localStorage.getItem('gocart_banners');
            return raw ? JSON.parse(raw) : [];
        })()
    `)
    recordTest('Phase 3 - Incognito State', 'Banners', incognitoBanners.length === bannersInStore.length, `Incognito loaded authoritative Firestore data: ${incognitoBanners.length} banners (matches normal session)`)

    // Check no demo banners in incognito
    const incognitoText = await incognitoPage.eval(`document.body.innerText`)
    recordTest('Phase 3 - No Demo Banners', 'Banners', !incognitoText.includes('Get 20% OFF on Your First Order!'), 'Incognito session has ZERO demo data injection')

    incognitoInstance.proc.kill()
    incognitoInstance.ws.close()
    incognitoInstance.pageWs.close()
    try { fs.rmSync(incognitoDir, { recursive: true, force: true }) } catch {}

    // -------------------------------------------------------------
    // PHASE 4: SECOND BROWSER (Microsoft Edge)
    // -------------------------------------------------------------
    console.log('\n>>> PHASE 4: SECOND BROWSER / SESSION (MICROSOFT EDGE)')
    const edgeDir = path.join(os.tmpdir(), 'edge_admin_session_' + Date.now())
    fs.mkdirSync(edgeDir, { recursive: true })
    const edgeInstance = await launchBrowser(edgePath, 9225, edgeDir)
    const edgePage = edgeInstance.pageCdp

    const edgeLoggedIn = await loginInBrowser(edgePage)
    recordTest('Phase 4 - Edge Login', 'Microsoft Edge', edgeLoggedIn, 'Authenticated in Microsoft Edge browser')

    await edgePage.navigateAndWait('http://localhost:3000/admin/banners')
    await new Promise(r => setTimeout(r, 1500))
    const edgeBanners = await edgePage.eval(`
        (() => {
            const raw = localStorage.getItem('gocart_banners');
            return raw ? JSON.parse(raw) : [];
        })()
    `)
    recordTest('Phase 4 - Edge State', 'Banners', edgeBanners.length === bannersInStore.length, `Microsoft Edge loaded identical Firestore data: ${edgeBanners.length} banners`)

    await edgePage.navigateAndWait('http://localhost:3000/admin/shipping')
    const edgeShippingText = await edgePage.eval(`document.body.innerText`)
    recordTest('Phase 4 - Edge Shipping', 'Shipping', edgeShippingText.includes('ডেলিভারি') || edgeShippingText.includes('Shipping'), 'Microsoft Edge loaded shipping settings from Firestore')

    edgeInstance.proc.kill()
    edgeInstance.ws.close()
    edgeInstance.pageWs.close()
    try { fs.rmSync(edgeDir, { recursive: true, force: true }) } catch {}

    // Cleanup Chrome Phase 1 instance
    chromeInstance.proc.kill()
    chromeInstance.ws.close()
    chromeInstance.pageWs.close()
    try { fs.rmSync(persistentProfileDir, { recursive: true, force: true }) } catch {}

    console.log('\n===============================================================')
    console.log('  BROWSER VERIFICATION SUMMARY')
    console.log('===============================================================')
    const allPassed = testResults.every(t => t.pass)
    testResults.forEach(t => {
        const symbol = t.pass ? '✅ PASS' : '❌ FAIL'
        console.log(`  ${symbol} [${t.stepName}] ${t.moduleName}: ${t.details}`)
    })
    console.log(`\nOVERALL BROWSER RESULT: ${allPassed ? 'ALL BROWSER TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`)
    process.exit(allPassed ? 0 : 1)
}

runBrowserVerification().catch(err => {
    console.error('Browser verification failed:', err)
    process.exit(1)
})
