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

                <!-- Skeleton Loader or Virtual Message List -->
                <MessageSkeleton v-if="messagesLoading" />
                <div v-else
                    :style="{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative', minHeight: '100%' }">
                    <div v-for="virtualRow in virtualizer.getVirtualItems()" :key="virtualRow.key"
                        :data-index="virtualRow.index"
                        :ref="(el: any) => { if (el?.$el || el) virtualizer.measureElement(el?.$el ?? el) }"
                        :style="{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                        }">
                        <!-- Date Separator -->
                        <DateSeparator v-if="flatItems[virtualRow.index].kind === 'date'"
                            :day="flatItems[virtualRow.index].day!" />

                        <!-- Unread Divider -->
                        <div v-else-if="flatItems[virtualRow.index].kind === 'unread'"
                            class="relative my-4 flex items-center">
                            <div class="h-px flex-grow bg-chat-border" />
                            <span class="mx-4 text-xs font-semibold uppercase tracking-wider text-chat-text-muted">
                                New messages
                            </span>
                            <div class="h-px flex-grow bg-chat-border" />
                        </div>

                        <!-- Message Bubble -->
                        <MessageBubble v-else-if="flatItems[virtualRow.index].kind === 'message'"
                            :is-group="isGroup"
                            :is-sent="isSent(flatItems[virtualRow.index].message!)"
                            :message="flatItems[virtualRow.index].message!"
                            :setMessageRef="setMessageRef"
                            :getMessageDay="getMessageDay"
                            @open-emoji="openReactionPicker"
                            @open-actions="openContextMenu"
                            @scroll-to-message="scrollToMessage" />

                        <!-- Uploading Message -->
                        <MessageBubble v-else-if="flatItems[virtualRow.index].kind === 'uploading'"
                            :is-group="isGroup"
                            :is-sent="true"
                            :message="{
                                type: flatItems[virtualRow.index].upload!.type,
                                message: '',
                                file_path: flatItems[virtualRow.index].upload!.preview,
                                file_name: flatItems[virtualRow.index].upload!.file.name,
                                file_size: flatItems[virtualRow.index].upload!.file.size,
                            }"
                            :setMessageRef="setMessageRef"
                            :getMessageDay="getMessageDay"
                            :is-uploading="true"
                            :upload-progress="flatItems[virtualRow.index].upload!.progress"
                            @cancel-upload="cancelUpload(flatItems[virtualRow.index].upload!)" />
                    </div>
                </div>

                <!-- Drag & Drop Overlay -->
                <DragDropOverlay :visible="dragOver" />
            </div>

            <!-- Go to Bottom Button -->
            <ScrollToBottomButton :visible="isUserScrolledUp" :unread-count="unreadCountWhileScrolled"
                @click="scrollToBottom" />
        </div>

        <!-- Input Area (Reply Preview + Input) -->
        <MessageInput ref="messageInputRef" v-show="!isMediaComposerOpen" :replyingTo="replyingTo" @send-text="sendText"
            @queue-files="handleQueueFiles" @cancel-reply="replyingTo = null" @open-emoji="openReactionPicker" />



        <!-- Reaction Picker Popup -->
        <ReactionPicker :message-id="reactionPickerMessageId"
            :position="{ top: pickerTop, left: pickerLeft }" @react="addReaction" />
        <!-- Right-Click Context Menu -->
        <MessageContextMenu :menu="contextMenu" :is-own="contextMenu ? isSent(contextMenu.message) : false"
            @reply="replyToMessage" @delete="deleteMessage" @close="contextMenu = null" />
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
import { useChatStore } from "../../stores/chat";
import * as chatApi from "../../services/chatApi";
import type { Message, QueuedFile, UploadingMessage } from "../../types/chat";
import { useVirtualizer } from "@tanstack/vue-virtual";

import { useThrottleFn } from "@vueuse/core";
import { useConfirmDialog } from "../../composables/useConfirmDialog";
import { useToaster } from "../../composables/useToaster";

interface VirtualChatItem {
    id: string;
    kind: 'date' | 'unread' | 'message' | 'uploading';
    message?: Message;
    upload?: UploadingMessage;
    day?: string;
}
import ChatHeader from "./ChatHeader.vue";
import MessageBubble from "./MessageBubble.vue";
import { useUserStore } from "../../stores/user";
import MessageInput from "./MessageInput.vue";
import DateSeparator from "./DateSeparator.vue";
import MediaComposer from "./MediaComposer.vue";
import MessageSkeleton from "./MessageSkeleton.vue";
import DragDropOverlay from "./DragDropOverlay.vue";
import ScrollToBottomButton from "./ScrollToBottomButton.vue";
import ReactionPicker from "./ReactionPicker.vue";
import MessageContextMenu from "./MessageContextMenu.vue";


const queuedFiles = ref<QueuedFile[]>([]);

export default defineComponent({
    components: { MessageBubble, ChatHeader, MessageInput, DateSeparator, MediaComposer, MessageSkeleton, DragDropOverlay, ScrollToBottomButton, ReactionPicker, MessageContextMenu },
    emits: ['start-call'],
    setup(_, { emit }) {
        const chatStore = useChatStore();
        const toaster = useToaster();
        const { confirm: confirmDialog } = useConfirmDialog();
        const messages = computed(() => chatStore.activeMessages);
        const isMediaComposerOpen = ref(false);
        const dragOver = ref(false);

        const contextMenu = ref<{
            message: Message;
            x: number;
            y: number;
        } | null>(null);

        const deleteMessage = async (messageId: number) => {
            const confirmed = await confirmDialog({
                title: 'Delete Message',
                message: 'Are you sure you want to delete this message? This cannot be undone.',
                confirmText: 'Delete',
                variant: 'danger',
            });
            if (!confirmed) return;
            try {
                await chatApi.deleteMessage(messageId);
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

        // Virtual scroll: build flat item list
        const flatItems = computed<VirtualChatItem[]>(() => {
            const items: VirtualChatItem[] = [];
            const msgs = messages.value;
            for (let i = 0; i < msgs.length; i++) {
                const msg = msgs[i];
                // Date separator
                if (shouldShowDate(i)) {
                    items.push({ id: `date-${i}-${msg.created_at}`, kind: 'date', day: getMessageDay(msg.created_at) });
                }
                // Unread divider
                if (msg.id === firstUnreadId.value) {
                    items.push({ id: 'unread-divider', kind: 'unread' });
                }
                // Message
                items.push({ id: `msg-${msg.id}`, kind: 'message', message: msg });
            }
            // Uploading messages
            for (const upload of uploadingMessages.value) {
                items.push({ id: `upload-${upload.tempId}`, kind: 'uploading', upload });
            }
            return items;
        });

        const virtualizer = useVirtualizer(computed(() => ({
            count: flatItems.value.length,
            getScrollElement: () => scrollContainer.value,
            estimateSize: () => 80,
            overscan: 15,
            getItemKey: (index: number) => flatItems.value[index]?.id ?? index,
        })));


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

        const isSent = (msg: Message) => msg.sender?.id === currentUserId.value;

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
                const msg = await chatApi.sendTextMessage(
                    chatStore.activeConversationId,
                    text,
                    replyingTo.value?.id
                );

                chatStore.pushMessage(msg);
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
            queuedFiles.value.forEach(f => {
                if (f.preview) {
                    URL.revokeObjectURL(f.preview);
                }
            });

            queuedFiles.value = [];
            isMediaComposerOpen.value = false;

            nextTick(() => {
                setTimeout(() => {
                    messageInputRef.value?.focusInput();
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
                    const msg = await chatApi.sendFileMessage(
                        chatStore.activeConversationId!,
                        item.file,
                        {
                            type: item.type,
                            caption: item.caption,
                            signal: controller.signal,
                            onUploadProgress: (percent) => {
                                uploadingMessages.value = uploadingMessages.value.map(m =>
                                    m.tempId === tempId ? { ...m, progress: percent } : m
                                );
                            },
                        }
                    );

                    chatStore.pushMessage(msg);
                    scrollToBottom();

                    setTimeout(() => {
                        uploadingMessages.value = uploadingMessages.value.filter(m => m.tempId !== tempId);
                    }, 1000);
                } catch (err: unknown) {
                    uploadingMessages.value = uploadingMessages.value.filter(
                        (m) => m.tempId !== tempId
                    );

                    if (uploadItem.preview) {
                        URL.revokeObjectURL(uploadItem.preview);
                    }

                    if (err instanceof Error && err.name !== "AbortError") {
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
                await chatApi.markMessagesAsRead(chatStore.activeConversationId, messageIds);

                const msgs = messages.value;
                if (msgs) {
                    msgs.forEach((m) => {
                        if (messageIds.includes(m.id)) {
                            m.read_by_me = true;
                        }
                    });
                }

                chatStore.clearUnread(chatStore.activeConversationId);
                unreadCountWhileScrolled.value = 0;
            } catch (error) {
                console.error('Failed to mark messages as read:', error);
            }
        };

        const scrollToBottom = async () => {

            // Mark visible unread messages as read immediately since we are jumping to bottom
            const unreadIds = messages.value
                .filter((m) => !m.read_by_me && m.sender.id !== currentUserId.value)
                .map((m) => m.id);

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

            // Use virtualizer to scroll to the last item
            const count = flatItems.value.length;
            if (count > 0) {
                virtualizer.value.scrollToIndex(count - 1, { align: 'end' });
                // Run again after measurement settles
                requestAnimationFrame(() => {
                    virtualizer.value.scrollToIndex(count - 1, { align: 'end' });
                });
            }
        };

        const onMessagesTransitionEnd = () => {
            scrollToFirstUnread();
        };

        // When messages finish loading, scroll to unread or bottom
        watch(messagesLoading, (loading, wasLoading) => {
            if (wasLoading && !loading) {
                nextTick(() => scrollToFirstUnread());
            }
        });

        const scrollToMessage = async (messageId: number) => {
            await nextTick();

            // Find the index of this message in the flat list
            const index = flatItems.value.findIndex(
                item => item.kind === 'message' && item.message?.id === messageId
            );

            if (index >= 0) {
                virtualizer.value.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
            }

            // Highlight flash after scroll settles
            await nextTick();
            setTimeout(() => {
                const el = messageRefs.get(messageId);
                if (!el) return;
                el.classList.add(
                    'bg-blue-100',
                    'dark:bg-blue-900/30',
                    'transition-all',
                    'duration-1000'
                );
                setTimeout(() => {
                    el.classList.remove('bg-blue-100', 'dark:bg-blue-900/30');
                }, 2000);
            }, 300);
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
                        .filter((m) => !m.read_by_me && m.sender.id !== currentUserId.value)
                        .map((m) => m.id);
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
                // Capture the first visible item's message ID before loading
                const firstVisibleItem = virtualizer.value.getVirtualItems()[0];
                const firstVisibleKey = firstVisibleItem ? flatItems.value[firstVisibleItem.index]?.id : null;

                chatStore.loadMessages(chatStore.activeConversationId, true).then(() => {
                    if (!firstVisibleKey) return;
                    // After new messages prepended, find the old first-visible item's new index
                    nextTick(() => {
                        const newIndex = flatItems.value.findIndex(item => item.id === firstVisibleKey);
                        if (newIndex >= 0) {
                            virtualizer.value.scrollToIndex(newIndex, { align: 'start' });
                        }
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
            const virtualItems = virtualizer.value.getVirtualItems();
            if (!virtualItems.length) return;

            // Find the first visible message-type item to determine sticky date
            for (const vItem of virtualItems) {
                const item = flatItems.value[vItem.index];
                if (item?.kind === 'message' && item.message) {
                    const day = getMessageDay(item.message.created_at);
                    if (day && day !== activeStickyDate.value) {
                        activeStickyDate.value = day;
                    }
                    break;
                }
            }
        };

        const openContextMenu = (e: MouseEvent, message: Message) => {
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
                toaster.warning("Can only call in private conversations.");
                return;
            }

            // Emit to parent (ChatLayout) to handle the global call logic
            emit('start-call', other.id);
        };

        const replyToMessage = (message: Message) => {
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
                        (m) => !m.read_by_me && m.sender.id !== currentUserId.value
                    )
                    .map((m) => m.id);

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
            uploadingMessages,
            flatItems,
            virtualizer: virtualizer as any,
            sendText,
            cancelUpload,
            scrollContainer,
            messageInputRef,
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
            deleteMessage,
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

</style>
