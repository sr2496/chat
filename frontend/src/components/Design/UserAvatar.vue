<!-- UserAvatar.vue - Final Version with Unread Badge + Online Status -->
<template>
  <div class="relative inline-block">
    <!-- Main Avatar Circle -->
    <div
      class="rounded-full overflow-hidden ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700 transition-all duration-200 hover:ring-blue-400 dark:hover:ring-blue-500 hover:shadow-lg dark:ring-offset-gray-900"
      :class="containerClasses">
      <!-- Actual Avatar Image -->
      <img v-if="avatar" :src="avatar" :alt="'User' + ' avatar'" class="w-full h-full object-cover" />

      <!-- Fallback: Icon (User or Group) -->
      <div v-else
        class="w-full h-full flex items-center justify-center shadow-inner bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
        :class="containerClasses">

        <!-- Group Icon -->
        <svg v-if="isGroup" class="w-[55%] h-[55%]" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>

        <!-- User Icon -->
        <svg v-else class="w-[55%] h-[55%]" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd"
            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
            clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- Online / Offline Dot (only for private chats) -->
    <div v-if="showOnline"
      class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-3 border-white dark:border-gray-900 shadow-md z-10"
      :class="{
        'bg-green-500': isOnline,
        'bg-gray-400': !isOnline
      }" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;// For private chats
  showOnline?: boolean;// Show online/offline dot (default: true for private)
  isGroup?: boolean; // New prop to distinguish groups
}>();

// Size classes
const sizeMap = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-20 h-20 text-3xl',
};

const containerClasses = computed(() => sizeMap[props.size || 'lg']);
</script>
