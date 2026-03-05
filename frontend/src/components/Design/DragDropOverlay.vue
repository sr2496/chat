<template>
    <transition name="fade">
        <div v-if="visible"
            class="absolute inset-0 z-40 bg-blue-500/20 dark:bg-blue-400/20 border-4 border-dashed border-blue-600 dark:border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none backdrop-blur-sm">
            <div class="text-center">
                <svg class="w-20 h-20 mx-auto mb-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="text-3xl font-bold text-blue-700 dark:text-blue-300">Drop to send</p>
                <p class="text-lg text-blue-600 dark:text-blue-400 mt-2">Images, videos, documents</p>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
defineProps<{
    visible: boolean;
}>();
</script>
