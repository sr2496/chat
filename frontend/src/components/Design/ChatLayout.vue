<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
    <!-- Desktop Sidebar: Always visible -->
    <div class="hidden sm:flex w-full sm:w-96 lg:w-[420px] border-r border-chat-border flex-col bg-chat-surface">
      <ChatList />
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col h-full relative">
      <!-- Desktop: No transition, instant view switch -->
      <div v-if="!isMobile" class="flex flex-col h-full">
        <!-- Empty State -->
        <div v-if="!chatStore.activeConversationId" class="flex-1 flex items-center justify-center bg-chat-bg">
          <div class="text-center max-w-md px-8">
            <div class="w-64 h-64 mx-auto mb-10 opacity-30">
              <svg class="w-full h-full text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 class="text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Your Messages</h3>
            <p class="text-lg text-gray-500 dark:text-gray-400">Select a conversation from the list to start chatting
            </p>
          </div>
        </div>

        <!-- Chat Window on Desktop -->
        <div v-else class="flex flex-col h-full bg-[var(--chat-window-bg)]">
          <ChatWindow :conversationId="chatStore.activeConversationId" />
        </div>
      </div>

      <!-- Mobile: With smooth slide transition -->
      <transition v-else mode="out-in" enter-active-class="transition ease-out duration-300"
        enter-from-class="translate-x-full" enter-to-class="translate-x-0"
        leave-active-class="transition ease-in duration-200" leave-from-class="translate-x-0"
        leave-to-class="translate-x-full">
        <!-- Chat View on Mobile -->
        <div v-if="chatStore.activeConversationId" key="chat" class="flex flex-col h-full bg-[var(--chat-window-bg)]">


          <ChatWindow :conversationId="chatStore.activeConversationId" />
        </div>

        <!-- Chat List on Mobile (when no conversation) -->
        <div v-else key="list" class="flex flex-col h-full bg-white dark:bg-gray-900">
          <ChatList />
        </div>
      </transition>
    </div>

    <!-- Notification Toast -->
    <NotificationToast ref="notificationToast" @click="chatStore.setActiveConversation($event)" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from "vue";
import { useChatStore } from "../../stores/chat";
import ChatList from "./ChatList.vue";
import ChatWindow from "./ChatWindow.vue";
import { useUserStore } from "../../stores/user";
import NotificationToast, { type Notification } from "./NotificationToast.vue";
import { useNotificationSound } from "../../composables/useNotificationSound";

export default defineComponent({
  components: { ChatList, ChatWindow, NotificationToast },
  setup() {
    const userStore = useUserStore();
    const chatStore = useChatStore();

    const isMobile = ref(window.innerWidth < 640);

    const updateMobile = () => {
      isMobile.value = window.innerWidth < 640;
    };

    const activeConversation = computed(() => {
      const convId = chatStore.activeConversationId;
      return convId
        ? chatStore.conversations.find((c) => c.id === convId) || null
        : null;
    });

    const isOnline = computed(() => {
      if (!activeConversation.value || activeConversation.value.type !== 'private') return false;
      const otherUser = chatStore.getOtherUser(activeConversation.value);
      return userStore.isUserOnline(otherUser.id);
    });

    onMounted(async () => {
      updateMobile();
      window.addEventListener("resize", updateMobile);

      // Set up notification handler
      (window as any).__chatNotificationHandler = (notification: Notification) => {
        notificationToast.value?.show(notification);
      };

      // Set up sound handler
      (window as any).__chatSoundHandler = () => {
        // Check user preference for notification sound
        if (userStore.user?.notification_sound !== false) {
          soundPlayer.play();
        }
      };
    });

    onUnmounted(() => {
      window.removeEventListener("resize", updateMobile);

      // Clean up handlers
      delete (window as any).__chatNotificationHandler;
      delete (window as any).__chatSoundHandler;
    });

    const notificationToast = ref<InstanceType<typeof NotificationToast> | null>(null);
    const soundPlayer = useNotificationSound({ volume: 0.6, throttleMs: 1500 });

    return {
      userStore,
      chatStore,
      isMobile,
      activeConversation,
      isOnline,
      notificationToast,
    };
  },
});
</script>
