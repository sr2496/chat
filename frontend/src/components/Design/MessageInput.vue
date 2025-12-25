<!-- MessageInput.vue - Current Design + Old Functionality -->
<template>
  <div class="bg-white dark:bg-gray-800 px-4 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700">
    <!-- Reply Preview -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="replyingTo" class="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 mb-3 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Replying to {{ replyingTo.senderName || 'someone' }}
            </p>
            <p class="text-sm text-gray-800 dark:text-gray-200 truncate mt-1">
              {{ replyingTo.body }}
            </p>
          </div>
          <button @click="$emit('cancel-reply')" class="ml-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- File Previews (from old version) -->
    <div v-if="queuedFiles.length" class="flex flex-wrap gap-3 mb-3 -mx-1">
      <div v-for="(fileObj, index) in queuedFiles" :key="index" class="relative group">
        <!-- Image/Video Preview -->
        <div v-if="fileObj.preview"
          class="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-md">
          <img v-if="fileObj.type.startsWith('image/')" :src="fileObj.preview" class="w-full h-full object-cover" />
          <video v-else :src="fileObj.preview" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <button @click.stop="removeFile(index)"
              class="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Generic File -->
        <div v-else
          class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm">
          <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
          </svg>
          <div class="min-w-0 flex-1">
            <p class="font-medium truncate max-w-32">{{ fileObj.file.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(fileObj.file.size) }}</p>
          </div>
          <button @click.stop="removeFile(index)" class="text-red-500 hover:text-red-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Input Bar -->
    <div
      ref="inputBarRef"
      class="flex items-end gap-4 bg-gray-100 dark:bg-gray-700 rounded-3xl px-4 py-3 shadow-inner ring-1 ring-gray-200 dark:ring-gray-600 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all"
    >
      <!-- Emoji Button -->
      <button
        @click="toggleEmojiPicker"
        class="text-gray-500 hover:text-yellow-500 transition text-2xl flex-shrink-0"
      >
        😊
      </button>

      <!-- Attachment Button -->
      <label class="cursor-pointer flex-shrink-0">
        <input
          ref="fileInput"
          @change="handleFileSelect"
          type="file"
          multiple
          class="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
        />
        <svg
          class="w-6 h-6 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </label>

      <!-- Text Input -->
      <textarea
        v-model="inputText"
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact=""
        rows="1"
        placeholder="Type a message..."
        class="flex-1 bg-transparent outline-none text-sm resize-none max-h-32 overflow-y-auto py-0.5"
        ref="textareaRef"
      />

      <!-- Right Button: Mic or Send -->
      <transition mode="out-in" enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-75" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-75">
        <button
          v-if="canSend"
          @click="sendMessage"
          class="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-lg flex-shrink-0"
          key="send"
        >
          <svg class="w-5 h-5 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        <button
          v-else
          @click="startVoiceRecording"
          class="w-11 h-11 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 flex-shrink-0"
          key="mic"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m7-7a7 7 0 00-7-7m7 7H5" />
          </svg>
        </button>
      </transition>
    </div>

    <!-- Emoji Picker (positioned above input) -->
    <teleport to="body">
      <div
        v-if="showEmojiPicker"
        class="fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700"
        :style="emojiPickerStyle"
        ref="emojiPickerRef"
      >
        <!-- Replace with your actual emoji picker component -->
        <div class="text-center text-gray-500 text-sm">Emoji Picker Here</div>
        <!-- Example: <EmojiPicker @emoji="insertEmoji" /> -->
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  replyingTo?: { senderName?: string; body: string } | null;
}>();

const emit = defineEmits(['send-text', 'queue-files', 'cancel-reply']);

interface QueuedFile {
  file: File;
  preview?: string;
  type: string;
}

const inputText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const inputBarRef = ref<HTMLElement | null>(null);
const emojiPickerRef = ref<HTMLElement | null>(null);

const queuedFiles = ref<QueuedFile[]>([]);
const showEmojiPicker = ref(false);
const emojiPickerStyle = ref({ bottom: '0', left: '0' });

const canSend = computed(() => inputText.value.trim().length > 0 || queuedFiles.value.length > 0);

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
  const newFiles: QueuedFile[] = [];

  for (const file of files) {
    const queued: QueuedFile = {
      file,
      type: file.type || 'file',
    };
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      queued.preview = URL.createObjectURL(file);
    }
    newFiles.push(queued);
  }

  queuedFiles.value.push(...newFiles);
  input.value = '';
  nextTick(autoResize);
};

const removeFile = (index: number) => {
  const file = queuedFiles.value[index];
  if (file.preview) URL.revokeObjectURL(file.preview);
  queuedFiles.value.splice(index, 1);
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Send
const sendMessage = () => {
  const text = inputText.value.trim();

  if (text) {
    emit('send-text', text);
    inputText.value = '';
  }

  if (queuedFiles.value.length) {
    emit('queue-files', queuedFiles.value.map(f => ({ file: f.file, type: f.type, preview: f.preview })));
    queuedFiles.value.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
    queuedFiles.value = [];
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  nextTick(() => {
    textareaRef.value?.focus();
    autoResize();
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  queuedFiles.value.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
});

// Placeholder for voice
const startVoiceRecording = () => {
  console.log('Voice recording started...');
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
</style>