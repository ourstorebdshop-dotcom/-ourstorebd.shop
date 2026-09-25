'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Invisible, Lightweight Client Visitor Tracker
 *
 * Requirements:
 * - 100% invisible (renders null, zero DOM footprint, zero visual change)
 * - Non-blocking (deferred initial heartbeat, async keepalive/sendBeacon)
 * - Anonymous session ID (persists across page reloads and tab navigations)
 * - Heartbeat interval: 18 seconds (within 15-20s requirement)
 * - Ignores admin routes
 * - Sends departure signal on tab close/navigate away
 */

const HEARTBEAT_INTERVAL_MS = 18 * 1000 // 18 seconds
const SESSION_STORAGE_KEY = 'gocart_visitor_sid'
const SESSION_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes session idle expiry

/**
 * Generate a cryptographically random, anonymous session ID
 */
function generateAnonymousSessionId() {
    try {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const arr = new Uint8Array(16)
            crypto.getRandomValues(arr)
            return 'vs_' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
        }
    } catch { /* fallback below */ }
    return 'vs_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Get or create an anonymous session ID
 */
function getOrCreateSessionId() {
    if (typeof window === 'undefined') return null

    try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY)
        const storedTime = parseInt(localStorage.getItem(SESSION_STORAGE_KEY + '_time') || '0', 10)
        const now = Date.now()

        // Reuse existing session ID if active within the last 30 minutes
        if (stored && storedTime && (now - storedTime < SESSION_EXPIRY_MS)) {
            localStorage.setItem(SESSION_STORAGE_KEY + '_time', String(now))
            return stored
        }

        // Otherwise generate a new anonymous session ID
        const newId = generateAnonymousSessionId()
        localStorage.setItem(SESSION_STORAGE_KEY, newId)
        localStorage.setItem(SESSION_STORAGE_KEY + '_time', String(now))
        localStorage.setItem(SESSION_STORAGE_KEY + '_started', String(now))
        return newId
    } catch {
        // Fallback for private browsing mode where localStorage might be restricted
        return generateAnonymousSessionId()
    }
}

export default function VisitorTracker() {
    const pathname = usePathname()
    const timerRef = useRef(null)
    const sessionIdRef = useRef(null)
    const startedAtRef = useRef(null)
    const currentPathRef = useRef(pathname)

    currentPathRef.current = pathname

    useEffect(() => {
        // 1. Never track Admin Panel routes
        if (!pathname || pathname.startsWith('/admin')) {
            return
        }

        // Initialize session ID
        if (!sessionIdRef.current) {
            sessionIdRef.current = getOrCreateSessionId()
            try {
                const s = localStorage.getItem(SESSION_STORAGE_KEY + '_started')
                startedAtRef.current = s ? parseInt(s, 10) : Date.now()
            } catch {
                startedAtRef.current = Date.now()
            }
        }

        const sid = sessionIdRef.current
        if (!sid) return

        /**
         * Send heartbeat to server
         */
        const sendHeartbeat = (isLeaving = false) => {
            try {
                const currentPath = currentPathRef.current || window.location.pathname || '/'
                // Ignore admin routes
                if (currentPath.startsWith('/admin')) return

                const payload = JSON.stringify({
                    sessionId: sid,
                    page: currentPath,
                    referrer: document.referrer || '',
                    startedAt: startedAtRef.current || Date.now(),
                    isLeaving: Boolean(isLeaving),
                })

                if (isLeaving && typeof navigator !== 'undefined' && navigator.sendBeacon) {
                    navigator.sendBeacon('/api/presence/heartbeat', payload)
                    return
                }

                fetch('/api/presence/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true,
                }).catch(() => {
                    // Fail silently to prevent any disruption to user experience
                })

                // Touch timestamp in localStorage
                try {
                    localStorage.setItem(SESSION_STORAGE_KEY + '_time', String(Date.now()))
                } catch { /* ignore */ }
            } catch {
                // Fail silently
            }
        }

        // 2. Schedule heartbeats: initial heartbeat deferred by 1.5s so it never blocks page load
        const initialDelay = setTimeout(() => {
            sendHeartbeat(false)

            // Setup recurring heartbeat every 18 seconds
            timerRef.current = setInterval(() => {
                // Only send recurring heartbeats if the page is visible to save battery/bandwidth
                if (document.visibilityState === 'visible') {
                    sendHeartbeat(false)
                }
            }, HEARTBEAT_INTERVAL_MS)
        }, 1500)

        // 3. Handle tab visibility changes (immediate heartbeat when returning to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                sendHeartbeat(false)
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // 4. Handle page departure / tab close
        const handleUnload = () => {
            sendHeartbeat(true)
        }
        window.addEventListener('pagehide', handleUnload)
        window.addEventListener('beforeunload', handleUnload)

        return () => {
            clearTimeout(initialDelay)
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('pagehide', handleUnload)
            window.removeEventListener('beforeunload', handleUnload)
        }
    }, [pathname])

    // Completely invisible component - zero visual footprint
    return null
}
