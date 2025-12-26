<template>
  <div class="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
    <!-- Mobile Header -->
    <div
      class="sm:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Chats</h2>
      <div class="flex gap-2">
        <button
          class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 transform hover:scale-105">
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Desktop Header -->
    <div class="hidden sm:block p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Chats</h2>
          <div class="flex items-center gap-3">
            <!-- New Message Button (Blue) -->
            <button @click="$emit('new-chat')"
              class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <!-- Create Group Button (Green) -->
            <button @click="$emit('create-group')"
              class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0A5.002 5.002 0 019 5c0-1.105-.895-2-2-2m0 0a5.002 5.002 0 013.5 1.5M7 7a5 5 0 0110 0m-10 0a5 5 0 0110 0m-10 0v1" />
              </svg>
            </button>
          </div>
        </div>

        <div class="relative">
          <input type="text" v-model="chatStore.searchQuery" placeholder="Search chats..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Conversation List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
      <div class="space-y-1 px-2 py-2 sm:max-w-md sm:mx-auto sm:px-4">
        <!-- Skeleton Loader -->
        <transition name="fade">
          <div v-if="conversationsLoading" class="space-y-3">
            <div v-for="n in 8" :key="n" class="flex items-center gap-4 p-3 animate-pulse">
              <!-- Avatar Skeleton -->
              <div class="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

              <!-- Text Lines -->
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              </div>

              <!-- Time + Badge Skeleton -->
              <div class="flex flex-col items-end gap-2">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                <div class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        </transition>

        <!-- Real Conversations -->
        <transition name="fade">
          <div v-if="!conversationsLoading">
            <div v-for="conv in chatStore.filteredConversations" :key="conv.id"
              @click="chatStore.setActiveConversation(conv.id)"
              class="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              :class="{
                'bg-blue-50 dark:bg-blue-900/30': conv.id === chatStore.activeConversationId,
              }">
              <UserAvatar :avatar="conv.display_avatar" :name="conv.name" size="lg"
                :is-online="userStore.isUserOnline(chatStore.getOtherUser(conv)?.id)"
                :show-online="conv.type === 'private'" />

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">
                    {{ conv.name }}
                  </p>
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                    {{ formatTime(conv.time) }}
                  </span>
                </div>

                <div class="flex items-center justify-between mt-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400 truncate pr-2">
                    {{ chatStore.typingText(conv.id) || conv.last_message?.message || 'No messages yet' }}
                  </p>

                  <span v-if="conv.unread_count > 0"
                    class="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded-full flex-shrink-0 min-w-[20px] text-center">
                    {{ conv.unread_count > 99 ? '99+' : conv.unread_count }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { useUserStore } from "../../stores/user";
import { useChatStore } from "../../stores/chat";
import UserAvatar from "./UserAvatar.vue";

export default defineComponent({
  components: { UserAvatar },
  emits: ["select-conversation", "new-chat", "create-group"],
  setup() {
    const userStore = useUserStore();
    const chatStore = useChatStore();
    const conversationsLoading = ref(true);


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
    };
  },
});
</script>

<style scoped>
/* Fade transition for skeleton → real content */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>