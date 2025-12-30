<!-- MessageInput.vue - Updated with Custom Chat Theme Variables -->
<template>
  <div class="bg-chat-surface px-2 sm:px-4 pt-3 pb-4 border-t border-chat-border">
    <!-- Reply Preview -->
    <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
      <div v-if="replyingTo"
        class="bg-chat-bg/70 dark:bg-gray-800/90 rounded-xl p-3 mb-3 shadow-sm border-l-4 border-blue-500 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <!-- Colorful Sender Name -->
            <p class="text-xs font-semibold truncate" :class="senderNameColor">
              {{ replyingTo.senderName || 'someone' }}
            </p>

            <!-- Reply Body -->
            <p
              class="text-sm text-chat-text truncate mt-1 break-all whitespace-pre-wrap overflow-wrap-anywhere opacity-90">
              {{ replyingTo.body }}
            </p>
          </div>

          <!-- Cancel Button -->
          <button @click="$emit('cancel-reply')" class="ml-3 p-1.5 rounded-full hover:bg-chat-bg/50 transition">
            <svg class="w-4 h-4 text-chat-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- Input Bar -->
    <div ref="inputBarRef"
      class="flex items-end gap-2 sm:gap-4 bg-chat-bg/80 dark:bg-gray-800/50 rounded-3xl px-3 sm:px-4 py-3 shadow-inner ring-1 ring-chat-border focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all backdrop-blur-sm">
      <!-- Emoji Button -->
      <button v-if="!isRecording" @click="toggleEmojiPicker" ref="emojiContainerRef"
        class="text-chat-text-muted hover:text-yellow-500 transition text-2xl flex-shrink-0">
        😊
      </button>

      <!-- Attachment Button -->
      <label v-if="!isRecording" class="cursor-pointer flex-shrink-0">
        <input ref="fileInput" @change="handleFileSelect" type="file" multiple class="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
        <svg class="w-6 h-6 text-chat-text-muted hover:text-blue-600 dark:hover:text-blue-400 transition" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </label>

      <!-- Text Input -->
      <textarea v-show="!isRecording && !recordedAudio" v-model="inputText" @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact="" rows="1" placeholder="Type a message..."
        class="flex-1 bg-transparent outline-none text-sm resize-none max-h-32 overflow-y-auto py-0.5 text-chat-text placeholder-chat-text-muted"
        ref="textareaRef" />

      <!-- Voice Mode UI (Recording or Review) -->
      <div v-if="isRecording || recordedAudio" class="flex-1 flex items-center gap-3 overflow-hidden">
        <!-- Delete Button -->
        <button @click="isRecording ? cancelRecording() : deleteRecording()"
          class="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2.227 2.227 0 0116.138 21H7.862a2.227 2.227 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <!-- Recording State (Waveform) -->
        <div v-if="isRecording"
          class="flex-1 flex items-center justify-center gap-1 h-8 bg-chat-surface/70 dark:bg-gray-800 rounded-full px-4">
          <div class="text-sm font-mono text-chat-text min-w-[50px]">
            {{ formatTime(recordingTime) }}
          </div>
          <div class="flex items-center gap-0.5 h-full opacity-70" :class="{ 'opacity-30': isPaused }">
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.6s"></div>
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 1.1s"></div>
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.9s"></div>
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.7s"></div>
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 1.2s"></div>
            <div class="w-1 bg-red-500 rounded-full" :class="{ 'animate-wave': !isPaused }"
              style="animation-duration: 0.8s"></div>
          </div>
          <span v-if="isPaused" class="text-xs text-orange-500 font-medium ml-2">PAUSED</span>
        </div>

        <!-- Review State (Player) -->
        <div v-else class="flex-1 flex items-center gap-3 bg-chat-surface/60 dark:bg-gray-800 rounded-full px-3 h-10">
          <button @click="togglePreview" class="text-blue-600 dark:text-blue-400">
            <svg v-if="!isPlayingPreview" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>

          <!-- Simple Progress Bar -->
          <div class="flex-1 h-1 bg-chat-border rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 transition-all duration-100" :style="{ width: previewProgress + '%' }"></div>
          </div>

          <span class="text-xs text-chat-text-muted font-mono">
            {{ formatTime(recordedAudio?.duration || 0) }}
          </span>
        </div>
      </div>

      <!-- Right Side: Send or Mic -->
      <div class="relative flex-shrink-0">
        <transition mode="out-in" enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-75" enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-75">
          <!-- Send Text Button -->
          <button v-if="canSend && !isRecording && !recordedAudio" @click="sendMessage"
            class="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-lg"
            key="send-text">
            <svg class="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

          <!-- Recording Controls -->
          <div v-else-if="isRecording" class="flex items-center gap-2" key="recording-controls">
            <button @click="isPaused ? resumeRecording() : pauseRecording()"
              class="w-11 h-11 bg-chat-bg rounded-full flex items-center justify-center text-chat-text hover:bg-chat-bg/70 transition shadow-lg">
              <svg v-if="!isPaused" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <button @click="stopRecording"
              class="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition shadow-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>

          <!-- Send Voice -->
          <button v-else-if="recordedAudio" @click="sendVoiceMessage"
            class="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-lg"
            key="send-voice">
            <svg class="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

          <!-- Mic Button -->
          <div v-else key="mic">
            <button @click="startRecording"
              class="w-11 h-11 bg-chat-bg dark:bg-gray-800 rounded-full flex items-center justify-center text-chat-text-muted shadow-lg hover:bg-chat-bg/70 dark:hover:bg-gray-700 transition">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 003-3V4a3 3 0 00-6 0v7a3 3 0 003 3z" />
                <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
                <path d="M12 19v4m-3 0h6" />
              </svg>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Emoji Picker -->
    <teleport to="body">
      <div v-if="showEmojiPicker"
        class="fixed z-50 rounded-2xl shadow-2xl border border-chat-border overflow-hidden bg-chat-surface"
        :style="emojiPickerStyle" ref="emojiPickerRef">
        <EmojiPicker :native="true" @select="onSelectEmoji" :theme="isDark() ? 'dark' : 'light'"
          class="border border-chat-border rounded-2xl overflow-hidden bg-chat-surface shadow-xl" />
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