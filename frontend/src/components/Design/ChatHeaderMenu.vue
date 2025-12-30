<template>
    <transition name="dropdown-fade">
        <div v-if="isOpen" ref="menuRef"
            class="absolute right-0 top-full mt-2 w-64 bg-chat-surface border border-chat-border rounded-xl shadow-2xl overflow-hidden z-50">

            <!-- Menu Items -->
            <div class="py-2">
                <!-- Search in Conversation -->
                <button @click="handleSearch"
                    class="w-full px-4 py-3 text-left hover:bg-chat-bg/80 transition-colors flex items-center gap-3 group">
                    <svg class="w-5 h-5 text-chat-text-muted group-hover:text-blue-500 transition" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span class="text-sm font-medium text-chat-text">Search messages</span>
                </button>

                <!-- Mute/Unmute -->
                <button @click="handleMute"
                    class="w-full px-4 py-3 text-left hover:bg-chat-bg/80 transition-colors flex items-center gap-3 group">
                    <svg v-if="isMuted" class="w-5 h-5 text-chat-text-muted group-hover:text-green-500 transition"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <svg v-else class="w-5 h-5 text-chat-text-muted group-hover:text-yellow-500 transition" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    <span class="text-sm font-medium text-chat-text">{{ isMuted ? 'Unmute' : 'Mute' }}
                        notifications</span>
                </button>

                <!-- View Info -->
                <button @click="handleViewInfo"
                    class="w-full px-4 py-3 text-left hover:bg-chat-bg/80 transition-colors flex items-center gap-3 group">
                    <svg class="w-5 h-5 text-chat-text-muted group-hover:text-blue-500 transition" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-sm font-medium text-chat-text">{{ isGroup ? 'Group' : 'Contact' }} info</span>
                </button>

                <!-- Divider -->
                <div class="my-2 border-t border-chat-border"></div>

                <!-- Group-specific: Add Members -->
                <button v-if="isGroup" @click="handleAddMembers"
                    class="w-full px-4 py-3 text-left hover:bg-chat-bg/80 transition-colors flex items-center gap-3 group">
                    <svg class="w-5 h-5 text-chat-text-muted group-hover:text-green-500 transition" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span class="text-sm font-medium text-chat-text">Add members</span>
                </button>

                <!-- Group-specific: Leave Group -->
                <button v-if="isGroup" @click="handleLeaveGroup"
                    class="w-full px-4 py-3 text-left hover:bg-chat-bg/80 transition-colors flex items-center gap-3 group">
                    <svg class="w-5 h-5 text-chat-text-muted group-hover:text-orange-500 transition" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span class="text-sm font-medium text-chat-text">Leave group</span>
                </button>

                <!-- Divider before dangerous actions -->
                <div class="my-2 border-t border-chat-border"></div>

                <!-- Delete Conversation -->
                <button @click="handleDelete"
                    class="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group">
                    <svg class="w-5 h-5 text-chat-text-muted group-hover:text-red-500 transition" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span class="text-sm font-medium group-hover:text-red-500 text-chat-text">Delete conversation</span>
                </button>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">

const props = defineProps<{
    isOpen: boolean;
    isGroup: boolean;
    isMuted: boolean;
    conversationId: number;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'search'): void;
    (e: 'mute'): void;
    (e: 'view-info'): void;
    (e: 'add-members'): void;
    (e: 'leave-group'): void;
    (e: 'delete'): void;
}>();

const handleSearch = () => {
    emit('search');
    emit('close');
};

const handleMute = () => {
    emit('mute');
    emit('close');
};

const handleViewInfo = () => {
    emit('view-info');
    emit('close');
};

const handleAddMembers = () => {
    emit('add-members');
    emit('close');
};

const handleLeaveGroup = () => {
    emit('leave-group');
    emit('close');
};

const handleDelete = () => {
    emit('delete');
    emit('close');
};
</script>

<style scoped>
.dropdown-fade-enter-active {
    transition: all 0.2s ease-out;
}

.dropdown-fade-leave-active {
    transition: all 0.15s ease-in;
}

.dropdown-fade-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.dropdown-fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}
</style>
