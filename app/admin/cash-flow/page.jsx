'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import {
    CircleDollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Minus,
    Search,
    Filter,
    Download,
    Printer,
    FileSpreadsheet,
    Calendar,
    Target,
    Tags,
    Moon,
    Sun,
    Users,
    Shield,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Pencil,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    HelpCircle,
    ChevronDown,
    X,
    Sparkles,
} from 'lucide-react'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'

import {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    setBudget,
    deleteBudget,
    setUserRole,
    toggleTheme,
    syncOrdersToCashflow,
    getLocalDateStr,
    getLocalMonthStr,
} from '@/lib/features/cashflow/cashflowSlice'

import TransactionModal from '@/components/admin/cashflow/TransactionModal'
import BudgetModal from '@/components/admin/cashflow/BudgetModal'
import CategoryModal from '@/components/admin/cashflow/CategoryModal'
import CashFlowReportModal from '@/components/admin/cashflow/CashFlowReportModal'

export default function CashFlowPage() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()

    // Redux State
    const transactions = useSelector(state => state.cashflow?.transactions) || []
    const categories = useSelector(state => state.cashflow?.categories) || []
    const budgets = useSelector(state => state.cashflow?.budgets) || []
    const currentRole = useSelector(state => state.cashflow?.currentRole) || 'ADMIN'
    const theme = useSelector(state => state.cashflow?.theme) || 'light'
    const storeOrders = useSelector(state => state.order?.orders) || []

    const isDark = theme === 'dark'
    const isStaff = currentRole === 'STAFF'

    // Client hydration safeguard for Recharts & dates
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Modals state
    const [isTxModalOpen, setIsTxModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(null)
    const [modalDefaultType, setModalDefaultType] = useState('INCOME')
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState(null)

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('ALL') // 'ALL', 'INCOME', 'EXPENSE'
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [paymentFilter, setPaymentFilter] = useState('ALL')
    const [periodFilter, setPeriodFilter] = useState('ALL') // 'ALL', 'THIS_MONTH', 'TODAY', 'THIS_WEEK', 'LAST_MONTH'
    const [sortBy, setSortBy] = useState('DATE_DESC') // 'DATE_DESC', 'DATE_ASC', 'AMOUNT_DESC', 'AMOUNT_ASC'
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    // Chart Timeframe Toggle: 'WEEKLY' vs 'MONTHLY'
    const [chartMode, setChartMode] = useState('MONTHLY')

    // Dates reference (Timezone safe) — stable ref to avoid useMemo re-runs
    const nowRef = useRef(new Date())
    const now = nowRef.current
    const todayStr = useMemo(() => getLocalDateStr(now), [now])
    const currentMonthStr = useMemo(() => getLocalMonthStr(now), [now])

    // =========================================================================
    // 1. OVERVIEW CALCULATIONS
    // =========================================================================
    const overviewStats = useMemo(() => {
        // Current month totals
        const thisMonthTxs = transactions.filter(t => t.date && t.date.startsWith(currentMonthStr))
        const monthIncome = thisMonthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
        const monthExpense = thisMonthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
        const monthNet = monthIncome - monthExpense

        // Today totals
        const todayTxs = transactions.filter(t => t.date === todayStr)
        const todayIncome = todayTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
        const todayExpense = todayTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

        // Previous month totals for % comparison (local month calculation)
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthStr = getLocalMonthStr(lastMonthDate)
        const lastMonthTxs = transactions.filter(t => t.date && t.date.startsWith(lastMonthStr))
        const lastMonthIncome = lastMonthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
        const lastMonthExpense = lastMonthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

        // Percent changes vs last month
        let incomeGrowth = '0'
        if (lastMonthIncome > 0) {
            const diff = ((monthIncome - lastMonthIncome) / lastMonthIncome) * 100
            incomeGrowth = (diff >= 0 ? '+' : '') + diff.toFixed(1)
        } else if (monthIncome > 0) {
            incomeGrowth = '+100'
        }

        let expenseGrowth = '0'
        if (lastMonthExpense > 0) {
            const diff = ((monthExpense - lastMonthExpense) / lastMonthExpense) * 100
            expenseGrowth = (diff >= 0 ? '+' : '') + diff.toFixed(1)
        } else if (monthExpense > 0) {
            expenseGrowth = '+100'
        }

        // All time totals
        const allIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
        const allExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
        const allNet = allIncome - allExpense
        const profitMargin = allIncome > 0 ? ((allNet / allIncome) * 100).toFixed(1) : 0

        return {
            monthIncome,
            monthExpense,
            monthNet,
            incomeGrowth,
            expenseGrowth,
            todayIncome,
            todayExpense,
            allIncome,
            allExpense,
            allNet,
            profitMargin,
        }
    }, [transactions, currentMonthStr, todayStr])

    // =========================================================================
    // 2. BUDGET TRACKING & ACTIVE ALERTS
    // =========================================================================
    const budgetAnalysis = useMemo(() => {
        const monthExpensesByCat = transactions
            .filter(t => t.type === 'EXPENSE' && t.date && t.date.startsWith(currentMonthStr))
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount
                return acc
            }, {})

        const items = budgets.map(b => {
            const spent = monthExpensesByCat[b.categoryName] || 0
            const limit = b.limit || 1
            const percentage = Math.round((spent / limit) * 100)
            const isOverBudget = spent >= limit
            const isNearBudget = !isOverBudget && percentage >= (b.alertThreshold || 80)
            return {
                ...b,
                spent,
                percentage,
                isOverBudget,
                isNearBudget,
                remaining: Math.max(0, limit - spent)
            }
        })

        const activeAlerts = items.filter(i => i.isOverBudget || i.isNearBudget)
        return { items, activeAlerts }
    }, [budgets, transactions, currentMonthStr])

    // =========================================================================
    // 3. CHARTS DATA
    // =========================================================================
    // Line/Area Chart Data: Past 7 Days vs Past 6 Months
    const areaChartData = useMemo(() => {
        if (chartMode === 'WEEKLY') {
            // Past 7 days
            const days = []
            for (let i = 6; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                const dateKey = getLocalDateStr(d)
                const label = d.toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric' })
                
                const dayIncome = transactions
                    .filter(t => t.type === 'INCOME' && t.date === dateKey)
                    .reduce((s, t) => s + t.amount, 0)
                const dayExpense = transactions
                    .filter(t => t.type === 'EXPENSE' && t.date === dateKey)
                    .reduce((s, t) => s + t.amount, 0)

                days.push({ name: label, Income: dayIncome, Expense: dayExpense, Net: dayIncome - dayExpense })
            }
            return days
        } else {
            // Past 6 months
            const months = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthKey = getLocalMonthStr(d)
                const label = d.toLocaleDateString('en-US', { month: 'short' })

                const mIncome = transactions
                    .filter(t => t.type === 'INCOME' && t.date && t.date.startsWith(monthKey))
                    .reduce((s, t) => s + t.amount, 0)
                const mExpense = transactions
                    .filter(t => t.type === 'EXPENSE' && t.date && t.date.startsWith(monthKey))
                    .reduce((s, t) => s + t.amount, 0)

                months.push({ name: label, Income: mIncome, Expense: mExpense, Net: mIncome - mExpense })
            }
            return months
        }
    }, [transactions, chartMode, currentMonthStr])

    // Pie Chart Data: Expense by Category
    const pieChartData = useMemo(() => {
        const catMap = {}
        transactions
            .filter(t => t.type === 'EXPENSE')
            .forEach(t => {
                catMap[t.category] = (catMap[t.category] || 0) + t.amount
            })

        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16',
            '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
        ]

        return Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value], i) => ({
                name: name.split(' ')[0], // shortened for chart
                fullName: name,
                value,
                color: colors[i % colors.length]
            }))
    }, [transactions])

    // Bar Chart Data: 6-Month Cash Flow Inflow vs Outflow Trend
    const trendBarData = useMemo(() => {
        const trend = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthKey = getLocalMonthStr(d)
            const label = d.toLocaleDateString('en-US', { month: 'short' })

            const inc = transactions
                .filter(t => t.type === 'INCOME' && t.date && t.date.startsWith(monthKey))
                .reduce((s, t) => s + t.amount, 0)
            const exp = transactions
                .filter(t => t.type === 'EXPENSE' && t.date && t.date.startsWith(monthKey))
                .reduce((s, t) => s + t.amount, 0)

            trend.push({
                name: label,
                ইনকাম: inc,
                খরচ: exp,
                লাভ: inc - exp
            })
        }
        return trend
    }, [transactions, currentMonthStr])

    // =========================================================================
    // 4. FILTERED & SORTED TRANSACTIONS
    // =========================================================================
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Search query match
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchNote = (t.note || '').toLowerCase().includes(q)
                const matchRef = (t.reference || '').toLowerCase().includes(q)
                const matchCat = (t.category || '').toLowerCase().includes(q)
                const matchMethod = (t.paymentMethod || '').toLowerCase().includes(q)
                const matchAmount = String(t.amount).includes(q)
                if (!matchNote && !matchRef && !matchCat && !matchMethod && !matchAmount) {
                    return false
                }
            }

            // Type filter
            if (typeFilter !== 'ALL' && t.type !== typeFilter) return false

            // Category filter
            if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false

            // Payment filter
            if (paymentFilter !== 'ALL' && t.paymentMethod !== paymentFilter) return false

            // Period filter
            if (periodFilter === 'TODAY' && t.date !== todayStr) return false
            if (periodFilter === 'THIS_MONTH' && (!t.date || !t.date.startsWith(currentMonthStr))) return false
            if (periodFilter === 'THIS_WEEK') {
                const startOfWeek = new Date(now)
                startOfWeek.setDate(now.getDate() - now.getDay())
                const startStr = getLocalDateStr(startOfWeek)
                if (!t.date || t.date < startStr || t.date > todayStr) return false
            }
            if (periodFilter === 'LAST_MONTH') {
                const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const lastMonthStr = getLocalMonthStr(lastMonthDate)
                if (!t.date || !t.date.startsWith(lastMonthStr)) return false
            }

            return true
        }).sort((a, b) => {
            if (sortBy === 'DATE_DESC') return new Date(b.date) - new Date(a.date)
            if (sortBy === 'DATE_ASC') return new Date(a.date) - new Date(b.date)
            if (sortBy === 'AMOUNT_DESC') return b.amount - a.amount
            if (sortBy === 'AMOUNT_ASC') return a.amount - b.amount
            return 0
        })
    }, [transactions, searchQuery, typeFilter, categoryFilter, paymentFilter, periodFilter, sortBy, todayStr, currentMonthStr])

    // Pagination
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Handlers
    const handleSaveTransaction = (txData) => {
        if (txData.id) {
            dispatch(updateTransaction(txData))
            toast.success('ট্রানজেকশন সফলভাবে আপডেট হয়েছে!')
        } else {
            dispatch(addTransaction(txData))
            toast.success('নতুন ট্রানজেকশন সফলভাবে যোগ করা হয়েছে!')
        }
        setEditingTx(null)
    }

    const handleDeleteTransaction = (id) => {
        if (isStaff) {
            toast.error('অনুমতি নেই: শুধুমাত্র এডমিন রেকর্ড মুছতে পারেন!')
            return
        }
        dispatch(deleteTransaction(id))
        toast.success('ট্রানজেকশন মুছে ফেলা হয়েছে!')
        setDeleteConfirmId(null)
    }

    const handleSyncOrders = () => {
        const completedOrders = storeOrders.filter(o => o.total > 0)
        if (completedOrders.length === 0) {
            toast.error('সিঙ্ক করার মতো কোনো অর্ডার পাওয়া যায়নি')
            return
        }
        dispatch(syncOrdersToCashflow(completedOrders))
        toast.success(`${completedOrders.length} টি স্টোর অর্ডারের পেমেন্ট সিঙ্ক সম্পন্ন হয়েছে!`, { icon: '🔄' })
    }

    const handleRoleChange = (newRole) => {
        dispatch(setUserRole(newRole))
        toast.success(`ইউজার রোল পরিবর্তন: ${newRole === 'ADMIN' ? 'Admin (এডমিন)' : 'Staff (স্টাফ)'}`)
    }

    // Direct Excel Export of currently filtered table
    const handleQuickExportCSV = () => {
        try {
            const headers = ['ID', 'Date', 'Time', 'Type', 'Category', 'Amount (BDT)', 'Payment Method', 'Reference', 'Note']
            const rows = filteredTransactions.map(t => [
                t.id,
                t.date,
                t.time || '',
                t.type,
                `"${(t.category || '').replace(/"/g, '""')}"`,
                t.amount,
                t.paymentMethod || 'Cash',
                `"${(t.reference || '').replace(/"/g, '""')}"`,
                `"${(t.note || '').replace(/"/g, '""')}"`,
            ])
            const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `OurStoreBD_Transactions_${todayStr}.csv`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('CSV/Excel ফাইল এক্সপোর্ট হয়েছে!')
        } catch (e) {
            toast.error('এক্সপোর্ট ত্রুটি!')
        }
    }

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen pb-12 transition-colors duration-300 ${
            isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/60 text-slate-900'
        }`}>
            {/* Top Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 shrink-0">
                        <CircleDollarSign size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                                ক্যাশ ফ্লো ড্যাশবোর্ড
                            </h1>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                Live Finance
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Our Store BD • আয়, ব্যয়, ক্যাশ ফ্লো ও আর্থিক বাজেট ব্যবস্থাপনা
                        </p>
                    </div>
                </div>

                {/* Top Action Controls */}
                <div className="flex flex-wrap items-center justify-start xl:justify-end gap-2 sm:gap-2.5">
                    {/* Role Switcher Pill */}
                    <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                        <button
                            onClick={() => handleRoleChange('ADMIN')}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                                currentRole === 'ADMIN'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="সম্পূর্ণ এডমিন এক্সেস"
                        >
                            <Shield size={13} />
                            <span>Admin</span>
                        </button>
                        <button
                            onClick={() => handleRoleChange('STAFF')}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                                currentRole === 'STAFF'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="স্টাফ একাউন্ট (এন্ট্রি সুবিধা)"
                        >
                            <Users size={13} />
                            <span>Staff</span>
                        </button>
                    </div>

                    {/* Dark/Light Mode Toggle */}
                    <button
                        onClick={() => dispatch(toggleTheme())}
                        className={`p-2 rounded-xl border transition ${
                            isDark
                                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-xs'
                        }`}
                        title={isDark ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
                    >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    {/* Sync Orders Button */}
                    <button
                        onClick={handleSyncOrders}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                            isDark
                                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
                        }`}
                        title="স্টোর ডেলিভারড অর্ডারগুলো থেকে আয় সিঙ্ক করুন"
                    >
                        <RefreshCw size={13} className="text-emerald-500" />
                        <span className="hidden sm:inline">অর্ডার সিঙ্ক</span>
                    </button>

                    {/* Report & Statement Button */}
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                            isDark
                                ? 'bg-slate-900 border-slate-800 text-blue-400 hover:bg-slate-800'
                                : 'bg-white border-slate-200 text-blue-600 hover:bg-blue-50 shadow-xs'
                        }`}
                    >
                        <Printer size={13} />
                        <span>রিপোর্ট ও এক্সপোর্ট</span>
                    </button>

                    {/* Primary Action Buttons Group - LOCKED TOGETHER */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => {
                                setEditingTx(null)
                                setModalDefaultType('INCOME')
                                setIsTxModalOpen(true)
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/25 transition active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={14} />
                            <span>ইনকাম এন্ট্রি</span>
                        </button>

                        <button
                            onClick={() => {
                                setEditingTx(null)
                                setModalDefaultType('EXPENSE')
                                setIsTxModalOpen(true)
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/25 transition active:scale-95 whitespace-nowrap"
                        >
                            <Minus size={14} />
                            <span>খরচ এন্ট্রি</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Budget Overflow Warning Banner */}
            {budgetAnalysis.activeAlerts.length > 0 && (
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                                বাজেট সতর্কতা! ({budgetAnalysis.activeAlerts.length} টি ক্যাটাগরি লিমিট ছুঁয়েছে বা অতিক্রম করেছে)
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                {budgetAnalysis.activeAlerts.map(a => `${a.categoryName}: ${a.percentage}% খরচ`).join(' • ')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsBudgetModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shrink-0 hover:bg-rose-700 transition"
                    >
                        বাজেট সমন্বয় করুন
                    </button>
                </div>
            )}

            {/* ================================================================= */}
            {/* SECTION 1: TOP SUMMARY CARDS (ওভারভিউ সেকশন) */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {/* Card 1: Total Income (মোট ইনকাম) */}
                <div className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                    isDark
                        ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                        : 'bg-white border-slate-200/80 hover:border-emerald-500/40 shadow-sm'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            চলতি মাসের ইনকাম (Income)
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <ArrowDownRight size={18} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
                        {currency} {overviewStats.monthIncome.toLocaleString('en-IN')}
                    </h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                        <span className={`flex items-center gap-1 font-semibold ${
                            parseFloat(overviewStats.incomeGrowth) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                            {parseFloat(overviewStats.incomeGrowth) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            <span>{overviewStats.incomeGrowth}% গত মাস তুলনায়</span>
                        </span>
                        <span className="text-slate-500">আজ: {currency}{overviewStats.todayIncome.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Card 2: Total Expense (মোট খরচ) */}
                <div className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                    isDark
                        ? 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40'
                        : 'bg-white border-slate-200/80 hover:border-rose-500/40 shadow-sm'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            চলতি মাসের খরচ (Expense)
                        </span>
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                            <ArrowUpRight size={18} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold mt-2 text-rose-600 dark:text-rose-400">
                        {currency} {overviewStats.monthExpense.toLocaleString('en-IN')}
                    </h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                        <span className={`flex items-center gap-1 font-semibold ${
                            parseFloat(overviewStats.expenseGrowth) <= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                            {parseFloat(overviewStats.expenseGrowth) <= 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                            <span>{overviewStats.expenseGrowth}% গত মাস তুলনায়</span>
                        </span>
                        <span className="text-slate-500">আজ: {currency}{overviewStats.todayExpense.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Card 3: Net Cash Flow (নেট ব্যালেন্স / প্রফিট) */}
                <div className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                    isDark
                        ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/40'
                        : 'bg-white border-slate-200/80 hover:border-blue-500/40 shadow-sm'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            নেট ক্যাশ ফ্লো (Net Cash Flow)
                        </span>
                        <div className={`p-2 rounded-xl ${
                            overviewStats.monthNet >= 0
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-rose-500/10 text-rose-500'
                        }`}>
                            <CircleDollarSign size={18} />
                        </div>
                    </div>
                    <h3 className={`text-2xl font-bold mt-2 ${
                        overviewStats.monthNet >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                    }`}>
                        {currency} {overviewStats.monthNet.toLocaleString('en-IN')}
                    </h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                        <span className="text-slate-500">প্রফিট মার্জিন:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                            {overviewStats.monthIncome > 0 ? ((overviewStats.monthNet / overviewStats.monthIncome) * 100).toFixed(1) : 0}%
                        </span>
                    </div>
                </div>

                {/* Card 4: All Time Reserves & Burn Rate */}
                <div className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                    isDark
                        ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40'
                        : 'bg-white border-slate-200/80 hover:border-indigo-500/40 shadow-sm'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            সর্বমোট ব্যালেন্স (All-Time)
                        </span>
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Sparkles size={18} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold mt-2 text-indigo-600 dark:text-indigo-400">
                        {currency} {overviewStats.allNet.toLocaleString('en-IN')}
                    </h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                        <span className="text-slate-500">মোট ট্রানজেকশন:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{transactions.length} টি</span>
                    </div>
                </div>
            </div>

            {/* ================================================================= */}
            {/* SECTION 2: CHARTS & VISUAL ANALYTICS (চার্ট ও গ্রাফ) */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
                {/* Chart 1: Income vs Expense Multi-Line / Area Chart (Span 2 cols) */}
                <div className={`lg:col-span-2 p-5 rounded-2xl border ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className="font-bold text-sm sm:text-base">ইনকাম বনাম খরচ অ্যানালিটিক্স</h3>
                            <p className="text-xs text-slate-500">
                                {chartMode === 'WEEKLY' ? 'গত ৭ দিনের দৈনিক ক্যাশ ফ্লো তুলনা' : 'গত ৬ মাসের মাসিক আয় ও ব্যয় প্রবাহ'}
                            </p>
                        </div>
                        {/* Timeframe Toggle Buttons */}
                        <div className={`flex items-center p-1 rounded-xl border text-xs font-medium ${
                            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
                        }`}>
                            <button
                                onClick={() => setChartMode('WEEKLY')}
                                className={`px-3 py-1 rounded-lg transition ${
                                    chartMode === 'WEEKLY'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                সাপ্তাহিক
                            </button>
                            <button
                                onClick={() => setChartMode('MONTHLY')}
                                className={`px-3 py-1 rounded-lg transition ${
                                    chartMode === 'MONTHLY'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                মাসিক
                            </button>
                        </div>
                    </div>

                    {/* Area Chart Container */}
                    <div className="h-[280px] w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} />
                                <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} />
                                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tickFormatter={(val) => `${currency}${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                        borderColor: isDark ? '#334155' : '#e2e8f0',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    }}
                                    formatter={(value) => [`${currency} ${Number(value).toLocaleString('en-IN')}`, '']}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="Income"
                                    name="ইনকাম (Income)"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#incomeGradient)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Expense"
                                    name="খরচ (Expense)"
                                    stroke="#f43f5e"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#expenseGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Category Expense Breakdown (Donut / Pie Chart) */}
                <div className={`p-5 rounded-2xl border ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm sm:text-base">খরচের খাত (Expense Share)</h3>
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                        >
                            <Tags size={13} />
                            <span>ক্যাটাগরি</span>
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">প্রধান ক্যাটাগরিভিত্তিক খরচের বণ্টন</p>

                    <div className="h-[220px] w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, item) => [
                                        `${currency} ${Number(value).toLocaleString('en-IN')}`,
                                        item.payload.fullName
                                    ]}
                                    contentStyle={{
                                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                        borderColor: isDark ? '#334155' : '#e2e8f0',
                                        borderRadius: '10px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Custom Legend */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {pieChartData.slice(0, 4).map((entry, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] truncate">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-600 dark:text-slate-300 truncate">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 6-Month Trend Bar Chart */}
            <div className={`mt-5 p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-sm sm:text-base">ক্যাশ ফ্লো ট্রেন্ড (গত ৬ মাস)</h3>
                        <p className="text-xs text-slate-500">মাসিক মোট আয়, মোট ব্যয় এবং নেট লাভের ট্রেন্ড বিশ্লেষণ</p>
                    </div>
                    <span className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        Trend Analysis
                    </span>
                </div>
                <div className="h-[230px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} />
                            <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} />
                            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tickFormatter={(val) => `${currency}${val / 1000}k`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                    borderRadius: '12px',
                                }}
                                formatter={(val) => [`${currency} ${Number(val).toLocaleString('en-IN')}`, '']}
                            />
                            <Legend />
                            <Bar dataKey="ইনকাম" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="খরচ" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="লাভ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ================================================================= */}
            {/* SECTION 3: CATEGORY & MONTHLY BUDGET TRACKER (ক্যাটাগরি ও বাজেট) */}
            {/* ================================================================= */}
            <div className={`mt-6 p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Target size={18} className="text-amber-500" />
                            <h3 className="font-bold text-sm sm:text-base">মাসিক বাজেট ও খরচ ট্র্যাকিং</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            নির্ধারিত মাসিক ব্যয়ের বিপরীতে বর্তমান খরচের পরিমাণ ও অবশিষ্ট ফান্ড
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <Tags size={13} />
                            <span>ক্যাটাগরি ম্যানেজ</span>
                        </button>
                        <button
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition"
                        >
                            <Target size={13} />
                            <span>বাজেট সেট করুন</span>
                        </button>
                    </div>
                </div>

                {/* Budget Progress Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {budgetAnalysis.items.map((b, i) => (
                        <div
                            key={i}
                            className={`p-4 rounded-xl border transition-all ${
                                b.isOverBudget
                                    ? 'border-rose-500/40 bg-rose-500/5'
                                    : b.isNearBudget
                                        ? 'border-amber-500/40 bg-amber-500/5'
                                        : isDark ? 'border-slate-800 bg-slate-800/40' : 'border-slate-200 bg-slate-50/60'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold truncate max-w-[190px]">
                                    {b.categoryName}
                                </span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    b.isOverBudget
                                        ? 'bg-rose-500/15 text-rose-500'
                                        : b.isNearBudget
                                            ? 'bg-amber-500/15 text-amber-500'
                                            : 'bg-emerald-500/15 text-emerald-500'
                                }`}>
                                    {b.percentage}%
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden my-2">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        b.isOverBudget
                                            ? 'bg-rose-500'
                                            : b.isNearBudget
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <span>খরচ: <strong className="text-slate-800 dark:text-slate-200">{currency}{b.spent.toLocaleString('en-IN')}</strong></span>
                                <span>বাজেট: <strong>{currency}{Number(b.limit).toLocaleString('en-IN')}</strong></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ================================================================= */}
            {/* SECTION 4: TRANSACTION MANAGEMENT (ট্রানজেকশন ম্যানেজমেন্ট) */}
            {/* ================================================================= */}
            <div className={`mt-6 p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
                {/* Header & Quick Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="font-bold text-sm sm:text-base">ট্রানজেকশন রেজিস্ট্রি ও হিস্ট্রি</h3>
                        <p className="text-xs text-slate-500">
                            ফিল্টারিং, সার্চিং, বাছাইকরণ এবং এক্সপোর্ট সুবিধাসহ সম্পূর্ণ আর্থিক লগ
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleQuickExportCSV}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="ফিল্টার করা তালিকা Excel (CSV) হিসেবে সেভ করুন"
                        >
                            <FileSpreadsheet size={14} className="text-emerald-500" />
                            <span>Excel</span>
                        </button>
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <Printer size={14} className="text-blue-500" />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                    {/* Search */}
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="সার্চ (নোট, আইডি, মেথড)..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none focus:ring-2 ${
                                isDark
                                    ? 'bg-slate-800/80 border-slate-700 text-white focus:ring-emerald-500/20'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                            }`}
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                    >
                        <option value="ALL">সকল ধরন (আয় ও খরচ)</option>
                        <option value="INCOME">শুধুমাত্র ইনকাম (Income)</option>
                        <option value="EXPENSE">শুধুমাত্র খরচ (Expense)</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                    >
                        <option value="ALL">সকল ক্যাটাগরি</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>

                    {/* Payment Method Filter */}
                    <select
                        value={paymentFilter}
                        onChange={(e) => {
                            setPaymentFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                    >
                        <option value="ALL">সকল পেমেন্ট মেথড</option>
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="COD">COD</option>
                    </select>

                    {/* Period Filter */}
                    <select
                        value={periodFilter}
                        onChange={(e) => {
                            setPeriodFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                    >
                        <option value="ALL">সময়সীমা: সর্বমোট (All Time)</option>
                        <option value="THIS_MONTH">সময়সীমা: চলতি মাস (This Month)</option>
                        <option value="TODAY">সময়সীমা: আজ (Today)</option>
                        <option value="THIS_WEEK">সময়সীমা: চলতি সপ্তাহ (This Week)</option>
                        <option value="LAST_MONTH">সময়সীমা: গত মাস (Last Month)</option>
                    </select>

                    {/* Sort Selector */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`px-3 py-2 text-xs rounded-xl border outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                    >
                        <option value="DATE_DESC">তারিখ (নতুন হতে পুরাতন)</option>
                        <option value="DATE_ASC">তারিখ (পুরাতন হতে নতুন)</option>
                        <option value="AMOUNT_DESC">টাকার পরিমাণ (সর্বোচ্চ)</option>
                        <option value="AMOUNT_ASC">টাকার পরিমাণ (সর্বনিম্ন)</option>
                    </select>

                    {/* Active Filters Clear Button */}
                    {(searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || paymentFilter !== 'ALL' || periodFilter !== 'ALL') && (
                        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-6 flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-500">
                                ফিল্টার সক্রিয়: <strong>{filteredTransactions.length}</strong> টি ফলাফল পাওয়া গেছে
                            </span>
                            <button
                                onClick={() => {
                                    setSearchQuery('')
                                    setTypeFilter('ALL')
                                    setCategoryFilter('ALL')
                                    setPaymentFilter('ALL')
                                    setPeriodFilter('ALL')
                                    setCurrentPage(1)
                                }}
                                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-0.5 rounded-lg hover:bg-rose-500/10 transition"
                            >
                                <X size={13} />
                                <span>ফিল্টার রিসেট করুন</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto mt-3">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                            }`}>
                                <th className="py-3 px-3">তারিখ ও সময়</th>
                                <th className="py-3 px-3">ধরন</th>
                                <th className="py-3 px-3">ক্যাটাগরি</th>
                                <th className="py-3 px-3">পেমেন্ট মেথড</th>
                                <th className="py-3 px-3">রেফারেন্স / নোট</th>
                                <th className="py-3 px-3 text-right">পরিমাণ</th>
                                <th className="py-3 px-3 text-right">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            {paginatedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-400">
                                        কোনো ট্রানজেকশন পাওয়া যায়নি।
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransactions.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        className={`group transition-colors ${
                                            isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'
                                        }`}
                                    >
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <p className="font-semibold">{tx.date}</p>
                                            <p className="text-[10px] text-slate-400">{tx.time || '12:00'}</p>
                                        </td>

                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                tx.type === 'INCOME'
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                            }`}>
                                                {tx.type === 'INCOME' ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                                                <span>{tx.type === 'INCOME' ? 'আয়' : 'খরচ'}</span>
                                            </span>
                                        </td>

                                        <td className="py-3 px-3 whitespace-nowrap font-medium">
                                            {tx.category}
                                        </td>

                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
                                                {tx.paymentMethod || 'Cash'}
                                            </span>
                                        </td>

                                        <td className="py-3 px-3 max-w-[240px]">
                                            {tx.reference && (
                                                <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded mr-1.5">
                                                    {tx.reference}
                                                </span>
                                            )}
                                            <span className="text-slate-600 dark:text-slate-300 truncate inline-block align-middle">
                                                {tx.note || '-'}
                                            </span>
                                        </td>

                                        <td className="py-3 px-3 text-right whitespace-nowrap font-bold">
                                            <span className={tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                {tx.type === 'INCOME' ? '+' : '-'} {currency} {Number(tx.amount).toLocaleString('en-IN')}
                                            </span>
                                        </td>

                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingTx(tx)
                                                        setIsTxModalOpen(true)
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition"
                                                    title="এডিট ট্রানজেকশন"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                {!isStaff && (
                                                    <button
                                                        onClick={() => setDeleteConfirmId(tx.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                                        title="ডিলিট ট্রানজেকশন"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs mt-3">
                        <span className="text-slate-500">
                            মোট {filteredTransactions.length} টি রেকর্ড (পৃষ্ঠা {currentPage} / {totalPages})
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className={`px-3 py-1.5 rounded-lg border transition disabled:opacity-40 ${
                                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                পূর্ববর্তী
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className={`px-3 py-1.5 rounded-lg border transition disabled:opacity-40 ${
                                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                পরবর্তী
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteConfirmId && (() => {
                const deletingTx = transactions.find(t => t.id === deleteConfirmId)
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl space-y-4 ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                                <Trash2 size={24} />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-base">ট্রানজেকশন ডিলিট করতে চান?</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    এই লেনদেনটি স্থায়ীভাবে মুছে ফেলা হবে এবং ক্যাশ ফ্লো হিসাবে প্রভাব ফেলবে।
                                </p>
                            </div>

                            {deletingTx && (
                                <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                                    isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <div className="flex justify-between font-semibold">
                                        <span className="truncate mr-2">{deletingTx.category}</span>
                                        <span className={`shrink-0 ${deletingTx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {deletingTx.type === 'INCOME' ? '+' : '-'} {currency} {Number(deletingTx.amount).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>{deletingTx.date}</span>
                                        <span>{deletingTx.paymentMethod || 'Cash'}</span>
                                    </div>
                                    {deletingTx.note && (
                                        <p className="text-[11px] text-slate-500 italic truncate pt-0.5">
                                            "{deletingTx.note}"
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                                        isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                                    }`}
                                >
                                    বাতিল
                                </button>
                                <button
                                    onClick={() => handleDeleteTransaction(deleteConfirmId)}
                                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-md shadow-rose-600/25"
                                >
                                    ডিলিট করুন
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Modals */}
            <TransactionModal
                isOpen={isTxModalOpen}
                onClose={() => {
                    setIsTxModalOpen(false)
                    setEditingTx(null)
                }}
                onSave={handleSaveTransaction}
                editingTransaction={editingTx}
                defaultType={modalDefaultType}
                categories={categories}
                isDark={isDark}
            />

            <BudgetModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                budgets={budgets}
                categories={categories}
                onSaveBudget={(b) => dispatch(setBudget(b))}
                onDeleteBudget={(catName) => dispatch(deleteBudget(catName))}
                currentRole={currentRole}
                isDark={isDark}
            />

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                categories={categories}
                onAddCategory={(c) => dispatch(addCategory(c))}
                onUpdateCategory={(c) => dispatch(updateCategory(c))}
                onDeleteCategory={(id) => dispatch(deleteCategory(id))}
                currentRole={currentRole}
                isDark={isDark}
            />

            <CashFlowReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                transactions={transactions}
                isDark={isDark}
            />
        </div>
    )
}
