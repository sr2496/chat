<script setup lang="ts">
import { DialogDescription, type DialogDescriptionProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface SheetDescriptionProps extends DialogDescriptionProps {
  class?: string
}

const props = defineProps<SheetDescriptionProps>()
</script>

<template>
  <DialogDescription
    v-bind="props"
    :class="cn(
      'text-sm text-gray-500 dark:text-gray-400',
      props.class,
    )"
  >
    <slot />
  </DialogDescription>
</template>
