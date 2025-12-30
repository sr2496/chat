<!-- ChatHeader.vue -->
<template>
  <div
    class="bg-chat-surface dark:bg-gray-900 shadow-sm px-4 flex items-center justify-between border-b border-chat-border">
    <div class="flex items-center gap-3">
      <button @click="chatStore.activeConversationId = null"
        class="sm:hidden -ml-2 p-2 mr-1 rounded-full text-chat-text-muted hover:bg-chat-bg/50 dark:hover:bg-gray-800 transition">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Clickable Avatar/Name Area -->
      <div @click="showInfoPanel"
        class="flex items-center gap-3 cursor-pointer hover:bg-chat-bg/30 dark:hover:bg-gray-800/50 rounded-lg p-2 -ml-2 transition-colors">
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

      <div class="relative" ref="menuContainerRef">
        <button @click="showMenu = !showMenu"
          class="p-2.5 rounded-full hover:bg-chat-bg/50 dark:hover:bg-gray-800 transition"
          :class="{ 'bg-chat-bg/50': showMenu }">
          <svg class="w-5 h-5 text-chat-text-muted dark:text-gray-400" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <ChatHeaderMenu :is-open="showMenu" :is-group="isGroup" :is-muted="isMuted"
          :conversation-id="activeConversation?.id || 0" @close="showMenu = false" @search="handleSearch"
          @mute="handleMute" @view-info="handleViewInfo" @add-members="handleAddMembers" @leave-group="handleLeaveGroup"
          @delete="handleDelete" />
      </div>
    </div>

    <!-- Info Panels -->
    <UserInfoOffcanvas v-if="!isGroup && otherUser" :is-open="showInfo" :user-id="otherUser.id"
      @close="showInfo = false" />

    <GroupInfoOffcanvas v-if="isGroup && activeConversation" :is-open="showInfo" :group-id="activeConversation.id"
      @close="showInfo = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from "vue";
import { useChatStore } from "../../stores/chat";
import { useUserStore } from "../../stores/user";
import UserAvatar from "./UserAvatar.vue";
import ChatHeaderMenu from "./ChatHeaderMenu.vue";
import UserInfoOffcanvas from "./UserInfoOffcanvas.vue";
import GroupInfoOffcanvas from "./GroupInfoOffcanvas.vue";
import { onClickOutside } from '@vueuse/core';
import type Toaster from '../Toaster.vue';

const chatStore = useChatStore();
const userStore = useUserStore();
const showMenu = ref(false);
const showInfo = ref(false);
const menuContainerRef = ref<HTMLElement | null>(null);
const toaster = inject<InstanceType<typeof Toaster> | null>('toaster', null);

// Close menu when clicking outside
onClickOutside(menuContainerRef, () => {
  if (showMenu.value) {
    showMenu.value = false;
  }
});

const activeConversation = computed(() => {
  const convId = chatStore.activeConversationId;
  return convId
    ? chatStore.conversations.find((c) => c.id === convId) || null
    : null;
});

const isGroup = computed(() => activeConversation.value?.type === "group");

const isMuted = computed(() => {
  return activeConversation.value?.id
    ? chatStore.mutedConversations.includes(activeConversation.value.id)
    : false;
});

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

// Show info panel
const showInfoPanel = () => {
  showInfo.value = true;
};

// Menu Actions
const handleSearch = () => {
  toaster?.show('Search feature coming soon!', 'info');
};

const handleMute = () => {
  if (activeConversation.value?.id) {
    chatStore.toggleMute(activeConversation.value.id);
  }
};

const handleViewInfo = () => {
  toaster?.show(isGroup.value ? 'Group info coming soon!' : 'Contact info coming soon!', 'info');
};

const handleAddMembers = () => {
  toaster?.show('Add members feature coming soon!', 'info');
};

const handleLeaveGroup = () => {
  if (confirm('Are you sure you want to leave this group?')) {
    if (activeConversation.value?.id) {
      chatStore.leaveGroup(activeConversation.value.id);
    }
  }
};

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
    if (activeConversation.value?.id) {
      chatStore.deleteConversation(activeConversation.value.id);
    }
  }
};
</script>