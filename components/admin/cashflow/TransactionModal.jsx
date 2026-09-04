'use client'

import { useState, useEffect } from 'react'
import { X, ArrowDownRight, ArrowUpRight, Calendar, DollarSign, Tag, CreditCard, FileText, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const paymentMethods = [
    { id: 'bKash', label: 'bKash (বিকাশ)', icon: '📱' },
    { id: 'Nagad', label: 'Nagad (নগদ)', icon: '📱' },
    { id: 'Rocket', label: 'Rocket (রকেট)', icon: '📱' },
    { id: 'Bank Transfer', label: 'Bank Transfer (ব্যাংক ট্রান্সফার)', icon: '🏦' },
    { id: 'Cash', label: 'Cash (নগদ টাকা)', icon: '💵' },
    { id: 'Card', label: 'Card (কার্ড / POS)', icon: '💳' },
    { id: 'COD', label: 'Cash on Delivery (ক্যাশ অন ডেলিভারি)', icon: '📦' },
]

import { getLocalDateStr } from '@/lib/features/cashflow/cashflowSlice'

export default function TransactionModal({
    isOpen,
    onClose,
    onSave,
    editingTransaction = null,
    defaultType = 'INCOME',
    categories = [],
    isDark = false
}) {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'

    const [type, setType] = useState(defaultType)
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('bKash')
    const [reference, setReference] = useState('')
    const [note, setNote] = useState('')

    // Populate or reset form on open/edit
    useEffect(() => {
        if (editingTransaction) {
            setType(editingTransaction.type || 'INCOME')
            setAmount(editingTransaction.amount ? String(editingTransaction.amount) : '')
            setCategory(editingTransaction.category || '')
            setDate(editingTransaction.date || getLocalDateStr())
            setTime(editingTransaction.time || new Date().toTimeString().slice(0, 5))
            setPaymentMethod(editingTransaction.paymentMethod || 'bKash')
            setReference(editingTransaction.reference || '')
            setNote(editingTransaction.note || '')
        } else {
            const initialType = defaultType || 'INCOME'
            setType(initialType)
            setAmount('')
            setDate(getLocalDateStr())
            setTime(new Date().toTimeString().slice(0, 5))
            setPaymentMethod('bKash')
            setReference('')
            setNote('')
            // Default category for type
            const firstCat = categories.find(c => c.type === initialType)
            setCategory(firstCat ? firstCat.name : '')
        }
    }, [editingTransaction, isOpen, defaultType, categories])

    // Update category when type changes if current category doesn't match type
    const handleTypeChange = (newType) => {
        setType(newType)
        const matchedCats = categories.filter(c => c.type === newType)
        if (matchedCats.length > 0 && !matchedCats.some(c => c.name === category)) {
            setCategory(matchedCats[0].name)
        }
    }

    if (!isOpen) return null

    const filteredCategories = categories.filter(c => c.type === type)

    const handleSubmit = (e) => {
        e.preventDefault()

        const numericAmount = parseFloat(amount)
        if (!numericAmount || numericAmount <= 0) {
            toast.error('অনুগ্রহ করে সঠিক পরিমাণ (Amount) লিখুন')
            return
        }

        if (!category) {
            toast.error('অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন')
            return
        }

        onSave({
            id: editingTransaction ? editingTransaction.id : undefined,
            type,
            amount: numericAmount,
            category,
            date: date || new Date().toISOString().split('T')[0],
            time: time || '12:00',
            paymentMethod,
            reference: reference.trim(),
            note: note.trim(),
        })

        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
                {/* Header with Type Selector */}
                <div className={`p-5 border-b ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${
                                type === 'INCOME' 
                                    ? 'bg-emerald-500/15 text-emerald-500' 
                                    : 'bg-rose-500/15 text-rose-500'
                            }`}>
                                {type === 'INCOME' ? <ArrowDownRight size={22} /> : <ArrowUpRight size={22} />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-base sm:text-lg">
                                    {editingTransaction ? 'ট্রানজেকশন এডিট করুন' : 'নতুন ট্রানজেকশন এন্ট্রি'}
                                </h3>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {type === 'INCOME' ? 'আয় / ইনকাম রেকর্ড' : 'ব্যয় / খরচ রেকর্ড'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-1.5 rounded-lg transition ${
                                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                            }`}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Type Toggle Pills */}
                    <div className={`grid grid-cols-2 p-1 rounded-xl ${isDark ? 'bg-slate-800/80' : 'bg-slate-200/80'}`}>
                        <button
                            type="button"
                            onClick={() => handleTypeChange('INCOME')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                type === 'INCOME'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <ArrowDownRight size={16} />
                            <span>ইনকাম (Income / আয়)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange('EXPENSE')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                type === 'EXPENSE'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <ArrowUpRight size={16} />
                            <span>খরচ (Expense / ব্যয়)</span>
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Amount Input */}
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            টাকার পরিমাণ (Amount) *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                                {currency}
                            </span>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-lg font-semibold transition outline-none focus:ring-2 ${
                                    isDark
                                        ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20'
                                        : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Category Select */}
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            ক্যাটাগরি (Category) *
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none focus:ring-2 ${
                                isDark
                                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20'
                                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                            }`}
                        >
                            <option value="" disabled>ক্যাটাগরি পছন্দ করুন...</option>
                            {filteredCategories.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Time Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                তারিখ (Date) *
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={`w-full px-3.5 py-2 rounded-xl border text-sm transition outline-none focus:ring-2 ${
                                    isDark
                                        ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20'
                                        : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                                }`}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                সময় (Time)
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className={`w-full px-3.5 py-2 rounded-xl border text-sm transition outline-none focus:ring-2 ${
                                    isDark
                                        ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20'
                                        : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            পেমেন্ট মেথড (Payment Method) *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {paymentMethods.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setPaymentMethod(m.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition text-left ${
                                        paymentMethod === m.id
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500'
                                            : isDark
                                                ? 'border-slate-800 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{m.icon}</span>
                                    <span className="truncate">{m.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reference / Invoice */}
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            রেফারেন্স / ভাউচার / ট্রানজেকশন আইডি (ঐচ্ছিক)
                        </label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="যেমন: INV-9821, bKash TrxID, Voucher #04"
                            className={`w-full px-3.5 py-2 rounded-xl border text-sm transition outline-none focus:ring-2 ${
                                isDark
                                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20'
                                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                            }`}
                        />
                    </div>

                    {/* Note / Description */}
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            নোট বা বিবরণ (Note / Remarks)
                        </label>
                        <textarea
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="লেনদেনের সংক্ষিপ্ত বিবরণ লিখুন..."
                            className={`w-full px-3.5 py-2 rounded-xl border text-sm transition outline-none resize-none focus:ring-2 ${
                                isDark
                                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20'
                                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                            }`}
                        />
                    </div>

                    {/* Actions */}
                    <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                isDark
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                            বাতিল (Cancel)
                        </button>
                        <button
                            type="submit"
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition shadow-lg ${
                                type === 'INCOME'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                            }`}
                        >
                            <Check size={16} />
                            <span>{editingTransaction ? 'পরিবর্তন সংরক্ষণ করুন' : 'ট্রানজেকশন যুক্ত করুন'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
