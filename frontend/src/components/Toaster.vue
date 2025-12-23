<template>
  <transition name="fade">
    <div
      v-if="visible"
      :class="[
        'fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-md text-white',
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      ]"
    >
      {{ message }}
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'Toaster',
  setup(_, { expose }) {
    const message = ref('');
    const type = ref<'success' | 'error'>('success');
    const visible = ref(false);
    let timeout: number;

    const show = (msg: string, msgType: 'success' | 'error' = 'success', duration = 3000) => {
      message.value = msg;
      type.value = msgType;
      visible.value = true;

      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        visible.value = false;
      }, duration);
    };

    expose({ show });

    return { message, type, visible, show };
  },
});
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
