<template>
    <div :ref="el => setMessageRef(msg.id, el)" :data-day="getMessageDay(msg.created_at)"
        class="flex message-row py-2 group/row relative" :class="{ 'justify-end': isSent }">

        <!-- Received Message -->
        <div v-if="!isSent" class="flex gap-3 max-w-[75%]">
            <div class="relative">

                <div
                    class="received-bubble bg-white dark:bg-slate-800 rounded-2xl shadow-sm px-4 py-2 flex flex-col w-fit max-w-full">

                    <MessageContent :msg="msg" @openImage="openImage" />

                    <!-- Message Content -->


                    <!-- Time -->
                    <div class="flex justify-end mt-1">
                        <span class="text-[11px] opacity-60 whitespace-nowrap">{{ formatTime(msg.created_at) }}</span>
                    </div>


                </div>
                <!-- Reactions Row -->
                <div v-if="groupedReactions(msg.reactions).length > 0"
                    class="absolute -bottom-4 left-2 flex items-center z-10">
                    <button v-for="reaction in groupedReactions(msg.reactions)" :key="reaction.emoji"
                        class="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition hover:scale-105 shadow-sm">
                        <span>{{ reaction.emoji }}</span>
                        <span v-if="reaction.count > 1" class="text-xs">{{ reaction.count }}</span>
                    </button>
                </div>



                <!-- Hover Reaction Button (😊) -->
                <button @click.stop="openReactionPicker(msg)" class="absolute -right-11 top-4 opacity-0 group-hover/row:opacity-100 
                    pointer-events-none group-hover/row:pointer-events-auto
                    transition-all duration-200 ease-out
                    w-10 h-10 rounded-full flex items-center justify-center
                    bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl
                    border-2 border-gray-200 dark:border-slate-700
                    text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white
                    z-50 backdrop-blur-md" title="React">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

            </div>
        </div>

        <!-- Sent Message -->
        <div v-else class="max-w-[75%]">
            <div class="relative">

                <div
                    class="sent-bubble bg-blue-500 text-white rounded-2xl shadow-sm px-4 py-2 flex flex-col w-fit max-w-full">

                    <!-- Same content as above -->
                    <img v-if="msg.type === 'image' && msg.file_path" :src="msg.file_path"
                        class="rounded-xl max-w-[250px] cursor-pointer" @click="openImageModal(msg.file_path)" />

                    <video v-else-if="msg.type === 'video' && msg.file_path" controls
                        class="rounded-xl max-w-[250px] w-full">
                        <source :src="msg.file_path" :type="msg.mime_type" />
                    </video>

                    <a v-else-if="msg.type === 'file' && msg.file_path" :href="msg.file_path" :download="msg.file_name"
                        class="flex items-center gap-3 w-full bg-blue-600/20 rounded-xl p-2 hover:bg-blue-600/30 transition">
                        <!-- file content -->
                        <svg class="w-6 h-6 flex-shrink-0 opacity-90" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">{{ msg.file_name }}</p>
                            <p class="text-xs opacity-70">{{ formatFileSize(msg.file_size) }}</p>
                        </div>
                        <svg class="w-5 h-5 flex-shrink-0 opacity-90" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </a>

                    <p v-if="msg.message" class="text-sm break-words leading-relaxed">
                        {{ msg.message }}
                    </p>

                    <!-- Time + Read Receipt -->
                    <div class="flex justify-end items-center gap-1 mt-1">
                        <span class="text-[11px] opacity-60">{{ formatTime(msg.created_at) }}</span>
                        <span class="text-[11px]" :class="msg.read_by_count > 0 ? 'text-white' : 'text-white/60'">
                            {{ msg.read_by_count > 0 ? '✓✓' : '✓' }}
                        </span>
                    </div>


                </div>
                <!-- Reactions Row (same as received) -->
                <div v-if="groupedReactions(msg.reactions).length > 0"
                    class="absolute -bottom-4 left-2 flex items-center z-10">
                    <button v-for="reaction in groupedReactions(msg.reactions)" :key="reaction.emoji"
                        class="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition hover:scale-105 shadow-sm">
                        <span>{{ reaction.emoji }}</span>
                        <span v-if="reaction.count > 1" class="text-xs">{{ reaction.count }}</span>
                    </button>
                </div>

                <!-- Hover Reaction Button (😊) for sent messages -->
                <button @click.stop="openReactionPicker(msg)" class="absolute -left-11 top-4 opacity-0 group-hover/row:opacity-100 
                    pointer-events-none group-hover/row:pointer-events-auto
                    transition-all duration-200 ease-out
                    w-10 h-10 rounded-full flex items-center justify-center
                    bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl
                    border-2 border-gray-200 dark:border-slate-700
                    text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white
                    z-50 backdrop-blur-md" title="React">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

            </div>
        </div>
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

        const formatTime = (timestamp?: string) => {
            if (!timestamp) return "Just now";

            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return "";

            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        };
        return {
            openImage,
            openReaction,
            formatTime
        };
    }
});
</script>
