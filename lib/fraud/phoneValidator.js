/**
 * Bangladesh Phone Number Validator & Normalizer
 * 
 * Accepted BD mobile input formats:
 *   +8801XXXXXXXXX  (14 chars)
 *   8801XXXXXXXXX   (13 chars)
 *   01XXXXXXXXX     (11 chars)
 *   With spaces, hyphens, dots, brackets allowed
 * 
 * Valid operator prefixes: 013, 014, 015, 016, 017, 018, 019
 * 
 * Internal normalized format: +8801XXXXXXXXX (always 14 chars)
 */

const BD_LOCAL_REGEX = /^01[3-9]\d{8}$/

/**
 * User-friendly error messages in Bengali for each validation failure reason.
 */
const ERROR_MESSAGES = {
    EMPTY_PHONE: 'মোবাইল নাম্বার প্রদান করুন',
    INVALID_LENGTH: 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01XXXXXXXXX)',
    INVALID_FORMAT: 'সঠিক বাংলাদেশী মোবাইল নাম্বার দিন (01X দিয়ে শুরু হওয়া উচিত)',
    SUSPICIOUS_PATTERN: 'এই মোবাইল নাম্বারটি গ্রহণযোগ্য নয়',
}

/**
 * Strip all formatting characters (spaces, hyphens, dots, brackets, plus)
 * and reduce to just digits. Then convert to the 11-digit local form (01XXXXXXXXX).
 * 
 * @param {string} phone - Raw user input
 * @returns {string} 11-digit local number (01XXXXXXXXX) or cleaned string if invalid
 */
function stripToLocal(phone) {
    if (!phone || typeof phone !== 'string') return ''

    // Remove everything except digits
    let digits = phone.replace(/[^0-9]/g, '')

    // Handle +880 / 880 prefix → strip to get 1XXXXXXXXX, then prepend 0
    if (digits.startsWith('880') && digits.length === 13) {
        digits = '0' + digits.slice(3)
    }

    // Handle 10-digit number missing leading 0 (e.g. 1712345678)
    if (digits.length === 10 && /^1[3-9]\d{8}$/.test(digits)) {
        digits = '0' + digits
    }

    return digits
}

/**
 * Normalize a phone number to the canonical internal format: +8801XXXXXXXXX
 * 
 * This is the ONE format stored in databases, used for duplicate detection,
 * rate limiting, blocklists, and all internal comparisons.
 * 
 * @param {string} phone - Raw user input in any accepted format
 * @returns {string} Normalized "+8801XXXXXXXXX" or empty string if invalid
 */
export function normalizePhone(phone) {
    const local = stripToLocal(phone)

    // Only normalize if it's a valid 11-digit BD mobile
    if (local.length === 11 && BD_LOCAL_REGEX.test(local)) {
        return '+880' + local.slice(1) // +880 + 1XXXXXXXXX
    }

    // Return whatever we have (caller should validate separately)
    return local ? '+880' + local.replace(/^0/, '') : ''
}

/**
 * Convert a normalized phone (+8801XXXXXXXXX) to local display format (01XXXXXXXXX).
 * Useful for showing the number in UI without the country code.
 * 
 * @param {string} phone - Normalized or raw phone number
 * @returns {string} Local format 01XXXXXXXXX
 */
export function toLocalPhone(phone) {
    if (!phone || typeof phone !== 'string') return ''

    // If already in +880 format
    if (phone.startsWith('+880')) {
        return '0' + phone.slice(4)
    }

    // If in 880 format (no +)
    const digits = phone.replace(/[^0-9]/g, '')
    if (digits.startsWith('880') && digits.length === 13) {
        return '0' + digits.slice(3)
    }

    // Already local or unknown
    return stripToLocal(phone)
}

/**
 * Format a phone number for user-friendly display: +880 1XXX-XXXXXXX
 * 
 * @param {string} phone - Any phone input
 * @returns {string} Formatted display string
 */
export function formatPhoneDisplay(phone) {
    const local = toLocalPhone(phone)
    if (local.length !== 11 || !BD_LOCAL_REGEX.test(local)) {
        return phone || ''
    }
    // Format: +880 1XXX-XXXXXXX
    return `+880 ${local.slice(1, 5)}-${local.slice(5)}`
}

/**
 * Validate a phone number as a valid Bangladesh mobile number.
 * 
 * @param {string} phone - Raw or normalized phone number
 * @returns {{ valid: boolean, normalized: string, local: string, reason?: string, message?: string }}
 */
export function validateBDPhone(phone) {
    const local = stripToLocal(phone)

    if (!local) {
        return {
            valid: false,
            normalized: '',
            local: '',
            reason: 'EMPTY_PHONE',
            message: ERROR_MESSAGES.EMPTY_PHONE,
        }
    }

    if (local.length !== 11) {
        return {
            valid: false,
            normalized: '',
            local,
            reason: 'INVALID_LENGTH',
            message: ERROR_MESSAGES.INVALID_LENGTH,
        }
    }

    if (!BD_LOCAL_REGEX.test(local)) {
        return {
            valid: false,
            normalized: '',
            local,
            reason: 'INVALID_FORMAT',
            message: ERROR_MESSAGES.INVALID_FORMAT,
        }
    }

    // Check for obviously fake numbers (all same digit)
    const tail = local.slice(2)
    const allSame = tail.split('').every(d => d === tail[0])
    if (allSame) {
        return {
            valid: false,
            normalized: '',
            local,
            reason: 'SUSPICIOUS_PATTERN',
            message: ERROR_MESSAGES.SUSPICIOUS_PATTERN,
        }
    }

    // Sequential ascending check
    const isSequential = tail === '345678901' || tail === '234567890'
    if (isSequential) {
        return {
            valid: false,
            normalized: '',
            local,
            reason: 'SUSPICIOUS_PATTERN',
            message: ERROR_MESSAGES.SUSPICIOUS_PATTERN,
        }
    }

    const normalized = '+880' + local.slice(1)
    return { valid: true, normalized, local }
}

/**
 * Check if two phone numbers are the same after normalization.
 * Works regardless of input format (+880, 880, 01X, with spaces/hyphens).
 * 
 * @param {string} phone1
 * @param {string} phone2
 * @returns {boolean}
 */
export function phonesMatch(phone1, phone2) {
    const n1 = normalizePhone(phone1)
    const n2 = normalizePhone(phone2)
    return !!(n1 && n2 && n1 === n2)
}
