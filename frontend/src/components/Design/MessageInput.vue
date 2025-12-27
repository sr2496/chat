<!-- MessageInput.vue - Current Design + Old Functionality -->
<template>
  <div class="bg-white dark:bg-gray-800 px-4 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700">
    <!-- Reply Preview -->
    <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
      <div v-if="replyingTo"
        class="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 mb-3 shadow-sm border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <!-- Colorful Sender Name -->
            <p class="text-xs font-semibold truncate" :class="senderNameColor">
              {{ replyingTo.senderName || 'someone' }}
            </p>

            <!-- Reply Body -->
            <p
              class="text-sm text-gray-800 dark:text-gray-200 truncate mt-1 break-all whitespace-pre-wrap overflow-wrap-anywhere">
              {{ replyingTo.body }}
            </p>
          </div>

          <!-- Cancel Button -->
          <button @click="$emit('cancel-reply')"
            class="ml-3 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </transition>


    <!-- Input Bar -->
    <div ref="inputBarRef"
      class="flex items-end gap-4 bg-gray-100 dark:bg-gray-700 rounded-3xl px-4 py-3 shadow-inner ring-1 ring-gray-200 dark:ring-gray-600 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all">
      <!-- Emoji Button -->
      <button v-if="!isRecording" @click="toggleEmojiPicker"
        class="text-gray-500 hover:text-yellow-500 transition text-2xl flex-shrink-0">
        😊
      </button>

      <!-- Attachment Button -->
      <label v-if="!isRecording" class="cursor-pointer flex-shrink-0">
        <input ref="fileInput" @change="handleFileSelect" type="file" multiple class="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
        <svg class="w-6 h-6 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </label>

      <!-- Text Input -->
      <textarea v-show="!isRecording && !recordedAudio" v-model="inputText" @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact="" rows="1" placeholder="Type a message..."
        class="flex-1 bg-transparent outline-none text-sm resize-none max-h-32 overflow-y-auto py-0.5"
        ref="textareaRef" />

      <!-- Voice Mode UI (Recording or Review) -->
      <div v-if="isRecording || recordedAudio" class="flex-1 flex items-center gap-3 overflow-hidden">
        <!-- Delete Button -->
        <button @click="isRecording ? cancelRecording() : deleteRecording()"
          class="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2.227 2.227 0 0116.138 21H7.862a2.227 2.227 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <!-- Recording State (Waveform) -->
        <div v-if="isRecording"
          class="flex-1 flex items-center justify-center gap-1 h-8 bg-gray-50 dark:bg-gray-800 rounded-full px-4">
          <div class="text-sm font-mono text-gray-900 dark:text-gray-100 min-w-[50px]">
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
        <div v-else class="flex-1 flex items-center gap-3 bg-blue-50 dark:bg-gray-800 rounded-full px-3 h-10">
          <button @click="togglePreview" class="text-blue-600 dark:text-blue-400">
            <svg v-if="!isPlayingPreview" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>

          <!-- Simple Progress Bar -->
          <div class="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 transition-all duration-100" :style="{ width: previewProgress + '%' }"></div>
          </div>

          <span class="text-xs text-gray-500 font-mono">{{ formatTime(recordedAudio?.duration || 0) }}</span>
        </div>
      </div>

      <!-- Right Side: Send or Mic -->
      <div class="relative flex-shrink-0">
        <transition mode="out-in" enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-75" enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-75">

          <!-- Send Text Button (when typing) -->
          <button v-if="canSend && !isRecording && !recordedAudio" @click="sendMessage"
            class="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-lg"
            key="send-text">
            <svg class="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

          <!-- Recording Controls (Pause/Stop) -->
          <div v-else-if="isRecording" class="flex items-center gap-2" key="recording-controls">
            <!-- Pause/Resume -->
            <button @click="isPaused ? resumeRecording() : pauseRecording()"
              class="w-11 h-11 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition shadow-lg">
              <svg v-if="!isPaused" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <!-- Stop (Checkmark) -->
            <button @click="stopRecording"
              class="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition shadow-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>

          <!-- Review Send Button -->
          <button v-else-if="recordedAudio" @click="sendVoiceMessage"
            class="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-lg"
            key="send-voice">
            <svg class="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

          <!-- Mic Button (Start Recording) -->
          <div v-else key="mic">
            <button @click="startRecording"
              class="w-11 h-11 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-lg">
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

    <!-- Emoji Picker (positioned above input) -->
    <teleport to="body">
      <div v-if="showEmojiPicker"
        class="fixed z-50 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        :style="emojiPickerStyle" ref="emojiPickerRef">
        <EmojiPicker :native="true" @select="onSelectEmoji" theme="auto" />
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue';
import EmojiPicker, { type EmojiExt } from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

const props = defineProps<{
  replyingTo?: {
    id?: number;
    senderName?: string;
    body: string;
  } | null;
}>();

const emit = defineEmits(['send-text', 'queue-files', 'cancel-reply']);



const inputText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const inputBarRef = ref<HTMLElement | null>(null);
const emojiPickerRef = ref<HTMLElement | null>(null);

const isRecording = ref(false);
const isPaused = ref(false);
const isCancelling = ref(false);
const showCancelHint = ref(false);
const recordingTime = ref(0);
const recordedAudio = ref<{ blob: Blob; url: string; duration: number } | null>(null);
const isPlayingPreview = ref(false);
const previewAudio = new Audio();
const previewProgress = ref(0);

// Watch for preview end
previewAudio.onended = () => {
  isPlayingPreview.value = false;
  previewProgress.value = 0;
};

// Monitor preview progress
previewAudio.ontimeupdate = () => {
  if (previewAudio.duration) {
    previewProgress.value = (previewAudio.currentTime / previewAudio.duration) * 100;
  }
};
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let timerInterval: number | null = null;
let startX = 0;

const showEmojiPicker = ref(false);
const emojiPickerStyle = ref({ bottom: '0', left: '0' });

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const canSend = computed(() => inputText.value.trim().length > 0);

// Auto-resize
const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
};

watch(inputText, () => nextTick(autoResize));

// File handling
const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;

  const files = Array.from(input.files);

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


// Send
const sendMessage = () => {
  const text = inputText.value.trim();
  if (text) {
    emit('send-text', text);
    inputText.value = '';
  }
  nextTick(autoResize);
};

// Emoji picker positioning
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
  if (showEmojiPicker.value && inputBarRef.value) {
    const rect = inputBarRef.value.getBoundingClientRect();
    emojiPickerStyle.value = {
      bottom: `${window.innerHeight - rect.top + 16}px`,
      left: `${rect.left}px`,
    };
  }
};

// Click outside to close emoji picker
const handleClickOutside = (e: MouseEvent) => {
  if (!showEmojiPicker.value) return;
  const target = e.target as Node;
  if (
    !inputBarRef.value?.contains(target) &&
    !emojiPickerRef.value?.contains(target)
  ) {
    showEmojiPicker.value = false;
  }
};

const onSelectEmoji = (emoji: EmojiExt) => {
  inputText.value += emoji.i;
  nextTick(() => {
    textareaRef.value?.focus();
    autoResize();
  });
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  nextTick(() => {
    textareaRef.value?.focus();
    autoResize();
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  // queuedFiles.value.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
});

// Placeholder for voice
const startRecording = (e: MouseEvent | TouchEvent) => {
  // Reset state
  isCancelling.value = false;
  showCancelHint.value = false;
  recordingTime.value = 0;
  audioChunks = [];
  isRecording.value = true;
  isPaused.value = false;
  recordedAudio.value = null; // Clear previous recording

  if (timerInterval) clearInterval(timerInterval);
  startTimer();

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Check if user cancelled while waiting
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

        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
        audioChunks = [];

        if (!isCancelling.value) {
          // Provide for Review instead of auto-sending
          const url = URL.createObjectURL(audioBlob);
          recordedAudio.value = { blob: audioBlob, url, duration };
          // isRecording is already false here
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
  mediaRecorder.stop(); // triggers onstop -> sets recordedAudio
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

  // Cleanup
  deleteRecording();
};

const cancelRecording = () => {
  if (!isRecording.value) return;

  isCancelling.value = true;
  setTimeout(() => {
    stopRecording();
    // Do NOT reset isCancelling here, wait for next start
  }, 300);
};


</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

/* Waveform animation */
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
