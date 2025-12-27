<template>
  <!-- Backdrop + Click Outside to Close -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    @click="handleCloseGroupModal"
  >
    <!-- Modal Card -->
    <div
      class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden"
      style="height: 80vh; max-height: 640px;"
      @click.stop
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 flex-shrink-0">
        <div class="flex items-center justify-between">
          <h3 class="text-2xl font-bold text-white">Create Group</h3>
          <button
            @click="handleCloseGroupModal"
            class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Group Name -->
      <div class="px-6 pt-6 pb-4 flex-shrink-0">
        <input
          v-model="groupName"
          type="text"
          placeholder="Group name (required)"
          class="w-full px-5 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-shadow text-base shadow-inner"
          autofocus
        />
      </div>

      <!-- Search -->
      <div class="px-6 pb-4 flex-shrink-0">
        <div class="relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="groupUserSearch"
            type="text"
            placeholder="Search people..."
            class="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-shadow text-base shadow-inner"
          />
        </div>
      </div>

      <!-- Selected Users – Compact Collapsible Bar -->
      <div v-if="selectedGroupUsers.length" class="px-6 pb-3 flex-shrink-0">
        <button
          @click="showSelectedExpanded = !showSelectedExpanded"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700/70 transition shadow-sm"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Selected ({{ selectedGroupUsers.length }})
            </span>
            <div class="flex gap-2 overflow-hidden">
              <span
                v-for="user in selectedGroupUsers.slice(0, 5)"
                :key="user.id"
                class="px-3 py-1 text-xs bg-blue-500 text-white rounded-full whitespace-nowrap"
              >
                {{ user.name.split(' ')[0] }}
              </span>
              <span v-if="selectedGroupUsers.length > 5" class="text-xs text-gray-500 dark:text-gray-400">
                +{{ selectedGroupUsers.length - 5 }} more
              </span>
            </div>
          </div>
          <svg
            class="w-5 h-5 text-gray-500 transition-transform duration-200"
            :class="{ 'rotate-180': showSelectedExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Expanded Selected Users -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-48 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="max-h-48 opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div
            v-if="showSelectedExpanded"
            class="mt-3 max-h-48 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <span
              v-for="user in selectedGroupUsers"
              :key="user.id"
              class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium shadow"
            >
              {{ user.name }}
              <button
                @click.stop="toggleGroupUser(user)"
                class="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
        </transition>
      </div>

      <!-- User List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 min-h-0">
        <!-- Loading -->
        <template v-if="userLoading">
          <div v-for="n in 8" :key="n" class="flex items-center justify-between py-4 animate-pulse">
            <div class="flex items-center gap-4 flex-1">
              <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            </div>
            <div class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </template>

        <!-- Users -->
        <template v-else>
          <div
            v-for="user in filteredGroupUsers"
            :key="user.id"
            @click="toggleGroupUser(user)"
            class="flex items-center justify-between py-4 px-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group"
          >
            <div class="flex items-center gap-4 flex-1">
              <UserAvatar
                :avatar="user.avatar"
                :name="user.name"
                size="lg"
                :is-online="userStore.isUserOnline(user.id)"
                :show-online="true"
              />
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-100">{{ user.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ userStore.isUserOnline(user.id) ? 'Online' : 'Offline' }}
                </p>
              </div>
            </div>

            <div
              class="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
              :class="selectedGroupUsers.some(u => u.id === user.id)
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 dark:border-gray-600 group-hover:border-green-500'"
            >
              <svg v-if="selectedGroupUsers.some(u => u.id === user.id)" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div v-if="filteredGroupUsers.length === 0" class="text-center py-16 text-gray-500 dark:text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p class="text-lg font-medium">No users found</p>
          </div>
        </template>
      </div>

      <!-- Actions -->
      <div class="px-6 py-2 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
        <button
          @click="handleCloseGroupModal"
          class="px-6 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium transition"
        >
          Cancel
        </button>
        <button
          @click="createGroup"
          :disabled="!groupName.trim() || selectedGroupUsers.length === 0"
          class="px-8 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Create Group
        </button>
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
    const chatStore = useChatStore();
    const userStore = useUserStore();

    const groupName = ref("");
    const groupUserSearch = ref("");
    const selectedGroupUsers = ref<any[]>([]);
    const showSelectedExpanded = ref(false);

    const normalize = (v = "") => v.toLowerCase().trim();

    const filteredGroupUsers = computed(() => {
      const q = normalize(groupUserSearch.value);
      if (!q) return props.users;
      return props.users.filter(u => normalize(u.name).includes(q));
    });

    const toggleGroupUser = (user: any) => {
      const exists = selectedGroupUsers.value.some(u => u.id === user.id);
      selectedGroupUsers.value = exists
        ? selectedGroupUsers.value.filter(u => u.id !== user.id)
        : [...selectedGroupUsers.value, user];
    };

    const createGroup = async () => {
      if (!groupName.value.trim() || selectedGroupUsers.value.length === 0) return;

      await chatStore.createGroupConversation(
        groupName.value.trim(),
        selectedGroupUsers.value.map(u => u.id)
      );

      handleCloseGroupModal();
    };

    const handleCloseGroupModal = () => {
      emit("close");
      groupName.value = "";
      selectedGroupUsers.value = [];
      groupUserSearch.value = "";
      showSelectedExpanded.value = false;
    };

    return {
      userStore,
      groupName,
      groupUserSearch,
      filteredGroupUsers,
      toggleGroupUser,
      selectedGroupUsers,
      createGroup,
      handleCloseGroupModal,
      showSelectedExpanded,
    };
  },
});
</script>