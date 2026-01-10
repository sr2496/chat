<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useAuthStore } from '../../stores/auth'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['close'])

const chatStore = useChatStore()
const authStore = useAuthStore()
const userSearchQuery = ref('')
const userListRef = ref(null)

const handleClose = () => {
    emit('close')
    // Reset search after animation
    setTimeout(() => {
        userSearchQuery.value = ''
    }, 300)
}

const normalize = (v = "") => v.toLowerCase().trim()

// Filter locally if we have loaded users
// But usually we rely on server search for large sets. 
// For now, let's trigger server search on input or basic local filter?
// The store has `searchUsers`. Let's use that for robustness.
let searchTimeout = null
watch(userSearchQuery, (val) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        if (val.trim()) {
            chatStore.searchUsers(val)
        } else {
            chatStore.fetchUsers(1)
        }
    }, 300)
})

const filteredUserList = computed(() => {
    // If we rely on server search, the store `users` are already filtered.
    // So current store list is what we show.
    return chatStore.users
})

const startPrivateChat = async (user) => {
    await chatStore.createOrGetConversation(user._id)
    chatStore.selectConversation(user._id) // Wait, select by ID or conversation ID? 
    // createOrGetConversation returns the conversation object.
    // selectConversation expects conversationId.
    // The previous implementation of selectConversation (in chat.js) takes convId.
    // createOrGet returns res.data which is the conv object.
    const conv = await chatStore.createOrGetConversation(user._id)
    chatStore.selectConversation(conv._id)
    handleClose()
}

const handleUserScroll = () => {
    const el = userListRef.value
    if (!el) return

    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    if (bottom && chatStore.hasMoreUsers && !chatStore.usersLoading) {
        chatStore.fetchUsers(chatStore.usersPage + 1)
    }
}

// Load users when modal opens
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        chatStore.fetchUsers(1)
    }
})
</script>

<template>
    <transition name="slide-fade">
        <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" @click="handleClose">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/50 transition-opacity"></div>

            <!-- Offcanvas Panel -->
            <div @click.stop
                class="absolute left-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col transform transition-transform duration-300">

                <!-- Header -->
                <div
                    class="bg-white dark:bg-gray-900 px-6 py-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                        <button @click="handleClose"
                            class="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">New Message</h3>
                    </div>
                </div>

                <!-- Search -->
                <div class="px-6 py-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                    <div class="relative">
                        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input v-model="userSearchQuery" type="text" placeholder="Search people..."
                            class="w-full pl-12 pr-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-base"
                            autofocus />
                    </div>
                </div>

                <!-- Scrollable User List -->
                <div ref="userListRef" class="flex-1 overflow-y-auto custom-scrollbar px-2 pb-6 min-h-0"
                    @scroll="handleUserScroll">

                    <!-- Loading Initial -->
                    <template v-if="chatStore.usersLoading && chatStore.users.length === 0">
                        <div v-for="n in 6" :key="n" class="flex items-center gap-4 p-4 animate-pulse">
                            <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div class="flex-1 space-y-3">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                        </div>
                    </template>

                    <!-- Users -->
                    <template v-else>
                        <div v-for="user in filteredUserList" :key="user._id" @click="startPrivateChat(user)"
                            class="flex items-center gap-4 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group select-none">

                            <UserAvatar :name="user.name" :avatar="user.avatar" size="md" :is-online="user.online"
                                :show-online="true" />

                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-gray-800 dark:text-gray-100 truncate">
                                    {{ user.name }}
                                </p>
                                <p class="text-xs text-gray-500">
                                    {{ user.online ? 'Online' : 'Offline' }}
                                </p>
                            </div>

                            <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition opacity-0 group-hover:opacity-100"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </div>

                        <!-- Loading More Indicator -->
                        <div v-if="chatStore.usersLoading && chatStore.users.length > 0" class="text-center py-4">
                            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500">
                            </div>
                        </div>

                        <!-- All Users Loaded Message -->
                        <div v-if="!chatStore.hasMoreUsers && chatStore.users.length > 0 && !userSearchQuery"
                            class="text-center py-4 text-gray-500 text-sm">
                            <p>All users loaded</p>
                        </div>

                        <!-- Empty State -->
                        <div v-if="filteredUserList.length === 0 && !chatStore.usersLoading"
                            class="text-center py-12 text-gray-500">
                            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p class="text-base font-medium">No users found</p>
                            <p class="text-xs mt-1">Try a different search term</p>
                        </div>
                    </template>
                </div>

            </div>
        </div>
    </transition>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: opacity 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
}

.slide-fade-enter-active>div:last-child {
    transition: transform 0.3s ease-out;
}

.slide-fade-leave-active>div:last-child {
    transition: transform 0.3s ease-in;
}

.slide-fade-enter-from>div:last-child {
    transform: translateX(-100%);
}

.slide-fade-leave-to>div:last-child {
    transform: translateX(-100%);
}
</style>
