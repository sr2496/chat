<template>
    <teleport to="body">
        <transition name="fade-scale">
            <div v-if="menu" class="fixed z-50" :style="{ top: menu.y + 'px', left: menu.x + 'px' }" @click.stop
                @contextmenu.prevent>
                <div data-context-menu="true"
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] overflow-hidden backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 text-gray-800 dark:text-gray-100">
                    <!-- Reply -->
                    <button @click="$emit('reply', menu.message)" class="menu-item">
                        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>Reply</span>
                    </button>

                    <!-- Copy Text -->
                    <button v-if="!menu.message.type || menu.message.type === 'text'" @click="copyText"
                        class="menu-item">
                        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy Text</span>
                    </button>

                    <hr class="my-1 border-gray-200 dark:border-gray-700" />

                    <!-- Delete -->
                    <button v-if="isOwn" @click="$emit('delete', menu.message.id)" class="menu-item text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2.227 2.227 0 0116.138 21H7.862a2.227 2.227 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Message</span>
                    </button>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<script setup lang="ts">
import type { Message } from '../../types/chat';

const props = defineProps<{
    menu: { message: Message; x: number; y: number } | null;
    isOwn: boolean;
}>();

const emit = defineEmits<{
    reply: [message: Message];
    delete: [messageId: number];
    close: [];
}>();

const copyText = () => {
    if (props.menu?.message.message) {
        navigator.clipboard.writeText(props.menu.message.message);
    }
    emit('close');
};
</script>

<style scoped>
@reference "tailwindcss";
.menu-item {
    @apply w-full px-5 py-3.5 text-left text-sm font-medium flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150;
}
</style>
