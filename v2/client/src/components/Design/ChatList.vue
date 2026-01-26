<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useChatStore } from '../../stores/chat'
import UserAvatar from './UserAvatar.vue'
import NewChatModal from './NewChatModal.vue'
import CreateGroupModal from './CreateGroupModal.vue'
import { requestNotificationPermission, registerPushSubscription } from '../../utils/pushManager'

const authStore = useAuthStore()
const chatStore = useChatStore()
const searchQuery = ref('')
const isNewChatOpen = ref(false)
const isCreateGroupOpen = ref(false)
const showNotificationButton = ref(false)

const enableNotifications = async () => {
    try {
        await requestNotificationPermission()
        await registerPushSubscription()
        showNotificationButton.value = false
    } catch (e) {
        console.error(e)
    }
}


const getDisplayName = (conv) => {
    if (conv.type === 'group') return conv.name
    const other = chatStore.getOtherParticipant(conv)
    return other ? other.name : 'Unknown User'
}

const getDisplayAvatar = (conv) => {
    if (conv.type === 'group') return conv.display_avatar
    const other = chatStore.getOtherParticipant(conv)
    return other ? other.avatar : null
}

const getIsOnline = (conv) => {
    if (conv.type === 'group') return false
    const other = chatStore.getOtherParticipant(conv)
    return other ? other.online : false
}

const getLastMessage = (conv) => {
    if (!conv.last_message) return 'No messages yet'
    // Depending on message type, show text or 'Sent an attachment'
    if (conv.last_message.type === 'text') return conv.last_message.content
    return `Sent a ${conv.last_message.type}`
}

const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const filteredConversations = computed(() => {
    if (!searchQuery.value) return chatStore.conversations
    return chatStore.conversations.filter(conv =>
        getDisplayName(conv).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

const loadMoreTrigger = ref(null)
const isLoadingMore = ref(false)

const selectChat = (conv) => {
    chatStore.selectConversation(conv._id)
}

const observer = new IntersectionObserver(async (entries) => {
    if (entries[0].isIntersecting && chatStore.hasMoreConversations && !chatStore.loading && !isLoadingMore.value) {
        isLoadingMore.value = true
        await chatStore.fetchConversations(chatStore.conversationsPage + 1)
        isLoadingMore.value = false
    }
}, { threshold: 0.1 }) // Lower threshold to trigger earlier

onMounted(async () => {
    if (authStore.user) {
        chatStore.initializeSocket(authStore.user)
    }

    if ('Notification' in window && Notification.permission === 'default') {
        showNotificationButton.value = true
    } else if ('Notification' in window && Notification.permission === 'granted') {
        // Maybe ensure subscription exists? But that's handled by app logic or we assume it's good
    }

    // Initial fetch
    await chatStore.fetchConversations()

    // Set up observer after initial fetch
    nextTick(() => {
        if (loadMoreTrigger.value) observer.observe(loadMoreTrigger.value)
    })
})

watch(loadMoreTrigger, (el) => {
    if (el) observer.observe(el)
    else observer.disconnect()
})
</script>

<template>
    <div class="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <!-- Desktop Header (V1 Style) -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Chats</h2>
                    <button v-if="showNotificationButton" @click="enableNotifications" title="Enable Notifications"
                        class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 border border-blue-200 dark:border-blue-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                </div>

                <div class="flex items-center gap-2">
                    <!-- New Chat Button (Blue Gradient) -->
                    <button @click="isNewChatOpen = true"
                        class="hidden sm:flex px-3 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 items-center gap-2 font-medium text-xs hover:-translate-y-0.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>New Chat</span>
                    </button>
                    <!-- Mobile New Chat -->
                    <button @click="isNewChatOpen = true"
                        class="sm:hidden p-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>

                    <!-- New Group Button (Green Gradient) -->
                    <button @click="isCreateGroupOpen = true"
                        class="hidden sm:flex px-3 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200 items-center gap-2 font-medium text-xs hover:-translate-y-0.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>New Group</span>
                    </button>
                    <!-- Mobile New Group -->
                    <button @click="isCreateGroupOpen = true"
                        class="sm:hidden p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    <NewChatModal :isOpen="isNewChatOpen" @close="isNewChatOpen = false" />
                    <CreateGroupModal :isOpen="isCreateGroupOpen" @close="isCreateGroupOpen = false" />
                </div>
            </div>

            <!-- Search -->
            <div class="relative">
                <input v-model="searchQuery" type="text" placeholder="Search chats..."
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-colors shadow-inner" />
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-50 dark:bg-gray-800/50">
            <!-- Loading State -->
            <div v-if="chatStore.loading" class="flex flex-col items-center justify-center py-10 text-gray-400">
                <div class="space-y-4 w-full px-4">
                    <div v-for="n in 5" :key="n" class="flex items-center gap-4 animate-pulse">
                        <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div class="flex-1 space-y-2">
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredConversations.length === 0"
                class="flex flex-col items-center justify-center h-full text-center p-4 text-gray-400">
                <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="font-medium">No chats found</p>
                <p class="text-xs mt-2 opacity-70">Start a new chat to see it here</p>
            </div>

            <!-- Conversation Items -->
            <div v-else class="p-2 space-y-1">
                <div v-for="conv in filteredConversations" :key="conv._id"
                    class="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/80 transition-colors group"
                    :class="{ 'bg-blue-500/10 ring-1 ring-blue-500/30': chatStore.currentConversation?._id === conv._id }"
                    @click="selectChat(conv)">
                    <UserAvatar :name="getDisplayName(conv)" :avatar="getDisplayAvatar(conv)"
                        :is-online="getIsOnline(conv)" :show-online="conv.type === 'private'" size="lg" />

                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center mb-1">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">{{
                                getDisplayName(conv) }}</h3>
                            <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{{
                                formatTime(conv.last_message?.createdAt || conv.updatedAt) }}</span>
                        </div>
                        <div class="flex justify-between items-center mt-0.5">
                            <p
                                class="text-sm text-gray-500 dark:text-gray-400 truncate pr-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                {{ getLastMessage(conv) }}
                            </p>
                            <span v-if="conv.unreadCount > 0"
                                class="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded-full min-w-[20px] text-center shadow-sm">
                                {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Infinite Scroll Trigger -->
                <div v-if="chatStore.hasMoreConversations" ref="loadMoreTrigger"
                    class="h-10 flex items-center justify-center">
                    <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- User Profile Strip -->
        <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <UserAvatar :name="authStore.user?.name || 'Me'" :avatar="authStore.user?.avatar" size="md" />
            <div class="flex-1 overflow-hidden">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ authStore.user?.name }}</p>
                <button @click="authStore.logout" class="text-xs text-red-500 hover:underline">Logout</button>
            </div>
        </div>
    </div>
</template>
