'use client'

import { useState } from 'react'
import { X, Tags, Plus, Trash2, Pencil, Check, ShieldAlert, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'

const presetColors = [
    '#10b981', '#059669', '#34d399', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#f59e0b', '#84cc16', '#64748b'
]

export default function CategoryModal({
    isOpen,
    onClose,
    categories = [],
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    currentRole = 'ADMIN',
    isDark = false
}) {
    const [name, setName] = useState('')
    const [type, setType] = useState('EXPENSE')
    const [color, setColor] = useState('#ef4444')

    const [editingId, setEditingId] = useState(null)
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('')

    if (!isOpen) return null

    const isStaff = currentRole === 'STAFF'

    const handleCreate = (e) => {
        e.preventDefault()
        if (isStaff) {
            toast.error('অনুমতি নেই: শুধুমাত্র এডমিন ক্যাটাগরি তৈরি করতে পারেন!')
            return
        }

        const trimmed = name.trim()
        if (!trimmed) {
            toast.error('ক্যাটাগরির নাম লিখুন')
            return
        }

        if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error('এই নামের ক্যাটাগরি ইতোমধ্যে বিদ্যমান')
            return
        }

        onAddCategory({ name: trimmed, type, color })
        toast.success(`নতুন ক্যাটাগরি "${trimmed}" যুক্ত হয়েছে!`)
        setName('')
    }

    const startEdit = (cat) => {
        setEditingId(cat.id)
        setEditName(cat.name)
        setEditColor(cat.color || '#64748b')
    }

    const saveEdit = (id) => {
        if (!editName.trim()) {
            toast.error('নাম খালি রাখা যাবে না')
            return
        }
        onUpdateCategory({ id, name: editName.trim(), color: editColor })
        toast.success('ক্যাটাগরি আপডেট সম্পন্ন!')
        setEditingId(null)
    }

    const handleDelete = (id, catName) => {
        if (isStaff) {
            toast.error('অনুমতি নেই: শুধুমাত্র এডমিন ক্যাটাগরি মুছতে পারেন!')
            return
        }
        onDeleteCategory(id)
        toast.success(`"${catName}" মুছে ফেলা হয়েছে`)
    }

    const incomeCats = categories.filter(c => c.type === 'INCOME')
    const expenseCats = categories.filter(c => c.type === 'EXPENSE')

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
                        <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500">
                            <Tags size={22} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base sm:text-lg">
                                কাস্টম ক্যাটাগরি ম্যানেজার
                            </h3>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                আয় ও ব্যয়ের জন্য ইচ্ছামতো নতুন ক্যাটাগরি তৈরি ও কাস্টমাইজ করুন
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
                    {/* Add Category Form */}
                    {!isStaff && (
                        <form onSubmit={handleCreate} className={`p-4 rounded-xl border space-y-3.5 ${
                            isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                নতুন ক্যাটাগরি যোগ করুন
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                                        ক্যাটাগরির নাম *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="যেমন: Facebook Ads, Utility"
                                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 ${
                                            isDark
                                                ? 'bg-slate-800 border-slate-700 text-white focus:ring-indigo-500/20'
                                                : 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-500/20'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                                        ধরন (Type) *
                                    </label>
                                    <select
                                        value={type}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setType(val)
                                            setColor(val === 'INCOME' ? '#10b981' : '#ef4444')
                                        }}
                                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 ${
                                            isDark
                                                ? 'bg-slate-800 border-slate-700 text-white focus:ring-indigo-500/20'
                                                : 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-500/20'
                                        }`}
                                    >
                                        <option value="EXPENSE">ব্যয় / খরচ (Expense)</option>
                                        <option value="INCOME">আয় / ইনকাম (Income)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                                        কালার ব্যাজ
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                                            {presetColors.slice(0, 7).map((c, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setColor(c)}
                                                    style={{ backgroundColor: c }}
                                                    className={`w-5 h-5 rounded-full shrink-0 transition-transform ${
                                                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            type="submit"
                                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1 shadow-md shadow-indigo-600/20"
                                        >
                                            <Plus size={14} />
                                            <span>তৈরি</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Expense Categories List */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                                <ArrowUpRight size={14} />
                                <span>খরচ ক্যাটাগরি ({expenseCats.length})</span>
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {expenseCats.map((cat) => (
                                <div
                                    key={cat.id}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                                        isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200'
                                    }`}
                                >
                                    {editingId === cat.id ? (
                                        <div className="flex items-center gap-2 flex-1 mr-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-2 py-1 text-xs border rounded-lg bg-transparent"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => saveEdit(cat.id)}
                                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: cat.color || '#ef4444' }}
                                            />
                                            <span className="text-xs font-medium truncate">{cat.name}</span>
                                        </div>
                                    )}

                                    {!isStaff && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => startEdit(cat)}
                                                className="p-1 text-slate-400 hover:text-indigo-500 rounded hover:bg-indigo-500/10"
                                                title="এডিট"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            {!cat.isDefault && (
                                                <button
                                                    onClick={() => handleDelete(cat.id, cat.name)}
                                                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-500/10"
                                                    title="ডিলিট"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Income Categories List */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                                <ArrowDownRight size={14} />
                                <span>আয় ক্যাটাগরি ({incomeCats.length})</span>
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {incomeCats.map((cat) => (
                                <div
                                    key={cat.id}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                                        isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200'
                                    }`}
                                >
                                    {editingId === cat.id ? (
                                        <div className="flex items-center gap-2 flex-1 mr-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-2 py-1 text-xs border rounded-lg bg-transparent"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => saveEdit(cat.id)}
                                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: cat.color || '#10b981' }}
                                            />
                                            <span className="text-xs font-medium truncate">{cat.name}</span>
                                        </div>
                                    )}

                                    {!isStaff && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => startEdit(cat)}
                                                className="p-1 text-slate-400 hover:text-indigo-500 rounded hover:bg-indigo-500/10"
                                                title="এডিট"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            {!cat.isDefault && (
                                                <button
                                                    onClick={() => handleDelete(cat.id, cat.name)}
                                                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-500/10"
                                                    title="ডিলিট"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
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
                        সম্পন্ন (Done)
                    </button>
                </div>
            </div>
        </div>
    )
}
