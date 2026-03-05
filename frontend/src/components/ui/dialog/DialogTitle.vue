<script setup lang="ts">
import { DialogTitle, type DialogTitleProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props extends DialogTitleProps {
  class?: string
}

const props = defineProps<Props>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <DialogTitle
    v-bind="delegatedProps"
    :class="cn('text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
