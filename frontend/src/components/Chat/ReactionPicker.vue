<template>
  <teleport to="body">
    <div v-if="visible" class="fixed z-50">
      <div class="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl p-2 flex gap-2">
        <button v-for="emoji in emojis" :key="emoji" @click="selectEmoji(emoji)"
          class="p-1 rounded-full text-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition">
          {{ emoji }}
        </button>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  props: {
    visible: { type: Boolean, default: false },
    emojis: { type: Array as () => string[], default: () => ['😀','😂','😍','😢','👍','👎','🔥'] }
  },
  emits: ['select'],
  methods: {
    selectEmoji(emoji: string) {
      this.$emit('select', emoji);
    }
  }
});
</script>
