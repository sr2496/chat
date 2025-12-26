<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-slate-900 overflow-visible">
    <!-- Header -->

    <ChatHeader :key="activeConversation.id" />


    <!-- Messages Area - Scrollable -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 custom-scrollbar" ref="scrollContainer">
      <div class="max-w-4xl mx-auto w-full h-full flex flex-col">

        <!-- Loading more older messages (at top) -->
        <div v-if="loadingMore" class="flex justify-center py-3">
          <svg class="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>

        <!-- Main messages area: takes full height and pushes content to bottom -->
        <div class="flex-1 flex flex-col justify-end space-y-4 pb-4">

          <!-- Skeleton loader when first loading -->
          <div v-if="messagesLoading && messages.length === 0" class="space-y-4 px-4">
            <div v-for="i in 6" :key="i" class="flex" :class="i % 2 === 0 ? 'justify-end' : 'justify-start'">
              <div class="rounded-lg p-4 max-w-xs animate-pulse"
                :class="i % 2 === 0 ? 'bg-blue-300 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'">
                <div class="h-4 rounded w-32 bg-current opacity-40"></div>
                <div v-if="i % 2 !== 0" class="h-4 rounded w-24 bg-current opacity-40 mt-2"></div>
              </div>
            </div>
          </div>

          <!-- Actual messages -->
          <div v-else class="space-y-4">
            <!-- Always visible sticky date header at the top -->
            <div class="sticky top-0 z-30 flex justify-center pointer-events-none">
              <transition enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2">
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

            <template v-for="(msg, index) in messages" :key="msg.id">

              <!-- Date separator -->
              <DateSeparator
                v-if="index === 0 || getMessageDay(msg.created_at) !== getMessageDay(messages[index - 1].created_at)"
                :day="getMessageDay(msg.created_at)" />

              <!-- Unread Divider -->
              <div v-if="msg.id === firstUnreadId" class="relative my-4 flex items-center">
                <div class="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                <span class="mx-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  New messages
                </span>
                <div class="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
              </div>

              <!-- Message row with optional avatar + name for group chats -->
              <div class="flex items-end gap-3 px-4" :class="isSent(msg) ? 'flex-row-reverse' : 'flex-row'">

                <!-- Avatar (only shown for received messages in group chats) -->
                <div v-if="!isSent(msg) && isGroup" class="flex-shrink-0 mb-6">
                  <!-- Actual image if available -->
                  <img v-if="msg.sender.avatar" :src="msg.sender.avatar" alt="Avatar"
                    class="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600" />

                  <!-- Fallback: Initial letter circle if no avatar -->
                  <div v-else
                    class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm shadow-sm border border-blue-600 dark:border-blue-400">
                    {{ (msg.sender.name || '?').charAt(0).toUpperCase() }}
                  </div>
                </div>

                <!-- Spacer for sent messages to keep bubble alignment -->
                <div v-else-if="isGroup" class="w-8 flex-shrink-0"></div>

                <!-- Message content column -->
                <div class="flex flex-col" :class="isSent(msg) ? 'items-end' : 'items-start'">

                  <!-- Sender name (only in group chat + not own message) -->
                  <span v-if="!isSent(msg) && isGroup" class="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                    {{ msg.sender.name }}
                  </span>

                  <!-- The actual message bubble -->
                  <MessageBubble :msg="msg" :isSent="isSent(msg)" :setMessageRef="setMessageRef"
                    :getMessageDay="getMessageDay" @openImage="openImageModal" @openReaction="openReactionPicker" />
                </div>
              </div>

            </template>

            <!-- Uploading messages (optimistic UI) -->
            <UploadingMessage v-for="upload in uploadingMessages" :key="upload.tempId" :upload="upload"
              @cancel="cancelUpload" />
          </div>
        </div>
      </div>
    </div>

    <!-- Input - Fixed at bottom -->
    <div class="flex-shrink-0">
      <MessageInput @send-text="sendText" @queue-files="queueFiles" />
    </div>

    <!-- Image Modal -->
    <div v-if="enlargedImage" @click.self="enlargedImage = null"
      class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <img :src="enlargedImage" class="max-w-full max-h-full rounded-xl" />
    </div>
  </div>
  <!-- Reaction Picker - Positioned near the message -->
  <teleport to="#teleport-root">
    <div v-if="reactionPickerMessage" class="absolute pointer-events-auto"
      :style="{ top: pickerTop + 'px', left: pickerLeft + 'px' }">
      <div
        class="pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-2 border border-gray-200 dark:border-slate-700"
        @click.stop>
        <div class="grid grid-cols-5 gap-3 max-h-80 custom-scrollbar">
          <button v-for="emoji in commonEmojis" :key="emoji" @click="react(reactionPickerMessage.id, emoji)"
            class="text-2xl hover:scale-125 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg p-2 transition transform">
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick, watch, onMounted, computed, onUnmounted } from "vue";
import { api } from "../axios";
import { useUserStore } from "../stores/user";
import { useChatStore } from "../stores/chat";

import MessageInput from "./MessageInput.vue";
import { useThrottleFn } from '@vueuse/core';
import ChatHeader from "./Chat/ChatHeader.vue";
import UploadingMessage from "./Chat/UploadingMessage.vue";
import MessageBubble from "./Chat/MessageBubble.vue";

interface QueuedFile {
  file: File;
  preview?: string;
  type: string;
}
interface UploadingMessage {
  tempId: string;
  file: File;
  preview?: string;
  type: string;
  progress: number;
  controller: AbortController;
}

export default defineComponent({
  components: { ChatHeader, MessageBubble, MessageInput, UploadingMessage },
  setup() {

    const chatStore = useChatStore();
    const messages = computed(() => chatStore.activeMessages);

    const loadingMore = computed(() => {
      const convId = chatStore.activeConversationId;
      return convId ? chatStore.pagination[convId]?.loading : false;
    });

    const scrollContainer = ref<HTMLElement | null>(null);
    const messageRefs = new Map<number, HTMLElement>();
    const enlargedImage = ref<string | null>(null);

    const isMobileView = ref(window.innerWidth < 768);
    const userStore = useUserStore();

    const currentUserId = computed(() => userStore.user?.id);
    const uploadingMessages = ref<UploadingMessage[]>([]);
    const isGroup = computed(() => activeConversation.value?.type === "group");
    const messagesLoading = ref(true);

    const activeConversation = computed(() => {
      const convId = chatStore.activeConversationId;
      return convId
        ? chatStore.conversations.find(c => c.id === convId) || null
        : null;
    });

    const firstUnreadId = computed(() => {
      const convId = chatStore.activeConversationId;
      return convId
        ? chatStore.firstUnreadByConversation[convId] || null
        : null;
    });

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
      yesterday.setDate(today.getDate() - 1);

      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      if (isSameDay(msgDate, today)) return "Today";
      if (isSameDay(msgDate, yesterday)) return "Yesterday";

      // Format like "Dec 20, 2025"
      return msgDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    };


    const sendText = async (text: string) => {
      if (!chatStore.activeConversationId) return;
      try {
        const res = await api.post(`/messages/${chatStore.activeConversationId}`, { message: text });
        chatStore.pushMessage(res.data.data);
        scrollToBottom();
      } catch (err) {
        console.error("Text send failed", err);
      }
    };

    const react = (messageId: number, emoji: string) => {

      chatStore.reactToMessage(messageId, emoji)
    }

    const queueFiles = async (files: QueuedFile[]) => {
      if (!chatStore.activeConversationId) return;

      for (const fileObj of files) {
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const controller = new AbortController();

        const uploadItem: UploadingMessage = {
          tempId,
          file: fileObj.file,
          preview: fileObj.preview,
          type: fileObj.file.type.startsWith('image/')
            ? 'image'
            : fileObj.file.type.startsWith('video/')
              ? 'video'
              : 'file',
          progress: 0,
          controller,
        };

        uploadingMessages.value.push(uploadItem);

        try {
          const form = new FormData();
          form.append('file', fileObj.file);
          form.append('type', uploadItem.type);

          const res = await api.post(
            `/messages/${chatStore.activeConversationId}`,
            form,
            {
              signal: controller.signal,
              onUploadProgress: (e) => {
                if (!e.total) return;

                const percent = Math.round((e.loaded * 100) / e.total);

                uploadingMessages.value = uploadingMessages.value.map(item =>
                  item.tempId === tempId
                    ? { ...item, progress: percent }
                    : item
                );
              },
            }
          );

          chatStore.pushMessage(res.data.data);
          scrollToBottom();

          setTimeout(() => {
            // if (uploadItem.preview) {
            //   URL.revokeObjectURL(uploadItem.preview);
            // }
            uploadingMessages.value = uploadingMessages.value.filter(
              m => m.tempId !== tempId
            );
          }, 1000);
        } catch (err: any) {
          uploadingMessages.value = uploadingMessages.value.filter(
            m => m.tempId !== tempId
          );

          if (uploadItem.preview) {
            URL.revokeObjectURL(uploadItem.preview);
          }

          if (err.name !== 'AbortError') {
            console.error('Upload failed', err);
          }
        }
      }
    };


    const cancelUpload = (item: UploadingMessage) => {
      item.controller.abort();
      uploadingMessages.value = uploadingMessages.value.filter(m => m.tempId !== item.tempId);
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    };

    const openImageModal = (url: string) => {
      enlargedImage.value = url;
    };

    const scrollToFirstUnread = async () => {
      await nextTick();

      const firstUnread = messages.value.find(
        (m: any) =>
          !m.read_by_me &&
          m.sender.id !== currentUserId.value
      );

      if (!firstUnread) {
        scrollToBottom();
        return;
      }

      const el = messageRefs.get(firstUnread.id);
      if (el && scrollContainer.value) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };

    const scrollToBottom = async () => {
      await nextTick();

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

    const handleScroll = () => {
      const el = scrollContainer.value;
      if (!el || loadingMore.value || !chatStore.activeConversationId) return;

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

    const activeStickyDate = ref(null);

    const onScroll = () => {

      const rows = scrollContainer.value?.querySelectorAll('.message-row');
      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        if (rect.top >= 0) {
          const day = row.dataset.day;
          if (day && day !== activeStickyDate.value) {
            activeStickyDate.value = day;
          }
          break;
        }
      }
    };

    watch(
      () => chatStore.activeConversationId,
      async (id, oldId) => {

        if (!id || id === oldId) return;

        messagesLoading.value = true;

        await chatStore.loadMessages(id, false);

        messagesLoading.value = false;

        await nextTick();
        scrollToFirstUnread();
      },
      { immediate: true }
    );

    watch(
      () => {
        const convId = chatStore.activeConversationId;
        if (!convId) return [];

        return chatStore.messagesByConversation[convId] || []
      },
      (messages) => {

        if (!messages) return;

        const unreadIds = messages
          .filter(
            (m: any) =>
              !m.read_by_me &&
              m.sender.id !== currentUserId.value
          )
          .map((m: any) => m.id);

        if (unreadIds.length) {
          api.post("/messages/read", {
            conversation_id: chatStore.activeConversationId,
            message_ids: unreadIds,
          });
        }
      },
      { deep: true }
    );

    onMounted(() => {
      const el = scrollContainer.value;
      if (!el) return;
      el.addEventListener('scroll', onScrollHandler);

      nextTick(() => {
        onScroll();
      });
    });

    onUnmounted(() => {
      const el = scrollContainer.value;
      if (!el) return;
      el.removeEventListener('scroll', onScrollHandler);
    });

    const reactionPickerMessage = ref<any | null>(null);
    const pickerTop = ref(0);      // ← ADD THIS
    const pickerLeft = ref(0);
    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢'];

    // Group reactions: { emoji: string, count: number, isReactedByMe: boolean }


    const openReactionPicker = (msg: any) => {
      reactionPickerMessage.value = msg;

      nextTick(() => {
        const rowEl = messageRefs.get(msg.id);
        if (!rowEl) return;

        const rect = rowEl.getBoundingClientRect();

        const pickerHeight = 400; // approx height including padding
        const pickerWidth = 380;
        const gap = 16; // space between message and picker

        // Calculate desired top: above the message
        let desiredTop = rect.top + window.scrollY - pickerHeight - gap;

        // if (desiredTop + pickerHeight > window.innerHeight) {
        //   desiredTop = rect.top + window.scrollY - pickerHeight - gap;
        // }

        // If there's not enough space above, place below instead
        if (desiredTop < window.scrollY + 20) {
          desiredTop = rect.bottom + window.scrollY + gap;
        }

        pickerTop.value = desiredTop;

        // Horizontal centering
        let desiredLeft = rect.left + window.scrollX + rect.width / 2 - pickerWidth / 2;

        // Clamp to viewport edges
        const viewportWidth = window.innerWidth;
        if (desiredLeft < 16) desiredLeft = 16;
        if (desiredLeft + pickerWidth > viewportWidth - 16) {
          desiredLeft = viewportWidth - pickerWidth - 16;
        }

        pickerLeft.value = desiredLeft;
      });
    };

    return {
      isMobileView,
      isGroup,
      isSent,
      enlargedImage,
      openImageModal,
      uploadingMessages,
      sendText,
      queueFiles,
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
      reactionPickerMessage,
      pickerTop,
      pickerLeft,
      react,
    };
  },
});
</script>

<style scoped>

/* Sent message tail */
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