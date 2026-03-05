<template>
    <teleport to="body">
        <transition name="reaction-fly">
            <div v-if="messageId" class="fixed z-50 pointer-events-none"
                :style="{ top: position.top + 'px', left: position.left + 'px' }">
                <div data-reaction-menu="true"
                    class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-2.5 border border-gray-200 dark:border-gray-700 flex items-center gap-2 pointer-events-auto">
                    <button v-for="emoji in emojis" :key="emoji" @click="$emit('react', messageId, emoji)"
                        class="text-2xl hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-all duration-150 text-gray-800 dark:text-gray-100">
                        {{ emoji }}
                    </button>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<script setup lang="ts">
defineProps<{
    messageId: number | null;
    position: { top: number; left: number };
}>();

defineEmits<{
    react: [messageId: number, emoji: string];
}>();

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
</script>

<style scoped>
.reaction-fly-enter-active {
    transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.1);
}

.reaction-fly-leave-active {
    transition: all 0.15s ease-in;
}

.reaction-fly-enter-from {
    opacity: 0;
    transform: scale(0.6) translateY(20px);
}

.reaction-fly-enter-to {
    opacity: 1;
    transform: scale(1) translateY(0);
}

.reaction-fly-leave-to {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
}
</style>
