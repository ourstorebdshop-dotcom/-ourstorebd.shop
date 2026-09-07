'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { deleteItemFromCart, clearCart } from '@/lib/features/cart/cartSlice'
import Counter from '@/components/Counter'
import toast from 'react-hot-toast'
import { 
    Trash2Icon, 
    ShoppingBag, 
    Zap, 
    ArrowRight, 
    ArrowLeft, 
    ShieldCheck, 
    Truck, 
    RotateCcw,
    Lock,
    Package
} from 'lucide-react'

const getItemImage = (item) => {
    if (!item) return '/placeholder.svg'
    let img = null
    if (Array.isArray(item.images) && item.images.length > 0) {
        img = item.images[0]
    } else if (typeof item.images === 'string' && item.images.trim()) {
        img = item.images
    } else if (item.image) {
        img = item.image
    }
    if (!img) return '/placeholder.svg'
    const srcStr = typeof img === 'object' && img.src ? img.src : String(img)
    const match = srcStr.match(/product_img(\d+)/)
    if (match && srcStr.includes('/_next/')) {
        return `/products/product_img${match[1]}.png`
    }
    return srcStr
}

const isPhoto = (src) => {
    if (!src) return false
    const s = typeof src === 'object' && src.src ? src.src : String(src)
    if (s.includes('product_img') || s.endsWith('.png')) {
        return false
    }
    return true
}

export default function CartPage() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()

    const { cartItems } = useSelector(state => state.cart)
    const products = useSelector(state => state.product.list)
    const shippingSettings = useSelector(state => state.shipping)

    const [cartArray, setCartArray] = useState([])
    const [totalPrice, setTotalPrice] = useState(0)

    useEffect(() => {
        document.title = "Shopping Cart - Our Store BD | Review Your Items"
    }, [])

    useEffect(() => {
        let total = 0
        const items = []
        for (const [key, value] of Object.entries(cartItems)) {
            const product = products.find(p => p.id === key)
            if (product) {
                const qty = typeof value === 'number' ? value : value.quantity
                const color = typeof value === 'object' ? value.color : null
                const size = typeof value === 'object' ? value.size : null
                items.push({
                    ...product,
                    quantity: qty,
                    selectedColor: color,
                    selectedSize: size,
                })
                total += product.price * qty
            }
        }
        setCartArray(items)
        setTotalPrice(total)
    }, [cartItems, products])

    const handleDeleteItem = (productId, name) => {
        dispatch(deleteItemFromCart({ productId }))
        toast.success(`"${name || 'পণ্য'}" কার্ট থেকে সরানো হয়েছে`)
    }

    const handleClearCart = () => {
        if (confirm('আপনি কি নিশ্চিত যে আপনার পুরো কার্ট খালি করতে চান?')) {
            dispatch(clearCart())
            toast.success('কার্ট সফলভাবে খালি করা হয়েছে')
        }
    }

    const insideCost = shippingSettings?.insideDhaka?.cost || 70
    const outsideCost = shippingSettings?.outsideDhaka?.cost || 120

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Breadcrumb Bar */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="hover:text-green-600 transition">Home</Link>
                        <span>/</span>
                        <span className="text-green-600 font-semibold">Shopping Cart</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                        <Lock size={13} className="text-green-600" />
                        <span>নিরাপদ শপিং কার্ট</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
                {cartArray.length > 0 ? (
                    <div>
                        {/* Title Bar */}
                        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                                    <ShoppingBag className="text-green-600" size={28} />
                                    <span>আমার শপিং কার্ট (My Cart)</span>
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    কার্টে মোট <span className="font-bold text-slate-800">{cartArray.length}</span> টি পণ্য রয়েছে। পরিমাণ পরিবর্তন বা অর্ডার করতে পরবর্তী ধাপে যান।
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 self-start sm:self-auto">
                                <Link 
                                    href="/shop"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-green-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition shadow-2xs"
                                >
                                    <ArrowLeft size={14} />
                                    <span>আরও পণ্য যোগ করুন</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleClearCart}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 bg-white border border-red-200 px-3 py-2 rounded-xl transition cursor-pointer"
                                    title="কার্ট খালি করুন"
                                >
                                    <RotateCcw size={13} />
                                    <span>কার্ট খালি করুন</span>
                                </button>
                            </div>
                        </div>

                        {/* Cart Layout: 8 Cols (Items Table) + 4 Cols (Summary) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            
                            {/* Left Column: Cart Items Table (8 cols) */}
                            <div className="lg:col-span-8">
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                                    
                                    {/* Desktop & Tablet Table */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-slate-700 text-sm">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    <th className="py-4 px-6 text-left">প্রোডাক্ট</th>
                                                    <th className="py-4 px-4 text-center">পরিমাণ</th>
                                                    <th className="py-4 px-4 text-right">মোট মূল্য</th>
                                                    <th className="py-4 px-4 text-center w-16">মুছুন</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {cartArray.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/40 transition">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-4">
                                                                <Link 
                                                                    href={`/product/${item.id}`}
                                                                    className="relative size-18 rounded-2xl border border-slate-200/80 bg-slate-50 overflow-hidden shadow-2xs shrink-0 flex items-center justify-center group"
                                                                >
                                                                    <Image 
                                                                        src={getItemImage(item)} 
                                                                        alt={item.name || 'Product'} 
                                                                        fill
                                                                        sizes="72px"
                                                                        className={`transition-transform duration-200 group-hover:scale-105 ${
                                                                            isPhoto(getItemImage(item))
                                                                                ? 'object-cover'
                                                                                : 'object-contain p-1.5'
                                                                        }`}
                                                                        onError={(e) => {
                                                                            e.currentTarget.src = '/placeholder.svg'
                                                                        }}
                                                                    />
                                                                </Link>
                                                                <div>
                                                                    <Link 
                                                                        href={`/product/${item.id}`}
                                                                        className="font-semibold text-slate-800 hover:text-green-600 transition line-clamp-1 text-sm sm:text-base"
                                                                    >
                                                                        {item.name}
                                                                    </Link>
                                                                    <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="font-bold text-slate-900 text-sm">{currency}{item.price}</span>
                                                                        {item.selectedColor && (
                                                                            <span 
                                                                                className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" 
                                                                                style={{ backgroundColor: item.selectedColor }} 
                                                                                title={item.selectedColor} 
                                                                            />
                                                                        )}
                                                                        {item.selectedSize && (
                                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                                                                {item.selectedSize}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <div className="inline-block">
                                                                <Counter productId={item.id} />
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-right font-bold text-slate-900 text-sm sm:text-base whitespace-nowrap">
                                                            {currency}{(item.price * item.quantity).toLocaleString()}
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <button 
                                                                type="button"
                                                                onClick={() => handleDeleteItem(item.id, item.name)} 
                                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer"
                                                                title="কার্ট থেকে বাদ দিন"
                                                            >
                                                                <Trash2Icon size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Responsive Cards */}
                                    <div className="sm:hidden divide-y divide-slate-100 p-4">
                                        {cartArray.map((item) => (
                                            <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                                                <div className="flex gap-3 items-center">
                                                    <Link 
                                                        href={`/product/${item.id}`}
                                                        className="relative size-16 rounded-xl border border-slate-200/80 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center"
                                                    >
                                                        <Image 
                                                            src={getItemImage(item)} 
                                                            alt={item.name || 'Product'} 
                                                            fill
                                                            sizes="64px"
                                                            className={isPhoto(getItemImage(item)) ? 'object-cover' : 'object-contain p-1'}
                                                        />
                                                    </Link>
                                                    <div className="flex-1 min-w-0">
                                                        <Link 
                                                            href={`/product/${item.id}`}
                                                            className="font-semibold text-slate-800 text-xs line-clamp-1"
                                                        >
                                                            {item.name}
                                                        </Link>
                                                        <p className="text-[11px] text-slate-400">{item.category}</p>
                                                        <p className="text-xs font-bold text-slate-900 mt-0.5">{currency}{item.price}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <Counter productId={item.id} />
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-sm text-slate-900">
                                                            {currency}{(item.price * item.quantity).toLocaleString()}
                                                        </span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDeleteItem(item.id, item.name)} 
                                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                                                        >
                                                            <Trash2Icon size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom Info inside Left Card */}
                                    <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-green-600" />
                                            <span>প্রতিটি পণ্য ১০০% আসল ও ওয়ারেন্টিযুক্ত</span>
                                        </div>
                                        <Link 
                                            href="/shop" 
                                            className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                                        >
                                            <span>আরও পণ্য দেখুন</span>
                                            <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Dedicated Cart Summary Card (4 cols) */}
                            <div className="lg:col-span-4">
                                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md sticky top-24 space-y-5">
                                    
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <h2 className="text-lg font-bold text-slate-900">
                                            অর্ডার সারাংশ
                                        </h2>
                                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                                            {cartArray.length} টি পণ্য
                                        </span>
                                    </div>

                                    {/* Financial Breakdown */}
                                    <div className="space-y-3 text-sm text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span>পণ্যের মোট মূল্য (Subtotal):</span>
                                            <span className="font-bold text-slate-900 text-base">
                                                {currency}{totalPrice.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span>আনুমানিক ডেলিভারি চার্জ:</span>
                                            <span className="font-semibold text-slate-700">
                                                {currency}{insideCost} - {currency}{outsideCost}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                                            💡 ঢাকার ভিতরে {currency}{insideCost}, ঢাকার বাইরে {currency}{outsideCost}। পরবর্তী পেজে ঠিকানা নির্বাচন অনুযায়ী স্বয়ংক্রিয়ভাবে ধার্য হবে।
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-base text-slate-900">আনুমানিক মোট:</p>
                                            <p className="text-[11px] text-slate-400">+ ডেলিভারি চার্জ</p>
                                        </div>
                                        <p className="text-2xl font-extrabold text-green-700">
                                            {currency}{totalPrice.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Primary CTA: Proceed to Order */}
                                    <Link
                                        href="/order"
                                        className="group w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                                    >
                                        <Zap size={18} className="fill-white group-hover:scale-110 transition-transform" />
                                        <span>অর্ডার করতে এগিয়ে যান</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>

                                    {/* Payment & Delivery Highlights */}
                                    <div className="pt-2 space-y-2 text-xs text-slate-500 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Truck size={15} className="text-emerald-600 shrink-0" />
                                            <span>ক্যাশ অন ডেলিভারি (COD) সুবিধা উপলব্ধ</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                                            <span>বিকাশ, নগদ ও ব্যাংকের মাধ্যমে সহজ পেমেন্ট</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Lock size={15} className="text-emerald-600 shrink-0" />
                                            <span>১০০% নিরাপদ ও এনক্রিপ্টেড চেকআউট</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Empty Cart State */
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16">
                        <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-emerald-600 shadow-inner">
                            <ShoppingBag size={48} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                            আপনার শপিং কার্ট খালি আছে
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                            আপনি এখনো কোনো পণ্য কার্টে যোগ করেননি। আমাদের লেটেস্ট গ্যাজেট ও অফারগুলো দেখতে এখনই শপিং শুরু করুন।
                        </p>
                        <div className="flex items-center gap-3">
                            <Link 
                                href="/shop" 
                                className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-md transition active:scale-95"
                            >
                                শপিং শুরু করুন
                            </Link>
                            <Link 
                                href="/" 
                                className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition shadow-2xs"
                            >
                                হোম পেজ
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}