<script setup lang="ts">
import { DropdownMenuTrigger, type DropdownMenuTriggerProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends DropdownMenuTriggerProps {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <DropdownMenuTrigger v-bind="{ ...props, class: undefined }" :class="cn(props.class)">
    <slot />
  </DropdownMenuTrigger>
</template>
