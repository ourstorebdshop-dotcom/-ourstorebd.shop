'use client'

import { CreditCardIcon, TruckIcon, XIcon, Loader2Icon, ArrowRightIcon } from 'lucide-react';
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { addOrder } from '@/lib/features/order/orderSlice';
import { clearCart } from '@/lib/features/cart/cartSlice';
import { useCoupon } from '@/lib/features/coupon/couponSlice';

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳';

const OrderSummary = ({ totalPrice, items, deliveryInfo, setDeliveryInfo, onOrderSuccess }) => {

    const router = useRouter();
    const dispatch = useDispatch();

    const coupons = useSelector(state => state.coupon.coupons);
    const { currentUser } = useSelector(state => state.user);
    const shippingSettings = useSelector(state => state.shipping);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [trxId, setTrxId] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankTrxId, setBankTrxId] = useState('');
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState(null);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    const handleDeliveryChange = (e) => {
        setDeliveryInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    // Calculate discount based on coupon type
    const calculateDiscount = (couponData, orderTotal) => {
        if (!couponData || !orderTotal) return 0;

        let discountAmount = 0;
        if (couponData.discountType === 'fixed') {
            discountAmount = couponData.discount;
        } else {
            // percentage
            discountAmount = (couponData.discount / 100) * orderTotal;
        }

        // Apply max discount cap if set
        if (couponData.maxDiscountAmount && couponData.maxDiscountAmount > 0) {
            discountAmount = Math.min(discountAmount, couponData.maxDiscountAmount);
        }

        // Ensure discount cannot exceed order total
        return Math.min(discountAmount, orderTotal);
    }

    const handleCouponCode = (event) => {
        event.preventDefault();
        setApplyingCoupon(true);

        const found = coupons.find(c => c.code.toUpperCase() === couponCodeInput.toUpperCase());

        if (!found) {
            toast.error('ভুল কুপন কোড!');
            setApplyingCoupon(false);
            return;
        }

        // Check if coupon is active
        if (!found.isActive) {
            toast.error('এই কুপনটি বর্তমানে নিষ্ক্রিয়');
            setApplyingCoupon(false);
            return;
        }

        // Check if coupon is expired
        if (new Date(found.expiresAt) < new Date()) {
            toast.error('এই কুপনের মেয়াদ শেষ হয়ে গেছে');
            setApplyingCoupon(false);
            return;
        }

        // Check if coupon usage limit exceeded
        if (found.maxUses > 0 && found.usedCount >= found.maxUses) {
            toast.error('এই কুপনের ব্যবহার সীমা শেষ');
            setApplyingCoupon(false);
            return;
        }

        // Check minimum order amount
        if (found.minOrderAmount > 0 && totalPrice < found.minOrderAmount) {
            toast.error(`এই কুপনের জন্য সর্বনিম্ন ${currency}${found.minOrderAmount} অর্ডার প্রয়োজন`);
            setApplyingCoupon(false);
            return;
        }

        // Check forNewUser condition
        if (found.forNewUser && currentUser?.id && currentUser.id !== 'user_guest') {
            toast.error('এই কুপনটি শুধুমাত্র নতুন ব্যবহারকারীদের জন্য');
            setApplyingCoupon(false);
            return;
        }

        // Check forMember condition
        if (found.forMember && !currentUser?.isMember) {
            toast.error('এই কুপনটি শুধুমাত্র প্লাস মেম্বারদের জন্য');
            setApplyingCoupon(false);
            return;
        }

        setCoupon(found);
        const discount = calculateDiscount(found, totalPrice);
        toast.success(`কুপন প্রয়োগ হয়েছে! আপনি সাশ্রয় করছেন ${currency}${discount.toFixed(2)}`);
        setApplyingCoupon(false);
    }

    const handlePlaceOrder = (e) => {
        e.preventDefault();
        setPlacingOrder(true);

        if (!deliveryInfo?.name || !deliveryInfo?.phone || !deliveryInfo?.address) {
            toast.error('অনুগ্রহ করে ডেলিভারি তথ্য পূরণ করুন');
            setPlacingOrder(false);
            return;
        }

        if ((paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') && !trxId.trim()) {
            toast.error('অনুগ্রহ করে ট্রানসেকশন আইডি দিন');
            setPlacingOrder(false);
            return;
        }

        if (paymentMethod === 'BANK' && (!bankName.trim() || !bankTrxId.trim())) {
            toast.error('অনুগ্রহ করে ব্যাংকের নাম ও ট্রানসেকশন আইডি দিন');
            setPlacingOrder(false);
            return;
        }

        const discountAmount = calculateDiscount(coupon, totalPrice);
        const shippingCost = deliveryInfo.location === 'outsideDhaka' ? (shippingSettings?.outsideDhaka?.cost || 120) : (shippingSettings?.insideDhaka?.cost || 70);
        const finalCalculatedTotal = coupon ? Math.max(0, totalPrice - discountAmount + shippingCost) : (totalPrice + shippingCost);

        const newOrder = {
            id: `ord_${Date.now()}`,
            total: Number(finalCalculatedTotal.toFixed(2)),
            status: "ORDER_PLACED",
            userId: currentUser?.id || "user_guest",
            isPaid: paymentMethod !== 'COD',
            paymentMethod: paymentMethod,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCouponUsed: !!coupon,
            coupon: coupon || null,
            orderItems: (items || []).map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
                color: item.selectedColor || null,
                size: item.selectedSize || null,
                product: {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    images: item.images,
                    category: item.category
                }
            })),
            address: {
                id: `addr_${Date.now()}`,
                name: deliveryInfo.name,
                phone: deliveryInfo.phone,
                street: deliveryInfo.address,
                city: deliveryInfo.location === 'insideDhaka' ? 'Dhaka' : 'Outside Dhaka',
                country: 'Bangladesh',
            },
            shippingCost: shippingCost,
            user: currentUser || {
                id: "user_guest",
                name: deliveryInfo.name,
                email: `${deliveryInfo.phone}@customer.ourstorebd.com`,
                phone: deliveryInfo.phone,
            }
        };

        dispatch(addOrder(newOrder));
        dispatch(clearCart());

        // Update coupon usage stats
        if (coupon) {
            dispatch(useCoupon({ code: coupon.code, savedAmount: discountAmount }));
        }

        toast.success('অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!');
        setPlacingOrder(false);

        if (onOrderSuccess) {
            onOrderSuccess(newOrder);
        } else {
            router.push('/profile?tab=orders');
        }
    }

    const discountAmount = calculateDiscount(coupon, totalPrice);
    const shippingCost = deliveryInfo.location === 'outsideDhaka' ? (shippingSettings?.outsideDhaka?.cost || 120) : (shippingSettings?.insideDhaka?.cost || 70);
    const insideTime = shippingSettings?.insideDhaka?.deliveryTime || '১ - ২ কর্মদিবস';
    const outsideTime = shippingSettings?.outsideDhaka?.deliveryTime || '২ - ৪ কর্মদিবস';
    const finalTotal = coupon ? (totalPrice - discountAmount + shippingCost) : (totalPrice + shippingCost);

    const pm = shippingSettings?.paymentMethods || {};
    const paymentOptions = [
        pm.COD?.enabled !== false && { id: 'COD', label: pm.COD?.label || 'ক্যাশ অন ডেলিভারি', icon: pm.COD?.icon || '📦', iconUrl: pm.COD?.iconUrl || '', badge: pm.COD?.badge || 'সর্বাধিক জনপ্রিয়' },
        pm.BKASH?.enabled !== false && { id: 'BKASH', label: pm.BKASH?.label || 'বিকাশ', icon: pm.BKASH?.icon || '🅱️', iconUrl: pm.BKASH?.iconUrl || '' },
        pm.NAGAD?.enabled !== false && { id: 'NAGAD', label: pm.NAGAD?.label || 'নগদ', icon: pm.NAGAD?.icon || '🟠', iconUrl: pm.NAGAD?.iconUrl || '' },
        pm.BANK?.enabled !== false && { id: 'BANK', label: pm.BANK?.label || 'ব্যাংক ট্রান্সফার', icon: pm.BANK?.icon || '🏦', iconUrl: pm.BANK?.iconUrl || '' },
    ].filter(Boolean);

    return (
        <div className='w-full lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-5 sm:p-7'>

            {/* Delivery Info */}
            <h2 className='text-lg font-semibold text-slate-700 flex items-center gap-2'>
                <TruckIcon size={18} />
                ডেলিভারি তথ্য
            </h2>
            <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                    <label className='text-xs font-medium text-slate-500'>আপনার নাম <span className='text-red-500'>*</span></label>
                    <input type="text" name="name" value={deliveryInfo.name} onChange={handleDeliveryChange} placeholder='আপনার পূর্ণ নাম' className='w-full mt-1 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition-colors bg-white' />
                </div>
                <div>
                    <label className='text-xs font-medium text-slate-500'>মোবাইল নাম্বার <span className='text-red-500'>*</span></label>
                    <input type="tel" name="phone" value={deliveryInfo.phone} onChange={handleDeliveryChange} placeholder='01XXXXXXXXX' className='w-full mt-1 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition-colors bg-white' />
                </div>
            </div>
            <div className='mt-3'>
                <label className='text-xs font-medium text-slate-500'>ঠিকানা <span className='text-red-500'>*</span></label>
                <input type="text" name="address" value={deliveryInfo.address} onChange={handleDeliveryChange} placeholder='বাড়ি/রোড, এলাকা, থানা, জেলা' className='w-full mt-1 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition-colors bg-white' />
            </div>
            <div className='mt-4'>
                <p className='text-xs font-semibold text-slate-600 mb-2'>ডেলিভারির লোকেশন</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    <label htmlFor="insideDhaka" className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-all ${deliveryInfo.location === 'insideDhaka' ? 'border-slate-500 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <input type="radio" id="insideDhaka" name="location" value="insideDhaka" checked={deliveryInfo.location === 'insideDhaka'} onChange={handleDeliveryChange} className='accent-slate-600' />
                        <div>
                            <p className='font-semibold text-slate-700 text-xs'>ঢাকার ভিতরে</p>
                            <p className='text-[10px] text-slate-400'>ডেলিভারি সময়: {insideTime} • {currency}{shippingSettings?.insideDhaka?.cost || 70}</p>
                        </div>
                    </label>
                    <label htmlFor="outsideDhaka" className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-all ${deliveryInfo.location === 'outsideDhaka' ? 'border-slate-500 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <input type="radio" id="outsideDhaka" name="location" value="outsideDhaka" checked={deliveryInfo.location === 'outsideDhaka'} onChange={handleDeliveryChange} className='accent-slate-600' />
                        <div>
                            <p className='font-semibold text-slate-700 text-xs'>ঢাকার বাইরে</p>
                            <p className='text-[10px] text-slate-400'>ডেলিভারি সময়: {outsideTime} • {currency}{shippingSettings?.outsideDhaka?.cost || 120}</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Payment Method */}
            <div className='mt-5 pt-5 border-t border-slate-200'>
                <h2 className='text-base font-semibold text-slate-700 flex items-center gap-2'>
                    <CreditCardIcon size={18} />
                    পেমেন্ট পদ্ধতি
                </h2>
                <div className='mt-3 flex flex-col gap-2'>
                    {paymentOptions.map((option) => (
                        <div key={option.id}>
                            <label
                                htmlFor={`pay-${option.id}`}
                                className={`flex items-center gap-3 border rounded-lg p-3.5 cursor-pointer transition-all ${paymentMethod === option.id
                                    ? 'border-slate-600 bg-slate-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    id={`pay-${option.id}`}
                                    name="paymentMethod"
                                    value={option.id}
                                    checked={paymentMethod === option.id}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className='accent-slate-600'
                                />
                                {option.iconUrl ? (
                                    <div className='w-7 h-7 rounded-md border border-slate-200 bg-white flex items-center justify-center p-0.5 flex-shrink-0'>
                                        <img src={option.iconUrl} alt={option.label} className='w-full h-full object-contain' />
                                    </div>
                                ) : (
                                    <span className='text-xl'>{option.icon}</span>
                                )}
                                <span className='font-semibold text-slate-700 text-sm'>{option.label}</span>
                                {option.badge && (
                                    <span className='ml-auto text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full'>
                                        {option.badge} &gt;
                                    </span>
                                )}
                            </label>

                            {/* bKash details */}
                            {option.id === 'BKASH' && paymentMethod === 'BKASH' && (
                                <div className='mt-1 border border-slate-100 rounded-lg p-4 bg-slate-50/50'>
                                    <p className='font-bold text-slate-700 text-sm'>আমাদের বিকাশ {pm.BKASH?.accountType || 'পার্সোনাল'} নাম্বার: {pm.BKASH?.accountNumber || '01577272145'}</p>
                                    <p className='text-xs text-slate-400 mt-1'>
                                        দয়া করে উপরের নাম্বারে <span className='text-red-500 font-semibold'>সেন্ড মানি (Send Money)</span> করুন এবং নিচের ট্রানসেকশন আইডি দিন।
                                    </p>
                                    <div className='mt-3'>
                                        <label className='text-xs font-medium text-slate-600'>ট্রানসেকশন আইডি (TrxID) <span className='text-red-500'>*</span></label>
                                        <input
                                            type="text"
                                            value={trxId}
                                            onChange={(e) => setTrxId(e.target.value)}
                                            placeholder='যেমন: 8N7A6D5C'
                                            className='w-full mt-1 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition-colors bg-white'
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Nagad details */}
                            {option.id === 'NAGAD' && paymentMethod === 'NAGAD' && (
                                <div className='mt-1 border border-slate-100 rounded-lg p-4 bg-slate-50/50'>
                                    <p className='font-bold text-slate-700 text-sm'>আমাদের নগদ {pm.NAGAD?.accountType || 'পার্সোনাল'} নাম্বার: {pm.NAGAD?.accountNumber || '01577272145'}</p>
                                    <p className='text-xs text-slate-400 mt-1'>
                                        দয়া করে উপরের নাম্বারে <span className='text-red-500 font-semibold'>সেন্ড মানি (Send Money)</span> করুন এবং নিচের ট্রানসেকশন আইডি দিন।
                                    </p>
                                    <div className='mt-3'>
                                        <label className='text-xs font-medium text-slate-600'>ট্রানসেকশন আইডি (TrxID) <span className='text-red-500'>*</span></label>
                                        <input
                                            type="text"
                                            value={trxId}
                                            onChange={(e) => setTrxId(e.target.value)}
                                            placeholder='যেমন: 8N7A6D5C'
                                            className='w-full mt-1 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition-colors bg-white'
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Bank Transfer details */}
                            {option.id === 'BANK' && paymentMethod === 'BANK' && (
                                <div className='mt-1 border border-slate-100 rounded-lg p-4 bg-slate-50/50'>
                                    <p className='font-bold text-slate-700 text-sm mb-2'>আমাদের ব্যাংক একাউন্ট তথ্য:</p>
                                    <div className='text-xs text-slate-600 space-y-1'>
                                        <p><span className='font-bold'>ব্যাংক নাম:</span> {pm.BANK?.bankName || 'The City Bank PLC'}</p>
                                        <p><span className='font-bold'>একাউন্ট নাম:</span> {pm.BANK?.accountName || 'IR Feel Enterprise'}</p>
                                        <p><span className='font-bold'>একাউন্ট নম্বর:</span> {pm.BANK?.accountNumber || '1203456789001'}</p>
                                        <p><span className='font-bold'>ব্রাঞ্চ:</span> {pm.BANK?.branch || 'Gulshan Branch, Dhaka'}</p>
                                        <p><span className='font-bold'>রাউটিং নম্বর:</span> {pm.BANK?.routingNumber || '225261234'}</p>
                                    </div>
                                    <p className='text-xs text-slate-400 mt-3'>
                                        দয়া করে উপরের ব্যাংক একাউন্টে ফান্ড ট্রান্সফার (NPSB, BEFTN, বা RTGS) করুন এবং নিচে আপনার প্রেরক তথ্য দিন।
                                    </p>
                                    <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                        <div>
                                            <label className='text-xs font-medium text-slate-600'>আপনার ব্যাংকের নাম <span className='text-red-500'>*</span></label>
                                            <input
                                                type="text"
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                placeholder='যেমন: ডাচ-বাংলা ব্যাংক'
                                                className='w-full mt-1 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition-colors bg-white'
                                            />
                                        </div>
                                        <div>
                                            <label className='text-xs font-medium text-slate-600'>ট্রানসেকশন আইডি / রেফারেন্স <span className='text-red-500'>*</span></label>
                                            <input
                                                type="text"
                                                value={bankTrxId}
                                                onChange={(e) => setBankTrxId(e.target.value)}
                                                placeholder='যেমন: FT2607060001'
                                                className='w-full mt-1 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition-colors bg-white'
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className='pt-4 mt-4 border-t border-slate-200 pb-4 border-b'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString()}</p>
                        <p className="text-slate-700">{currency}{shippingCost}</p>
                        {coupon && <p className="text-green-600">{`-${currency}${discountAmount.toLocaleString()}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={handleCouponCode} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='কুপন কোড লিখুন' className='border border-slate-300 p-2 rounded-lg w-full outline-none focus:border-slate-500 transition text-sm' />
                            <button disabled={applyingCoupon} className='bg-slate-600 text-white px-4 rounded-lg hover:bg-slate-800 active:scale-95 transition-all text-sm font-medium disabled:opacity-50'>{applyingCoupon ? '...' : 'Apply'}</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.discountType === 'fixed' ? `${currency}${coupon.discount} OFF` : `${coupon.discount}% OFF`}</p>
                            <XIcon size={18} onClick={() => setCoupon(null)} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>{currency}{finalTotal.toLocaleString()}</p>
            </div>
            <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className='group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 bg-[length:200%_auto] hover:bg-[position:right_center] py-3.5 px-6 text-white font-semibold text-sm shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none disabled:transform-none flex items-center justify-center gap-2 cursor-pointer'
            >
                {/* Eye-catching shimmer light reflection */}
                <span className='absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-shimmer' />

                {/* Button text & icon */}
                <span className='relative z-10 flex items-center justify-center gap-2 tracking-wide'>
                    {placingOrder ? (
                        <>
                            <Loader2Icon size={18} className='animate-spin' />
                            <span>অর্ডার প্রসেস হচ্ছে...</span>
                        </>
                    ) : (
                        <>
                            <span>অর্ডার সম্পন্ন করুন</span>
                            <ArrowRightIcon size={16} className='transition-transform duration-300 group-hover:translate-x-1' />
                        </>
                    )}
                </span>
            </button>

        </div>
    )
}

export default OrderSummary