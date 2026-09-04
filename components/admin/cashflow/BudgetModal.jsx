'use client'

import { useState } from 'react'
import { X, Target, Plus, Trash2, AlertTriangle, Check, ShieldAlert, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BudgetModal({
    isOpen,
    onClose,
    budgets = [],
    categories = [],
    onSaveBudget,
    onDeleteBudget,
    currentRole = 'ADMIN',
    isDark = false
}) {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'

    const expenseCategories = categories.filter(c => c.type === 'EXPENSE')

    const [selectedCat, setSelectedCat] = useState(expenseCategories[0]?.name || '')
    const [limit, setLimit] = useState('')
    const [threshold, setThreshold] = useState('80')

    if (!isOpen) return null

    const isStaff = currentRole === 'STAFF'

    const handleAddOrUpdate = (e) => {
        e.preventDefault()

        if (isStaff) {
            toast.error('অনুমতি নেই: শুধুমাত্র এডমিন বাজেট সেট করতে পারেন!')
            return
        }

        const numLimit = parseFloat(limit)
        if (!numLimit || numLimit <= 0) {
            toast.error('সঠিক বাজেট অ্যামাউন্ট লিখুন')
            return
        }

        if (!selectedCat) {
            toast.error('একটি ক্যাটাগরি নির্বাচন করুন')
            return
        }

        onSaveBudget({
            categoryName: selectedCat,
            limit: numLimit,
            alertThreshold: parseInt(threshold, 10) || 80
        })

        toast.success(`${selectedCat} বাজেট আপডেট হয়েছে!`)
        setLimit('')
    }

    const startEdit = (b) => {
        setSelectedCat(b.categoryName)
        setLimit(String(b.limit || ''))
        setThreshold(String(b.alertThreshold || 80))
        toast('বাজেট এডিট করতে উপরের ফর্মটি আপডেট করুন', { icon: '✏️' })
    }

    const handleDelete = (categoryName) => {
        if (isStaff) {
            toast.error('অনুমতি নেই: শুধুমাত্র এডমিন বাজেট মুছতে পারেন!')
            return
        }
        onDeleteBudget(categoryName)
        toast.success(`${categoryName} বাজেট মুছে ফেলা হয়েছে`)
    }

    const totalBudget = budgets.reduce((sum, b) => sum + (b.limit || 0), 0)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
                {/* Header */}
                <div className={`p-5 border-b flex items-center justify-between ${
                    isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500">
                            <Target size={22} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base sm:text-lg">
                                ক্যাটাগরি ও মাসিক বাজেট ম্যানেজমেন্ট
                            </h3>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                প্রতি খরচের ক্যাটাগরির জন্য মাসিক সর্বোচ্চ ব্যয়সীমা এবং অ্যালার্ট সীমা নির্ধারণ করুন
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

                <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
                    {/* Role Notice */}
                    {isStaff && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
                            <ShieldAlert size={18} className="shrink-0" />
                            <span>আপনি স্টাফ (Staff) একাউন্টে আছেন। বাজেট পরিবর্তন করতে এডমিন অনুমতি প্রয়োজন।</span>
                        </div>
                    )}

                    {/* Total Budget Card */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-amber-50/50 border-amber-200/60'
                    }`}>
                        <div>
                            <p className="text-xs font-medium text-slate-500">সর্বমোট নির্ধারিত মাসিক বাজেট</p>
                            <h4 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {currency} {totalBudget.toLocaleString('en-IN')}
                            </h4>
                        </div>
                        <div className="text-xs text-right text-slate-500">
                            <span>মোট ক্যাটাগরি: </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{budgets.length} টি</span>
                        </div>
                    </div>

                    {/* Add / Edit Budget Form */}
                    {!isStaff && (
                        <form onSubmit={handleAddOrUpdate} className={`p-4 rounded-xl border space-y-3 ${
                            isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                নতুন বাজেট সেট বা আপডেট করুন
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                                        ক্যাটাগরি
                                    </label>
                                    <select
                                        value={selectedCat}
                                        onChange={(e) => setSelectedCat(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 ${
                                            isDark
                                                ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/20'
                                                : 'bg-white border-slate-300 text-slate-900 focus:ring-amber-500/20'
                                        }`}
                                    >
                                        {expenseCategories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                                        মাসিক লিমিট ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="যেমন: 25000"
                                        value={limit}
                                        onChange={(e) => setLimit(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 ${
                                            isDark
                                                ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/20'
                                                : 'bg-white border-slate-300 text-slate-900 focus:ring-amber-500/20'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                                        অ্যালার্ট থ্রেশহোল্ড (%)
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={threshold}
                                            onChange={(e) => setThreshold(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 ${
                                                isDark
                                                    ? 'bg-slate-800 border-slate-700 text-white focus:ring-amber-500/20'
                                                    : 'bg-white border-slate-300 text-slate-900 focus:ring-amber-500/20'
                                            }`}
                                        >
                                            <option value="70">৭০% খরচ হলে অ্যালার্ট</option>
                                            <option value="80">৮০% খরচ হলে অ্যালার্ট</option>
                                            <option value="90">৯০% খরচ হলে অ্যালার্ট</option>
                                            <option value="100">১০০% অতিক্রম করলে অ্যালার্ট</option>
                                        </select>

                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1 shadow-md shadow-amber-600/20"
                                        >
                                            <Plus size={14} />
                                            <span>সেভ</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Existing Budgets List */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                            বর্তমান বাজেট তালিকা
                        </h4>
                        <div className="space-y-2">
                            {budgets.length === 0 ? (
                                <p className="text-center py-6 text-xs text-slate-400">
                                    কোনো বাজেট নির্ধারণ করা হয়নি।
                                </p>
                            ) : (
                                budgets.map((b, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition ${
                                            isDark ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                            <div>
                                                <p className="text-sm font-semibold">{b.categoryName}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    অ্যালার্ট থ্রেশহোল্ড: {b.alertThreshold || 80}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                {currency} {Number(b.limit).toLocaleString('en-IN')}
                                            </span>
                                            {!isStaff && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => startEdit(b)}
                                                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-500/10 transition"
                                                        title="এডিট বাজেট"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(b.categoryName)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition"
                                                        title="ডিলিট বাজেট"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex justify-end ${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                            isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                        বন্ধ করুন (Close)
                    </button>
                </div>
            </div>
        </div>
    )
}
