<template>
    <div class="px-4 pb-4 pt-2 w-full max-w-5xl mx-auto z-20">
        <!-- Reply Preview Stacked Card -->
        <transition enter-active-class="transition all duration-300 ease-out cubic-bezier(0.23, 1, 0.32, 1)"
            enter-from-class="opacity-0 translate-y-4 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100" leave-to-class="opacity-0 translate-y-4 scale-95">
            <div v-if="replyingTo"
                class="relative mx-2 mb-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                <div class="flex items-center justify-between p-3 pl-4">
                    <div class="flex-1 min-w-0 mr-4">
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {{ replyingTo.senderName || 'Unknown' }}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {{ replyingTo.body }}
                        </p>
                    </div>
                    <button @click="$emit('cancel-reply')"
                        class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </transition>

        <!-- Main Input Bar -->
        <div
            class="relative flex items-end gap-2 p-2 bg-white dark:bg-gray-900 rounded-[26px] shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 focus-within:shadow-xl focus-within:border-blue-500/50 dark:focus-within:border-blue-500/50">

            <!-- Left Actions Group -->
            <div v-show="!isRecording && !recordedAudio" class="flex items-center gap-1 mb-0.5 pl-1">
                <!-- Attach Button -->
                <label
                    class="group cursor-pointer flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-200">
                    <input type="file" multiple class="hidden" @change="handleFileSelect"
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,audio/*" />
                    <svg class="w-6 h-6 transform -rotate-45 group-hover:text-blue-500 transition-colors" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </label>

                <!-- Emoji Button -->
                <button @click="toggleEmojiPicker" ref="emojiContainerRef"
                    class="group flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-200">
                    <svg class="w-6 h-6 group-hover:text-yellow-500 transition-colors" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>

            <!-- Text Input Area -->
            <div v-show="!isRecording && !recordedAudio" class="flex-1 py-2.5 min-w-0">
                <textarea ref="textareaRef" v-model="inputText" @keydown.enter.exact.prevent="sendMessage"
                    placeholder="Type a message..." rows="1" style="min-height: 24px;"
                    class="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-[15px] leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none max-h-32 overflow-y-auto scrollbar-hide"></textarea>
            </div>

            <!-- Voice Recording UI -->
            <div v-if="isRecording || recordedAudio"
                class="flex-1 flex items-center gap-3 p-1 min-h-[44px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                <!-- Delete Button -->
                <button @click="isRecording ? cancelRecording() : deleteRecording()"
                    class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2.227 2.227 0 0116.138 21H7.862a2.227 2.227 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>

                <!-- Active Recording -->
                <div v-if="isRecording"
                    class="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-full px-4 py-1.5 border border-red-100 dark:border-red-500/20">
                    <div class="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span class="text-sm font-mono font-medium text-red-600 dark:text-red-400 min-w-[45px]">
                        {{ formatTime(recordingTime) }}
                    </span>
                    <!-- Waveform Animation -->
                    <div class="flex-1 flex items-center gap-0.5 h-6 opacity-80 pl-2">
                        <div v-for="i in 12" :key="i" class="w-0.5 bg-red-400 rounded-full"
                            :class="{ 'animate-wave': !isPaused && i % 2 !== 0 }"
                            :style="`height: ${Math.random() * 60 + 20}%; animation-duration: ${0.4 + Math.random() * 0.4}s`">
                        </div>
                    </div>
                </div>

                <!-- Preview Player -->
                <div v-else
                    class="flex-1 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-full px-2 py-1.5 border border-blue-100 dark:border-blue-500/20">
                    <button @click="togglePreview"
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                        <svg v-if="!isPlayingPreview" class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    </button>
                    <div class="flex-1 flex flex-col justify-center h-full mr-2">
                        <div class="relative h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                            <div class="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-100 ease-linear"
                                :style="{ width: previewProgress + '%' }"></div>
                        </div>
                    </div>
                    <span class="text-xs font-mono font-medium text-blue-600 dark:text-blue-300 pr-2">
                        {{ formatTime(recordedAudio?.duration || 0) }}
                    </span>
                </div>
            </div>

            <!-- Right Action Button -->
            <div class="relative mb-0.5 mr-0.5">
                <transition mode="out-in" enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-75 rotate-45" enter-to-class="opacity-100 scale-100 rotate-0"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 scale-100 rotate-0" leave-to-class="opacity-0 scale-75 -rotate-45">

                    <!-- Send Text Button -->
                    <button v-if="canSend && !isRecording && !recordedAudio" @click="sendMessage" key="send-text"
                        class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">
                        <svg class="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>

                    <!-- Mic Button -->
                    <button v-else-if="!isRecording && !recordedAudio" @click="startRecording" key="start-mic"
                        class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14a3 3 0 003-3V4a3 3 0 00-6 0v7a3 3 0 003 3z" />
                            <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
                            <path d="M12 19v4m-3 0h6" />
                        </svg>
                    </button>

                    <!-- Recording Controls -->
                    <div v-else-if="isRecording" class="flex items-center gap-2" key="rec-controls">
                        <button @click="isPaused ? resumeRecording() : pauseRecording()"
                            class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                            <svg v-if="!isPaused" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </button>
                        <button @click="stopRecording"
                            class="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:scale-105 transition-all">
                            <div class="w-3 h-3 bg-white rounded-sm"></div>
                        </button>
                    </div>

                    <!-- Voice Send Button -->
                    <button v-else-if="recordedAudio" @click="sendVoiceMessage" key="send-voice"
                        class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">
                        <svg class="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </transition>
            </div>
        </div>

        <!-- Emoji Picker Container -->
        <teleport to="body">
            <div v-if="showEmojiPicker" class="fixed z-50 rounded-2xl shadow-2xl overflow-hidden"
                :style="{ top: pickerPosition.top + 'px', left: pickerPosition.left + 'px' }" ref="emojiPickerRef">
                <EmojiPicker :native="true" @select="onSelectEmoji" theme="auto" />
            </div>
        </teleport>
    </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch, computed } from 'vue';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import { onClickOutside } from '@vueuse/core'

const props = defineProps(['replyingTo']);
const emit = defineEmits(['send-text', 'queue-files', 'cancel-reply']);

const inputText = ref('');
const textareaRef = ref(null);
const showEmojiPicker = ref(false);
const emojiContainerRef = ref(null);
const emojiPickerRef = ref(null);
const pickerPosition = ref({ top: 0, left: 0 });

// Recording State
const isRecording = ref(false);
const isPaused = ref(false);
const isCancelling = ref(false);
const recordingTime = ref(0);
const recordedAudio = ref(null); // { blob, url, duration }
const isPlayingPreview = ref(false);
const previewAudio = new Audio();
const previewProgress = ref(0);
let mediaRecorder = null;
let audioChunks = [];
let timerInterval = null;

// Helpers
const canSend = computed(() => inputText.value.trim().length > 0);

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- Logic ---

onClickOutside(emojiPickerRef, (event) => {
    if (emojiContainerRef.value && emojiContainerRef.value.contains(event.target)) return;
    showEmojiPicker.value = false;
})

const autoResize = () => {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
};

watch(inputText, () => nextTick(autoResize));

const sendMessage = () => {
    const text = inputText.value.trim();
    if (text) {
        emit('send-text', text);
        inputText.value = '';
        showEmojiPicker.value = false;
    }
    nextTick(autoResize);
};

const handleFileSelect = (e) => {
    const input = e.target;
    if (!input.files || input.files.length === 0) return;

    const newFiles = Array.from(input.files).map(file => ({
        file,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        preview: (file.type.startsWith('image/') || file.type.startsWith('video/')) ? URL.createObjectURL(file) : undefined,
        name: file.name,
        size: file.size
    }));

    emit('queue-files', {
        files: newFiles,
        caption: ''
    });
    input.value = '';
};

// Voice Recording Logic
const startRecording = () => {
    isCancelling.value = false;
    recordingTime.value = 0;
    audioChunks = [];
    isRecording.value = true;
    isPaused.value = false;
    recordedAudio.value = null;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        recordingTime.value++;
    }, 1000);

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        if (!isRecording.value) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(track => track.stop());

            if (!isCancelling.value) {
                const url = URL.createObjectURL(audioBlob);
                recordedAudio.value = { blob: audioBlob, url, duration: recordingTime.value };
            }
            audioChunks = [];
        };
        mediaRecorder.start();
    }).catch(err => {
        console.error("Mic access denied", err);
        isRecording.value = false;
        clearInterval(timerInterval);
    });
};

const stopRecording = () => {
    if (!isRecording.value || !mediaRecorder) return;
    mediaRecorder.stop();
    isRecording.value = false;
    if (timerInterval) clearInterval(timerInterval);
};

const cancelRecording = () => {
    isCancelling.value = true;
    stopRecording();
};

const deleteRecording = () => {
    if (recordedAudio.value) URL.revokeObjectURL(recordedAudio.value.url);
    recordedAudio.value = null;
};

const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        isPaused.value = true;
        if (timerInterval) clearInterval(timerInterval);
    }
};

const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        isPaused.value = false;
        timerInterval = setInterval(() => {
            recordingTime.value++;
        }, 1000);
    }
};

const togglePreview = () => {
    if (!recordedAudio.value) return;
    if (isPlayingPreview.value) {
        previewAudio.pause();
        isPlayingPreview.value = false;
    } else {
        previewAudio.src = recordedAudio.value.url;
        previewAudio.play();
        isPlayingPreview.value = true;
    }
}
previewAudio.onended = () => {
    isPlayingPreview.value = false;
    previewProgress.value = 0;
};
previewAudio.ontimeupdate = () => {
    if (previewAudio.duration) {
        previewProgress.value = (previewAudio.currentTime / previewAudio.duration) * 100
    }
};

const sendVoiceMessage = () => {
    if (!recordedAudio.value) return;
    const file = new File([recordedAudio.value.blob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
    const previewUrl = URL.createObjectURL(file);
    emit('queue-files', {
        files: [{
            file,
            type: 'audio',
            name: file.name,
            size: file.size,
            duration: recordedAudio.value.duration,
            preview: previewUrl
        }],
        caption: ''
    });
    deleteRecording();
};

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
    if (showEmojiPicker.value && emojiContainerRef.value) {
        const rect = emojiContainerRef.value.getBoundingClientRect();
        pickerPosition.value = {
            top: rect.top - 320,
            left: rect.left
        };
    }
};

const onSelectEmoji = (emoji) => {
    inputText.value += emoji.i;
    nextTick(() => {
        textareaRef.value?.focus();
        autoResize();
    });
};

defineExpose({
    focusInput: () => textareaRef.value?.focus()
});
</script>

<style scoped>
@keyframes wave {

    0%,
    100% {
        height: 4px;
    }

    50% {
        height: 16px;
    }
}

.animate-wave {
    animation: wave 1s infinite ease-in-out;
}
</style>
