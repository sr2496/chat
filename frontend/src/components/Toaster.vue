<template>
  <teleport to="body">
    <transition-group name="toast-list" tag="div" class="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      <div v-for="toast in toasts" :key="toast.id" class="toast-item pointer-events-auto min-w-[320px] max-w-md">
        <div :class="[
          'flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-sm border transition-all duration-300',
          getToastClasses(toast.type)
        ]">
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <div :class="['w-6 h-6 rounded-full flex items-center justify-center', getIconBgClass(toast.type)]">
              <!-- Success Icon -->
              <svg v-if="toast.type === 'success'" class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <!-- Error Icon -->
              <svg v-else-if="toast.type === 'error'" class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <!-- Info Icon -->
              <svg v-else-if="toast.type === 'info'" class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <!-- Warning Icon -->
              <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p :class="['text-sm font-medium leading-snug', getTextClass()]">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button @click="removeToast(toast.id)"
            :class="['flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10', getTextClass()]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Progress Bar -->
          <div class="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl">
            <div :class="['h-full transition-all ease-linear', getProgressClass(toast.type)]"
              :style="{ width: toast.progress + '%' }"></div>
          </div>
        </div>
      </div>
    </transition-group>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  progress: number;
  timer?: number;
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

const getToastClasses = (type: string) => {
  const classes = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400/20',
    error: 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400/20',
    info: 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400/20',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600 border-yellow-400/20'
  };
  return classes[type as keyof typeof classes];
};

const getIconBgClass = (type: string) => {
  const classes = {
    success: 'bg-white/20',
    error: 'bg-white/20',
    info: 'bg-white/20',
    warning: 'bg-white/20'
  };
  return classes[type as keyof typeof classes];
};

const getTextClass = () => {
  return 'text-white';
};

const getProgressClass = (type: string) => {
  const classes = {
    success: 'bg-white/30',
    error: 'bg-white/30',
    info: 'bg-white/30',
    warning: 'bg-white/30'
  };
  return classes[type as keyof typeof classes];
};

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) {
    const toast = toasts.value[index];
    if (toast && toast.timer) {
      clearInterval(toast.timer);
    }
    toasts.value.splice(index, 1);
  }
};

const show = (
  message: string,
  msgType: 'success' | 'error' | 'info' | 'warning' = 'success',
  duration = 4000
) => {
  const id = nextId++;
  const toast: Toast = {
    id,
    message,
    type: msgType,
    progress: 100
  };

  toasts.value.push(toast);

  // Progress bar animation
  const interval = 50;
  const decrement = (100 / duration) * interval;
  toast.timer = window.setInterval(() => {
    const currentToast = toasts.value.find(t => t.id === id);
    if (currentToast) {
      currentToast.progress -= decrement;
      if (currentToast.progress <= 0) {
        removeToast(id);
      }
    }
  }, interval);

  // Remove after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);
};

// Expose show method to parent
defineExpose({ show });
</script>

<style scoped>
.toast-list-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-list-leave-active {
  transition: all 0.3s ease-out;
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-list-move {
  transition: transform 0.3s ease;
}

.toast-item {
  position: relative;
}
</style>
