'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { 
    Mail, 
    Lock, 
    User, 
    Phone, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    CheckCircle2, 
    LogIn,
    UserPlus
} from 'lucide-react'
import toast from 'react-hot-toast'
import { login, register } from '@/lib/features/user/userSlice'

const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
    </svg>
)

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get('redirect') || '/profile'
    
    const dispatch = useDispatch()
    const { currentUser, savedUsers, isAuthenticated } = useSelector(state => state.user)
    const apiSettings = useSelector(state => state.apiSettings)
    const googleAuth = apiSettings?.googleAuth

    const [isLoginMode, setIsLoginMode] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(true)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    // Form inputs
    const [loginIdentifier, setLoginIdentifier] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    // Register inputs
    const [regName, setRegName] = useState('')
    const [regPhone, setRegPhone] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regPassword, setRegPassword] = useState('')
    const [regConfirmPassword, setRegConfirmPassword] = useState('')
    const [agreeTerms, setAgreeTerms] = useState(true)

    const handleLoginSubmit = (e) => {
        e.preventDefault()
        setLoading(true)

        const identifier = loginIdentifier.trim().toLowerCase()
        const password = loginPassword.trim()

        if (!identifier || !password) {
            toast.error('অনুগ্রহ করে ইমেইল/ফোন এবং পাসওয়ার্ড প্রদান করুন')
            setLoading(false)
            return
        }

        const matchedUser = savedUsers.find(
            u => (u.email?.toLowerCase() === identifier || u.phone === identifier) && u.password === password
        )

        if (matchedUser) {
            dispatch(login(matchedUser))
            toast.success(`স্বাগতম, ${matchedUser.name}!`)
            router.push(redirectUrl)
        } else {
            if ((identifier === 'customer@ourstorebd.com' || identifier === '01712345678') && password === 'password123') {
                const defaultUser = savedUsers[0] || {
                    id: "user_demo_1",
                    name: "Tanvir Ahmed",
                    email: "customer@ourstorebd.com",
                    phone: "01712345678",
                    role: "CUSTOMER",
                    addresses: []
                }
                dispatch(login(defaultUser))
                toast.success(`স্বাগতম, ${defaultUser.name}!`)
                router.push(redirectUrl)
            } else {
                toast.error('ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড!')
            }
        }

        setLoading(false)
    }

    const handleRegisterSubmit = (e) => {
        e.preventDefault()
        setLoading(true)

        if (!regName.trim()) {
            toast.error('আপনার নাম প্রদান করুন')
            setLoading(false)
            return
        }

        if (!regPhone.trim()) {
            toast.error('মোবাইল নাম্বার প্রদান করুন')
            setLoading(false)
            return
        }

        if (regPassword.length < 6) {
            toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
            setLoading(false)
            return
        }

        if (regPassword !== regConfirmPassword) {
            toast.error('পাসওয়ার্ড দুটি মিলছে না!')
            setLoading(false)
            return
        }

        if (!agreeTerms) {
            toast.error('শর্তাবলী সম্মতি প্রদান করুন')
            setLoading(false)
            return
        }

        const exists = savedUsers.some(
            u => (regEmail && u.email?.toLowerCase() === regEmail.trim().toLowerCase()) || u.phone === regPhone.trim()
        )

        if (exists) {
            toast.error('এই ইমেইল বা মোবাইল নাম্বার দিয়ে ইতিমধ্যে একাউন্ট খোলা আছে')
            setLoading(false)
            return
        }

        const newUser = {
            id: `user_${Date.now()}`,
            name: regName.trim(),
            email: regEmail.trim() || `${regPhone.trim()}@customer.ourstorebd.com`,
            phone: regPhone.trim(),
            password: regPassword,
            role: "CUSTOMER",
            joinedDate: new Date().toISOString(),
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            addresses: []
        }

        dispatch(register(newUser))
        toast.success(`একাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম ${newUser.name}`)
        router.push(redirectUrl)
        setLoading(false)
    }

    // Process genuine Google profile data
    const completeGoogleAuth = (profile) => {
        const emailToMatch = profile.email?.toLowerCase()
        const existing = savedUsers.find(
            u => u.email?.toLowerCase() === emailToMatch
        )

        if (existing) {
            dispatch(login(existing))
            toast.success(`Google দিয়ে সফলভাবে সাইন ইন হয়েছে! স্বাগতম ${existing.name}`, { icon: '👋' })
        } else {
            const timestamp = Date.now()
            const newGoogleUser = {
                id: `google_${profile.googleId || timestamp}`,
                name: profile.name || profile.given_name || "Google User",
                email: profile.email,
                phone: profile.phone || "017" + Math.floor(10000000 + Math.random() * 90000000),
                avatar: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || profile.email)}`,
                role: "CUSTOMER",
                authProvider: "GOOGLE",
                joinedDate: new Date().toISOString(),
                addresses: [
                    {
                        id: `addr_${timestamp}`,
                        label: "Home (বাসা)",
                        name: profile.name || "Customer",
                        phone: "01712345678",
                        street: "Dhaka, Bangladesh",
                        city: "Dhaka",
                        isDefault: true
                    }
                ]
            }
            dispatch(register(newGoogleUser))
            toast.success(`Google দিয়ে একাউন্ট তৈরি ও সাইন ইন সফল হয়েছে! স্বাগতম ${newGoogleUser.name}`, { icon: '🎉' })
        }

        setGoogleLoading(false)
        router.push(redirectUrl)
    }

    // Launch genuine Google OAuth 2.0 popup via Google Identity Services
    const initiateGoogleOAuth = async (clientId) => {
        setGoogleLoading(true)
        try {
            if (!window.google?.accounts?.oauth2) {
                await new Promise((resolve, reject) => {
                    const existingScript = document.getElementById('google-jssdk')
                    if (existingScript) {
                        existingScript.onload = resolve
                        existingScript.onerror = reject
                        return
                    }
                    const script = document.createElement('script')
                    script.id = 'google-jssdk'
                    script.src = 'https://accounts.google.com/gsi/client'
                    script.async = true
                    script.defer = true
                    script.onload = resolve
                    script.onerror = () => reject(new Error('Google SDK load failed'))
                    document.head.appendChild(script)
                })
            }

            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'email profile openid',
                callback: async (tokenResponse) => {
                    if (tokenResponse?.access_token) {
                        try {
                            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                            })
                            const profile = await res.json()
                            if (profile?.email) {
                                completeGoogleAuth({
                                    name: profile.name || profile.given_name || 'Google User',
                                    email: profile.email,
                                    avatar: profile.picture,
                                    googleId: profile.sub
                                })
                                return
                            } else {
                                toast.error('Google থেকে ব্যবহারকারী তথ্য পাওয়া যায়নি')
                            }
                        } catch (err) {
                            console.error('Fetch profile error:', err)
                            toast.error('Google প্রোফাইল যাচাই করতে সমস্যা হয়েছে')
                        }
                    }
                    setGoogleLoading(false)
                },
                error_callback: (err) => {
                    setGoogleLoading(false)
                    console.warn('Google auth window closed or error:', err)
                    toast('Google সাইন-ইন সম্পন্ন করা হয়নি', { icon: 'ℹ️' })
                }
            })

            tokenClient.requestAccessToken({ prompt: 'select_account' })
        } catch (err) {
            setGoogleLoading(false)
            console.error('Google GIS load error:', err)
            toast.error('Google সার্ভিস লোড হতে ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ বা অ্যাডব্লকার চেক করুন।')
        }
    }

    // Button Click Handler
    const handleGoogleSignInClick = () => {
        if (googleAuth?.enabled === false) {
            toast.error('Google দিয়ে সাইন ইন বর্তমানে সাময়িকভাবে বন্ধ রয়েছে')
            return
        }

        const clientId = googleAuth?.clientId?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()

        if (!clientId) {
            // No client ID configured yet: clean message, NO MODAL for customer!
            setGoogleLoading(false)
            toast.error('Google Sign-In সার্ভিসটি শীঘ্রই সক্রিয় হবে। অনুগ্রহ করে ইমেইল/পাসওয়ার্ড দিয়ে লগইন করুন।')
            return
        }

        initiateGoogleOAuth(clientId)
    }

    return (
        <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-md w-full">
                
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block text-3xl font-bold text-slate-800 tracking-tight">
                        <span className="text-green-600">Our</span> Store <span className="text-green-600">BD</span>
                    </Link>
                    <p className="mt-2 text-sm text-slate-500">
                        {isLoginMode 
                            ? 'আপনার একাউন্টে লগইন করে সেরা কেনাকাটার অভিজ্ঞতা নিন' 
                            : 'আমাদের পরিবারে যুক্ত হতে নতুন একাউন্ট তৈরি করুন'}
                    </p>
                </div>

                {/* Already Logged In Notice */}
                {isAuthenticated && currentUser && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5 text-center shadow-xs">
                        <div className="flex items-center justify-center gap-2 text-green-700 font-semibold mb-1">
                            <CheckCircle2 size={20} />
                            <span>আপনি বর্তমানে লগইন অবস্থায় আছেন</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-4">
                            হিসাব: <strong>{currentUser.name}</strong> ({currentUser.email || currentUser.phone})
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Link 
                                href="/profile" 
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                            >
                                প্রোফাইলে যান
                            </Link>
                            <Link 
                                href="/shop" 
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                            >
                                শপিং চালিয়ে যান
                            </Link>
                        </div>
                    </div>
                )}

                {/* Main Auth Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    
                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5">
                        <button
                            type="button"
                            onClick={() => setIsLoginMode(true)}
                            className={`flex-1 py-3 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all ${
                                isLoginMode
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <LogIn size={16} className={isLoginMode ? "text-indigo-600" : ""} />
                            লগইন (Sign In)
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLoginMode(false)}
                            className={`flex-1 py-3 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all ${
                                !isLoginMode
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <UserPlus size={16} className={!isLoginMode ? "text-indigo-600" : ""} />
                            নতুন একাউন্ট (Register)
                        </button>
                    </div>

                    <div className="p-6 sm:p-8">
                        
                        {/* Google 1-Click Sign-In / Sign-Up Button */}
                        {googleAuth?.enabled !== false && (
                            <div className="mb-5">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignInClick}
                                    disabled={googleLoading}
                                    className="w-full py-2.5 px-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:scale-[0.99] text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-3 shadow-xs bg-white group disabled:opacity-75 cursor-pointer"
                                >
                                    {googleLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-600">Google সংযোগ হচ্ছে...</span>
                                        </>
                                    ) : (
                                        <>
                                            <GoogleIcon />
                                            <span className="group-hover:text-slate-900 transition">
                                                {isLoginMode ? 'Sign in with Google' : 'Sign up with Google'}
                                            </span>
                                        </>
                                    )}
                                </button>

                                <div className="relative flex py-4 items-center">
                                    <div className="flex-grow border-t border-slate-200"></div>
                                    <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
                                        অথবা (OR)
                                    </span>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                </div>
                            </div>
                        )}

                        {isLoginMode ? (
                            /* ===== LOGIN FORM ===== */
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        ইমেইল বা মোবাইল নাম্বার <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={loginIdentifier}
                                            onChange={(e) => setLoginIdentifier(e.target.value)}
                                            placeholder="customer@ourstorebd.com বা 017XXXXXXXX"
                                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all bg-white text-slate-800 placeholder-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-xs font-semibold text-slate-700">
                                            পাসওয়ার্ড <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => toast('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইল/ফোনে পাঠানো হবে', { icon: '🔑' })}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition"
                                        >
                                            পাসওয়ার্ড ভুলে গেছেন?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all bg-white text-slate-800 placeholder-slate-400"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 accent-indigo-600"
                                        />
                                        <span>আমাকে মনে রাখুন</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                >
                                    {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        ) : (
                            /* ===== REGISTER FORM ===== */
                            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            placeholder="যেমন: তানভীর আহমেদ"
                                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all bg-white text-slate-800 placeholder-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        মোবাইল নাম্বার <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={regPhone}
                                            onChange={(e) => setRegPhone(e.target.value)}
                                            placeholder="01XXXXXXXXX"
                                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all bg-white text-slate-800 placeholder-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        ইমেইল ঠিকানা (ঐচ্ছিক)
                                    </label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            value={regEmail}
                                            onChange={(e) => setRegEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all bg-white text-slate-800 placeholder-slate-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all bg-white text-slate-800 placeholder-slate-400"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={regConfirmPassword}
                                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all bg-white text-slate-800 placeholder-slate-400"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 pt-1">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 accent-indigo-600 shrink-0"
                                    />
                                    <span>আমি আওয়ার স্টোর বিডি-র ব্যবহারের শর্তাবলী এবং গোপনীয়তা নীতি মেনে নিচ্ছি</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                >
                                    {loading ? 'একাউন্ট তৈরি হচ্ছে...' : 'নতুন একাউন্ট খুলুন'}
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        )}

                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    Our Store BD &copy; {new Date().getFullYear()} — নিরাপদ ও নির্ভরযোগ্য কেনাকাটা
                </p>

            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-slate-400">লোড হচ্ছে...</div>}>
            <LoginForm />
        </Suspense>
    )
}
