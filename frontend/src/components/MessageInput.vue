<template>
  <div class="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
    <div class="max-w-4xl mx-auto">
      <div class="flex flex-col gap-2">
        <!-- File Previews -->
        <div v-if="queuedFiles.length > 0" class="flex flex-wrap gap-2">
          <div v-for="(fileObj, index) in queuedFiles" :key="index" class="relative group">
            <!-- Image/Video Preview -->
            <div v-if="fileObj.preview"
              class="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600 shadow-sm">
              <img v-if="fileObj.type.startsWith('image/')" :src="fileObj.preview"
                class="w-full h-full object-cover cursor-pointer" />
              <video v-else :src="fileObj.preview" class="w-full h-full object-cover" />
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button @click="removeFile(index)"
                  class="text-white bg-red-500 rounded-full p-1.5 hover:bg-red-600 transition">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <!-- Generic File -->
            <div v-else
              class="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-xs">
              <svg class="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
              </svg>
              <div class="min-w-0">
                <p class="font-medium text-gray-900 dark:text-white truncate max-w-24">{{ fileObj.file.name }}</p>
                <p class="text-xs text-gray-500">{{ formatFileSize(fileObj.file.size) }}</p>
              </div>
              <button @click="removeFile(index)" class="ml-1 text-red-500 hover:text-red-600 flex-shrink-0">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <!-- Input Bar -->
        <div ref="inputBarRef"
          class="relative flex items-end gap-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl shadow-sm px-3 py-2.5 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all duration-200">

          <!-- Hidden File Input -->
          <input ref="fileInput" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.zip" class="hidden"
            @change="handleFileSelect" />
          <!-- Attachment Button -->
          <button type="button" @click="$refs.fileInput?.click()"
            class="stext-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition hover:scale-105 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <!-- Message Input -->
          <textarea v-model="message" @keydown.enter="handleEnter" placeholder="Type a message..." rows="1"
            class="flex-1 resize-none bg-transparent outline-none text-gray-900 dark:text-white py-1 text-sm placeholder-gray-500 dark:placeholder-gray-400 max-h-24 overflow-y-auto scrollbar-hidden"
            ref="inputRef" />
          <!-- Emoji Button + Picker -->
          <div class="relative">
            <button type="button" @click="showEmojiPicker = !showEmojiPicker"
              class="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition hover:scale-105 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <!-- Emoji Picker -->
            <div v-if="showEmojiPicker" ref="emojiPickerRef" class="absolute bottom-full mb-2 right-0 z-50">
              <EmojiPicker @select="insertEmoji" :native="true" />
            </div>
          </div>
          <!-- Send Button -->
          <button type="button" @click="send" :disabled="!canSend"
            class="p-2.5 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm" :class="canSend
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
              ">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, computed, nextTick, watch, onMounted, onUnmounted } from "vue";
import EmojiPicker from "vue3-emoji-picker";
import { useChatStore } from "../stores/chat";
import { useUserStore } from "../stores/user";
interface QueuedFile {
  file: File;
  preview?: string;
  type: string;
}
export default defineComponent({
  components: { EmojiPicker },
  emits: ["send-text", "queue-files"],
  setup(_, { emit }) {
    const chatStore = useChatStore();
    const userStore = useUserStore();
    const message = ref("");
    const queuedFiles = ref<QueuedFile[]>([]);
    const inputRef = ref<HTMLTextAreaElement | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const showEmojiPicker = ref(false);
    const inputBarRef = ref<HTMLElement | null>(null);
    const emojiPickerRef = ref<HTMLElement | null>(null);
    const canSend = computed(() => message.value.trim().length > 0 || queuedFiles.value.length > 0);

    let typingTimeout: any = null;

    const handleFileSelect = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const files = Array.from(input.files || []);
      const newFiles: QueuedFile[] = [];
      for (const file of files) {
        const queued: QueuedFile = { file, type: file.type };
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          queued.preview = URL.createObjectURL(file);
        }
        newFiles.push(queued);
      }
      if (newFiles.length > 0) {
        queuedFiles.value = [...queuedFiles.value, ...newFiles];
        input.value = "";
      }
    };
    const removeFile = (index: number) => {
      if (queuedFiles.value[index].preview) {
        URL.revokeObjectURL(queuedFiles.value[index].preview!);
      }
      queuedFiles.value.splice(index, 1);
    };
    const send = () => {
      const text = message.value.trim();
      if (text) {
        emit("send-text", text);
        message.value = "";
      }
      if (queuedFiles.value.length > 0) {
        emit("queue-files", queuedFiles.value);
        queuedFiles.value = [];
      }
      nextTick(() => adjustHeight());
    };
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    };
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };
    const insertEmoji = (emoji: any) => {
      message.value += emoji.i;
      showEmojiPicker.value = false;
      inputRef.value?.focus();
      nextTick(adjustHeight);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (!showEmojiPicker.value) return;
      const target = event.target as Node;

      const clickedInsideInputBar = inputBarRef.value?.contains(target);
      const clickedInsidePicker = emojiPickerRef.value?.contains(target);

      if (!clickedInsideInputBar && !clickedInsidePicker) {
        showEmojiPicker.value = false;
      }
    };
    onMounted(() => {
      document.addEventListener("click", handleClickOutside);
    });
    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
    });
    const adjustHeight = () => {
      if (!inputRef.value) return;
      inputRef.value.style.height = "auto";
      inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 96)}px`; // max ~4 lines
    };
    watch(message, (val) => {
      if (!chatStore.activeConversationId || !val) return;
      
      const channel = window.Echo.private(
        `conversation.${chatStore.activeConversationId}`
      );

      channel.whisper("typing", {
        user_id: userStore.user?.id,
      });

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => { }, 1500);
    });

    watch(message, () => nextTick(adjustHeight));
    nextTick(() => {
      adjustHeight();
      inputRef.value?.focus();
    });
    return {
      message,
      queuedFiles,
      inputRef,
      fileInput,
      showEmojiPicker,
      canSend,
      handleFileSelect,
      removeFile,
      formatFileSize,
      send,
      insertEmoji,
      handleEnter,
      inputBarRef,
      emojiPickerRef,
    };
  },
});
</script>
<style scoped>
.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
</style>