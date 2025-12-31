<template>
    <teleport to="body">
        <transition name="slide-down">
            <div v-if="isVisible"
                class="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
                <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <!-- Icon & Message -->
                    <div class="flex items-center gap-3 flex-1">
                        <svg class="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <div>
                            <p class="font-semibold text-lg">Stay Updated!</p>
                            <p class="text-sm text-blue-100">
                                Enable notifications to never miss a message, even when the app is closed.
                            </p>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <button @click="enable" :disabled="isEnabling"
                            class="px-5 py-2.5 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            <span v-if="isEnabling"
                                class="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
                            {{ isEnabling ? 'Enabling...' : 'Enable' }}
                        </button>
                        <button @click="dismiss"
                            class="px-4 py-2.5 text-white hover:bg-white/10 rounded-lg transition-colors">
                            Not Now
                        </button>
                        <button @click="dismissForever"
                            class="p-2.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Don't ask again">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePushNotifications } from '../../composables/usePushNotifications';

const emit = defineEmits<{
    (e: 'enabled'): void;
    (e: 'dismissed'): void;
}>();

const isVisible = ref(false);
const isEnabling = ref(false);
const { requestPermission, subscribe } = usePushNotifications();

const show = () => {
    isVisible.value = true;
};

const hide = () => {
    isVisible.value = false;
};

const enable = async () => {
    isEnabling.value = true;

    try {
        const granted = await requestPermission();
        if (granted) {
            await subscribe();
            emit('enabled');
            hide();
        }
    } catch (error) {
        console.error('Failed to enable notifications:', error);
    } finally {
        isEnabling.value = false;
    }
};

const dismiss = () => {
    emit('dismissed');
    hide();
};

const dismissForever = () => {
    localStorage.setItem('push-notifications-declined', 'true');
    emit('dismissed');
    hide();
};

defineExpose({
    show,
    hide,
});
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}
</style>
