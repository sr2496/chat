<script setup>
import { ref } from 'vue'
import ChatList from './ChatList.vue'
import ChatWindow from './ChatWindow.vue'
import { useChatStore } from '../../stores/chat'

const chatStore = useChatStore()
</script>

<template>
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <!-- Sidebar -->
        <div
            class="w-full sm:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full bg-white dark:bg-gray-800">
            <ChatList />
        </div>

        <!-- Main Area -->
        <div class="hidden sm:flex flex-1 flex-col h-full relative bg-gray-50 dark:bg-gray-900">
            <!-- Empty State -->
            <div v-if="!chatStore.currentConversation" class="flex-1 flex items-center justify-center">
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

            <!-- Chat Window Placeholder -->
            <div v-else class="flex-1 overflow-hidden">
                <ChatWindow />
            </div>
        </div>
    </div>
</template>
