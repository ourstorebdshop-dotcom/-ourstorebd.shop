/**
 * Image compressor for client-side uploads.
 * Ensures all product/banner images fit comfortably within Firestore's 1MB limit
 * and load blazing fast on mobile connections.
 */

export async function compressImage(fileOrDataUrl, maxWidth = 800, maxHeight = 800, initialQuality = 0.75) {
    if (typeof window === 'undefined') return fileOrDataUrl
    if (!fileOrDataUrl) return null

    // If it's a URL or path (not a File and not a base64 string), return as is
    if (typeof fileOrDataUrl === 'string' && !fileOrDataUrl.startsWith('data:image')) {
        return fileOrDataUrl
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

                // First compression attempt
                let dataUrl = canvas.toDataURL('image/jpeg', initialQuality)

                // If still larger than 250KB (~330,000 characters in base64), compress further
                if (dataUrl.length > 330000) {
                    // Try with 600px and lower quality
                    const scale2 = Math.min(600 / width, 600 / height, 1)
                    const canvas2 = document.createElement('canvas')
                    canvas2.width = Math.round(width * scale2)
                    canvas2.height = Math.round(height * scale2)
                    const ctx2 = canvas2.getContext('2d')
                    ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height)
                    dataUrl = canvas2.toDataURL('image/jpeg', 0.55)
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
