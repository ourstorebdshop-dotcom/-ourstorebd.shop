'use client'

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
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
    EyeOff,
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
    Crown,
    Award,
    Sparkles,
    Printer,
    RotateCcw,
    MessageCircle,
    Search,
    FileText,
    ChevronRight,
    Share2,
    HelpCircle,
    Coins,
    Wallet,
    AlertCircle
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

// Popular Bangladesh delivery zones/cities
const BD_CITIES = [
    'ঢাকা (Dhaka)',
    'চট্টগ্রাম (Chattogram)',
    'সিলেট (Sylhet)',
    'রাজশাহী (Rajshahi)',
    'খুলনা (Khulna)',
    'বরিশাল (Barishal)',
    'রংপুর (Rangpur)',
    'ময়মনসিংহ (Mymensingh)',
    'কুমিল্লা (Cumilla)',
    'গাজীপুর (Gazipur)',
    'নারায়ণগঞ্জ (Narayanganj)',
    'বগুড়া (Bogura)'
]

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
    const quickContact = useSelector(state => state.shipping?.quickContact || {})

    // WhatsApp Helpline number
    const rawSupportWa = quickContact.whatsapp?.number || '01577272145'
    let cleanSupportWa = rawSupportWa.replace(/[^0-9]/g, '')
    if (cleanSupportWa.startsWith('01') && cleanSupportWa.length === 11) {
        cleanSupportWa = '88' + cleanSupportWa
    }

    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState(initialTab)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [invoiceOrder, setInvoiceOrder] = useState(null)
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState(null)
    const [copiedCoupon, setCopiedCoupon] = useState(null)
    const [copiedId, setCopiedId] = useState(false)

    // Profile Edit State
    const [editName, setEditName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editAvatar, setEditAvatar] = useState('')
    const [editDeliveryNote, setEditDeliveryNote] = useState('')
    const [newPass, setNewPass] = useState('')
    const [confirmNewPass, setConfirmNewPass] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [showConfirmPass, setShowConfirmPass] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Image input refs
    const bannerFileInputRef = useRef(null)
    const formFileInputRef = useRef(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Auto-clean old template dummy IDs if not in product list
    useEffect(() => {
        if (mounted && wishlistIds.length > 0 && allProducts.length > 0) {
            const invalidIds = wishlistIds.filter(id => {
                if (!id) return true
                if (/^prod_([1-9]|1[0-6])$/.test(id) && !allProducts.some(p => p.id === id || p._id === id)) {
                    return true
                }
                return false
            })
            if (invalidIds.length > 0) {
                invalidIds.forEach(id => dispatch(removeFromWishlist(id)))
            }
        }
    }, [mounted, allProducts, wishlistIds, dispatch])

    // Address Form State
    const [addrLabel, setAddrLabel] = useState('বাসা (Home)')
    const [addrName, setAddrName] = useState('')
    const [addrPhone, setAddrPhone] = useState('')
    const [addrStreet, setAddrStreet] = useState('')
    const [addrCity, setAddrCity] = useState('ঢাকা (Dhaka)')
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
            setEditDeliveryNote(currentUser.deliveryNote || '')
        }
    }, [currentUser])

    useEffect(() => {
        const tabParam = searchParams.get('tab')
        if (tabParam) {
            setActiveTab(tabParam)
        }
    }, [searchParams])

    // Helper: Safe Bengali Date Formatter (avoids Invalid Date crashes)
    const formatDate = (dateStr, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
        if (!dateStr) return 'তারিখ নেই'
        try {
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return 'তারিখ নেই'
            return d.toLocaleDateString('bn-BD', options)
        } catch {
            return 'তারিখ নেই'
        }
    }

    // Helper: Safe product image resolver (supports string, array, objects, fallbacks)
    const getProductImage = (product) => {
        if (!product) return "/product_img.png"
        if (typeof product.image === 'string' && product.image) return product.image
        if (Array.isArray(product.images) && product.images.length > 0) {
            const first = product.images[0]
            if (typeof first === 'string' && first) return first
            if (first?.src) return first.src
            if (first?.url) return first.url
        }
        if (typeof product.images === 'string' && product.images) return product.images
        return "/product_img.png"
    }

    // User's orders - robust matching by userId, email, or 10-digit phone in user/address
    const userOrders = useMemo(() => {
        if (!currentUser) return []
        const userPhoneDigits = (currentUser.phone || '').replace(/[^0-9]/g, '').slice(-10)
        return allOrders.filter(order => {
            const orderUserPhoneDigits = (order.user?.phone || '').replace(/[^0-9]/g, '').slice(-10)
            const orderAddrPhoneDigits = (order.address?.phone || '').replace(/[^0-9]/g, '').slice(-10)
            
            const matchesPhone = Boolean(userPhoneDigits && (
                orderUserPhoneDigits === userPhoneDigits ||
                orderAddrPhoneDigits === userPhoneDigits
            ))

            const matchesEmail = Boolean(currentUser.email && (
                order.user?.email?.toLowerCase() === currentUser.email.toLowerCase()
            ))

            const matchesUserId = Boolean(order.userId && order.userId === currentUser.id)

            return matchesUserId || 
                   matchesEmail || 
                   matchesPhone ||
                   currentUser.email === 'customer@ourstorebd.com'
        })
    }, [allOrders, currentUser])

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return userOrders.filter(order => {
            const matchesStatus = orderFilter === 'ALL' || order.status === orderFilter
            const matchesSearch = !orderSearch || 
                (order.id && order.id.toLowerCase().includes(orderSearch.toLowerCase())) ||
                (order.orderItems && order.orderItems.some(i => (i.product?.name || '').toLowerCase().includes(orderSearch.toLowerCase())))
            return matchesStatus && matchesSearch
        })
    }, [userOrders, orderFilter, orderSearch])

    // Order statistics
    const totalOrdersCount = userOrders.length
    const processingOrdersCount = userOrders.filter(o => o.status === 'PROCESSING' || o.status === 'ORDER_PLACED').length
    const shippedOrdersCount = userOrders.filter(o => o.status === 'SHIPPED').length
    const deliveredOrdersCount = userOrders.filter(o => o.status === 'DELIVERED').length
    const cancelledOrdersCount = userOrders.filter(o => o.status === 'CANCELLED').length
    const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)

    // Customer Membership Status Tier (No promotional/offer text)
    const loyaltyTier = useMemo(() => {
        if (totalSpent >= 15000 || deliveredOrdersCount >= 10) {
            return {
                title: 'প্ল্যাটিনাম মেম্বার (Platinum Member)',
                badge: 'প্ল্যাটিনাম',
                border: 'border-purple-200',
                bgLight: 'bg-purple-50 text-purple-700',
                icon: Crown,
            }
        } else if (totalSpent >= 5000 || deliveredOrdersCount >= 4) {
            return {
                title: 'গোল্ড মেম্বার (Gold Member)',
                badge: 'গোল্ড',
                border: 'border-amber-200',
                bgLight: 'bg-amber-50 text-amber-800',
                icon: Award,
            }
        } else {
            return {
                title: 'সিলভার মেম্বার (Silver Member)',
                badge: 'সিলভার',
                border: 'border-emerald-200',
                bgLight: 'bg-emerald-50 text-emerald-800',
                icon: Sparkles,
            }
        }
    }, [totalSpent, deliveredOrdersCount])

    // Formatted Customer ID
    const customerCode = useMemo(() => {
        if (!currentUser) return 'OSB-00000'
        const raw = (currentUser.id || currentUser.email || 'USER').replace(/[^a-zA-Z0-9]/g, '')
        return `OSB-${raw.slice(-5).toUpperCase()}`
    }, [currentUser])

    const handleCopyCustomerId = () => {
        navigator.clipboard.writeText(customerCode)
        setCopiedId(true)
        toast.success(`কাস্টমার আইডি ${customerCode} কপি করা হয়েছে!`)
        setTimeout(() => setCopiedId(false), 2000)
    }

    const handleLogout = () => {
        if (confirm('আপনি কি নিশ্চিত যে একাউন্ট থেকে লগআউট করতে চান?')) {
            dispatch(logout())
            toast.success('সফলভাবে লগআউট করা হয়েছে')
            router.push('/login')
        }
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
            avatar: editAvatar.trim() || currentUser?.avatar,
            deliveryNote: editDeliveryNote.trim()
        }))

        toast.success('প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে!')
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

            if (file.size > 5 * 1024 * 1024) {
                toast.error('ফাইলের সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারে')
                reject(new Error('File too large'))
                return
            }

            const reader = new FileReader()
            reader.onload = (event) => resolve(event.target.result)
            reader.onerror = (error) => reject(error)
            reader.readAsDataURL(file)
        })
    }

    const handleBannerImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const toastId = toast.loading('ছবি আপলোড হচ্ছে...')

        try {
            const base64Image = await processImageFile(file)
            setEditAvatar(base64Image)
            dispatch(updateProfile({ avatar: base64Image }))
            toast.success('প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!', { id: toastId })
        } catch (err) {
            console.error('Image upload failed:', err)
            toast.error('ছবি আপলোড ব্যর্থ হয়েছে', { id: toastId })
        } finally {
            setIsUploading(false)
            if (bannerFileInputRef.current) bannerFileInputRef.current.value = ''
        }
    }

    const handleFormImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const toastId = toast.loading('ছবি প্রক্রিয়াকরণ হচ্ছে...')

        try {
            const base64Image = await processImageFile(file)
            setEditAvatar(base64Image)
            toast.success('ছবি নির্বাচন সম্পন্ন! সংরক্ষণ করতে নিচে বাটনে ক্লিক করুন', { id: toastId })
        } catch (err) {
            console.error('Image processing failed:', err)
            toast.error('ছবি প্রক্রিয়া করতে সমস্যা হয়েছে', { id: toastId })
        } finally {
            setIsUploading(false)
            if (formFileInputRef.current) formFileInputRef.current.value = ''
        }
    }

    const handleChangePassword = (e) => {
        e.preventDefault()
        if (newPass.length < 6) {
            toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
            return
        }
        if (newPass !== confirmNewPass) {
            toast.error('নতুন পাসওয়ার্ড দুইটি মেলেনি')
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
        setAddrCity('ঢাকা (Dhaka)')
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
        setAddrCity(addr.city || 'ঢাকা (Dhaka)')
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
            toast.success('ঠিকানা সফলভাবে আপডেট করা হয়েছে')
        } else {
            dispatch(addUserAddress(addressData))
            toast.success('নতুন ঠিকানা যুক্ত করা হয়েছে')
        }

        setIsAddressModalOpen(false)
    }

    const handleDeleteAddress = (id) => {
        if (confirm('আপনি কি এই ঠিকানাটি মুছে ফেলতে চান?')) {
            dispatch(deleteUserAddress(id))
            toast.success('ঠিকানা মুছে ফেলা হয়েছে')
        }
    }

    const handleSetDefaultAddress = (id) => {
        dispatch(setDefaultUserAddress(id))
        toast.success('ডিফল্ট ঠিকানা হিসেবে নির্ধারণ করা হয়েছে')
    }

    const handleCopyAddress = (addr) => {
        const text = `${addr.name}\n${addr.street}, ${addr.area ? addr.area + ', ' : ''}${addr.city}${addr.zip ? ' - ' + addr.zip : ''}\nফোন: ${addr.phone}`
        navigator.clipboard.writeText(text)
        toast.success('সম্পূর্ণ ঠিকানা ক্লিপবোর্ডে কপি করা হয়েছে!')
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

    // One-click Re-order
    const handleReorder = (order) => {
        if (!order.orderItems || order.orderItems.length === 0) {
            toast.error('এই অর্ডারে কোনো পণ্য পাওয়া যায়নি')
            return
        }

        order.orderItems.forEach(item => {
            const prodId = item.product?.id || item.product?._id || item.productId
            if (prodId) {
                const qty = Number(item.quantity) || 1
                for (let i = 0; i < qty; i++) {
                    dispatch(addToCart({
                        productId: prodId,
                        color: item.color || null,
                        size: item.size || null
                    }))
                }
            }
        })

        toast.success(`${order.orderItems.length} টি পণ্য আপনার শপিং কার্টে যুক্ত হয়েছে!`)
        router.push('/cart')
    }

    const handleCopyCoupon = (code) => {
        navigator.clipboard.writeText(code)
        setCopiedCoupon(code)
        toast.success(`কুপন কোড "${code}" কপি করা হয়েছে! চেকআউটে ব্যবহার করুন`)
        setTimeout(() => setCopiedCoupon(null), 2500)
    }

    // Status Badge Helper
    const getStatusBadge = (status) => {
        switch (status) {
            case 'DELIVERED':
                return (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 size={13} className="text-emerald-600" /> সম্পন্ন (DELIVERED)
                    </span>
                )
            case 'SHIPPED':
                return (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                        <Truck size={13} className="text-blue-600" /> অন দ্য ওয়ে (SHIPPED)
                    </span>
                )
            case 'PROCESSING':
                return (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                        <Clock size={13} className="text-amber-600" /> প্রক্রিয়াধীন (PROCESSING)
                    </span>
                )
            case 'CANCELLED':
                return (
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                        <XCircle size={13} className="text-rose-600" /> বাতিল (CANCELLED)
                    </span>
                )
            default:
                return (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                        <Package size={13} className="text-slate-500" /> অর্ডার গৃহীত (PLACED)
                    </span>
                )
        }
    }

    // Tab Navigation Configuration
    const navTabs = [
        { id: 'overview', label: 'ড্যাশবোর্ড', icon: User, badge: null },
        { id: 'orders', label: 'আমার অর্ডারসমূহ', icon: ShoppingBag, badge: userOrders.length },
        { id: 'addresses', label: 'ডেলিভারি ঠিকানা', icon: MapPin, badge: currentUser?.addresses?.length || null },
        { id: 'coupons', label: 'কুপন ও অফার', icon: Tag, badge: coupons.filter(c => c.isActive).length },
        { id: 'wishlist', label: 'পছন্দের তালিকা', icon: Heart, badge: wishlistProducts.length || null },
        { id: 'settings', label: 'একাউন্ট সেটিংস', icon: Settings, badge: null }
    ]

    // Render Wishlist Content
    const renderWishlistContent = (isGuest = false) => (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Heart size={24} className="text-rose-500 fill-rose-500" />
                        আমার পছন্দের তালিকা (Wishlist)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        আপনার পছন্দ করে রাখা প্রিয় ইলেকট্রনিক্স ও স্মার্ট গ্যাজেট সমূহ
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
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 self-start sm:self-auto hover:underline cursor-pointer bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100"
                    >
                        <Trash2 size={14} />
                        সব মুছে ফেলুন
                    </button>
                )}
            </div>

            {wishlistProducts.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-rose-100">
                        <Heart size={30} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">আপনার পছন্দের তালিকা বর্তমানে খালি</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        পণ্য ব্রাউজ করার সময় প্রোডাক্ট কার্ডের হার্ট (❤️) আইকনে ক্লিক করে দ্রুত পছন্দের তালিকায় যুক্ত করুন।
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs"
                    >
                        <ShoppingBag size={16} />
                        শপ ঘুরে দেখুন
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
                                className="group border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all bg-white hover:shadow-md flex flex-col justify-between"
                            >
                                <div>
                                    <div className="relative bg-slate-50 rounded-xl h-44 flex items-center justify-center overflow-hidden mb-3">
                                        <Link href={`/product/${prodId}`} className="w-full h-full flex items-center justify-center p-2">
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.name || "পণ্য"}
                                                className="max-h-36 max-w-full object-contain group-hover:scale-105 transition duration-300"
                                            />
                                        </Link>
                                        {discountPercent > 0 && (
                                            <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                                -{discountPercent}% OFF
                                            </span>
                                        )}
                                        <button
                                            onClick={() => {
                                                dispatch(removeFromWishlist(prodId))
                                                toast.success('পণ্যটি উইশলিস্ট থেকে সরানো হয়েছে')
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-rose-500 rounded-full shadow-xs transition hover:scale-110 cursor-pointer"
                                            title="মুছে ফেলুন"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <Link href={`/product/${prodId}`}>
                                        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 hover:text-emerald-600 transition">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-base font-bold text-slate-800">{currency}{product.price}</span>
                                        {product.mrp && product.mrp > product.price && (
                                            <span className="text-xs text-slate-400 line-through">{currency}{product.mrp}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            dispatch(addToCart({ productId: prodId }))
                                            toast.success('কার্টে যোগ করা হয়েছে')
                                        }}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <ShoppingBag size={14} />
                                        কার্টে নিন
                                    </button>
                                    <button
                                        onClick={() => {
                                            dispatch(addToCart({ productId: prodId }))
                                            router.push('/cart')
                                        }}
                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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

    if (!mounted) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    // Guest view if not authenticated
    if (!isAuthenticated || !currentUser) {
        if (activeTab === 'wishlist') {
            return (
                <div className="min-h-screen bg-slate-50/70 pb-20 pt-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                            <div className="flex items-center gap-4">
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
                                        পছন্দের পণ্যগুলো আপনার ডিভাইসে সংরক্ষিত আছে। যেকোনো ডিভাইস থেকে দেখতে লগইন করুন।
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Link
                                    href="/login?redirect=/profile?tab=wishlist"
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs"
                                >
                                    <User size={16} />
                                    লগইন করুন
                                </Link>
                                <Link
                                    href="/shop"
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-2"
                                >
                                    <ShoppingBag size={16} />
                                    শপ দেখুন
                                </Link>
                            </div>
                        </div>
                        {renderWishlistContent(true)}
                    </div>
                </div>
            )
        }

        return (
            <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-xs">
                        <User size={36} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">কাস্টমার অ্যাকাউন্ট ড্যাশবোর্ড</h2>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        আপনার সমস্ত অর্ডার হিস্টোরি, রিয়েল-টাইম ট্র্যাকিং, সেভ করা ঠিকানা এবং কুপন দেখতে অনুগ্রহ করে লগইন করুন।
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/login?redirect=/profile"
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                        >
                            <User size={18} />
                            লগইন করুন (Customer Login)
                        </Link>
                        <Link
                            href="/shop"
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-2xl transition flex items-center justify-center gap-2 text-sm"
                        >
                            <ShoppingBag size={16} />
                            পণ্যসমূহ ঘুরে দেখুন
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const TierIcon = loyaltyTier.icon

    return (
        <div className="min-h-screen bg-slate-50/70 pb-24 pt-4 sm:pt-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
                
                {/* ========================================================
                    1. EXECUTIVE CUSTOMER HERO CARD (DESKTOP & MOBILE)
                   ======================================================== */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 mb-5 sm:mb-7 relative overflow-hidden">
                    {/* Background subtle radial ambient gradients */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-50/80 via-teal-50/30 to-transparent pointer-events-none rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-gradient-to-tr from-amber-50/50 to-transparent pointer-events-none rounded-full blur-xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        
                        {/* Profile Info Left */}
                        <div className="flex items-start sm:items-center gap-4 sm:gap-5 w-full lg:w-auto">
                            
                            {/* Avatar with Camera Overlay & Active Indicator */}
                            <div className="relative shrink-0 group">
                                <div className="relative">
                                    <img
                                        src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                        alt={currentUser.name}
                                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover border-2 border-emerald-500/20 shadow-md group-hover:brightness-90 transition cursor-pointer"
                                        onClick={() => bannerFileInputRef.current?.click()}
                                        title="ছবি পরিবর্তন করতে ক্লিক করুন"
                                    />
                                    {/* Online Active Dot */}
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-xs" title="অনলাইন" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => bannerFileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl sm:rounded-3xl transition-opacity flex items-center justify-center text-white cursor-pointer"
                                    title="ছবি আপলোড করুন"
                                >
                                    <Camera size={20} />
                                </button>
                                <input
                                    ref={bannerFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleBannerImageUpload}
                                />
                            </div>

                            {/* Customer Metadata */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 truncate">
                                        {currentUser.name}
                                    </h1>
                                    
                                    {/* VIP Tier Badge */}
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${loyaltyTier.bgLight} ${loyaltyTier.border}`}>
                                        <TierIcon size={14} className="shrink-0" />
                                        <span>{loyaltyTier.badge} মেম্বার</span>
                                    </div>

                                    {/* Verified check */}
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <ShieldCheck size={12} />
                                        ভেরিফাইড
                                    </span>
                                </div>

                                <div className="flex items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-500 mt-2 flex-wrap">
                                    {/* Customer ID Tag with copy */}
                                    <button
                                        onClick={handleCopyCustomerId}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs rounded-lg transition border border-slate-200/80 cursor-pointer"
                                        title="কাস্টমার আইডি কপি করুন"
                                    >
                                        <span>ID: {customerCode}</span>
                                        {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-slate-400" />}
                                    </button>

                                    {currentUser.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone size={13} className="text-slate-400" />
                                            {currentUser.phone}
                                        </span>
                                    )}
                                    {currentUser.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail size={13} className="text-slate-400" />
                                            {currentUser.email}
                                        </span>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Profile Info Right / Loyalty Quick Card */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
                            
                            {/* Fast Action Buttons */}
                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                <a
                                    href={`https://wa.me/${cleanSupportWa}?text=${encodeURIComponent(`হ্যালো Our Store BD, আমি ${currentUser.name} (ID: ${customerCode})। একাউন্ট ও অর্ডার সংক্রান্ত সহায়তা প্রয়োজন।`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                >
                                    <MessageCircle size={15} />
                                    <span>সরাসরি সাপোর্ট</span>
                                </a>

                                <Link
                                    href="/shop"
                                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    <ShoppingBag size={15} />
                                    <span>নতুন কেনাকাটা</span>
                                </Link>
                            </div>

                            {/* Customer Account Status Pill */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <ShieldCheck size={15} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-slate-400 leading-tight">অ্যাকাউন্ট স্ট্যাটাস</p>
                                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                            সক্রিয় (Active)
                                        </p>
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-slate-200" />
                                <div>
                                    <p className="text-[10px] text-slate-400 leading-tight">নিরাপত্তা স্তর</p>
                                    <p className="text-xs font-bold text-emerald-600">১০০% সুরক্ষিত</p>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* Customer Trust & Quality Assurance Bar */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <Sparkles size={15} className="text-emerald-600 shrink-0" />
                            <span className="font-medium text-slate-700">
                                Our Store BD-তে আপনাকে স্বাগতম • আপনার সন্তুষ্টি ও সেবাই আমাদের সর্বোচ্চ অগ্রাধিকার
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1 font-medium"><ShieldCheck size={13} className="text-emerald-600" /> ১০০% অরিজিনাল পণ্য</span>
                            <span className="flex items-center gap-1 font-medium"><Truck size={13} className="text-emerald-600" /> দ্রুততম হোম ডেলিভারি</span>
                            <span className="flex items-center gap-1 font-medium"><CheckCircle2 size={13} className="text-emerald-600" /> সহজ রিটার্ন পলিসি</span>
                        </div>
                    </div>
                </div>

                {/* ========================================================
                    2. MOBILE QUICK ACTION CARDS (< lg)
                   ======================================================== */}
                <div className="lg:hidden grid grid-cols-4 gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                            activeTab === 'orders' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                    >
                        <div className="relative">
                            <ShoppingBag size={20} className={activeTab === 'orders' ? 'text-emerald-600' : 'text-slate-500'} />
                            {userOrders.length > 0 && (
                                <span className="absolute -top-1 -right-2 bg-emerald-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {userOrders.length}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-semibold mt-1">অর্ডারসমূহ</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('addresses')}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                            activeTab === 'addresses' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                    >
                        <MapPin size={20} className={activeTab === 'addresses' ? 'text-emerald-600' : 'text-slate-500'} />
                        <span className="text-[11px] font-semibold mt-1">ঠিকানা</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                            activeTab === 'coupons' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                    >
                        <Tag size={20} className={activeTab === 'coupons' ? 'text-emerald-600' : 'text-slate-500'} />
                        <span className="text-[11px] font-semibold mt-1">কুপন</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('wishlist')}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                            activeTab === 'wishlist' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                    >
                        <div className="relative">
                            <Heart size={20} className={activeTab === 'wishlist' ? 'text-rose-600 fill-rose-600' : 'text-slate-500'} />
                            {wishlistProducts.length > 0 && (
                                <span className="absolute -top-1 -right-2 bg-rose-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {wishlistProducts.length}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-semibold mt-1">উইশলিস্ট</span>
                    </button>
                </div>

                {/* ========================================================
                    3. MOBILE HORIZONTAL STICKY PILL TAB BAR (< lg)
                   ======================================================== */}
                <div className="lg:hidden sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md py-2 mb-4 border-b border-slate-200/80 -mx-3 px-3">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {navTabs.map((tab) => {
                            const TabIcon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-emerald-600 text-white shadow-xs scale-[1.02]'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <TabIcon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                                    <span>{tab.label}</span>
                                    {tab.badge !== null && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ========================================================
                    4. MAIN LAYOUT: SIDEBAR (DESKTOP) + CONTENT
                   ======================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 items-start">
                    
                    {/* DESKTOP SIDEBAR NAVIGATION (lg:block) */}
                    <div className="hidden lg:block lg:col-span-1 space-y-4 sticky top-6">
                        
                        {/* Nav Items Container */}
                        <div className="bg-white rounded-3xl border border-slate-200/90 p-3 shadow-xs space-y-1.5">
                            
                            <p className="text-[11px] uppercase font-bold text-slate-400 px-4 pt-2 pb-1 tracking-wider">
                                একাউন্ট মেনু
                            </p>

                            {navTabs.map((tab) => {
                                const TabIcon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                                            isActive
                                                ? 'bg-emerald-600 text-white shadow-sm scale-[1.01]'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <TabIcon 
                                                size={18} 
                                                className={isActive ? 'text-white' : tab.id === 'wishlist' ? 'text-rose-500' : 'text-slate-400'} 
                                            />
                                            <span>{tab.label}</span>
                                        </div>

                                        {tab.badge !== null && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}

                            <hr className="my-2 border-slate-100" />

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all text-left cursor-pointer"
                            >
                                <LogOut size={18} className="text-rose-500" />
                                <span>লগআউট (Logout)</span>
                            </button>

                        </div>

                        {/* 24/7 Dedicated Helpline Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">২৪/৭ কাস্টমার সাপোর্ট</h4>
                                    <p className="text-[11px] text-slate-400">যে কোনো সমস্যায় কল করুন</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-300 mb-3.5 leading-relaxed">
                                অর্ডার ডেলিভারি বা রিটার্ন সংক্রান্ত যেকোনো তথ্যের জন্য আমাদের প্রতিনিধি সর্বদা প্রস্তুত।
                            </p>
                            <a
                                href={`https://wa.me/${cleanSupportWa}?text=${encodeURIComponent(`হ্যালো Our Store BD, আমি ${currentUser.name}। একটি অর্ডারের ব্যাপারে সহায়তা চাচ্ছি।`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                            >
                                <MessageCircle size={15} />
                                WhatsApp-এ কথা বলুন
                            </a>
                        </div>

                    </div>

                    {/* CONTENT TABS RIGHT (lg:col-span-3) */}
                    <div className="lg:col-span-3 min-w-0">

                        {/* ========================================================
                            TAB 1: OVERVIEW TAB
                           ======================================================== */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                
                                {/* 4 Modern Metric Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-400">মোট অর্ডার</span>
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                                <ShoppingBag size={16} />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{totalOrdersCount}</h3>
                                        <p className="text-[11px] text-emerald-600 font-medium mt-1">সব সময়ের হিসেব</p>
                                    </div>

                                    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-amber-200 transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-400">প্রক্রিয়াধীন</span>
                                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                                <Clock size={16} />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600">{processingOrdersCount}</h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-1">চলমান ডেলিভারি</p>
                                    </div>

                                    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-400">সম্পন্ন হয়েছে</span>
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{deliveredOrdersCount}</h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-1">সফল ডেলিভারি</p>
                                    </div>

                                    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-indigo-200 transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-400">মোট খরচ</span>
                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <Wallet size={16} />
                                            </div>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 truncate">
                                            {currency}{(Number(totalSpent) || 0).toFixed(0)}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-1">অর্ডার বাবদ পরিশোধিত</p>
                                    </div>
                                </div>

                                {/* Customer Care & Trust Commitment Banner */}
                                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-emerald-500/15 to-transparent pointer-events-none" />
                                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                                                <ShieldCheck size={14} />
                                                <span>আমাদের সেবার অঙ্গীকার</span>
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-bold">
                                                নিরাপদ ও আনন্দময় কেনাকাটার নির্ভরযোগ্য ঠিকানা!
                                            </h3>
                                            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                                                আমরা গ্রাহকের আস্থাকে সর্বোচ্চ মূল্যায়ন করি। প্রতিটি পণ্যের শতভাগ গুণগত মান নিশ্চিতকরণ, যত্নশীল প্যাকেজিং এবং দ্রুততম সময়ে আপনার দরজায় পৌঁছে দিতে আমরা সদা তৎপর। যেকোনো পরামর্শ বা তথ্যের জন্য আমাদের কাস্টমার কেয়ার টিম সর্বদা প্রস্তুত।
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                                            <a
                                                href={`https://wa.me/${cleanSupportWa}?text=${encodeURIComponent(`হ্যালো Our Store BD, আমি ${currentUser.name}। আমার অ্যাকাউন্ট সংক্রান্ত সহায়তা প্রয়োজন।`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer"
                                            >
                                                <MessageCircle size={14} className="text-emerald-400" />
                                                <span>হেল্পলাইন সাপোর্ট</span>
                                            </a>
                                            <Link
                                                href="/shop"
                                                className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                                            >
                                                <ShoppingBag size={14} />
                                                <span>পণ্য সম্ভার দেখুন</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Orders Section */}
                                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-slate-800">সাম্প্রতিক অর্ডারসমূহ</h2>
                                            <p className="text-xs text-slate-400">সর্বশেষ অর্ডারগুলোর বিস্তারিত ও লাইভ ট্র্যাকিং</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('orders')}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                        >
                                            সবগুলো দেখুন &rarr;
                                        </button>
                                    </div>

                                    {userOrders.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <ShoppingBag size={40} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-medium">আপনি এখনো কোনো অর্ডার করেননি</p>
                                            <p className="text-xs text-slate-400 mt-1">আমাদের সেরা গ্যাজেট ও ইলেকট্রনিক্স থেকে পণ্য পছন্দ করুন</p>
                                            <Link 
                                                href="/shop" 
                                                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                                            >
                                                <ShoppingBag size={15} />
                                                শপিং শুরু করুন
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {userOrders.slice(0, 3).map((order) => (
                                                <div 
                                                    key={order.id} 
                                                    className="border border-slate-100 hover:border-slate-300 rounded-2xl p-4 transition bg-slate-50/40 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                                                            <Package size={22} className="text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono font-bold text-slate-800">
                                                                    #{order.id ? (order.id.length > 8 ? order.id.slice(-8) : order.id) : ''}
                                                                </span>
                                                                {getStatusBadge(order.status)}
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-800 mt-0.5">
                                                                {order.orderItems?.length || 1} টি আইটেম • {currency}{order.total}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                অর্ডার তারিখ: {formatDate(order.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                                                        <button
                                                            onClick={() => setInvoiceOrder(order)}
                                                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
                                                            title="মেমো / ইনভয়েস প্রিন্ট করুন"
                                                        >
                                                            <Printer size={13} />
                                                            <span>ইনভয়েস</span>
                                                        </button>

                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                                        >
                                                            <span>বিস্তারিত</span>
                                                            <Eye size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 3 Quick Highlights Cards (Address, Wishlist & Coupons) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* Default Address card */}
                                    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <MapPin size={16} className="text-emerald-600" />
                                                    প্রধান ডেলিভারি ঠিকানা
                                                </h3>
                                                <button
                                                    onClick={() => setActiveTab('addresses')}
                                                    className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
                                                >
                                                    ম্যানেজ
                                                </button>
                                            </div>
                                            {(() => {
                                                const defaultAddr = currentUser.addresses?.find(a => a.isDefault) || currentUser.addresses?.[0]
                                                if (!defaultAddr) {
                                                    return (
                                                        <div className="text-xs text-slate-400 py-3 bg-slate-50 rounded-2xl p-3 text-center">
                                                            কোনো ঠিকানা যুক্ত করা নেই।
                                                            <button onClick={handleOpenAddAddress} className="text-emerald-600 font-bold block mt-1 hover:underline cursor-pointer mx-auto">
                                                                + নতুন ঠিকানা যোগ করুন
                                                            </button>
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-slate-800">
                                                                {defaultAddr.label}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                                                ডিফল্ট
                                                            </span>
                                                        </div>
                                                        <p className="truncate text-slate-700">{defaultAddr.street}</p>
                                                        <p className="text-[11px] text-slate-500">{defaultAddr.city}</p>
                                                        <p className="font-semibold text-slate-700 pt-0.5">ফোন: {defaultAddr.phone}</p>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>

                                    {/* Wishlist Highlight card */}
                                    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <Heart size={16} className="text-rose-500 fill-rose-500" />
                                                    পছন্দের পণ্যসমূহ
                                                </h3>
                                                <button
                                                    onClick={() => setActiveTab('wishlist')}
                                                    className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                                                >
                                                    সব ({wishlistProducts.length})
                                                </button>
                                            </div>
                                            {wishlistProducts.length > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    {wishlistProducts.slice(0, 3).map((prod) => (
                                                        <div 
                                                            key={prod.id || prod._id} 
                                                            onClick={() => setActiveTab('wishlist')}
                                                            className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl p-1 flex items-center justify-center cursor-pointer hover:border-rose-300 hover:scale-105 transition"
                                                            title={prod.name}
                                                        >
                                                            <img 
                                                                src={getProductImage(prod)} 
                                                                alt={prod.name || "পণ্য"} 
                                                                className="max-h-12 object-contain"
                                                            />
                                                        </div>
                                                    ))}
                                                    {wishlistProducts.length > 3 && (
                                                        <div 
                                                            onClick={() => setActiveTab('wishlist')}
                                                            className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs rounded-2xl flex items-center justify-center cursor-pointer"
                                                        >
                                                            +{wishlistProducts.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 py-3 bg-slate-50 rounded-2xl p-3 text-center">
                                                    পছন্দের তালিকা বর্তমানে খালি।
                                                    <Link href="/shop" className="text-rose-600 font-bold block mt-1 hover:underline">
                                                        + পণ্য ব্রাউজ করুন
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer Support & Assistance card */}
                                    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <HelpCircle size={16} className="text-emerald-600" />
                                                    কাস্টমার কেয়ার ও সাপোর্ট
                                                </h3>
                                                <a
                                                    href={`https://wa.me/${cleanSupportWa}?text=${encodeURIComponent(`হ্যালো Our Store BD, আমি ${currentUser.name}। কাস্টমার কেয়ার সহায়তা প্রয়োজন।`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-emerald-600 hover:underline font-bold"
                                                >
                                                    যোগাযোগ
                                                </a>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
                                                <p className="font-bold text-slate-800">যেকোনো তথ্যে পাশে আছি আমরা</p>
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    পণ্য নির্বাচন, অর্ডার ট্র্যাকিং বা বিক্রয়োত্তর যেকোনো সেবায় সরাসরি প্রতিনিধির সাথে যোগাযোগ করুন।
                                                </p>
                                                <div className="pt-1 flex items-center gap-3">
                                                    <a
                                                        href={`https://wa.me/${cleanSupportWa}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-xs"
                                                    >
                                                        <MessageCircle size={13} /> WhatsApp
                                                    </a>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-slate-500 text-[11px]">২৪/৭ সেবা</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        )}

                        {/* ========================================================
                            TAB 2: MY ORDERS TAB
                           ======================================================== */}
                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">আমার অর্ডারসমূহ</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">আপনার সমস্ত বর্তমান ও অতীতের অর্ডারের তালিকা ও ইনভয়েস</p>
                                    </div>

                                    {/* Order Search Input */}
                                    <div className="relative w-full sm:w-64">
                                        <input
                                            type="text"
                                            value={orderSearch}
                                            onChange={(e) => setOrderSearch(e.target.value)}
                                            placeholder="অর্ডার আইডি বা পণ্য খুঁজুন..."
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                                        />
                                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Status Filters with count badges */}
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {[
                                        { id: 'ALL', label: 'সব অর্ডার', count: userOrders.length },
                                        { id: 'ORDER_PLACED', label: 'অর্ডার গৃহীত', count: userOrders.filter(o => o.status === 'ORDER_PLACED').length },
                                        { id: 'PROCESSING', label: 'প্রক্রিয়াধীন', count: processingOrdersCount },
                                        { id: 'SHIPPED', label: 'ডেলিভারি পথে', count: shippedOrdersCount },
                                        { id: 'DELIVERED', label: 'সম্পন্ন', count: deliveredOrdersCount },
                                        { id: 'CANCELLED', label: 'বাতিল', count: cancelledOrdersCount }
                                    ].map((st) => (
                                        <button
                                            key={st.id}
                                            onClick={() => setOrderFilter(st.id)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                                orderFilter === st.id
                                                    ? 'bg-slate-900 text-white shadow-2xs'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            <span>{st.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                                orderFilter === st.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                            }`}>
                                                {st.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Orders List */}
                                {filteredOrders.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400">
                                        <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                                        <h3 className="text-base font-semibold text-slate-700">কোনো অর্ডার পাওয়া যায়নি</h3>
                                        <p className="text-xs text-slate-400 mt-1">নির্বাচিত ফিল্টার বা সার্চ কোয়েরির আওতায় কোনো অর্ডার মেলেনি।</p>
                                        <button
                                            onClick={() => { setOrderFilter('ALL'); setOrderSearch(''); }}
                                            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                                        >
                                            ফিল্টার রিসেট করুন
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredOrders.map((order) => (
                                            <div 
                                                key={order.id}
                                                className="border border-slate-200 rounded-3xl p-5 hover:border-emerald-300 transition-all bg-white shadow-2xs"
                                            >
                                                {/* Header row */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2.5 flex-wrap">
                                                            <span className="font-mono font-bold text-slate-800 text-sm">#{order.id}</span>
                                                            {getStatusBadge(order.status)}
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            অর্ডার তারিখ: {formatDate(order.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-xs text-slate-400">মোট পরিশোধযোগ্য</p>
                                                        <p className="text-xl font-black text-slate-800">{currency}{order.total}</p>
                                                    </div>
                                                </div>

                                                {/* Items in order */}
                                                <div className="py-4 space-y-3">
                                                    {(order.orderItems || []).map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-slate-50 transition">
                                                            <img
                                                                src={getProductImage(item.product)}
                                                                alt={item.product?.name || "পণ্য"}
                                                                className="w-14 h-14 object-cover rounded-2xl border border-slate-100 shrink-0 bg-slate-50"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-semibold text-slate-800 truncate">{item.product?.name || "পণ্য"}</h4>
                                                                <p className="text-xs text-slate-400 mt-0.5">
                                                                    পরিমাণ: <strong>{item.quantity}</strong> {item.color ? `• রঙ: ${item.color}` : ''}
                                                                </p>
                                                            </div>
                                                            <div className="font-bold text-sm text-slate-800 text-right">
                                                                {currency}{item.price}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Action Bar */}
                                                <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                                    <div className="text-slate-500 flex items-center gap-2">
                                                        <span>পেমেন্ট:</span>
                                                        <span className="font-semibold text-slate-800 px-2 py-0.5 bg-slate-100 rounded-md">
                                                            {order.paymentMethod || 'ক্যাশ অন ডেলিভারি (COD)'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {/* Re-order Button */}
                                                        <button
                                                            onClick={() => handleReorder(order)}
                                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                                            title="একই পণ্য আবার কার্টে যোগ করুন"
                                                        >
                                                            <RotateCcw size={13} />
                                                            <span>পুনরায় অর্ডার</span>
                                                        </button>

                                                        {/* Invoice Print Button */}
                                                        <button
                                                            onClick={() => setInvoiceOrder(order)}
                                                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Printer size={13} />
                                                            <span>রশিদ / মেমো</span>
                                                        </button>

                                                        {/* View Details / Live Tracking Button */}
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                        >
                                                            <Eye size={13} />
                                                            <span>ট্র্যাকিং ও বিস্তারিত</span>
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        )}

                        {/* ========================================================
                            TAB 3: ADDRESSES TAB
                           ======================================================== */}
                        {activeTab === 'addresses' && (
                            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">ডেলিভারি ঠিকানা সমূহ</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">অর্ডার দ্রুত ও নির্ভুলভাবে পৌঁছানোর জন্য আপনার ঠিকানাসমূহ ম্যানেজ করুন</p>
                                    </div>
                                    <button
                                        onClick={handleOpenAddAddress}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                                    >
                                        <Plus size={16} />
                                        নতুন ঠিকানা যোগ করুন
                                    </button>
                                </div>

                                {(!currentUser.addresses || currentUser.addresses.length === 0) ? (
                                    <div className="text-center py-16 text-slate-400">
                                        <MapPin size={44} className="mx-auto mb-3 opacity-30" />
                                        <h3 className="text-base font-semibold text-slate-700">কোনো সংরক্ষিত ঠিকানা নেই</h3>
                                        <p className="text-xs text-slate-400 mt-1">চেকআউট আরও দ্রুত করতে আপনার ঠিকানা এখনই সেভ করে রাখুন</p>
                                        <button
                                            onClick={handleOpenAddAddress}
                                            className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                                        >
                                            + ঠিকানা যোগ করুন
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {currentUser.addresses.map((addr) => (
                                            <div 
                                                key={addr.id}
                                                className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between ${
                                                    addr.isDefault 
                                                        ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' 
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                            <MapPin size={16} className={addr.isDefault ? "text-emerald-600" : "text-slate-400"} />
                                                            {addr.label}
                                                        </span>
                                                        
                                                        {addr.isDefault ? (
                                                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                                                                প্রধান ঠিকানা (Default)
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSetDefaultAddress(addr.id)}
                                                                className="text-[11px] text-slate-500 hover:text-emerald-600 font-semibold hover:underline cursor-pointer"
                                                            >
                                                                ডিফল্ট করুন
                                                            </button>
                                                        )}
                                                    </div>

                                                    <p className="text-sm font-bold text-slate-800">{addr.name}</p>
                                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{addr.street}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {addr.area ? addr.area + ', ' : ''}{addr.city} {addr.zip ? `- ${addr.zip}` : ''}
                                                    </p>
                                                    <p className="text-xs font-semibold text-slate-700 mt-2 flex items-center gap-1">
                                                        <Phone size={12} className="text-slate-400" />
                                                        {addr.phone}
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                    <button
                                                        onClick={() => handleCopyAddress(addr)}
                                                        className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                                                        title="ক্লিপবোর্ডে কপি করুন"
                                                    >
                                                        <Copy size={13} />
                                                        <span>কপি</span>
                                                    </button>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditAddress(addr)}
                                                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                                            title="এডিট করুন"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAddress(addr.id)}
                                                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                            title="মুছে ফেলুন"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========================================================
                            TAB 4: COUPONS & OFFERS TAB
                           ======================================================== */}
                        {activeTab === 'coupons' && (
                            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
                                <div className="pb-4 border-b border-slate-100">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">কুপন ও বিশেষ ভাউচার</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">আপনার কেনাকাটায় সরাসরি টাকা সাশ্রয় করতে নিচের কুপন কোডগুলো কপি করুন</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {coupons.map((coupon) => {
                                        const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false
                                        const isValid = coupon.isActive && !isExpired

                                        return (
                                            <div 
                                                key={coupon.code}
                                                className={`p-5 rounded-3xl border transition relative overflow-hidden flex flex-col justify-between ${
                                                    isValid
                                                        ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 shadow-xs'
                                                        : 'border-slate-200 bg-slate-50/60 opacity-60'
                                                }`}
                                            >
                                                {/* Decorative ticket notch */}
                                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border-r border-emerald-200/50" />
                                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border-l border-emerald-200/50" />

                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <span className="font-mono font-black text-xl text-emerald-700 tracking-wider">
                                                                {coupon.code}
                                                            </span>
                                                            <p className="text-xs font-bold text-slate-800 mt-1">{coupon.description}</p>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                            isValid
                                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                                : 'bg-slate-200 text-slate-600 border-slate-300'
                                                        }`}>
                                                            {isValid ? 'সক্রিয় কুপন' : 'মেয়াদোত্তীর্ণ'}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 text-xs text-slate-600 space-y-1 bg-white/70 p-3 rounded-2xl border border-slate-100">
                                                        <p>
                                                            ডিসকাউন্ট: <strong>{coupon.discountType === 'percentage' ? `${coupon.discount}% ছাড়` : `${currency}${coupon.discount} ফ্ল্যাট ছাড়`}</strong>
                                                        </p>
                                                        {coupon.minOrderAmount > 0 && (
                                                            <p className="text-[11px] text-slate-500">
                                                                সর্বনিম্ন অর্ডার: <strong>{currency}{coupon.minOrderAmount}</strong>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                                                    <span className="text-[11px] text-slate-400">
                                                        মেয়াদ: {formatDate(coupon.expiresAt)}
                                                    </span>

                                                    <button
                                                        onClick={() => handleCopyCoupon(coupon.code)}
                                                        disabled={!isValid}
                                                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                    >
                                                        {copiedCoupon === coupon.code ? (
                                                            <>
                                                                <Check size={14} className="text-emerald-400" />
                                                                কপি হয়েছে!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={14} />
                                                                কোড কপি
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

                        {/* ========================================================
                            TAB 5: ACCOUNT SETTINGS TAB
                           ======================================================== */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                
                                {/* Personal Info Edit Form */}
                                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">ব্যক্তিগত তথ্য ও প্রোফাইল</h2>
                                    <p className="text-xs text-slate-500 mb-6">আপনার প্রোফাইলের নাম, মোবাইল নম্বর এবং যোগাযোগের ঠিকানা আপডেট করুন</p>

                                    <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl">
                                        
                                        {/* Profile Picture Upload Section */}
                                        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
                                            <label className="block text-xs font-bold text-slate-800">
                                                প্রোফাইল ছবি (Profile Avatar)
                                            </label>
                                            
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={editAvatar || currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                                        alt="Profile Preview"
                                                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs bg-white"
                                                    />
                                                    {editAvatar && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditAvatar('')}
                                                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-1 rounded-full text-xs shadow hover:bg-rose-600 transition cursor-pointer"
                                                            title="ছবি রিমুভ করুন"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex-1 space-y-2 w-full">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer">
                                                            <Upload size={15} />
                                                            গ্যালারি/ফাইল থেকে ছবি দিন
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
                                                            {showUrlInput ? 'URL ইনপুট বন্ধ' : 'অথবা Image URL দিন'}
                                                        </button>
                                                    </div>

                                                    <p className="text-[11px] text-slate-400">
                                                        সাপোর্টেড ফরম্যাট: JPG, PNG, WebP (সর্বোচ্চ ৫ মেগাবাইট)
                                                    </p>

                                                    {showUrlInput && (
                                                        <input
                                                            type="url"
                                                            value={editAvatar}
                                                            onChange={(e) => setEditAvatar(e.target.value)}
                                                            placeholder="https://example.com/photo.jpg"
                                                            className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition bg-white"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                পূর্ণ নাম *
                                            </label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                    মোবাইল নাম্বার
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={editPhone}
                                                    onChange={(e) => setEditPhone(e.target.value)}
                                                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                                                    placeholder="017xxxxxxxx"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                    ইমেইল ঠিকানা
                                                </label>
                                                <input
                                                    type="email"
                                                    value={editEmail}
                                                    onChange={(e) => setEditEmail(e.target.value)}
                                                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                                                    placeholder="example@mail.com"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                বিশেষ ডেলিভারি নির্দেশনা (ঐচ্ছিক)
                                            </label>
                                            <textarea
                                                value={editDeliveryNote}
                                                onChange={(e) => setEditDeliveryNote(e.target.value)}
                                                rows={2}
                                                placeholder="যেমন: কল করে আসবেন, দরজার সামনে রাখবেন, ইত্যাদি..."
                                                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
                                        >
                                            পরিবর্তন সংরক্ষণ করুন
                                        </button>
                                    </form>
                                </div>

                                {/* Password Change Form with Show/Hide Toggle */}
                                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">পাসওয়ার্ড পরিবর্তন</h2>
                                    <p className="text-xs text-slate-500 mb-6">একাউন্টের সর্বোচ্চ নিরাপত্তা বজায় রাখতে নিয়মিত পাসওয়ার্ড পরিবর্তন করুন</p>

                                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                নতুন পাসওয়ার্ড
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPass ? "text" : "password"}
                                                    value={newPass}
                                                    onChange={(e) => setNewPass(e.target.value)}
                                                    placeholder="কমপক্ষে ৬ অক্ষর"
                                                    className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass(!showPass)}
                                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                >
                                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                নতুন পাসওয়ার্ড নিশ্চিত করুন
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPass ? "text" : "password"}
                                                    value={confirmNewPass}
                                                    onChange={(e) => setConfirmNewPass(e.target.value)}
                                                    placeholder="পুনরায় টাইপ করুন"
                                                    className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                >
                                                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
                                        >
                                            পাসওয়ার্ড আপডেট করুন
                                        </button>
                                    </form>
                                </div>

                                {/* Account Security Status Card */}
                                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                            <ShieldCheck size={22} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">একাউন্ট নিরাপত্তা ও সুরক্ষা সক্রিয়</h4>
                                            <p className="text-xs text-slate-500">আপনার ব্যক্তিগত তথ্য এনক্রিপ্ট করা ও সুরক্ষিত রয়েছে</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                                        সুরক্ষিত সেশন
                                    </span>
                                </div>

                            </div>
                        )}

                        {/* ========================================================
                            TAB 6: WISHLIST TAB
                           ======================================================== */}
                        {activeTab === 'wishlist' && renderWishlistContent()}

                    </div>
                </div>

            </div>

            {/* ========================================================
                MODAL 1: ORDER DETAILS & VISUAL TRACKER MODAL
               ======================================================== */}
            {selectedOrder && (
                <div 
                    onClick={() => setSelectedOrder(null)} 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-5 sm:p-8 relative max-h-[90vh] overflow-y-auto"
                    >
                        <button 
                            onClick={() => setSelectedOrder(null)} 
                            className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition cursor-pointer"
                        >
                            <XCircle size={22} />
                        </button>

                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-800">অর্ডার বিস্তারিত ও ট্র্যাকিং</h2>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">অর্ডার আইডি: #{selectedOrder.id}</p>
                            </div>
                            <div className="mr-8 sm:mr-0">
                                {getStatusBadge(selectedOrder.status)}
                            </div>
                        </div>

                        {/* 5-STAGE VISUAL DELIVERY TRACKER */}
                        <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Truck size={14} className="text-emerald-600" />
                                    লাইভ ডেলিভারি স্ট্যাটাস ট্র্যাকার
                                </h4>
                                <span className="text-[11px] font-mono text-slate-500">
                                    {formatDate(selectedOrder.createdAt)}
                                </span>
                            </div>

                            {/* Stepper Timeline */}
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                {/* Stage 1 */}
                                <div className="flex flex-col items-center gap-1 text-emerald-600">
                                    <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xs">
                                        <Check size={14} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-center">গৃহীত</span>
                                </div>
                                
                                <div className={`flex-1 h-1 mx-1.5 rounded-full ${selectedOrder.status !== 'ORDER_PLACED' ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                                
                                {/* Stage 2 */}
                                <div className={`flex flex-col items-center gap-1 ${['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200'}`}>
                                        <Clock size={13} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-center">প্রক্রিয়াধীন</span>
                                </div>
                                
                                <div className={`flex-1 h-1 mx-1.5 rounded-full ${['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                                
                                {/* Stage 3 */}
                                <div className={`flex flex-col items-center gap-1 ${['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200'}`}>
                                        <Truck size={13} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-center">কুরিয়ারে</span>
                                </div>
                                
                                <div className={`flex-1 h-1 mx-1.5 rounded-full ${selectedOrder.status === 'DELIVERED' ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                                
                                {/* Stage 4 */}
                                <div className={`flex flex-col items-center gap-1 ${selectedOrder.status === 'DELIVERED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${selectedOrder.status === 'DELIVERED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200'}`}>
                                        <CheckCircle2 size={13} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-center">ডেলিভার্ড</span>
                                </div>
                            </div>

                            {/* Simulated Courier Details box */}
                            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="text-slate-600">
                                    <span className="font-semibold text-slate-800">কুরিয়ার পার্টনার: </span>
                                    <span>Steadfast / Pathao Courier Express</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 font-mono text-[11px]">
                                        ট্র্যাকিং: #TRK-{selectedOrder.id ? (selectedOrder.id.length > 6 ? selectedOrder.id.slice(-6).toUpperCase() : selectedOrder.id.toUpperCase()) : '000000'}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const code = `TRK-${selectedOrder.id ? (selectedOrder.id.length > 6 ? selectedOrder.id.slice(-6).toUpperCase() : selectedOrder.id.toUpperCase()) : '000000'}`
                                            navigator.clipboard.writeText(code)
                                            toast.success('ট্র্যাকিং কোড কপি করা হয়েছে!')
                                        }}
                                        className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                                        title="ট্র্যাকিং কোড কপি করুন"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Shipping Address Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl mb-5 text-xs">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                                    <User size={13} className="text-slate-400" />
                                    গ্রাহকের তথ্য
                                </h4>
                                <p className="text-slate-700 font-semibold">{selectedOrder.user?.name || currentUser.name}</p>
                                <p className="text-slate-600 mt-0.5">ফোন: {selectedOrder.address?.phone || currentUser.phone}</p>
                                <p className="text-slate-600 mt-0.5">পেমেন্ট: <strong>{selectedOrder.paymentMethod || 'ক্যাশ অন ডেলিভারি (COD)'}</strong></p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                                    <MapPin size={13} className="text-slate-400" />
                                    ডেলিভারি ঠিকানা
                                </h4>
                                <p className="text-slate-700 leading-relaxed font-medium">
                                    {selectedOrder.address?.street || selectedOrder.address?.address || 'ঠিকানা উপলব্ধ নেই'}
                                </p>
                                <p className="text-slate-500 mt-0.5">
                                    {selectedOrder.address?.city || ''} {selectedOrder.address?.zip ? `- ${selectedOrder.address.zip}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-3 mb-6">
                            <h4 className="font-bold text-slate-800 text-sm">অর্ডারকৃত পণ্যসমূহ</h4>
                            {(selectedOrder.orderItems || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 bg-white">
                                    <img
                                        src={getProductImage(item.product)}
                                        alt={item.product?.name || "পণ্য"}
                                        className="w-13 h-13 object-cover rounded-xl border border-slate-100 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{item.product?.name || "পণ্য"}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            পরিমাণ: {item.quantity} × {currency}{item.price}
                                        </p>
                                    </div>
                                    <div className="font-bold text-slate-800 text-sm text-right">
                                        {currency}{((Number(item.quantity) || 1) * (Number(item.price) || 0)).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Financial Summary & Action Row */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => {
                                        const ord = selectedOrder
                                        setSelectedOrder(null)
                                        setInvoiceOrder(ord)
                                    }}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Printer size={14} />
                                    ইনভয়েস প্রিন্ট
                                </button>

                                <a
                                    href={`https://wa.me/${cleanSupportWa}?text=${encodeURIComponent(`হ্যালো Our Store BD, আমার অর্ডার #${selectedOrder.id} নিয়ে কথা বলতে চাই।`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <MessageCircle size={14} />
                                    WhatsApp হেল্প
                                </a>

                                {['ORDER_PLACED', 'PROCESSING'].includes(selectedOrder.status) && (
                                    <button
                                        onClick={() => handleCancelOrder(selectedOrder.id)}
                                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        অর্ডার বাতিল
                                    </button>
                                )}
                            </div>

                            <div className="text-right">
                                <span className="text-xs text-slate-400 block">সর্বমোট পরিশোধযোগ্য</span>
                                <span className="text-2xl font-black text-emerald-600">{currency}{selectedOrder.total}</span>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: PRINTABLE CUSTOMER INVOICE RECEIPT MODAL
               ======================================================== */}
            {invoiceOrder && (
                <div 
                    onClick={() => setInvoiceOrder(null)} 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto"
                    >
                        {/* Modal Action Controls (Not printed) */}
                        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <FileText size={18} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">অর্ডার ইনভয়েস / রশিদ</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                    <Printer size={14} />
                                    প্রিন্ট / PDF সেভ করুন
                                </button>
                                <button 
                                    onClick={() => setInvoiceOrder(null)} 
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>

                        {/* PRINTABLE CONTENT AREA (Marked with #printable-invoice) */}
                        <div id="printable-invoice" className="bg-white p-2 text-slate-800">
                            
                            {/* Invoice Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-800">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600">
                                        OUR STORE BD
                                    </h1>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">প্রিমিয়াম স্মার্ট গ্যাজেট ও ইলেকট্রনিক্স হাব</p>
                                    <p className="text-[11px] text-slate-400 mt-1">ওয়েবসাইট: www.ourstorebd.com • হটলাইন: {rawSupportWa}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <span className="px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg uppercase inline-block">
                                        কাস্টমার মেমো
                                    </span>
                                    <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                                        ইনভয়েস নং: #INV-{invoiceOrder.id ? (invoiceOrder.id.length > 8 ? invoiceOrder.id.slice(-8).toUpperCase() : invoiceOrder.id.toUpperCase()) : '00000000'}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        তারিখ: {formatDate(invoiceOrder.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Billing & Shipping Details */}
                            <div className="grid grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
                                <div>
                                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-slate-400 mb-1.5">
                                        গ্রাহকের তথ্য (Customer Details)
                                    </h4>
                                    <p className="font-bold text-slate-800 text-sm">{invoiceOrder.user?.name || currentUser.name}</p>
                                    <p className="text-slate-600 mt-0.5">মোবাইল: {invoiceOrder.address?.phone || currentUser.phone}</p>
                                    <p className="text-slate-600 mt-0.5">ইমেইল: {invoiceOrder.user?.email || currentUser.email}</p>
                                    <p className="text-slate-600 mt-0.5">কাস্টমার আইডি: {customerCode}</p>
                                </div>
                                <div className="text-right">
                                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-slate-400 mb-1.5">
                                        ডেলিভারি ঠিকানা (Shipping Address)
                                    </h4>
                                    <p className="text-slate-700 leading-relaxed font-medium">
                                        {invoiceOrder.address?.street || invoiceOrder.address?.address || 'ঠিকানা উপলব্ধ নেই'}
                                    </p>
                                    <p className="text-slate-500 mt-0.5">
                                        {invoiceOrder.address?.city || ''} {invoiceOrder.address?.zip ? `- ${invoiceOrder.address.zip}` : ''}
                                    </p>
                                    <p className="text-slate-600 mt-1 font-semibold">
                                        পেমেন্ট: {invoiceOrder.paymentMethod || 'ক্যাশ অন ডেলিভারি (COD)'}
                                    </p>
                                </div>
                            </div>

                            {/* Itemized Table */}
                            <div className="py-5">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                                            <th className="py-2.5">পণ্য বিবরণী</th>
                                            <th className="py-2.5 text-center">পরিমাণ</th>
                                            <th className="py-2.5 text-right">একক মূল্য</th>
                                            <th className="py-2.5 text-right">মোট টাকা</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {(invoiceOrder.orderItems || []).map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="py-3 font-semibold text-slate-800">
                                                    {item.product?.name || "পণ্য"}
                                                    {item.color && <span className="text-[11px] text-slate-400 block font-normal">রঙ: {item.color}</span>}
                                                </td>
                                                <td className="py-3 text-center text-slate-600 font-bold">{item.quantity}</td>
                                                <td className="py-3 text-right text-slate-600">{currency}{item.price}</td>
                                                <td className="py-3 text-right font-bold text-slate-800">{currency}{((Number(item.quantity) || 1) * (Number(item.price) || 0)).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Breakdown */}
                            {(() => {
                                const invoiceSubtotal = (invoiceOrder.orderItems || []).reduce((sum, item) => {
                                    return sum + ((Number(item.quantity) || 1) * (Number(item.price) || 0))
                                }, 0)
                                return (
                                    <div className="pt-4 border-t-2 border-slate-200 flex justify-end">
                                        <div className="w-64 space-y-2 text-xs">
                                            <div className="flex justify-between text-slate-600">
                                                <span>উপ-মোট (Subtotal):</span>
                                                <span className="font-semibold">{currency}{invoiceSubtotal.toFixed(0)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>ডেলিভারি চার্জ:</span>
                                                <span className="font-semibold text-emerald-600">
                                                    {invoiceOrder.shippingCost ? `${currency}${invoiceOrder.shippingCost}` : 'ফ্রি (Free Delivery)'}
                                                </span>
                                            </div>
                                            {invoiceOrder.isCouponUsed && (
                                                <div className="flex justify-between text-emerald-600 font-semibold">
                                                    <span>কুপন ডিসকাউন্ট:</span>
                                                    <span>প্রযোজ্য</span>
                                                </div>
                                            )}
                                            <div className="h-px bg-slate-200 my-1" />
                                            <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                                                <span>সর্বমোট পরিশোধিত:</span>
                                                <span className="text-emerald-600">{currency}{invoiceOrder.total}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Invoice Footer note */}
                            <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                                <p className="font-semibold text-slate-600">Our Store BD-তে কেনাকাটা করার জন্য ধন্যবাদ!</p>
                                <p className="mt-0.5">যেকোনো প্রশ্ন বা ওয়ারেন্টি সংক্রান্ত সেবার জন্য আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।</p>
                            </div>

                        </div>

                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 3: ADD / EDIT ADDRESS MODAL
               ======================================================== */}
            {isAddressModalOpen && (
                <div 
                    onClick={() => setIsAddressModalOpen(false)} 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 relative"
                    >
                        <button 
                            onClick={() => setIsAddressModalOpen(false)} 
                            className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                        >
                            <XCircle size={22} />
                        </button>

                        <h3 className="text-xl font-bold text-slate-800 mb-1">
                            {editingAddress ? 'ঠিকানা এডিট করুন' : 'নতুন ডেলিভারি ঠিকানা'}
                        </h3>
                        <p className="text-xs text-slate-500 mb-5">সঠিক ও নির্ভুল ডেলিভারির জন্য প্রয়োজনীয় তথ্য পূরণ করুন</p>

                        <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">ঠিকানার লেবেল (Label)</label>
                                <select
                                    value={addrLabel}
                                    onChange={(e) => setAddrLabel(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-emerald-500 transition text-sm"
                                >
                                    <option value="বাসা (Home)">বাসা (Home)</option>
                                    <option value="অফিস (Office)">অফিস (Office)</option>
                                    <option value="অন্যান্য (Other)">অন্যান্য (Other)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1.5">প্রাপকের নাম *</label>
                                    <input
                                        type="text"
                                        value={addrName}
                                        onChange={(e) => setAddrName(e.target.value)}
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition text-sm"
                                        placeholder="আপনার নাম"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1.5">মোবাইল নাম্বার *</label>
                                    <input
                                        type="tel"
                                        value={addrPhone}
                                        onChange={(e) => setAddrPhone(e.target.value)}
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition text-sm"
                                        placeholder="017xxxxxxxx"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">রাস্তা / বাড়ি / ফ্লাট নম্বর *</label>
                                <textarea
                                    value={addrStreet}
                                    onChange={(e) => setAddrStreet(e.target.value)}
                                    rows={2}
                                    placeholder="বাড়ি নং, রোড নং, ফ্ল্যাট নং, ল্যান্ডমার্ক..."
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1.5">শহর / বিভাগ *</label>
                                    <select
                                        value={addrCity}
                                        onChange={(e) => setAddrCity(e.target.value)}
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-emerald-500 transition text-sm"
                                    >
                                        {BD_CITIES.map((city) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1.5">এলাকা / থানা</label>
                                    <input
                                        type="text"
                                        value={addrArea}
                                        onChange={(e) => setAddrArea(e.target.value)}
                                        placeholder="উদাঃ ধানমন্ডি / মিরপুর"
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition text-sm"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={addrIsDefault}
                                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600"
                                />
                                <span className="font-semibold text-slate-700 text-xs">
                                    ডিফল্ট (প্রধান) ডেলিভারি ঠিকানা হিসেবে নির্ধারণ করুন
                                </span>
                            </label>

                            <div className="flex gap-2.5 justify-end pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddressModalOpen(false)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
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
