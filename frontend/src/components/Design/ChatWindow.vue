<!-- ChatWindow.vue -->
<template>
  <div class="flex flex-col h-screen bg-[#efeae2] dark:bg-gray-800">
    <!-- Header -->
    <ChatHeader />

    <transition name="fade-slide">
      <MediaComposer v-if="isMediaComposerOpen" :files="queuedFiles" @send="handleSendMedia" @close="closeComposer"
        @file-add="handleFileAdd" />
    </transition>
    <!-- Messages Area -->
    <div v-if="!isMediaComposerOpen" ref="scrollContainer" class="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
      <div class="sticky top-0 z-30 flex justify-center pointer-events-none">
        <transition enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2">
          <span v-if="showStickyDate && activeStickyDate"
            class="px-5 py-1.5 text-xs font-semibold tracking-wider uppercase text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full shadow-lg">
            {{ activeStickyDate }}
          </span>
        </transition>
      </div>

      <!-- Skeleton Loader -->
      <transition name="fade">
        <div v-if="messagesLoading" class="space-y-8 animate-pulse">
          <div v-for="n in 10" :key="n" class="flex" :class="n % 3 === 0 ? 'justify-end' : 'gap-3 items-end'">
            <!-- Avatar Skeleton (received) -->
            <div v-if="n % 3 !== 0" class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />

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
      </transition>

      <transition name="fade">
        <div v-if="!messagesLoading">
          <template v-for="(msg, index) in messages" :key="msg.id">
            <DateSeparator v-if="shouldShowDate(index)" :day="getMessageDay(msg.created_at)" />

            <MessageBubble :is-group="isGroup" :is-sent="isSent(msg)" :message="msg" :setMessageRef="setMessageRef"
              :getMessageDay="getMessageDay" @open-emoji="openReactionPicker" />
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
    </div>

    <!-- Input Area (Reply Preview + Input) -->
    <MessageInput v-if="!isMediaComposerOpen" :replyingTo="replyingTo" @send-text="sendText"
      @file-select="handleFileSelect" @cancel-reply="replyingTo = null" @open-emoji="openReactionPicker" />

    <!-- Reaction Picker Popup -->
    <!-- Reaction Picker Popup -->
    <teleport to="body">
      <transition name="reaction-fly">
        <div v-if="reactionPickerMessageId" class="fixed z-50 pointer-events-none"
          :style="{ top: pickerTop + 'px', left: pickerLeft + 'px' }">
          <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-2.5 border border-gray-200 dark:border-gray-700 flex items-center gap-2 pointer-events-auto">
            <button v-for="emoji in commonEmojis" :key="emoji" @click="addReaction(reactionPickerMessageId, emoji)"
              class="text-2xl hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-all duration-150">
              {{ emoji }}
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
  type: string;
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
  setup() {
    const chatStore = useChatStore();
    const messages = computed(() => chatStore.activeMessages);
    const isMediaComposerOpen = ref(false);

    const replyingTo = ref<{ senderName?: string; body: string } | null>(null);

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
      return msgDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const sendText = async (text: string) => {
      if (!chatStore.activeConversationId) return;
      try {
        const res = await api.post(
          `/messages/${chatStore.activeConversationId}`,
          { message: text }
        );
        chatStore.pushMessage(res.data.data);
        scrollToBottom();
      } catch (err) {
        console.error("Text send failed", err);
      }
    };

    const handleFileSelect = (files: File[]) => {
      queuedFiles.value = buildQueuedFiles(files);
      isMediaComposerOpen.value = true;
    };

    const handleFileAdd = (files: File[]) => {
      queuedFiles.value.push(...buildQueuedFiles(files));
    };

    const buildQueuedFiles = (files: File[]) => {
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
          type,
          name: file.name,
          size: file.size,
          caption: "",
        };
      });
    };

    const closeComposer = () => {
      queuedFiles.value.forEach(f => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });

      queuedFiles.value = [];
      isMediaComposerOpen.value = false;
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

      console.log(files);
      
      for (const item of files) {
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const controller = new AbortController();

        const uploadItem: UploadingMessage = {
          tempId,
          file: item.file,
          preview: item.preview,
          type: item.type,
          progress: 0,
          controller,
        };

        uploadingMessages.value.push(uploadItem);

        try {
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

      const current = getMessageDay(messages.value[index].created_at);
      const previous = getMessageDay(messages.value[index - 1].created_at);

      return current !== previous;
    };

    const openImageModal = (url: string) => {
      enlargedImage.value = url;
    };

    const scrollToFirstUnread = async () => {
      await nextTick();

      const firstUnread = messages.value.find(
        (m: any) => !m.read_by_me && m.sender.id !== currentUserId.value
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
      if (
        el.scrollTop < 200 &&
        chatStore.pagination[chatStore.activeConversationId]?.hasMore
      ) {
        // Capture current scroll position and height BEFORE loading more
        const previousHeight = el.scrollHeight;
        const previousScrollTop = el.scrollTop;

        chatStore
          .loadMessages(chatStore.activeConversationId, true)
          .finally(() => {
            nextTick(() => {
              if (!scrollContainer.value) return;

              const newHeight = scrollContainer.value.scrollHeight;

              // Adjust scroll to compensate for newly added content at the top
              scrollContainer.value.scrollTop =
                previousScrollTop + (newHeight - previousHeight);
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
      const rows = scrollContainer.value?.querySelectorAll(".message-row");

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

        return chatStore.messagesByConversation[convId] || [];
      },
      (messages) => {
        if (!messages) return;

        const unreadIds = messages
          .filter(
            (m: any) => !m.read_by_me && m.sender.id !== currentUserId.value
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

    const reactionPickerMessageId = ref<number | null>(null);
    const pickerTop = ref(0); // ← ADD THIS
    const pickerLeft = ref(0);
    const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    // Group reactions: { emoji: string, count: number, isReactedByMe: boolean }

    const openReactionPicker = (messageId: number) => {
      // Toggle close if same message
      console.log(messageId);
      
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

    // Fallback if button not found
    const positionCentered = (rect: DOMRect) => {
      const pickerHeight = 76;
      const pickerWidth = 280;
      const gap = 6;

      let top = rect.top + window.scrollY - pickerHeight - gap;
      if (top < window.scrollY + 10) {
        top = rect.bottom + window.scrollY + gap;
      }

      let left = rect.left + window.scrollX + rect.width / 2 - pickerWidth / 2;
      left = Math.max(10, Math.min(left, window.innerWidth - pickerWidth - 10));

      pickerTop.value = top;
      pickerLeft.value = left;
    };

    const addReaction = (messageId: number, emoji: string) => {
      chatStore.reactToMessage(messageId, emoji);
      reactionPickerMessageId.value = null;
    };

    const closeReactionPickerOnClickOutside = (e: MouseEvent) => {
      if (!reactionPickerMessageId.value) return;
      const picker = document.querySelector(".fixed.z-50");
      const target = e.target as Node;

      if (picker && !picker.contains(target)) {
        reactionPickerMessageId.value = null;
      }
    };

    onMounted(() => {
      document.addEventListener("click", closeReactionPickerOnClickOutside);
      const el = scrollContainer.value;
      if (!el) return;
      el.addEventListener("scroll", onScrollHandler);

      nextTick(() => {
        onScroll();
      });
    });

    onUnmounted(() => {
      document.removeEventListener("click", closeReactionPickerOnClickOutside);
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
      handleFileSelect,
      closeComposer,
      handleFileAdd,
    };
  },
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}

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
