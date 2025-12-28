<template>
  <transition name="slide-fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" @click="close">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 transition-opacity"></div>

      <!-- Offcanvas Panel -->
      <div @click.stop
        class="absolute right-0 top-0 h-full w-full max-w-sm bg-chat-surface shadow-2xl flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-chat-border">
          <h2 class="text-xl font-bold text-chat-text">Settings</h2>
          <button @click="close"
            class="p-2 rounded-lg hover:bg-chat-bg/50 text-chat-text-muted transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <!-- Theme Section -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-chat-text-muted uppercase tracking-wider">
              Appearance
            </h3>

            <div class="space-y-3">
              <label class="text-sm font-medium text-chat-text">Theme</label>

              <!-- Theme Options -->
              <div class="grid grid-cols-2 gap-3">
                <!-- Light Theme -->
                <button
                  @click="setTheme('light')"
                  :class="[
                    'relative p-4 rounded-xl border-2 transition-all duration-200',
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50/70'
                      : 'border-chat-border hover:border-chat-border/70'
                  ]"
                >
                  <div class="flex flex-col items-center gap-2">
                    <div
                      class="w-12 h-12 rounded-lg bg-chat-surface border border-chat-border flex items-center justify-center shadow-sm"
                    >
                      <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clip-rule="evenodd" />
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-chat-text">Light</span>
                  </div>

                  <div v-if="theme === 'light'"
                    class="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                </button>

                <!-- Dark Theme -->
                <button
                  @click="setTheme('dark')"
                  :class="[
                    'relative p-4 rounded-xl border-2 transition-all duration-200',
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-950/30'
                      : 'border-chat-border hover:border-chat-border/70'
                  ]"
                >
                  <div class="flex flex-col items-center gap-2">
                    <div
                      class="w-12 h-12 rounded-lg bg-chat-bg border border-chat-border flex items-center justify-center shadow-sm"
                    >
                      <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-chat-text">Dark</span>
                  </div>

                  <div v-if="theme === 'dark'"
                    class="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useTheme } from '../../composables/useTheme';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { theme, setTheme } = useTheme();

const close = () => {
  emit('close');
};
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

</style>