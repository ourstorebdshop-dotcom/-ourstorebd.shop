'use client'
import { StarIcon, ShoppingCartIcon, ZapIcon, CheckIcon, HeartIcon, FlameIcon, TagIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import { toggleWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { trackAddToCart, trackWishlist } from '@/lib/tracking/clientTracker'

// Helper to resolve and normalize image URLs safely
const resolveImage = (img) => {
    if (!img) return '/placeholder.svg'
    const srcStr = typeof img === 'object' && img.src ? img.src : String(img)
    const match = srcStr.match(/product_img(\d+)/)
    if (match && srcStr.includes('/_next/')) {
        return `/products/product_img${match[1]}.png`
    }
    return img
}

// Cache analyzed image styles so that once analyzed, rendering is instantaneous
const styleCache = new Map()

// Helper to determine initial/fallback style from src
const getInitialStyle = (src) => {
    if (!src) return { fit: 'contain', padding: 'p-3 sm:p-4', bg: 'bg-[#F8FAFC]' }
    const srcStr = typeof src === 'object' && src.src ? src.src : String(src)
    if (styleCache.has(srcStr)) {
        return styleCache.get(srcStr)
    }
    if (srcStr.includes('product_img') || srcStr.endsWith('.png')) {
        return { fit: 'contain', padding: 'p-3 sm:p-4', bg: 'bg-[#F8FAFC]' }
    }
    if (srcStr.startsWith('data:image/jpeg') || srcStr.endsWith('.jpg') || srcStr.endsWith('.jpeg')) {
        return { fit: 'cover', padding: 'p-0', bg: 'bg-[#F5F5F5]' }
    }
    return { fit: 'contain', padding: 'p-3 sm:p-4', bg: 'bg-[#F8FAFC]' }
}

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()
    const router = useRouter()
    const [addedToCart, setAddedToCart] = useState(false)
    const resolvedImg = resolveImage(product?.images?.[0])
    const [currentImg, setCurrentImg] = React.useState(resolvedImg)
    const [imgStyle, setImgStyle] = React.useState(() => getInitialStyle(resolvedImg))

    React.useEffect(() => {
        if (!product) return
        const resolved = resolveImage(product?.images?.[0])
        setCurrentImg(resolved)

        if (!resolved || typeof window === 'undefined') return

        const srcStr = typeof resolved === 'object' && resolved.src ? resolved.src : String(resolved)

        if (styleCache.has(srcStr)) {
            setImgStyle(styleCache.get(srcStr))
            return
        }

        // Use URL-based heuristic instead of canvas pixel inspection (Issue 8.1, 9.2)
        // This avoids creating offscreen canvases and double-downloading images
        const style = getInitialStyle(resolved)
        styleCache.set(srcStr, style)
        setImgStyle(style)
    }, [product?.images])

    const wishlistItems = useSelector(state => state.wishlist?.items || [])

    if (!product) return null

    const isWishlisted = wishlistItems.includes(product.id) || (product._id && wishlistItems.includes(product._id))

    // calculate the average rating of the product (guard against undefined/empty rating array)
    const ratingsList = (Array.isArray(product.rating) ? product.rating : []).filter(r => r && r.isVisible !== false && r.status !== 'hidden');
    const rating = ratingsList.length > 0
        ? Math.round(ratingsList.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / ratingsList.length)
        : 0;
    const reviewCount = ratingsList.length;

    // Badge logic
    const discountPercent = product.mrp && product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0;

    const isNew = (() => {
        const created = new Date(product.createdAt);
        const now = new Date();
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
    })();

    const isBestseller = reviewCount >= 5;
    const isHot = rating >= 4;

    // Pick the most relevant badge (priority: discount > new > bestseller > hot)
    const badge = discountPercent > 0
        ? { label: `-${discountPercent}%`, color: 'bg-rose-500', icon: TagIcon }
        : isNew
            ? { label: 'New', color: 'bg-blue-500', icon: null }
            : isBestseller
                ? { label: 'Bestseller', color: 'bg-amber-500', icon: FlameIcon }
                : isHot
                    ? { label: 'Hot', color: 'bg-orange-500', icon: FlameIcon }
                    : null;

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(addToCart({ productId: product.id }))
        trackAddToCart(product, 1)
        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 1500)
    }

    const handleBuyNow = (e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(addToCart({ productId: product.id }))
        trackAddToCart(product, 1)
        router.push('/order')
    }

    const handleWishlist = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const prodId = product.id || product._id
        dispatch(toggleWishlist(prodId))
        if (!isWishlisted) {
            trackWishlist(product)
            toast.success(`"${product.name}" পছন্দের তালিকায় যোগ করা হয়েছে! ❤️`, {
                id: `wishlist-${prodId}`,
                duration: 2500,
            })
        } else {
            toast.success(`"${product.name}" পছন্দের তালিকা থেকে সরানো হয়েছে`, {
                id: `wishlist-${prodId}`,
                duration: 2500,
            })
        }
    }

    return (
        <div className='group w-full cursor-pointer' onClick={(e) => {
            // Only navigate if clicking on the card itself, not on buttons
            if (e.target.closest('button')) return
            router.push(`/product/${product.id}`)
        }}>
            {/* Image Container — strictly preserves homepage size (h-48 sm:h-72) */}
            <div className={`relative ${imgStyle.bg} border border-slate-100/80 h-48 sm:h-72 rounded-xl flex items-center justify-center overflow-hidden transition-colors duration-300`}>
                <Image
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className={`transition-all duration-300 group-hover:scale-105 ${
                        imgStyle.fit === 'cover'
                            ? 'object-cover'
                            : `object-contain ${imgStyle.padding}`
                    }`}
                    src={currentImg}
                    onError={() => {
                        setCurrentImg('/products/product_img1.png')
                        setImgStyle({ fit: 'contain', padding: 'p-3 sm:p-4', bg: 'bg-[#F8FAFC]' })
                    }}
                    alt={`${product.name || 'Electronics gadget'} - Buy in Bangladesh | Our Store BD`}
                />

                {/* Badge */}
                {badge && (
                    <span className={`absolute top-2 left-2 sm:top-3 sm:left-3 ${badge.color} text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-0.5 shadow-lg z-10`}>
                        {badge.icon && <badge.icon size={11} />}
                        {badge.label}
                    </span>
                )}

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlist}
                    className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90 cursor-pointer z-10 ${
                        isWishlisted
                            ? 'bg-rose-500 text-white shadow-rose-200'
                            : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-500 hover:bg-white'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                    <HeartIcon size={14} fill={isWishlisted ? 'currentColor' : 'none'} className={isWishlisted ? 'scale-110' : ''} />
                </button>

                {/* Out of Stock overlay */}
                {!product.inStock && (
                    <div className='absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10'>
                        <span className='text-white text-xs sm:text-sm font-semibold bg-black/60 px-3 py-1 rounded-full'>Out of Stock</span>
                    </div>
                )}
            </div>

            {/* Product Info — more spacious */}
            <div className='pt-3 px-0.5'>
                {/* Name */}
                <h3 className='text-sm sm:text-base font-medium text-slate-800 line-clamp-2 leading-snug'>
                    {product.name}
                </h3>

                {/* Rating row */}
                <div className='flex items-center gap-1 mt-1'>
                    <div className='flex'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={13} className='text-transparent' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                    </div>
                    <span className='text-[10px] sm:text-xs text-slate-400'>({reviewCount})</span>
                </div>

                {/* Price row */}
                <div className='flex items-baseline gap-1.5 mt-1'>
                    <span className='text-base sm:text-lg font-bold text-slate-900'>
                        {currency}{product.price}
                    </span>
                    {product.mrp && product.mrp > product.price && (
                        <span className='text-xs sm:text-sm text-slate-400 line-through'>
                            {currency}{product.mrp}
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons — larger & touch-friendly */}
            <div className='flex items-center gap-2 pt-2.5 px-0.5'>
                <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                        addedToCart
                            ? 'bg-green-500 text-white shadow-green-200'
                            : !product.inStock
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-white text-slate-700 hover:bg-slate-50 hover:shadow-md border border-slate-200'
                    }`}
                    title='Add to Cart'
                >
                    {addedToCart ? (
                        <>
                            <CheckIcon size={15} />
                            <span>Added!</span>
                        </>
                    ) : (
                        <>
                            <ShoppingCartIcon size={15} />
                            <span>Cart</span>
                        </>
                    )}
                </button>
                <button
                    onClick={handleBuyNow}
                    disabled={!product.inStock}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                        !product.inStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:shadow-md shadow-green-200'
                    }`}
                    title='Order Now'
                >
                    <ZapIcon size={15} />
                    <span>Order</span>
                </button>
            </div>
        </div>
    )
}

export default React.memo(ProductCard, (prev, next) => {
    return (
        prev.product?.id === next.product?.id &&
        prev.product?.price === next.product?.price &&
        prev.product?.inStock === next.product?.inStock &&
        prev.product?.images?.[0] === next.product?.images?.[0] &&
        prev.product?.rating?.length === next.product?.rating?.length
    );
});