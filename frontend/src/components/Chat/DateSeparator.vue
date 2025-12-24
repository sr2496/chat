<template>
  <div class="relative my-2 text-center">
    <div class="absolute inset-0 flex items-center">
      <div class="w-full border-t border-gray-300 dark:border-gray-700" />
    </div>
    <span class="relative px-4 bg-white dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400">
      {{ day }}
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  props: {
    day: { type: String, required: true }
  }
});
</script>
