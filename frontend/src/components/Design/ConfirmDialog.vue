<template>
    <Dialog :open="isOpen" @update:open="(v: boolean) => { if (!v) handleCancel() }">
        <DialogContent class="max-w-sm p-0 overflow-hidden">
            <!-- Icon -->
            <div class="pt-6 flex justify-center">
                <div :class="[
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    iconBgClass
                ]">
                    <!-- Danger -->
                    <svg v-if="options.variant === 'danger'" class="w-6 h-6 text-red-600 dark:text-red-400"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <!-- Warning -->
                    <svg v-else-if="options.variant === 'warning'"
                        class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <!-- Info -->
                    <svg v-else class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            <!-- Content -->
            <div class="px-6 pt-4 pb-2 text-center">
                <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ options.title }}
                </DialogTitle>
                <DialogDescription class="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {{ options.message }}
                </DialogDescription>
            </div>

            <!-- Actions -->
            <div class="px-6 pb-6 pt-4 flex gap-3">
                <button @click="handleCancel"
                    class="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    {{ options.cancelText }}
                </button>
                <button ref="confirmBtnRef" @click="handleConfirm" :class="[
                    'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition-colors',
                    confirmBtnClass
                ]">
                    {{ options.confirmText }}
                </button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useConfirmDialog } from '../../composables/useConfirmDialog';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';

const { isOpen, options, handleConfirm, handleCancel } = useConfirmDialog();

const confirmBtnRef = ref<HTMLButtonElement | null>(null);

watch(isOpen, async (open) => {
    if (open) {
        await nextTick();
        confirmBtnRef.value?.focus();
    }
});

const iconBgClass = computed(() => {
    switch (options.value.variant) {
        case 'danger': return 'bg-red-100 dark:bg-red-900/30';
        case 'warning': return 'bg-amber-100 dark:bg-amber-900/30';
        default: return 'bg-blue-100 dark:bg-blue-900/30';
    }
});

const confirmBtnClass = computed(() => {
    switch (options.value.variant) {
        case 'danger': return 'bg-red-600 hover:bg-red-700';
        case 'warning': return 'bg-amber-600 hover:bg-amber-700';
        default: return 'bg-blue-600 hover:bg-blue-700';
    }
});
</script>
