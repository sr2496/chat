<script setup>
import { ref, computed, watch } from 'vue'
import { useChatStore } from '../../stores/chat'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
    isOpen: Boolean,
    conversation: Object
})

const emit = defineEmits(['close', 'add'])
const chatStore = useChatStore()
const searchQuery = ref('')
const selectedUsers = ref([])
const isLoading = ref(false)

// Reset when opened
watch(() => props.isOpen, (val) => {
    if (val) {
        searchQuery.value = ''
        selectedUsers.value = []
        chatStore.users = [] // Clear previous results
    }
})

const existingParticipantIds = computed(() => {
    return props.conversation?.participants?.map(p => p._id) || []
})

const searchResults = computed(() => {
    // Filter out users already in the group
    return chatStore.users.filter(u => !existingParticipantIds.value.includes(u._id))
})

let searchTimeout = null
const handleSearch = () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    if (!searchQuery.value.trim()) {
        chatStore.users = []
        return
    }

    isLoading.value = true
    searchTimeout = setTimeout(async () => {
        await chatStore.searchUsers(searchQuery.value)
        isLoading.value = false
    }, 300)
}

const toggleUser = (user) => {
    const idx = selectedUsers.value.findIndex(u => u._id === user._id)
    if (idx === -1) selectedUsers.value.push(user)
    else selectedUsers.value.splice(idx, 1)
}

const isSelected = (user) => selectedUsers.value.some(u => u._id === user._id)

const handleAdd = () => {
    if (selectedUsers.value.length === 0) return
    emit('add', selectedUsers.value)
}

</script>

<template>
    <transition name="fade">
        <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>

            <div
                class="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden transform transition-all">
                <!-- Header -->
                <div
                    class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Add Participants</h3>
                    <button @click="$emit('close')"
                        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Search -->
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div class="relative">
                        <input v-model="searchQuery" @input="handleSearch" type="text"
                            placeholder="Search name or email" autofocus
                            class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <!-- Chips for selected -->
                    <div v-if="selectedUsers.length > 0" class="flex flex-wrap gap-2 mt-3 max-h-24 overflow-y-auto">
                        <div v-for="user in selectedUsers" :key="user._id"
                            class="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                            <span>{{ user.name }}</span>
                            <button @click="toggleUser(user)" class="hover:text-blue-900 dark:hover:text-blue-100">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- List -->
                <div class="flex-1 overflow-y-auto custom-scrollbar p-2 bg-white dark:bg-gray-900">
                    <div v-if="isLoading" class="flex justify-center py-8 text-gray-400">
                        <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                    </div>
                    <div v-else-if="searchQuery && searchResults.length === 0" class="text-center py-8 text-gray-500">
                        No users found
                    </div>
                    <div v-else-if="!searchQuery" class="text-center py-10 text-gray-400 text-sm">
                        Type to search for people to add
                    </div>
                    <div v-else class="space-y-1">
                        <div v-for="user in searchResults" :key="user._id" @click="toggleUser(user)"
                            class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:bg-gray-100 dark:hover:bg-gray-800"
                            :class="{ 'bg-blue-50 dark:bg-blue-900/20': isSelected(user) }">

                            <div class="relative">
                                <UserAvatar :name="user.name" :avatar="user.avatar" size="md" />
                                <div v-if="isSelected(user)"
                                    class="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white dark:border-gray-900">
                                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-gray-900 dark:text-white truncate">{{ user.name }}</h4>
                                <p class="text-sm text-gray-500 truncate">{{ user.email }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                    <button @click="$emit('close')"
                        class="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition">
                        Cancel
                    </button>
                    <button @click="handleAdd" :disabled="selectedUsers.length === 0"
                        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition transform active:scale-95">
                        Add {{ selectedUsers.length ? `(${selectedUsers.length})` : '' }}
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
