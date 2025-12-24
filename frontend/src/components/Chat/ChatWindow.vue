<template>
    <div class="flex flex-col h-full bg-gray-50 dark:bg-slate-900 overflow-visible">

        <!-- Header -->
        
        <ChatHeader :key=""/>
        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 custom-scrollbar" ref="scrollContainer">
            <div class="max-w-4xl mx-auto w-full h-full flex flex-col">

                <!-- Loading older messages spinner -->
                <div v-if="loadingMore" class="flex justify-center py-3">
                    <svg class="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>

                <div class="flex-1 flex flex-col justify-end space-y-4 pb-4">

                    <!-- Skeleton Loader -->
                    <div v-if="messagesLoading && messages.length === 0" class="space-y-4 px-4">
                        <div v-for="i in 6" :key="i" class="flex"
                            :class="i % 2 === 0 ? 'justify-end' : 'justify-start'">
                            <div class="rounded-lg p-4 max-w-xs animate-pulse"
                                :class="i % 2 === 0 ? 'bg-blue-300 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'">
                                <div class="h-4 rounded w-32 bg-current opacity-40"></div>
                                <div v-if="i % 2 !== 0" class="h-4 rounded w-24 bg-current opacity-40 mt-2"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Actual Messages -->
                    <div v-else class="space-y-4">

                        <!-- Sticky Date Label -->
                        <div class="sticky top-0 z-30 flex justify-center pointer-events-none">
                            <transition enter-active-class="transition-all duration-200 ease-out"
                                enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0"
                                leave-active-class="transition-all duration-150 ease-in"
                                leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
                                <span v-if="showStickyDate && activeStickyDate" class="px-5 py-1.5 text-xs font-semibold tracking-wider uppercase
                             text-gray-700 dark:text-gray-200
                             bg-gray-100 dark:bg-gray-800/90
                             backdrop-blur-sm
                             border border-gray-200 dark:border-gray-700
                             rounded-full shadow-lg">
                                    {{ activeStickyDate }}
                                </span>
                            </transition>
                        </div>

                        <!-- Messages Loop -->
                        <template v-for="(msg, index) in messages" :key="msg.id">

                            <!-- Date Separator -->
                            <DateSeparator
                                v-if="index === 0 || getMessageDay(msg.created_at) !== getMessageDay(messages[index - 1].created_at)"
                                :dateText="getMessageDay(msg.created_at)" />

                            <!-- Unread Divider -->
                            <div v-if="msg.id === firstUnreadId" class="relative my-4 flex items-center">
                                <div class="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                                <span
                                    class="mx-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    New messages
                                </span>
                                <div class="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                            </div>

                            <!-- Message Bubble -->
                            <MessageBubble :message="msg" :current-user-id="currentUserId" :is-sent="isSent(msg)"
                                :scroll-container="scrollContainer" @open-reaction="openReactionPicker"
                                @open-image="openImageModal" />
                        </template>

                        <!-- Uploading Messages -->
                        <UploadingMessage v-for="upload in uploadingMessages" :key="upload.tempId"
                            :fileName="upload.fileName" :progress="upload.progress" @cancel="cancelUpload" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Input -->
        <div class="flex-shrink-0">
            <MessageInput @send-text="sendText" @queue-files="queueFiles" />
        </div>

        <!-- Image Modal -->
        <div v-if="enlargedImage" @click.self="enlargedImage = null"
            class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <img :src="enlargedImage" class="max-w-full max-h-full rounded-xl" />
        </div>

        <!-- Reaction Picker -->
        <ReactionPicker v-if="reactionPickerMessage" :visible="!!reactionPickerMessage" :emojis="commonEmojis"
            @select="reactToMessage" />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '../../stores/chat';
import { useUserStore } from '../../stores/user';
import { useThrottleFn } from '@vueuse/core';

import MessageInput from '../MessageInput.vue';
import MessageBubble from './MessageBubble.vue';
import UploadingMessage from './UploadingMessage.vue';
import DateSeparator from './DateSeparator.vue';
import ReactionPicker from './ReactionPicker.vue';
import TypingIndicator from './TypingIndicator.vue';

export default defineComponent({
    components: { MessageInput, MessageBubble, UploadingMessage, DateSeparator, ReactionPicker, TypingIndicator },
    setup() {
        const chatStore = useChatStore();
        const userStore = useUserStore();

        const scrollContainer = ref<HTMLElement | null>(null);
        const enlargedImage = ref<string | null>(null);
        const uploadingMessages = ref<any[]>([]);
        const reactionPickerMessage = ref<any | null>(null);

        const showStickyDate = ref(false);
        const activeStickyDate = ref<string | null>(null);

        const isMobileView = ref(window.innerWidth < 768);
        const messages = computed(() => chatStore.activeMessages);
        const messagesLoading = ref(true);
        const activeConversation = computed(() => {
            const convId = chatStore.activeConversationId;
            return convId
                ? chatStore.conversations.find(c => c.id === convId) || null
                : null;
        });
        const currentUserId = computed(() => userStore.user?.id);
        const firstUnreadId = computed(() => {
            const convId = chatStore.activeConversationId;
            return convId
                ? chatStore.firstUnreadByConversation[convId] || null
                : null;
        });
        const typingText = computed(() => chatStore.typingText(chatStore.activeConversationId || null));
        const otherUser = computed(() => activeConversation.value ? chatStore.getOtherUser(activeConversation.value) : null);
        const isOnline = computed(() => otherUser.value && userStore.isUserOnline(otherUser.value.id))
        const isGroup = computed(() => activeConversation.value.type === 'group');

        const uploadCircumference = 2 * Math.PI * 28;
        const commonEmojis = ['👍', '❤️', '😂', '😮', '😢'];

        const isSent = (msg: any) => msg.sender?.id === currentUserId.value;
        const getMessageDay = (timestamp?: string) => {
            if (!timestamp) return '';
            const msgDate = new Date(timestamp);
            const today = new Date();
            const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
            const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
            if (isSameDay(msgDate, today)) return 'Today';
            if (isSameDay(msgDate, yesterday)) return 'Yesterday';
            return msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const scrollToBottom = async () => {
            await nextTick();
            const el = scrollContainer.value;
            if (!el) return;
            el.scrollTop = el.scrollHeight - el.clientHeight;
        };

        const openImageModal = (url: string) => { enlargedImage.value = url; };
        const reactToMessage = (emoji: string) => { if (reactionPickerMessage.value) chatStore.reactToMessage(reactionPickerMessage.value.id, emoji); };

        const openReactionPicker = (msg: any) => {
            reactionPickerMessage.value = msg;
            nextTick(() => {
                const rect = document.getElementById(`msg-${msg.id}`)?.getBoundingClientRect();
                if (!rect) return;
            });
        };

        const queueFiles = (files: any[]) => { /* push to uploadingMessages */ };
        const cancelUpload = (item: any) => { uploadingMessages.value = uploadingMessages.value.filter(u => u.tempId !== item.tempId); };
        const sendText = (text: string) => { chatStore.sendMessage(text); scrollToBottom(); };

        // Sticky date on scroll
        const lastScrollTop = ref(0);
        const scrollEndTimeout = ref<number | null>(null);
        const handleScroll = useThrottleFn(() => {
            const el = scrollContainer.value; if (!el) return;
            if (scrollEndTimeout.value) clearTimeout(scrollEndTimeout.value);
            scrollEndTimeout.value = setTimeout(() => showStickyDate.value = false, 800);

            const rows = el.querySelectorAll('.message-row');
            for (const row of rows) {
                const rect = row.getBoundingClientRect();
                if (rect.top >= 0) {
                    activeStickyDate.value = (row as HTMLElement).dataset.day || '';
                    break;
                }
            }
        }, 50);

        onMounted(() => scrollContainer.value?.addEventListener('scroll', handleScroll));
        onUnmounted(() => scrollContainer.value?.removeEventListener('scroll', handleScroll));

        return {
            messages, uploadingMessages, enlargedImage, scrollContainer,
            activeConversation, messagesLoading, isMobileView,
            firstUnreadId, currentUserId, isOnline, typingText, isGroup,
            isSent, getMessageDay, uploadCircumference,
            showStickyDate, activeStickyDate, openImageModal,
            openReactionPicker, queueFiles, cancelUpload, sendText,
            reactionPickerMessage, commonEmojis, reactToMessage
        };
    }
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.7);
}

.sent-bubble::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: -6px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-left: 6px solid;
    border-left-color: inherit;
    border-bottom: 10px solid transparent;
}
</style>
