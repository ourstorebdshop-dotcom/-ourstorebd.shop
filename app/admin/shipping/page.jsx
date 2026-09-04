'use client'
import { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
    updateInsideDhaka, updateOutsideDhaka, updatePaymentMethod, togglePaymentMethod,
    updateQuickContact, toggleQuickContact 
} from '@/lib/features/shipping/shippingSlice'
import { updateStoreInfo } from '@/lib/features/contact/contactSlice'
import toast from 'react-hot-toast'
import {
    TruckIcon, CreditCardIcon, SaveIcon, ToggleLeftIcon, ToggleRightIcon,
    MapPinIcon, ClockIcon, BanknoteIcon, PencilIcon, CheckIcon, XIcon, SettingsIcon, ImageIcon, UploadIcon, Trash2Icon,
    PhoneCallIcon, SmartphoneIcon
} from 'lucide-react'

export default function AdminShippingSettings() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()
    const shipping = useSelector(state => state.shipping)

    // Local edit state
    const [editingSection, setEditingSection] = useState(null)

    // Shipping cost edit
    const [insideCost, setInsideCost] = useState(shipping.insideDhaka.cost)
    const [insideTime, setInsideTime] = useState(shipping.insideDhaka.deliveryTime)
    const [outsideCost, setOutsideCost] = useState(shipping.outsideDhaka.cost)
    const [outsideTime, setOutsideTime] = useState(shipping.outsideDhaka.deliveryTime)

    // Payment edit states
    const [bkashNumber, setBkashNumber] = useState(shipping.paymentMethods.BKASH.accountNumber)
    const [bkashType, setBkashType] = useState(shipping.paymentMethods.BKASH.accountType)
    const [nagadNumber, setNagadNumber] = useState(shipping.paymentMethods.NAGAD.accountNumber)
    const [nagadType, setNagadType] = useState(shipping.paymentMethods.NAGAD.accountType)
    const [bankNameVal, setBankNameVal] = useState(shipping.paymentMethods.BANK.bankName)
    const [bankAccName, setBankAccName] = useState(shipping.paymentMethods.BANK.accountName)
    const [bankAccNumber, setBankAccNumber] = useState(shipping.paymentMethods.BANK.accountNumber)
    const [bankBranch, setBankBranch] = useState(shipping.paymentMethods.BANK.branch)
    const [bankRouting, setBankRouting] = useState(shipping.paymentMethods.BANK.routingNumber)

    // Quick Contact edit states (WhatsApp & Call Now)
    const quickContact = shipping.quickContact || {
        whatsapp: { enabled: true, number: '01577272145', message: 'আমি এই প্রোডাক্টটা অর্ডার করতে চাই - {product_name}' },
        call: { enabled: true, number: '01577272145' }
    }
    const [waNumber, setWaNumber] = useState(quickContact.whatsapp?.number || '01577272145')
    const [waMessage, setWaMessage] = useState(quickContact.whatsapp?.message || 'আমি এই প্রোডাক্টটা অর্ডার করতে চাই - {product_name}')
    const [callNumber, setCallNumber] = useState(quickContact.call?.number || '01577272145')

    const saveShippingCosts = () => {
        const inside = Number(insideCost)
        const outside = Number(outsideCost)
        if (isNaN(inside) || inside < 0) { toast.error('ঢাকার ভিতরের চার্জ সঠিক হতে হবে'); return }
        if (isNaN(outside) || outside < 0) { toast.error('ঢাকার বাইরের চার্জ সঠিক হতে হবে'); return }
        if (!insideTime.trim()) { toast.error('ঢাকার ভিতরের ডেলিভারি সময় দিন'); return }
        if (!outsideTime.trim()) { toast.error('ঢাকার বাইরের ডেলিভারি সময় দিন'); return }
        dispatch(updateInsideDhaka({ cost: inside, deliveryTime: insideTime }))
        dispatch(updateOutsideDhaka({ cost: outside, deliveryTime: outsideTime }))
        toast.success('শিপিং চার্জ আপডেট হয়েছে!')
        setEditingSection(null)
    }

    const saveBkash = () => {
        dispatch(updatePaymentMethod({ method: 'BKASH', data: { accountNumber: bkashNumber, accountType: bkashType } }))
        toast.success('বিকাশ তথ্য আপডেট হয়েছে!')
        setEditingSection(null)
    }

    const saveNagad = () => {
        dispatch(updatePaymentMethod({ method: 'NAGAD', data: { accountNumber: nagadNumber, accountType: nagadType } }))
        toast.success('নগদ তথ্য আপডেট হয়েছে!')
        setEditingSection(null)
    }

    const saveBank = () => {
        dispatch(updatePaymentMethod({ method: 'BANK', data: { bankName: bankNameVal, accountName: bankAccName, accountNumber: bankAccNumber, branch: bankBranch, routingNumber: bankRouting } }))
        toast.success('ব্যাংক তথ্য আপডেট হয়েছে!')
        setEditingSection(null)
    }

    const saveQuickContact = () => {
        dispatch(updateQuickContact({
            whatsapp: {
                ...quickContact.whatsapp,
                number: waNumber,
                message: waMessage
            },
            call: {
                ...quickContact.call,
                number: callNumber
            }
        }))
        // Sync to storeInfo so footer & contact page stay updated
        dispatch(updateStoreInfo({
            whatsapp: waNumber,
            phone: callNumber
        }))
        toast.success('হোয়াটসঅ্যাপ ও কল বাটন তথ্য আপডেট হয়েছে!')
        setEditingSection(null)
    }

    const handleToggleQuickContact = (type) => {
        dispatch(toggleQuickContact(type))
        const label = type === 'whatsapp' ? 'হোয়াটসঅ্যাপ' : 'কল নাও'
        const isCurrentlyEnabled = quickContact[type]?.enabled !== false
        toast.success(`${label} বাটন ${!isCurrentlyEnabled ? 'চালু' : 'বন্ধ'} করা হয়েছে`)
    }

    const handleToggle = (method) => {
        const enabledCount = Object.values(shipping.paymentMethods).filter(m => m.enabled).length
        if (shipping.paymentMethods[method].enabled && enabledCount <= 1) {
            toast.error('অন্তত একটি পেমেন্ট মেথড চালু রাখতে হবে!')
            return
        }
        dispatch(togglePaymentMethod(method))
        const label = shipping.paymentMethods[method].label
        const newState = !shipping.paymentMethods[method].enabled
        toast.success(`${label} ${newState ? 'চালু' : 'বন্ধ'} করা হয়েছে`)
    }

    // Image upload refs
    const fileInputRefs = {
        COD: useRef(null),
        BKASH: useRef(null),
        NAGAD: useRef(null),
        BANK: useRef(null),
    }

    const handleCancel = (section) => {
        if (section === 'shipping') {
            setInsideCost(shipping.insideDhaka.cost)
            setInsideTime(shipping.insideDhaka.deliveryTime)
            setOutsideCost(shipping.outsideDhaka.cost)
            setOutsideTime(shipping.outsideDhaka.deliveryTime)
        } else if (section === 'bkash') {
            setBkashNumber(shipping.paymentMethods.BKASH.accountNumber)
            setBkashType(shipping.paymentMethods.BKASH.accountType)
        } else if (section === 'nagad') {
            setNagadNumber(shipping.paymentMethods.NAGAD.accountNumber)
            setNagadType(shipping.paymentMethods.NAGAD.accountType)
        } else if (section === 'bank') {
            setBankNameVal(shipping.paymentMethods.BANK.bankName)
            setBankAccName(shipping.paymentMethods.BANK.accountName)
            setBankAccNumber(shipping.paymentMethods.BANK.accountNumber)
            setBankBranch(shipping.paymentMethods.BANK.branch)
            setBankRouting(shipping.paymentMethods.BANK.routingNumber)
        } else if (section === 'quickContact') {
            setWaNumber(quickContact.whatsapp?.number || '01577272145')
            setWaMessage(quickContact.whatsapp?.message || '')
            setCallNumber(quickContact.call?.number || '01577272145')
        }
        setEditingSection(null)
    }

    const handleImageUpload = (method, e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.error('অনুগ্রহ করে শুধুমাত্র ইমেজ ফাইল সিলেক্ট করুন')
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('ইমেজ সাইজ 2MB এর বেশি হতে পারবে না')
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
            dispatch(updatePaymentMethod({ method, data: { iconUrl: reader.result } }))
            toast.success('আইকন আপডেট হয়েছে!')
        }
        reader.readAsDataURL(file)
    }

    const removeImage = (method) => {
        dispatch(updatePaymentMethod({ method, data: { iconUrl: '' } }))
        toast.success('আইকন রিমুভ হয়েছে!')
    }

    // Reusable icon display with upload
    const PaymentIcon = ({ method, emoji }) => {
        const iconUrl = shipping.paymentMethods[method]?.iconUrl
        return (
            <div className="relative group">
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-200 group-hover:border-blue-400 flex items-center justify-center overflow-hidden bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => fileInputRefs[method]?.current?.click()}
                    title="ক্লিক করে আইকন আপলোড করুন"
                >
                    {iconUrl ? (
                        <img src={iconUrl} alt="icon" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <span className="text-2xl">{emoji}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <UploadIcon size={16} className="text-white" />
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRefs[method]}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(method, e)}
                />
                {iconUrl && (
                    <button
                        onClick={(e) => { e.stopPropagation(); removeImage(method) }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="আইকন রিমুভ করুন"
                    >
                        <XIcon size={10} />
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="text-slate-700 mb-28 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 flex items-center gap-2">
                    <SettingsIcon size={24} className="text-green-600" />
                    শিপিং ও <span className="text-green-600">পেমেন্ট সেটিংস</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    ডেলিভারি চার্জ, ডেলিভারি সময় এবং পেমেন্ট মেথড নিয়ন্ত্রণ করুন
                </p>
            </div>

            {/* ===== SHIPPING COSTS SECTION ===== */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs mb-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TruckIcon size={20} className="text-blue-600" />
                        ডেলিভারি চার্জ
                    </h2>
                    {editingSection !== 'shipping' ? (
                        <button onClick={() => setEditingSection('shipping')} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                            <PencilIcon size={13} /> পরিবর্তন করুন
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => handleCancel('shipping')} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg transition">
                                <XIcon size={13} /> বাতিল
                            </button>
                            <button onClick={saveShippingCosts} className="flex items-center gap-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition">
                                <CheckIcon size={13} /> সেভ করুন
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Inside Dhaka */}
                    <div className={`border rounded-xl p-4 transition ${shipping.insideDhaka.enabled ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MapPinIcon size={16} className="text-green-600" />
                                <span className="font-semibold text-slate-800">ঢাকার ভিতরে</span>
                            </div>
                        </div>
                        {editingSection === 'shipping' ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 font-medium">ডেলিভারি চার্জ ({currency})</label>
                                    <input type="number" value={insideCost} onChange={e => setInsideCost(e.target.value)} min="0" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-medium">ডেলিভারি সময়</label>
                                    <input type="text" value={insideTime} onChange={e => setInsideTime(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-500" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <BanknoteIcon size={14} className="text-slate-400" />
                                    <span className="text-2xl font-bold text-green-700">{currency}{shipping.insideDhaka.cost}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <ClockIcon size={12} />
                                    <span>{shipping.insideDhaka.deliveryTime}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Outside Dhaka */}
                    <div className={`border rounded-xl p-4 transition ${shipping.outsideDhaka.enabled ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MapPinIcon size={16} className="text-orange-600" />
                                <span className="font-semibold text-slate-800">ঢাকার বাইরে</span>
                            </div>
                        </div>
                        {editingSection === 'shipping' ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 font-medium">ডেলিভারি চার্জ ({currency})</label>
                                    <input type="number" value={outsideCost} onChange={e => setOutsideCost(e.target.value)} min="0" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-medium">ডেলিভারি সময়</label>
                                    <input type="text" value={outsideTime} onChange={e => setOutsideTime(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <BanknoteIcon size={14} className="text-slate-400" />
                                    <span className="text-2xl font-bold text-orange-700">{currency}{shipping.outsideDhaka.cost}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <ClockIcon size={12} />
                                    <span>{shipping.outsideDhaka.deliveryTime}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== PAYMENT METHODS SECTION ===== */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
                    <CreditCardIcon size={20} className="text-purple-600" />
                    পেমেন্ট মেথড
                </h2>

                <div className="space-y-4">
                    {/* COD */}
                    <div className={`border rounded-xl p-4 transition ${shipping.paymentMethods.COD.enabled ? 'border-green-200' : 'border-slate-200 opacity-60'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <PaymentIcon method="COD" emoji="📦" />
                                <div>
                                    <p className="font-semibold text-slate-800">ক্যাশ অন ডেলিভারি</p>
                                    <p className="text-xs text-slate-400">পণ্য হাতে পেয়ে পেমেন্ট করুন</p>
                                </div>
                            </div>
                            <button onClick={() => handleToggle('COD')} className="cursor-pointer">
                                {shipping.paymentMethods.COD.enabled
                                    ? <ToggleRightIcon size={32} className="text-green-600" />
                                    : <ToggleLeftIcon size={32} className="text-slate-300" />
                                }
                            </button>
                        </div>
                    </div>

                    {/* BKASH */}
                    <div className={`border rounded-xl p-4 transition ${shipping.paymentMethods.BKASH.enabled ? 'border-pink-200' : 'border-slate-200 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <PaymentIcon method="BKASH" emoji="🅱️" />
                                <div>
                                    <p className="font-semibold text-slate-800">বিকাশ</p>
                                    <p className="text-xs text-slate-400">নম্বর: {shipping.paymentMethods.BKASH.accountNumber} ({shipping.paymentMethods.BKASH.accountType})</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {editingSection !== 'bkash' && (
                                    <button onClick={() => setEditingSection('bkash')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                        <PencilIcon size={14} />
                                    </button>
                                )}
                                <button onClick={() => handleToggle('BKASH')} className="cursor-pointer">
                                    {shipping.paymentMethods.BKASH.enabled
                                        ? <ToggleRightIcon size={32} className="text-green-600" />
                                        : <ToggleLeftIcon size={32} className="text-slate-300" />
                                    }
                                </button>
                            </div>
                        </div>
                        {editingSection === 'bkash' && (
                            <div className="border-t border-slate-100 pt-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">বিকাশ নম্বর</label>
                                        <input type="text" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-pink-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">একাউন্ট টাইপ</label>
                                        <select value={bkashType} onChange={e => setBkashType(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-pink-500 bg-white">
                                            <option value="পার্সোনাল">পার্সোনাল</option>
                                            <option value="মার্চেন্ট">মার্চেন্ট</option>
                                            <option value="এজেন্ট">এজেন্ট</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleCancel('bkash')} className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">বাতিল</button>
                                    <button onClick={saveBkash} className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckIcon size={12} /> সেভ</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NAGAD */}
                    <div className={`border rounded-xl p-4 transition ${shipping.paymentMethods.NAGAD.enabled ? 'border-orange-200' : 'border-slate-200 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <PaymentIcon method="NAGAD" emoji="🟠" />
                                <div>
                                    <p className="font-semibold text-slate-800">নগদ</p>
                                    <p className="text-xs text-slate-400">নম্বর: {shipping.paymentMethods.NAGAD.accountNumber} ({shipping.paymentMethods.NAGAD.accountType})</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {editingSection !== 'nagad' && (
                                    <button onClick={() => setEditingSection('nagad')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                        <PencilIcon size={14} />
                                    </button>
                                )}
                                <button onClick={() => handleToggle('NAGAD')} className="cursor-pointer">
                                    {shipping.paymentMethods.NAGAD.enabled
                                        ? <ToggleRightIcon size={32} className="text-green-600" />
                                        : <ToggleLeftIcon size={32} className="text-slate-300" />
                                    }
                                </button>
                            </div>
                        </div>
                        {editingSection === 'nagad' && (
                            <div className="border-t border-slate-100 pt-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">নগদ নম্বর</label>
                                        <input type="text" value={nagadNumber} onChange={e => setNagadNumber(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">একাউন্ট টাইপ</label>
                                        <select value={nagadType} onChange={e => setNagadType(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500 bg-white">
                                            <option value="পার্সোনাল">পার্সোনাল</option>
                                            <option value="মার্চেন্ট">মার্চেন্ট</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleCancel('nagad')} className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">বাতিল</button>
                                    <button onClick={saveNagad} className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckIcon size={12} /> সেভ</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BANK */}
                    <div className={`border rounded-xl p-4 transition ${shipping.paymentMethods.BANK.enabled ? 'border-blue-200' : 'border-slate-200 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <PaymentIcon method="BANK" emoji="🏦" />
                                <div>
                                    <p className="font-semibold text-slate-800">ব্যাংক ট্রান্সফার</p>
                                    <p className="text-xs text-slate-400">{shipping.paymentMethods.BANK.bankName} • {shipping.paymentMethods.BANK.accountNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {editingSection !== 'bank' && (
                                    <button onClick={() => setEditingSection('bank')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                        <PencilIcon size={14} />
                                    </button>
                                )}
                                <button onClick={() => handleToggle('BANK')} className="cursor-pointer">
                                    {shipping.paymentMethods.BANK.enabled
                                        ? <ToggleRightIcon size={32} className="text-green-600" />
                                        : <ToggleLeftIcon size={32} className="text-slate-300" />
                                    }
                                </button>
                            </div>
                        </div>
                        {editingSection === 'bank' && (
                            <div className="border-t border-slate-100 pt-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">ব্যাংকের নাম</label>
                                        <input type="text" value={bankNameVal} onChange={e => setBankNameVal(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">একাউন্ট নাম</label>
                                        <input type="text" value={bankAccName} onChange={e => setBankAccName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">একাউন্ট নম্বর</label>
                                        <input type="text" value={bankAccNumber} onChange={e => setBankAccNumber(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">ব্রাঞ্চ</label>
                                        <input type="text" value={bankBranch} onChange={e => setBankBranch(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium">রাউটিং নম্বর</label>
                                        <input type="text" value={bankRouting} onChange={e => setBankRouting(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleCancel('bank')} className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">বাতিল</button>
                                    <button onClick={saveBank} className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckIcon size={12} /> সেভ</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== QUICK ORDER BUTTONS SECTION (WhatsApp & Call Now) ===== */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <SmartphoneIcon size={20} className="text-emerald-600" />
                            প্রোডাক্ট পেজ বাটন সেটিংস (WhatsApp & Call Now)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            প্রোডাক্ট পেজের WhatsApp এবং Call Now বাটনের ফোন নম্বর ও মেসেজ নিয়ন্ত্রণ করুন
                        </p>
                    </div>
                    {editingSection !== 'quickContact' ? (
                        <button 
                            onClick={() => setEditingSection('quickContact')} 
                            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition cursor-pointer self-start sm:self-auto"
                        >
                            <PencilIcon size={13} /> পরিবর্তন করুন
                        </button>
                    ) : (
                        <div className="flex gap-2 self-start sm:self-auto">
                            <button 
                                onClick={() => handleCancel('quickContact')} 
                                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                                <XIcon size={13} /> বাতিল
                            </button>
                            <button 
                                onClick={saveQuickContact} 
                                className="flex items-center gap-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                                <CheckIcon size={13} /> সেভ করুন
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* WhatsApp Control Card */}
                    <div className={`border rounded-xl p-4 transition ${quickContact.whatsapp?.enabled !== false ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm flex-shrink-0">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">WhatsApp বাটন</p>
                                    <p className="text-xs text-slate-400">
                                        নম্বর: {quickContact.whatsapp?.number || '01577272145'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => handleToggleQuickContact('whatsapp')} className="cursor-pointer">
                                {quickContact.whatsapp?.enabled !== false
                                    ? <ToggleRightIcon size={32} className="text-emerald-600" />
                                    : <ToggleLeftIcon size={32} className="text-slate-300" />
                                }
                            </button>
                        </div>

                        {editingSection === 'quickContact' ? (
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="text-xs text-slate-500 font-medium">WhatsApp নম্বর</label>
                                    <input 
                                        type="text" 
                                        value={waNumber} 
                                        onChange={e => setWaNumber(e.target.value)} 
                                        placeholder="যেমন: 01577272145" 
                                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 bg-white" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-medium">প্রি-ফিলড মেসেজ ({'{product_name}'} প্রোডাক্টের নামে রিপ্লেস হবে)</label>
                                    <input 
                                        type="text" 
                                        value={waMessage} 
                                        onChange={e => setWaMessage(e.target.value)} 
                                        placeholder="আমি এই প্রোডাক্টটা অর্ডার করতে চাই - {product_name}" 
                                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 bg-white" 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <span className="font-medium text-slate-700">ডিফল্ট মেসেজ:</span> "{quickContact.whatsapp?.message || 'আমি এই প্রোডাক্টটা অর্ডার করতে চাই - {product_name}'}"
                            </div>
                        )}
                    </div>

                    {/* Call Now Control Card */}
                    <div className={`border rounded-xl p-4 transition ${quickContact.call?.enabled !== false ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                                    <PhoneCallIcon size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">Call Now বাটন</p>
                                    <p className="text-xs text-slate-400">
                                        নম্বর: {quickContact.call?.number || '01577272145'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => handleToggleQuickContact('call')} className="cursor-pointer">
                                {quickContact.call?.enabled !== false
                                    ? <ToggleRightIcon size={32} className="text-blue-600" />
                                    : <ToggleLeftIcon size={32} className="text-slate-300" />
                                }
                            </button>
                        </div>

                        {editingSection === 'quickContact' ? (
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="text-xs text-slate-500 font-medium">কল করার ফোন নম্বর</label>
                                    <input 
                                        type="text" 
                                        value={callNumber} 
                                        onChange={e => setCallNumber(e.target.value)} 
                                        placeholder="যেমন: 01577272145" 
                                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white" 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <span className="font-medium text-slate-700">ক্লিক অ্যাকশন:</span> সরাসরি <span className="font-semibold text-blue-600">{quickContact.call?.number || '01577272145'}</span> নম্বরে কল ডায়াল হবে।
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
