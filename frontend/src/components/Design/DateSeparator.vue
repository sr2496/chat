<!-- DateSeparator.vue -->
<template>
  <div v-if="day" class="relative my-6 flex items-center justify-center">
    <!-- Line -->
    <div
      class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-300 dark:bg-gray-700"
    />
    <!-- Date Label -->
    <span
      class="relative px-5 py-1.5 text-xs font-semibold tracking-wider uppercase text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
    >
      {{ day }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  day: string;
}>();
</script>
