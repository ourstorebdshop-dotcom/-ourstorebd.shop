import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'

const tempDir = path.join(os.tmpdir(), 'chrome_cdp_' + Date.now())
fs.mkdirSync(tempDir, { recursive: true })

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const args = [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-translate',
    '--disable-extensions',
    'about:blank'
]

console.log('Launching Chrome:', chromePath)
const chrome = spawn(chromePath, args, { stdio: 'pipe' })

chrome.on('error', (err) => console.error('Chrome spawn error:', err))
chrome.on('exit', (code, sig) => console.log(`Chrome exited with code ${code}, sig ${sig}`))

let attempts = 0
function checkPort() {
    attempts++
    http.get('http://127.0.0.1:9222/json/version', (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
            console.log('Connected to Chrome CDP successfully! Response:')
            console.log(data)
            chrome.kill()
            try { fs.rmSync(tempDir, { recursive: true, force: true }) } catch {}
            process.exit(0)
        })
    }).on('error', (err) => {
        if (attempts > 15) {
            console.error('Timed out waiting for Chrome CDP:', err.message)
            chrome.kill()
            process.exit(1)
        }
        setTimeout(checkPort, 500)
    })
}

setTimeout(checkPort, 1000)
