<script setup lang="ts">
import { DialogDescription, type DialogDescriptionProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props extends DialogDescriptionProps {
  class?: string
}

const props = defineProps<Props>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <DialogDescription
    v-bind="delegatedProps"
    :class="cn('text-sm text-gray-500 dark:text-gray-400', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
