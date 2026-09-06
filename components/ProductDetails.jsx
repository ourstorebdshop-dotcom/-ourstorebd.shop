'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { toggleWishlist } from "@/lib/features/wishlist/wishlistSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon, ZapIcon, ShoppingCartIcon, CheckIcon, PhoneCallIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

const resolveImage = (img) => {
    if (!img) return '/products/product_img1.png'
    const srcStr = typeof img === 'object' && img.src ? img.src : String(img)
    const match = srcStr.match(/product_img(\d+)/)
    if (match && srcStr.includes('/_next/')) {
        return `/products/product_img${match[1]}.png`
    }
    return img
}

const styleCache = new Map()

const getInitialStyle = (src) => {
    if (!src) return { fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-slate-50' }
    const srcStr = typeof src === 'object' && src.src ? src.src : String(src)
    if (styleCache.has(srcStr)) {
        return styleCache.get(srcStr)
    }
    if (srcStr.includes('product_img') || srcStr.endsWith('.png')) {
        return { fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-slate-50' }
    }
    if (srcStr.startsWith('data:image/jpeg') || srcStr.endsWith('.jpg') || srcStr.endsWith('.jpeg')) {
        return { fit: 'cover', padding: 'p-0', bg: 'bg-slate-100' }
    }
    return { fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-slate-50' }
}

const ProductDetails = ({ product }) => {

    const productId = product.id || product._id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳';

    const cart = useSelector(state => state.cart.cartItems);
    const wishlistItems = useSelector(state => state.wishlist?.items || []);
    const isWishlisted = wishlistItems.includes(productId) || (product._id && wishlistItems.includes(product._id));
    const storeInfo = useSelector(state => state.contact?.storeInfo) || {};
    const shipping = useSelector(state => state.shipping);
    const dispatch = useDispatch();

    const quickContact = shipping?.quickContact || {
        whatsapp: { enabled: true, number: '01577272145', message: 'আমি এই প্রোডাক্টটা অর্ডার করতে চাই - {product_name}' },
        call: { enabled: true, number: '01577272145' }
    };

    const isWaEnabled = quickContact.whatsapp?.enabled !== false;
    const isCallEnabled = quickContact.call?.enabled !== false;

    const rawWhatsApp = quickContact.whatsapp?.number || storeInfo.whatsapp || storeInfo.phone || shipping?.paymentMethods?.BKASH?.accountNumber || '01577272145';
    const rawPhone = quickContact.call?.number || storeInfo.phone || storeInfo.whatsapp || shipping?.paymentMethods?.BKASH?.accountNumber || '01577272145';

    let cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, '');
    if (cleanWhatsApp.startsWith('01') && cleanWhatsApp.length === 11) {
        cleanWhatsApp = '88' + cleanWhatsApp;
    }
    const cleanPhone = rawPhone.replace(/[\s-]/g, '');

    const waTemplate = quickContact.whatsapp?.message || 'আমি এই প্রোডাক্টটা অর্ডার করতে চাই - {product_name}';
    const waFinalMessage = waTemplate.replace('{product_name}', product.name);

    const router = useRouter()

    const initialImg = resolveImage(product.images?.[0]);
    const [mainImage, setMainImage] = useState(initialImg);
    const [imgStyle, setImgStyle] = useState(() => getInitialStyle(initialImg));
    const [selectedColor, setSelectedColor] = useState(() => product.colors?.[0] || '');
    const [selectedSize, setSelectedSize] = useState(() => product.sizes?.[0] || '');
    const [addedFeedback, setAddedFeedback] = useState(false);

    useEffect(() => {
        if (!mainImage || typeof window === 'undefined') return;

        const srcStr = typeof mainImage === 'object' && mainImage.src ? mainImage.src : String(mainImage);

        if (styleCache.has(srcStr)) {
            setImgStyle(styleCache.get(srcStr));
            return;
        }

        let isCancelled = false;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            if (isCancelled) return;
            try {
                const nw = img.naturalWidth || 1;
                const nh = img.naturalHeight || 1;
                const aspectRatio = nw / nh;

                const canvas = document.createElement('canvas');
                canvas.width = 16;
                canvas.height = 16;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                if (!ctx) {
                    const fallback = srcStr.includes('.png') || srcStr.includes('product_img')
                        ? { fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-slate-50' }
                        : { fit: 'cover', padding: 'p-0', bg: 'bg-slate-100' };
                    styleCache.set(srcStr, fallback);
                    setImgStyle(fallback);
                    return;
                }

                ctx.drawImage(img, 0, 0, 16, 16);
                const data = ctx.getImageData(0, 0, 16, 16).data;

                const corners = [0, 15, 15 * 16, 15 * 16 + 15];
                let hasTransparentCorner = false;
                let whiteCornersCount = 0;

                for (const idx of corners) {
                    const p = idx * 4;
                    const r = data[p];
                    const g = data[p + 1];
                    const b = data[p + 2];
                    const a = data[p + 3];

                    if (a < 40) {
                        hasTransparentCorner = true;
                    }
                    if (a >= 200 && r > 230 && g > 230 && b > 230) {
                        whiteCornersCount++;
                    }
                }

                let style;
                if (hasTransparentCorner) {
                    style = { fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-slate-50' };
                } else if (whiteCornersCount >= 3) {
                    style = { fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-white' };
                } else if (aspectRatio > 1.8 || aspectRatio < 0.45) {
                    style = { fit: 'contain', padding: 'p-4', bg: 'bg-slate-100' };
                } else {
                    style = { fit: 'cover', padding: 'p-0', bg: 'bg-slate-100' };
                }

                styleCache.set(srcStr, style);
                setImgStyle(style);
            } catch (e) {
                const isJpeg = srcStr.startsWith('data:image/jpeg') || srcStr.endsWith('.jpg') || srcStr.endsWith('.jpeg');
                const fallback = isJpeg
                    ? { fit: 'cover', padding: 'p-0', bg: 'bg-slate-100' }
                    : { fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-slate-50' };
                styleCache.set(srcStr, fallback);
                setImgStyle(fallback);
            }
        };

        img.onerror = () => {
            if (!isCancelled) {
                const fallback = { fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-slate-50' };
                setImgStyle(fallback);
            }
        };

        img.src = srcStr;

        return () => {
            isCancelled = true;
        };
    }, [mainImage]);

    const addToCartHandler = () => {
        if (!product.inStock) return;
        dispatch(addToCart({ productId, color: selectedColor, size: selectedSize }))
        setAddedFeedback(true)
        setTimeout(() => setAddedFeedback(false), 1500)
    }

    const orderNowHandler = () => {
        if (!product.inStock) return;
        if (!cart[productId]) {
            dispatch(addToCart({ productId, color: selectedColor, size: selectedSize }))
        }
        router.push('/cart')
    }

    const averageRating = product.rating.length > 0
        ? product.rating.reduce((acc, item) => acc + item.rating, 0) / product.rating.length
        : 0;

    const hasDiscount = product.mrp && product.mrp > product.price;
    const discountPercent = hasDiscount
        ? ((product.mrp - product.price) / product.mrp * 100).toFixed(0)
        : 0;

    const handleWishlistToggle = () => {
        dispatch(toggleWishlist(productId));
        if (!isWishlisted) {
            toast.success(`"${product.name}" পছন্দের তালিকায় যোগ করা হয়েছে! ❤️`, {
                id: `wishlist-${productId}`,
                duration: 2500,
            });
        } else {
            toast.success(`"${product.name}" পছন্দের তালিকা থেকে সরানো হয়েছে`, {
                id: `wishlist-${productId}`,
                duration: 2500,
            });
        }
    };

    return (
        <div className="flex max-lg:flex-col gap-6 sm:gap-12">
            <div className="flex max-sm:flex-col-reverse gap-3">
                {/* Thumbnails */}
                <div className="flex max-sm:flex-row max-sm:overflow-x-auto sm:flex-col gap-3 pb-2 sm:pb-0">
                    {product.images.map((image, index) => {
                        const resolved = resolveImage(image);
                        const isActive = mainImage === resolved;
                        return (
                            <div
                                key={index}
                                onClick={() => setMainImage(resolved)}
                                className={`relative flex-shrink-0 size-16 sm:size-22 rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
                                    isActive
                                        ? 'border-green-600 ring-2 ring-green-600/25 shadow-md scale-102'
                                        : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                                }`}
                            >
                                <Image
                                    fill
                                    sizes="88px"
                                    src={resolved}
                                    onError={(e) => { e.currentTarget.src = '/products/product_img1.png' }}
                                    className="object-cover transition-transform duration-200 hover:scale-105"
                                    alt={`${product.name} thumbnail view ${index + 1} - Our Store BD`}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Main Showcase Image */}
                <div className={`relative flex justify-center items-center h-80 sm:h-112 sm:size-113 w-full ${imgStyle.bg} border border-slate-200/80 rounded-2xl overflow-hidden transition-colors duration-300 shadow-sm`}>
                    <Image
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 550px"
                        src={mainImage}
                        onError={() => {
                            setMainImage('/products/product_img1.png');
                            setImgStyle({ fit: 'contain', padding: 'p-4 sm:p-8', bg: 'bg-slate-50' });
                        }}
                        alt={`${product.name} - Authentic Electronics & Gadgets in Bangladesh`}
                        priority
                        className={`transition-all duration-300 ${
                            imgStyle.fit === 'cover'
                                ? 'object-cover hover:scale-105'
                                : `object-contain ${imgStyle.padding} hover:scale-105`
                        }`}
                    />
                </div>
            </div>
            <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">{product.name}</h1>
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">{product.rating.length} Reviews</p>
                </div>
                <div className="flex items-baseline my-4 sm:my-6 gap-3 text-xl sm:text-2xl font-semibold text-slate-800">
                    <p> {currency}{product.price} </p>
                    {hasDiscount && (
                        <p className="text-xl text-slate-500 line-through">{currency}{product.mrp}</p>
                    )}
                </div>
                {hasDiscount && (
                    <div className="flex items-center gap-2 text-slate-500">
                        <TagIcon size={14} />
                        <p>Save {discountPercent}% right now</p>
                    </div>
                )}

                {/* Color Selector */}
                {product.colors && product.colors.length > 0 && (
                    <div className="mt-6">
                        <p className="text-sm font-medium text-slate-700 mb-2">Color</p>
                        <div className="flex items-center gap-2">
                            {product.colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                                        selectedColor === color
                                            ? 'border-slate-800 ring-2 ring-slate-300 scale-110'
                                            : 'border-slate-200'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                    <div className="mt-5">
                        <p className="text-sm font-medium text-slate-700 mb-2">Size</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {product.sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                                        selectedSize === size
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quantity — only shows when item is already in cart */}
                {cart[productId] && (
                    <div className="mt-6">
                        <p className="text-sm font-medium text-slate-700 mb-2">Quantity</p>
                        <Counter productId={productId} />
                    </div>
                )}

                {/* Out of Stock Notice */}
                {!product.inStock && (
                    <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                        <span className="text-sm font-semibold">⚠ এই পণ্যটি বর্তমানে স্টকে নেই</span>
                    </div>
                )}

                {/* Action Buttons: 2x2 Grid with perfectly equal sizes and alignment */}
                <div className="grid grid-cols-2 gap-3 mt-6 sm:mt-8 w-full sm:max-w-md items-center">
                    {/* Add to Cart */}
                    <button
                        onClick={addToCartHandler}
                        disabled={!product.inStock}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded transition-all duration-200 active:scale-95 ${
                            !product.inStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : addedFeedback
                                    ? 'bg-green-500 text-white cursor-pointer'
                                    : 'bg-slate-800 text-white hover:bg-slate-900 cursor-pointer'
                        }`}
                    >
                        {addedFeedback ? (
                            <>
                                <CheckIcon size={16} />
                                <span>Added to Cart!</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCartIcon size={16} />
                                <span>Add to Cart</span>
                            </>
                        )}
                    </button>

                    {/* Order Now */}
                    <button
                        onClick={orderNowHandler}
                        disabled={!product.inStock}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 text-base font-bold rounded-xl text-white ${
                            !product.inStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-400 to-emerald-600 animate-order-breathing cursor-pointer'
                        }`}
                    >
                        <ZapIcon size={18} strokeWidth={2.5} className="fill-white" />
                        <span>Order Now</span>
                    </button>

                    {/* WhatsApp */}
                    {isWaEnabled && (
                        <a
                            href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(waFinalMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer ${!isCallEnabled ? 'col-span-2' : ''}`}
                        >
                            <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            <span>WhatsApp</span>
                        </a>
                    )}

                    {/* Call Now */}
                    {isCallEnabled && (
                        <a
                            href={`tel:${cleanPhone}`}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer ${!isWaEnabled ? 'col-span-2' : ''}`}
                        >
                            <PhoneCallIcon size={16} className="flex-shrink-0" />
                            <span>Call Now</span>
                        </a>
                    )}
                </div>
                <hr className="border-gray-300 my-5" />
                <div className="flex flex-col gap-4 text-slate-500">
                    <p className="flex gap-3"> <EarthIcon className="text-slate-400" /> Free shipping worldwide </p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> 100% Secured Payment </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Trusted by top brands </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails