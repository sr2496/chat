<script setup>
import { computed, ref } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useAuthStore } from '../../stores/auth'
import UserAvatar from './UserAvatar.vue'
import AddParticipantModal from './AddParticipantModal.vue'

const props = defineProps({
    isOpen: Boolean,
    conversation: Object
})

const emit = defineEmits(['close'])
const chatStore = useChatStore()
const authStore = useAuthStore()

const fileInput = ref(null)
const showAddModal = ref(false)

const isGroup = computed(() => props.conversation?.type === 'group')

const otherUser = computed(() => {
    if (isGroup.value || !props.conversation) return null
    return chatStore.getOtherParticipant(props.conversation)
})

const displayAvatar = computed(() => {
    if (isGroup.value) return props.conversation?.display_avatar
    return otherUser.value?.avatar
})

const displayName = computed(() => {
    if (isGroup.value) return props.conversation?.name
    return otherUser.value?.name
})

const displayStatus = computed(() => {
    if (isGroup.value) return `${props.conversation?.participants.length} participants`
    return otherUser.value?.email
})

const onlineStatus = computed(() => {
    if (isGroup.value) return false
    return otherUser.value?.online
})

const participants = computed(() => props.conversation?.participants || [])

const isAdmin = (userId) => {
    if (!props.conversation?.admins) return false;
    return props.conversation.admins.some(admin =>
        (typeof admin === 'string' ? admin : admin._id) === userId
    );
}

const triggerFileInput = () => {
    if (fileInput.value) fileInput.value.click()
}

const handleAvatarChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
        await chatStore.updateGroupConversation(props.conversation._id, formData)
    } catch (error) {
        console.error('Failed to update avatar', error)
    }
}

const onAddParticipants = async (users) => {
    if (users.length === 0) return

    // Add logic here if needed, but normally backend handles array of IDs
    const formData = new FormData()
    formData.append('participants', JSON.stringify(users.map(u => u._id)))

    try {
        await chatStore.updateGroupConversation(props.conversation._id, formData)
        showAddModal.value = false
    } catch (error) {
        console.error('Failed to add participants', error)
    }
}

</script>

<template>
    <div v-if="isOpen"
        class="w-full sm:w-80 lg:w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full shrink-0">
        <!-- Header -->
        <div
            class="h-16 flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
            <button @click="$emit('close')"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <h3 class="font-semibold text-gray-800 dark:text-white">
                {{ isGroup ? 'Group Info' : 'Contact Info' }}
            </h3>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
            <!-- Profile Info -->
            <div class="p-8 flex flex-col items-center border-b border-gray-100 dark:border-gray-700">
                <div class="relative group mb-4">
                    <UserAvatar :avatar="displayAvatar" :name="displayName" size="custom"
                        class="w-32 h-32 text-4xl shadow-2xl" :is-online="onlineStatus" :show-online="!isGroup" />

                    <!-- Admin Avatar Update Overlay -->
                    <div v-if="isGroup && isAdmin(authStore.user?._id)" @click="triggerFileInput"
                        class="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10 w-32 h-32 backdrop-blur-[2px]">
                        <svg class="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span
                            class="text-[10px] font-extrabold text-white text-center px-2 uppercase tracking-wide">Change
                            Photo</span>
                    </div>
                    <input type="file" ref="fileInput" class="hidden" @change="handleAvatarChange" accept="image/*" />
                </div>

                <h2 class="text-2xl font-bold text-gray-900 dark:text-white text-center break-words w-full px-4">{{
                    displayName }}</h2>
                <p class="text-gray-500 text-sm mt-1 font-medium">{{ displayStatus }}</p>
            </div>

            <!-- Group Participants -->
            <div v-if="isGroup" class="p-4">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Participants</h4>

                <div class="space-y-4">
                    <!-- Add Participant Button -->
                    <div v-if="isAdmin(authStore.user?._id)" @click="showAddModal = true"
                        class="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <div
                            class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-md">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span class="font-semibold text-green-600 dark:text-green-400">Add Participants</span>
                    </div>

                    <!-- Existing Participants List -->
                    <div v-for="user in participants" :key="user._id"
                        class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                        <UserAvatar :avatar="user.avatar" :name="user.name" size="sm" :is-online="user.online"
                            show-online />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ user.name }}</p>
                            <p class="text-xs text-gray-500 truncate">{{ user.status || user.email }}</p>
                        </div>
                        <span v-if="isAdmin(user._id)"
                            class="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-200 dark:border-green-800">Admin</span>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="p-4 space-y-2 mt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                    class="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition font-medium">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {{ isGroup ? 'Exit Group' : 'Delete Chat' }}
                </button>
                <button
                    class="w-full text-left px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl flex items-center gap-3 transition font-medium">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Block Contact
                </button>
            </div>
        </div>

        <!-- Modals -->
        <AddParticipantModal :isOpen="showAddModal" :conversation="conversation" @close="showAddModal = false"
            @add="onAddParticipants" />
    </div>
</template>
