<template>
    <transition name="slide-fade">
        <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" @click="close">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>

            <div @click.stop class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">

                <!-- Simple Header with Close Button First -->
                <div class="flex items-center gap-3 p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button @click="close"
                        class="p-2 -ml-1 rounded-full hover:bg-gray-50 text-gray-500 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 class="text-xl font-semibold text-gray-900">Group Info</h2>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto custom-scrollbar bg-white p-6">
                    <div v-if="loading" class="flex justify-center p-12">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>

                    <div v-else-if="group" class="flex flex-col gap-8">
                        <!-- Profile Section -->
                        <div class="flex flex-col items-center">
                            <div class="p-1 rounded-full ring-1 ring-gray-100 mb-4">
                                <UserAvatar :avatar="group.avatar" :is-group="true" size="xl" class="bg-gray-50" />
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900 text-center">{{ group.name }}</h3>
                            <p v-if="group.description" class="text-sm text-gray-500 max-w-sm text-center mt-2">{{
                                group.description }}</p>

                            <div class="flex items-center gap-3 mt-4 text-xs font-medium text-gray-500">
                                <span>{{ group.users?.length }} Members</span>
                                <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>Created {{ formatDate(group.created_at) }}</span>
                            </div>
                        </div>

                        <!-- Members List -->
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider">Members</h4>
                                <button v-if="isAdmin" @click="addMembers"
                                    class="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Member
                                </button>
                            </div>

                            <div class="space-y-0.5">
                                <div v-for="member in group.users" :key="member.id"
                                    class="flex items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <UserAvatar :avatar="member.avatar" :is-online="member.is_online"
                                        :show-online="true" size="md" />
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-semibold text-gray-900">{{ member.name }}</span>
                                            <span v-if="member.is_admin"
                                                class="px-1.5 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded">ADMIN</span>
                                        </div>
                                        <p class="text-xs text-gray-500 truncate">{{ member.email }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="pt-4 border-t border-gray-100">
                            <button @click="leaveGroup"
                                class="w-full py-3 rounded-xl text-red-600 font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Exit Group
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { useChatStore } from '../../stores/chat';
import { useUserStore } from '../../stores/user';
import UserAvatar from './UserAvatar.vue';

const props = defineProps<{
    isOpen: boolean;
    groupId: number;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const chatStore = useChatStore();
const userStore = useUserStore();
const toaster = inject('toaster') as { value: any } | undefined;
const loading = ref(false);
const group = ref<any>(null);

// Check if current user is admin
const isAdmin = computed(() => {
    return group.value?.users?.find((u: any) => u.id === userStore.user?.id)?.is_admin || false;
});

// Watch for groupId changes to load group data
watch(() => props.groupId, async (newGroupId) => {
    if (newGroupId && props.isOpen) {
        await loadGroup();
    }
}, { immediate: true });

watch(() => props.isOpen, async (isOpen) => {
    if (isOpen && props.groupId) {
        await loadGroup();
    }
});

const loadGroup = async () => {
    loading.value = true;
    try {
        // Get group from conversation data
        const conversation = chatStore.conversations.find(c => c.id === props.groupId);
        if (conversation) {
            group.value = conversation;
        }
    } catch (error) {
        console.error('Failed to load group:', error);
    } finally {
        loading.value = false;
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const close = () => {
    emit('close');
};

const addMembers = () => {
    toaster?.value?.show('Add members feature coming soon!', 'info');
    // TODO: Open add members modal
};

const leaveGroup = async () => {
    if (confirm(`Are you sure you want to leave ${group.value?.name}?`)) {
        try {
            await chatStore.leaveGroup(props.groupId);
            close();
            toaster?.value?.show('Left group successfully', 'success');
        } catch (error) {
            toaster?.value?.show('Failed to leave group', 'error');
        }
    }
};
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
    transform: translateX(100%);
    opacity: 0;
}
</style>
