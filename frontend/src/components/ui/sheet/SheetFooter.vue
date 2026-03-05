<script setup lang="ts">
import { cn } from '@/lib/utils'

interface SheetFooterProps {
  class?: string
}

const props = defineProps<SheetFooterProps>()
</script>

<template>
  <div
    :class="cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6',
      props.class,
    )"
  >
    <slot />
  </div>
</template>
