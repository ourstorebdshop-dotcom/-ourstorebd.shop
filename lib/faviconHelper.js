/**
 * Favicon Helper Utility
 * Handles image processing, canvas resizing, Apple touch icon generation, and preset badges.
 */

// Generate a data URL from an image file resized to a square canvas
export function processImageToFavicon(file, size = 64) {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('No file provided'))

        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.onload = (event) => {
            const img = new Image()
            img.onerror = () => reject(new Error('Invalid image file'))
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas')
                    canvas.width = size
                    canvas.height = size
                    const ctx = canvas.getContext('2d')

                    // High quality rendering
                    ctx.imageSmoothingEnabled = true
                    ctx.imageSmoothingQuality = 'high'

                    // Determine aspect ratio and center crop
                    const minDim = Math.min(img.width, img.height)
                    const startX = (img.width - minDim) / 2
                    const startY = (img.height - minDim) / 2

                    // Clear canvas (keep transparent)
                    ctx.clearRect(0, 0, size, size)

                    // Draw centered square image
                    ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size)

                    const dataUrl = canvas.toDataURL('image/png', 0.95)
                    resolve({
                        dataUrl,
                        width: img.width,
                        height: img.height,
                        targetSize: size,
                        originalSize: file.size,
                        name: file.name,
                        type: file.type,
                    })
                } catch (err) {
                    reject(err)
                }
            }
            img.src = event.target.result
        }
        reader.readAsDataURL(file)
    })
}

// Generate an Apple Touch Icon (180x180 square with clean background)
export function generateAppleTouchIcon(imageSrc, size = 180, bgColor = 'transparent') {
    return new Promise((resolve) => {
        if (!imageSrc || typeof window === 'undefined') return resolve(imageSrc)

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d')

                // Fill background only if not transparent
                if (bgColor && bgColor !== 'transparent') {
                    const radius = Math.floor(size * 0.22)
                    ctx.beginPath()
                    ctx.moveTo(radius, 0)
                    ctx.lineTo(size - radius, 0)
                    ctx.quadraticCurveTo(size, 0, size, radius)
                    ctx.lineTo(size, size - radius)
                    ctx.quadraticCurveTo(size, size, size - radius, size)
                    ctx.lineTo(radius, size)
                    ctx.quadraticCurveTo(0, size, 0, size - radius)
                    ctx.lineTo(0, radius)
                    ctx.quadraticCurveTo(0, 0, radius, 0)
                    ctx.closePath()
                    ctx.fillStyle = bgColor
                    ctx.fill()
                }

                // Draw centered image with optimal padding
                const padding = (bgColor && bgColor !== 'transparent') ? Math.floor(size * 0.12) : Math.floor(size * 0.08)
                const targetSize = size - padding * 2
                const minDim = Math.min(img.width, img.height)
                const startX = (img.width - minDim) / 2
                const startY = (img.height - minDim) / 2

                ctx.drawImage(img, startX, startY, minDim, minDim, padding, padding, targetSize, targetSize)
                resolve(canvas.toDataURL('image/png'))
            } catch (e) {
                resolve(imageSrc)
            }
        }
        img.onerror = () => resolve(imageSrc)
        img.src = imageSrc
    })
}

// Preset modern e-commerce icons (SVG data URIs converted to crisp badges)
export const FAVICON_PRESETS = [
    {
        id: 'ourstore_official',
        name: 'Our Store BD (অফিসিয়াল লোগো মার্ক)',
        category: 'Brand',
        bgColor: 'transparent',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <defs>
                <linearGradient id="gBrandRed" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#be185d"/>
                    <stop offset="50%" stop-color="#f43f5e"/>
                    <stop offset="100%" stop-color="#e11d48"/>
                </linearGradient>
                <linearGradient id="gBrandPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#7c3aed"/>
                    <stop offset="50%" stop-color="#5b21b6"/>
                    <stop offset="100%" stop-color="#2e1065"/>
                </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="#ffffff" fill-opacity="0.05"/>
            <path d="M 17 40 C 9 32 9 18 19 10 C 27 3 39 5 45 12 C 43 14 40 17 38 18 C 34 13 25 12 19 17 C 13 22 13 32 19 37 C 21 38 23 40 25 41 C 21 42 19 41 17 40 Z" fill="url(#gBrandRed)"/>
            <path d="M 47 24 C 55 32 55 46 45 54 C 37 61 25 59 19 52 C 21 50 24 47 26 46 C 30 51 39 52 45 47 C 51 42 51 32 45 27 C 43 26 41 24 39 23 C 43 22 45 23 47 24 Z" fill="url(#gBrandPurple)"/>
        </svg>`,
    },
    {
        id: 'ourstore_green',
        name: 'Our Store BD (Emerald Badge)',
        category: 'Brand',
        bgColor: '#10b981',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#10b981"/>
                    <stop offset="100%" stop-color="#059669"/>
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#g1)"/>
            <path d="M22 34l8 8 16-16" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="32" cy="32" r="23" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.3"/>
        </svg>`,
    },
    {
        id: 'ourstore_os',
        name: 'Store "OS" Monogram',
        category: 'Brand',
        bgColor: '#0f172a',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="16" fill="#0f172a"/>
            <text x="32" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#10b981" text-anchor="middle" letter-spacing="-1">OS</text>
            <circle cx="50" cy="18" r="4.5" fill="#f59e0b"/>
        </svg>`,
    },
    {
        id: 'shopping_bag',
        name: 'Shopping Bag',
        category: 'Shop',
        bgColor: '#10b981',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <defs>
                <linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#059669"/>
                    <stop offset="100%" stop-color="#047857"/>
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#gb)"/>
            <path d="M20 22h24l3 28H17l3-28z" fill="#ffffff" fill-opacity="0.95"/>
            <path d="M26 24v-6a6 6 0 0 1 12 0v6" fill="none" stroke="#047857" stroke-width="3" stroke-linecap="round"/>
            <circle cx="32" cy="34" r="3.5" fill="#10b981"/>
        </svg>`,
    },
    {
        id: 'shopping_cart',
        name: 'Speed Cart',
        category: 'Shop',
        bgColor: '#2563eb',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <defs>
                <linearGradient id="gc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#3b82f6"/>
                    <stop offset="100%" stop-color="#1d4ed8"/>
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#gc)"/>
            <path d="M16 18h6l4 18h20l4-14H24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="28" cy="46" r="3.5" fill="#ffffff"/>
            <circle cx="44" cy="46" r="3.5" fill="#ffffff"/>
        </svg>`,
    },
    {
        id: 'tech_gadgets',
        name: 'Gadgets & Headphones',
        category: 'Tech',
        bgColor: '#8b5cf6',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <defs>
                <linearGradient id="gh" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#8b5cf6"/>
                    <stop offset="100%" stop-color="#6d28d9"/>
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#gh)"/>
            <path d="M18 34v-8a14 14 0 0 1 28 0v8" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
            <rect x="15" y="32" width="6" height="14" rx="3" fill="#ffffff"/>
            <rect x="43" y="32" width="6" height="14" rx="3" fill="#ffffff"/>
        </svg>`,
    },
    {
        id: 'lightning_flash',
        name: 'Flash Deals / Express',
        category: 'Promo',
        bgColor: '#f59e0b',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <defs>
                <linearGradient id="gf" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fbbf24"/>
                    <stop offset="100%" stop-color="#d97706"/>
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#gf)"/>
            <path d="M36 12L20 34h12l-4 18 18-22H34l4-18z" fill="#ffffff"/>
        </svg>`,
    },
]

// Convert an SVG string to a data URL
export function svgToDataUrl(svgString) {
    const encoded = encodeURIComponent(svgString)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22')
    return `data:image/svg+xml;charset=utf-8,${encoded}`
}
