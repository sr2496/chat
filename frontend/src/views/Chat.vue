<template>
  <div
    class="flex h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-slate-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 antialiased overflow-hidden">
    <!-- Conversation List Sidebar -->

    <ConversationList :activeConversationId="chatStore.activeConversationId"
      :conversationsLoading="conversationsLoading" @selectConversation="chatStore.setActiveConversation"
      @new-chat="openNewChatModal" @create-group="openGroupModal" />
    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col" v-if="chatStore.activeConversationId">
      <ChatWindow :key="chatStore.activeConversationId" />
    </div>
    <!-- Empty State -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-8 px-8">
      <div class="text-center">
        <font-awesome-icon icon="comments" class="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
        <p class="text-2xl font-light text-gray-600 dark:text-gray-400 tracking-wide">
          Select a chat<br />or start a new one
        </p>
      </div>
      <div class="flex gap-4">
        <button @click="openNewChatModal"
          class="px-8 py-3 text-base font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          New Chat
        </button>
        <button @click="openGroupModal"
          class="px-8 py-3 text-base font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          Create Group
        </button>
      </div>
    </div>

    <!-- New Chat Modal -->
    <NewChatModal v-if="showNewChatModal" :conversationsLoading="conversationsLoading" :users="users"
      @close="showNewChatModal = false" />



    <!-- Create Group Modal -->
    <CreateGroupModal v-if="showGroupModal" :conversationsLoading="conversationsLoading" :users="users"
      @close="showGroupModal = false" />


  </div>
</template>
<script lang="ts">
// Your script remains exactly the same — no changes needed
// (All the logic you had before works perfectly with the new compact design)
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onUnmounted,
} from "vue";
import { api } from "../axios";
import { useUserStore } from "../stores/user";
import { useChatStore } from "../stores/chat";
import ConversationList from "../components/ConversationList.vue";
import ChatWindow from "../components/ChatWindow.vue";
import NewChatModal from "../components/Chat/NewChatModal .vue";
import CreateGroupModal from "../components/Chat/CreateGroupModal.vue";


export default defineComponent({
  components: { ConversationList, ChatWindow, NewChatModal, CreateGroupModal },
  setup() {
    const userStore = useUserStore();
    const chatStore = useChatStore();

    /* ---------------- UI STATE ---------------- */
    const isMobileView = ref(window.innerWidth < 768);
    const showNewChatModal = ref(false);
    const showGroupModal = ref(false);

    /* ---------------- USERS ---------------- */
    const users = ref<any[]>([]);
    
    const conversationsLoading = ref(true);

    /* ---------------- COMPUTED ---------------- */

    const currentUserId = computed(() => userStore.user?.id);


    /* ---------------- LIFECYCLE ---------------- */
    onMounted(async () => {

      conversationsLoading.value = true;
      await chatStore.loadConversations();
      chatStore.conversations.forEach(c => chatStore.startListening(c.id));
      userStore.joinPresenceChannel();

      const res = await api.get("/users");
      users.value = res.data.data;
      conversationsLoading.value = false;
    });


    onUnmounted(() => {
      chatStore.stopAllListeners();
      userStore.leavePresenceChannel();
    });

    const openNewChatModal = () => { showNewChatModal.value = true; };
    const openGroupModal = () => { showGroupModal.value = true; };

    return {
      users,
      userStore,
      chatStore,
      isMobileView,
      showNewChatModal,
      showGroupModal,
      currentUserId,
      openNewChatModal,
      openGroupModal,
      conversationsLoading,
    };
  },
});
</script>
<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #3b82f6 transparent;
}

.typing-dots span {
  animation: bounce 1.4s infinite;
  display: inline-block;
}

.typing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-4px);
  }
}
</style>