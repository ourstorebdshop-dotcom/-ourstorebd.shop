'use client'

import { Search, ShoppingCart, MenuIcon, XIcon, User, LogOut, ShieldCheck, ChevronDown, Package, LayoutDashboard, Heart, Grid3X3, Headphones, Watch, Speaker, Camera, Pen, Monitor, Ear, Mouse, Sparkles, Lamp, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { logout } from "@/lib/features/user/userSlice";

const Navbar = () => {
    const router = useRouter();
    const dispatch = useDispatch();

    const [search, setSearch] = useState('');
    const [mobileMenu, setMobileMenu] = useState(false);
    const [userDropdown, setUserDropdown] = useState(false);
    const [categoryDropdown, setCategoryDropdown] = useState(false);
    const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef(null);
    const categoryRef = useRef(null);

    // Managed categories from Redux store (admin-controlled order & visibility)
    const managedCategories = useSelector(state => state.category?.categories || []);
    const categories = [...managedCategories]
        .filter(c => c.visible !== false)
        .sort((a, b) => a.order - b.order)
        .map(c => c.name);

    // Category icon mapping
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

    const cartItems = useSelector(state => state.cart.cartItems);
    const cartCount = Object.values(cartItems).reduce((sum, item) => sum + (typeof item === 'number' ? item : (item?.quantity || 0)), 0);
    const wishlistItems = useSelector(state => state.wishlist?.items || []);
    const wishlistCount = wishlistItems.length;
    const { currentUser, isAuthenticated } = useSelector(state => state.user);

    useEffect(() => {
        setMounted(true);
    }, []);

    const safeCartCount = mounted ? cartCount : 0;
    const safeWishlistCount = mounted ? wishlistCount : 0;
    const safeIsAuthenticated = mounted ? isAuthenticated : false;
    const safeCurrentUser = mounted ? currentUser : null;

    // Only actual admin (idrisrashel@gmail.com) has admin privileges
    const isAdminUser = safeCurrentUser?.email === 'idrisrashel@gmail.com' || safeCurrentUser?.role === 'ADMIN';

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setUserDropdown(false);
            }
            if (categoryRef.current && !categoryRef.current.contains(event.target)) {
                setCategoryDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Body scroll lock when mobile menu is open
    useEffect(() => {
        if (mobileMenu) {
            document.body.classList.add('body-scroll-lock');
        } else {
            document.body.classList.remove('body-scroll-lock');
        }
        return () => document.body.classList.remove('body-scroll-lock');
    }, [mobileMenu]);

    const closeMobileMenu = useCallback(() => setMobileMenu(false), []);

    const handleSearch = (e) => {
        e.preventDefault();
        router.push(`/shop?search=${search}`);
        closeMobileMenu();
    };

    const handleLogout = () => {
        dispatch(logout());
        setUserDropdown(false);
        setMobileMenu(false);
        toast.success("লগআউট সফল হয়েছে");
        router.push("/login");
    };

    return (
        <nav className="bg-white sticky top-0 z-40 shadow-xs border-b border-slate-100">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-3.5 transition-all">

                    <Link href="/" className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                        <span className="text-green-600">Our</span> Store <span className="text-green-600">BD</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-7 text-sm font-medium text-slate-600">
                        <Link href="/" className="hover:text-green-600 transition">Home</Link>
                        <Link href="/shop" className="hover:text-green-600 transition">Shop</Link>

                        {/* Categories Dropdown */}
                        <div className="relative" ref={categoryRef}>
                            <button
                                onClick={() => setCategoryDropdown(!categoryDropdown)}
                                onMouseEnter={() => setCategoryDropdown(true)}
                                className={`flex items-center gap-1 hover:text-green-600 transition cursor-pointer ${
                                    categoryDropdown ? 'text-green-600' : ''
                                }`}
                            >
                                Categories
                                <ChevronDown size={14} className={`transition-transform duration-200 ${categoryDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {categoryDropdown && (
                                <div
                                    onMouseLeave={() => setCategoryDropdown(false)}
                                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-[fadeIn_0.15s_ease-out]"
                                >
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Categories</p>
                                    </div>
                                    <div className="py-1 max-h-72 overflow-y-auto">
                                        {categories.map((cat) => {
                                            const IconComp = categoryIcons[cat] || Tag;
                                            return (
                                                <Link
                                                    key={cat}
                                                    href={`/shop?search=${encodeURIComponent(cat)}`}
                                                    onClick={() => setCategoryDropdown(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 transition"
                                                >
                                                    <IconComp size={15} className="text-slate-400" />
                                                    {cat}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t border-slate-100 pt-1 mt-1">
                                        <Link
                                            href="/shop"
                                            onClick={() => setCategoryDropdown(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition"
                                        >
                                            <Grid3X3 size={15} />
                                            সকল প্রোডাক্ট দেখুন
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link href="/about" className="hover:text-green-600 transition">About</Link>
                        <Link href="/contact" className="hover:text-green-600 transition">Contact</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-64 text-sm gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200/50 focus-within:border-green-500 transition">
                            <Search size={16} className="text-slate-400" />
                            <input 
                                className="w-full bg-transparent outline-none placeholder-slate-400 text-xs" 
                                type="text" 
                                placeholder="Search products..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                            />
                        </form>

                        <Link href="/profile?tab=wishlist" className="relative flex items-center gap-1.5 text-slate-700 hover:text-rose-500 transition font-medium" title="পছন্দের তালিকা">
                            <Heart size={19} className={safeWishlistCount > 0 ? "text-rose-500 fill-rose-500" : "text-slate-600"} />
                            <span className="hidden lg:inline">Wishlist</span>
                            {safeWishlistCount > 0 && (
                                <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                                    {safeWishlistCount}
                                </span>
                            )}
                        </Link>

                        <Link href="/cart" className="relative flex items-center gap-1.5 text-slate-700 hover:text-green-600 transition font-medium">
                            <ShoppingCart size={19} />
                            <span>Cart</span>
                            {safeCartCount > 0 && (
                                <span className="text-[10px] font-bold text-white bg-green-600 px-1.5 py-0.5 rounded-full">
                                    {safeCartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Profile / Auth button */}
                        {safeIsAuthenticated && safeCurrentUser ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setUserDropdown(!userDropdown)}
                                    className="flex items-center gap-2 py-1 px-2.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                                >
                                    <img
                                        src={safeCurrentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                                        alt={safeCurrentUser.name}
                                        className="w-7 h-7 rounded-full object-cover border border-green-500"
                                    />
                                    <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                                        {safeCurrentUser.name}
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400" />
                                </button>

                                {/* Dropdown Menu */}
                                {userDropdown && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-[fadeIn_0.15s_ease-out]">
                                        <div className="px-4 py-2.5 border-b border-slate-100">
                                            <p className="text-xs font-bold text-slate-800 truncate">{safeCurrentUser.name}</p>
                                            <p className="text-[11px] text-slate-400 truncate">{safeCurrentUser.email || safeCurrentUser.phone}</p>
                                        </div>

                                        <div className="py-1">
                                            <Link
                                                href="/profile?tab=overview"
                                                onClick={() => setUserDropdown(false)}
                                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-green-600 transition"
                                            >
                                                <LayoutDashboard size={15} />
                                                কাস্টমার ড্যাশবোর্ড
                                            </Link>

                                            <Link
                                                href="/profile?tab=orders"
                                                onClick={() => setUserDropdown(false)}
                                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-green-600 transition"
                                            >
                                                <Package size={15} />
                                                আমার অর্ডারসমূহ
                                            </Link>

                                            <Link
                                                href="/profile?tab=wishlist"
                                                onClick={() => setUserDropdown(false)}
                                                className="flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Heart size={15} className="text-rose-500" fill={safeWishlistCount > 0 ? '#f43f5e' : 'none'} />
                                                    পছন্দের তালিকা
                                                </div>
                                                {safeWishlistCount > 0 && (
                                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full">
                                                        {safeWishlistCount}
                                                    </span>
                                                )}
                                            </Link>

                                            {/* Only actual admin can see admin panel link */}
                                            {isAdminUser && (
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setUserDropdown(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                                                >
                                                    <ShieldCheck size={15} className="text-indigo-500" />
                                                    এডমিন কন্ট্রোল প্যানেল
                                                </Link>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100 pt-1 mt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                                            >
                                                <LogOut size={15} />
                                                লগআউট (Logout)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-medium rounded-full transition shadow-sm flex items-center gap-1.5"
                            >
                                Login
                            </Link>
                        )}

                    </div>

                    {/* Mobile Header Icons */}
                    <div className="sm:hidden flex items-center gap-2">
                        <Link href="/profile?tab=wishlist" className="relative flex items-center p-1.5 text-slate-600">
                            <Heart size={20} className={safeWishlistCount > 0 ? "text-rose-500 fill-rose-500" : ""} />
                            {safeWishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-[9px] font-bold text-white bg-rose-500 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full">
                                    {safeWishlistCount}
                                </span>
                            )}
                        </Link>
                        <Link href="/cart" className="relative flex items-center p-1.5 text-slate-600">
                            <ShoppingCart size={20} />
                            {safeCartCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-[9px] font-bold text-white bg-green-600 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full">
                                    {safeCartCount}
                                </span>
                            )}
                        </Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
                            {mobileMenu ? <XIcon size={24} /> : <MenuIcon size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Backdrop + Overlay */}
            {mobileMenu && (
                <>
                    {/* Backdrop */}
                    <div 
                        onClick={closeMobileMenu} 
                        className="sm:hidden fixed inset-0 top-[57px] bg-black/30 backdrop-blur-xs z-40"
                    />
                    {/* Menu Panel */}
                    <div className="sm:hidden fixed top-[57px] left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto">
                        <div className="flex flex-col p-5 pb-8 gap-2 text-slate-600 text-sm">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-xl mb-2">
                                <Search size={18} className="text-slate-400 shrink-0" />
                                <input 
                                    className="w-full bg-transparent outline-none placeholder-slate-400" 
                                    type="text" 
                                    placeholder="Search products..." 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                />
                            </form>
                            
                            <Link href="/" onClick={closeMobileMenu} className="py-3 px-2 border-b border-slate-100 font-medium active:bg-slate-50 rounded-lg">Home</Link>
                            <Link href="/shop" onClick={closeMobileMenu} className="py-3 px-2 border-b border-slate-100 font-medium active:bg-slate-50 rounded-lg">Shop</Link>

                            {/* Mobile Categories Accordion */}
                            <div className="border-b border-slate-100">
                                <button
                                    onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                                    className="w-full py-3 px-2 font-medium flex items-center justify-between active:bg-slate-50 rounded-lg text-left"
                                >
                                    <span className="flex items-center gap-2">
                                        <Grid3X3 size={16} className="text-green-600" />
                                        Categories
                                    </span>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${mobileCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {mobileCategoryOpen && (
                                    <div className="pl-4 pb-2 space-y-0.5 animate-[fadeIn_0.15s_ease-out]">
                                        {categories.map((cat) => {
                                            const IconComp = categoryIcons[cat] || Tag;
                                            return (
                                                <Link
                                                    key={cat}
                                                    href={`/shop?search=${encodeURIComponent(cat)}`}
                                                    onClick={() => { closeMobileMenu(); setMobileCategoryOpen(false); }}
                                                    className="flex items-center gap-2.5 py-2.5 px-3 text-sm text-slate-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                                                >
                                                    <IconComp size={15} className="text-slate-400" />
                                                    {cat}
                                                </Link>
                                            );
                                        })}
                                        <Link
                                            href="/shop"
                                            onClick={() => { closeMobileMenu(); setMobileCategoryOpen(false); }}
                                            className="flex items-center gap-2.5 py-2.5 px-3 text-sm font-semibold text-green-700 hover:bg-green-50 rounded-lg transition"
                                        >
                                            <Grid3X3 size={15} />
                                            সকল প্রোডাক্ট দেখুন
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <Link href="/about" onClick={closeMobileMenu} className="py-3 px-2 border-b border-slate-100 font-medium active:bg-slate-50 rounded-lg">About</Link>
                            <Link href="/contact" onClick={closeMobileMenu} className="py-3 px-2 border-b border-slate-100 font-medium active:bg-slate-50 rounded-lg">Contact</Link>
                            <Link href="/profile?tab=wishlist" onClick={closeMobileMenu} className="py-3 px-2 border-b border-slate-100 font-medium text-rose-600 flex items-center justify-between active:bg-rose-50 rounded-lg">
                                <span>পছন্দের তালিকা (Wishlist)</span>
                                <div className="flex items-center gap-1.5">
                                    <Heart size={16} fill={safeWishlistCount > 0 ? '#f43f5e' : 'none'} />
                                    {safeWishlistCount > 0 && (
                                        <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                                            {safeWishlistCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                            
                            {safeIsAuthenticated && safeCurrentUser ? (
                                <>
                                    <Link href="/profile" onClick={closeMobileMenu} className="py-3 px-2 border-b border-slate-100 font-medium text-green-700 flex items-center justify-between active:bg-green-50 rounded-lg">
                                        <span>আমার প্রোফাইল ({safeCurrentUser.name})</span>
                                        <User size={18} />
                                    </Link>
                                    <Link href="/profile?tab=orders" onClick={closeMobileMenu} className="py-3 px-2 border-b border-slate-100 font-medium flex items-center justify-between active:bg-slate-50 rounded-lg">
                                        <span>আমার অর্ডারসমূহ</span>
                                        <Package size={18} />
                                    </Link>
                                </>
                            ) : null}

                            {/* Admin Link only for real admin */}
                            {isAdminUser && (
                                <Link href="/admin" onClick={closeMobileMenu} className="py-3 px-2 border-b border-slate-100 font-medium text-indigo-600 flex items-center justify-between active:bg-indigo-50 rounded-lg">
                                    <span>এডমিন প্যানেল (Admin Portal)</span>
                                    <ShieldCheck size={18} />
                                </Link>
                            )}

                            {isAuthenticated && currentUser ? (
                                <button 
                                    onClick={handleLogout} 
                                    className="w-full py-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-xl font-semibold transition mt-3 flex items-center justify-center gap-2"
                                >
                                    <LogOut size={18} />
                                    লগআউট
                                </button>
                            ) : (
                                <Link 
                                    href="/login" 
                                    onClick={closeMobileMenu} 
                                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-full font-semibold transition mt-3 text-center block"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
};

export default Navbar;