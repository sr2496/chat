<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
    avatar: String,
    size: { type: String, default: 'md' }, // sm, md, lg, xl
    isOnline: Boolean,
    showOnline: { type: Boolean, default: false },
    isGroup: { type: Boolean, default: false },
    name: { type: String, default: 'User' }
})

const imgError = ref(false);

watch(() => props.avatar, () => {
    imgError.value = false;
});

const fullAvatarUrl = computed(() => {
    if (!props.avatar || imgError.value) return null;
    if (props.avatar.startsWith('http') || props.avatar.startsWith('data:')) return props.avatar;
    return `http://localhost:5000${props.avatar}`;
})

const initials = computed(() => {
    return (props.name || 'U').substring(0, 2).toUpperCase();
})

const onImgError = () => {
    imgError.value = true;
}

const sizeClasses = computed(() => {
    switch (props.size) {
        case 'xs': return 'w-6 h-6 text-[10px]'
        case 'sm': return 'w-8 h-8 text-xs'
        case 'lg': return 'w-12 h-12 text-lg'
        case 'xl': return 'w-16 h-16 text-xl'
        default: return 'w-10 h-10 text-sm'
    }
})
</script>

<template>
    <div class="relative inline-block shrink-0">
        <div class="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-200 font-bold overflow-hidden select-none border border-gray-200 dark:border-gray-600"
            :class="sizeClasses">
            <img v-if="fullAvatarUrl" :src="fullAvatarUrl" alt="Avatar" class="w-full h-full object-cover"
                @error="onImgError" />
            <span v-else>{{ initials }}</span>
        </div>

        <!-- Online Indicator -->
        <span v-if="showOnline && isOnline"
            class="absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900 bg-green-500 transform translate-y-1/4 translate-x-1/4"
            :class="{
                'w-1.5 h-1.5': size === 'xs',
                'w-2.5 h-2.5': size === 'sm',
                'w-3 h-3': size === 'md',
                'w-3.5 h-3.5': size === 'lg',
                'w-4 h-4': size === 'xl'
            }"></span>
    </div>
</template>
