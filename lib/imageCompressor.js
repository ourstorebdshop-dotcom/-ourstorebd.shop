/**
 * Image compressor for client-side uploads.
 * Ensures all product/banner images fit comfortably within Firestore's 1MB limit
 * and load blazing fast on mobile connections.
 */

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/jpg',
])

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function compressImage(fileOrDataUrl, maxWidth = 600, maxHeight = 600, initialQuality = 0.70) {
    if (typeof window === 'undefined') return fileOrDataUrl
    if (!fileOrDataUrl) return null

    // If it's a URL or path (not a File and not a base64 string), return as is if safe
    if (typeof fileOrDataUrl === 'string') {
        if (!fileOrDataUrl.startsWith('data:')) {
            // Standard external URL or asset path
            return fileOrDataUrl
        }
        // Base64 data URL: enforce safe image types only (disallow SVG/HTML)
        if (!/^data:image\/(jpeg|png|webp|gif|jpg);base64,/i.test(fileOrDataUrl)) {
            console.warn('[ImageCompressor] Blocked unsafe data URL MIME type.')
            return null
        }
    }

    // Validate File/Blob object
    if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
        // 1. File size ceiling
        if (fileOrDataUrl.size > MAX_FILE_SIZE_BYTES) {
            console.warn('[ImageCompressor] File rejected: exceeds 10MB limit.')
            return null
        }

        // 2. MIME type validation
        if (fileOrDataUrl.type && !ALLOWED_MIME_TYPES.has(fileOrDataUrl.type.toLowerCase())) {
            console.warn(`[ImageCompressor] File rejected: disallowed MIME type (${fileOrDataUrl.type}).`)
            return null
        }

        // 3. File extension check (if File has name)
        if (fileOrDataUrl.name) {
            const ext = fileOrDataUrl.name.split('.').pop()?.toLowerCase() || ''
            const dangerousExtensions = ['svg', 'html', 'htm', 'js', 'mjs', 'exe', 'bat', 'sh', 'php']
            if (dangerousExtensions.includes(ext)) {
                console.warn(`[ImageCompressor] File rejected: dangerous file extension (.${ext}).`)
                return null
            }
        }
    }

    return new Promise((resolve, reject) => {
        let src = ''
        let shouldRevoke = false

        if (typeof fileOrDataUrl === 'string') {
            src = fileOrDataUrl
        } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
            src = URL.createObjectURL(fileOrDataUrl)
            shouldRevoke = true
        } else {
            return resolve(fileOrDataUrl)
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            try {
                if (shouldRevoke) URL.revokeObjectURL(src)

                let { naturalWidth: width, naturalHeight: height } = img

                if (!width || !height) {
                    return resolve(src)
                }

                // Calculate scaling
                let targetWidth = width
                let targetHeight = height

                if (targetWidth > maxWidth || targetHeight > maxHeight) {
                    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight)
                    targetWidth = Math.round(targetWidth * ratio)
                    targetHeight = Math.round(targetHeight * ratio)
                }

                const canvas = document.createElement('canvas')
                canvas.width = targetWidth
                canvas.height = targetHeight

                const ctx = canvas.getContext('2d')
                if (!ctx) return resolve(src)

                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

                // Prefer WebP for optimal compression, fallback to JPEG
                let format = 'image/webp'
                let testUrl = canvas.toDataURL('image/webp', 0.5)
                if (!testUrl.startsWith('data:image/webp')) {
                    format = 'image/jpeg'
                }

                let dataUrl = canvas.toDataURL(format, initialQuality)

                // If still larger than 100KB (~135,000 chars in base64), compress further
                if (dataUrl.length > 135000) {
                    const scale2 = Math.min(500 / width, 500 / height, 1)
                    const canvas2 = document.createElement('canvas')
                    canvas2.width = Math.round(width * scale2)
                    canvas2.height = Math.round(height * scale2)
                    const ctx2 = canvas2.getContext('2d')
                    ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height)
                    dataUrl = canvas2.toDataURL(format, 0.55)
                }

                resolve(dataUrl)
            } catch (err) {
                console.warn('[ImageCompressor] Compression failed, falling back to original:', err)
                resolve(src)
            }
        }

        img.onerror = (e) => {
            if (shouldRevoke) URL.revokeObjectURL(src)
            console.warn('[ImageCompressor] Image load error:', e)
            resolve(fileOrDataUrl)
        }

        img.src = src
    })
}
