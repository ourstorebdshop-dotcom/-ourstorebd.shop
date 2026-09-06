import { createSlice } from '@reduxjs/toolkit'

export const defaultUsers = [
    {
        id: "user_demo_1",
        name: "Tanvir Ahmed",
        email: "customer@ourstorebd.com",
        phone: "01712345678",
        password: "password123",
        role: "CUSTOMER",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        joinedDate: "2025-01-15T10:00:00.000Z",
        addresses: [
            {
                id: "addr_1",
                label: "Home (বাসা)",
                name: "Tanvir Ahmed",
                phone: "01712345678",
                street: "House 24, Road 7, Block C, Banani",
                city: "Dhaka",
                area: "Dhaka North",
                zip: "1213",
                isDefault: true,
            },
            {
                id: "addr_2",
                label: "Office (অফিস)",
                name: "Tanvir Ahmed",
                phone: "01712345678",
                street: "Level 6, Tower 71, Gulshan Avenue",
                city: "Dhaka",
                area: "Gulshan",
                zip: "1212",
                isDefault: false,
            }
        ]
    }
]

const initialState = {
    currentUser: null,
    savedUsers: [],
    isAuthenticated: false,
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action) => {
            state.currentUser = action.payload
            state.isAuthenticated = true
        },
        logout: (state) => {
            state.currentUser = null
            state.isAuthenticated = false
        },
        register: (state, action) => {
            const newUser = action.payload
            state.savedUsers.push(newUser)
            state.currentUser = newUser
            state.isAuthenticated = true
        },
        updateProfile: (state, action) => {
            if (state.currentUser) {
                state.currentUser = { ...state.currentUser, ...action.payload }
                const index = state.savedUsers.findIndex(u => u.id === state.currentUser.id)
                if (index !== -1) {
                    state.savedUsers[index] = state.currentUser
                }
            }
        },
        addUserAddress: (state, action) => {
            if (state.currentUser) {
                if (!state.currentUser.addresses) state.currentUser.addresses = []
                if (action.payload.isDefault) {
                    state.currentUser.addresses.forEach(a => { a.isDefault = false })
                }
                state.currentUser.addresses.push(action.payload)
                const index = state.savedUsers.findIndex(u => u.id === state.currentUser.id)
                if (index !== -1) {
                    state.savedUsers[index] = state.currentUser
                }
            }
        },
        updateUserAddress: (state, action) => {
            if (state.currentUser && state.currentUser.addresses) {
                const { id, updatedData } = action.payload
                if (updatedData.isDefault) {
                    state.currentUser.addresses.forEach(a => { a.isDefault = false })
                }
                const addrIndex = state.currentUser.addresses.findIndex(a => a.id === id)
                if (addrIndex !== -1) {
                    state.currentUser.addresses[addrIndex] = { ...state.currentUser.addresses[addrIndex], ...updatedData }
                }
                const userIndex = state.savedUsers.findIndex(u => u.id === state.currentUser.id)
                if (userIndex !== -1) {
                    state.savedUsers[userIndex] = state.currentUser
                }
            }
        },
        deleteUserAddress: (state, action) => {
            if (state.currentUser && state.currentUser.addresses) {
                state.currentUser.addresses = state.currentUser.addresses.filter(a => a.id !== action.payload)
                const userIndex = state.savedUsers.findIndex(u => u.id === state.currentUser.id)
                if (userIndex !== -1) {
                    state.savedUsers[userIndex] = state.currentUser
                }
            }
        },
        setDefaultUserAddress: (state, action) => {
            if (state.currentUser && state.currentUser.addresses) {
                state.currentUser.addresses.forEach(a => {
                    a.isDefault = a.id === action.payload
                })
                const userIndex = state.savedUsers.findIndex(u => u.id === state.currentUser.id)
                if (userIndex !== -1) {
                    state.savedUsers[userIndex] = state.currentUser
                }
            }
        },
        hydrateUser: (state, action) => {
            state.currentUser = action.payload
            state.isAuthenticated = !!action.payload
        },
        hydrateSavedUsers: (state, action) => {
            state.savedUsers = action.payload
        },
        deleteUser: (state, action) => {
            const userId = action.payload
            state.savedUsers = state.savedUsers.filter(u => u.id !== userId)
            if (typeof window !== 'undefined') {
                try {
                    const deleted = JSON.parse(localStorage.getItem('gocart_deleted_user_ids') || '[]')
                    if (!deleted.includes(userId)) {
                        deleted.push(userId)
                        localStorage.setItem('gocart_deleted_user_ids', JSON.stringify(deleted))
                    }
                    localStorage.setItem('gocart_users', JSON.stringify(state.savedUsers))
                } catch (e) { /* ignore */ }
            }
            // If the deleted user is the current user, log them out
            if (state.currentUser?.id === userId) {
                state.currentUser = null
                state.isAuthenticated = false
            }
        }
    }
})

export const {
    login,
    logout,
    register,
    updateProfile,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultUserAddress,
    hydrateUser,
    hydrateSavedUsers,
    deleteUser,
} = userSlice.actions

export default userSlice.reducer
