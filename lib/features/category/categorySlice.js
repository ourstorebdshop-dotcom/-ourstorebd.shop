import { createSlice } from '@reduxjs/toolkit'

// Default categories derived from product data
export const defaultCategories = [
    { id: 'cat_1', name: 'Decoration', order: 0, visible: true },
    { id: 'cat_2', name: 'Speakers', order: 1, visible: true },
    { id: 'cat_3', name: 'Watch', order: 2, visible: true },
    { id: 'cat_4', name: 'Headphones', order: 3, visible: true },
    { id: 'cat_5', name: 'Camera', order: 4, visible: true },
    { id: 'cat_6', name: 'Pen', order: 5, visible: true },
    { id: 'cat_7', name: 'Theater', order: 6, visible: true },
    { id: 'cat_8', name: 'Earbuds', order: 7, visible: true },
    { id: 'cat_9', name: 'Mouse', order: 8, visible: true },
    { id: 'cat_10', name: 'Cleaner', order: 9, visible: true },
]

const categorySlice = createSlice({
    name: 'category',
    initialState: {
        categories: [],
    },
    reducers: {
        hydrateCategories: (state, action) => {
            state.categories = Array.isArray(action.payload) ? action.payload : []
        },
        addCategory: (state, action) => {
            if (!action.payload?.name) return
            if (!Array.isArray(state.categories)) state.categories = []
            const { name } = action.payload
            const maxOrder = state.categories.length > 0
                ? Math.max(...state.categories.map(c => c?.order || 0)) + 1
                : 0
            state.categories.push({
                id: 'cat_' + Date.now(),
                name: String(name).trim(),
                order: maxOrder,
                visible: true,
            })
        },
        updateCategory: (state, action) => {
            if (!action.payload?.id || !Array.isArray(state.categories)) return
            const { id, name, visible } = action.payload
            const cat = state.categories.find(c => c?.id === id)
            if (cat) {
                if (name !== undefined) cat.name = String(name).trim()
                if (visible !== undefined) cat.visible = visible
            }
        },
        deleteCategory: (state, action) => {
            if (!action.payload || !Array.isArray(state.categories)) return
            state.categories = state.categories.filter(c => c?.id !== action.payload)
            // Re-normalize order
            state.categories
                .sort((a, b) => (a?.order || 0) - (b?.order || 0))
                .forEach((c, i) => { if (c) c.order = i })
        },
        reorderCategory: (state, action) => {
            if (!action.payload?.id || !Array.isArray(state.categories)) return
            const { id, direction } = action.payload // direction: 'up' or 'down'
            const sorted = [...state.categories].sort((a, b) => (a?.order || 0) - (b?.order || 0))
            const index = sorted.findIndex(c => c?.id === id)
            if (index < 0) return

            if (direction === 'up' && index > 0) {
                const prevOrder = sorted[index - 1]?.order ?? 0
                const currOrder = sorted[index]?.order ?? 0
                const prevCat = state.categories.find(c => c?.id === sorted[index - 1]?.id)
                const currCat = state.categories.find(c => c?.id === id)
                if (prevCat && currCat) {
                    prevCat.order = currOrder
                    currCat.order = prevOrder
                }
            }

            if (direction === 'down' && index < sorted.length - 1) {
                const nextOrder = sorted[index + 1]?.order ?? 0
                const currOrder = sorted[index]?.order ?? 0
                const nextCat = state.categories.find(c => c?.id === sorted[index + 1]?.id)
                const currCat = state.categories.find(c => c?.id === id)
                if (nextCat && currCat) {
                    nextCat.order = currOrder
                    currCat.order = nextOrder
                }
            }
        },
        setCategories: (state, action) => {
            state.categories = Array.isArray(action.payload) ? action.payload : []
        },
    },
})

export const {
    hydrateCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
    setCategories,
} = categorySlice.actions

export default categorySlice.reducer
