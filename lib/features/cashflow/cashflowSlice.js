import { createSlice } from '@reduxjs/toolkit'

// Timezone-safe local date helper functions
export const getLocalDateStr = (d = new Date()) => {
    const dateObj = d instanceof Date ? d : new Date(d)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export const getLocalMonthStr = (d = new Date()) => {
    const dateObj = d instanceof Date ? d : new Date(d)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

// Default Categories for E-commerce business in Bangladesh
export const defaultCashflowCategories = [
    // Income Categories
    { id: 'cat_inc_1', name: 'Product Sales (অনলাইন সেলস)', type: 'INCOME', color: '#10b981', isDefault: true },
    { id: 'cat_inc_2', name: 'Delivery Charge Collection (ডেলিভারি চার্জ)', type: 'INCOME', color: '#059669', isDefault: true },
    { id: 'cat_inc_3', name: 'Wholesale / B2B (পাইকারি বিক্রি)', type: 'INCOME', color: '#34d399', isDefault: true },
    { id: 'cat_inc_4', name: 'Affiliate & Commissions', type: 'INCOME', color: '#6ee7b7', isDefault: false },
    { id: 'cat_inc_5', name: 'Other Income (অন্যান্য আয়)', type: 'INCOME', color: '#14b8a6', isDefault: false },

    // Expense Categories
    { id: 'cat_exp_1', name: 'Inventory / Product Purchase (পণ্য ক্রয়)', type: 'EXPENSE', color: '#ef4444', isDefault: true },
    { id: 'cat_exp_2', name: 'Marketing & FB Ads (ফেসবুক বুস্টিং/বিজ্ঞাপন)', type: 'EXPENSE', color: '#f97316', isDefault: true },
    { id: 'cat_exp_3', name: 'Courier & Shipping (রেডএক্স/পাঠাও/সুন্দরবন)', type: 'EXPENSE', color: '#e11d48', isDefault: true },
    { id: 'cat_exp_4', name: 'Packaging Materials (বক্স ও প্যাকেট)', type: 'EXPENSE', color: '#d97706', isDefault: true },
    { id: 'cat_exp_5', name: 'Staff Salaries (কর্মচারী বেতন)', type: 'EXPENSE', color: '#8b5cf6', isDefault: true },
    { id: 'cat_exp_6', name: 'Office Rent (দোকান/অফিস ভাড়া)', type: 'EXPENSE', color: '#6366f1', isDefault: true },
    { id: 'cat_exp_7', name: 'Utility & Internet (বিদ্যুৎ ও ইন্টারনেট)', type: 'EXPENSE', color: '#0284c7', isDefault: true },
    { id: 'cat_exp_8', name: 'Software & Subscriptions (ডোমেন/হোস্টিং)', type: 'EXPENSE', color: '#64748b', isDefault: false },
    { id: 'cat_exp_9', name: 'Miscellaneous (বিবিধ খরচ)', type: 'EXPENSE', color: '#78716c', isDefault: false },
]

// Default Monthly Budgets (Limits in BDT ৳)
export const defaultCashflowBudgets = [
    { categoryName: 'Marketing & FB Ads (ফেসবুক বুস্টিং/বিজ্ঞাপন)', limit: 25000, alertThreshold: 80 },
    { categoryName: 'Inventory / Product Purchase (পণ্য ক্রয়)', limit: 80000, alertThreshold: 85 },
    { categoryName: 'Packaging Materials (বক্স ও প্যাকেট)', limit: 8000, alertThreshold: 80 },
    { categoryName: 'Staff Salaries (কর্মচারী বেতন)', limit: 40000, alertThreshold: 90 },
    { categoryName: 'Courier & Shipping (রেডএক্স/পাঠাও/সুন্দরবন)', limit: 15000, alertThreshold: 85 },
    { categoryName: 'Office Rent (দোকান/অফিস ভাড়া)', limit: 20000, alertThreshold: 95 },
    { categoryName: 'Utility & Internet (বিদ্যুৎ ও ইন্টারনেট)', limit: 5000, alertThreshold: 80 },
]

// Realistic Initial Transactions (September & August 2026)
export const defaultCashflowTransactions = [
    {
        id: 'tx_101',
        type: 'INCOME',
        amount: 34500,
        category: 'Product Sales (অনলাইন সেলস)',
        date: '2026-09-03',
        time: '11:30',
        paymentMethod: 'bKash',
        reference: 'ORD-98210',
        note: 'ইলেকট্রনিক্স ও গ্যাজেট অনলাইন পেমেন্ট (bKash Merchant)',
        createdBy: 'Admin',
        createdAt: '2026-09-03T05:30:00.000Z'
    },
    {
        id: 'tx_102',
        type: 'EXPENSE',
        amount: 8500,
        category: 'Marketing & FB Ads (ফেসবুক বুস্টিং/বিজ্ঞাপন)',
        date: '2026-09-03',
        time: '09:15',
        paymentMethod: 'Card',
        reference: 'FB-AD-SEPT-1',
        note: 'Facebook Campaign Boost (Credit Card payment)',
        createdBy: 'Admin',
        createdAt: '2026-09-03T03:15:00.000Z'
    },
    {
        id: 'tx_103',
        type: 'INCOME',
        amount: 18200,
        category: 'Product Sales (অনলাইন সেলস)',
        date: '2026-09-02',
        time: '16:45',
        paymentMethod: 'Nagad',
        reference: 'ORD-98195',
        note: 'স্মার্টওয়াচ ও হেডফোন ডেলিভারি ক্যাশআউট',
        createdBy: 'Staff',
        createdAt: '2026-09-02T10:45:00.000Z'
    },
    {
        id: 'tx_104',
        type: 'EXPENSE',
        amount: 3200,
        category: 'Packaging Materials (বক্স ও প্যাকেট)',
        date: '2026-09-02',
        time: '14:20',
        paymentMethod: 'Cash',
        reference: 'VOUCHER-042',
        note: 'কুরিয়ার বাবল র্যাপ ও ৫০০ পিস কাস্টম কার্টন বক্স',
        createdBy: 'Admin',
        createdAt: '2026-09-02T08:20:00.000Z'
    },
    {
        id: 'tx_105',
        type: 'INCOME',
        amount: 45000,
        category: 'Wholesale / B2B (পাইকারি বিক্রি)',
        date: '2026-09-01',
        time: '12:00',
        paymentMethod: 'Bank Transfer',
        reference: 'BRAC-TRX-551',
        note: 'চট্টগ্রাম ডিলার বাল্ক স্টক সরবরাহ',
        createdBy: 'Admin',
        createdAt: '2026-09-01T06:00:00.000Z'
    },
    {
        id: 'tx_106',
        type: 'EXPENSE',
        amount: 20000,
        category: 'Office Rent (দোকান/অফিস ভাড়া)',
        date: '2026-09-01',
        time: '10:00',
        paymentMethod: 'Bank Transfer',
        reference: 'RENT-SEP-26',
        note: 'মিরপুর আউটলেট ও অফিস সেপ্টেম্বর মাসের ভাড়া',
        createdBy: 'Admin',
        createdAt: '2026-09-01T04:00:00.000Z'
    },
    {
        id: 'tx_107',
        type: 'EXPENSE',
        amount: 35000,
        category: 'Staff Salaries (কর্মচারী বেতন)',
        date: '2026-09-01',
        time: '18:30',
        paymentMethod: 'bKash',
        reference: 'SALARY-AUG',
        note: 'অগাস্ট মাসের স্টাফ স্যালারি ডিসবার্সমেন্ট',
        createdBy: 'Admin',
        createdAt: '2026-09-01T12:30:00.000Z'
    },
    {
        id: 'tx_108',
        type: 'INCOME',
        amount: 28400,
        category: 'Product Sales (অনলাইন সেলস)',
        date: '2026-08-31',
        time: '17:10',
        paymentMethod: 'COD',
        reference: 'STEADFAST-PAY',
        note: 'Steadfast Courier COD remittance settlement',
        createdBy: 'Staff',
        createdAt: '2026-08-31T11:10:00.000Z'
    },
    {
        id: 'tx_109',
        type: 'EXPENSE',
        amount: 54000,
        category: 'Inventory / Product Purchase (পণ্য ক্রয়)',
        date: '2026-08-30',
        time: '11:00',
        paymentMethod: 'Bank Transfer',
        reference: 'PO-2026-88',
        note: 'সাপ্লায়ার থেকে নতুন ব্লুটুথ স্পিকার ও ট্রাইপড স্টক ক্রয়',
        createdBy: 'Admin',
        createdAt: '2026-08-30T05:00:00.000Z'
    },
    {
        id: 'tx_110',
        type: 'EXPENSE',
        amount: 6400,
        category: 'Courier & Shipping (রেডএক্স/পাঠাও/সুন্দরবন)',
        date: '2026-08-29',
        time: '15:40',
        paymentMethod: 'bKash',
        reference: 'PATHAO-INV-77',
        note: 'Pathao Courier delivery charges for 65 parcels',
        createdBy: 'Staff',
        createdAt: '2026-08-29T09:40:00.000Z'
    },
    {
        id: 'tx_111',
        type: 'INCOME',
        amount: 22000,
        category: 'Product Sales (অনলাইন সেলস)',
        date: '2026-08-28',
        time: '13:20',
        paymentMethod: 'bKash',
        reference: 'ORD-98012',
        note: 'উইকেন্ড ক্যাম্পেইন অনলাইন অর্ডার পেমেন্ট',
        createdBy: 'Admin',
        createdAt: '2026-08-28T07:20:00.000Z'
    },
    {
        id: 'tx_112',
        type: 'EXPENSE',
        amount: 3800,
        category: 'Utility & Internet (বিদ্যুৎ ও ইন্টারনেট)',
        date: '2026-08-27',
        time: '14:00',
        paymentMethod: 'bKash',
        reference: 'DPDC-BILL-AUG',
        note: 'অফিস বিদ্যুৎ ও ফাইবার অপটিক ইন্টারনেট বিল',
        createdBy: 'Admin',
        createdAt: '2026-08-27T08:00:00.000Z'
    },
    {
        id: 'tx_113',
        type: 'INCOME',
        amount: 39500,
        category: 'Product Sales (অনলাইন সেলস)',
        date: '2026-08-25',
        time: '19:00',
        paymentMethod: 'bKash',
        reference: 'ORD-97840',
        note: 'Mega Flash Sale Day Order collections',
        createdBy: 'Admin',
        createdAt: '2026-08-25T13:00:00.000Z'
    },
    {
        id: 'tx_114',
        type: 'EXPENSE',
        amount: 14500,
        category: 'Marketing & FB Ads (ফেসবুক বুস্টিং/বিজ্ঞাপন)',
        date: '2026-08-24',
        time: '10:15',
        paymentMethod: 'Card',
        reference: 'FB-AD-AUG-2',
        note: 'Flash Sale Video Ads & Influencer promotions',
        createdBy: 'Admin',
        createdAt: '2026-08-24T04:15:00.000Z'
    },
    {
        id: 'tx_115',
        type: 'INCOME',
        amount: 5200,
        category: 'Delivery Charge Collection (ডেলিভারি চার্জ)',
        date: '2026-08-22',
        time: '16:00',
        paymentMethod: 'Cash',
        reference: 'DEL-COLL-AUG',
        note: 'ঢাকার ভেতরের ও বাইরের হোম ডেলিভারি ফি কালেকশন',
        createdBy: 'Staff',
        createdAt: '2026-08-22T10:00:00.000Z'
    },
    {
        id: 'tx_116',
        type: 'EXPENSE',
        amount: 1950,
        category: 'Software & Subscriptions (ডোমেন/হোস্টিং)',
        date: '2026-08-20',
        time: '12:00',
        paymentMethod: 'Card',
        reference: 'AWS-SUB-AUG',
        note: 'Cloud Server hosting & SMS Gateway package recharge',
        createdBy: 'Admin',
        createdAt: '2026-08-20T06:00:00.000Z'
    },
    {
        id: 'tx_117',
        type: 'INCOME',
        amount: 31000,
        category: 'Product Sales (অনলাইন সেলস)',
        date: '2026-08-18',
        time: '15:25',
        paymentMethod: 'Nagad',
        reference: 'ORD-97510',
        note: 'অফিসিয়াল স্টোর সেলস ও বিকাশ/নগদ পেমেন্ট',
        createdBy: 'Admin',
        createdAt: '2026-08-18T09:25:00.000Z'
    },
    {
        id: 'tx_118',
        type: 'EXPENSE',
        amount: 28000,
        category: 'Inventory / Product Purchase (পণ্য ক্রয়)',
        date: '2026-08-15',
        time: '11:45',
        paymentMethod: 'Bank Transfer',
        reference: 'PO-2026-72',
        note: 'চকবাজার ইমপোর্টার থেকে এক্সেসরিজ স্টক ইনভয়েস',
        createdBy: 'Admin',
        createdAt: '2026-08-15T05:45:00.000Z'
    }
]

export const defaultCashflowData = {
    transactions: defaultCashflowTransactions,
    categories: defaultCashflowCategories,
    budgets: defaultCashflowBudgets,
    currentRole: 'ADMIN', // 'ADMIN' | 'STAFF'
    theme: 'light', // 'light' | 'dark'
}

const cashflowSlice = createSlice({
    name: 'cashflow',
    initialState: defaultCashflowData,
    reducers: {
        hydrateCashflow: (state, action) => {
            if (action.payload) {
                if (Array.isArray(action.payload.transactions)) {
                    state.transactions = action.payload.transactions
                }
                if (Array.isArray(action.payload.categories) && action.payload.categories.length > 0) {
                    state.categories = action.payload.categories
                }
                if (Array.isArray(action.payload.budgets)) {
                    state.budgets = action.payload.budgets
                }
                if (action.payload.currentRole) {
                    state.currentRole = action.payload.currentRole
                }
                if (action.payload.theme) {
                    state.theme = action.payload.theme
                }
            }
        },

        addTransaction: (state, action) => {
            const tx = action.payload
            const newTx = {
                id: 'tx_' + Date.now(),
                type: tx.type || 'INCOME',
                amount: Math.abs(parseFloat(tx.amount) || 0),
                category: tx.category || 'Other',
                date: tx.date || new Date().toISOString().split('T')[0],
                time: tx.time || new Date().toTimeString().slice(0, 5),
                paymentMethod: tx.paymentMethod || 'Cash',
                reference: tx.reference?.trim() || '',
                note: tx.note?.trim() || '',
                createdBy: state.currentRole === 'STAFF' ? 'Staff' : 'Admin',
                createdAt: new Date().toISOString()
            }
            state.transactions.unshift(newTx)
        },

        updateTransaction: (state, action) => {
            const { id, ...updatedFields } = action.payload
            const index = state.transactions.findIndex(t => t.id === id)
            if (index !== -1) {
                state.transactions[index] = {
                    ...state.transactions[index],
                    ...updatedFields,
                    amount: Math.abs(parseFloat(updatedFields.amount ?? state.transactions[index].amount) || 0),
                    updatedAt: new Date().toISOString()
                }
            }
        },

        deleteTransaction: (state, action) => {
            // Only allow if role is ADMIN
            if (state.currentRole !== 'STAFF') {
                state.transactions = state.transactions.filter(t => t.id !== action.payload)
            }
        },

        addCategory: (state, action) => {
            const { name, type, color } = action.payload
            const exists = state.categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())
            if (!exists) {
                state.categories.push({
                    id: 'cat_' + Date.now(),
                    name: name.trim(),
                    type: type || 'EXPENSE',
                    color: color || (type === 'INCOME' ? '#10b981' : '#f43f5e'),
                    isDefault: false
                })
            }
        },

        updateCategory: (state, action) => {
            const { id, name, color, type } = action.payload
            const cat = state.categories.find(c => c.id === id)
            if (cat) {
                const oldName = cat.name
                if (name) cat.name = name.trim()
                if (color) cat.color = color
                if (type) cat.type = type

                // Also update any budgets using the old name
                if (name && oldName !== name) {
                    const budget = state.budgets.find(b => b.categoryName === oldName)
                    if (budget) budget.categoryName = name.trim()

                    // And transactions using the old name
                    state.transactions.forEach(t => {
                        if (t.category === oldName) t.category = name.trim()
                    })
                }
            }
        },

        deleteCategory: (state, action) => {
            if (state.currentRole !== 'STAFF') {
                const cat = state.categories.find(c => c.id === action.payload)
                if (cat) {
                    state.categories = state.categories.filter(c => c.id !== action.payload)
                    state.budgets = state.budgets.filter(b => b.categoryName !== cat.name)
                }
            }
        },

        setBudget: (state, action) => {
            const { categoryName, limit, alertThreshold } = action.payload
            const existingIndex = state.budgets.findIndex(b => b.categoryName === categoryName)
            const numericLimit = Math.max(0, parseFloat(limit) || 0)
            const threshold = Math.min(100, Math.max(50, parseInt(alertThreshold, 10) || 80))

            if (existingIndex !== -1) {
                state.budgets[existingIndex].limit = numericLimit
                state.budgets[existingIndex].alertThreshold = threshold
            } else {
                state.budgets.push({
                    categoryName,
                    limit: numericLimit,
                    alertThreshold: threshold
                })
            }
        },

        deleteBudget: (state, action) => {
            if (state.currentRole !== 'STAFF') {
                state.budgets = state.budgets.filter(b => b.categoryName !== action.payload)
            }
        },

        setUserRole: (state, action) => {
            state.currentRole = action.payload // 'ADMIN' | 'STAFF'
        },

        toggleTheme: (state) => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark'
        },

        setTheme: (state, action) => {
            state.theme = action.payload
        },

        // Sync completed store orders as cash flow income entries
        syncOrdersToCashflow: (state, action) => {
            const orders = action.payload || []
            let addedCount = 0

            orders.forEach(order => {
                const ref = `ORDER-${order.id}`
                // Check if already synced
                const alreadyExists = state.transactions.some(t => t.reference === ref)
                if (!alreadyExists && order.total > 0) {
                    const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    state.transactions.unshift({
                        id: 'tx_ord_' + order.id,
                        type: 'INCOME',
                        amount: order.total,
                        category: 'Product Sales (অনলাইন সেলস)',
                        date: orderDate,
                        time: '12:00',
                        paymentMethod: order.paymentMethod === 'COD' ? 'COD' : 'Card',
                        reference: ref,
                        note: `Auto-synced from Store Order #${order.id.slice(-6)} (${order.user?.name || 'Customer'})`,
                        createdBy: 'System (Sync)',
                        createdAt: order.createdAt || new Date().toISOString()
                    })
                    addedCount++
                }
            })
        },

        resetToDefaultCashflow: (state) => {
            state.transactions = defaultCashflowTransactions
            state.categories = defaultCashflowCategories
            state.budgets = defaultCashflowBudgets
        }
    }
})

export const {
    hydrateCashflow,
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
    setTheme,
    syncOrdersToCashflow,
    resetToDefaultCashflow,
} = cashflowSlice.actions

export default cashflowSlice.reducer
