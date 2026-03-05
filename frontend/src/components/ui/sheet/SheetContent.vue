<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  type DialogContentEmits,
  type DialogContentProps,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

interface SheetContentProps extends DialogContentProps {
  side?: 'left' | 'right' | 'top' | 'bottom'
  class?: string
}

const props = withDefaults(defineProps<SheetContentProps>(), {
  side: 'left',
})

const emits = defineEmits<DialogContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, side: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const sideClasses: Record<string, string> = {
  left: 'left-0 top-0 h-full w-full max-w-sm',
  right: 'right-0 top-0 h-full w-full max-w-sm',
  top: 'top-0 left-0 w-full h-auto max-h-[80vh]',
  bottom: 'bottom-0 left-0 w-full h-auto max-h-[80vh]',
}

const slideVar: Record<string, string> = {
  left: '-100%',
  right: '100%',
  top: '-100%',
  bottom: '100%',
}

const slideAxis: Record<string, 'X' | 'Y'> = {
  left: 'X',
  right: 'X',
  top: 'Y',
  bottom: 'Y',
}
</script>

<template>
  <DialogPortal>
    <DialogOverlay class="sheet-overlay fixed inset-0 z-50 bg-black/50" />
    <DialogContent
      v-bind="forwarded"
      :class="cn(
        'sheet-content fixed z-50 bg-chat-surface shadow-2xl flex flex-col',
        sideClasses[side],
        props.class,
      )"
      :style="{
        '--slide-from': `translate${slideAxis[side]}(${slideVar[side]})`,
        '--slide-to': `translate${slideAxis[side]}(0)`,
      } as any"
    >
      <slot />
    </DialogContent>
  </DialogPortal>
</template>

<style scoped>
.sheet-overlay {
  transition: opacity 0.3s ease;
}
.sheet-overlay[data-state='closed'] {
  opacity: 0;
}
.sheet-overlay[data-state='open'] {
  opacity: 1;
}

.sheet-content {
  transition: transform 0.3s ease;
}
.sheet-content[data-state='closed'] {
  transform: var(--slide-from);
}
.sheet-content[data-state='open'] {
  transform: var(--slide-to);
}
</style>
