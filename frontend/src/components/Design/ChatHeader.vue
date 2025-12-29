<!-- ChatHeader.vue -->
<template>
  <div
    class="bg-chat-surface dark:bg-gray-900 shadow-sm px-4 py-4 flex items-center justify-between border-b border-chat-border">
    <div class="flex items-center gap-3">
      <!-- Avatar -->
      <UserAvatar :avatar="activeConversation?.display_avatar" size="md" :is-online="isOnline"
        :show-online="activeConversation?.type === 'private'" :is-group="activeConversation?.type === 'group'" />

      <!-- Name + Status -->
      <div class="flex flex-col">
        <h2 class="font-semibold text-chat-text text-lg">
          {{ activeConversation?.name || "Chat" }}
        </h2>

        <!-- Status Text -->
        <p class="text-xs text-chat-text-muted mt-0.5">
          <!-- Typing overrides everything -->
          <span v-if="isTyping" class="italic">typing...</span>

          <!-- Private chat: Online / Last seen -->
          <span v-else-if="!isGroup">
            <span v-if="isOnline" class="text-green-600 dark:text-green-400 font-medium">Online</span>
            <span v-else>Last seen recently</span>
          </span>

          <!-- Group chat: Member count -->
          <span v-else>
            {{ activeConversation?.users?.length || 0 }} members
          </span>
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-2">
      <button class="p-2.5 rounded-full hover:bg-chat-bg/50 dark:hover:bg-gray-800 transition">
        <svg class="w-5 h-5 text-chat-text-muted dark:text-gray-400" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </button>

      <button class="p-2.5 rounded-full hover:bg-chat-bg/50 dark:hover:bg-gray-800 transition">
        <svg class="w-5 h-5 text-chat-text-muted dark:text-gray-400" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 00.75 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </button>

      <button class="p-2.5 rounded-full hover:bg-chat-bg/50 dark:hover:bg-gray-800 transition">
        <svg class="w-5 h-5 text-chat-text-muted dark:text-gray-400" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useChatStore } from "../../stores/chat";
import { useUserStore } from "../../stores/user";
import UserAvatar from "./UserAvatar.vue";

const chatStore = useChatStore();
const userStore = useUserStore();

const activeConversation = computed(() => {
  const convId = chatStore.activeConversationId;
  return convId
    ? chatStore.conversations.find((c) => c.id === convId) || null
    : null;
});

const isGroup = computed(() => activeConversation.value?.type === "group");

const otherUser = computed(() => {
  if (!activeConversation.value || isGroup.value) return null;
  return chatStore.getOtherUser(activeConversation.value);
});

const isOnline = computed(() => {
  return otherUser.value ? userStore.isUserOnline(otherUser.value.id) : false;
});

const isTyping = computed(() => {
  return (
    chatStore.typingText(chatStore.activeConversationId || null)?.length > 0
  );
});
</script>