'use client'

import { useState } from 'react'
import { X, FileText, Download, Printer, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { getLocalDateStr, getLocalMonthStr } from '@/lib/features/cashflow/cashflowSlice'

export default function CashFlowReportModal({
    isOpen,
    onClose,
    transactions = [],
    isDark = false
}) {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'

    // Period selection: 'today', 'this_week', 'this_month', 'last_month', 'all', 'custom'
    const [period, setPeriod] = useState('this_month')
    const [customStart, setCustomStart] = useState('')
    const [customEnd, setCustomEnd] = useState('')

    if (!isOpen) return null

    // Determine date boundaries
    const now = new Date()
    const todayStr = getLocalDateStr(now)
    const currentMonthStr = getLocalMonthStr(now)

    const getFilterRange = () => {
        if (period === 'today') {
            return { start: todayStr, end: todayStr, label: `আজকের রিপোর্ট (${todayStr})` }
        }
        if (period === 'this_week') {
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay())
            const startStr = getLocalDateStr(startOfWeek)
            return { start: startStr, end: todayStr, label: `এই সপ্তাহের রিপোর্ট (${startStr} হতে ${todayStr})` }
        }
        if (period === 'this_month') {
            const startStr = `${currentMonthStr}-01`
            return { start: startStr, end: todayStr, label: `এই মাসের রিপোর্ট (${startStr} হতে ${todayStr})` }
        }
        if (period === 'last_month') {
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
            const startStr = getLocalDateStr(lastMonthDate)
            const endStr = getLocalDateStr(lastMonthEnd)
            return { start: startStr, end: endStr, label: `গত মাসের রিপোর্ট (${startStr} হতে ${endStr})` }
        }
        if (period === 'custom') {
            return {
                start: customStart || '1970-01-01',
                end: customEnd || '2099-12-31',
                label: `কাস্টম রেঞ্জ রিপোর্ট (${customStart || 'শুরু'} হতে ${customEnd || 'আজ'})`
            }
        }
        return { start: '1970-01-01', end: '2099-12-31', label: 'সর্বমোট সামগ্রিক রিপোর্ট (All Time)' }
    }

    const range = getFilterRange()

    // Filter transactions in range
    const filteredTxs = transactions.filter(t => {
        if (!t.date) return false
        return t.date >= range.start && t.date <= range.end
    })

    const totalIncome = filteredTxs
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + (t.amount || 0), 0)

    const totalExpense = filteredTxs
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + (t.amount || 0), 0)

    const netCashFlow = totalIncome - totalExpense
    const profitMargin = totalIncome > 0 ? ((netCashFlow / totalIncome) * 100).toFixed(1) : 0

    // Expenses breakdown by category
    const expenseBreakdown = filteredTxs
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount
            return acc
        }, {})

    const sortedExpenses = Object.entries(expenseBreakdown)
        .sort((a, b) => b[1] - a[1])

    // Excel / CSV Export
    const handleExportExcel = () => {
        try {
            const headers = ['ID', 'Date', 'Type', 'Category', 'Amount (BDT)', 'Payment Method', 'Reference', 'Note', 'Created By']
            const rows = filteredTxs.map(t => [
                t.id,
                t.date,
                t.type === 'INCOME' ? 'Income' : 'Expense',
                `"${(t.category || '').replace(/"/g, '""')}"`,
                t.amount,
                `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
                `"${(t.reference || '').replace(/"/g, '""')}"`,
                `"${(t.note || '').replace(/"/g, '""')}"`,
                t.createdBy || 'Admin'
            ])

            // Summary rows
            rows.push([])
            rows.push(['--- SUMMARY ---'])
            rows.push(['Total Income', '', '', '', totalIncome])
            rows.push(['Total Expense', '', '', '', totalExpense])
            rows.push(['Net Cash Flow', '', '', '', netCashFlow])
            rows.push(['Profit Margin', '', '', '', `${profitMargin}%`])

            const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `OurStoreBD_CashFlow_Report_${period}_${todayStr}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success('Excel/CSV রিপোর্ট ডাউনলোড সম্পন্ন হয়েছে!')
        } catch (e) {
            toast.error('ডাউনলোড ব্যর্থ হয়েছে')
        }
    }

    // Print / PDF Trigger
    const handlePrintPDF = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            toast.error('পপ-আপ ব্লক করা আছে! ব্রাউজার সেটিংসে অনুমতি দিন।')
            return
        }

        const tableRows = filteredTxs.map((t, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 8px 12px; font-size: 11px;">${t.date} ${t.time || ''}</td>
                <td style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: ${t.type === 'INCOME' ? '#059669' : '#e11d48'};">
                    ${t.type === 'INCOME' ? 'আয় (Income)' : 'ব্যয় (Expense)'}
                </td>
                <td style="padding: 8px 12px; font-size: 11px;">${t.category}</td>
                <td style="padding: 8px 12px; font-size: 11px;">${t.paymentMethod || 'Cash'}</td>
                <td style="padding: 8px 12px; font-size: 11px; color: #64748b;">${t.reference || '-'}</td>
                <td style="padding: 8px 12px; font-size: 11px; font-weight: bold; text-align: right; color: ${t.type === 'INCOME' ? '#059669' : '#e11d48'};">
                    ${currency} ${Number(t.amount).toLocaleString('en-IN')}
                </td>
            </tr>
        `).join('')

        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Financial Cash Flow Statement - Our Store BD</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; color: #059669; margin: 0; }
                    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
                    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
                    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; background: #f8fafc; }
                    .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
                    .card-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; }
                    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="title">Our Store BD</h1>
                        <p class="subtitle">ক্যাশ ফ্লো ও ফাইন্যান্সিয়াল অ্যাকাউন্টস স্টেটমেন্ট</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 13px; font-weight: bold; margin: 0;">${range.label}</p>
                        <p style="font-size: 10px; color: #64748b; margin-top: 3px;">রিপোর্ট জেনারেট: ${new Date().toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div class="cards">
                    <div class="card">
                        <div class="card-label">সর্বমোট ইনকাম (Total Inflow)</div>
                        <div class="card-val" style="color: #059669;">${currency} ${totalIncome.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">সর্বমোট ব্যয় (Total Outflow)</div>
                        <div class="card-val" style="color: #e11d48;">${currency} ${totalExpense.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">নেট ব্যালেন্স (Net Cash Flow)</div>
                        <div class="card-val" style="color: ${netCashFlow >= 0 ? '#059669' : '#e11d48'};">
                            ${currency} ${netCashFlow.toLocaleString('en-IN')} (${profitMargin}%)
                        </div>
                    </div>
                </div>

                <h3 style="font-size: 14px; margin-bottom: 8px;">ট্রানজেকশন তালিকা (${filteredTxs.length} টি রেকর্ড)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>তারিখ</th>
                            <th>ধরন</th>
                            <th>ক্যাটাগরি</th>
                            <th>মেথড</th>
                            <th>রেফারেন্স</th>
                            <th style="text-align: right;">পরিমাণ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <div class="footer">
                    <span>Our Store BD • Confidentially Generated for Admin & Management</span>
                    <span>পৃষ্ঠা ১ এর ১</span>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `

        printWindow.document.open()
        printWindow.document.write(printHtml)
        printWindow.document.close()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
                {/* Header */}
                <div className={`p-5 border-b flex items-center justify-between ${
                    isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-500">
                            <FileText size={22} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base sm:text-lg">
                                ক্যাশ ফ্লো রিপোর্ট ও স্টেটমেন্ট এক্সপোর্ট
                            </h3>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                নির্দিষ্ট সময়সীমার আর্থিক সারসংক্ষেপ পর্যালোচনা করুন এবং Excel অথবা PDF ফাইল তৈরি করুন
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

                <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
                    {/* Period Tabs */}
                    <div>
                        <label className="block text-xs font-semibold mb-2 text-slate-500">
                            রিপোর্ট সময়সীমা নির্বাচন করুন
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'today', label: 'আজ (Today)' },
                                { id: 'this_week', label: 'চলতি সপ্তাহ (This Week)' },
                                { id: 'this_month', label: 'চলতি মাস (This Month)' },
                                { id: 'last_month', label: 'গত মাস (Last Month)' },
                                { id: 'all', label: 'সব সময় (All Time)' },
                                { id: 'custom', label: 'কাস্টম রেঞ্জ (Custom)' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setPeriod(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                                        period === tab.id
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                            : isDark
                                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Inputs if Custom selected */}
                    {period === 'custom' && (
                        <div className={`p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                            isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-500">শুরুর তারিখ</label>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-500">শেষের তারিখ</label>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                                    }`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Report Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className={`p-4 rounded-xl border ${
                            isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-700'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider">মোট আয় (Inflow)</span>
                                <TrendingUp size={16} />
                            </div>
                            <h4 className="text-xl font-bold mt-1">
                                {currency} {totalIncome.toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] opacity-80 mt-1">
                                {filteredTxs.filter(t => t.type === 'INCOME').length} টি আয় লেনদেন
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${
                            isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-400' : 'bg-rose-50/60 border-rose-200/80 text-rose-700'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider">মোট খরচ (Outflow)</span>
                                <TrendingDown size={16} />
                            </div>
                            <h4 className="text-xl font-bold mt-1">
                                {currency} {totalExpense.toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] opacity-80 mt-1">
                                {filteredTxs.filter(t => t.type === 'EXPENSE').length} টি ব্যয় লেনদেন
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${
                            netCashFlow >= 0
                                ? isDark ? 'bg-blue-950/20 border-blue-900/40 text-blue-400' : 'bg-blue-50/60 border-blue-200/80 text-blue-700'
                                : isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-400' : 'bg-rose-50/60 border-rose-200/80 text-rose-700'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider">নেট প্রফিট / ব্যালেন্স</span>
                                <DollarSign size={16} />
                            </div>
                            <h4 className="text-xl font-bold mt-1">
                                {currency} {netCashFlow.toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] opacity-80 mt-1">
                                প্রফিট মার্জিন: {profitMargin}%
                            </p>
                        </div>
                    </div>

                    {/* Top Expense Drivers in this period */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                            প্রধান খরচের খাতসমূহ (Top Expense Drivers)
                        </h4>
                        <div className="space-y-2">
                            {sortedExpenses.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-3">এই সময়সীমায় কোনো খরচ নেই</p>
                            ) : (
                                sortedExpenses.slice(0, 5).map(([catName, amount], i) => {
                                    const percent = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
                                    return (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>{catName}</span>
                                                <span className="font-bold">
                                                    {currency} {amount.toLocaleString('en-IN')} ({percent}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer with Action Buttons */}
                <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
                    isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
                }`}>
                    <span className="text-xs text-slate-400">
                        মোট {filteredTxs.length} টি লেনদেন অন্তর্ভুক্ত
                    </span>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            onClick={handleExportExcel}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-600/20"
                        >
                            <Download size={15} />
                            <span>Excel (CSV) এক্সপোর্ট</span>
                        </button>
                        <button
                            onClick={handlePrintPDF}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-blue-600/20"
                        >
                            <Printer size={15} />
                            <span>প্রিন্ট / PDF স্টেটমেন্ট</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
