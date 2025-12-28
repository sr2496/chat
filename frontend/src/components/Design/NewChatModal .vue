<template>
  <!-- Backdrop with subtle blur + click to close -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    @click="$emit('close')"
  >
    <!-- Modal Card – Stop click propagation -->
    <div
      class="bg-chat-surface rounded-3xl shadow-2xl w-full max-w-lg flex flex-col border border-chat-border overflow-hidden"
      style="height: 80vh; max-height: 640px;"
      @click.stop
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 flex-shrink-0">
        <div class="flex items-center justify-between">
          <h3 class="text-2xl font-bold text-white">New Message</h3>
          <button
            @click="$emit('close')"
            class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="px-6 pt-6 pb-4 flex-shrink-0">
        <div class="relative">
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-chat-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="userSearchQuery"
            type="text"
            placeholder="Search people..."
            class="w-full pl-12 pr-5 py-4 rounded-2xl bg-chat-bg text-chat-text placeholder-chat-text-muted focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-shadow text-base shadow-inner"
            autofocus
          />
        </div>
      </div>

      <!-- Scrollable User List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 min-h-0">
        <!-- Loading -->
        <template v-if="userLoading">
          <div v-for="n in 6" :key="n" class="flex items-center gap-4 py-4 animate-pulse">
            <div class="w-14 h-14 rounded-full bg-chat-bg/50" />
            <div class="flex-1 space-y-3">
              <div class="h-5 bg-chat-bg/50 rounded w-3/4" />
              <div class="h-4 bg-chat-bg/50 rounded w-1/2" />
            </div>
          </div>
        </template>

        <!-- Users -->
        <template v-else>
          <div
            v-for="user in filteredUserList"
            :key="user.id"
            @click="startPrivateChat(user)"
            class="flex items-center gap-4 py-4 px-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-chat-bg/50 hover:shadow-md group"
          >
            <UserAvatar
              :avatar="user.avatar"
              :name="user.name"
              size="lg"
              :is-online="userStore.isUserOnline(user.id)"
              :show-online="true"
            />

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-chat-text truncate">
                {{ user.name }}
              </p>
              <p class="text-sm text-chat-text-muted">
                {{ userStore.isUserOnline(user.id) ? 'Online' : 'Offline' }}
              </p>
            </div>

            <svg
              class="w-5 h-5 text-chat-text-muted group-hover:text-blue-500 transition opacity-0 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <!-- Empty State -->
          <div v-if="filteredUserList.length === 0" class="text-center py-16 text-chat-text-muted">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p class="text-lg font-medium">No users found</p>
            <p class="text-sm mt-2">Try a different search term</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useChatStore } from "../../stores/chat";
import { useUserStore } from "../../stores/user";
import UserAvatar from "../Design/UserAvatar.vue";

export default defineComponent({
  components: { UserAvatar },
  props: {
    userLoading: { type: Boolean, required: true, default: false },
    users: { type: Array as () => any[], required: true, default: () => [] },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const userStore = useUserStore();
    const chatStore = useChatStore();

    const userSearchQuery = ref("");

    const normalize = (v = "") => v.toLowerCase().trim();

    const filteredUserList = computed(() => {
      const q = normalize(userSearchQuery.value);
      if (!q) return props.users;
      return props.users.filter(u => normalize(u.name).includes(q));
    });

    const startPrivateChat = async (user: any) => {
      await chatStore.createPrivateConversation(user.id);
      emit("close");
      userSearchQuery.value = "";
    };

    return {
      userStore,
      userSearchQuery,
      filteredUserList,
      startPrivateChat,
    };
  },
});
</script>