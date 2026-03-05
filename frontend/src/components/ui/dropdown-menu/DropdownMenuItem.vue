<script setup lang="ts">
import { DropdownMenuItem, type DropdownMenuItemEmits, type DropdownMenuItemProps, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props extends DropdownMenuItemProps {
  class?: string
}

const props = defineProps<Props>()
const emits = defineEmits<DropdownMenuItemEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuItem
    v-bind="forwarded"
    :class="cn(
      'relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer transition-colors data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700',
      props.class,
    )"
  >
    <slot />
  </DropdownMenuItem>
</template>
