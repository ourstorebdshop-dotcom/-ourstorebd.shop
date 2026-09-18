const endpoints = [
    { url: 'http://localhost:3000/api/orders', method: 'GET' },
    { url: 'http://localhost:3000/api/integrations/settings', method: 'GET' },
    { url: 'http://localhost:3000/api/admin/login', method: 'POST', body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } },
    { url: 'http://localhost:3000/admin', method: 'GET' },
    { url: 'http://localhost:3000/admin/banners', method: 'GET' },
    { url: 'http://localhost:3000/admin/categories', method: 'GET' },
    { url: 'http://localhost:3000/admin/coupons', method: 'GET' },
    { url: 'http://localhost:3000/admin/orders', method: 'GET' },
    { url: 'http://localhost:3000/admin/shipping', method: 'GET' },
    { url: 'http://localhost:3000/admin/header-footer', method: 'GET' },
    { url: 'http://localhost:3000/admin/favicon', method: 'GET' },
    { url: 'http://localhost:3000/admin/contact', method: 'GET' },
    { url: 'http://localhost:3000/admin/cash-flow', method: 'GET' },
    { url: 'http://localhost:3000/admin/fraud', method: 'GET' },
    { url: 'http://localhost:3000/admin/api-settings', method: 'GET' },
    { url: 'http://localhost:3000/admin/integrations', method: 'GET' },
    { url: 'http://localhost:3000/admin/tracking', method: 'GET' },
    { url: 'http://localhost:3000/admin/reviews', method: 'GET' },
]

async function testHttp() {
    console.log('Testing HTTP endpoints on http://localhost:3000...\n')
    let allOk = true

    for (const ep of endpoints) {
        try {
            const opts = {
                method: ep.method,
                headers: ep.body ? { 'Content-Type': 'application/json' } : {}
            }
            if (ep.body) opts.body = JSON.stringify(ep.body)

            const res = await fetch(ep.url, opts)
            const isOk = res.status >= 200 && res.status < 400
            const symbol = isOk ? '✅' : '❌'
            console.log(`${symbol} [${ep.method}] ${ep.url} -> Status: ${res.status}`)
            if (!isOk) allOk = false
        } catch (e) {
            console.error(`❌ [${ep.method}] ${ep.url} -> Error: ${e.message}`)
            allOk = false
        }
    }

    console.log(`\nHTTP Endpoints Test: ${allOk ? 'ALL PASSED ✅' : 'FAILURES DETECTED ❌'}`)
    process.exit(allOk ? 0 : 1)
}

testHttp()
