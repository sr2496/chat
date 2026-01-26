<script setup>
import { computed } from 'vue'
import UserAvatar from '../Design/UserAvatar.vue'

const props = defineProps({
    action: { type: Object, required: true },
    isOwner: Boolean
})

const emit = defineEmits(['update-status', 'edit', 'delete'])

const priorityColors = {
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
}

const statusColors = {
    open: 'border-l-4 border-gray-400',
    in_progress: 'border-l-4 border-blue-500',
    completed: 'border-l-4 border-green-500 opacity-75'
}

const formatDate = (date) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString()
}

const isOverdue = computed(() => {
    if (!props.action.dueDate || props.action.status === 'completed') return false
    return new Date(props.action.dueDate) < new Date()
})

</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-3 transition hover:shadow-md border border-gray-100 dark:border-gray-700"
        :class="statusColors[action.status]">

        <div class="flex justify-between items-start mb-2">
            <div class="flex-1">
                <h4 class="font-semibold text-gray-800 dark:text-white"
                    :class="{ 'line-through text-gray-500': action.status === 'completed' }">
                    {{ action.title }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{{ action.description }}</p>
            </div>

            <div class="flex flex-col items-end gap-2 ml-4">
                <span class="text-xs px-2 py-1 rounded-full font-medium uppercase tracking-wide"
                    :class="priorityColors[action.priority]">
                    {{ action.priority }}
                </span>

                <div v-if="action.status !== 'completed'" class="flex gap-1">
                    <button v-if="action.status === 'open'" @click="$emit('update-status', 'in_progress')"
                        class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded border border-blue-200"
                        title="Start">
                        Start
                    </button>
                    <button @click="$emit('update-status', 'completed')"
                        class="text-xs bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded border border-green-200"
                        title="Complete">
                        Done
                    </button>
                </div>
                <span v-else class="text-xs font-bold text-green-600 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Completed
                </span>
            </div>
        </div>

        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5" title="Assigned To">
                    <UserAvatar :avatar="action.assignedTo?.avatar" :name="action.assignedTo?.name" size="xs" />
                    <span class="text-xs text-gray-600 dark:text-gray-300 max-w-[80px] truncate">{{
                        action.assignedTo?.name }}</span>
                </div>

                <div class="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>

                <div class="flex items-center gap-1 text-xs text-gray-500"
                    :class="{ 'text-red-500 font-medium': isOverdue }">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{{ formatDate(action.dueDate) }}</span>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <button v-if="isOwner" @click="$emit('delete')" class="text-gray-400 hover:text-red-500 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>
