<template>
  <div
    class="flex h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-slate-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 antialiased overflow-hidden">
    <!-- Conversation List Sidebar -->
    <div :class="[
      'flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 shadow-lg transition-all duration-500 ease-out',
      isMobileView
        ? 'fixed inset-y-0 left-0 z-50 w-80'
        : 'w-full md:w-80 lg:w-96',
      chatStore.activeConversationId && isMobileView
        ? '-translate-x-full'
        : 'translate-x-0',
    ]">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Chats
        </h2>
        <div class="flex items-center gap-2">
          <button @click="openNewChatModal"
            class="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
            title="New Chat">
            <font-awesome-icon icon="comment-dots" class="text-lg" />
          </button>
          <button @click="openGroupModal"
            class="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
            title="Create Group">
            <font-awesome-icon icon="users" class="text-lg" />
          </button>
        </div>
      </div>
      <!-- Search -->
      <div class="px-4 pt-3 pb-3">
        <div class="relative group">
          <font-awesome-icon icon="magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition text-sm" />
          <input type="text" v-model="chatStore.searchQuery" placeholder="Search chats..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-transparent shadow-sm transition-all duration-200 text-sm" />
        </div>
      </div>
      <!-- Conversation List -->
      <div ref="conversationListRef" class="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
        <template v-if="conversationsLoading">
          <div v-for="n in 8" :key="n" class="flex items-center p-3 my-2 rounded-lg animate-pulse">
            <div class="w-10 h-10 rounded-lg bg-gray-300 dark:bg-slate-700"></div>

            <div class="ml-3 flex-1 space-y-2">
              <div class="h-3 w-3/4 bg-gray-300 dark:bg-slate-700 rounded"></div>
              <div class="h-2 w-1/2 bg-gray-200 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        </template>
        <template v-else>
          <div v-for="conversation in chatStore.filteredConversations" :key="conversation.id"
            @click="chatStore.setActiveConversation(conversation.id)"
            class="flex items-center p-3 my-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-all duration-200 group"
            :class="{
              'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800': chatStore.activeConversationId === conversation.id,
            }">
            <div class="relative flex-shrink-0 inline-block">
              <div
                class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {{ conversation.initials }}
              </div>

              <!-- Unread badge -->
              <transition name="fade-scale">
                <span v-if="conversation.unread_count > 0"
                  class="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg ring-2 ring-white">
                  {{ conversation.unread_count > 99 ? '99+' : conversation.unread_count }}
                </span>
              </transition>

              <!-- Online green dot for private conversations -->
              <span
                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                :class="{
                  'bg-green-500': conversation.type === 'private' && userStore.isUserOnline(chatStore.getOtherUser(conversation).id),
                  'bg-gray-400': conversation.type === 'private' && !userStore.isUserOnline(chatStore.getOtherUser(conversation).id)
                }"></span>

            </div>

            <div class="ml-3 flex-1 min-w-0">
              <h3 class="font-semibold text-sm truncate">
                {{ conversation.name }}
              </h3>
              <p class="text-xs truncate mt-1" :class="{
                'text-blue-600 dark:text-blue-400 font-medium animate-pulse': chatStore.typingText(conversation.id),
                'text-gray-600 dark:text-gray-400': !chatStore.typingText(conversation.id)
              }">
                {{ chatStore.typingText(conversation.id) ||
                  (conversation.last_message?.message || 'No messages yet') }}
              </p>
            </div>
            <div class="text-xs text-gray-500 ml-2">
              {{ formatTime(conversation.last_message?.time) }}
            </div>
          </div>
        </template>
      </div>
    </div>
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
    <div v-if="showNewChatModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700">
        <h3 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Start New Chat
        </h3>
        <div class="relative mb-4">
          <font-awesome-icon icon="magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input type="text" v-model="userSearchQuery" placeholder="Search users..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-transparent shadow-sm text-sm" />
        </div>
        <div class="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
          <template v-if="conversationsLoading">
            <div v-for="n in 6" :key="n" class="flex items-center p-3 rounded-lg animate-pulse">
              <div class="w-8 h-8 rounded-lg bg-gray-300 dark:bg-slate-700 mr-3"></div>
              <div class="h-3 w-2/3 bg-gray-300 dark:bg-slate-700 rounded"></div>
            </div>
          </template>
          <template v-else>

            <div v-for="user in filteredUserList" :key="user.id" @click="startPrivateChat(user)"
              class="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer rounded-lg transition-all duration-200">
              <div
                class="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-semibold text-sm shadow-sm mr-3">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user.name }}</p>
            </div>
          </template>
        </div>
        <div class="mt-6 flex justify-end">
          <button @click="showNewChatModal = false"
            class="px-6 py-2.5 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition text-sm font-medium text-gray-900 dark:text-white">
            Close
          </button>
        </div>
      </div>
    </div>
    <!-- Create Group Modal -->
    <div v-if="showGroupModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
        <h3 class="text-2xl font-bold mb-5 text-gray-900 dark:text-white">
          Create Group
        </h3>
        <input v-model="groupName" type="text" placeholder="Group name (required)"
          class="w-full mb-4 px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-transparent shadow-sm text-sm" />
        <div class="relative mb-3">
          <font-awesome-icon icon="magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input v-model="groupUserSearch" type="text" placeholder="Search users..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-transparent shadow-sm text-sm" />
        </div>
        <!-- Selected Users Chips -->
        <div v-if="selectedGroupUsers.length" class="flex flex-wrap gap-2 mb-3">
          <span v-for="user in selectedGroupUsers" :key="user.id"
            class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs flex items-center gap-1 shadow-sm">
            {{ user.name }}
            <button @click="toggleGroupUser(user)"
              class="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 hover:bg-red-200 dark:hover:bg-red-800 flex items-center justify-center text-xs transition text-gray-600">
              ✕
            </button>
          </span>
        </div>
        <!-- Scrollable User List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0">
          <template v-if="conversationsLoading">
            <div v-for="n in 8" :key="n" class="flex items-center justify-between p-3 rounded-lg animate-pulse">
              <!-- Name -->
              <div class="h-3 w-2/3 bg-gray-300 dark:bg-slate-700 rounded"></div>

              <!-- Check circle -->
              <div class="w-6 h-6 rounded-full bg-gray-300 dark:bg-slate-700"></div>
            </div>
          </template>
          <template v-else>
            <div v-for="user in filteredGroupUsers" :key="user.id" @click="toggleGroupUser(user)"
              class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200">
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ user.name }}</span>
              <span v-if="selectedGroupUsers.some((u) => u.id === user.id)"
                class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md text-sm">✓</span>
            </div>
          </template>
        </div>
        <!-- Actions -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
          <button @click="showGroupModal = false"
            class="px-6 py-2.5 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition text-sm font-medium text-gray-900 dark:text-white">
            Cancel
          </button>
          <button @click="createGroup" :disabled="!groupName || selectedGroupUsers.length === 0"
            class="px-6 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold">
            Create
          </button>
        </div>
      </div>
    </div>
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
import ChatWindow from "../components/ChatWindow.vue";
import MessageInput from "../components/MessageInput.vue";
import { useUserStore } from "../stores/user";
import { useChatStore } from "../stores/chat";


export default defineComponent({
  components: { ChatWindow, MessageInput },
  setup() {
    const userStore = useUserStore();
    const chatStore = useChatStore();

    /* ---------------- UI STATE ---------------- */
    const isMobileView = ref(window.innerWidth < 768);
    const showNewChatModal = ref(false);
    const showGroupModal = ref(false);

    /* ---------------- USERS ---------------- */
    const users = ref<any[]>([]);
    const userSearchQuery = ref("");
    const groupUserSearch = ref("");
    const selectedGroupUsers = ref<any[]>([]);
    const groupName = ref("");
    const conversationsLoading = ref(true);

    /* ---------------- COMPUTED ---------------- */

    const currentUserId = computed(() => userStore.user?.id);

    const normalize = (v = "") => v.toLowerCase();

    const filteredUserList = computed(() => {
      const q = normalize(userSearchQuery.value);
      if (!q) return users.value;
      return users.value.filter(u => normalize(u.name).includes(q));
    });

    const filteredGroupUsers = computed(() => {
      const q = normalize(groupUserSearch.value);
      if (!q) return users.value;
      return users.value.filter(u => normalize(u.name).includes(q));
    });

    /* ---------------- ACTIONS ---------------- */
    const startPrivateChat = async (user: any) => {
      await chatStore.createPrivateConversation(user.id);
      showNewChatModal.value = false;
      userSearchQuery.value = "";
    };

    const createGroup = async () => {
      await chatStore.createGroupConversation(
        groupName.value,
        selectedGroupUsers.value.map(u => u.id)
      );

      showGroupModal.value = false;
      groupName.value = "";
      selectedGroupUsers.value = [];
      groupUserSearch.value = "";
    };

    const toggleGroupUser = (user: any) => {
      const exists = selectedGroupUsers.value.some(u => u.id === user.id);
      selectedGroupUsers.value = exists
        ? selectedGroupUsers.value.filter(u => u.id !== user.id)
        : [...selectedGroupUsers.value, user];
    };

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

    const formatTime = (timestamp?: string) => {
      if (!timestamp) return "Just now";
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };


    const onResize = () => {
      isMobileView.value = window.innerWidth < 768;
    };

    return {
      userStore,
      chatStore,
      userSearchQuery,
      filteredUserList,
      isMobileView,
      showNewChatModal,
      showGroupModal,
      currentUserId,
      openNewChatModal,
      openGroupModal,
      startPrivateChat,
      formatTime,
      groupName,
      groupUserSearch,
      filteredGroupUsers,
      selectedGroupUsers,
      toggleGroupUser,
      createGroup,
      conversationsLoading,
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
  border-radius: 999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #2563eb;
  background-clip: content-box;
}

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