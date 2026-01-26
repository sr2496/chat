<script setup>
import { ref, computed } from 'vue'
import { useActionStore } from '../../stores/actions'
import { useAuthStore } from '../../stores/auth'
import UserAvatar from '../Design/UserAvatar.vue'

const props = defineProps({
    isOpen: Boolean,
    conversation: Object, // To get participants
    messageId: String, // Optional, to link to message
    initialTitle: String
})

const emit = defineEmits(['close', 'created'])

const actionStore = useActionStore()
const authStore = useAuthStore()

const loading = ref(false)
const form = ref({
    title: props.initialTitle || '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium'
})

// Auto-select logged-in user if no assignee
const assignees = computed(() => {
    if (!props.conversation) return []
    return props.conversation.participants || []
})

const handleSubmit = async () => {
    if (!form.value.title) return

    loading.value = true
    try {
        await actionStore.createAction({
            ...form.value,
            conversation: props.conversation._id,
            message: props.messageId
        })
        emit('created')
        handleClose()
    } catch (err) {
        console.error(err)
    } finally {
        loading.value = false
    }
}

const handleClose = () => {
    emit('close')
    // Reset form
    form.value = {
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium'
    }
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>

        <div
            class="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden transform transition-all">
            <div
                class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Create Action</h3>
                <button @click="handleClose" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input v-model="form.title" type="text" placeholder="What needs to be done?" autofocus
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description
                        (Optional)</label>
                    <textarea v-model="form.description" rows="3" placeholder="Add details..."
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
                        <select v-model="form.assignedTo"
                            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Select User</option>
                            <option v-for="user in assignees" :key="user._id" :value="user._id">
                                {{ user.name }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                        <input v-model="form.dueDate" type="date"
                            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                    <div class="flex gap-2">
                        <button v-for="p in ['low', 'medium', 'high']" :key="p" type="button" @click="form.priority = p"
                            class="flex-1 py-2 rounded-lg text-sm font-medium border transition capitalize"
                            :class="form.priority === p
                                ? (p === 'high' ? 'bg-red-500 text-white border-red-600' : p === 'medium' ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-500 text-white border-gray-600')
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'">
                            {{ p }}
                        </button>
                    </div>
                </div>
            </div>

            <div
                class="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                <button @click="handleClose"
                    class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition font-medium">Cancel</button>
                <button @click="handleSubmit" :disabled="!form.title || loading"
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {{ loading ? 'Creating...' : 'Create Action' }}
                </button>
            </div>
        </div>
    </div>
</template>
