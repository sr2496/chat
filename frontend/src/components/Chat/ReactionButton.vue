<template>
  <button
    @click.stop="emitClick"
    :class="buttonClass"
    title="React"
  >
    <svg
      class="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  side: 'left' | 'right'
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const emitClick = () => emit('click')

const buttonClass = computed(() => [
  'absolute top-4 opacity-0 group-hover/row:opacity-100',
  'pointer-events-none group-hover/row:pointer-events-auto',
  'transition-all duration-200 ease-out',
  'w-10 h-10 rounded-full flex items-center justify-center',
  'bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl',
  'border-2 border-gray-200 dark:border-slate-700',
  'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
  'z-50 backdrop-blur-md',
  props.side === 'left' ? '-left-11' : '-right-11',
])
</script>
