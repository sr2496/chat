<script setup>
import { computed } from 'vue'

const props = defineProps({
    avatar: String,
    size: { type: String, default: 'md' }, // sm, md, lg, xl
    isOnline: Boolean,
    showOnline: { type: Boolean, default: false },
    isGroup: { type: Boolean, default: false },
    name: { type: String, default: 'User' }
})

const sizeClasses = computed(() => {
    switch (props.size) {
        case 'sm': return 'w-8 h-8 text-xs'
        case 'lg': return 'w-12 h-12 text-lg'
        case 'xl': return 'w-16 h-16 text-xl'
        default: return 'w-10 h-10 text-sm'
    }
})
</script>

<template>
    <div class="relative inline-block">
        <div class="rounded-full bg-gray-700 flex items-center justify-center text-white font-bold overflow-hidden select-none border border-gray-600"
            :class="sizeClasses">
            <img :src="avatar" alt="Avatar" class="w-full h-full object-cover" />
        </div>

        <!-- Online Indicator -->
        <span v-if="showOnline && isOnline"
            class="absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900 bg-green-500 transform translate-y-1/4 translate-x-1/4"
            :class="{
                'w-2.5 h-2.5': size === 'sm',
                'w-3 h-3': size === 'md',
                'w-3.5 h-3.5': size === 'lg',
                'w-4 h-4': size === 'xl'
            }"></span>
    </div>
</template>
