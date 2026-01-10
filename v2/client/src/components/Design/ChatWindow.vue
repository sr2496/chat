<template>
    <div class="flex flex-row h-full w-full overflow-hidden bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800"
        @dragover.prevent="dragOver = true" @dragenter.prevent="dragOver = true" @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop">

        <!-- Main Chat Column -->
        <div class="flex-1 flex flex-col h-full min-w-0 relative">

            <!-- Header -->
            <div class="shrink-0">
                <ChatHeader @back="chatStore.currentConversation = null" @show-info="isInfoOpen = !isInfoOpen" />
            </div>

            <!-- Media Composer Overlay -->
            <transition name="fade-slide">
                <MediaComposer v-if="isMediaComposerOpen" :files="queuedFiles" @send="handleSendMedia"
                    @close="closeComposer" @file-add="handleFileAdd" />
            </transition>

            <!-- Messages Area -->
            <div v-show="!isMediaComposerOpen" class="relative flex-1 min-h-0">
                <div ref="scrollContainer"
                    class="absolute inset-0 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth"
                    @scroll="handleScroll">

                    <div v-if="messagesLoading" class="flex items-center justify-center h-full">
                        <span class="loading loading-spinner text-blue-500"></span>
                    </div>

                    <div v-else class="min-h-full flex flex-col justify-end">
                        <template v-for="(msg, index) in messages" :key="msg._id">
                            <DateSeparator v-if="shouldShowDate(index)" :day="getMessageDay(msg.createdAt)" />

                            <MessageBubble :is-group="isGroup" :is-sent="isSent(msg)" :message="msg"
                                :setMessageRef="setMessageRef" :getMessageDay="getMessageDay" @reply="handleReply"
                                @scrollTo="scrollToMessage" />
                        </template>

                        <!-- Uploading Messages -->
                        <template v-for="upload in uploadingMessages" :key="upload.tempId">
                            <MessageBubble :is-group="isGroup" :is-sent="true" :message="{
                                type: upload.type,
                                content: upload.caption || '',
                                attachment_url: upload.preview,
                                file_name: upload.file.name,
                                file_size: upload.file.size,
                                createdAt: new Date().toISOString(),
                                sender_id: authStore.user
                            }" :setMessageRef="() => { }" :getMessageDay="getMessageDay" :is-uploading="true"
                                :upload-progress="upload.progress" @cancel-upload="cancelUpload(upload)" />
                        </template>
                    </div>
                </div>

                <!-- Drag & Drop Overlay -->
                <transition name="fade">
                    <div v-if="dragOver"
                        class="absolute inset-0 z-40 bg-blue-500/20 dark:bg-blue-400/20 border-4 border-dashed border-blue-600 dark:border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none backdrop-blur-sm">
                        <div class="text-center">
                            <svg class="w-20 h-20 mx-auto mb-4 text-blue-600 dark:text-blue-400" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p class="text-3xl font-bold text-blue-700 dark:text-blue-300">Drop to send</p>
                        </div>
                    </div>
                </transition>

                <!-- Go to Bottom Button -->
                <transition name="fade">
                    <button v-if="showScrollBottom" @click="scrollToBottom"
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
            </div>

            <!-- Input Area -->
            <MessageInput v-show="!isMediaComposerOpen" ref="messageInputRef" @send-text="sendText"
                @queue-files="handleQueueFiles" :replyingTo="replyingTo" @cancel-reply="cancelReply" />

        </div>

        <!-- Info Sidebar -->
        <ChatInfo :isOpen="isInfoOpen" :conversation="chatStore.currentConversation" @close="isInfoOpen = false" />

    </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from "vue";
import { useChatStore } from "../../stores/chat";
import { useAuthStore } from "../../stores/auth";
import { api } from "../../utils/axios"; // Ensure path is correct
import ChatHeader from "./ChatHeader.vue";
import MessageBubble from "./MessageBubble.vue";
import MessageInput from "./MessageInput.vue";
import DateSeparator from "./DateSeparator.vue";
import MediaComposer from "./MediaComposer.vue";
import ChatInfo from "./ChatInfo.vue";

const isInfoOpen = ref(false);

const chatStore = useChatStore();
const authStore = useAuthStore();
const scrollContainer = ref(null);
const messageInputRef = ref(null);
const messageRefs = new Map();

// Map store properties
const messages = computed(() => chatStore.messages);
const activeConversation = computed(() => chatStore.currentConversation);
const isGroup = computed(() => activeConversation.value?.type === 'group');

// State
const messagesLoading = ref(false);
const showScrollBottom = ref(false);
const unreadCount = ref(0);
const dragOver = ref(false);
const isMediaComposerOpen = ref(false);
const queuedFiles = ref([]);
const uploadingMessages = ref([]);

const isSent = (msg) => msg.sender_id._id === authStore.user._id;

const setMessageRef = (id, el) => {
    if (el) messageRefs.set(id, el);
};

const getMessageDay = (timestamp) => {
    if (!timestamp) return "";
    const msgDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setUTCDate(today.getUTCDate() - 1);

    const isSameDay = (d1, d2) =>
        d1.getUTCFullYear() === d2.getUTCFullYear() &&
        d1.getUTCMonth() === d2.getUTCMonth() &&
        d1.getUTCDate() === d2.getUTCDate();

    if (isSameDay(msgDate, today)) return "Today";
    if (isSameDay(msgDate, yesterday)) return "Yesterday";

    return msgDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const shouldShowDate = (index) => {
    if (index === 0) return true;
    const currentMsg = messages.value[index];
    const prevMsg = messages.value[index - 1];
    if (!currentMsg || !prevMsg) return false;
    return getMessageDay(currentMsg.createdAt) !== getMessageDay(prevMsg.createdAt);
};

const scrollToBottom = () => {
    nextTick(() => {
        if (scrollContainer.value) {
            scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
            showScrollBottom.value = false;
        }
    });
};

const handleScroll = () => {
    if (!scrollContainer.value) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    showScrollBottom.value = !isAtBottom;
};

const replyingTo = ref(null);

const handleReply = (msg) => {
    replyingTo.value = {
        id: msg._id,
        senderName: msg.sender_id.name,
        body: msg.content || 'Media'
    };
    if (messageInputRef.value) messageInputRef.value.focusInput();
};

const scrollToMessage = (messageId) => {
    const el = messageRefs.get(messageId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Optional highlight effect
        const bubble = el.querySelector('div.rounded-2xl');
        if (bubble) {
            bubble.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500', 'dark:ring-blue-400', 'transition-all', 'duration-300');
            setTimeout(() => {
                bubble.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500', 'dark:ring-blue-400');
            }, 5000);
        }
    }
};

const cancelReply = () => {
    replyingTo.value = null;
};

const sendText = async (text) => {
    if (chatStore.currentConversation) {
        await chatStore.sendMessage(chatStore.currentConversation._id, text, 'text', replyingTo.value?.id);
        replyingTo.value = null;
        scrollToBottom();
    }
};

// --- Media Logic ---

const handleDragLeave = (e) => {
    const current = e.currentTarget;
    const related = e.relatedTarget;
    if (!current || !related || !current.contains(related)) {
        dragOver.value = false;
    }
};

const handleDrop = (e) => {
    dragOver.value = false;
    if (e.dataTransfer?.files?.length) {
        const files = Array.from(e.dataTransfer.files).map(file => ({
            file,
            type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file",
            preview: (file.type.startsWith("image/") || file.type.startsWith("video/")) ? URL.createObjectURL(file) : undefined,
            name: file.name,
            size: file.size,
            caption: ""
        }));

        if (isMediaComposerOpen.value) {
            handleFileAdd(files);
        } else {
            queuedFiles.value = files;
            isMediaComposerOpen.value = true;
        }
    }
};

const handleQueueFiles = (payload) => {
    // payload: { files: [...], caption: '' }
    const newFiles = payload.files.map(f => ({
        ...f,
        name: f.file.name,
        size: f.file.size,
        caption: payload.caption || ""
    }));

    // Direct send for voice messages
    if (newFiles.length === 1 && newFiles[0].type === 'audio') {
        handleSendMedia(newFiles);
        return;
    }

    queuedFiles.value = newFiles;
    isMediaComposerOpen.value = true;
};

const handleFileAdd = (files) => {
    queuedFiles.value.push(...files);
};

const closeComposer = () => {
    queuedFiles.value.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
    });
    queuedFiles.value = [];
    isMediaComposerOpen.value = false;
};

const handleSendMedia = async (files) => {
    closeComposer(); // Close immediately, show uploading bubbles

    for (const item of files) {
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const controller = new AbortController();

        const uploadItem = {
            tempId,
            file: item.file,
            preview: item.preview,
            type: item.type,
            caption: item.caption,
            progress: 1,
            controller
        };

        uploadingMessages.value.push(uploadItem);
        scrollToBottom();

        try {
            const form = new FormData();
            form.append("file", item.file);
            form.append("type", item.type);
            form.append("conversation_id", chatStore.currentConversation._id);
            if (item.caption) form.append("content", item.caption);

            const res = await api.post('/chat/messages', form, {
                signal: controller.signal,
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (!e.total) return;
                    const percent = Math.round((e.loaded * 100) / e.total);
                    const idx = uploadingMessages.value.findIndex(m => m.tempId === tempId);
                    if (idx !== -1) uploadingMessages.value[idx].progress = percent;
                },
            });

            // Message sent
            // socket will likely push it too, or we push manually
            // V2 Store auto-pushes on 'message_received'.
            // But we should probably push manually to be instant if we return the message
            // or just wait for socket.
            chatStore.messages.push(res.data); // Assuming response is the message object

            // Remove uploading bubble
            uploadingMessages.value = uploadingMessages.value.filter(m => m.tempId !== tempId);
            scrollToBottom();

        } catch (err) {
            console.error(err);
            uploadingMessages.value = uploadingMessages.value.filter(m => m.tempId !== tempId);
        }
    }
};

const cancelUpload = (item) => {
    item.controller.abort();
    uploadingMessages.value = uploadingMessages.value.filter(m => m.tempId !== item.tempId);
};


// Initial scroll
watch(() => messages.value, () => {
    if (!showScrollBottom.value) {
        scrollToBottom();
    }
}, { deep: true });

onMounted(() => {
    scrollToBottom();
});
</script>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>
