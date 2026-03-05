<script setup lang="ts">
import {
  PopoverContent,
  type PopoverContentEmits,
  type PopoverContentProps,
  PopoverPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props extends PopoverContentProps {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  sideOffset: 4,
  align: 'center',
})
const emits = defineEmits<PopoverContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="forwarded"
      :class="cn(
        'popover-content z-50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-xl outline-none',
        props.class,
      )"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>

<style scoped>
.popover-content {
  transition: all 0.15s ease;
}
.popover-content[data-state='closed'] {
  opacity: 0;
  transform: scale(0.95);
}
.popover-content[data-state='open'] {
  opacity: 1;
  transform: scale(1);
}
</style>
