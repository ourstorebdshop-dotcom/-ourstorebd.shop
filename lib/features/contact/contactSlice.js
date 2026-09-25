import { createSlice } from '@reduxjs/toolkit'

export const defaultStoreInfo = {
    phone: '+880 1712-345678',
    whatsapp: '+880 1712-345678',
    email: 'ourstorebd.shop@gmail.com',
    supportEmail: 'support@ourstorebd.shop',
    address: 'House #42, Road #11, Block-D, Dhanmondi, Dhaka-1209, Bangladesh',
    businessHours: 'Sat – Thu: 9:00 AM – 10:00 PM (Friday: 2:00 PM – 10:00 PM)',
    googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14608.036944850388!2d90.3758!3d23.7465!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhanmondi%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd',
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    announcement: 'Customer satisfaction is our highest priority. We deliver to all 64 districts in Bangladesh.'
}

const contactSlice = createSlice({
    name: 'contact',
    initialState: {
        messages: [],
        storeInfo: defaultStoreInfo,
    },
    reducers: {
        // Hydrate from localStorage
        hydrateContact: (state, action) => {
            if (action.payload) {
                if (Array.isArray(action.payload.messages)) {
                    state.messages = action.payload.messages
                }
                if (action.payload.storeInfo && typeof action.payload.storeInfo === 'object') {
                    state.storeInfo = { ...state.storeInfo, ...action.payload.storeInfo }
                }
            }
        },

        // Customer submits a new message
        submitMessage: (state, action) => {
            const newMessage = {
                id: `msg_${Date.now()}`,
                name: action.payload.name || 'Anonymous',
                email: action.payload.email || '',
                phone: action.payload.phone || '',
                subject: action.payload.subject || 'General Inquiry',
                message: action.payload.message || '',
                status: 'NEW',
                adminNote: '',
                replyText: '',
                repliedAt: null,
                createdAt: new Date().toISOString(),
            }
            state.messages.unshift(newMessage)
        },

        // Admin updates message status (NEW, REPLIED, RESOLVED, ARCHIVED)
        updateMessageStatus: (state, action) => {
            const { id, status } = action.payload
            const msg = state.messages.find(m => m.id === id)
            if (msg) {
                msg.status = status
            }
        },

        // Admin writes private internal note
        updateAdminNote: (state, action) => {
            const { id, note } = action.payload
            const msg = state.messages.find(m => m.id === id)
            if (msg) {
                msg.adminNote = note
            }
        },

        // Admin records sent reply
        replyMessage: (state, action) => {
            const { id, replyText } = action.payload
            const msg = state.messages.find(m => m.id === id)
            if (msg) {
                msg.replyText = replyText
                msg.repliedAt = new Date().toISOString()
                msg.status = 'REPLIED'
            }
        },

        // Admin deletes single message
        deleteMessage: (state, action) => {
            state.messages = state.messages.filter(m => m.id !== action.payload)
        },

        // Admin bulk delete
        deleteMultipleMessages: (state, action) => {
            const idsToDelete = new Set(action.payload)
            state.messages = state.messages.filter(m => !idsToDelete.has(m.id))
        },

        // Admin updates store contact info (phone, email, hours, address, etc.)
        updateStoreInfo: (state, action) => {
            state.storeInfo = {
                ...state.storeInfo,
                ...action.payload
            }
        },

        // Reset store info and clear messages
        resetMessages: (state) => {
            state.messages = []
            state.storeInfo = { ...defaultStoreInfo }
        }
    }
})

export const {
    hydrateContact,
    submitMessage,
    updateMessageStatus,
    updateAdminNote,
    replyMessage,
    deleteMessage,
    deleteMultipleMessages,
    updateStoreInfo,
    resetMessages
} = contactSlice.actions

export default contactSlice.reducer
