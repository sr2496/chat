<script setup>
import { ref, watch } from 'vue'
import ChatList from './ChatList.vue'
import ChatWindow from './ChatWindow.vue'
import ActionDashboard from '../../views/ActionDashboard.vue'
import NotificationToast from './NotificationToast.vue'
import { useChatStore } from '../../stores/chat'

const chatStore = useChatStore()
const notificationToastRef = ref(null)

watch(() => chatStore.pendingNotification, (newVal) => {
    if (newVal && notificationToastRef.value) {
        notificationToastRef.value.show(newVal)
        chatStore.pendingNotification = null // Reset
    }
})

const handleNotificationClick = (conversationId) => {
    chatStore.selectConversation(conversationId)
}
</script>

<template>
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <!-- Sidebar -->
        <div
            class="w-full sm:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full bg-white dark:bg-gray-800">
            <!-- Navigation -->
            <div class="flex items-center justify-around p-2 border-b border-gray-100 dark:border-gray-700">
                <router-link to="/" class="flex-1 text-center py-2 rounded-lg text-sm font-medium transition"
                    :class="$route.path === '/' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'">
                    Chats
                </router-link>
                <router-link to="/actions" class="flex-1 text-center py-2 rounded-lg text-sm font-medium transition"
                    :class="$route.path === '/actions' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'">
                    Actions
                </router-link>
            </div>

            <ChatList v-if="$route.path === '/'" />
        </div>

        <!-- Main Area -->
        <div class="hidden sm:flex flex-1 flex-col h-full relative bg-gray-50 dark:bg-gray-900">
            <!-- Action Dashboard -->
            <div v-if="$route.path === '/actions'" class="flex-1 overflow-hidden">
                <ActionDashboard />
            </div>

            <!-- Empty State -->
            <div v-else-if="!chatStore.currentConversation" class="flex-1 flex items-center justify-center">
                <div class="text-center px-4">
                    <div
                        class="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Select a Conversation</h3>
                    <p class="text-gray-500">Choose a chat from the left to start messaging</p>
                </div>
            </div>

            <!-- Chat Window -->
            <div v-else class="flex-1 overflow-hidden">
                <ChatWindow />
            </div>
        </div>
    </div>

    <NotificationToast ref="notificationToastRef" @click="handleNotificationClick" />
</template>
