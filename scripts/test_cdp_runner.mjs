import { spawn } from 'child_process'
import http from 'http'
import path from 'path'
import os from 'os'
import fs from 'fs'

const tempDir = path.join(os.tmpdir(), 'chrome_runner_' + Date.now())
fs.mkdirSync(tempDir, { recursive: true })

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
])

async function getWsUrl() {
    for (let i = 0; i < 20; i++) {
        try {
            const data = await new Promise((resolve, reject) => {
                http.get('http://127.0.0.1:9222/json/version', res => {
                    let d = ''
                    res.on('data', c => d += c)
                    res.on('end', () => resolve(JSON.parse(d)))
                }).on('error', reject)
            })
            if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl
        } catch (e) {
            await new Promise(r => setTimeout(r, 300))
        }
    }
    throw new Error('Could not get WS debugger URL')
}

class CDP {
    constructor(ws) {
        this.ws = ws
        this.id = 0
        this.pending = new Map()
        this.ws.onmessage = (msg) => {
            const parsed = JSON.parse(msg.data)
            if (parsed.id && this.pending.has(parsed.id)) {
                const { resolve, reject } = this.pending.get(parsed.id)
                this.pending.delete(parsed.id)
                if (parsed.error) reject(parsed.error)
                else resolve(parsed.result)
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
}

async function run() {
    try {
        const wsUrl = await getWsUrl()
        const ws = new WebSocket(wsUrl)
        await new Promise(r => ws.onopen = r)
        const cdp = new CDP(ws)

        // Create new target for test
        const { targetId } = await cdp.send('Target.createTarget', { url: 'http://localhost:3000/admin' })
        const targetWsUrl = `ws://127.0.0.1:9222/devtools/page/${targetId}`
        const pageWs = new WebSocket(targetWsUrl)
        await new Promise(r => pageWs.onopen = r)
        const pageCdp = new CDP(pageWs)

        await pageCdp.send('Page.enable')
        await pageCdp.send('Runtime.enable')

        const loadPromise = new Promise(resolve => {
            const origOnMessage = pageWs.onmessage
            pageWs.onmessage = (msg) => {
                origOnMessage(msg)
                const parsed = JSON.parse(msg.data)
                if (parsed.method === 'Page.loadEventFired') resolve()
            }
        })

        await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/admin' })
        await loadPromise
        await new Promise(r => setTimeout(r, 1500))

        const titleRes = await pageCdp.send('Runtime.evaluate', {
            expression: 'document.title'
        })
        console.log('Page Title in Chrome:', titleRes.result?.value)

        const textRes = await pageCdp.send('Runtime.evaluate', {
            expression: 'document.body.innerText.slice(0, 200)'
        })
        console.log('Page Content Preview:\n', textRes.result?.value)

        ws.close()
        pageWs.close()
    } catch (e) {
        console.error('Test error:', e)
    } finally {
        chrome.kill()
        try { fs.rmSync(tempDir, { recursive: true, force: true }) } catch {}
        process.exit(0)
    }
}

run()
