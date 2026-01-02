<template>
  <transition name="slide-fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" @click="handleClose">
      <!-- Offcanvas Panel -->
      <div @click.stop class="absolute left-0 top-0 h-full w-full max-w-sm bg-chat-surface shadow-2xl flex flex-col">

        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex-shrink-0">
          <div class="flex items-center gap-3">
            <button @click="handleClose"
              class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h3 class="text-xl font-bold text-white">New Message</h3>
          </div>
        </div>

        <!-- Content -->
        <!-- Search -->
        <div class="px-6 py-4 flex-shrink-0 border-b border-chat-border">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-chat-text-muted" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="userSearchQuery" type="text" placeholder="Search people..."
              class="w-full pl-12 pr-5 py-3 rounded-xl bg-chat-bg text-chat-text placeholder-chat-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow text-base shadow-inner"
              autofocus />
          </div>
        </div>

        <!-- Scrollable User List -->
        <div ref="userListRef" class="flex-1 overflow-y-auto custom-scrollbar px-2 pb-6 min-h-0"
          @scroll="handleUserScroll">
          <!-- Loading Initial -->
          <template v-if="chatStore.usersPagination.loading && chatStore.users.length === 0">
            <div v-for="n in 6" :key="n" class="flex items-center gap-4 p-4 animate-pulse">
              <div class="w-12 h-12 rounded-full bg-chat-bg/50" />
              <div class="flex-1 space-y-3">
                <div class="h-4 bg-chat-bg/50 rounded w-3/4" />
                <div class="h-3 bg-chat-bg/50 rounded w-1/2" />
              </div>
            </div>
          </template>

          <!-- Users -->
          <template v-else>
            <div v-for="user in filteredUserList" :key="user.id" @click="startPrivateChat(user)"
              class="flex items-center gap-4 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-chat-bg/50 group select-none">
              <UserAvatar :avatar="user.avatar" size="md" :is-online="userStore.isUserOnline(user.id)"
                :show-online="true" />

              <div class="flex-1 min-w-0">
                <p class="font-semibold text-chat-text truncate">
                  {{ user.name }}
                </p>
                <p class="text-xs text-chat-text-muted">
                  {{ userStore.isUserOnline(user.id) ? 'Online' : 'Offline' }}
                </p>
              </div>

              <svg
                class="w-5 h-5 text-chat-text-muted group-hover:text-blue-500 transition opacity-0 group-hover:opacity-100"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>

            <!-- Loading More Indicator -->
            <div v-if="chatStore.usersPagination.loading && chatStore.users.length > 0" class="text-center py-4">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>

            <!-- All Users Loaded Message -->
            <div v-if="!chatStore.usersPagination.hasMore && chatStore.users.length > 0 && !userSearchQuery"
              class="text-center py-4 text-chat-text-muted text-sm">
              <p>All users loaded</p>
            </div>

            <!-- Empty State -->
            <div v-if="filteredUserList.length === 0 && !chatStore.usersPagination.loading"
              class="text-center py-12 text-chat-text-muted">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p class="text-base font-medium">No users found</p>
              <p class="text-xs mt-1">Try a different search term</p>
            </div>
          </template>
        </div>

      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import { useChatStore } from "../../stores/chat";
import { useUserStore } from "../../stores/user";
import UserAvatar from "../Design/UserAvatar.vue";

export default defineComponent({
  components: { UserAvatar },
  props: {
    isOpen: { type: Boolean, required: true, default: false },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const userStore = useUserStore();
    const chatStore = useChatStore();
    const userSearchQuery = ref("");
    const userListRef = ref<HTMLElement | null>(null);

    const normalize = (v = "") => v.toLowerCase().trim();

    const filteredUserList = computed(() => {
      const q = normalize(userSearchQuery.value);
      if (!q) return chatStore.users;
      return chatStore.users.filter(u => normalize(u.name).includes(q));
    });

    const startPrivateChat = async (user: any) => {
      await chatStore.createPrivateConversation(user.id);
      handleClose();
    };

    const handleUserScroll = () => {
      const el = userListRef.value;
      if (!el) return;

      const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

      if (bottom && chatStore.usersPagination.hasMore && !chatStore.usersPagination.loading) {
        chatStore.loadMoreUsers();
      }
    };

    const handleClose = () => {
      setTimeout(() => {
        emit("close");
        userSearchQuery.value = "";
      }, 300);
    };

    // Load users when modal opens
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        chatStore.loadUsers(false);
      }
    });

    return {
      chatStore,
      userStore,
      userSearchQuery,
      userListRef,
      filteredUserList,
      startPrivateChat,
      handleUserScroll,
      handleClose
    };
  },
});
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>