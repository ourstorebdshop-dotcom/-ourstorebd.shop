import { TruckIcon } from 'lucide-react';
import React from 'react'

const DeliveryInfo = ({ deliveryInfo, setDeliveryInfo }) => {

    const handleChange = (e) => {
        setDeliveryInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
        <div className='w-full bg-slate-50/30 border border-slate-200 rounded-xl p-7'>
            <h2 className='text-lg font-semibold text-slate-700 flex items-center gap-2'>
                <TruckIcon size={20} />
                ডেলিভারি তথ্য
            </h2>

            <div className='mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {/* Name */}
                <div>
                    <label className='text-sm font-medium text-slate-600'>আপনার নাম <span className='text-red-500'>*</span></label>
                    <input
                        type="text"
                        name="name"
                        value={deliveryInfo.name}
                        onChange={handleChange}
                        placeholder='আপনার পূর্ণ নাম'
                        className='w-full mt-1.5 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-slate-400 transition-colors bg-white'
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className='text-sm font-medium text-slate-600'>মোবাইল নাম্বার <span className='text-red-500'>*</span></label>
                    <input
                        type="tel"
                        name="phone"
                        value={deliveryInfo.phone}
                        onChange={handleChange}
                        placeholder='01XXXXXXXXX'
                        className='w-full mt-1.5 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-slate-400 transition-colors bg-white'
                    />
                </div>
            </div>

            {/* Address */}
            <div className='mt-4'>
                <label className='text-sm font-medium text-slate-600'>ঠিকানা <span className='text-red-500'>*</span></label>
                <input
                    type="text"
                    name="address"
                    value={deliveryInfo.address}
                    onChange={handleChange}
                    placeholder='বাড়ি/রোড, এলাকা, থানা, জেলা'
                    className='w-full mt-1.5 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-slate-400 transition-colors bg-white'
                />
            </div>

            {/* Delivery Location */}
            <div className='mt-5'>
                <p className='text-sm font-semibold text-slate-700 mb-3'>ডেলিভারির লোকেশন</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <label
                        htmlFor="insideDhaka"
                        className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-all ${deliveryInfo.location === 'insideDhaka'
                            ? 'border-slate-500 bg-slate-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                    >
                        <input
                            type="radio"
                            id="insideDhaka"
                            name="location"
                            value="insideDhaka"
                            checked={deliveryInfo.location === 'insideDhaka'}
                            onChange={handleChange}
                            className='accent-slate-600 w-4 h-4'
                        />
                        <div>
                            <p className='font-semibold text-slate-700 text-sm'>ঢাকার ভিতরে</p>
                            <p className='text-xs text-slate-400 mt-0.5'>ডেলিভারি সময়: ১ - ২ কর্মদিবস</p>
                        </div>
                    </label>

                    <label
                        htmlFor="outsideDhaka"
                        className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-all ${deliveryInfo.location === 'outsideDhaka'
                            ? 'border-slate-500 bg-slate-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                    >
                        <input
                            type="radio"
                            id="outsideDhaka"
                            name="location"
                            value="outsideDhaka"
                            checked={deliveryInfo.location === 'outsideDhaka'}
                            onChange={handleChange}
                            className='accent-slate-600 w-4 h-4'
                        />
                        <div>
                            <p className='font-semibold text-slate-700 text-sm'>ঢাকার বাইরে</p>
                            <p className='text-xs text-slate-400 mt-0.5'>ডেলিভারি সময়: ২ - ৪ কর্মদিবস</p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    )
}

export default DeliveryInfo
