import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    // Conversation list (admin sees all, customer sees their own)
    conversations: [],
    // Currently active/open conversation ID
    activeConversationId: null,
    // Messages keyed by conversation ID: { [convId]: Message[] }
    messages: {},
    // Total unread count for admin badge
    adminUnreadCount: 0,
    // Unread count for customer badge
    customerUnreadCount: 0,
    // Chat widget open state
    isWidgetOpen: false,
    // Customer's own conversation ID (if exists)
    customerConversationId: null,
    // Loading / error states
    status: 'idle', // 'idle' | 'loading' | 'error'
    error: null,
    // Real-time connection status
    connectionStatus: 'disconnected', // 'connected' | 'reconnecting' | 'disconnected'
}

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // ===== Widget State =====
        toggleWidget: (state) => {
            state.isWidgetOpen = !state.isWidgetOpen
        },
        setWidgetOpen: (state, action) => {
            state.isWidgetOpen = action.payload
        },

        // ===== Conversations =====
        setConversations: (state, action) => {
            state.conversations = action.payload
            // Recalculate admin unread
            state.adminUnreadCount = action.payload.reduce(
                (sum, c) => sum + (c.adminUnread || 0), 0
            )
        },
        addConversation: (state, action) => {
            const exists = state.conversations.find(c => c.id === action.payload.id)
            if (!exists) {
                state.conversations.unshift(action.payload)
            }
        },
        updateConversation: (state, action) => {
            const { id, ...updates } = action.payload
            const idx = state.conversations.findIndex(c => c.id === id)
            if (idx !== -1) {
                state.conversations[idx] = { ...state.conversations[idx], ...updates }
            }
            // Recalculate admin unread
            state.adminUnreadCount = state.conversations.reduce(
                (sum, c) => sum + (c.adminUnread || 0), 0
            )
        },
        removeConversation: (state, action) => {
            const convId = action.payload
            state.conversations = state.conversations.filter(c => c.id !== convId)
            delete state.messages[convId]
            if (state.activeConversationId === convId) {
                state.activeConversationId = null
            }
            if (state.customerConversationId === convId) {
                state.customerConversationId = null
                state.customerUnreadCount = 0
            }
            state.adminUnreadCount = state.conversations.reduce(
                (sum, c) => sum + (c.adminUnread || 0), 0
            )
        },
        setActiveConversation: (state, action) => {
            state.activeConversationId = action.payload
        },
        setCustomerConversationId: (state, action) => {
            state.customerConversationId = action.payload
        },

        // ===== Messages =====
        setMessages: (state, action) => {
            const { conversationId, messages } = action.payload
            state.messages[conversationId] = messages
        },
        addMessage: (state, action) => {
            const { conversationId, message } = action.payload
            if (!state.messages[conversationId]) {
                state.messages[conversationId] = []
            }
            // Prevent duplicates
            const exists = state.messages[conversationId].find(m => m.id === message.id)
            if (!exists) {
                state.messages[conversationId].push(message)
                // Sort by createdAt
                state.messages[conversationId].sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                )
            }
        },
        prependMessages: (state, action) => {
            const { conversationId, messages } = action.payload
            if (!state.messages[conversationId]) {
                state.messages[conversationId] = []
            }
            const existingIds = new Set(state.messages[conversationId].map(m => m.id))
            const newMsgs = messages.filter(m => !existingIds.has(m.id))
            state.messages[conversationId] = [...newMsgs, ...state.messages[conversationId]]
            state.messages[conversationId].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            )
        },
        // Update a message in-place (e.g. mark as sent, update isRead)
        updateMessage: (state, action) => {
            const { conversationId, messageId, updates } = action.payload
            const msgs = state.messages[conversationId]
            if (msgs) {
                const idx = msgs.findIndex(m => m.id === messageId)
                if (idx !== -1) {
                    msgs[idx] = { ...msgs[idx], ...updates }
                }
            }
        },

        removeMessage: (state, action) => {
            const { conversationId, messageId } = action.payload
            if (state.messages[conversationId]) {
                state.messages[conversationId] = state.messages[conversationId].filter(
                    m => m.id !== messageId
                )
            }
        },

        // ===== Unread Counts =====
        setAdminUnreadCount: (state, action) => {
            state.adminUnreadCount = action.payload
        },
        setCustomerUnreadCount: (state, action) => {
            state.customerUnreadCount = action.payload
        },

        // ===== Status =====
        setChatStatus: (state, action) => {
            state.status = action.payload
        },
        setChatError: (state, action) => {
            state.error = action.payload
            state.status = 'error'
        },
        setConnectionStatus: (state, action) => {
            state.connectionStatus = action.payload
        },

        // ===== Reset =====
        resetChat: () => initialState,
    }
})

export const {
    toggleWidget,
    setWidgetOpen,
    setConversations,
    addConversation,
    updateConversation,
    removeConversation,
    setActiveConversation,
    setCustomerConversationId,
    setMessages,
    addMessage,
    prependMessages,
    updateMessage,
    removeMessage,
    setAdminUnreadCount,
    setCustomerUnreadCount,
    setChatStatus,
    setChatError,
    setConnectionStatus,
    resetChat,
} = chatSlice.actions

export default chatSlice.reducer
