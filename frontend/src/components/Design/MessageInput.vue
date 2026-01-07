<!-- MessageInput.vue - Updated with Custom Chat Theme Variables -->
<template>
  <div class="px-4 pb-4 pt-2 w-full max-w-5xl mx-auto z-20">
    <!-- Reply Preview Stacked Card -->
    <transition enter-active-class="transition all duration-300 ease-out cubic-bezier(0.23, 1, 0.32, 1)"
      enter-from-class="opacity-0 translate-y-4 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition all duration-200 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95">
      <div v-if="replyingTo"
        class="relative mx-2 mb-2 bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-white/5 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
        <!-- Decorative subtle colored line based on user -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>

        <div class="flex items-center justify-between p-3 pl-4">
          <div class="flex-1 min-w-0 mr-4">
            <div class="flex items-center gap-2 mb-0.5">
              <svg class="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span class="text-xs font-bold tracking-wide uppercase opacity-80" :class="senderNameColor">
                {{ replyingTo.senderName || 'Unknown' }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 truncate font-medium">
              {{ replyingTo.body }}
            </p>
          </div>

          <button @click="$emit('cancel-reply')"
            class="group p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <div class="relative w-5 h-5 flex items-center justify-center">
              <svg class="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </transition>

    <!-- Main Input Bar -->
    <div
      class="relative flex items-end gap-2 p-1.5 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-2xl rounded-[28px] shadow-2xl border border-white/20 dark:border-white/5 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 ease-out focus-within:ring-2 focus-within:ring-blue-500/30 dark:focus-within:ring-blue-400/30">

      <!-- Left Actions Group -->
      <div v-if="!isRecording && !recordedAudio" class="flex items-center gap-1 mb-1 ml-1">
        <!-- Attachment Button -->
        <label
          class="group cursor-pointer relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 overflow-hidden">
          <input ref="fileInput" @change="handleFileSelect" type="file" multiple class="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
          <svg
            class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:scale-110 transition-transform duration-200"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </label>

        <!-- Emoji Button -->
        <button @click="toggleEmojiPicker" ref="emojiContainerRef"
          class="group flex items-center justify-center w-10 h-10 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-all duration-200">
          <span
            class="text-xl filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-200">😊</span>
        </button>
      </div>

      <!-- Text Input Area -->
      <div v-show="!isRecording && !recordedAudio" class="flex-1 py-3 min-w-0">
        <textarea ref="textareaRef" v-model="inputText" @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="" placeholder="Message..." rows="1" style="min-height: 24px;"
          class="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-[15px] leading-relaxed text-gray-800 dark:text-gray-100 placeholder-gray-400/80 dark:placeholder-gray-500 resize-none max-h-32 overflow-y-auto scrollbar-hide"></textarea>
      </div>

      <!-- Voice Recording UI -->
      <div v-if="isRecording || recordedAudio"
        class="flex-1 flex items-center gap-3 p-1 min-h-[48px] animate-in fade-in slide-in-from-bottom-2 duration-200">
        <!-- Delete Button -->
        <button @click="isRecording ? cancelRecording() : deleteRecording()"
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all duration-200 group"
          title="Delete">
          <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2.227 2.227 0 0116.138 21H7.862a2.227 2.227 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <!-- Active Recording Visualization -->
        <div v-if="isRecording"
          class="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/10 rounded-full px-4 py-2 border border-red-100 dark:border-red-500/10">
          <div class="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-sm font-mono font-medium text-red-600 dark:text-red-400 min-w-[45px]">
            {{ formatTime(recordingTime) }}
          </span>
          <!-- Waveform Animation -->
          <div class="flex-1 flex items-center gap-0.5 h-6 opacity-80" :class="{ 'opacity-40': isPaused }">
            <div class="w-1 bg-red-400 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.5s; animation-delay: 0.1s"></div>
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.7s; animation-delay: 0.2s"></div>
            <div class="w-1 bg-red-600 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.4s; animation-delay: 0.0s"></div>
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.8s; animation-delay: 0.3s"></div>
            <div class="w-1 bg-red-400 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.6s; animation-delay: 0.15s"></div>
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.45s; animation-delay: 0.25s"></div>
            <!-- Repeat for width -->
            <div class="hidden sm:block w-1 bg-red-400 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.55s"></div>
            <div class="hidden sm:block w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.75s"></div>
          </div>
        </div>

        <!-- Audio Preview Player -->
        <div v-else
          class="flex-1 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 rounded-full px-2 py-1.5 border border-blue-100 dark:border-blue-500/10">
          <button @click="togglePreview"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 transition-transform active:scale-95">
            <svg v-if="!isPlayingPreview" class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>

          <div class="flex-1 flex flex-col justify-center h-full mr-2">
            <div class="relative h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <div class="absolute left-0 top-0 bottom-0 bg-blue-500 transition-all duration-100 ease-linear"
                :style="{ width: previewProgress + '%' }"></div>
            </div>
          </div>
          <span class="text-xs font-mono font-medium text-blue-600 dark:text-blue-300 pr-2">
            {{ formatTime(recordedAudio?.duration || 0) }}
          </span>
        </div>
      </div>

      <!-- Right Action Button (Dynamic) -->
      <div class="relative mb-1 mr-1">
        <transition mode="out-in" enter-active-class="transition duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)"
          enter-from-class="opacity-0 scale-50 rotate-90" enter-to-class="opacity-100 scale-100 rotate-0"
          leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 scale-100 rotate-0"
          leave-to-class="opacity-0 scale-50 -rotate-90">
          <!-- Send Text Button -->
          <button v-if="canSend && !isRecording && !recordedAudio" @click="sendMessage"
            class="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
            key="send-text">
            <svg class="w-5 h-5 ml-0.5 -mt-0.5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

          <!-- Mic Button -->
          <button v-else-if="!isRecording && !recordedAudio" @click="startRecording"
            class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
            key="start-mic">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 003-3V4a3 3 0 00-6 0v7a3 3 0 003 3z" />
              <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
              <path d="M12 19v4m-3 0h6" />
            </svg>
          </button>

          <!-- Recording Actions Group -->
          <div v-else-if="isRecording" class="flex items-center gap-2" key="rec-controls">
            <button @click="isPaused ? resumeRecording() : pauseRecording()"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-all">
              <svg v-if="!isPaused" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button @click="stopRecording"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 hover:scale-105 transition-all">
              <div class="w-3 h-3 bg-white rounded-sm"></div>
            </button>
          </div>

          <!-- Send Voice Button -->
          <button v-else-if="recordedAudio" @click="sendVoiceMessage"
            class="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105 transition-all"
            key="send-voice">
            <svg class="w-5 h-5 ml-0.5 -mt-0.5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </transition>
      </div>
    </div>

    <!-- Emoji Picker Container -->
    <teleport to="body">
      <div v-if="showEmojiPicker" class="fixed z-50 rounded-2xl shadow-2xl overflow-hidden" :style="emojiPickerStyle"
        ref="emojiPickerRef">
        <!-- The actual emoji picker component logic remains the same -->
        <EmojiPicker :native="true" @select="onSelectEmoji" :theme="isDark() ? 'dark' : 'light'"
          class="shadow-2xl border-0 !bg-white/90 dark:!bg-gray-900/95 backdrop-blur-xl" />
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
// Same script as before — no changes needed
// (All your existing logic remains 100% intact)
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import EmojiPicker from 'vue3-emoji-picker';
import { useEmojiPicker } from '../../composables/useEmojiPicker';

import { useTheme } from '../../composables/useTheme';

const props = defineProps<{
  replyingTo?: {
    id?: number;
    senderName?: string;
    body: string;
  } | null;
}>();

const { isDark } = useTheme();
const emit = defineEmits(['send-text', 'queue-files', 'cancel-reply']);

// ... (rest of your script is exactly the same)
const inputText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);



const isRecording = ref(false);
const isPaused = ref(false);
const isCancelling = ref(false);
const showCancelHint = ref(false);
const recordingTime = ref(0);
const recordedAudio = ref<{ blob: Blob; url: string; duration: number } | null>(null);
const isPlayingPreview = ref(false);
const previewAudio = new Audio();
const previewProgress = ref(0);

previewAudio.onended = () => {
  isPlayingPreview.value = false;
  previewProgress.value = 0;
};

previewAudio.ontimeupdate = () => {
  if (previewAudio.duration) {
    previewProgress.value = (previewAudio.currentTime / previewAudio.duration) * 100;
  }
};

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let timerInterval: number | null = null;



const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const canSend = computed(() => inputText.value.trim().length > 0);

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
};

watch(inputText, () => nextTick(autoResize));

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;

  const newFiles = Array.from(input.files).map(file => ({
    file,
    type: file.type,
    preview: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined
  }));

  emit('queue-files', {
    files: newFiles,
    caption: ''
  });
  input.value = '';
  nextTick(autoResize);
};

const senderNameColor = computed(() => {
  const name = props.replyingTo?.senderName || 'unknown';
  const colors = [
    'text-blue-600 dark:text-blue-400',
    'text-purple-600 dark:text-purple-400',
    'text-green-600 dark:text-green-400',
    'text-pink-600 dark:text-pink-400',
    'text-indigo-600 dark:text-indigo-400',
    'text-teal-600 dark:text-teal-400',
    'text-orange-600 dark:text-orange-400',
    'text-red-600 dark:text-red-400',
    'text-cyan-600 dark:text-cyan-400',
    'text-amber-600 dark:text-amber-400',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
});

const sendMessage = () => {
  const text = inputText.value.trim();
  if (text) {
    emit('send-text', text);
    inputText.value = '';
    showEmojiPicker.value = false;
  }
  nextTick(autoResize);
};

// Composable
const emoji = useEmojiPicker({
  onSelectEmoji: (emoji: any) => {
    inputText.value += emoji.i;
    nextTick(() => {
      textareaRef.value?.focus();
      autoResize();
    });
  }
});

const showEmojiPicker = emoji.showEmojiPicker;
const emojiContainerRef = emoji.emojiContainerRef;
const emojiPickerRef = emoji.emojiPickerEl; // Mapping to existing ref name if possible, or update template
const emojiPickerStyle = emoji.emojiPickerStyle;
const toggleEmojiPicker = emoji.toggleEmojiPicker;
const onSelectEmoji = emoji.onSelectEmoji;

// Mark for TS
void (emojiContainerRef && emojiPickerRef);

onMounted(() => {
  nextTick(() => {
    textareaRef.value?.focus();
    autoResize();
  });
});

// Watch for when component becomes visible and reset height
watch(() => [props.replyingTo, inputText.value], () => {
  nextTick(() => {
    autoResize();
  });
});

// Voice recording functions remain unchanged...
const startRecording = (_e: MouseEvent | TouchEvent) => {
  isCancelling.value = false;
  showCancelHint.value = false;
  recordingTime.value = 0;
  audioChunks = [];
  isRecording.value = true;
  isPaused.value = false;
  recordedAudio.value = null;

  if (timerInterval) clearInterval(timerInterval);
  startTimer();

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
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
        const duration = recordingTime.value;

        stream.getTracks().forEach(track => track.stop());
        audioChunks = [];

        if (!isCancelling.value) {
          const url = URL.createObjectURL(audioBlob);
          recordedAudio.value = { blob: audioBlob, url, duration };
        }
      };

      mediaRecorder.start();
    })
    .catch(err => {
      console.error('Microphone access denied', err);
      isRecording.value = false;
      stopTimer();
    });
};

const startTimer = () => {
  timerInterval = window.setInterval(() => {
    recordingTime.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
};

const pauseRecording = () => {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
  mediaRecorder.pause();
  isPaused.value = true;
  stopTimer();
};

const resumeRecording = () => {
  if (!mediaRecorder || mediaRecorder.state !== 'paused') return;
  mediaRecorder.resume();
  isPaused.value = false;
  startTimer();
};

const stopRecording = () => {
  if (!isRecording.value || !mediaRecorder) return;
  mediaRecorder.stop();
  isRecording.value = false;
  stopTimer();
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
};

const deleteRecording = () => {
  if (recordedAudio.value) {
    URL.revokeObjectURL(recordedAudio.value.url);
  }
  recordedAudio.value = null;
  isRecording.value = false;
  isPaused.value = false;
};

const sendVoiceMessage = () => {
  if (!recordedAudio.value) return;

  const file = new File([recordedAudio.value.blob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
  emit('queue-files', {
    files: [{ file, type: 'audio' }],
    caption: ''
  });

  deleteRecording();
};

const cancelRecording = () => {
  if (!isRecording.value) return;

  isCancelling.value = true;
  setTimeout(() => {
    stopRecording();
  }, 300);
};

// Expose method for parent to focus the input
defineExpose({
  focusInput: () => {
    nextTick(() => {
      autoResize(); // Restore proper height first

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const el = textareaRef.value;
        if (el) {
          // Ensure element is focusable
          if (!el.hasAttribute('tabindex')) {
            el.setAttribute('tabindex', '-1');
          }
          el.focus();

          // Verify focus was set
          if (document.activeElement !== el) {
            // Retry focus if it didn't work
            setTimeout(() => el.focus(), 10);
          }
        }
      });
    });
  }
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