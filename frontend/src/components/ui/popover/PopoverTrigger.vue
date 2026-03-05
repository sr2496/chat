<script setup lang="ts">
import { PopoverTrigger, type PopoverTriggerProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends PopoverTriggerProps {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <PopoverTrigger v-bind="{ ...props, class: undefined }" :class="cn(props.class)">
    <slot />
  </PopoverTrigger>
</template>
