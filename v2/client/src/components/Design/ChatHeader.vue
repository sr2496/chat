<template>
    <div
        class="bg-white dark:bg-gray-900 shadow-sm px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 h-16">
        <div class="flex items-center gap-3">
            <button @click="$emit('back')"
                class="sm:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <!-- Avatar -->
            <UserAvatar @click="$emit('show-info')" :name="displayName" :avatar="displayAvatar" size="md"
                :show-online="activeConversation?.type === 'private' && isOnline" class="cursor-pointer" />

            <!-- Name + Status -->
            <div @click="$emit('show-info')" class="flex flex-col cursor-pointer">
                <h2 class="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    {{ displayName }}
                </h2>

                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span v-if="isTyping" class="italic text-blue-500">{{ typingText }}</span>
                    <span v-else-if="activeConversation?.type === 'private'">
                        <span v-if="isOnline" class="text-green-600 dark:text-green-400 font-medium">Online</span>
                        <span v-else>Offline</span>
                    </span>
                    <span v-else>
                        {{ activeConversation?.participants?.length || 0 }} members
                    </span>
                </p>
            </div>
        </div>

        <!-- Actions (Simplified) -->
        <div class="flex items-center gap-2">
            <button class="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
            <button @click="$emit('show-info')"
                class="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useChatStore } from "../../stores/chat";
import { useAuthStore } from "../../stores/auth";
import UserAvatar from "./UserAvatar.vue";

const chatStore = useChatStore();
const authStore = useAuthStore();

const activeConversation = computed(() => chatStore.currentConversation);

const isTyping = computed(() => {
    return chatStore.typingText && chatStore.typingText.length > 0;
});

const typingText = computed(() => chatStore.typingText);

const otherUser = computed(() => {
    if (!activeConversation.value || activeConversation.value.type === 'group' || !activeConversation.value.participants) return null;
    return activeConversation.value.participants.find(p => p._id !== authStore.user._id);
});

const displayName = computed(() => {
    if (!activeConversation.value) return "Chat";
    if (activeConversation.value.type === 'group') return activeConversation.value.name || "Group Chat";
    return otherUser.value?.name || "Unknown User";
});

const displayAvatar = computed(() => {
    if (!activeConversation.value) return null;
    if (activeConversation.value.type === 'group') return activeConversation.value.display_avatar; // Or group avatar field if different
    return otherUser.value?.avatar;
});

const isOnline = computed(() => {
    return otherUser.value?.online;
});

defineEmits(['back', 'show-info']);
</script>
