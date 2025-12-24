<template>
    <div class="flex items-center gap-1 mt-2">
        <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
        <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-150"></span>
        <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-300"></span>
        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">{{ typingText }}</span>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    props: {
        typingText: { type: String, default: 'Typing...' }
    }
});
</script>
