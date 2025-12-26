<!-- UserAvatar.vue - Final Version with Unread Badge + Online Status -->
<template>
  <div class="relative inline-block">
    <!-- Main Avatar Circle -->
    <div
      class="rounded-full overflow-hidden ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700 transition-all duration-200 hover:ring-blue-400 dark:hover:ring-blue-500 hover:shadow-lg"
      :class="containerClasses"
    >
      <!-- Actual Avatar Image -->
      <img
        v-if="avatar"
        :src="avatar"
        :alt="name + ' avatar'"
        class="w-full h-full object-cover"
      />

      <!-- Fallback: Colored Initials -->
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-white font-semibold shadow-inner"
        :class="initialsBgClass"
      >
        {{ initials }}
      </div>
    </div>

    <!-- Online / Offline Dot (only for private chats) -->
    <div
      v-if="showOnline"
      class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-3 border-white dark:border-gray-900 shadow-md z-10"
      :class="{
        'bg-green-500': isOnline,
        'bg-gray-400': !isOnline
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  avatar?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;// For private chats
  showOnline?: boolean;// Show online/offline dot (default: true for private)
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

// Initials
const initials = computed(() => {
  if (!props.name) return '?';
  const parts = props.name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});

// Modern pastel colors for initials background
const pastelColors = [
  'bg-sky-500',
  'bg-pink-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
];

const colorIndex = computed(() => {
  let hash = 0;
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % pastelColors.length;
});

const initialsBgClass = computed(() => {
  return `${containerClasses.value} ${pastelColors[colorIndex.value]}`;
});

// Show status dot only if explicitly enabled (useful for group vs private)
const showStatusDot = computed(() => props.showStatusDot !== false);
</script>
