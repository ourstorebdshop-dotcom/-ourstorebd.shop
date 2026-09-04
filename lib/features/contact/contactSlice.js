import { createSlice } from '@reduxjs/toolkit'

export const defaultMessages = [
    {
        id: 'msg_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir.ahmed@gmail.com',
        phone: '01712345678',
        subject: 'Order Inquiry',
        message: 'Hello, I ordered a wireless smartwatch yesterday (Order #ORD-8492). Could you please confirm if it has been dispatched via courier in Dhaka?',
        status: 'NEW',
        adminNote: 'Checked Steed courier tracking, package picked up this morning.',
        replyText: '',
        repliedAt: null,
        createdAt: '2026-08-28T10:30:00.000Z',
    },
    {
        id: 'msg_2',
        name: 'Sadia Sultana',
        email: 'sadia.sultana@yahoo.com',
        phone: '01898765432',
        subject: 'Product Question',
        message: 'Is the RGB Gaming Mouse compatible with MacBook Air M2 without any special driver installation?',
        status: 'REPLIED',
        adminNote: 'Replied that it is plug and play via USB / Type-C converter.',
        replyText: 'Dear Sadia, yes! It works seamlessly via plug-and-play on MacOS without needing any additional drivers.',
        repliedAt: '2026-08-28T14:20:00.000Z',
        createdAt: '2026-08-27T16:15:00.000Z',
    },
    {
        id: 'msg_3',
        name: 'Mahmudul Hasan',
        email: 'mahmud.tech@outlook.com',
        phone: '01911223344',
        subject: 'Warranty & Return',
        message: 'I received the Bluetooth speaker in Chittagong. One channel seems to have low volume. How can I claim the 7-day easy replacement policy?',
        status: 'RESOLVED',
        adminNote: 'Arranged reverse pickup with RedX and sent replacement parcel.',
        replyText: 'Replacement parcel dispatched. Tracking code provided via SMS.',
        repliedAt: '2026-08-26T11:00:00.000Z',
        createdAt: '2026-08-25T09:45:00.000Z',
    },
    {
        id: 'msg_4',
        name: 'Farzana Ritu',
        email: 'ritu.farzana@gmail.com',
        phone: '01655667788',
        subject: 'Corporate & Bulk Order',
        message: 'We are looking to buy 50 units of smart fitness bands for our corporate employees gift hamper. Do you offer corporate bulk discounts and VAT invoices?',
        status: 'NEW',
        adminNote: 'Need to prepare corporate discount quotation.',
        replyText: '',
        repliedAt: null,
        createdAt: '2026-08-29T08:15:00.000Z',
    }
]

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
        messages: defaultMessages,
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

        // Reset to initial demo data
        resetMessages: (state) => {
            state.messages = defaultMessages.map(m => ({ ...m }))
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
