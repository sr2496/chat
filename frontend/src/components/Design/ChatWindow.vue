<!-- ChatWindow.vue -->
<template>
    <div class="flex flex-col h-screen bg-[var(--chat-window-bg)]">
        <!-- Header -->
        <div class="shrink-0">
            <ChatHeader @video-call="startVideoCall" />
        </div>

        <!-- Media Composer -->
        <transition name="fade-slide">
            <MediaComposer v-if="isMediaComposerOpen" :files="queuedFiles" @send="handleSendMedia"
                @close="closeComposer" @file-add="handleFileAdd" />
        </transition>

        <!-- Messages Area -->
        <div v-show="!isMediaComposerOpen" class="relative flex-1 min-h-0">
            <div ref="scrollContainer" class="absolute inset-0 overflow-y-auto px-8 py-6 custom-scrollbar"
                @dragover.prevent="dragOver = true" @dragenter.prevent="dragOver = true"
                @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
                <div class="sticky top-0 z-30 flex justify-center pointer-events-none">
                    <transition enter-active-class="transition-all duration-200 ease-out"
                        enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition-all duration-150 ease-in"
                        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
                        <span v-if="showStickyDate && activeStickyDate"
                            class="px-5 py-1.5 text-xs font-semibold tracking-wider uppercase text-chat-text bg-chat-surface/90 backdrop-blur-sm border border-chat-border rounded-full shadow-lg">
                            {{ activeStickyDate }}
                        </span>
                    </transition>
                </div>

                <!-- Skeleton Loader -->
                <transition name="fade" mode="out-in" @after-enter="onMessagesTransitionEnd">
                    <div v-if="messagesLoading" class="space-y-8 animate-pulse">
                        <div v-for="n in 3" :key="n" class="flex"
                            :class="n % 3 === 0 ? 'justify-end' : 'gap-3 items-end'">
                            <!-- Avatar Skeleton (received) -->
                            <div v-if="n % 3 !== 0"
                                class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />

                            <!-- Bubble Skeleton -->
                            <div class="max-w-[75%]">
                                <div class="relative px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700">
                                    <!-- Tail Skeleton -->
                                    <div class="absolute bottom-0 w-4 h-4 bg-gray-200 dark:bg-gray-700" :class="n % 3 === 0
                                        ? 'right-0 translate-x-2'
                                        : 'left-0 -translate-x-2'
                                        " />

                                    <!-- Content Lines -->
                                    <div class="space-y-2">
                                        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
                                        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                                        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
                                    </div>

                                    <!-- Time Skeleton -->
                                    <div class="flex justify-end mt-2">
                                        <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else key="messages" class="min-h-full flex flex-col justify-end">
                        <template v-for="(msg, index) in messages" :key="msg.id">
                            <DateSeparator v-if="shouldShowDate(index)" :day="getMessageDay(msg.created_at)" />
                            <!-- Unread Divider -->
                            <div v-if="msg.id === firstUnreadId" class="relative my-4 flex items-center">
                                <div class="h-px flex-grow bg-chat-border" />
                                <span class="mx-4 text-xs font-semibold uppercase tracking-wider text-chat-text-muted">
                                    New messages
                                </span>
                                <div class="h-px flex-grow bg-chat-border" />
                            </div>
                            <MessageBubble :is-group="isGroup" :is-sent="isSent(msg)" :message="msg"
                                :setMessageRef="setMessageRef" :getMessageDay="getMessageDay"
                                @open-emoji="openReactionPicker" @open-actions="openContextMenu"
                                @scroll-to-message="scrollToMessage" />
                        </template>

                        <!-- Uploading Messages -->
                        <template v-for="upload in uploadingMessages" :key="upload.tempId">
                            <MessageBubble :is-group="isGroup" :is-sent="true" :message="{
                                type: upload.type,
                                message: '',
                                file_path: upload.preview,
                                file_name: upload.file.name,
                                file_size: upload.file.size,
                            }" :setMessageRef="setMessageRef" :getMessageDay="getMessageDay" :is-uploading="true"
                                :upload-progress="upload.progress" @cancel-upload="cancelUpload(upload)" />
                        </template>
                    </div>
                </transition>

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
                            <p class="text-lg text-blue-600 dark:text-blue-400 mt-2">Images, videos, documents</p>
                        </div>
                    </div>
                </transition>
            </div>

            <!-- Go to Bottom Button -->
            <teleport to="body">
                <transition name="fade">
                    <button v-if="isUserScrolledUp" @click="scrollToBottom"
                        class="fixed bottom-24 right-6 z-50 w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>

                        <!-- Unread Badge -->
                        <span v-if="unreadCountWhileScrolled > 0"
                            class="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[18px] text-center">
                            {{ unreadCountWhileScrolled }}
                        </span>
                    </button>
                </transition>
            </teleport>
        </div>

        <!-- Input Area (Reply Preview + Input) -->
        <MessageInput ref="messageInputRef" v-show="!isMediaComposerOpen" :replyingTo="replyingTo" @send-text="sendText"
            @queue-files="handleQueueFiles" @cancel-reply="replyingTo = null" @open-emoji="openReactionPicker" />



        <!-- Reaction Picker Popup -->
        <teleport to="body">
            <transition name="reaction-fly">
                <div v-if="reactionPickerMessageId" class="fixed z-50 pointer-events-none"
                    :style="{ top: pickerTop + 'px', left: pickerLeft + 'px' }">
                    <div data-reaction-menu="true"
                        class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-2.5 border border-gray-200 dark:border-gray-700 flex items-center gap-2 pointer-events-auto">
                        <button v-for="emoji in commonEmojis" :key="emoji"
                            @click="addReaction(reactionPickerMessageId, emoji)"
                            class="text-2xl hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-all duration-150 text-gray-800 dark:text-gray-100">
                            {{ emoji }}
                        </button>
                    </div>
                </div>
            </transition>
        </teleport>
        <!-- Right-Click Context Menu -->
        <teleport to="body">
            <transition name="fade-scale">
                <div v-if="contextMenu" class="fixed z-50"
                    :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" @click.stop @contextmenu.prevent>
                    <div data-context-menu="true" class="
          bg-white dark:bg-gray-800
          rounded-2xl
          shadow-2xl
          border border-gray-200 dark:border-gray-700
          py-2
          min-w-[200px]
          overflow-hidden
          backdrop-blur-sm
          ring-1 ring-black/5 dark:ring-white/10
          text-gray-800 dark:text-gray-100
        ">
                        <!-- Reply -->
                        <button @click="replyToMessage(contextMenu.message)" class="
            w-full px-5 py-3.5
            text-left text-sm font-medium
            text-gray-800 dark:text-gray-100
            flex items-center gap-4
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-all duration-150
          ">
                            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Reply</span>
                        </button>

                        <!-- Copy Text (only for text messages) -->
                        <button v-if="!contextMenu.message.type || contextMenu.message.type === 'text'"
                            @click="copyMessageText(contextMenu.message)" class="
            w-full px-5 py-3.5
            text-left text-sm font-medium
            text-gray-800 dark:text-gray-100
            flex items-center gap-4
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-all duration-150
          ">
                            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy Text</span>
                        </button>

                        <!-- Forward (optional future feature) -->
                        <!--
        <button class="...">
          <svg ...>Forward icon</svg>
          Forward
        </button>
        -->

                        <hr class="my-1 border-gray-200 dark:border-gray-700" />

                        <!-- Delete (only for own messages) -->
                        <button v-if="isSent(contextMenu.message)" @click="deleteMessage(contextMenu.message.id)" class="
            w-full px-5 py-3.5
            text-left text-sm font-medium
            text-red-600 dark:text-red-400
            flex items-center gap-4
            hover:bg-red-50 dark:hover:bg-red-900/30
            transition-all duration-150
          ">
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
    </div>
</template>

<script lang="ts">
import {
    defineComponent,
    ref,
    nextTick,
    watch,
    onMounted,
    computed,
    onUnmounted,
} from "vue";
import { api } from "../../axios";
import { useChatStore } from "../../stores/chat";

import { useThrottleFn } from "@vueuse/core";
import ChatHeader from "./ChatHeader.vue";
import MessageBubble from "./MessageBubble.vue";
import { useUserStore } from "../../stores/user";
import MessageInput from "./MessageInput.vue";
import DateSeparator from "./DateSeparator.vue";
import MediaComposer from "./MediaComposer.vue";


interface QueuedFile {
    file: File;
    preview?: string;
    type: "image" | "video" | "file" | "audio";
    name: string;
    size: number;
    caption?: string;
}

const queuedFiles = ref<QueuedFile[]>([]);

interface UploadingMessage {
    tempId: string;
    file: File;
    preview?: string;
    type: string;
    progress: number;
    controller: AbortController;
}

export default defineComponent({
    components: { MessageBubble, ChatHeader, MessageInput, DateSeparator, MediaComposer },
    emits: ['start-call'],
    setup(_, { emit }) {
        const chatStore = useChatStore();
        const messages = computed(() => chatStore.activeMessages);
        const isMediaComposerOpen = ref(false);
        const dragOver = ref(false);

        const contextMenu = ref<{
            message: any;
            x: number;
            y: number;
        } | null>(null);

        const deleteMessage = async (messageId: number) => {
            if (!confirm("Are you sure you want to delete this message?")) return;
            try {
                await api.delete(`/messages/${messageId}`);
                chatStore.removeMessage(messageId);
                contextMenu.value = null;
            } catch (err) {
                console.error("Delete failed", err);
            }
        };

        const replyingTo = ref<{ id?: number; senderName?: string; body: string } | null>(null);

        const loadingMore = computed(() => {
            const convId = chatStore.activeConversationId;
            return convId ? chatStore.pagination[convId]?.loading : false;
        });

        const scrollContainer = ref<HTMLElement | null>(null);
        const messageRefs = new Map<number, HTMLElement>();
        const enlargedImage = ref<string | null>(null);

        const userStore = useUserStore();

        const currentUserId = computed(() => userStore.user?.id);
        const uploadingMessages = ref<UploadingMessage[]>([]);
        const isGroup = computed(() => activeConversation.value?.type === "group");
        const messagesLoading = ref(true);


        const activeConversation = computed(() => {
            const convId = chatStore.activeConversationId;
            return convId
                ? chatStore.conversations.find((c) => c.id === convId) || null
                : null;
        });

        const firstUnreadId = ref<number | null>(null);

        const setMessageRef = (id: number, el: HTMLElement | null) => {
            if (el) {
                messageRefs.set(id, el);
            }
        };

        const isSent = (msg: any) => msg.sender?.id === currentUserId.value;

        const getMessageDay = (timestamp?: string) => {
            if (!timestamp) return "";

            const msgDate = new Date(timestamp);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setUTCDate(today.getUTCDate() - 1);

            // Compare using UTC to match database (server) dates
            const isSameDay = (d1: Date, d2: Date) =>
                d1.getUTCFullYear() === d2.getUTCFullYear() &&
                d1.getUTCMonth() === d2.getUTCMonth() &&
                d1.getUTCDate() === d2.getUTCDate();

            if (isSameDay(msgDate, today)) return "Today";
            if (isSameDay(msgDate, yesterday)) return "Yesterday";

            // Format like "Dec 20, 2025" in UTC
            return msgDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
            });
        };

        const sendText = async (text: string) => {
            if (!chatStore.activeConversationId) return;
            try {
                const payload: any = {
                    message: text,
                };

                if (replyingTo.value?.id) {
                    payload.reply_to_message_id = replyingTo.value.id;
                }

                const res = await api.post(
                    `/messages/${chatStore.activeConversationId}`,
                    payload
                );

                chatStore.pushMessage(res.data.data);
                replyingTo.value = null;

                scrollToBottom();
            } catch (err) {
                console.error("Text send failed", err);
            }
        };

        const handleDrop = (e: DragEvent) => {
            dragOver.value = false;
            if (e.dataTransfer?.files?.length) {
                const files = Array.from(e.dataTransfer.files);
                const queued = buildQueuedFiles(files);
                if (isMediaComposerOpen.value) {
                    handleFileAdd(queued);
                } else {
                    handleQueueFiles({ files: queued });
                }
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            const current = e.currentTarget as HTMLElement | null;
            const related = e.relatedTarget as Node | null;

            if (!current || !related || !current.contains(related)) {
                dragOver.value = false;
            }
        };

        const handleQueueFiles = (payload: {
            files: { file: File; type: string; preview?: string }[];
            caption?: string;
        }) => {
            const files = payload.files.map(f => f.file);

            queuedFiles.value = buildQueuedFiles(files);

            const isVoice = payload.files.some(f => f.type === 'audio');
            if (isVoice) {
                handleSendMedia(queuedFiles.value);
            } else {
                isMediaComposerOpen.value = true;
            }
        };

        const handleFileAdd = (files: QueuedFile[]) => {
            queuedFiles.value.push(...files);
        };

        const buildQueuedFiles = (files: File[]): QueuedFile[] => {
            return files.map(file => {
                const type = file.type.startsWith("image/")
                    ? "image"
                    : file.type.startsWith("video/")
                        ? "video"
                        : "file";

                return {
                    file,
                    preview:
                        type === "image" || type === "video"
                            ? URL.createObjectURL(file)
                            : undefined,
                    type: type as "image" | "video" | "file",
                    name: file.name,
                    size: file.size,
                    caption: "",
                };
            });
        };

        const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null);

        const closeComposer = () => {
            console.log('[DEBUG] closeComposer called');
            queuedFiles.value.forEach(f => {
                if (f.preview) {
                    URL.revokeObjectURL(f.preview);
                }
            });

            queuedFiles.value = [];
            isMediaComposerOpen.value = false;
            console.log('[DEBUG] isMediaComposerOpen set to false');

            // Restore focus to the textarea after closing composer
            // Delay accounts for the fade-slide transition
            nextTick(() => {
                console.log('[DEBUG] nextTick callback executing');
                setTimeout(() => {
                    console.log('[DEBUG] setTimeout callback executing, ref:', messageInputRef.value);
                    messageInputRef.value?.focusInput();
                    console.log('[DEBUG] focusInput called');
                }, 200);
            });
        };

        const handleSendMedia = async (files: QueuedFile[]) => {
            await saveMedia(files);
            closeComposer(); // CLOSE + CLEANUP
        };

        const saveMedia = async (files: {
            file: File;
            preview?: string;
            type: string;
            caption?: string;
        }[]) => {
            if (!chatStore.activeConversationId) return;

            for (const item of files) {
                const tempId = `temp-${Date.now()}-${Math.random()}`;
                const controller = new AbortController();

                const uploadItem: UploadingMessage = {
                    tempId,
                    file: item.file,
                    preview: item.preview,
                    type: item.type,
                    progress: 1, // Start at 1% instead of 0% so indicator shows immediately
                    controller,
                };

                // Add to uploading messages
                uploadingMessages.value.push(uploadItem);

                // Scroll to show the uploading message
                await nextTick();
                scrollToBottom();

                try {
                    console.log('Uploading file type:', item.type);

                    const form = new FormData();
                    form.append("file", item.file);
                    form.append("type", item.type);

                    if (item.caption?.trim()) {
                        form.append("message", item.caption); // ← Send caption as message text
                    }

                    const res = await api.post(`/messages/${chatStore.activeConversationId}`, form, {
                        signal: controller.signal,
                        onUploadProgress: (e) => {
                            if (!e.total) return;
                            const percent = Math.round((e.loaded * 100) / e.total);
                            console.log('Upload progress:', percent);

                            uploadingMessages.value = uploadingMessages.value.map(m =>
                                m.tempId === tempId ? { ...m, progress: percent } : m
                            );
                        },
                    });

                    chatStore.pushMessage(res.data.data);
                    scrollToBottom();

                    setTimeout(() => {
                        uploadingMessages.value = uploadingMessages.value.filter(m => m.tempId !== tempId);
                    }, 1000);
                } catch (err: any) {
                    // ... error handling
                    uploadingMessages.value = uploadingMessages.value.filter(
                        (m) => m.tempId !== tempId
                    );

                    if (uploadItem.preview) {
                        URL.revokeObjectURL(uploadItem.preview);
                    }

                    if (err.name !== "AbortError") {
                        console.error("Upload failed", err);
                    }
                }
            }
        };

        const cancelUpload = (item: UploadingMessage) => {
            item.controller.abort();
            uploadingMessages.value = uploadingMessages.value.filter(
                (m) => m.tempId !== item.tempId
            );
            if (item.preview) {
                URL.revokeObjectURL(item.preview);
            }
        };

        const shouldShowDate = (index: number) => {
            if (index === 0) return true;

            const currentMsg = messages.value[index];
            const prevMsg = messages.value[index - 1];

            if (!currentMsg || !prevMsg) return false;

            const current = getMessageDay(currentMsg.created_at);
            const previous = getMessageDay(prevMsg.created_at);

            return current !== previous;
        };

        const openImageModal = (url: string) => {
            enlargedImage.value = url;
        };

        const scrollToFirstUnread = async () => {
            await nextTick();

            if (!firstUnreadId.value) {
                scrollToBottom();
                return;
            }
            scrollToMessage(firstUnreadId.value);
        };

        const isUserScrolledUp = ref(false);
        const unreadCountWhileScrolled = ref(0);

        const markMessagesAsRead = async (messageIds: number[]) => {
            if (!chatStore.activeConversationId || messageIds.length === 0) return;

            try {
                await api.post("/messages/read", {
                    conversation_id: chatStore.activeConversationId,
                    message_ids: messageIds,
                });

                // Update local state - mark messages as read
                const msgs = messages.value;
                if (msgs) {
                    msgs.forEach((m: any) => {
                        if (messageIds.includes(m.id)) {
                            m.read_by_me = true;
                        }
                    });
                }

                // Clear unread count for this conversation
                chatStore.clearUnread(chatStore.activeConversationId);
                unreadCountWhileScrolled.value = 0;
            } catch (error) {
                console.error('Failed to mark messages as read:', error);
            }
        };

        const scrollToBottom = async () => {

            // Mark visible unread messages as read immediately since we are jumping to bottom
            const unreadIds = messages.value
                .filter((m: any) => !m.read_by_me && m.sender.id !== currentUserId.value)
                .map((m: any) => m.id);

            if (unreadIds.length > 0) {
                markMessagesAsRead(unreadIds);
            }

            // If we are forcing a scroll to bottom, we are no longer "scrolled up"
            isUserScrolledUp.value = false;
            unreadCountWhileScrolled.value = 0;

            await nextTick();

            firstUnreadId.value = chatStore.computeFirstUnread(chatStore.activeConversationId);

            if (firstUnreadId.value) {
                scrollToMessage(firstUnreadId.value);
                return;
            }

            const el = scrollContainer.value;
            if (!el) return;

            const scroll = () => {
                el.scrollTop = el.scrollHeight - el.clientHeight;
            };

            // Run multiple times to guarantee layout stability
            scroll();
            requestAnimationFrame(scroll);
            setTimeout(() => {
                scroll();
            }, 80);
        };

        const onMessagesTransitionEnd = () => {
            scrollToFirstUnread();
        };

        const scrollToMessage = async (messageId: number) => {
            await nextTick(); // Wait for DOM update

            const el = messageRefs.get(messageId);
            if (!el || !scrollContainer.value) return;

            // Scroll into view with smooth behavior
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'center', // Centers the message vertically
            });

            // Optional: Add a subtle highlight flash
            el.classList.add(
                'bg-blue-100',
                'dark:bg-blue-900/30',
                'transition-all',
                'duration-1000'
            );
            setTimeout(() => {
                el.classList.remove('bg-blue-100', 'dark:bg-blue-900/30');
            }, 2000);

        };

        const handleScroll = () => {
            const el = scrollContainer.value;
            if (!el || loadingMore.value || !chatStore.activeConversationId) return;

            // Logic to detect if user is scrolled up
            // Tolerance of 100px
            const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

            if (isAtBottom) {
                if (isUserScrolledUp.value) {
                    // User returned to bottom
                    isUserScrolledUp.value = false;
                    // Mark pending messages as read
                    const unreadIds = messages.value
                        .filter((m: any) => !m.read_by_me && m.sender.id !== currentUserId.value)
                        .map((m: any) => m.id);
                    if (unreadIds.length > 0) {
                        markMessagesAsRead(unreadIds);
                    }
                }
            } else {
                // User scrolled up
                isUserScrolledUp.value = true;
            }

            // Only load more if near the top
            if (el.scrollTop < 200 && chatStore.pagination[chatStore.activeConversationId]?.hasMore) {
                // Capture current scroll position and height BEFORE loading more
                const previousHeight = el.scrollHeight;
                const previousScrollTop = el.scrollTop;

                chatStore.loadMessages(chatStore.activeConversationId, true).finally(() => {
                    nextTick(() => {
                        if (!scrollContainer.value) return;

                        const newHeight = scrollContainer.value.scrollHeight;

                        // Adjust scroll to compensate for newly added content at the top
                        scrollContainer.value.scrollTop = previousScrollTop + (newHeight - previousHeight);

                    });
                });
            }
        };

        let lastScrollTop = 0;
        let scrollEndTimeout: number | null = null;
        const showStickyDate = ref(false);

        const onScrollHandler = useThrottleFn(() => {
            const el = scrollContainer.value;
            if (!el) return;

            const currentScrollTop = el.scrollTop;

            // 🔒 Ignore programmatic scrolls (no movement)
            if (currentScrollTop === lastScrollTop) return;
            lastScrollTop = currentScrollTop;

            // ✅ Show ONLY once per scroll session
            if (!showStickyDate.value) {
                showStickyDate.value = true;
            }

            if (scrollEndTimeout) {
                clearTimeout(scrollEndTimeout);
            }

            scrollEndTimeout = window.setTimeout(() => {
                showStickyDate.value = false;
            }, 800);

            handleScroll();
            onScroll();
        }, 50);

        const activeStickyDate = ref<string | null>(null);

        const onScroll = () => {
            const rows = scrollContainer.value?.querySelectorAll(".message-row");
            if (!rows) return;


            for (const row of rows) {
                const rect = row.getBoundingClientRect();
                if (rect.top >= 0) {
                    const day = (row as HTMLElement).dataset.day;
                    if (day && day !== activeStickyDate.value) {
                        activeStickyDate.value = day;
                    }
                    break;
                }
            }
        };

        const openContextMenu = (e: MouseEvent, message: any) => {
            e.preventDefault();

            if (contextMenu.value && contextMenu.value?.message?.id === message.id) {
                // If the same message's context menu is already open, close it
                closeAllPopups(e);
                return;
            }

            let x = e.clientX;
            let y = e.clientY;

            // If menu would go off-screen to the right, flip it left
            const menuWidth = 180; // approx width of your menu
            if (x + menuWidth > window.innerWidth) {
                x = window.innerWidth - menuWidth - 10; // 10px margin
            }

            // Optional: flip up if near bottom
            const menuHeight = 60;
            if (y + menuHeight > window.innerHeight) {
                y = window.innerHeight - menuHeight - 10;
            }

            contextMenu.value = {
                message,
                x,
                y,
            };
        };

        // --- Video Call Logic ---
        // Removed WebRTC logic

        const startVideoCall = () => {
            if (!chatStore.activeConversationId) return;

            const conv = chatStore.conversations.find(c => c.id === chatStore.activeConversationId);
            if (!conv) return;

            const other = chatStore.getOtherUser(conv);
            if (!other) {
                alert("Can only call in private conversations.");
                return;
            }

            // Emit to parent (ChatLayout) to handle the global call logic
            emit('start-call', other.id);
        };

        const replyToMessage = (message: any) => {
            replyingTo.value = {
                id: message.id,
                senderName: message.sender?.id === currentUserId.value ? "You" : message.sender?.name || "Unknown",
                body:
                    message.type === "text"
                        ? message.message
                        : message.type === "image"
                            ? "[Image]"
                            : message.type === "video"
                                ? "[Video]"
                                : "[File]",
            };
            contextMenu.value = null;
        };

        const closeAllPopups = (e: MouseEvent) => {
            const target = e.target as Node;

            // Close context menu
            const contextEl = document.querySelector('[data-context-menu="true"]');
            if (contextMenu.value && contextEl && !contextEl.contains(target)) {
                contextMenu.value = null;
            }

            const pickerEl = document.querySelector('[data-reaction-menu="true"]');
            if (reactionPickerMessageId.value && pickerEl && !pickerEl.contains(target)) {
                reactionPickerMessageId.value = null;
            }

        };

        const copyMessageText = (message: any) => {
            navigator.clipboard.writeText(message.message || '');
            contextMenu.value = null;
        };

        watch(
            () => chatStore.activeConversationId,
            async (id, oldId) => {
                if (!id || id === oldId) return;

                // Reset unread marker for new conversation
                firstUnreadId.value = null;

                messagesLoading.value = true;

                await chatStore.loadMessages(id, false);

                // Calculate unread anchor once after load
                firstUnreadId.value = chatStore.computeFirstUnread(id);

                messagesLoading.value = false;
                // Scroll handled by @after-enter hook on transition
            },
            { immediate: true }
        );

        watch(
            () => {
                const convId = chatStore.activeConversationId;
                if (!convId) return [];

                return chatStore.messagesByConversation[convId] || [];
            },
            async (messages, oldMessages) => {
                if (!messages) return;

                // Calculate unread count (messages not from me and not read)
                const unreadIds = messages
                    .filter(
                        (m: any) => !m.read_by_me && m.sender.id !== currentUserId.value
                    )
                    .map((m: any) => m.id);

                console.log(unreadIds.length);

                if (unreadIds.length > 0 && chatStore.activeConversationId) {
                    // Check if we are at the bottom or if it's the initial load
                    const isInitialLoad = !oldMessages || oldMessages.length === 0;

                    if (!isUserScrolledUp.value || isInitialLoad) {
                        // We are at the bottom OR just opened the chat -> Mark as read immediately
                        await markMessagesAsRead(unreadIds);

                        // Auto-scroll if it's a new incoming message (not initial load which handles its own scroll)
                        if (!isInitialLoad) {
                            scrollToBottom();
                        }
                    } else {
                        // We are scrolled up -> Don't mark as read, increment ephemeral counter
                        const newUnreadCount = unreadIds.length;
                        if (newUnreadCount > 0) {
                            unreadCountWhileScrolled.value = newUnreadCount;
                            chatStore.incrementUnread(chatStore.activeConversationId);
                        }
                    }
                }
            },
            { deep: true }
        );

        const reactionPickerMessageId = ref<number | null>(null);
        const pickerTop = ref(0); // ← ADD THIS
        const pickerLeft = ref(0);
        const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

        // Group reactions: { emoji: string, count: number, isReactedByMe: boolean }

        const openReactionPicker = (messageId: number) => {
            // Toggle close if same message

            if (reactionPickerMessageId.value === messageId) {
                reactionPickerMessageId.value = null;
                return;
            }

            reactionPickerMessageId.value = messageId;

            nextTick(() => {
                const rowEl = messageRefs.get(messageId);
                if (!rowEl) {
                    reactionPickerMessageId.value = null;
                    return;
                }

                // Get the actual bubble
                const bubbleEl = rowEl.querySelector(".rounded-2xl") as HTMLElement;
                if (!bubbleEl) {
                    reactionPickerMessageId.value = null;
                    return;
                }

                const rect = bubbleEl.getBoundingClientRect();

                const pickerHeight = 76;
                const pickerWidth = 280;
                const gap = 6;

                // Prefer above the bubble
                let top = rect.top + window.scrollY - pickerHeight - gap;

                // Flip to below if not enough space above
                if (top < window.scrollY + 10) {
                    top = rect.bottom + window.scrollY + gap;
                }

                // NEW: Left or Right alignment based on message direction
                let left: number;

                if (isSent(messages.value.find((m) => m.id === messageId))) {
                    // Sent message → align picker to the LEFT side of bubble
                    left = rect.left + window.scrollX - pickerWidth + 40; // slightly inset from edge
                } else {
                    // Received message → align picker to the RIGHT side of bubble
                    left = rect.right + window.scrollX - 40; // slightly inset from right edge
                }

                // Clamp to screen
                left = Math.max(
                    10,
                    Math.min(left, window.innerWidth - pickerWidth - 10)
                );

                pickerTop.value = top;
                pickerLeft.value = left;
            });
        };

        const addReaction = (messageId: number, emoji: string) => {
            chatStore.reactToMessage(messageId, emoji);
            reactionPickerMessageId.value = null;
        };


        onMounted(() => {
            document.addEventListener('click', closeAllPopups);
            const el = scrollContainer.value;
            if (!el) return;
            el.addEventListener("scroll", onScrollHandler);

            nextTick(() => {
                onScroll();
            });
        });

        onUnmounted(() => {
            document.removeEventListener('click', closeAllPopups);
            const el = scrollContainer.value;
            if (!el) return;
            el.removeEventListener("scroll", onScrollHandler);
        });

        return {
            isGroup,
            isSent,
            enlargedImage,
            openImageModal,
            uploadingMessages,
            sendText,
            cancelUpload,
            scrollContainer,
            messagesLoading,
            messages,
            loadingMore,
            activeConversation,
            setMessageRef,
            firstUnreadId,
            getMessageDay,
            activeStickyDate,
            showStickyDate,
            openReactionPicker,
            commonEmojis,
            reactionPickerMessageId,
            pickerTop,
            pickerLeft,
            addReaction,
            replyingTo,
            shouldShowDate,
            isMediaComposerOpen,
            queuedFiles,
            handleSendMedia,
            handleQueueFiles,
            closeComposer,
            handleFileAdd,
            dragOver,
            handleDrop,
            handleDragLeave,
            contextMenu,
            openContextMenu,
            replyToMessage,
            scrollToMessage,
            type: "audio" as const,
            copyMessageText,
            deleteMessage,
            onMessagesTransitionEnd,
            isUserScrolledUp,
            unreadCountWhileScrolled,
            scrollToBottom,

            // Video Call
            startVideoCall,
        };
    },
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@keyframes shimmer {
    0% {
        background-position: -200px 0;
    }

    100% {
        background-position: calc(200px + 100%) 0;
    }
}

.animate-pulse>*>* {
    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
}

/* Reaction Picker: Fly in from the message */
.reaction-fly-enter-active {
    transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.1);
    /* bouncy ease-out */
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
