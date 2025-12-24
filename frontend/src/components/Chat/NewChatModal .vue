<template>
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

                    <div v-for="user in filteredUserList" :key="user?.id" @click="startPrivateChat(user)"
                        class="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer rounded-lg transition-all duration-200">
                        <div
                            class="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-semibold text-sm shadow-sm mr-3">
                            {{ user?.name.charAt(0).toUpperCase() }}
                        </div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user?.name }}</p>
                    </div>
                </template>
            </div>
            <div class="mt-6 flex justify-end">
                <button @click="handleClose"
                    class="px-6 py-2.5 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition text-sm font-medium text-gray-900 dark:text-white">
                    Close
                </button>
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
} from "vue";
import { useChatStore } from "../../stores/chat";


export default defineComponent({
    props: {
        conversationsLoading: {
            type: Boolean,
            required: true,
            default: false,
        },
        users: {
            type: Array as () => any[],
            required: true,
            default: () => [],
        },
    },
    emits: ['close'],
    setup(props, { emit }) {

        const chatStore = useChatStore();

        const userSearchQuery = ref("");

        const normalize = (v = "") => v.toLowerCase();

        const filteredUserList = computed(() => {
            const q = normalize(userSearchQuery.value);
            if (!q) return props.users;
            return props.users.filter(u => normalize(u.name).includes(q));
        });

        /* ---------------- ACTIONS ---------------- */


        const startPrivateChat = async (user: any) => {
            await chatStore.createPrivateConversation(user.id);
            emit("close");
            userSearchQuery.value = "";
        };

        const handleClose = () => {
            emit("close"); // emit close event
        };

        return {
            userSearchQuery,
            filteredUserList,
            startPrivateChat,
            handleClose,

        };
    },
});
</script>