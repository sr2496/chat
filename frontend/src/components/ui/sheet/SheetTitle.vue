<script setup lang="ts">
import { DialogTitle, type DialogTitleProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface SheetTitleProps extends DialogTitleProps {
  class?: string
}

const props = defineProps<SheetTitleProps>()
</script>

<template>
  <DialogTitle
    v-bind="props"
    :class="cn(
      'text-lg font-semibold text-gray-900 dark:text-gray-50',
      props.class,
    )"
  >
    <slot />
  </DialogTitle>
</template>
