/**
 * Lightweight, safe server-side Device & Browser Detector
 * Zero dependencies, ultra-fast regex parsing (<0.05ms)
 */

export function detectDeviceAndBrowser(userAgent = '') {
    if (!userAgent || typeof userAgent !== 'string') {
        return {
            deviceType: 'Desktop',
            browser: 'Unknown',
            os: 'Unknown',
            isBot: false,
        }
    }

    const ua = userAgent.toLowerCase()

    // 1. Detect Bots and Crawlers
    const botPatterns = [
        'bot', 'crawler', 'spider', 'slurp', 'mediapartners', 'googlebot',
        'bingbot', 'yandex', 'baidu', 'duckduckbot', 'sogou', 'exabot',
        'facebot', 'facebookexternalhit', 'ia_archiver', 'semrush',
        'ahrefs', 'petalbot', 'uptime', 'monitor', 'pingdom',
    ]
    const isBot = botPatterns.some(pattern => ua.includes(pattern))

    // 2. Detect Device Type
    let deviceType = 'Desktop'
    if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua)) {
        deviceType = 'Tablet'
    } else if (/(mobile|ip(hone|od)|android.*mobile|blackberry|iemobile|kindle|silk|opera mini|wp-mobile)/i.test(ua)) {
        deviceType = 'Mobile'
    }

    // 3. Detect Operating System
    let os = 'Other'
    if (/windows phone/i.test(ua)) {
        os = 'Windows Phone'
    } else if (/windows/i.test(ua)) {
        os = 'Windows'
    } else if (/android/i.test(ua)) {
        os = 'Android'
    } else if (/iphone|ipad|ipod/i.test(ua)) {
        os = 'iOS'
    } else if (/mac os x|macintosh/i.test(ua)) {
        os = 'macOS'
    } else if (/linux/i.test(ua)) {
        os = 'Linux'
    } else if (/cros/i.test(ua)) {
        os = 'ChromeOS'
    }

    // 4. Detect Browser
    let browser = 'Other'
    if (/edg\//i.test(ua)) {
        browser = 'Edge'
    } else if (/samsungbrowser/i.test(ua)) {
        browser = 'Samsung Internet'
    } else if (/opr\/|opera/i.test(ua)) {
        browser = 'Opera'
    } else if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua) && !/opr\//i.test(ua)) {
        browser = 'Chrome'
    } else if (/firefox|fxios/i.test(ua)) {
        browser = 'Firefox'
    } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
        browser = 'Safari'
    } else if (/msie|trident/i.test(ua)) {
        browser = 'Internet Explorer'
    }

    return {
        deviceType,
        browser,
        os,
        isBot,
    }
}
