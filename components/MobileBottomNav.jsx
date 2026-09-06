'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { 
    Home, 
    LayoutGrid, 
    ShoppingBag, 
    Search, 
    User, 
    X, 
    ChevronRight, 
    Headphones, 
    Watch, 
    Speaker, 
    Camera, 
    Pen, 
    Monitor, 
    Ear, 
    Mouse, 
    Lamp, 
    Sparkles, 
    Tag, 
    TrendingUp 
} from 'lucide-react'

// Category icon mapper matching store design
const categoryIcons = {
    'Headphones': Headphones,
    'Watch': Watch,
    'Speakers': Speaker,
    'Camera': Camera,
    'Pen': Pen,
    'Theater': Monitor,
    'Earbuds': Ear,
    'Mouse': Mouse,
    'Decoration': Lamp,
    'Cleaner': Sparkles
};

// Popular trending search suggestions
const popularSearches = [
    'Smart Watch',
    'Wireless Earbuds',
    'Bluetooth Speaker',
    'Headphones',
    'Camera',
    'Mouse',
    'Power Bank'
];

export default function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()

    const [mounted, setMounted] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const searchInputRef = useRef(null)

    // Redux selectors
    const cartItems = useSelector(state => state.cart?.cartItems || {})
    const cartCount = Object.values(cartItems).reduce(
        (sum, item) => sum + (typeof item === 'number' ? item : (item?.quantity || 0)), 
        0
    )
    const { currentUser, isAuthenticated } = useSelector(state => state.user || {})
    const managedCategories = useSelector(state => state.category?.categories || [])

    const categories = [...managedCategories]
        .filter(c => c.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(c => c.name)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Close drawers on route change
    useEffect(() => {
        setIsMenuOpen(false)
        setIsSearchOpen(false)
    }, [pathname])

    // Body scroll lock when modals are open
    useEffect(() => {
        if (isMenuOpen || isSearchOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isMenuOpen, isSearchOpen])

    // Auto-focus search input when opened
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus()
            }, 100)
        }
    }, [isSearchOpen])

    const safeCartCount = mounted ? cartCount : 0
    const safeIsAuthenticated = mounted ? isAuthenticated : false

    const handleSearchSubmit = (e) => {
        e?.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
            setIsSearchOpen(false)
            setSearchQuery('')
        }
    }

    const handleQuickSearch = (keyword) => {
        router.push(`/shop?search=${encodeURIComponent(keyword)}`)
        setIsSearchOpen(false)
        setSearchQuery('')
    }

    // Active state checkers
    const isHomeActive = pathname === '/' && !isMenuOpen && !isSearchOpen
    const isCartActive = pathname === '/cart' && !isMenuOpen && !isSearchOpen
    const isAccountActive = (pathname.startsWith('/profile') || pathname === '/login') && !isMenuOpen && !isSearchOpen
    const isMenuTabActive = isMenuOpen || (pathname === '/shop' && !isSearchOpen)
    const isSearchTabActive = isSearchOpen

    return (
        <>
            {/* ================= BOTTOM NAVIGATION BAR ================= */}
            <nav 
                aria-label="Mobile Navigation Bar"
                className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] transition-all select-none"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}
            >
                <div className="grid grid-cols-5 h-[60px] items-stretch max-w-md mx-auto">
                    
                    {/* 1. HOME */}
                    <Link
                        href="/"
                        onClick={() => { setIsMenuOpen(false); setIsSearchOpen(false); }}
                        className={`flex flex-col items-center justify-center py-1 relative active:scale-95 transition-all duration-150 ${
                            isHomeActive ? 'text-green-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        aria-label="হোম পেজ"
                    >
                        <Home 
                            size={21} 
                            strokeWidth={isHomeActive ? 2.4 : 1.8} 
                            className={`transition-transform duration-200 ${isHomeActive ? 'scale-110' : ''}`} 
                        />
                        <span className={`text-[10px] uppercase tracking-wider mt-1 ${isHomeActive ? 'font-bold' : 'font-medium'}`}>
                            HOME
                        </span>
                        {isHomeActive && (
                            <span className="absolute top-1 w-1 h-1 bg-green-600 rounded-full" />
                        )}
                    </Link>

                    {/* 2. MENU */}
                    <button
                        type="button"
                        onClick={() => { setIsSearchOpen(false); setIsMenuOpen(!isMenuOpen); }}
                        className={`flex flex-col items-center justify-center py-1 relative active:scale-95 transition-all duration-150 cursor-pointer ${
                            isMenuTabActive ? 'text-green-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        aria-label="ক্যাটাগরি মেনু"
                        aria-expanded={isMenuOpen}
                    >
                        <LayoutGrid 
                            size={21} 
                            strokeWidth={isMenuTabActive ? 2.4 : 1.8} 
                            className={`transition-transform duration-200 ${isMenuTabActive ? 'scale-110' : ''}`} 
                        />
                        <span className={`text-[10px] uppercase tracking-wider mt-1 ${isMenuTabActive ? 'font-bold' : 'font-medium'}`}>
                            MENU
                        </span>
                        {isMenuTabActive && (
                            <span className="absolute top-1 w-1 h-1 bg-green-600 rounded-full" />
                        )}
                    </button>

                    {/* 3. CART */}
                    <Link
                        href="/cart"
                        onClick={() => { setIsMenuOpen(false); setIsSearchOpen(false); }}
                        className={`flex flex-col items-center justify-center py-1 relative active:scale-95 transition-all duration-150 ${
                            isCartActive ? 'text-green-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        aria-label={`শপিং কার্ট, ${safeCartCount} টি পণ্য`}
                    >
                        <div className="relative flex items-center justify-center">
                            <ShoppingBag 
                                size={21} 
                                strokeWidth={isCartActive ? 2.4 : 1.8} 
                                className={`transition-transform duration-200 ${isCartActive ? 'scale-110' : ''}`} 
                            />
                            {safeCartCount > 0 && (
                                <span className="absolute -top-1.5 -right-2.5 bg-green-600 text-white font-bold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-200">
                                    {safeCartCount > 99 ? '99+' : safeCartCount}
                                </span>
                            )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider mt-1 ${isCartActive ? 'font-bold' : 'font-medium'}`}>
                            CART
                        </span>
                        {isCartActive && (
                            <span className="absolute top-1 w-1 h-1 bg-green-600 rounded-full" />
                        )}
                    </Link>

                    {/* 4. SEARCH */}
                    <button
                        type="button"
                        onClick={() => { setIsMenuOpen(false); setIsSearchOpen(!isSearchOpen); }}
                        className={`flex flex-col items-center justify-center py-1 relative active:scale-95 transition-all duration-150 cursor-pointer ${
                            isSearchTabActive ? 'text-green-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        aria-label="সার্চ অপশন"
                        aria-expanded={isSearchOpen}
                    >
                        <Search 
                            size={21} 
                            strokeWidth={isSearchTabActive ? 2.4 : 1.8} 
                            className={`transition-transform duration-200 ${isSearchTabActive ? 'scale-110' : ''}`} 
                        />
                        <span className={`text-[10px] uppercase tracking-wider mt-1 ${isSearchTabActive ? 'font-bold' : 'font-medium'}`}>
                            SEARCH
                        </span>
                        {isSearchTabActive && (
                            <span className="absolute top-1 w-1 h-1 bg-green-600 rounded-full" />
                        )}
                    </button>

                    {/* 5. ACCOUNT */}
                    <Link
                        href={safeIsAuthenticated ? "/profile" : "/login?redirect=/profile"}
                        onClick={() => { setIsMenuOpen(false); setIsSearchOpen(false); }}
                        className={`flex flex-col items-center justify-center py-1 relative active:scale-95 transition-all duration-150 ${
                            isAccountActive ? 'text-green-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        aria-label="ব্যবহারকারীর একাউন্ট"
                    >
                        <User 
                            size={21} 
                            strokeWidth={isAccountActive ? 2.4 : 1.8} 
                            className={`transition-transform duration-200 ${isAccountActive ? 'scale-110' : ''}`} 
                        />
                        <span className={`text-[10px] uppercase tracking-wider mt-1 ${isAccountActive ? 'font-bold' : 'font-medium'}`}>
                            ACCOUNT
                        </span>
                        {isAccountActive && (
                            <span className="absolute top-1 w-1 h-1 bg-green-600 rounded-full" />
                        )}
                    </Link>

                </div>
            </nav>

            {/* ================= 2. MENU: CATEGORIES BOTTOM SHEET ================= */}
            {isMenuOpen && (
                <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setIsMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                    />

                    {/* Bottom Sheet Modal */}
                    <div 
                        className="relative bg-white rounded-t-3xl max-h-[80vh] flex flex-col z-10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
                        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
                    >
                        {/* Pull Indicator Handle */}
                        <div className="w-full pt-3 pb-1 flex justify-center cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full hover:bg-slate-300 transition" />
                        </div>

                        {/* Sheet Header */}
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                    <LayoutGrid size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">সকল ক্যাটাগরি</h3>
                                    <p className="text-[11px] text-slate-400">আপনার পছন্দের পণ্য সহজে খুঁজে নিন</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
                                aria-label="বন্ধ করুন"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Categories List / Grid */}
                        <div className="overflow-y-auto px-4 py-3 max-h-[55vh] space-y-1.5">
                            {categories.map((cat) => {
                                const IconComponent = categoryIcons[cat] || Tag
                                return (
                                    <Link
                                        key={cat}
                                        href={`/shop?search=${encodeURIComponent(cat)}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-between px-3.5 py-3 rounded-2xl border border-slate-100/80 bg-slate-50/50 hover:bg-green-50/70 hover:border-green-200 active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-600 group-hover:text-green-600">
                                                <IconComponent size={18} />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800">{cat}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400" />
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Footer: View All Shop Button */}
                        <div className="px-4 pt-2 pb-2 border-t border-slate-100 bg-white">
                            <Link
                                href="/shop"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 active:scale-98 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition"
                            >
                                <LayoutGrid size={16} />
                                সকল প্রোডাক্ট দেখুন (All Products)
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 4. SEARCH: QUICK SEARCH OVERLAY ================= */}
            {isSearchOpen && (
                <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-start animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setIsSearchOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                    />

                    {/* Search Drawer Panel */}
                    <div className="relative bg-white rounded-b-3xl shadow-2xl p-5 pt-6 z-10 animate-in slide-in-from-top duration-300">
                        {/* Header & Close */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Search size={18} className="text-green-600" />
                                <h3 className="text-base font-bold text-slate-800">পণ্য সার্চ করুন</h3>
                            </div>
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
                                aria-label="বন্ধ করুন"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search Input Form */}
                        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="স্মার্টওয়াচ, ইয়ারবাডস, গ্যাজেট খুঁজুন..."
                                className="w-full py-3.5 pl-11 pr-24 bg-slate-100 border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                            />
                            <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                            <button
                                type="submit"
                                className="absolute right-2 px-4 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs"
                            >
                                সার্চ
                            </button>
                        </form>

                        {/* Popular Searches / Trendings */}
                        <div className="mt-5">
                            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-2.5">
                                <TrendingUp size={13} className="text-green-600" />
                                জনপ্রিয় সার্চসমূহ:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {popularSearches.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => handleQuickSearch(item)}
                                        className="px-3 py-1.5 bg-slate-50 hover:bg-green-50 hover:text-green-700 text-slate-600 border border-slate-200/60 rounded-xl text-xs font-medium transition cursor-pointer active:scale-95"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
