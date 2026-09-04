'use client'

import { useState, useRef, useEffect } from 'react'
import { LockIcon, MailIcon, EyeIcon, EyeOffIcon, ShieldCheckIcon, ShieldAlert, ArrowLeft, AlertTriangle, Clock, Ban } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

// ============================================================================
// BRUTE-FORCE PROTECTION CONFIG
// ============================================================================
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 5 * 60 * 1000    // 5 minutes
const ESCALATION_FACTOR = 2                // Each subsequent lockout doubles
const MAX_LOCKOUT = 60 * 60 * 1000         // Max 1 hour lockout
const LOCKOUT_KEY = 'gocart_admin_lockout'
const ATTEMPT_LOG_KEY = 'gocart_admin_attempt_log'

// Compute a simple hash for lockout integrity
const computeLockoutHash = (data) => {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + ch
        hash = hash & hash
    }
    return Math.abs(hash).toString(36)
}

const AdminLoginForm = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [failedAttempts, setFailedAttempts] = useState(0)
    const [lockoutEnd, setLockoutEnd] = useState(null)
    const [lockoutRemaining, setLockoutRemaining] = useState(0)
    const [lockoutCount, setLockoutCount] = useState(0) // How many times locked out
    const lockoutTimerRef = useRef(null)

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'idrisrashel@gmail.com'
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '@idris@1I@idris@1I@idris@1I'

    // Restore lockout state on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LOCKOUT_KEY)
            if (!raw) return

            const data = JSON.parse(raw)

            // Verify integrity — if someone tampers with lockout, force a 1-hour lock
            const { hash, ...payload } = data
            if (hash !== computeLockoutHash(payload)) {
                // Tamper detected! Force maximum lockout
                const hardLock = Date.now() + MAX_LOCKOUT
                setLockoutEnd(hardLock)
                setFailedAttempts(MAX_ATTEMPTS)
                setLockoutCount(10)
                toast.error('নিরাপত্তা সতর্কতা: ট্যাম্পারিং সনাক্ত হয়েছে! ১ ঘণ্টা লক।', { duration: 5000, icon: '🚨' })
                return
            }

            if (data.lockoutEnd && Date.now() < data.lockoutEnd) {
                setLockoutEnd(data.lockoutEnd)
                setFailedAttempts(data.attempts || MAX_ATTEMPTS)
                setLockoutCount(data.lockoutCount || 1)
            } else if (data.lockoutEnd && Date.now() >= data.lockoutEnd) {
                // Lockout expired but keep the lockout count for escalation
                setLockoutCount(data.lockoutCount || 0)
                setFailedAttempts(0)
                localStorage.removeItem(LOCKOUT_KEY)
            }
        } catch {
            localStorage.removeItem(LOCKOUT_KEY)
        }
    }, [])

    // Countdown timer
    useEffect(() => {
        if (!lockoutEnd) return

        const tick = () => {
            const remaining = lockoutEnd - Date.now()
            if (remaining <= 0) {
                setLockoutEnd(null)
                setFailedAttempts(0)
                setLockoutRemaining(0)
                // Don't remove lockout count — keep it for escalation
                localStorage.removeItem(LOCKOUT_KEY)
                if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current)
            } else {
                setLockoutRemaining(Math.ceil(remaining / 1000))
            }
        }
        tick()
        lockoutTimerRef.current = setInterval(tick, 1000)
        return () => {
            if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current)
        }
    }, [lockoutEnd])

    const isLockedOut = lockoutEnd && Date.now() < lockoutEnd

    const handleSubmit = (e) => {
        e.preventDefault()

        if (isLockedOut) {
            toast.error(`সাময়িকভাবে লক করা আছে! ${formatLockoutTime(lockoutRemaining)} পর চেষ্টা করুন।`)
            return
        }

        setLoading(true)

        // Intentional 800ms delay — mitigates timing attacks
        setTimeout(() => {
            const inputEmail = email.trim().toLowerCase()
            const inputPassword = password

            if (inputEmail === adminEmail.toLowerCase() && inputPassword === adminPassword) {
                // Success — reset everything
                setFailedAttempts(0)
                setLockoutCount(0)
                localStorage.removeItem(LOCKOUT_KEY)
                localStorage.removeItem(ATTEMPT_LOG_KEY)
                toast.success('এডমিন অথেনটিকেশন সফল হয়েছে!', { icon: '🔓' })
                onLoginSuccess()
            } else {
                const newAttempts = failedAttempts + 1
                setFailedAttempts(newAttempts)

                // Log the attempt timestamp
                try {
                    const logs = JSON.parse(localStorage.getItem(ATTEMPT_LOG_KEY) || '[]')
                    logs.push({ time: Date.now(), email: inputEmail })
                    // Keep only last 20 entries
                    if (logs.length > 20) logs.splice(0, logs.length - 20)
                    localStorage.setItem(ATTEMPT_LOG_KEY, JSON.stringify(logs))
                } catch { /* ignore */ }

                if (newAttempts >= MAX_ATTEMPTS) {
                    // Escalating lockout duration
                    const newLockoutCount = lockoutCount + 1
                    const duration = Math.min(
                        LOCKOUT_DURATION * Math.pow(ESCALATION_FACTOR, newLockoutCount - 1),
                        MAX_LOCKOUT
                    )
                    const newLockoutEnd = Date.now() + duration

                    setLockoutEnd(newLockoutEnd)
                    setLockoutCount(newLockoutCount)

                    const lockoutData = {
                        lockoutEnd: newLockoutEnd,
                        attempts: newAttempts,
                        lockoutCount: newLockoutCount
                    }
                    lockoutData.hash = computeLockoutHash(lockoutData)
                    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockoutData))

                    const durationMins = Math.ceil(duration / 60000)
                    toast.error(
                        `${MAX_ATTEMPTS} বার ভুল চেষ্টা! ${durationMins} মিনিটের জন্য লক করা হয়েছে।`,
                        { duration: 5000, icon: '🔒' }
                    )
                } else {
                    const remaining = MAX_ATTEMPTS - newAttempts
                    toast.error(`ভুল ইমেইল অথবা পাসওয়ার্ড! আর ${remaining} বার চেষ্টা করতে পারবেন।`)
                }
            }

            setLoading(false)
        }, 800)
    }

    const formatLockoutTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden select-none">

            {/* Background glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/8 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[420px] relative z-10">

                {/* Security Badge */}
                <div className="flex justify-center mb-6">
                    <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/25 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[11px] font-semibold text-green-400 tracking-wider uppercase">Encrypted & Secured</span>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-slate-900 rounded-3xl shadow-2xl shadow-black/40 border border-slate-700/50 p-7 sm:p-9">

                    {/* Back link */}
                    <div className="mb-7">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition">
                            <ArrowLeft size={14} />
                            মূল স্টোরে ফিরুন
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-7">
                        <div className="w-16 h-16 bg-green-500/15 text-green-400 rounded-2xl flex items-center justify-center mb-4 border border-green-500/25">
                            <ShieldCheckIcon size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
                        <p className="text-[13px] text-slate-400 mt-2 leading-relaxed">
                            শুধুমাত্র অনুমোদিত এডমিন প্রবেশ করতে পারবেন
                        </p>
                    </div>

                    {/* Lockout Warning */}
                    {isLockedOut && (
                        <div className="mb-5 bg-red-950/60 border border-red-800/50 rounded-2xl p-4 flex items-start gap-3">
                            <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-red-400 mb-1">
                                    নিরাপত্তা সতর্কতা — একাউন্ট লক!
                                </p>
                                <p className="text-[11px] text-red-300/70">
                                    একাধিক ভুল প্রচেষ্টার কারণে লক করা হয়েছে।
                                    {lockoutCount > 1 && (
                                        <span className="block mt-1 text-red-400 font-semibold">
                                            বারবার ভুল চেষ্টায় লক-আউটের সময় বৃদ্ধি পাচ্ছে!
                                        </span>
                                    )}
                                </p>
                                <div className="flex items-center gap-2 mt-2 bg-red-900/40 rounded-lg px-3 py-1.5 w-fit">
                                    <Clock size={14} className="text-red-400" />
                                    <span className="text-base font-mono font-bold text-red-400">{formatLockoutTime(lockoutRemaining)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Failed attempts counter */}
                    {!isLockedOut && failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
                        <div className="mb-4 bg-amber-950/40 border border-amber-700/30 rounded-xl p-3 flex items-center gap-2.5">
                            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                            <p className="text-[11px] text-amber-300/90">
                                ভুল প্রচেষ্টা: <strong className="text-amber-200">{failedAttempts}/{MAX_ATTEMPTS}</strong> — আর {MAX_ATTEMPTS - failedAttempts} বার সুযোগ
                            </p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                এডমিন ইমেইল
                            </label>
                            <div className="relative">
                                <MailIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-800 border border-slate-700 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-white placeholder-slate-500"
                                    required
                                    disabled={isLockedOut}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                পাসওয়ার্ড
                            </label>
                            <div className="relative">
                                <LockIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full pl-10 pr-11 py-3 text-sm bg-slate-800 border border-slate-700 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-white placeholder-slate-500"
                                    required
                                    disabled={isLockedOut}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || isLockedOut}
                            className={`w-full py-3 font-semibold text-sm rounded-xl transition shadow-lg mt-2 flex items-center justify-center gap-2 ${
                                isLockedOut
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:scale-[0.98] text-white shadow-green-600/20'
                            } disabled:opacity-60`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    অথেনটিকেশন যাচাই হচ্ছে...
                                </>
                            ) : isLockedOut ? (
                                <>
                                    <Ban size={16} />
                                    সাময়িকভাবে লক করা হয়েছে
                                </>
                            ) : (
                                <>
                                    <ShieldCheckIcon size={16} />
                                    এডমিন প্যানেলে সাইন ইন করুন
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security footer */}
                    <div className="mt-6 pt-5 border-t border-slate-800">
                        <div className="flex items-start gap-2 text-slate-600">
                            <LockIcon size={12} className="shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-relaxed">
                                সেশন ২ ঘণ্টায় মেয়াদোত্তীর্ণ হবে। {MAX_ATTEMPTS} বার ভুল চেষ্টায় একাউন্ট লক হবে।
                                ব্রাউজার ফিঙ্গারপ্রিন্ট ও HMAC সিগনেচার দ্বারা সেশন যাচাই করা হয়।
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-slate-600 mt-4">
                        Our Store BD &copy; {new Date().getFullYear()} — Secured Admin Portal
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AdminLoginForm

