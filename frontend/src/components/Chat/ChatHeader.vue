<template>

    <div
        class="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 shadow-sm">
        <div class="flex items-center gap-3">

            <!-- Back Button for Mobile -->
            <button v-if="isMobileView" @click="$emit('back')"
                class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <!-- Avatar -->
            <div class="relative flex-shrink-0">
                <div
                    class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {{ activeConversation.initials }}
                </div>
            </div>

            <!-- Conversation Info -->
            <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {{ activeConversation.name }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span v-if="isGroup">{{ activeConversation.users.length }} members</span>
                    <span v-else class="flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full" :class="isOnline ? 'bg-green-500' : 'bg-gray-400'" />
                        {{ isOnline ? 'Online' : 'Offline' }}
                    </span>
                </p>

                <TypingIndicator v-if="typingText" :typingText="typingText" />
            </div>

        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useChatStore } from '../../stores/chat';
import { useUserStore } from '../../stores/user';

import TypingIndicator from './TypingIndicator.vue';

export default defineComponent({
    components: { TypingIndicator },
    setup() {
        const chatStore = useChatStore();
        const userStore = useUserStore();

        const isMobileView = ref(window.innerWidth < 768);

        const activeConversation = computed(() => {
            const convId = chatStore.activeConversationId;
            return convId
                ? chatStore.conversations.find(c => c.id === convId) || null
                : null;
        });

        const typingText = computed(() => chatStore.typingText(chatStore.activeConversationId || null));
        const otherUser = computed(() => activeConversation.value ? chatStore.getOtherUser(activeConversation.value) : null);
        const isOnline = computed(() => otherUser.value && userStore.isUserOnline(otherUser.value.id))
        const isGroup = computed(() => activeConversation.value.type === 'group');

        return {
            activeConversation,
            isMobileView,
            isOnline,
            isGroup,
            typingText
        };
    }
});
</script>