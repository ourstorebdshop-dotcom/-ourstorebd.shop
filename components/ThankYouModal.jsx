'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
    CheckCircle2Icon, 
    CopyIcon, 
    CheckIcon, 
    ShoppingBagIcon, 
    TruckIcon, 
    CreditCardIcon, 
    MapPinIcon, 
    PhoneIcon, 
    ArrowRightIcon, 
    XIcon, 
    SparklesIcon,
    PackageCheckIcon
} from 'lucide-react';

export default function ThankYouModal({ order, onClose }) {
    const router = useRouter();
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳';
    const [copied, setCopied] = useState(false);

    if (!order) return null;

    const handleCopyOrderId = () => {
        if (order?.id) {
            navigator.clipboard.writeText(order.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleViewOrders = () => {
        if (onClose) onClose();
        router.push('/profile?tab=orders');
    };

    const handleContinueShopping = () => {
        if (onClose) onClose();
        router.push('/shop');
    };

    // Format payment method text
    const getPaymentLabel = (method) => {
        switch (method) {
            case 'COD': return 'ক্যাশ অন ডেলিভারি (COD)';
            case 'BKASH': return 'বিকাশ (bKash)';
            case 'NAGAD': return 'নগদ (Nagad)';
            case 'BANK': return 'ব্যাংক ট্রান্সফার';
            default: return method || 'ক্যাশ অন ডেলিভারি';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            
            {/* Modal Card */}
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
            >
                {/* Decorative Top Accent Bar */}
                <div className="h-2.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

                {/* Close Button */}
                <button
                    onClick={onClose || handleContinueShopping}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10 cursor-pointer"
                    title="বন্ধ করুন"
                >
                    <XIcon size={20} />
                </button>

                <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                    
                    {/* Success Animation & Icon */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            {/* Pulse Rings */}
                            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping opacity-60 pointer-events-none" />
                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-green-500/30 ring-8 ring-green-50">
                                <CheckCircle2Icon size={44} strokeWidth={2.5} className="animate-in zoom-in duration-300" />
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold mb-3 shadow-xs">
                            <SparklesIcon size={13} className="text-green-600" />
                            অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!
                        </div>

                        {/* Main Heading */}
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                            ধন্যবাদ, আপনার অর্ডারের জন্য!
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm">
                            আমরা আপনার অর্ডারটি গ্রহণ করেছি। খুব শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে।
                        </p>
                    </div>

                    {/* Order ID & Copy Bar */}
                    <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <PackageCheckIcon size={18} className="text-green-600 shrink-0" />
                            <div className="text-left overflow-hidden">
                                <p className="text-[11px] text-slate-400 font-medium leading-none">অর্ডার ট্র্যাকিং আইডি</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">
                                    #{order.id}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCopyOrderId}
                            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                                copied 
                                    ? 'bg-green-600 text-white shadow-xs' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <CheckIcon size={14} />
                                    <span>কপি হয়েছে</span>
                                </>
                            ) : (
                                <>
                                    <CopyIcon size={14} />
                                    <span>কপি</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Order Details Card */}
                    <div className="mt-4 border border-slate-100 rounded-2xl p-4 bg-white shadow-xs space-y-3 text-xs">
                        
                        {/* Ordered Items Preview */}
                        {order.orderItems && order.orderItems.length > 0 && (
                            <div className="pb-3 border-b border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    অর্ডারকৃত পণ্য ({order.orderItems.length}টি)
                                </p>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                    {order.orderItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                {item.product?.images?.[0] ? (
                                                    <Image
                                                        src={item.product.images[0]}
                                                        alt={item.product.name}
                                                        width={36}
                                                        height={36}
                                                        className="w-9 h-9 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                        <ShoppingBagIcon size={16} className="text-slate-400" />
                                                    </div>
                                                )}
                                                <div className="truncate">
                                                    <p className="font-semibold text-slate-700 text-xs truncate">
                                                        {item.product?.name || 'পণ্য'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        পরিমাণ: {item.quantity}টি {item.color ? `• ${item.color}` : ''} {item.size ? `• ${item.size}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-800 shrink-0">
                                                {currency}{(item.price * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Delivery Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-start gap-2">
                                <MapPinIcon size={15} className="text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] text-slate-400 font-medium">ডেলিভারি ঠিকানা</p>
                                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{order.address?.name}</p>
                                    <p className="text-slate-500 text-[11px] leading-tight">{order.address?.street}, {order.address?.city}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <PhoneIcon size={15} className="text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] text-slate-400 font-medium">মোবাইল নম্বর</p>
                                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{order.address?.phone || order.user?.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Numbers */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-slate-500 text-xs">
                                <span className="flex items-center gap-1.5">
                                    <CreditCardIcon size={13} className="text-slate-400" />
                                    পেমেন্ট পদ্ধতি:
                                </span>
                                <span className="font-semibold text-slate-700">{getPaymentLabel(order.paymentMethod)}</span>
                            </div>

                            {order.shippingCost !== undefined && (
                                <div className="flex justify-between text-slate-500 text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <TruckIcon size={13} className="text-slate-400" />
                                        ডেলিভারি চার্জ:
                                    </span>
                                    <span className="font-semibold text-slate-700">{currency}{order.shippingCost}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                                <span className="font-bold text-slate-800">সর্বমোট প্রদেয়:</span>
                                <span className="text-base font-extrabold text-green-600">
                                    {currency}{order.total?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Reassurance Notice */}
                    <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5 text-left">
                        <span className="text-base leading-none">📞</span>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                            <strong className="font-semibold">পরবর্তী ধাপ:</strong> ডেলিভারির পূর্বে আমাদের প্রতিনিধি আপনার নম্বরে কল করে অর্ডারটি নিশ্চিত করবেন। কোনো প্রশ্ন থাকলে আমাদের কাস্টমার কেয়ারে যোগাযোগ করতে পারেন।
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleViewOrders}
                            className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 py-3 px-4 text-white font-semibold text-xs sm:text-sm shadow-md shadow-green-600/25 hover:shadow-lg hover:shadow-green-600/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <ShoppingBagIcon size={16} />
                            <span>আমার অর্ডার দেখুন</span>
                            <ArrowRightIcon size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                        </button>

                        <button
                            onClick={handleContinueShopping}
                            className="sm:w-36 py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer"
                        >
                            আরও শপিং করুন
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
