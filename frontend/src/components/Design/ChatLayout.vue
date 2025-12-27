<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
    <!-- Desktop Sidebar: Always visible -->
    <div
      class="hidden sm:flex w-full sm:w-96 lg:w-[420px] border-r border-gray-200 dark:border-gray-800 flex-col bg-white dark:bg-gray-900">
      <ChatList @new-chat="showNewChatModal = true" @create-group="showGroupModal = true" />
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col h-full relative">
      <!-- Desktop: No transition, instant view switch -->
      <div v-if="!isMobile" class="flex flex-col h-full">
        <!-- Empty State -->
        <div v-if="!chatStore.activeConversationId"
          class="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
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
        <div v-else class="flex flex-col h-full bg-[#efeae2] dark:bg-gray-800">
          <ChatWindow :conversationId="chatStore.activeConversationId" />
        </div>
      </div>

      <!-- Mobile: With smooth slide transition -->
      <transition v-else mode="out-in" enter-active-class="transition ease-out duration-300"
        enter-from-class="translate-x-full" enter-to-class="translate-x-0"
        leave-active-class="transition ease-in duration-200" leave-from-class="translate-x-0"
        leave-to-class="translate-x-full">
        <!-- Chat View on Mobile -->
        <div v-if="chatStore.activeConversationId" key="chat"
          class="flex flex-col h-full bg-[#efeae2] dark:bg-gray-800">
          <!-- Mobile Header with Back Button -->
          <div
            class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-4">
            <button @click="chatStore.activeConversationId = null"
              class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="flex items-center gap-3">
              <img :src="activeConversation?.display_avatar || 'https://randomuser.me/api/portraits/women/68.jpg'"
                class="w-10 h-10 rounded-full object-cover" alt="Avatar" />
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                  {{ activeConversation?.display_name || 'Chat' }}
                </h3>
                <p v-if="isOnline" class="text-xs text-green-600 dark:text-green-400">Online</p>
              </div>
            </div>
          </div>

          <ChatWindow :conversationId="chatStore.activeConversationId" />
        </div>

        <!-- Chat List on Mobile (when no conversation) -->
        <div v-else key="list" class="flex flex-col h-full bg-white dark:bg-gray-900">
          <ChatList @new-chat="showNewChatModal = true" @create-group="showGroupModal = true" />
        </div>
      </transition>
    </div>
  </div>
  <teleport to="body">
    <transition name="fade-scale">
      <NewChatModal v-if="showNewChatModal" :userLoading="userLoading" :users="users"
        @close="showNewChatModal = false" />
    </transition>
  </teleport>

  <teleport to="body">
    <transition name="fade-scale">
      <CreateGroupModal v-if="showGroupModal" :userLoading="userLoading" :users="users"
        @close="showGroupModal = false" />
    </transition>
  </teleport>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from "vue";
import { useChatStore } from "../../stores/chat";
import ChatList from "./ChatList.vue";
import ChatWindow from "./ChatWindow.vue";
import { useUserStore } from "../../stores/user";
import { api } from "../../axios";
import NewChatModal from "./NewChatModal .vue";
import CreateGroupModal from "./CreateGroupModal.vue";

export default defineComponent({
  components: { ChatList, ChatWindow, NewChatModal, CreateGroupModal },
  setup() {
    const userStore = useUserStore();
    const chatStore = useChatStore();
    const showNewChatModal = ref(false);
    const showGroupModal = ref(false);
    const users = ref<any[]>([]);
    const userLoading = ref(true);

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
      userLoading.value = true;
      updateMobile();
      window.addEventListener("resize", updateMobile);
      const res = await api.get("/users");
      users.value = res.data.data;
      userLoading.value = false;
    });

    onUnmounted(() => {
      window.removeEventListener("resize", updateMobile);
    });

    return {
      userStore,
      chatStore,
      isMobile,
      activeConversation,
      isOnline,
      showNewChatModal,
      showGroupModal,
      users,
      userLoading,
      openGroupModal() {
        showGroupModal.value = true;
      },
    };
  },
});
</script>

