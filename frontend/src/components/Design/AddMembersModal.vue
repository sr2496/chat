<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog"
        aria-modal="true" @click="close">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div @click.stop
            class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2">
              <div class="flex items-center justify-between text-white">
                <h3 class="text-xl font-bold">Add Members</h3>
                <button @click="close" class="bg-white/20 hover:bg-white/30 rounded-full p-2 transition">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p class="text-green-50 mt-1 text-sm">{{ selectedUsers.length }} selected</p>
            </div>

            <!-- Body -->
            <div class="flex flex-col h-[60vh] sm:h-[400px] bg-white">
              <!-- Selected Chips -->
              <div v-if="selectedUsers.length > 0" class="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <div v-for="user in selectedUsers" :key="user.id"
                    class="flex items-center gap-2 bg-green-50 border border-green-100 rounded-full pl-1 pr-3 py-1 flex-shrink-0">
                    <UserAvatar :avatar="user.avatar" size="xs" :show-online="false" />
                    <span class="text-sm font-medium text-green-800 truncate max-w-[100px]">{{ user.name.split(' ')[0]
                    }}</span>
                    <button @click="toggleUser(user)"
                      class="w-5 h-5 rounded-full hover:bg-red-500 hover:text-white text-green-600 flex items-center justify-center transition">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Search -->
              <div class="p-4 border-b border-gray-100">
                <div class="relative">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input v-model="search" type="text" placeholder="Search people..."
                    class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500/20 text-gray-900 placeholder-gray-400 transition-all font-medium" />
                </div>
              </div>

              <!-- User List -->
              <div class="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
                <div v-if="loading" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>

                <div v-else-if="filteredUsers.length === 0" class="text-center py-8 text-gray-500">
                  <p>No new users found</p>
                </div>

                <div v-else class="space-y-1">
                  <div v-for="user in filteredUsers" :key="user.id" @click="toggleUser(user)"
                    class="flex items-center justify-between p-3 rounded-xl cursor-pointer transition hover:bg-gray-50 group select-none">
                    <div class="flex items-center gap-3">
                      <UserAvatar :avatar="user.avatar" size="md" :is-online="user.is_online" :show-online="true" />
                      <div>
                        <p class="font-semibold text-gray-900">{{ user.name }}</p>
                        <p class="text-xs text-gray-500">{{ user.email }}</p>
                      </div>
                    </div>
                    <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                      :class="selectedUsers.some(u => u.id === user.id) ? 'bg-green-500 border-green-500' : 'border-gray-200 group-hover:border-green-400'">
                      <svg v-if="selectedUsers.some(u => u.id === user.id)" class="w-3.5 h-3.5 text-white" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-2 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button @click="close"
                class="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button @click="addMembers" :disabled="selectedUsers.length === 0 || submitting"
                class="px-6 py-2.5 rounded-xl bg-green-500 text-white font-bold shadow-lg shadow-green-500/30 hover:bg-green-600 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center gap-2">
                <span v-if="submitting"
                  class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Add Members
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useChatStore } from '../../stores/chat';
import { api } from '../../axios'; // corrected import path
import UserAvatar from './UserAvatar.vue';

const props = defineProps<{
  isOpen: boolean;
  groupId: number;
  currentMembers: any[]; // Array of user objects currently in the group
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'added'): void;
}>();

const chatStore = useChatStore();
const search = ref('');
const selectedUsers = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);

const close = () => {
  emit('close');
  search.value = '';
  selectedUsers.value = [];
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await api.get('/users');
    allUsers.value = response.data.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  } finally {
    loading.value = false;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (allUsers.value.length === 0) fetchUsers();
  }
});

// Filter out users who are already members
const availableUsers = computed(() => {
  if (!props.currentMembers) return allUsers.value;
  const memberIds = new Set(props.currentMembers.map(m => m.id));
  return allUsers.value.filter(u => !memberIds.has(u.id));
});

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return availableUsers.value;
  return availableUsers.value.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  );
});

const toggleUser = (user: any) => {
  const index = selectedUsers.value.findIndex(u => u.id === user.id);
  if (index === -1) {
    selectedUsers.value.push(user);
  } else {
    selectedUsers.value.splice(index, 1);
  }
};

const addMembers = async () => {
  if (selectedUsers.value.length === 0) return;

  submitting.value = true;
  try {
    await chatStore.addMembersToGroup(props.groupId, selectedUsers.value.map(u => u.id));
    emit('added');
    close();
  } catch (error) {
    console.error(error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
