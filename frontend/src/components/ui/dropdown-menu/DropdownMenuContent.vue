<script setup lang="ts">
import {
  DropdownMenuContent,
  type DropdownMenuContentEmits,
  type DropdownMenuContentProps,
  DropdownMenuPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props extends DropdownMenuContentProps {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  sideOffset: 4,
})
const emits = defineEmits<DropdownMenuContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      v-bind="forwarded"
      :class="cn(
        'dropdown-content z-50 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-xl',
        props.class,
      )"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>

<style scoped>
.dropdown-content {
  transition: all 0.15s ease;
}
.dropdown-content[data-state='closed'] {
  opacity: 0;
  transform: scale(0.95);
}
.dropdown-content[data-state='open'] {
  opacity: 1;
  transform: scale(1);
}
</style>
