<template>
  <div class="flex flex-col h-screen overflow-hidden bg-chat-surface">
    <!-- Mobile Header -->
    <div class="sm:hidden bg-chat-surface border-b border-chat-border px-4 py-3 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-chat-text">Chats</h2>
      <div class="flex gap-2">
        <button @click="$emit('new-chat')"
          class="w-9 h-9 flex items-center justify-center rounded-full bg-chat-bg text-chat-text-muted hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 transform hover:scale-105">
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Desktop Header -->
    <div class="hidden sm:block p-4 bg-chat-surface border-b border-chat-border">
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-chat-text">Chats</h2>
          <div class="flex items-center gap-3">
            <!-- Settings Icon -->
            <button @click="isSettingsOpen = true"
              class="p-2 rounded-lg hover:bg-chat-bg/50 text-chat-text-muted transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <!-- New Message Button (Blue) -->
            <button @click="$emit('new-chat')"
              class="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium text-sm hover:-translate-y-0.5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>

            <!-- Create Group Button (Green) -->
            <button @click="$emit('create-group')"
              class="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium text-sm hover:-translate-y-0.5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0A5.002 5.002 0 019 5c0-1.105-.895-2-2-2m0 0a5.002 5.002 0 013.5 1.5M7 7a5 5 0 0110 0m-10 0a5 5 0 0110 0m-10 0v1" />
              </svg>
              <span>New Group</span>
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="relative">
          <input type="text" v-model="chatStore.searchQuery" placeholder="Search chats..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-chat-bg text-chat-text placeholder-chat-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner" />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-chat-text-muted" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Conversation List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar bg-chat-surface">
      <div class="space-y-1 px-2 py-2 sm:max-w-md sm:mx-auto sm:px-4">
        <!-- Skeleton Loader -->
        <transition name="fade">
          <div v-if="conversationsLoading" class="space-y-3">
            <div v-for="n in 8" :key="n" class="flex items-center gap-4 p-3 animate-pulse">
              <div class="w-14 h-14 rounded-full bg-chat-bg/50 flex-shrink-0" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-chat-bg/50 rounded w-48" />
                <div class="h-3 bg-chat-bg/50 rounded w-32" />
              </div>
              <div class="flex flex-col items-end gap-2">
                <div class="h-3 bg-chat-bg/50 rounded w-12" />
                <div class="w-6 h-6 rounded-full bg-chat-bg/50" />
              </div>
            </div>
          </div>
        </transition>

        <!-- Real Conversations -->
        <transition name="fade">
          <div v-if="!conversationsLoading">
            <div v-for="conv in chatStore.filteredConversations" :key="conv.id"
              @click="chatStore.setActiveConversation(conv.id)"
              class="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-chat-bg/80 dark:hover:bg-gray-800/60 transition-colors group"
              :class="{
                'bg-blue-500/10 ring-1 ring-blue-500/30': conv.id === chatStore.activeConversationId,
              }">
              <UserAvatar :avatar="conv.display_avatar" size="lg"
                :is-online="userStore.isUserOnline(chatStore.getOtherUser(conv)?.id)"
                :show-online="conv.type === 'private'" :is-group="conv.type === 'group'" />

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-semibold text-chat-text truncate text-base">
                    {{ conv.name }}
                  </p>
                  <span class="text-xs text-chat-text-muted ml-2 flex-shrink-0">
                    {{ formatTime(conv.time) }}
                  </span>
                </div>

                <div class="flex items-center justify-between mt-1">
                  <p class="text-sm text-chat-text-muted truncate pr-2">
                    {{ chatStore.typingText(conv.id) || chatStore.getLastMessagePreview(conv.last_message) ||
                      'No messages yet' }}
                  </p>

                  <span v-if="conv.unread_count > 0"
                    class="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded-full flex-shrink-0 min-w-[20px] text-center">
                    {{ conv.unread_count > 99 ? '99+' : conv.unread_count }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="chatStore.filteredConversations.length === 0" class="text-center py-12 text-chat-text-muted">
              <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-5 5v-5z" />
              </svg>
              <p class="text-lg font-medium">No chats found</p>
              <p class="text-sm mt-2">Start a new conversation!</p>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Settings Offcanvas -->
    <SettingsOffcanvas :is-open="isSettingsOpen" @close="isSettingsOpen = false" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { useUserStore } from "../../stores/user";
import { useChatStore } from "../../stores/chat";
import UserAvatar from "./UserAvatar.vue";
import SettingsOffcanvas from "./SettingsOffcanvas.vue";

export default defineComponent({
  components: { UserAvatar, SettingsOffcanvas },
  emits: ["new-chat", "create-group"],
  setup() {
    const userStore = useUserStore();
    const chatStore = useChatStore();
    const conversationsLoading = ref(true);
    const isSettingsOpen = ref(false);

    const formatTime = (timestamp?: string) => {
      if (!timestamp) return "Just now";
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    onMounted(async () => {
      conversationsLoading.value = true;
      await chatStore.loadConversations();
      chatStore.conversations.forEach((c) => chatStore.startListening(c.id));
      userStore.joinPresenceChannel();
      conversationsLoading.value = false;
    });

    return {
      userStore,
      chatStore,
      conversationsLoading,
      formatTime,
      isSettingsOpen,
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
</style>