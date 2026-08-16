'use client'
import { Search, ShoppingCart, MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const Navbar = () => {

    const router = useRouter();

    const [search, setSearch] = useState('')
    const [mobileMenu, setMobileMenu] = useState(false)
    const cartCount = useSelector(state => state.cart.total)

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
        setMobileMenu(false)
    }

    const handleLogin = () => {
        toast('Login feature coming soon!', { icon: '🔒' })
    }

    return (
        <nav className="relative bg-white">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4  transition-all">

                    <Link href="/" className="text-4xl font-semibold text-slate-700">
                        <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/">Home</Link>
                        <Link href="/shop">Shop</Link>
                        <Link href="/#specs">About</Link>
                        <Link href="/#newsletter">Contact</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600">
                            <ShoppingCart size={18} />
                            Cart
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                        </Link>

                        <button onClick={handleLogin} className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full">
                            Login
                        </button>

                    </div>

                    {/* Mobile Menu Button */}
                    <div className="sm:hidden flex items-center gap-3">
                        <Link href="/cart" className="relative flex items-center gap-1 text-slate-600">
                            <ShoppingCart size={18} />
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                        </Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="text-slate-600 p-1">
                            {mobileMenu ? <XIcon size={24} /> : <MenuIcon size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenu && (
                <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 animate-[slideDown_0.2s_ease-out]">
                    <div className="flex flex-col p-6 gap-4 text-slate-600">
                        <form onSubmit={handleSearch} className="flex items-center text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>
                        <Link href="/" onClick={() => setMobileMenu(false)} className="py-2 border-b border-slate-100">Home</Link>
                        <Link href="/shop" onClick={() => setMobileMenu(false)} className="py-2 border-b border-slate-100">Shop</Link>
                        <Link href="/orders" onClick={() => setMobileMenu(false)} className="py-2 border-b border-slate-100">My Orders</Link>
                        <button onClick={() => { handleLogin(); setMobileMenu(false); }} className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition mt-2">
                            Login
                        </button>
                    </div>
                </div>
            )}

            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar