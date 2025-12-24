<template>
    <div class="
        flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 shadow-lg transition-all duration-500 ease-out w-full md:w-80 lg:w-96 translate-x-0
        ">
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
                        <span v-if="conversation.type === 'private'"
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
</template>

<script lang="ts">
// Your script remains exactly the same — no changes needed
// (All the logic you had before works perfectly with the new compact design)
import {
    defineComponent,
    type PropType,
} from "vue";
import { useUserStore } from "../stores/user";
import { useChatStore } from "../stores/chat";


export default defineComponent({
    props: {
        activeConversationId: {
            type: Number as PropType<number | null>, // cast correctly
            required: false,
            default: null, // optional
        },
        conversationsLoading: { type: Boolean, default: false },
    },
    emits: ['new-chat', 'create-group', 'selectConversation'],
    setup(_, { emit }) {

        const userStore = useUserStore();
        const chatStore = useChatStore();

        const openNewChatModal = () => { emit('new-chat'); };
        const openGroupModal = () => { emit('create-group'); };
        const selectConversation = (id: number) => {
            emit('selectConversation', id);
        };

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



        return {
            userStore,
            chatStore,
            openNewChatModal,
            openGroupModal,
            formatTime,
            selectConversation
        };
    },
});
</script>