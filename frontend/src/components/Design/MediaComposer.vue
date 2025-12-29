<!-- MediaComposer.vue – Updated with Custom Chat Theme -->
<template>
  <div class="flex flex-col h-full bg-chat-surface text-chat-text">

    <!-- Preview Area – flex-1 -->
    <div class="flex-1 flex items-center justify-center bg-chat-bg/30 relative">

      <!-- Close Button -->
      <button @click="$emit('close')"
        class="absolute top-4 right-4 w-10 h-10 rounded-full bg-chat-surface/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-chat-surface/70 transition">
        <svg class="w-5 h-5 text-chat-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Add More Files -->
      <label class="absolute top-4 left-4 cursor-pointer">
        <input ref="fileInput" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" class="hidden"
          @change="addMoreFiles" />
        <div
          class="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-lg transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </label>

      <!-- Fixed Preview Box (420x420) -->
      <div
        class="w-[420px] h-[420px] bg-chat-surface rounded-3xl shadow-2xl overflow-hidden border border-chat-border flex items-center justify-center">
        <!-- Image -->
        <img v-if="activeFile.type === 'image' && activeFile.preview" :src="activeFile.preview"
          class="max-w-full max-h-full object-contain" alt="Preview" />

        <!-- Video -->
        <video v-else-if="activeFile.type === 'video' && activeFile.preview" :src="activeFile.preview" controls
          class="max-w-full max-h-full object-contain rounded-2xl" />

        <!-- File Placeholder -->
        <div v-else class="text-center px-8">
          <div class="w-20 h-20 mx-auto mb-4 bg-chat-bg rounded-2xl flex items-center justify-center shadow-inner">
            <svg class="w-10 h-10 text-chat-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p class="font-semibold text-lg">{{ truncateName(activeFile.name, 30) }}</p>
          <p class="text-sm text-chat-text-muted mt-1">{{ formatFileSize(activeFile.size) }}</p>
        </div>
      </div>
    </div>

    <!-- Caption Input – h-16 -->
    <div class="h-16 px-6 flex items-center border-t border-chat-border bg-chat-surface">
      <input v-model="currentCaption" placeholder="Add a caption..."
        class="flex-1 text-base bg-transparent outline-none placeholder-chat-text-muted" />
      <span class="text-sm text-chat-text-muted ml-3">
        {{ currentCaption.length }}/2048
      </span>
    </div>

    <!-- Bottom Thumbnails Row – h-[112px] -->
    <div class="h-[112px] px-6 bg-chat-bg/30 border-t border-chat-border flex items-center justify-between">

      <!-- Thumbnails -->
      <div class="flex-1 flex items-center max-w-full">
        <div class="flex items-center gap-3 overflow-x-auto custom-scrollbar py-2 px-1 flex-1">
          <div v-for="(file, index) in files" :key="index" @click="activeIndex = index"
            class="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer shrink-0 transition-all duration-200 shadow-md group"
            :class="activeIndex === index ? 'ring-4 ring-blue-500 shadow-xl scale-105 z-10' : 'opacity-80 hover:opacity-100 hover:shadow-lg'">
            <!-- Thumbnail Content -->
            <img v-if="file.type === 'image' && file.preview" :src="file.preview" class="w-full h-full object-cover"
              alt="Thumbnail" />
            <video v-else-if="file.type === 'video' && file.preview" :src="file.preview"
              class="w-full h-full object-cover" />
            <div v-else
              class="w-full h-full bg-chat-bg flex items-center justify-center text-sm font-bold text-chat-text-muted">
              {{ file.name.split('.').pop()?.toUpperCase() || 'FILE' }}
            </div>

            <!-- Remove Button -->
            <button @click.stop="removeFile(index)"
              class="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-20 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Send Button with Count -->
      <div class="flex-shrink-0 ml-auto">
        <button @click="$emit('send', files)"
          class="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95">
          <svg class="w-6 h-6 rotate-90 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>

          <!-- Count Badge -->
          <span v-if="files.length > 0"
            class="absolute -top-2 -right-2 w-8 h-8 bg-chat-surface text-blue-600 text-sm font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-chat-bg">
            {{ files.length }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  files: Array<{
    file: File;
    preview?: string;
    type: 'image' | 'video' | 'file' | 'audio';
    name: string;
    size: number;
    caption?: string;
  }>;
}>();

const emit = defineEmits(['close', 'send', 'file-add']);
const fileInput = ref<HTMLInputElement | null>(null);
const activeIndex = ref(0);

const activeFile = computed(() => props.files[activeIndex.value] || { name: 'Unknown', preview: undefined, size: 0, type: 'file' });

const currentCaption = computed({
  get: () => props.files[activeIndex.value]?.caption || '',
  set: (val) => {
    if (props.files[activeIndex.value]) {
      props.files[activeIndex.value].caption = val;
    }
  }
});

const removeFile = (index: number) => {
  const file = props.files[index];
  if (!file) return;

  if (file.preview) {
    URL.revokeObjectURL(file.preview);
  }

  props.files.splice(index, 1);

  if (activeIndex.value >= props.files.length) {
    activeIndex.value = Math.max(0, props.files.length - 1);
  }

  if (props.files.length === 0) {
    emit('close');
  }
};

const addMoreFiles = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const newFiles = Array.from(input.files).map(file => ({
    file,
    preview: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined,
    type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
    name: file.name,
    size: file.size,
    caption: ''
  }));

  emit('file-add', newFiles);
  input.value = '';
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const truncateName = (name: string, length: number): string => {
  if (name.length <= length) return name;
  const parts = name.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  return parts.join('.').slice(0, length - ext.length - 3) + '...' + ext;
};
</script>