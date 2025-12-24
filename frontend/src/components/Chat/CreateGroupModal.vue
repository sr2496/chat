<template>
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                <button @click="handleClose"
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
        const groupName = ref("");
        const groupUserSearch = ref("");
        const selectedGroupUsers = ref<any[]>([]);

        const createGroup = async () => {
            await chatStore.createGroupConversation(
                groupName.value,
                selectedGroupUsers.value.map(u => u.id)
            );

            emit("close");
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

        const normalize = (v = "") => v.toLowerCase();
        const filteredGroupUsers = computed(() => {
            const q = normalize(groupUserSearch.value);
            if (!q) return props.users;
            return props.users.filter(u => normalize(u.name).includes(q));
        });




        /* ---------------- ACTIONS ---------------- */


        const handleClose = () => {
            selectedGroupUsers.value = [];
            emit("close"); // emit close event
        };

        return {
            groupName,
            groupUserSearch,
            filteredGroupUsers,
            handleClose,
            toggleGroupUser,
            selectedGroupUsers,
            createGroup,

        };
    },
});
</script>