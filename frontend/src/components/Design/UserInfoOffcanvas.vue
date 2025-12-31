<template>
    <transition name="slide-fade">
        <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" @click="close">
            <div @click.stop
                class="absolute right-0 top-0 h-full w-full max-w-md bg-chat-surface shadow-2xl flex flex-col">
                <!-- Header -->
                <div class="flex items-center gap-3 p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button @click="close"
                        class="p-2 -ml-1 rounded-full hover:bg-gray-50 text-gray-500 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 class="text-xl font-bold text-chat-text">Contact Info</h2>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div v-if="loading" class="flex items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>

                    <div v-else-if="contact" class="space-y-6">
                        <!-- Avatar Section -->
                        <div class="flex flex-col items-center gap-4 py-6">
                            <UserAvatar :avatar="contact.avatar" :is-online="userStore.isUserOnline(contact.id)"
                                :show-online="true" size="xl" />
                            <div class="text-center">
                                <h3 class="text-2xl font-bold text-chat-text">{{ contact.name }}</h3>
                                <p class="text-sm text-chat-text-muted mt-1">{{ contact.email }}</p>
                                <span :class="[
                                    'inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium',
                                    userStore.isUserOnline(contact.id)
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                ]">
                                    {{ userStore.isUserOnline(contact.id) ? 'Online' : 'Offline' }}
                                </span>
                            </div>
                        </div>

                        <!-- Bio Section (if available) -->
                        <div v-if="contact.bio" class="bg-chat-bg rounded-xl p-4">
                            <h4 class="text-sm font-semibold text-chat-text-muted uppercase tracking-wider mb-2">About
                            </h4>
                            <p class="text-chat-text">{{ contact.bio }}</p>
                        </div>

                        <!-- Info Details -->
                        <div class="space-y-3">
                            <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-chat-bg transition-colors">
                                <svg class="w-5 h-5 text-chat-text-muted" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div class="flex-1">
                                    <p class="text-xs text-chat-text-muted">Email</p>
                                    <p class="text-sm text-chat-text font-medium">{{ contact.email }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="space-y-3 pt-4 border-t border-chat-border">
                            <button @click="sendMessage"
                                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Message
                            </button>

                            <button @click="blockUser"
                                class="w-full py-3 px-4 rounded-xl border-2 border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Block User
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useChatStore } from '../../stores/chat';
import { useUserStore } from '../../stores/user';
import UserAvatar from './UserAvatar.vue';

const props = defineProps<{
    isOpen: boolean;
    userId: number;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const chatStore = useChatStore();
const userStore = useUserStore();
const loading = ref(false);
const contact = ref<any>(null);

// Watch for userId changes to load contact data
watch(() => props.userId, async (newUserId) => {
    if (newUserId && props.isOpen) {
        await loadContact();
    }
}, { immediate: true });

watch(() => props.isOpen, async (isOpen) => {
    if (isOpen && props.userId) {
        await loadContact();
    }
});

const loadContact = async () => {
    loading.value = true;
    try {
        // For now, get user from conversation data
        // In future, can add dedicated API endpoint
        const conversation = chatStore.conversations.find(c =>
            c.users?.some((u: any) => u.id === props.userId)
        );

        if (conversation) {
            contact.value = conversation.users?.find((u: any) => u.id === props.userId);
        }
    } catch (error) {
        console.error('Failed to load contact:', error);
    } finally {
        loading.value = false;
    }
};

const close = () => {
    emit('close');
};

const sendMessage = () => {
    // Already in conversation, just close the panel
    close();
};

const blockUser = () => {
    if (confirm(`Are you sure you want to block ${contact.value?.name}?`)) {
        // TODO: Implement block user API
        alert('Block user feature coming soon!');
    }
};
</script>

<style scoped>
.slide-fade-enter-active {
    transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
    transition: all 0.3s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateX(100%);
    opacity: 0;
}
</style>
