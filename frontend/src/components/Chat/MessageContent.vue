<template>
    <div>

        <img v-if="msg.type === 'image' && msg.file_path" :src="msg.file_path"
            class="rounded-xl max-w-[250px] cursor-pointer" @click="openImageModal(msg.file_path)" />

        <video v-else-if="msg.type === 'video' && msg.file_path" controls class="rounded-xl max-w-[250px] w-full">
            <source :src="msg.file_path" :type="msg.mime_type" />
        </video>

        <a v-else-if="msg.type === 'file' && msg.file_path" :href="msg.file_path" :download="msg.file_name"
            class="flex items-center gap-3 w-full bg-gray-100 dark:bg-slate-700 rounded-xl p-2 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
            <!-- file icon + name + download -->
            <svg class="w-6 h-6 flex-shrink-0 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ msg.file_name }}</p>
                <p class="text-xs opacity-70">{{ formatFileSize(msg.file_size) }}</p>
            </div>
            <svg class="w-5 h-5 flex-shrink-0 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        </a>

        <p v-if="msg.message" class="text-sm break-words leading-relaxed text-gray-900 dark:text-gray-100">
            {{ msg.message }}
        </p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MessageContent from './MessageContent.vue';
export default defineComponent({
    components: { MessageContent },
    props: {
        msg: Object,
        isSent: Boolean,
        setMessageRef: Function,
        getMessageDay: Function,
        formatTime: Function,
        groupedReactions: Function
    },
    emits: ['openImage', 'openReaction'],
    setup(props, { emit }) {
        function openImage(path: string) {
            emit('openImage', path);
        }
        function openReaction(msg: any) {
            emit('openReaction', msg);
        }
        return {
            openImage,
            openReaction
        };
    }
});
</script>