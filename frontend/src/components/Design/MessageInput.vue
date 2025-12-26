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
              Replying to {{ replyingTo.senderName || 'someone' }}
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
      <button @click="toggleEmojiPicker" class="text-gray-500 hover:text-yellow-500 transition text-2xl flex-shrink-0">
        😊
      </button>

      <!-- Attachment Button -->
      <label class="cursor-pointer flex-shrink-0">
        <input ref="fileInput" @change="handleFileSelect" type="file" multiple class="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
        <svg class="w-6 h-6 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </label>

      <!-- Text Input -->
      <textarea v-model="inputText" @keydown.enter.exact.prevent="sendMessage" @keydown.enter.shift.exact="" rows="1"
        placeholder="Type a message..."
        class="flex-1 bg-transparent outline-none text-sm resize-none max-h-32 overflow-y-auto py-0.5"
        ref="textareaRef" />

      <!-- Right Button: Mic or Send -->
      <transition mode="out-in" enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-75" enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-75">
        <button v-if="canSend" @click="sendMessage"
          class="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-lg flex-shrink-0"
          key="send">
          <svg class="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        <button v-else @click="startVoiceRecording"
          class="w-11 h-11 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 flex-shrink-0"
          key="mic">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14a3 3 0 003-3V4a3 3 0 00-6 0v7a3 3 0 003 3z" />
            <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
            <path d="M12 19v4m-3 0h6" />
          </svg>

        </button>
      </transition>
    </div>

    <!-- Emoji Picker (positioned above input) -->
    <teleport to="body">
      <div v-if="showEmojiPicker"
        class="fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700"
        :style="emojiPickerStyle" ref="emojiPickerRef">
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
  replyingTo?: {
    id?: number;
    senderName?: string;
    body: string;
  } | null;
}>();

const emit = defineEmits(['send-text', 'file-select', 'cancel-reply']);



const inputText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const inputBarRef = ref<HTMLElement | null>(null);
const emojiPickerRef = ref<HTMLElement | null>(null);


const showEmojiPicker = ref(false);
const emojiPickerStyle = ref({ bottom: '0', left: '0' });

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

  emit('file-select', files);
  input.value = '';
  nextTick(autoResize);


};


const senderNameColor = computed(() => {
  const name = props.replyingTo?.value?.senderName || 'unknown';
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