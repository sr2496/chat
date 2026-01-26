<script setup>
import { ref, onMounted, computed } from 'vue'
import { useActionStore } from '../stores/actions'
import { useAuthStore } from '../stores/auth'
import ActionItem from '../components/Actions/ActionItem.vue'
import CreateActionModal from '../components/Actions/CreateActionModal.vue'
import SwalUtils from '../utils/swal'

// We might not need a create modal directly on dashboard without a conversation context 
// unless we allow picking conversation. For now, let's just list actions.

const actionStore = useActionStore()
const authStore = useAuthStore()

const activeTab = ref('my_actions') // my_actions, created_by_me, completed

const filters = computed(() => {
    if (activeTab.value === 'my_actions') return { filter: 'assigned_to_me', status: 'open' } // Or open/in_progress
    if (activeTab.value === 'created_by_me') return { filter: 'created_by_me' }
    if (activeTab.value === 'completed') return { status: 'completed' }
    return {}
})

const tabs = [
    { id: 'my_actions', label: 'My Actions' },
    { id: 'created_by_me', label: 'Created by Me' },
    { id: 'completed', label: 'Completed' }
]

onMounted(() => {
    loadActions()
})

const loadActions = () => {
    actionStore.fetchActions(filters.value)
}

const handleTabChange = (tabId) => {
    activeTab.value = tabId
    loadActions()
}

const updateStatus = async (action, status) => {
    await actionStore.updateAction(action._id, { status })
}

const confirmDelete = async (action) => {
    const result = await SwalUtils.confirmDelete()
    if (result.isConfirmed) {
        await actionStore.deleteAction(action._id)
        SwalUtils.showSuccess('Deleted!', 'The action has been deleted.')
    }
}
</script>

<template>
    <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <div
            class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <svg class="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Action Center
            </h1>
        </div>

        <!-- Metric Cards -->
        <!-- Optional: Add summary metrics here later -->

        <!-- Tabs -->
        <div class="px-6 pt-6 pb-2">
            <div class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <button v-for="tab in tabs" :key="tab.id" @click="handleTabChange(tab.id)"
                    class="px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap"
                    :class="activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'">
                    {{ tab.label }}
                    <span v-if="activeTab === tab.id"
                        class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div v-if="actionStore.loading" class="flex justify-center py-10">
                <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
            </div>

            <div v-else-if="actionStore.actions.length === 0"
                class="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-lg font-medium">No actions found</p>
                <p class="text-sm opacity-75">Check back later or create one in a chat</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ActionItem v-for="action in actionStore.actions" :key="action._id" :action="action"
                    :is-owner="action.createdBy?._id === authStore.user._id"
                    @update-status="(s) => updateStatus(action, s)" @delete="confirmDelete(action)" />
            </div>
        </div>
    </div>
</template>
