<script setup lang="ts">
import {
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props extends DialogContentProps {
  class?: string
}

const props = defineProps<Props>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay class="dialog-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
    <DialogContent
      v-bind="forwarded"
      :class="cn(
        'dialog-content fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700',
        props.class,
      )"
    >
      <slot />
    </DialogContent>
  </DialogPortal>
</template>

<style scoped>
.dialog-overlay {
  transition: opacity 0.2s ease;
}
.dialog-overlay[data-state='closed'] {
  opacity: 0;
}
.dialog-overlay[data-state='open'] {
  opacity: 1;
}

.dialog-content {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dialog-content[data-state='closed'] {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}
.dialog-content[data-state='open'] {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
</style>
