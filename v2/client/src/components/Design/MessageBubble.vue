<template>
    <!-- System Message -->
    <div v-if="message.type === 'system'" class="flex justify-center mb-4">
        <div
            class="px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
            {{ message.content }}
        </div>
    </div>

    <div v-else :ref="(el) => setMessageRef && setMessageRef(message._id, el)"
        :data-day="getMessageDay && getMessageDay(message.createdAt)" class="flex mb-6 message-row group relative"
        :class="isSent ? 'justify-end' : 'gap-3 items-end'">
        <!-- Avatar for received -->
        <UserAvatar v-if="!isSent && isGroup && message.type !== 'audio'" :avatar="message.sender_id?.avatar" size="sm"
            :is-online="false" :show-online="false" :is-group="false" />

        <div class="max-w-[85%] sm:max-w-[75%] relative">
            <div class="relative">
                <!-- Wrapper for Bubble + Reactions -->
                <div class="relative px-4 py-2 rounded-2xl shadow-sm overflow-hidden z-10" :class="bubbleClasses">
                    <!-- Tail -->
                    <svg class="absolute bottom-0 w-4 h-4" :class="tailClasses" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 0 Q 16 16, 16 0 L 0 16 Z" />
                    </svg>

                    <!-- Uploading Overlay -->
                    <div v-if="isUploading"
                        class="absolute inset-0 bg-black/30 flex items-center justify-center rounded-2xl z-20">
                        <div class="text-center text-white">
                            <div class="text-sm font-medium mb-2">{{ uploadProgress }}%</div>
                            <div class="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                                <div class="h-full bg-white transition-all duration-300"
                                    :style="{ width: uploadProgress + '%' }" />
                            </div>
                            <button @click.stop="$emit('cancel-upload')"
                                class="mt-3 text-xs underline opacity-80 hover:opacity-100">
                                Cancel
                            </button>
                        </div>
                    </div>

                    <!-- Sender Name -->
                    <div v-if="!isSent && isGroup" class="mb-1 px-1">
                        <span class="text-xs font-bold" :class="nameTextColor">
                            {{ message.sender_id?.name || 'Unknown' }}
                        </span>
                    </div>

                    <!-- Reply Context -->
                    <div v-if="message.reply_to" @click.stop="$emit('scrollTo', message.reply_to._id)"
                        class="mb-2 p-1.5 pl-2.5 rounded-lg border-l-[3px] text-xs flex flex-col gap-0.5 cursor-pointer hover:opacity-75 transition-opacity"
                        :class="isSent ? 'bg-black/10 dark:bg-black/20 border-white/60' : 'bg-black/5 dark:bg-white/10 border-blue-500'">
                        <span class="font-bold opacity-90">{{ message.reply_to.sender_id?.name || 'Unknown' }}</span>
                        <span class="truncate opacity-80">{{ message.reply_to.content || (message.reply_to.type !==
                            'text' ? 'Media File' : '') }}</span>
                    </div>

                    <!-- Text Message -->
                    <p v-if="!message.type || message.type === 'text'"
                        class="text-sm leading-relaxed break-all whitespace-pre-wrap overflow-wrap-anywhere">
                        {{ message.content || "" }}
                    </p>

                    <!-- Image Preview -->
                    <div v-else-if="message.type === 'image'" class="relative">
                        <img :src="fileUrl" class="w-full rounded-lg max-w-sm" alt="Image" />
                        <p v-if="message.content" class="mt-2 text-sm">{{ message.content }}</p>
                    </div>

                    <!-- Audio Player -->
                    <div v-else-if="message.type === 'audio'" class="flex items-center gap-3 min-w-[240px] p-1 pr-4">
                        <button @click.stop="toggleAudio"
                            class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
                            :class="isSent ? 'bg-white text-blue-500 hover:bg-gray-100' : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'">
                            <svg v-if="!isPlaying" class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        </button>
                        <div class="flex-1 flex flex-col justify-center min-w-[120px] gap-1">
                            <div class="relative h-1 bg-black/10 dark:bg-white/20 rounded-full overflow-hidden cursor-pointer"
                                @click.stop="seekAudio">
                                <div class="absolute inset-y-0 left-0 transition-all duration-100 ease-linear rounded-full"
                                    :class="isSent ? 'bg-white' : 'bg-gray-800 dark:bg-gray-200'"
                                    :style="{ width: progress + '%' }"></div>
                            </div>
                            <div class="flex justify-between text-[10px] font-medium opacity-70">
                                <span>{{ formatAudioTime(currentTime) }}</span>
                                <span>{{ formatAudioTime(duration || message.file_size / 5000) }}</span>
                            </div>
                        </div>
                        <audio ref="audioRef" :src="fileUrl" @timeupdate="onTimeUpdate"
                            @loadedmetadata="onLoadedMetadata" @ended="onEnded" @play="isPlaying = true"
                            @pause="isPlaying = false" class="hidden"></audio>
                    </div>

                    <!-- Video Preview -->
                    <video v-else-if="message.type === 'video'" :src="fileUrl" controls
                        class="w-full rounded-lg max-w-sm">
                        Your browser does not support video.
                    </video>

                    <!-- File Preview -->
                    <div v-else-if="message.type === 'file'">
                        <div
                            class="flex items-center gap-4 bg-black/5 dark:bg-white/10 rounded-xl p-4 shadow-sm border border-transparent dark:border-white/10">
                            <div class="flex-shrink-0">
                                <svg v-if="fileExt === 'pdf'" class="w-12 h-12 text-red-500" fill="currentColor"
                                    viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <path fill="#fff" d="M14 2v6h6" />
                                    <text x="7" y="15" font-size="6" font-weight="bold" fill="#fff">PDF</text>
                                </svg>
                                <svg v-else-if="/docx?/.test(fileExt)" class="w-12 h-12 text-blue-600"
                                    fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <path fill="#fff" d="M14 2v6h6" />
                                    <text x="7" y="15" font-size="6" font-weight="bold" fill="#fff">DOC</text>
                                </svg>
                                <svg v-else-if="/zip|rar|7z/.test(fileExt)" class="w-12 h-12 text-amber-600"
                                    fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 9H4l8-7z" />
                                    <path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                    <text x="8" y="15" font-size="6" font-weight="bold" fill="#fff">ZIP</text>
                                </svg>
                                <svg v-else class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {{ message.file_name }}
                                </p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {{ formatSize(message.file_size) }}
                                </p>
                            </div>
                            <a :href="fileUrl" :download="message.file_name" class="flex-shrink-0">
                                <button
                                    class="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition shadow-md">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            </a>
                        </div>
                        <p v-if="message.content"
                            class="mt-2 text-sm leading-relaxed break-all whitespace-pre-wrap overflow-wrap-anywhere">
                            {{ message.content }}
                        </p>
                    </div>

                    <!-- Time + Read Receipt -->
                    <div class="flex justify-end items-center gap-1 mt-2">
                        <span class="text-[11px] opacity-70">{{ formatTime(message.createdAt) }}</span>
                        <span v-if="isSent" class="text-[11px]" :class="readClass">
                            {{ isRead ? "✓✓" : "✓" }}
                        </span>
                    </div>
                </div>

                <!-- Reactions Display -->
                <div v-if="message.reactions && message.reactions.length > 0" class="absolute -bottom-4 z-20 flex gap-1"
                    :class="isSent ? 'right-0' : 'left-0'">
                    <button v-for="(users, emoji) in groupedReactions" :key="emoji" @click.stop="toggleReaction(emoji)"
                        :title="getReactionNames(users)"
                        class="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 text-[10px] hover:scale-105 transition-transform cursor-pointer">
                        <span>{{ emoji }}</span>
                        <span class="font-bold text-gray-600 dark:text-gray-300">{{ users.length }}</span>
                    </button>
                </div>
            </div>

            <!-- Add Reaction & Reply Actions Hover -->
            <div class="absolute top-1/2 -translate-y-1/2 transition-opacity duration-200 opacity-0 group-hover:opacity-100 z-0 flex items-center gap-2"
                :class="isSent ? '-left-20 flex-row-reverse' : '-right-20'">

                <!-- Reply Button -->
                <button @click.stop="$emit('reply', message)"
                    class="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
                    title="Reply">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>

                <!-- Reaction Trigger -->
                <div class="relative">
                    <button @click.stop="showReactionPicker = !showReactionPicker"
                        class="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
                        title="Add Reaction">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    <!-- Reaction Picker Popover -->
                    <div v-if="showReactionPicker" @mouseleave="showReactionPicker = false"
                        class="absolute bottom-full mb-2 flex gap-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200 z-50 w-max"
                        :class="isSent ? 'right-0' : 'left-0'">
                        <button v-for="emoji in ['👍', '❤️', '😂', '😮', '😢', '😡']" :key="emoji"
                            @click.stop="toggleReaction(emoji); showReactionPicker = false"
                            class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-lg transition-transform hover:scale-125">
                            {{ emoji }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import UserAvatar from "./UserAvatar.vue";
import { serverURL } from "../../utils/axios";
import { useChatStore } from "../../stores/chat";

const props = defineProps({
    isGroup: Boolean,
    isSent: Boolean,
    message: Object,
    setMessageRef: Function,
    getMessageDay: Function,
    isUploading: Boolean,
    uploadProgress: Number
});

const emit = defineEmits(["cancel-upload", "reply", "scrollTo"]);
const chatStore = useChatStore();
const showReactionPicker = ref(false);

const groupedReactions = computed(() => {
    if (!props.message.reactions) return {};
    const groups = {};
    props.message.reactions.forEach(r => {
        if (!groups[r.emoji]) groups[r.emoji] = [];
        groups[r.emoji].push(r.user_id);
    });
    return groups;
});

const toggleReaction = (emoji) => {
    chatStore.toggleReaction(props.message._id, emoji);
};

const getReactionNames = (users) => {
    return users.map(u => (typeof u === 'object' ? u.name : 'Unknown')).join(', ');
};

// ... Audio ...
const audioRef = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progress = ref(0);

const fileUrl = computed(() => {
    if (!props.message.attachment_url) return "";
    if (props.message.attachment_url.startsWith("blob:") || props.message.attachment_url.startsWith("http")) return props.message.attachment_url;
    return `${serverURL}${props.message.attachment_url}`;
});

const toggleAudio = () => {
    if (!audioRef.value) return;
    if (isPlaying.value) audioRef.value.pause();
    else audioRef.value.play();
};

const onTimeUpdate = () => {
    if (!audioRef.value) return;
    currentTime.value = audioRef.value.currentTime;
    if (duration.value) progress.value = (currentTime.value / duration.value) * 100;
};

const onLoadedMetadata = () => {
    if (!audioRef.value) return;
    duration.value = audioRef.value.duration;
};

const onEnded = () => {
    isPlaying.value = false;
    currentTime.value = 0;
    progress.value = 0;
};

const seekAudio = (e) => {
    if (!audioRef.value || !duration.value) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audioRef.value.currentTime = percent * duration.value;
    progress.value = percent * 100;
};

const formatAudioTime = (s) => {
    if (isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

const formatSize = (b) => {
    if (!b) return "0 KB";
    return b > 1024 * 1024 ? (b / (1024 * 1024)).toFixed(1) + " MB" : (b / 1024).toFixed(1) + " KB";
};

const formatTime = (ts) => {
    if (!ts) return "Just now";
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

const fileExt = computed(() => props.message?.file_name?.split(".").pop()?.toLowerCase() || "");

const bubbleClasses = computed(() => ({
    "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none": !props.isSent,
    "bg-blue-600 text-white rounded-br-none": props.isSent,
}));

const tailClasses = computed(() => ({
    "left-0 -translate-x-2 text-white dark:text-gray-800": !props.isSent,
    "right-0 translate-x-2 text-blue-600": props.isSent,
}));

const isRead = computed(() => props.message.read_by?.length > 1);
const readClass = computed(() => isRead.value ? "text-blue-200" : "text-blue-200/60");

const nameTextColor = computed(() => {
    const seed = props.message.sender_id?.name || 'unknown';
    const colors = ['text-blue-600 dark:text-blue-400', 'text-purple-600 dark:text-purple-400', 'text-green-600 dark:text-green-400', 'text-pink-600 dark:text-pink-400'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
});
</script>
