import { defineStore } from 'pinia'
import { api } from '../utils/axios'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', () => {
    const conversations = ref([])
    const currentConversation = ref(null)
    const messages = ref([])
    const loading = ref(false)
    const error = ref(null)
    const socket = ref(null)
    const authStore = useAuthStore()

    const conversationsPage = ref(1)
    const hasMoreConversations = ref(false)
    const messagesPage = ref(1)
    const hasMoreMessages = ref(false)
    const isTyping = ref(false)
    const typingTimeout = ref(null)

    // Typing indicator from other users
    const otherUserTyping = ref(false)

    const fetchConversations = async (page = 1) => {
        if (page === 1) loading.value = true
        error.value = null
        try {
            const res = await api.get(`/chat/conversations?page=${page}&limit=20`)
            if (page === 1) {
                conversations.value = res.data.conversations
            } else {
                // Filter out duplicates to avoid key collisions and re-renders
                const newConvs = res.data.conversations.filter(c =>
                    !conversations.value.some(existing => existing._id === c._id)
                )
                conversations.value.push(...newConvs)
            }
            conversationsPage.value = res.data.currentPage
            hasMoreConversations.value = res.data.hasMore
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || 'Failed to fetch conversations'
        } finally {
            loading.value = false
        }
    }

    const fetchMessages = async (conversationId, page = 1) => {
        try {
            const res = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=50`)
            if (page === 1) {
                messages.value = res.data.messages
            } else {
                // Filter duplicates
                const newMsgs = res.data.messages.filter(m =>
                    !messages.value.some(existing => existing._id === m._id)
                )
                // Prepend older messages
                messages.value.unshift(...newMsgs)
            }
            messagesPage.value = res.data.currentPage
            hasMoreMessages.value = res.data.hasMore
            return res.data.messages.length > 0
        } catch (err) {
            console.error(err)
            return false
        }
    }

    const sendMessage = async (conversationId, content, type = 'text', replyToId = null) => {
        try {
            const payload = { conversation_id: conversationId, content, type };
            if (replyToId) payload.reply_to = replyToId;
            const res = await api.post('/chat/messages', payload)
            messages.value.push(res.data) // Optimistic update
            // Also need to update the last message in the conversation list
            const convIndex = conversations.value.findIndex(c => c._id === conversationId)
            if (convIndex !== -1) {
                conversations.value[convIndex].last_message = res.data
                // Move to top
                const conv = conversations.value.splice(convIndex, 1)[0];
                conversations.value.unshift(conv);
            }
        } catch (err) {
            console.error(err)
        }
    }

    const sendTyping = () => {
        if (!socket.value || !currentConversation.value) {
            console.warn('Cannot send typing: socket or conversation missing', { socket: !!socket.value, conv: !!currentConversation.value })
            return
        }
        console.log('Sending typing event for room:', currentConversation.value._id)
        socket.value.emit('typing', currentConversation.value._id)
    }

    const sendStopTyping = () => {
        if (!socket.value || !currentConversation.value) return
        socket.value.emit('stop_typing', currentConversation.value._id)
    }

    const initializeSocket = (user) => {
        if (socket.value) return

        socket.value = io('http://localhost:5000')

        socket.value.emit('setup', user)

        socket.value.on('connected', () => {
            console.log('Socket Connected')
        })

        socket.value.on('typing', () => {
            console.log('Received typing event')
            otherUserTyping.value = true
        })
        socket.value.on('stop_typing', () => {
            console.log('Received stop_typing event')
            otherUserTyping.value = false
        })

        socket.value.on('message_received', async (newMessage) => {
            // Prevent duplicate handling for sender
            if (newMessage.sender_id._id === authStore.user._id) return

            console.log('Message Received:', newMessage)

            // Ensure IDs are strings for comparison
            const msgConvId = String(newMessage.conversation_id)

            // Find conversation in list
            const convIndex = conversations.value.findIndex(c => String(c._id) === msgConvId)

            if (convIndex === -1) {
                // Conversation not in list, fetch it
                console.log('Conversation not found in list, fetching...')
                await fetchConversations(1)
                return
            }

            const conv = conversations.value[convIndex]

            // Check if it's the current open chat
            const isCurrentChat = currentConversation.value && String(currentConversation.value._id) === msgConvId

            if (!isCurrentChat) {
                console.log('Updating unread count for', conv.name)
                conv.unreadCount = (conv.unreadCount || 0) + 1
            } else {
                console.log('Chat open, pushing message')
                if (!messages.value.some(m => m._id === newMessage._id)) {
                    messages.value.push(newMessage)
                    markAsRead(msgConvId)
                }
            }

            // Update details
            conv.last_message = newMessage
            conv.updatedAt = new Date()

            // Reorder: Move to top if not already at 0
            if (convIndex > 0) {
                conversations.value.splice(convIndex, 1)
                conversations.value.unshift(conv)
            }
        })

        socket.value.on('message_reaction_update', ({ messageId, reactions }) => {
            const msg = messages.value.find(m => m._id === messageId);
            if (msg) {
                msg.reactions = reactions;
            }
        })

        socket.value.on('messages_read', ({ conversationId, userId }) => {
            // Updated by someone else (or me on other device)
            // If it was me, clear my unread count
            if (userId === authStore.user._id) {
                const conv = conversations.value.find(c => c._id === conversationId)
                if (conv) conv.unreadCount = 0
            }
        })
    }

    const selectConversation = async (conversationId) => {
        const conv = conversations.value.find(c => c._id === conversationId)
        if (conv) {
            currentConversation.value = conv
            messages.value = [] // Clear old messages
            otherUserTyping.value = false // Reset typing

            if (socket.value) {
                socket.value.emit('join_chat', conversationId)
            }

            // Mark as read immediately
            if (conv.unreadCount > 0) {
                markAsRead(conversationId)
            }

            await fetchMessages(conversationId)
        }
    }

    // Helper to get the other participant in a private chat
    const getOtherParticipant = (conversation) => {
        if (!conversation || !authStore.user) return null
        return conversation.participants.find(p => p._id !== authStore.user._id) || conversation.participants[0]
    }

    // New Chat Features
    const users = ref([])
    const usersPage = ref(1)
    const hasMoreUsers = ref(false)
    const usersLoading = ref(false)

    const fetchUsers = async (page = 1) => {
        if (page === 1) usersLoading.value = true
        try {
            const res = await api.get(`/users?page=${page}&limit=20`)
            if (page === 1) {
                users.value = res.data.users
            } else {
                const newUsers = res.data.users.filter(u => !users.value.some(existing => existing._id === u._id))
                users.value.push(...newUsers)
            }
            usersPage.value = res.data.currentPage
            hasMoreUsers.value = res.data.hasMore
        } catch (err) {
            console.error(err)
        } finally {
            usersLoading.value = false
        }
    }

    const searchUsers = async (query) => {
        usersLoading.value = true
        try {
            const res = await api.get(`/users?search=${query}&limit=50`)
            users.value = res.data.users
            hasMoreUsers.value = false // Disable infinite scroll for search results for simplicity
        } catch (err) {
            console.error(err)
        } finally {
            usersLoading.value = false
        }
    }

    const createOrGetConversation = async (userId) => {
        try {
            const res = await api.post('/chat/conversations', { userId })
            // Check if exists in list
            const existing = conversations.value.find(c => c._id === res.data._id)
            if (!existing) {
                conversations.value.unshift(res.data)
            }
            return res.data
        } catch (err) {
            console.error(err)
            throw err
        }
    }

    const markAsRead = async (conversationId) => {
        try {
            await api.post(`/chat/conversations/${conversationId}/read`)
            // Local update
            const conv = conversations.value.find(c => c._id === conversationId)
            if (conv) conv.unreadCount = 0
        } catch (err) {
            console.error(err)
        }
    }

    const createGroupConversation = async (name, participantIds, avatarFile) => {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('participants', JSON.stringify(participantIds));
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const res = await api.post('/chat/groups', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            conversations.value.unshift(res.data);
            return res.data;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    const updateGroupConversation = async (id, formData) => {
        try {
            const res = await api.put(`/chat/groups/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    // Alias for compatibility
    const loadUsers = (reset = false) => fetchUsers(reset ? 1 : usersPage.value);
    const loadMoreUsers = () => {
        if (hasMoreUsers.value && !usersLoading.value) {
            fetchUsers(usersPage.value + 1);
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        console.log('Toggling reaction', messageId, emoji);
        try {
            const res = await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
            const msg = messages.value.find(m => m._id === messageId);
            if (msg) {
                msg.reactions = res.data.reactions;
            }
        } catch (e) {
            console.error(e);
        }
    }

    return {
        conversations,
        currentConversation,
        messages,
        conversationsPage,
        hasMoreConversations,
        messagesPage,
        hasMoreMessages,
        otherUserTyping,
        sendTyping,
        sendStopTyping,
        loading,
        error,
        socket,
        initializeSocket,
        fetchConversations,
        fetchMessages,
        sendMessage,
        selectConversation,
        getOtherParticipant,
        // Users for New Chat
        fetchUsers,
        searchUsers,
        users,
        usersPage,
        hasMoreUsers,
        usersPagination: computed(() => ({ hasMore: hasMoreUsers.value, loading: usersLoading.value })),
        usersLoading,
        createOrGetConversation,
        markAsRead,
        createGroupConversation,
        loadUsers,
        loadMoreUsers,
        toggleReaction,
        updateGroupConversation
    }
})
