<template>
    <teleport to="body">
        <transition name="fade">
            <button v-if="visible" @click="$emit('click')"
                class="fixed bottom-24 right-6 z-50 w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>

                <span v-if="unreadCount > 0"
                    class="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[18px] text-center">
                    {{ unreadCount }}
                </span>
            </button>
        </transition>
    </teleport>
</template>

<script setup lang="ts">
defineProps<{
    visible: boolean;
    unreadCount: number;
}>();

defineEmits<{
    click: [];
}>();
</script>
