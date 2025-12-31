<template>
    <teleport to="body">
        <transition-group name="notification-slide" tag="div"
            class="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
            <div v-for="notification in notifications" :key="notification.id" @click="handleClick(notification)"
                @mouseenter="pauseAutoDismiss(notification.id)" @mouseleave="resumeAutoDismiss(notification.id)"
                class="pointer-events-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80 cursor-pointer hover:shadow-xl transition-all hover:scale-105">
                <div class="flex items-start gap-3">
                    <!-- Avatar -->
                    <UserAvatar :avatar="notification.avatar" :is-online="notification.isOnline" :show-online="true"
                        size="md" />

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                {{ notification.senderName }}
                            </p>
                            <button @click.stop="dismiss(notification.id)"
                                class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {{ notification.message }}
                        </p>

                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {{ notification.conversationName }}
                        </p>
                    </div>
                </div>
            </div>
        </transition-group>
    </teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import UserAvatar from './UserAvatar.vue';

export interface Notification {
    id: string;
    conversationId: number;
    senderName: string;
    avatar: string | null;
    isOnline: boolean;
    message: string;
    conversationName: string;
}

const emit = defineEmits<{
    (e: 'click', conversationId: number): void;
}>();

const notifications = ref<Notification[]>([]);
const autoDismissTimers = new Map<string, number>();
const pausedNotifications = new Set<string>();

const show = (notification: Notification) => {
    // Add to list
    notifications.value.push(notification);

    // Auto-dismiss after 4 seconds
    startAutoDismiss(notification.id);

    // Limit to 3 notifications max
    if (notifications.value.length > 3) {
        const oldest = notifications.value[0];
        if (oldest) {
            dismiss(oldest.id);
        }
    }
};

const dismiss = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications.value.splice(index, 1);
    }

    // Clear timer
    const timer = autoDismissTimers.get(id);
    if (timer) {
        window.clearTimeout(timer);
        autoDismissTimers.delete(id);
    }
    pausedNotifications.delete(id);
};

const startAutoDismiss = (id: string) => {
    const timer = window.setTimeout(() => {
        if (!pausedNotifications.has(id)) {
            dismiss(id);
        }
    }, 4000);

    autoDismissTimers.set(id, timer);
};

const pauseAutoDismiss = (id: string) => {
    pausedNotifications.add(id);
};

const resumeAutoDismiss = (id: string) => {
    pausedNotifications.delete(id);

    // Restart the timer
    const timer = autoDismissTimers.get(id);
    if (timer) {
        window.clearTimeout(timer);
    }
    startAutoDismiss(id);
};

const handleClick = (notification: Notification) => {
    emit('click', notification.conversationId);
    dismiss(notification.id);
};

// Cleanup on unmount
onUnmounted(() => {
    autoDismissTimers.forEach(timer => window.clearTimeout(timer));
    autoDismissTimers.clear();
});

// Expose show method
defineExpose({
    show,
    dismiss,
});
</script>

<style scoped>
.notification-slide-enter-active,
.notification-slide-leave-active {
    transition: all 0.3s ease;
}

.notification-slide-enter-from {
    opacity: 0;
    transform: translateX(100px);
}

.notification-slide-leave-to {
    opacity: 0;
    transform: translateX(100px) scale(0.8);
}

.notification-slide-move {
    transition: transform 0.3s ease;
}
</style>
