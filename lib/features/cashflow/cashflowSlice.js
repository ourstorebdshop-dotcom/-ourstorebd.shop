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
export const defaultCashflowTransactions = []

export const defaultCashflowData = {
    transactions: [],
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
