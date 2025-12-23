<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-slate-900 overflow-hidden">
    <!-- Header -->
    <div
      class="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 shadow-sm">
      <div class="flex items-center gap-3">
        <button v-if="isMobileView" @click="$emit('back')"
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
          <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="relative flex-shrink-0">
          <div
            class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
            {{ activeConversation.initials }}
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white truncate">
            {{ activeConversation.name }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span v-if="isGroup">
              {{ activeConversation.users.length }} members
            </span>
            <span v-else class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" :class="isOnline ? 'bg-green-500' : 'bg-gray-400'" />
              {{ isOnline ? 'Online' : 'Offline' }}
            </span>
          </p>
          <!-- Typing Indicator -->
          <p v-if="typingText" class="text-xs text-blue-500 dark:text-blue-400 italic mt-1 animate-pulse">
            {{ typingText }}
          </p>
        </div>
      </div>
    </div>

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

              <!-- Date separator (normal, non-sticky, elegant line) -->
              <div v-if="index === 0 || getMessageDay(msg.created_at) !== getMessageDay(messages[index - 1].created_at)"
                class="relative my-2 text-center">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <span
                  class="relative px-4 bg-white dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ getMessageDay(msg.created_at) }}
                </span>
              </div>

              <!-- Unread Divider -->
              <div v-if="msg.id === firstUnreadId" class="relative my-4 flex items-center">
                <div class="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                <span class="
                        mx-4
                        text-xs font-semibold uppercase tracking-wider
                        text-gray-500 dark:text-gray-400
                      ">
                  New messages
                </span>
                <div class="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
              </div>

              <div :ref="el => setMessageRef(msg.id, el)" :data-day="getMessageDay(msg.created_at)"
                class="flex message-row" :class="{ 'justify-end': isSent(msg) }">

                <!-- Received Message -->
                <div v-if="!isSent(msg)" class="flex gap-3 max-w-[75%]">
                  <div
                    class="received-bubble bg-white dark:bg-slate-800 rounded-2xl shadow-sm px-4 py-2 flex flex-col gap-1 w-fit max-w-full">

                    <!-- Image -->
                    <img v-if="msg.type === 'image' && msg.file_path" :src="msg.file_path"
                      class="rounded-xl max-w-[250px] cursor-pointer" @click="openImageModal(msg.file_path)" />

                    <!-- Video -->
                    <video v-else-if="msg.type === 'video' && msg.file_path" controls
                      class="rounded-xl max-w-[250px] w-full">
                      <source :src="msg.file_path" :type="msg.mime_type" />
                    </video>

                    <!-- File -->
                    <a v-else-if="msg.type === 'file' && msg.file_path" :href="msg.file_path" :download="msg.file_name"
                      class="flex items-center gap-3 w-full bg-gray-100 dark:bg-slate-700 rounded-xl p-2 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                      <svg class="w-6 h-6 flex-shrink-0 text-gray-600 dark:text-gray-300" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>

                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">{{ msg.file_name }}</p>
                        <p class="text-xs opacity-70">{{ formatFileSize(msg.file_size) }}</p>
                      </div>

                      <svg class="w-5 h-5 flex-shrink-0 text-gray-600 dark:text-gray-300" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>

                    <!-- Text -->
                    <p v-if="msg.message" class="text-sm break-words leading-relaxed text-gray-900 dark:text-gray-100">
                      {{ msg.message }}
                    </p>

                    <!-- Time -->
                    <div class="flex justify-end">
                      <span class="text-[11px] opacity-60 whitespace-nowrap min-w-max">
                        {{ formatTime(msg.created_at) }}
                      </span>
                    </div>

                  </div>
                </div>

                <!-- Sent Message -->
                <div v-else class="max-w-[75%]">
                  <div
                    class="sent-bubble bg-blue-500 text-white rounded-2xl shadow-sm px-4 py-2 flex flex-col gap-1 w-fit max-w-full">

                    <!-- Image -->
                    <img v-if="msg.type === 'image' && msg.file_path" :src="msg.file_path"
                      class="rounded-xl max-w-[250px] cursor-pointer" @click="openImageModal(msg.file_path)" />

                    <!-- Video -->
                    <video v-else-if="msg.type === 'video' && msg.file_path" controls
                      class="rounded-xl max-w-[250px] w-full">
                      <source :src="msg.file_path" :type="msg.mime_type" />
                    </video>

                    <!-- File -->
                    <a v-else-if="msg.type === 'file' && msg.file_path" :href="msg.file_path" :download="msg.file_name"
                      class="flex items-center gap-3 w-full bg-blue-600/20 rounded-xl p-2 hover:bg-blue-600/30 transition">
                      <svg class="w-6 h-6 flex-shrink-0 opacity-90" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>

                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">{{ msg.file_name }}</p>
                        <p class="text-xs opacity-70">{{ formatFileSize(msg.file_size) }}</p>
                      </div>

                      <svg class="w-5 h-5 flex-shrink-0 opacity-90" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>

                    <!-- Text -->
                    <p v-if="msg.message" class="text-sm break-words leading-relaxed">
                      {{ msg.message }}
                    </p>

                    <!-- Time -->
                    <div class="flex justify-end items-center gap-1">
                      <span class="text-[11px] opacity-60">
                        {{ formatTime(msg.created_at) }}
                      </span>

                      <!-- READ RECEIPT -->
                      <span v-if="isSent(msg)" class="text-[11px]"
                        :class="msg.read_by_count > 0 ? 'text-white' : 'text-white/60'">
                        {{ msg.read_by_count > 0 ? '✓✓' : '✓' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Uploading messages (optimistic UI) -->
              <div v-for="upload in uploadingMessages" :key="upload.tempId" class="flex justify-end">
                <div class="max-w-[75%] relative">
                  <div
                    class="sent-bubble bg-blue-500 text-white rounded-2xl shadow-sm px-4 py-2 flex flex-col gap-2 w-fit max-w-full relative">

                    <!-- Preview for image/video -->
                    <div v-if="upload.preview" class="relative">
                      <img v-if="upload.type === 'image'" :src="upload.preview"
                        class="rounded-xl max-w-[250px] opacity-70" />
                      <video v-else-if="upload.type === 'video'" :src="upload.preview"
                        class="rounded-xl max-w-[250px] w-full opacity-70" muted />

                      <!-- Progress overlay -->
                      <div class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                        <div class="relative">
                          <!-- Circular Progress -->
                          <svg class="w-16 h-16 -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.3)" stroke-width="6"
                              fill="none" />
                            <circle cx="32" cy="32" r="28" stroke="white" stroke-width="6" fill="none"
                              :stroke-dasharray="uploadCircumference"
                              :stroke-dashoffset="uploadCircumference - (upload.progress / 100) * uploadCircumference"
                              class="transition-all duration-300" />
                          </svg>
                          <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-white font-medium text-sm">{{ upload.progress }}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- File upload (no preview) -->
                    <div v-else class="flex items-center gap-3 opacity-70">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">{{ upload.file.name }}</p>
                        <p class="text-xs opacity-70">{{ formatFileSize(upload.file.size) }}</p>
                      </div>
                    </div>

                    <!-- Progress bar for non-preview uploads -->
                    <div v-if="!upload.preview" class="w-full bg-white/20 rounded-full h-2 mt-2">
                      <div class="bg-white h-2 rounded-full transition-all duration-300"
                        :style="{ width: upload.progress + '%' }" />
                    </div>

                    <!-- Cancel button -->
                    <button @click="cancelUpload(upload)"
                      class="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110"
                      title="Cancel upload">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </template>
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
</template>

<script lang="ts">
import { defineComponent, ref, nextTick, watch, onMounted, computed, onUnmounted } from "vue";
import { api } from "../axios";
import { useUserStore } from "../stores/user";
import { useChatStore } from "../stores/chat";

import MessageInput from "./MessageInput.vue";
import type { AxiosProgressEvent } from 'axios';
import { useThrottleFn } from '@vueuse/core';

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
  components: { MessageInput },
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
    const UPLOAD_RADIUS = 28;
    const uploadCircumference = 2 * Math.PI * UPLOAD_RADIUS;
    const isGroup = computed(() => activeConversation.value?.type === "group");
    const messagesLoading = ref(true);

    const typingText = computed(() => chatStore.typingText(chatStore.activeConversationId));

    const activeConversation = computed(() => {
      const convId = chatStore.activeConversationId;
      return convId
        ? chatStore.conversations.find(c => c.id === convId) || null
        : null;
    });

    const otherUser = computed(() => activeConversation.value ? chatStore.getOtherUser(activeConversation.value) : null);
    const isOnline = computed(() => otherUser.value && userStore.isUserOnline(otherUser.value.id))

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

    const formatTime = (timestamp?: string) => {
      if (!timestamp) return "Just now";

      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

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


    const formatFileSize = (bytes?: number) => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
          type: fileObj.type,
          progress: 0,
          controller,
        };
        uploadingMessages.value.push(uploadItem);
        try {
          const form = new FormData();
          form.append("file", fileObj.file);
          form.append("type", fileObj.type.startsWith('image/') ? 'image' : fileObj.type.startsWith('video/') ? 'video' : 'file');
          const res = await api.post(`/messages/${chatStore.activeConversationId}`, form, {
            signal: controller.signal,
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                uploadItem.progress = percent;
                uploadingMessages.value = [...uploadingMessages.value];
              }
            },
          });
          chatStore.pushMessage(res.data.data);
          scrollToBottom();
          if (uploadItem.preview) {
            URL.revokeObjectURL(uploadItem.preview);
          }
          setTimeout(() => {
            uploadingMessages.value = uploadingMessages.value.filter(m => m.tempId !== tempId);
          }, 1000);
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error("Upload failed", err);
          }
          uploadingMessages.value = uploadingMessages.value.filter(m => m.tempId !== tempId);
          if (uploadItem.preview) {
            URL.revokeObjectURL(uploadItem.preview);
          }
        }
      }
      scrollToBottom();
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

    return {
      isMobileView,
      isGroup,
      isSent,
      formatFileSize,
      formatTime,
      enlargedImage,
      openImageModal,
      uploadingMessages,
      sendText,
      queueFiles,
      cancelUpload,
      scrollContainer,
      uploadCircumference,
      messagesLoading,
      messages,
      loadingMore,
      activeConversation,
      typingText,
      setMessageRef,
      firstUnreadId,
      getMessageDay,
      activeStickyDate,
      showStickyDate,
      isOnline,
    };
  },
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