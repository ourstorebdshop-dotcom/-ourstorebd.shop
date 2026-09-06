'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { 
    User, 
    ShoppingBag, 
    MapPin, 
    Tag, 
    Settings, 
    LogOut, 
    Package, 
    Clock, 
    Truck, 
    CheckCircle2, 
    XCircle, 
    Copy, 
    Check, 
    Plus, 
    Edit2, 
    Trash2, 
    Eye, 
    ShieldCheck, 
    Phone, 
    Mail, 
    Calendar,
    ArrowRight,
    ExternalLink,
    Lock,
    Heart,
    Camera,
    Upload,
    Image as ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
    logout, 
    updateProfile, 
    addUserAddress, 
    updateUserAddress, 
    deleteUserAddress, 
    setDefaultUserAddress 
} from '@/lib/features/user/userSlice'
import { cancelOrder } from '@/lib/features/order/orderSlice'
import { addToCart } from '@/lib/features/cart/cartSlice'
import { removeFromWishlist, clearWishlist, toggleWishlist } from '@/lib/features/wishlist/wishlistSlice'

function ProfileDashboard() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') || 'overview'

    const dispatch = useDispatch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'

    const { currentUser, isAuthenticated } = useSelector(state => state.user)
    const allOrders = useSelector(state => state.order.orders)
    const coupons = useSelector(state => state.coupon.coupons)
    const wishlistIds = useSelector(state => state.wishlist?.items || [])
    const allProducts = useSelector(state => state.product?.list || [])
    const wishlistProducts = allProducts.filter(p => wishlistIds.includes(p.id) || (p._id && wishlistIds.includes(p._id)))

    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState(initialTab)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState(null)
    const [copiedCoupon, setCopiedCoupon] = useState(null)

    // Profile Edit State
    const [editName, setEditName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editAvatar, setEditAvatar] = useState('')
    const [newPass, setNewPass] = useState('')
    const [confirmNewPass, setConfirmNewPass] = useState('')
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Image input refs
    const bannerFileInputRef = useRef(null)
    const formFileInputRef = useRef(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Auto-clean any legacy demo IDs (prod_1 etc.) or deleted/orphaned IDs from wishlist
    useEffect(() => {
        if (mounted && wishlistIds.length > 0) {
            const demoIds = wishlistIds.filter(id => typeof id === 'string' && (id.startsWith('prod_') || id === 'prod_1' || id === 'prod_3'))
            if (demoIds.length > 0) {
                demoIds.forEach(id => dispatch(removeFromWishlist(id)))
            } else if (allProducts.length > 0) {
                const orphaned = wishlistIds.filter(id => !allProducts.some(p => p.id === id || p._id === id))
                if (orphaned.length > 0) {
                    orphaned.forEach(id => dispatch(removeFromWishlist(id)))
                }
            }
        }
    }, [mounted, allProducts, wishlistIds, dispatch])

    // Address Form State
    const [addrLabel, setAddrLabel] = useState('বাসা (Home)')
    const [addrName, setAddrName] = useState('')
    const [addrPhone, setAddrPhone] = useState('')
    const [addrStreet, setAddrStreet] = useState('')
    const [addrCity, setAddrCity] = useState('Dhaka')
    const [addrArea, setAddrArea] = useState('')
    const [addrZip, setAddrZip] = useState('')
    const [addrIsDefault, setAddrIsDefault] = useState(false)

    // Filter states for Orders
    const [orderFilter, setOrderFilter] = useState('ALL')
    const [orderSearch, setOrderSearch] = useState('')

    useEffect(() => {
        if (currentUser) {
            setEditName(currentUser.name || '')
            setEditPhone(currentUser.phone || '')
            setEditEmail(currentUser.email || '')
            setEditAvatar(currentUser.avatar || '')
        }
    }, [currentUser])

    useEffect(() => {
        const tabParam = searchParams.get('tab')
        if (tabParam) {
            setActiveTab(tabParam)
        }
    }, [searchParams])

    // Get orders belonging to the current user (or all dummy orders if user is demo/admin)
    const userOrders = allOrders.filter(order => {
        if (!currentUser) return false
        return order.userId === currentUser.id || 
               order.user?.email === currentUser.email || 
               order.user?.phone === currentUser.phone ||
               currentUser.email === 'customer@ourstorebd.com' // demo gets demo orders
    })

    const handleLogout = () => {
        dispatch(logout())
        toast.success('সফলভাবে লগআউট করা হয়েছে')
        router.push('/login')
    }

    const handleSaveProfile = (e) => {
        e.preventDefault()
        if (!editName.trim()) {
            toast.error('নাম ফাঁকা রাখা যাবে না')
            return
        }

        dispatch(updateProfile({
            name: editName.trim(),
            phone: editPhone.trim(),
            email: editEmail.trim(),
            avatar: editAvatar.trim() || currentUser?.avatar
        }))

        toast.success('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!')
    }

    // Helper: Convert uploaded image file to Base64
    const processImageFile = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'))
                return
            }

            if (!file.type.startsWith('image/')) {
                toast.error('অনুগ্রহ করে একটি সঠিক ইমেজ ফাইল (JPG, PNG, WebP) নির্বাচন করুন')
                reject(new Error('Invalid file type'))
                return
            }

            // Size limit: 5MB
            if (file.size > 5 * 1024 * 1024) {
                toast.error('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে')
                reject(new Error('File size exceeded'))
                return
            }

            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = (err) => {
                toast.error('ছবি প্রসেস করতে ত্রুটি হয়েছে')
                reject(err)
            }
            reader.readAsDataURL(file)
        })
    }

    // Direct Avatar upload from Banner
    const handleBannerImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            setIsUploading(true)
            const base64Data = await processImageFile(file)
            setEditAvatar(base64Data)
            dispatch(updateProfile({
                avatar: base64Data
            }))
            toast.success('প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে! 📸')
        } catch (err) {
            console.error('Image upload failed:', err)
        } finally {
            setIsUploading(false)
            if (bannerFileInputRef.current) bannerFileInputRef.current.value = ''
        }
    }

    // Image upload from Settings form
    const handleFormImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            setIsUploading(true)
            const base64Data = await processImageFile(file)
            setEditAvatar(base64Data)
            toast.success('ছবি সিলেক্ট করা হয়েছে! "পরিবর্তন সংরক্ষণ করুন" বাটনে ক্লিক করে সেভ করুন। ✨')
        } catch (err) {
            console.error('Image upload failed:', err)
        } finally {
            setIsUploading(false)
            if (formFileInputRef.current) formFileInputRef.current.value = ''
        }
    }

    const handleChangePassword = (e) => {
        e.preventDefault()
        if (newPass.length < 6) {
            toast.error('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
            return
        }
        if (newPass !== confirmNewPass) {
            toast.error('পাসওয়ার্ড দুটি মিলছে না!')
            return
        }

        dispatch(updateProfile({ password: newPass }))
        toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!')
        setNewPass('')
        setConfirmNewPass('')
    }

    const handleOpenAddAddress = () => {
        setEditingAddress(null)
        setAddrLabel('বাসা (Home)')
        setAddrName(currentUser?.name || '')
        setAddrPhone(currentUser?.phone || '')
        setAddrStreet('')
        setAddrCity('Dhaka')
        setAddrArea('')
        setAddrZip('')
        setAddrIsDefault((currentUser?.addresses || []).length === 0)
        setIsAddressModalOpen(true)
    }

    const handleOpenEditAddress = (addr) => {
        setEditingAddress(addr)
        setAddrLabel(addr.label || 'বাসা (Home)')
        setAddrName(addr.name || '')
        setAddrPhone(addr.phone || '')
        setAddrStreet(addr.street || '')
        setAddrCity(addr.city || 'Dhaka')
        setAddrArea(addr.area || '')
        setAddrZip(addr.zip || '')
        setAddrIsDefault(addr.isDefault || false)
        setIsAddressModalOpen(true)
    }

    const handleSaveAddress = (e) => {
        e.preventDefault()
        if (!addrStreet.trim() || !addrPhone.trim() || !addrName.trim()) {
            toast.error('অনুগ্রহ করে নাম, ফোন এবং সম্পূর্ণ ঠিকানা প্রদান করুন')
            return
        }

        const addressData = {
            id: editingAddress ? editingAddress.id : `addr_${Date.now()}`,
            label: addrLabel,
            name: addrName.trim(),
            phone: addrPhone.trim(),
            street: addrStreet.trim(),
            city: addrCity.trim(),
            area: addrArea.trim(),
            zip: addrZip.trim(),
            isDefault: addrIsDefault
        }

        if (editingAddress) {
            dispatch(updateUserAddress({ id: editingAddress.id, updatedData: addressData }))
            toast.success('ঠিকানা আপডেট করা হয়েছে')
        } else {
            dispatch(addUserAddress(addressData))
            toast.success('নতুন ঠিকানা যুক্ত করা হয়েছে')
        }

        setIsAddressModalOpen(false)
    }

    const handleDeleteAddress = (id) => {
        dispatch(deleteUserAddress(id))
        toast.success('ঠিকানা মুছে ফেলা হয়েছে')
    }

    const handleSetDefaultAddress = (id) => {
        dispatch(setDefaultUserAddress(id))
        toast.success('ডিফল্ট ঠিকানা হিসেবে সেট করা হয়েছে')
    }

    const handleCancelOrder = (orderId) => {
        if (confirm('আপনি কি সত্যিই এই অর্ডারটি বাতিল করতে চান?')) {
            dispatch(cancelOrder(orderId))
            toast.success('অর্ডারটি বাতিল করা হয়েছে')
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: 'CANCELLED' }))
            }
        }
    }

    const handleCopyCoupon = (code) => {
        navigator.clipboard.writeText(code)
        setCopiedCoupon(code)
        toast.success(`কুপন কোড "${code}" কপি করা হয়েছে!`)
        setTimeout(() => setCopiedCoupon(null), 2500)
    }

    // Filter user orders
    const filteredOrders = userOrders.filter(order => {
        const matchesStatus = orderFilter === 'ALL' || order.status === orderFilter
        const matchesSearch = !orderSearch || 
            (order.id && order.id.toLowerCase().includes(orderSearch.toLowerCase())) ||
            (order.orderItems && order.orderItems.some(i => (i.product?.name || '').toLowerCase().includes(orderSearch.toLowerCase())))
        return matchesStatus && matchesSearch
    })

    // Calculations for overview stats
    const totalOrdersCount = userOrders.length
    const processingOrdersCount = userOrders.filter(o => o.status === 'PROCESSING' || o.status === 'ORDER_PLACED').length
    const deliveredOrdersCount = userOrders.filter(o => o.status === 'DELIVERED').length
    const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DELIVERED':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 size={13} /> DELIVERED</span>
            case 'SHIPPED':
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold inline-flex items-center gap-1"><Truck size={13} /> SHIPPED</span>
            case 'PROCESSING':
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold inline-flex items-center gap-1"><Clock size={13} /> PROCESSING</span>
            case 'CANCELLED':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold inline-flex items-center gap-1"><XCircle size={13} /> CANCELLED</span>
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold inline-flex items-center gap-1"><Package size={13} /> ORDER PLACED</span>
        }
    }

    // Helper to render the Wishlist content (used by both guest and logged-in views)
    const renderWishlistContent = () => (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Heart size={22} className="text-rose-500 fill-rose-500" />
                        আমার পছন্দের তালিকা (Wishlist)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        আপনার পছন্দ করে রাখা প্রিয় গ্যাজেট ও ইলেকট্রনিক্স পণ্যসমূহ
                    </p>
                </div>
                {wishlistProducts.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('আপনি কি নিশ্চিত যে পছন্দের তালিকার সকল পণ্য মুছে ফেলতে চান?')) {
                                dispatch(clearWishlist())
                                toast.success('পছন্দের তালিকা খালি করা হয়েছে')
                            }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 self-start sm:self-auto hover:underline cursor-pointer"
                    >
                        <Trash2 size={14} />
                        সব মুছে ফেলুন
                    </button>
                )}
            </div>

            {wishlistProducts.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Heart size={32} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">আপনার পছন্দের তালিকা বর্তমানে খালি</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        পণ্য ব্রাউজ করার সময় প্রোডাক্ট কার্ডের হার্ট (❤️) আইকনে ক্লিক করে পছন্দের তালিকায় যুক্ত করুন।
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs"
                    >
                        <ShoppingBag size={16} />
                        পণ্যসমূহ দেখুন (Explore Shop)
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {wishlistProducts.map((product) => {
                        const discountPercent = product.mrp && product.mrp > product.price
                            ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                            : 0
                        const prodId = product.id || product._id

                        return (
                            <div 
                                key={prodId}
                                className="group border border-slate-200 hover:border-green-300 rounded-2xl p-4 transition-all bg-white hover:shadow-md flex flex-col justify-between"
                            >
                                <div>
                                    {/* Image Container */}
                                    <div className="relative bg-slate-50 rounded-xl h-44 flex items-center justify-center overflow-hidden mb-3">
                                        <Link href={`/product/${prodId}`} className="w-full h-full flex items-center justify-center">
                                            <img
                                                src={product.images?.[0]?.src || product.images?.[0] || "/product_img.png"}
                                                alt={product.name}
                                                className="max-h-36 w-auto object-contain group-hover:scale-105 transition duration-300"
                                            />
                                        </Link>
                                        {discountPercent > 0 && (
                                            <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                                -{discountPercent}%
                                            </span>
                                        )}
                                        <button
                                            onClick={() => {
                                                dispatch(removeFromWishlist(prodId))
                                                toast.success(`"${product.name}" পছন্দের তালিকা থেকে সরানো হয়েছে`)
                                            }}
                                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center shadow-xs transition cursor-pointer"
                                            title="Remove from Wishlist"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Product Info */}
                                    <span className="text-[10px] text-green-700 font-semibold uppercase bg-green-50 px-2 py-0.5 rounded-md">
                                        {product.category || "Gadgets"}
                                    </span>
                                    <Link href={`/product/${prodId}`} className="block mt-1.5">
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 hover:text-green-600 transition">
                                            {product.name}
                                        </h4>
                                    </Link>

                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-base font-bold text-slate-900">{currency}{product.price}</span>
                                        {product.mrp && product.mrp > product.price && (
                                            <span className="text-xs text-slate-400 line-through">{currency}{product.mrp}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            dispatch(addToCart({ productId: prodId }))
                                            toast.success(`"${product.name}" কার্টে যোগ করা হয়েছে!`)
                                        }}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <ShoppingBag size={14} />
                                        কার্টে নিন
                                    </button>
                                    <button
                                        onClick={() => {
                                            dispatch(addToCart({ productId: prodId }))
                                            router.push('/cart')
                                        }}
                                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                        অর্ডার করুন
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )

    // Wait until client mounted to prevent hydration mismatches
    if (!mounted) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
            </div>
        )
    }

    // If not logged in but viewing Wishlist, allow guest view
    if (!isAuthenticated || !currentUser) {
        if (activeTab === 'wishlist') {
            return (
                <div className="min-h-screen bg-slate-50/60 pb-20 pt-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        {/* Guest Wishlist Top Bar */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100 shadow-xs">
                                    <Heart size={32} className="fill-rose-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">আমার পছন্দের তালিকা (Wishlist)</h1>
                                        <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                            {wishlistProducts.length} টি পণ্য
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                        পছন্দের পণ্যগুলো আপনার বর্তমান ডিভাইসে সংরক্ষিত আছে। যেকোনো ডিভাইস থেকে দেখতে লগইন করুন।
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                                <Link
                                    href="/login?redirect=/profile?tab=wishlist"
                                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-medium rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <User size={16} />
                                    লগইন করুন
                                </Link>
                                <Link
                                    href="/shop"
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-medium rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-2"
                                >
                                    <ShoppingBag size={16} />
                                    শপ দেখুন
                                </Link>
                            </div>
                        </div>

                        {/* Render Wishlist Content */}
                        {renderWishlistContent()}
                    </div>
                </div>
            )
        }

        return (
            <div className="min-h-[75vh] flex flex-col items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">কাস্টমার প্রোফাইল</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        আপনার একাউন্ট তথ্য ও অর্ডার হিস্টোরি দেখতে অনুগ্রহ করে লগইন করুন।
                    </p>
                    <Link
                        href="/login?redirect=/profile"
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-md inline-block"
                    >
                        লগইন পেজে যান
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/60 pb-20 pt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Top Profile Header Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-green-50/60 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="relative group">
                            <img
                                src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                alt={currentUser.name}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:brightness-90 transition cursor-pointer"
                                onClick={() => bannerFileInputRef.current?.click()}
                                title="সরাসরি প্রোফাইল ছবি আপলোড করুন"
                            />
                            <button
                                type="button"
                                onClick={() => bannerFileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-slate-900/90 hover:bg-green-600 text-white p-2 rounded-full border-2 border-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                                title="সরাসরি ছবি আপলোড করুন (Upload Image)"
                            >
                                <Camera size={14} />
                            </button>
                            <input
                                ref={bannerFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleBannerImageUpload}
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{currentUser.name}</h1>
                                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                    সম্মানিত গ্রাহক
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 mt-2 flex-wrap">
                                {currentUser.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone size={14} className="text-slate-400" />
                                        {currentUser.phone}
                                    </span>
                                )}
                                {currentUser.email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail size={14} className="text-slate-400" />
                                        {currentUser.email}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                        <Link
                            href="/shop"
                            className="flex-1 md:flex-initial px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={16} />
                            নতুন অর্ডার করুন
                        </Link>
                    </div>
                </div>

                {/* Dashboard Layout: Sidebar Navigation + Content Tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Sidebar Navigation */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-1">
                            
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                    activeTab === 'overview'
                                        ? 'bg-green-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <User size={18} className={activeTab === 'overview' ? 'text-white' : 'text-slate-400'} />
                                ড্যাশবোর্ড ওভারভিউ
                            </button>

                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                    activeTab === 'orders'
                                        ? 'bg-green-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <ShoppingBag size={18} className={activeTab === 'orders' ? 'text-white' : 'text-slate-400'} />
                                    আমার অর্ডারসমূহ
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {userOrders.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('addresses')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                    activeTab === 'addresses'
                                        ? 'bg-green-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <MapPin size={18} className={activeTab === 'addresses' ? 'text-white' : 'text-slate-400'} />
                                ডেলিভারি ঠিকানা
                            </button>

                            <button
                                onClick={() => setActiveTab('coupons')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                    activeTab === 'coupons'
                                        ? 'bg-green-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Tag size={18} className={activeTab === 'coupons' ? 'text-white' : 'text-slate-400'} />
                                    কুপন ও অফার
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    activeTab === 'coupons' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                                }`}>
                                    {coupons.filter(c => c.isActive).length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                    activeTab === 'settings'
                                        ? 'bg-green-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Settings size={18} className={activeTab === 'settings' ? 'text-white' : 'text-slate-400'} />
                                একাউন্ট সেটিংস
                            </button>

                            <button
                                onClick={() => setActiveTab('wishlist')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                                    activeTab === 'wishlist'
                                        ? 'bg-green-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Heart size={18} className={activeTab === 'wishlist' ? 'text-white' : 'text-rose-500'} fill={activeTab === 'wishlist' ? 'currentColor' : (wishlistProducts.length > 0 ? '#f43f5e' : 'none')} />
                                    পছন্দের তালিকা
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    activeTab === 'wishlist' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {wishlistProducts.length}
                                </span>
                            </button>

                            <hr className="my-2 border-slate-100" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all text-left"
                            >
                                <LogOut size={18} className="text-red-500" />
                                লগআউট
                            </button>

                        </div>

                    </div>

                    {/* Right Content Area */}
                    <div className="lg:col-span-3">

                        {/* 1. OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                
                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                        <p className="text-xs text-slate-400 font-medium">মোট অর্ডার</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{totalOrdersCount}</h3>
                                        <p className="text-[11px] text-green-600 mt-1">সব সময়ের হিসেব</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                        <p className="text-xs text-slate-400 font-medium">প্রক্রিয়াধীন</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{processingOrdersCount}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1">চলমান ডেলিভারি</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                        <p className="text-xs text-slate-400 font-medium">সম্পন্ন হয়েছে</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">{deliveredOrdersCount}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1">সফল ডেলিভারি</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                        <p className="text-xs text-slate-400 font-medium">মোট খরচ</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{currency}{totalSpent.toFixed(0)}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1">অর্ডার বাবদ</p>
                                    </div>
                                </div>

                                {/* Recent Orders Section */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-base sm:text-lg font-bold text-slate-800">সাম্প্রতিক অর্ডারসমূহ</h2>
                                        <button
                                            onClick={() => setActiveTab('orders')}
                                            className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                                        >
                                            সবগুলো দেখুন &rarr;
                                        </button>
                                    </div>

                                    {userOrders.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400">
                                            <ShoppingBag size={36} className="mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">আপনি এখনো কোনো অর্ডার করেননি</p>
                                            <Link href="/shop" className="inline-block mt-3 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl">
                                                শপিং শুরু করুন
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {userOrders.slice(0, 3).map((order) => (
                                                <div 
                                                    key={order.id} 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="border border-slate-100 hover:border-slate-300 rounded-xl p-4 transition bg-slate-50/40 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                                                            <Package size={22} className="text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-400 font-mono">#{order.id.slice(-8)}</p>
                                                            <p className="text-sm font-bold text-slate-800">
                                                                {order.orderItems?.length || 1} টি আইটেম • {currency}{order.total}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400">
                                                                {new Date(order.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-3">
                                                        {getStatusBadge(order.status)}
                                                        <span className="text-xs text-slate-500 font-medium hover:underline flex items-center gap-1">
                                                            বিস্তারিত <Eye size={14} />
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Address, Wishlist & Active Coupon Highlights */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* Default Address card */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <MapPin size={16} className="text-green-600" />
                                                    ডিফল্ট ডেলিভারি ঠিকানা
                                                </h3>
                                                <button
                                                    onClick={() => setActiveTab('addresses')}
                                                    className="text-xs text-green-600 hover:underline font-semibold cursor-pointer"
                                                >
                                                    ম্যানেজ
                                                </button>
                                            </div>
                                            {currentUser.addresses && currentUser.addresses.length > 0 ? (
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                                                    <p className="font-bold text-slate-800">
                                                        {(currentUser.addresses.find(a => a.isDefault) || currentUser.addresses[0]).label}
                                                    </p>
                                                    <p className="truncate">{(currentUser.addresses.find(a => a.isDefault) || currentUser.addresses[0]).street}</p>
                                                    <p className="font-semibold text-slate-700">ফোন: {(currentUser.addresses.find(a => a.isDefault) || currentUser.addresses[0]).phone}</p>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 py-2">
                                                    কোনো ঠিকানা যুক্ত করা হয়নি।
                                                    <button onClick={handleOpenAddAddress} className="text-green-600 font-semibold block mt-1 hover:underline cursor-pointer">
                                                        + নতুন ঠিকানা যোগ করুন
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Wishlist Highlight card */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <Heart size={16} className="text-rose-500 fill-rose-500" />
                                                    পছন্দের পণ্যসমূহ
                                                </h3>
                                                <button
                                                    onClick={() => setActiveTab('wishlist')}
                                                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                                                >
                                                    সবগুলো ({wishlistProducts.length})
                                                </button>
                                            </div>
                                            {wishlistProducts.length > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    {wishlistProducts.slice(0, 3).map((prod) => (
                                                        <div 
                                                            key={prod.id} 
                                                            onClick={() => setActiveTab('wishlist')}
                                                            className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center justify-center cursor-pointer hover:border-rose-300 hover:scale-105 transition"
                                                            title={prod.name}
                                                        >
                                                            <img 
                                                                src={prod.images?.[0]?.src || prod.images?.[0] || "/product_img.png"} 
                                                                alt={prod.name} 
                                                                className="max-h-12 object-contain"
                                                            />
                                                        </div>
                                                    ))}
                                                    {wishlistProducts.length > 3 && (
                                                        <div 
                                                            onClick={() => setActiveTab('wishlist')}
                                                            className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer"
                                                        >
                                                            +{wishlistProducts.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 py-2">
                                                    পছন্দের তালিকা খালি রয়েছে।
                                                    <Link href="/shop" className="text-rose-600 font-semibold block mt-1 hover:underline">
                                                        + পণ্য ব্রাউজ করুন
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Discounts card */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <Tag size={16} className="text-green-600" />
                                                    আপনার জন্য বিশেষ কুপন
                                                </h3>
                                                <button
                                                    onClick={() => setActiveTab('coupons')}
                                                    className="text-xs text-green-600 hover:underline font-semibold cursor-pointer"
                                                >
                                                    সব অফার
                                                </button>
                                            </div>
                                            {coupons.filter(c => c.isActive).slice(0, 1).map(c => (
                                                <div key={c.code} className="bg-gradient-to-r from-emerald-50 to-green-50 p-3 rounded-xl border border-green-200 flex items-center justify-between">
                                                    <div>
                                                        <span className="font-mono font-bold text-emerald-800 text-xs">{c.code}</span>
                                                        <p className="text-[11px] text-emerald-700 mt-0.5 truncate max-w-[120px]">{c.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopyCoupon(c.code)}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                                    >
                                                        {copiedCoupon === c.code ? 'কপি!' : 'কপি'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* 2. MY ORDERS TAB */}
                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">আমার অর্ডারসমূহ</h2>
                                        <p className="text-xs text-slate-500">আপনার সমস্ত অতীত ও চলমান অর্ডারের তালিকা</p>
                                    </div>

                                    {/* Status Filters */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                                        {['ALL', 'ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                                            <button
                                                key={st}
                                                onClick={() => setOrderFilter(st)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                                                    orderFilter === st
                                                        ? 'bg-slate-800 text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {st === 'ALL' ? 'সব অর্ডার' : st.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Orders List */}
                                {filteredOrders.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400">
                                        <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                                        <h3 className="text-base font-semibold text-slate-700">কোনো অর্ডার পাওয়া যায়নি</h3>
                                        <p className="text-xs text-slate-400 mt-1">নির্বাচিত ফিল্টারের আওতায় কোনো অর্ডার নেই।</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredOrders.map((order) => (
                                            <div 
                                                key={order.id}
                                                className="border border-slate-200 rounded-2xl p-5 hover:border-green-300 transition-all bg-white"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-slate-800 text-sm">#{order.id}</span>
                                                            {getStatusBadge(order.status)}
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            অর্ডার তারিখ: {new Date(order.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-400">মোট মূল্য</p>
                                                        <p className="text-lg font-bold text-slate-800">{currency}{order.total}</p>
                                                    </div>
                                                </div>

                                                {/* Items in order */}
                                                <div className="py-4 space-y-3">
                                                    {(order.orderItems || []).map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3.5">
                                                            <img
                                                                src={item.product?.images?.[0]?.src || item.product?.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80"}
                                                                alt={item.product?.name || "Product"}
                                                                className="w-14 h-14 object-cover rounded-xl border border-slate-100 shrink-0 bg-slate-50"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-semibold text-slate-800 truncate">{item.product?.name || "পণ্য"}</h4>
                                                                <p className="text-xs text-slate-400">
                                                                    পরিমাণ: {item.quantity} {item.color ? `• রঙ: ${item.color}` : ''}
                                                                </p>
                                                            </div>
                                                            <div className="font-bold text-sm text-slate-800">
                                                                {currency}{item.price}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Actions */}
                                                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                                    <div className="text-slate-500">
                                                        পেমেন্ট: <span className="font-semibold text-slate-700">{order.paymentMethod || 'COD'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                                                        >
                                                            বিস্তারিত দেখুন <Eye size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        )}

                        {/* 3. ADDRESSES TAB */}
                        {activeTab === 'addresses' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">ডেলিভারি ঠিকানা সমুহ</h2>
                                        <p className="text-xs text-slate-500">আপনার অর্ডার সহজে পৌঁছানোর জন্য ঠিকানা ম্যানেজ করুন</p>
                                    </div>
                                    <button
                                        onClick={handleOpenAddAddress}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5"
                                    >
                                        <Plus size={16} />
                                        নতুন ঠিকানা
                                    </button>
                                </div>

                                {(!currentUser.addresses || currentUser.addresses.length === 0) ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <MapPin size={40} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">কোনো সংরক্ষিত ঠিকানা নেই</p>
                                        <button
                                            onClick={handleOpenAddAddress}
                                            className="mt-3 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl"
                                        >
                                            ঠিকানা যোগ করুন
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {currentUser.addresses.map((addr) => (
                                            <div 
                                                key={addr.id}
                                                className={`p-5 rounded-2xl border transition-all ${
                                                    addr.isDefault 
                                                        ? 'border-green-500 bg-green-50/20 shadow-xs' 
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                                        <MapPin size={16} className={addr.isDefault ? "text-green-600" : "text-slate-400"} />
                                                        {addr.label}
                                                    </span>
                                                    {addr.isDefault ? (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                                                            ডিফল্ট
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSetDefaultAddress(addr.id)}
                                                            className="text-[11px] text-slate-500 hover:text-green-600 font-medium"
                                                        >
                                                            ডিফল্ট করুন
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="text-sm font-semibold text-slate-700">{addr.name}</p>
                                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{addr.street}</p>
                                                <p className="text-xs text-slate-500">{addr.city} {addr.zip ? `- ${addr.zip}` : ''}</p>
                                                <p className="text-xs font-semibold text-slate-700 mt-2">ফোন: {addr.phone}</p>

                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                                                    <button
                                                        onClick={() => handleOpenEditAddress(addr)}
                                                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAddress(addr.id)}
                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. COUPONS TAB */}
                        {activeTab === 'coupons' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">কুপন ও বিশেষ অফারসমূহ</h2>
                                    <p className="text-xs text-slate-500">আপনার কেনাকাটায় সাশ্রয় করতে নিচের কুপন কোডগুলো ব্যবহার করুন</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {coupons.map((coupon) => {
                                        const isExpired = new Date(coupon.expiresAt) < new Date()
                                        return (
                                            <div 
                                                key={coupon.code}
                                                className={`p-5 rounded-2xl border transition relative overflow-hidden ${
                                                    coupon.isActive && !isExpired
                                                        ? 'border-green-200 bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30'
                                                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="font-mono font-bold text-lg text-green-700 tracking-wider">
                                                            {coupon.code}
                                                        </span>
                                                        <p className="text-xs font-semibold text-slate-800 mt-1">{coupon.description}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        coupon.isActive && !isExpired
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                        {coupon.isActive && !isExpired ? 'সক্রিয়' : 'মেয়াদোত্তীর্ণ'}
                                                    </span>
                                                </div>

                                                <div className="mt-3 text-xs text-slate-500 space-y-1">
                                                    <p>ডিসকাউন্ট: <strong>{coupon.discountType === 'percentage' ? `${coupon.discount}%` : `${currency}${coupon.discount}`}</strong></p>
                                                    {coupon.minOrderAmount > 0 && <p>সর্বনিম্ন অর্ডার: {currency}{coupon.minOrderAmount}</p>}
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                                                    <span className="text-[11px] text-slate-400">
                                                        মেয়াদ: {new Date(coupon.expiresAt).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopyCoupon(coupon.code)}
                                                        disabled={!coupon.isActive || isExpired}
                                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                                                    >
                                                        {copiedCoupon === coupon.code ? (
                                                            <>
                                                                <Check size={13} className="text-green-400" />
                                                                কপি হয়েছে
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={13} />
                                                                কপি কোড
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 5. SETTINGS TAB */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                
                                {/* Profile Info Edit */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                                    <h2 className="text-xl font-bold text-slate-800 mb-1">ব্যক্তিগত তথ্য পরিবর্তন</h2>
                                    <p className="text-xs text-slate-500 mb-6">আপনার প্রোফাইলের নাম ও যোগাযোগের বিবরণ আপডেট করুন</p>

                                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                পূর্ণ নাম
                                            </label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                    মোবাইল নাম্বার
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={editPhone}
                                                    onChange={(e) => setEditPhone(e.target.value)}
                                                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                    ইমেইল ঠিকানা
                                                </label>
                                                <input
                                                    type="email"
                                                    value={editEmail}
                                                    onChange={(e) => setEditEmail(e.target.value)}
                                                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                                                />
                                            </div>
                                        </div>

                                        {/* Profile Picture Upload Section */}
                                        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
                                            <label className="block text-xs font-bold text-slate-800">
                                                প্রোফাইল ছবি (Profile Photo)
                                            </label>
                                            
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                {/* Preview Thumbnail */}
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={editAvatar || currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                                        alt="Profile Preview"
                                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-green-500 shadow-sm bg-white"
                                                    />
                                                    {editAvatar && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditAvatar('')}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-xs shadow hover:bg-red-600 transition cursor-pointer"
                                                            title="ছবি রিমুভ করুন"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Upload Buttons & Options */}
                                                <div className="flex-1 space-y-2 w-full">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <label className="px-4 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer">
                                                            <Upload size={16} />
                                                            সরাসরি ছবি আপলোড করুন
                                                            <input
                                                                ref={formFileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={handleFormImageUpload}
                                                            />
                                                        </label>
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowUrlInput(!showUrlInput)}
                                                            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                                                        >
                                                            {showUrlInput ? 'URL ইনপুট বন্ধ করুন' : 'অথবা Image URL দিন'}
                                                        </button>
                                                    </div>

                                                    <p className="text-[11px] text-slate-400">
                                                        সাপোর্টেড ফরম্যাট: JPG, PNG, WebP (সর্বোচ্চ ৫ মেগাবাইট)
                                                    </p>

                                                    {/* Optional URL Input if toggled */}
                                                    {showUrlInput && (
                                                        <div className="mt-2 animate-[fadeIn_0.15s_ease-out]">
                                                            <input
                                                                type="url"
                                                                value={editAvatar}
                                                                onChange={(e) => setEditAvatar(e.target.value)}
                                                                placeholder="https://example.com/avatar.jpg"
                                                                className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs"
                                        >
                                            পরিবর্তন সংরক্ষণ করুন
                                        </button>
                                    </form>
                                </div>

                                {/* Password Change Form */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                                    <h2 className="text-xl font-bold text-slate-800 mb-1">পাসওয়ার্ড পরিবর্তন</h2>
                                    <p className="text-xs text-slate-500 mb-6">আপনার একাউন্টের নিরাপত্তা বজায় রাখতে নিয়মিত পাসওয়ার্ড পরিবর্তন করুন</p>

                                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                নতুন পাসওয়ার্ড
                                            </label>
                                            <input
                                                type="password"
                                                value={newPass}
                                                onChange={(e) => setNewPass(e.target.value)}
                                                placeholder="কমপক্ষে ৬ অক্ষর"
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                নতুন পাসওয়ার্ড নিশ্চিত করুন
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmNewPass}
                                                onChange={(e) => setConfirmNewPass(e.target.value)}
                                                placeholder="পুনরায় টাইপ করুন"
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs"
                                        >
                                            পাসওয়ার্ড আপডেট করুন
                                        </button>
                                    </form>
                                </div>

                            </div>
                        )}

                        {/* 6. WISHLIST TAB */}
                        {activeTab === 'wishlist' && renderWishlistContent()}

                    </div>
                </div>

            </div>

            {/* ORDER DETAILS MODAL */}
            {selectedOrder && (
                <div 
                    onClick={() => setSelectedOrder(null)} 
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
                    >
                        <button 
                            onClick={() => setSelectedOrder(null)} 
                            className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                        >
                            <XCircle size={22} />
                        </button>

                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">অর্ডার বিবরণী</h2>
                                <p className="text-xs text-slate-400 font-mono">অর্ডার আইডি: #{selectedOrder.id}</p>
                            </div>
                            {getStatusBadge(selectedOrder.status)}
                        </div>

                        {/* Visual Progress Stepper */}
                        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mb-6">
                            <h4 className="text-xs font-bold text-slate-700 mb-3">ডেলিভারি স্ট্যাটাস ট্র্যাকার</h4>
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                <div className="flex flex-col items-center gap-1 text-green-600">
                                    <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center shadow-xs">
                                        <Check size={14} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs">অর্ডার গৃহীত</span>
                                </div>
                                <div className={`flex-1 h-1 mx-2 ${selectedOrder.status !== 'ORDER_PLACED' ? 'bg-green-600' : 'bg-slate-200'}`} />
                                <div className={`flex flex-col items-center gap-1 ${['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'text-green-600' : 'text-slate-400'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-green-600 text-white shadow-xs' : 'bg-slate-200'}`}>
                                        <Clock size={14} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs">প্রক্রিয়াধীন</span>
                                </div>
                                <div className={`flex-1 h-1 mx-2 ${['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-green-600' : 'bg-slate-200'}`} />
                                <div className={`flex flex-col items-center gap-1 ${['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'text-green-600' : 'text-slate-400'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-green-600 text-white shadow-xs' : 'bg-slate-200'}`}>
                                        <Truck size={14} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs">অন দ্য ওয়ে</span>
                                </div>
                                <div className={`flex-1 h-1 mx-2 ${selectedOrder.status === 'DELIVERED' ? 'bg-green-600' : 'bg-slate-200'}`} />
                                <div className={`flex flex-col items-center gap-1 ${selectedOrder.status === 'DELIVERED' ? 'text-green-600' : 'text-slate-400'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${selectedOrder.status === 'DELIVERED' ? 'bg-green-600 text-white shadow-xs' : 'bg-slate-200'}`}>
                                        <CheckCircle2 size={14} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs">ডেলিভার্ড</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address & Customer Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl mb-6 text-xs">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">গ্রাহকের তথ্য</h4>
                                <p className="text-slate-600">নাম: {selectedOrder.user?.name || currentUser.name}</p>
                                <p className="text-slate-600">ফোন: {selectedOrder.address?.phone || currentUser.phone}</p>
                                <p className="text-slate-600">পেমেন্ট মেথড: <strong>{selectedOrder.paymentMethod || 'COD'}</strong></p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">ডেলিভারি ঠিকানা</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    {selectedOrder.address?.street || selectedOrder.address?.address || 'ঠিকানা উপলব্ধ নেই'}, {selectedOrder.address?.city || ''}
                                </p>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3 mb-6">
                            <h4 className="font-bold text-slate-800 text-sm">অর্ডারের আইটেমসমূহ</h4>
                            {(selectedOrder.orderItems || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 bg-white">
                                    <img
                                        src={item.product?.images?.[0]?.src || item.product?.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80"}
                                        alt={item.product?.name}
                                        className="w-12 h-12 object-cover rounded-lg border border-slate-100 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm truncate">{item.product?.name}</p>
                                        <p className="text-xs text-slate-400">পরিমাণ: {item.quantity} × {currency}{item.price}</p>
                                    </div>
                                    <div className="font-bold text-slate-800 text-sm">
                                        {currency}{(item.quantity * item.price).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Financial summary */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                            <div className="text-xs text-slate-500">
                                {selectedOrder.isCouponUsed && (
                                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium inline-block">
                                        কুপন ডিসকাউন্ট প্রয়োগ করা হয়েছে
                                    </span>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block">সর্বমোট পরিশোধযোগ্য</span>
                                <span className="text-2xl font-bold text-green-600">{currency}{selectedOrder.total}</span>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ADD / EDIT ADDRESS MODAL */}
            {isAddressModalOpen && (
                <div 
                    onClick={() => setIsAddressModalOpen(false)} 
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 relative"
                    >
                        <button 
                            onClick={() => setIsAddressModalOpen(false)} 
                            className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                            <XCircle size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-slate-800 mb-1">
                            {editingAddress ? 'ঠিকানা এডিট করুন' : 'নতুন ঠিকানা যোগ করুন'}
                        </h3>
                        <p className="text-xs text-slate-500 mb-5">ডেলিভারি সহজ করার জন্য সঠিক তথ্য প্রদান করুন</p>

                        <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">ঠিকানার নাম / লেবেল</label>
                                <select
                                    value={addrLabel}
                                    onChange={(e) => setAddrLabel(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-green-500"
                                >
                                    <option value="বাসা (Home)">বাসা (Home)</option>
                                    <option value="অফিস (Office)">অফিস (Office)</option>
                                    <option value="অন্যান্য (Other)">অন্যান্য (Other)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">প্রাপকের নাম *</label>
                                    <input
                                        type="text"
                                        value={addrName}
                                        onChange={(e) => setAddrName(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">মোবাইল নাম্বার *</label>
                                    <input
                                        type="tel"
                                        value={addrPhone}
                                        onChange={(e) => setAddrPhone(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">রাস্তা / বাড়ি / এলাকা *</label>
                                <textarea
                                    value={addrStreet}
                                    onChange={(e) => setAddrStreet(e.target.value)}
                                    rows={2}
                                    placeholder="বাড়ি নং, রোড নং, এলাকা..."
                                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">শহর / জেলা</label>
                                    <input
                                        type="text"
                                        value={addrCity}
                                        onChange={(e) => setAddrCity(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">পোস্ট কোড</label>
                                    <input
                                        type="text"
                                        value={addrZip}
                                        onChange={(e) => setAddrZip(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={addrIsDefault}
                                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                                    className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 accent-green-600"
                                />
                                <span className="font-semibold text-slate-700">ডিফল্ট ডেলিভারি ঠিকানা হিসেবে নির্ধারণ করুন</span>
                            </label>

                            <div className="flex gap-2 justify-end pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddressModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-xs"
                                >
                                    সংরক্ষণ করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-slate-400">লোড হচ্ছে...</div>}>
            <ProfileDashboard />
        </Suspense>
    )
}
