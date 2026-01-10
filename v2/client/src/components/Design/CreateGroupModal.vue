<template>
    <transition name="slide-fade">
        <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" @click="handleCloseGroupModal">

            <!-- Offcanvas Panel -->
            <div @click.stop
                class="absolute left-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-r border-gray-200 dark:border-gray-800">

                <!-- Content -->
                <div class="flex-1 relative overflow-hidden flex flex-col min-h-0">
                    <transition :name="slideTransition" mode="out-in">

                        <!-- Step 1: Select Users -->
                        <div v-if="currentStep === 1" key="step-1"
                            class="absolute inset-0 flex flex-col w-full h-full bg-white dark:bg-gray-900">
                            <!-- Header -->
                            <div
                                class="bg-white dark:bg-gray-900 px-6 py-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
                                <div class="flex items-center justify-between text-gray-900 dark:text-white">
                                    <div class="flex items-center gap-3">
                                        <button @click="handleCloseGroupModal"
                                            class="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center transition">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                        </button>
                                        <div class="flex flex-col">
                                            <h3 class="text-xl font-bold">Add Participants</h3>
                                            <p class="text-sm text-gray-500 dark:text-gray-400">{{
                                                selectedGroupUsers.length }} selected
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Selected Users List (Horizontal Chips) -->
                            <div v-if="selectedGroupUsers.length > 0"
                                class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 flex-shrink-0">
                                <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                                    <div v-for="user in selectedGroupUsers" :key="user._id"
                                        class="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-1 pr-3 py-1 shadow-sm flex-shrink-0">
                                        <UserAvatar :avatar="user.avatar" size="xs" :show-online="false" />
                                        <span
                                            class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[100px]">{{
                                                user.name.split(' ')[0]
                                            }}</span>
                                        <button @click.stop="toggleGroupUser(user)"
                                            class="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-gray-500 flex items-center justify-center transition">
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Search -->
                            <div class="px-6 py-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
                                <div class="relative">
                                    <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input v-model="groupUserSearch" type="text" placeholder="Search people..."
                                        class="w-full pl-12 pr-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-shadow text-base shadow-inner"
                                        autofocus />
                                </div>
                            </div>

                            <!-- User List -->
                            <div ref="groupUserListRef" class="flex-1 overflow-y-auto custom-scrollbar px-2"
                                @scroll="handleGroupUserScroll">
                                <template v-if="chatStore.usersPagination.loading && chatStore.users.length === 0">
                                    <div v-for="n in 5" :key="n" class="flex items-center gap-4 p-4 animate-pulse">
                                        <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                                        <div class="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                </template>
                                <template v-else>
                                    <div v-for="user in filteredGroupUsers" :key="user._id"
                                        @click="toggleGroupUser(user)"
                                        class="flex items-center justify-between p-3 mx-2 my-1 rounded-xl cursor-pointer transition hover:bg-gray-100 dark:hover:bg-gray-800 group select-none">
                                        <div class="flex items-center gap-4 flex-1">
                                            <UserAvatar :avatar="user.avatar" size="md" :is-online="user.online"
                                                :show-online="true" />
                                            <div>
                                                <p class="font-semibold text-gray-900 dark:text-gray-100">{{ user.name
                                                    }}</p>
                                                <p class="text-xs text-gray-500 dark:text-gray-400">{{
                                                    user.online ? 'Online' : 'Offline'
                                                    }}</p>
                                            </div>
                                        </div>
                                        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                                            :class="selectedGroupUsers.some(u => u._id === user._id) ? 'bg-green-500 border-green-500' : 'border-gray-200 dark:border-gray-600'">
                                            <svg v-if="selectedGroupUsers.some(u => u._id === user._id)"
                                                class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                                                    d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    <!-- Loading More Indicator -->
                                    <div v-if="chatStore.usersPagination.loading && chatStore.users.length > 0"
                                        class="text-center py-4">
                                        <div
                                            class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500">
                                        </div>
                                    </div>

                                    <!-- All Users Loaded -->
                                    <div v-if="!chatStore.usersPagination.hasMore && chatStore.users.length > 0 && !groupUserSearch"
                                        class="text-center py-4 text-gray-500 text-sm">
                                        <p>All users loaded</p>
                                    </div>
                                </template>
                            </div>

                            <!-- Step 1 Footer (Next Button only) -->
                            <div
                                class="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end bg-gray-50/30 dark:bg-gray-800/30">
                                <button @click="nextStep" :disabled="selectedGroupUsers.length === 0"
                                    class="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Step 2: Group Details -->
                        <div v-else-if="currentStep === 2" key="step-2"
                            class="absolute inset-0 flex flex-col w-full h-full bg-white dark:bg-gray-900">
                            <!-- Header -->
                            <div
                                class="bg-white dark:bg-gray-900 px-6 py-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
                                <div class="flex items-center gap-3 text-gray-900 dark:text-white">
                                    <button @click="prevStep"
                                        class="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center transition">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                    </button>
                                    <h3 class="text-xl font-bold">New Group</h3>
                                </div>
                            </div>

                            <!-- Form Body -->
                            <div class="flex-1 flex flex-col items-center justify-center p-8 gap-8 overflow-y-auto">

                                <!-- Group Icon Upload -->
                                <div @click="triggerFileUpload" class="relative group cursor-pointer shrink-0">
                                    <div v-if="groupIconPreview"
                                        class="w-28 h-28 rounded-full bg-cover bg-center border-4 border-green-500/20 shadow-md"
                                        :style="{ backgroundImage: `url(${groupIconPreview})` }">
                                    </div>
                                    <div v-else
                                        class="w-28 h-28 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 border-2 border-dashed border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 transition">
                                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <!-- Camera icon badge -->
                                    <div
                                        class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <input ref="fileInput" type="file" class="hidden" accept="image/*"
                                        @change="handleFileChange" />
                                </div>

                                <div class="w-full relative">
                                    <label
                                        class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">Group
                                        Subject</label>
                                    <div class="relative">
                                        <input v-model="groupName" type="text" placeholder="Type group subject here..."
                                            class="w-full pl-5 pr-12 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-shadow text-lg shadow-inner"
                                            @keydown.enter="createGroup" autofocus />

                                        <button @click="showEmojiPicker = !showEmojiPicker"
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 transition p-2">
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <!-- Emoji Picker -->
                                    <div v-if="showEmojiPicker"
                                        class="absolute z-50 right-0 top-full mt-2 shadow-xl rounded-xl">
                                        <EmojiPicker :native="true" @select="onSelectEmoji" theme="auto" />
                                    </div>
                                </div>

                                <div class="text-center">
                                    <p class="text-sm text-gray-500">
                                        Creating group with <span
                                            class="font-semibold text-gray-900 dark:text-gray-100">{{
                                                selectedGroupUsers.length
                                            }}</span>
                                        participants.
                                    </p>
                                </div>

                            </div>

                            <!-- Step 2 Footer -->
                            <div
                                class="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-center bg-gray-50/30 dark:bg-gray-800/30 mt-auto">
                                <button @click="createGroup" :disabled="!groupName.trim()"
                                    class="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                    Create Group
                                </button>
                            </div>

                        </div>
                    </transition>
                </div>

            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useChatStore } from "../../stores/chat";
import UserAvatar from "./UserAvatar.vue";
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

const props = defineProps({
    isOpen: { type: Boolean, required: true },
});
const emit = defineEmits(['close']);

const chatStore = useChatStore();

// State
const currentStep = ref(1);
const slideTransition = ref('slide-next');
const groupName = ref("");
const groupUserSearch = ref("");
const selectedGroupUsers = ref([]);
const groupUserListRef = ref(null);
const fileInput = ref(null);
const groupIconFile = ref(null);
const groupIconPreview = ref(null);
const showEmojiPicker = ref(false);

const normalize = (v = "") => v.toLowerCase().trim();

const filteredGroupUsers = computed(() => {
    const q = normalize(groupUserSearch.value);
    if (!q) return chatStore.users;
    return chatStore.users.filter(u => normalize(u.name).includes(q));
});

const toggleGroupUser = (user) => {
    const exists = selectedGroupUsers.value.some(u => u._id === user._id);
    selectedGroupUsers.value = exists
        ? selectedGroupUsers.value.filter(u => u._id !== user._id)
        : [...selectedGroupUsers.value, user];
};

const nextStep = () => {
    if (selectedGroupUsers.value.length === 0) return;
    slideTransition.value = 'slide-next';
    currentStep.value = 2;
};

const prevStep = () => {
    slideTransition.value = 'slide-prev';
    currentStep.value = 1;
};

const triggerFileUpload = () => {
    fileInput.value?.click();
};

const handleFileChange = (event) => {
    const input = event.target;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        groupIconFile.value = file;
        groupIconPreview.value = URL.createObjectURL(file);
    }
};

const onSelectEmoji = (emoji) => {
    groupName.value += emoji.i;
    showEmojiPicker.value = false;
};

const handleGroupUserScroll = () => {
    const el = groupUserListRef.value;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (bottom && chatStore.usersPagination.hasMore && !chatStore.usersPagination.loading) {
        chatStore.loadMoreUsers();
    }
};

const createGroup = async () => {
    if (!groupName.value.trim() || selectedGroupUsers.value.length === 0) return;

    const newGroup = await chatStore.createGroupConversation(
        groupName.value.trim(),
        selectedGroupUsers.value.map(u => u._id),
        groupIconFile.value
    );

    if (newGroup) {
        chatStore.selectConversation(newGroup._id);
    }

    handleCloseGroupModal();
};

const handleCloseGroupModal = () => {
    setTimeout(() => {
        emit("close");
        // Reset
        groupName.value = "";
        selectedGroupUsers.value = [];
        groupUserSearch.value = "";
        currentStep.value = 1;
        showEmojiPicker.value = false;
        groupIconFile.value = null;
        if (groupIconPreview.value) URL.revokeObjectURL(groupIconPreview.value);
        groupIconPreview.value = null;
        if (fileInput.value) fileInput.value.value = '';
    }, 300);
};

watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        chatStore.loadUsers();
    }
});
</script>

<style scoped>
/* Transistions copied from V1 */
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

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.slide-next-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.slide-next-leave-to {
    transform: translateX(-30%);
    opacity: 0;
}

.slide-prev-enter-from {
    transform: translateX(-100%);
    opacity: 0;
}

.slide-prev-leave-to {
    transform: translateX(30%);
    opacity: 0;
}

.slide-next-enter-to,
.slide-next-leave-from,
.slide-prev-enter-to,
.slide-prev-leave-from {
    transform: translateX(0);
    opacity: 1;
}
</style>
