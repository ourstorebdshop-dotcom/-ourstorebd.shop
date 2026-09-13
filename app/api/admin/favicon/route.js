import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request) {
    try {
        const body = await request.json()
        const { faviconDataUrl, appleTouchIconDataUrl } = body

        let savedFavicon = false
        let savedAppleIcon = false

        const publicDir = path.join(process.cwd(), 'public')

        // Ensure public directory exists
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true })
        }

        // Helper to extract buffer from data URL
        const dataUrlToBuffer = (dataUrl) => {
            if (!dataUrl || typeof dataUrl !== 'string') return null
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
            if (!match) return null
            return Buffer.from(match[2], 'base64')
        }

        // 1. Save favicon.ico / favicon.png
        if (faviconDataUrl) {
            const buf = dataUrlToBuffer(faviconDataUrl)
            if (buf) {
                try {
                    // Save as favicon.ico
                    const faviconPath = path.join(publicDir, 'favicon.ico')
                    fs.writeFileSync(faviconPath, buf)
                    savedFavicon = true
                } catch (fsErr) {
                    console.warn('[FaviconAPI] Could not write to public/favicon.ico (likely read-only environment):', fsErr.message)
                }
            }
        }

        // 2. Save apple-icon.png
        if (appleTouchIconDataUrl || faviconDataUrl) {
            const appleData = appleTouchIconDataUrl || faviconDataUrl
            const buf = dataUrlToBuffer(appleData)
            if (buf) {
                try {
                    const applePath = path.join(publicDir, 'apple-icon.png')
                    fs.writeFileSync(applePath, buf)
                    savedAppleIcon = true
                } catch (fsErr) {
                    console.warn('[FaviconAPI] Could not write to public/apple-icon.png:', fsErr.message)
                }
            }
        }

        return NextResponse.json({
            success: true,
            savedToFile: savedFavicon || savedAppleIcon,
            message: 'Favicon saved successfully',
        })
    } catch (error) {
        console.error('[FaviconAPI] Error handling favicon save:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
