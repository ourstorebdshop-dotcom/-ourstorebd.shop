'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { deleteItemFromCart } from '@/lib/features/cart/cartSlice'
import Counter from '@/components/Counter'
import OrderSummary from '@/components/OrderSummary'
import ThankYouModal from '@/components/ThankYouModal'
import { 
    ShoppingBag, 
    Trash2Icon, 
    ArrowLeft, 
    PackageCheck,
    Lock
} from 'lucide-react'
import { trackInitiateCheckout, trackRemoveFromCart } from '@/lib/tracking/clientTracker'

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

export default function OrderPage() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()

    const { cartItems } = useSelector(state => state.cart)
    const products = useSelector(state => state.product.list)
    const { currentUser } = useSelector(state => state.user)

    const [cartArray, setCartArray] = useState([])
    const [totalPrice, setTotalPrice] = useState(0)
    const [placedOrder, setPlacedOrder] = useState(null)
    const [failedImages, setFailedImages] = useState({})
    const [idempotencyKey] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'ord_' + Math.random().toString(36).slice(2) + Date.now().toString(36))
    const [formLoadedAt] = useState(() => Date.now())

    const defaultAddr = currentUser?.addresses?.find(a => a.isDefault) || currentUser?.addresses?.[0]
    const isOutsideDefault = defaultAddr?.city?.toLowerCase().includes('outside') || defaultAddr?.city?.includes('বাইরে')

    const [deliveryInfo, setDeliveryInfo] = useState({
        name: currentUser?.name || defaultAddr?.name || '',
        phone: currentUser?.phone || defaultAddr?.phone || '',
        address: defaultAddr?.street || '',
        location: isOutsideDefault ? 'outsideDhaka' : 'insideDhaka'
    })

    useEffect(() => {
        document.title = "Order Checkout - Complete Your Order | Our Store BD"
    }, [])

    useEffect(() => {
        if (currentUser) {
            const activeAddr = currentUser.addresses?.find(a => a.isDefault) || currentUser.addresses?.[0]
            const isOutside = activeAddr?.city?.toLowerCase().includes('outside') || activeAddr?.city?.includes('বাইরে')
            setDeliveryInfo(prev => ({
                name: prev.name || currentUser.name || activeAddr?.name || '',
                phone: prev.phone || currentUser.phone || activeAddr?.phone || '',
                address: prev.address || activeAddr?.street || '',
                location: prev.address ? prev.location : (isOutside ? 'outsideDhaka' : 'insideDhaka')
            }))
        }
    }, [currentUser])

    useEffect(() => {
        let total = 0
        const items = []
        for (const [key, value] of Object.entries(cartItems)) {
            const product = products.find(p => p.id === key)
            if (product) {
                const qty = typeof value === 'number' ? value : value.quantity
                const color = typeof value === 'object' ? value.color : null
                const size = typeof value === 'object' ? value.size : null
                const effectivePrice = product.offerPrice || product.price
                items.push({
                    ...product,
                    quantity: qty,
                    selectedColor: color,
                    selectedSize: size,
                    effectivePrice,
                })
                total += effectivePrice * qty
            }
        }
        setCartArray(items)
        setTotalPrice(total)
        if (items.length > 0) {
            trackInitiateCheckout(items, total)
        }
    }, [cartItems, products])

    const handleDeleteItem = (productId) => {
        const itemToRemove = cartArray.find(i => i.id === productId)
        dispatch(deleteItemFromCart({ productId }))
        if (itemToRemove) {
            trackRemoveFromCart(itemToRemove, itemToRemove.quantity || 1)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Breadcrumb Navigation */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="hover:text-green-600 transition">Home</Link>
                        <span>/</span>
                        <Link href="/cart" className="hover:text-green-600 transition">Cart</Link>
                        <span>/</span>
                        <span className="text-green-600 font-semibold">Order Checkout</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full font-medium">
                        <Lock size={12} className="text-emerald-600" />
                        <span>১০০% নিরাপদ ও এনক্রিপ্টেড অর্ডার</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
                {cartArray.length > 0 ? (
                    <div>
                        {/* Page Header */}
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                                    <PackageCheck className="text-green-600" size={28} />
                                    <span>অর্ডার সম্পন্ন করুন</span>
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    ডেলিভারি তথ্য পূরণ করে নিচের বাটনে ক্লিক করে আপনার অর্ডার নিশ্চিত করুন।
                                </p>
                            </div>

                            <Link 
                                href="/cart" 
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-green-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition shadow-2xs self-start sm:self-auto"
                            >
                                <ArrowLeft size={15} />
                                <span>কার্টে ফিরে যান</span>
                            </Link>
                        </div>

                        {/* Order Checkout Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left Column: Order Items Review (7 cols) */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Items Card */}
                                <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag size={18} className="text-green-600" />
                                            <h2 className="font-bold text-base sm:text-lg text-slate-800">
                                                অর্ডারকৃত পণ্যের বিবরণ
                                            </h2>
                                            <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                                {cartArray.length} টি পণ্য
                                            </span>
                                        </div>

                                        <Link 
                                            href="/cart" 
                                            className="text-xs text-green-600 hover:text-green-700 font-semibold hover:underline"
                                        >
                                            কার্ট এডিট করুন
                                        </Link>
                                    </div>

                                    {/* Items List */}
                                    <div className="divide-y divide-slate-100">
                                        {cartArray.map((item) => (
                                            <div key={item.id} className="py-4 flex gap-3 sm:gap-4">
                                                {/* Left: Product Image */}
                                                <Link 
                                                    href={`/product/${item.id}`}
                                                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200/80 bg-slate-50 overflow-hidden shadow-2xs shrink-0 group"
                                                >
                                                    <Image 
                                                        src={failedImages[item.id] ? '/placeholder.svg' : getItemImage(item)} 
                                                        alt={item.name || 'Product'} 
                                                        fill
                                                        sizes="(max-width: 640px) 64px, 80px"
                                                        className={`transition-transform duration-200 group-hover:scale-105 ${
                                                            isPhoto(getItemImage(item))
                                                                ? 'object-cover'
                                                                : 'object-contain p-1.5'
                                                        }`}
                                                        onError={() => {
                                                            setFailedImages(prev => ({ ...prev, [item.id]: true }))
                                                        }}
                                                    />
                                                </Link>

                                                {/* Right: All product details stacked vertically */}
                                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                    {/* Product Name */}
                                                    <Link 
                                                        href={`/product/${item.id}`}
                                                        className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-green-600 transition line-clamp-2 leading-snug"
                                                    >
                                                        {item.name}
                                                    </Link>

                                                    {/* Category + Unit Price + Variants */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[11px] text-slate-400">{item.category}</span>
                                                        <span className="text-[11px] text-slate-300">•</span>
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {currency}{item.effectivePrice || item.price}
                                                        </span>
                                                        {item.selectedColor && (
                                                            <span 
                                                                className="w-3 h-3 rounded-full border border-slate-300 inline-block" 
                                                                style={{ backgroundColor: item.selectedColor }} 
                                                                title={item.selectedColor} 
                                                            />
                                                        )}
                                                        {item.selectedSize && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                                                {item.selectedSize}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Counter + Total + Delete in one row */}
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <Counter productId={item.id} />
                                                        
                                                        <span className="text-sm font-bold text-slate-900 ml-auto">
                                                            {currency}{((item.effectivePrice || item.price) * item.quantity).toLocaleString()}
                                                        </span>

                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDeleteItem(item.id)} 
                                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                            title="পণ্যটি বাদ দিন"
                                                        >
                                                            <Trash2Icon size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Subtotal preview bar */}
                                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-600">
                                        <span>পণ্যের মোট মূল্য (Subtotal):</span>
                                        <span className="font-bold text-base text-slate-900">
                                            {currency}{totalPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Complete Delivery & Payment Form (5 cols) */}
                            <div className="lg:col-span-5">
                                <div className="sticky top-24">
                                    <OrderSummary 
                                        totalPrice={totalPrice} 
                                        items={cartArray} 
                                        deliveryInfo={deliveryInfo} 
                                        setDeliveryInfo={setDeliveryInfo} 
                                        onOrderSuccess={(order) => setPlacedOrder(order)}
                                        idempotencyKey={idempotencyKey}
                                        formLoadedAt={formLoadedAt}
                                        className="w-full shadow-md bg-white border border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Empty Order/Cart State */
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600 shadow-inner">
                            <ShoppingBag size={40} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                            আপনার অর্ডার করার মতো কোনো পণ্য নেই
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">
                            অর্ডার সম্পন্ন করতে অনুগ্রহ করে আগে আপনার পছন্দের পণ্য কার্টে যুক্ত করুন অথবা সরাসরি পণ্য থেকে অর্ডার বাটনে ক্লিক করুন।
                        </p>
                        <div className="flex items-center gap-3">
                            <Link 
                                href="/shop" 
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-md transition active:scale-95"
                            >
                                শপিং শুরু করুন
                            </Link>
                            <Link 
                                href="/cart" 
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
                            >
                                কার্ট দেখুন
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Thank You Popup Modal on Order Confirmation */}
            {placedOrder && (
                <ThankYouModal 
                    order={placedOrder} 
                    onClose={() => setPlacedOrder(null)} 
                />
            )}
        </div>
    )
}
