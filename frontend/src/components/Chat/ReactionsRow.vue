<template>
    <div v-if="reactions.length > 0" class="absolute -bottom-4 left-2 flex items-center z-10">
        <button v-for="reaction in reactions" :key="reaction.emoji"
            class="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition hover:scale-105 shadow-sm">
            <span>{{ reaction.emoji }}</span>
            <span v-if="reaction.count > 1" class="text-xs">{{ reaction.count }}</span>
        </button>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

type Reaction = {
    emoji: string
    count: number
    users?: number[] | string[]
}

export default defineComponent({
    props: {
        reactions: {
            type: Array as PropType<Reaction[]>,
            required: true,
            default: () => [],
        }
    },
});
</script>