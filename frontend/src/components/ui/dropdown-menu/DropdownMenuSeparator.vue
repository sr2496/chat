<script setup lang="ts">
import { DropdownMenuSeparator, type DropdownMenuSeparatorProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends DropdownMenuSeparatorProps {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <DropdownMenuSeparator
    v-bind="{ ...props, class: undefined }"
    :class="cn('-mx-1.5 my-1 h-px bg-gray-200 dark:bg-gray-700', props.class)"
  />
</template>
