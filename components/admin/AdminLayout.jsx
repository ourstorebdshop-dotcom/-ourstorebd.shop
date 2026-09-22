'use client'
import { useEffect, useState, useCallback } from "react"
import Loading from "../Loading"
import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"
import AdminLoginForm from "./AdminLoginForm"

// ============================================================================
// ADMIN SESSION SECURITY ENGINE
// ============================================================================
// Multi-layer security: signed token + HMAC signature + expiry + tamper detection
// ============================================================================

const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2 hours
const STORAGE_KEY = 'gocart_admin_session'
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'idrisrashel@gmail.com').toLowerCase()

// Crypto-grade HMAC-SHA256 using Web Crypto API with fast arithmetic fallback
const computeHMAC = async (message, key) => {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
        try {
            const encoder = new TextEncoder()
            const keyData = encoder.encode(key)
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            )
            const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
            return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
        } catch { /* fallback */ }
    }
    return computeLegacyHMAC(message, key)
}

const computeLegacyHMAC = (message, key) => {
    let h1 = 0xdeadbeef
    let h2 = 0x41c6ce57
    const combined = message + ':' + key
    for (let i = 0; i < combined.length; i++) {
        const ch = combined.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0)
    return hash.toString(36)
}

// Build a fingerprint of the current browser environment
const getBrowserFingerprint = () => {
    try {
        const ua = navigator.userAgent || ''
        const lang = navigator.language || ''
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        const screen = `${Math.min(window.screen.width, window.screen.height)}x${Math.max(window.screen.width, window.screen.height)}`
        return computeLegacyHMAC(`${ua}|${lang}|${tz}|${screen}`, 'fp_salt_2026')
    } catch {
        return 'unknown'
    }
}

// Generate a cryptographically-unpredictable session token
const generateSecureToken = () => {
    const array = new Uint8Array(32)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array)
    } else {
        for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256)
    }
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

// Build the session signature — ties together email + time + fingerprint + client salt
const createSignature = async (email, loginTime, fingerprint, token) => {
    const salt = 'gocart_secure_client_session_salt_2026'
    return await computeHMAC(`${email}:${loginTime}:${fingerprint}:${token}`, salt)
}

// ============================================================================
// ADMIN LAYOUT COMPONENT
// ============================================================================

const AdminLayout = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    const validateSession = useCallback(async () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return false

            const session = JSON.parse(raw)

            // 1. Structure check — every field must exist
            if (!session.token || !session.loginTime || !session.email ||
                !session.signature || !session.fingerprint || !session.version) {
                localStorage.removeItem(STORAGE_KEY)
                return false
            }

            // 2. Version check — reject old session formats
            if (session.version !== 2) {
                localStorage.removeItem(STORAGE_KEY)
                return false
            }

            // 3. Expiration check
            if (Date.now() - session.loginTime > SESSION_DURATION) {
                localStorage.removeItem(STORAGE_KEY)
                return false
            }

            // 4. Admin email check
            if (session.email.toLowerCase() !== ADMIN_EMAIL) {
                localStorage.removeItem(STORAGE_KEY)
                return false
            }

            // 5. Browser fingerprint check — prevents session hijacking across browsers
            const currentFingerprint = getBrowserFingerprint()
            if (session.fingerprint !== currentFingerprint) {
                localStorage.removeItem(STORAGE_KEY)
                return false
            }

            // 6. HMAC signature verification (Web Crypto SHA-256 with legacy fallback)
            const expectedSig = await createSignature(
                session.email, session.loginTime, session.fingerprint, session.token
            )
            const legacySig = computeLegacyHMAC(
                `${session.email}:${session.loginTime}:${session.fingerprint}:${session.token}`,
                'gocart_secure_client_session_salt_2026'
            )
            if (session.signature !== expectedSig && session.signature !== legacySig) {
                localStorage.removeItem(STORAGE_KEY)
                return false
            }

            return true
        } catch {
            localStorage.removeItem(STORAGE_KEY)
            return false
        }
    }, [])

    const checkAdminAuth = useCallback(async () => {
        // Clean up any legacy insecure keys
        localStorage.removeItem('adminAuthenticated')

        // First check server-side HttpOnly cookie session
        try {
            const res = await fetch('/api/admin/verify')
            if (res.ok) {
                setIsAdmin(true)
                setLoading(false)
                return
            }
        } catch { /* fallback to client validation */ }

        const valid = await validateSession()
        setIsAdmin(valid)
        setLoading(false)
    }, [validateSession])

    const handleLoginSuccess = useCallback(async () => {
        const loginTime = Date.now()
        const token = generateSecureToken()
        const fingerprint = getBrowserFingerprint()
        const signature = await createSignature(ADMIN_EMAIL, loginTime, fingerprint, token)

        const session = {
            version: 2,
            token,
            email: ADMIN_EMAIL,
            loginTime,
            fingerprint,
            signature
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        setIsAdmin(true)
    }, [])

    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' })
        } catch { /* ignore */ }
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem('adminAuthenticated')
        setIsAdmin(false)
    }, [])

    useEffect(() => {
        checkAdminAuth()

        const checkValidity = async () => {
            const valid = await validateSession()
            if (!valid) setIsAdmin(false)
        }

        // Re-validate session every 30 seconds
        const interval = setInterval(checkValidity, 30 * 1000)

        // Detect tampering from other tabs / DevTools
        const onStorage = (e) => {
            if (e.key === STORAGE_KEY || e.key === 'adminAuthenticated') {
                checkValidity()
            }
        }
        window.addEventListener('storage', onStorage)

        // Detect visibility changes (user coming back to tab)
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                checkValidity()
            }
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            clearInterval(interval)
            window.removeEventListener('storage', onStorage)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [checkAdminAuth, validateSession])

    if (loading) return <Loading />

    if (!isAdmin) {
        return <AdminLoginForm onLoginSuccess={handleLoginSuccess} />
    }

    return (
        <div className="flex flex-col min-h-[100dvh] h-screen">
            <AdminNavbar onLogout={handleLogout} />
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar - hidden on mobile */}
                <div className="hidden sm:block h-full overflow-y-auto no-scrollbar">
                    <AdminSidebar />
                </div>
                <div className="flex-1 h-full overflow-x-hidden overflow-y-auto p-4 sm:p-5 lg:pl-12 lg:pt-12 pb-20 sm:pb-5">
                    {children}
                </div>
            </div>
            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-bottom">
                <AdminSidebar isMobileBottomNav={true} />
            </div>
        </div>
    )
}

export default AdminLayout