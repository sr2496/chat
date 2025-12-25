<!-- MediaComposer.vue -->
<template>
  <div class="flex flex-col h-full bg-white text-gray-900">

    <!-- Preview Area (FIXED SIZE – NO CAROUSEL) -->
    <div class="flex-1 flex items-center justify-center bg-gray-100 relative">

      <!-- Remove Active -->
      <button @click="$emit('close')"
        class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center">
        ✕
      </button>

      <!-- Add More -->
      <label
        class="absolute top-4 left-4 w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center cursor-pointer">
        +
        <input ref="fileInput" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" class="hidden"
          @change="addMoreFiles" />
      </label>

      <!-- FIXED PREVIEW BOX -->
      <div class="w-[420px] h-[420px] bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">

        <!-- Image -->
        <img v-if="activeFile.type === 'image' && activeFile.preview" :src="activeFile.preview"
          class="max-w-full max-h-full object-contain" />

        <!-- Video -->
        <video v-else-if="activeFile.type === 'video' && activeFile.preview" :src="activeFile.preview" controls
          class="max-w-full max-h-full object-contain" />

        <!-- File -->
        <div v-else class="text-center px-6">
          <p class="font-semibold">{{ activeFile.name }}</p>
          <p class="text-sm text-gray-500">{{ formatFileSize(activeFile.size) }}</p>
        </div>
      </div>
    </div>

    <!-- Caption -->
    <div class="h-16 px-4 flex items-center border-t shrink-0">
      <input v-model="currentCaption" placeholder="Add a caption…" class="flex-1 outline-none bg-transparent" />
      <span class="text-xs text-gray-400 ml-2">
        {{ currentCaption.length }}/2048
      </span>
    </div>

    <!-- Bottom Grid (NO CAROUSEL) -->
    <div class="h-[112px] px-4 py-3 border-t bg-gray-50 flex items-center gap-4 shrink-0">

      <!-- Thumbnails Row (FIXED spacing) -->
      <div class="flex items-center gap-3 flex-1 overflow-x-auto">

        <div v-for="(file, index) in files" :key="index" @click="activeIndex = index"
          class="relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer shrink-0" :class="activeIndex === index
            ? 'ring-2 ring-blue-500'
            : 'opacity-80 hover:opacity-100'">
          <!-- Image -->
          <img v-if="file.type === 'image'" :src="file.preview" class="w-full h-full object-cover" />

          <!-- Video -->
          <video v-else-if="file.type === 'video'" :src="file.preview" class="w-full h-full object-cover" />

          <!-- File -->
          <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold">
            FILE
          </div>

          <!-- Remove Button (VISIBLE) -->
          <button @click.stop="removeFile(index)"
            class="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition">
            ×
          </button>
        </div>

      </div>

      <!-- Send Button with COUNT -->
      <button @click="$emit('send', files)"
        class="relative w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg hover:bg-blue-700 active:scale-95 transition">
        ➤

        <!-- File Count Badge -->
        <span v-if="files.length > 1"
          class="absolute -top-1 -right-1 w-6 h-6 bg-white text-blue-600 text-xs font-bold rounded-full flex items-center justify-center shadow">
          {{ files.length }}
        </span>
      </button>
    </div>


  </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  files: Array<{
    file: File;
    preview?: string;
    type: 'image' | 'video' | 'file';
    name: string;
    size: number;
    caption?: string;
  }>;
}>();

const emit = defineEmits(['close', 'send', 'file-add']);
const fileInput = ref<HTMLInputElement | null>(null);
const activeIndex = ref(0);

const activeFile = computed(() => props.files[activeIndex.value] || { name: 'Unknown', size: 0, type: 'file' });

const currentCaption = computed({
  get: () => props.files[activeIndex.value]?.caption || '',
  set: (val) => {
    if (props.files[activeIndex.value]) props.files[activeIndex.value].caption = val;
  }
});

const removeFile = (index: number) => {
  const file = props.files[index];
  if (!file) return;

  // Revoke preview URL
  if (file.preview) {
    URL.revokeObjectURL(file.preview);
  }

  // Remove file
  props.files.splice(index, 1);

  // Fix activeIndex
  if (activeIndex.value > index) {
    activeIndex.value--;
  }

  if (activeIndex.value >= props.files.length) {
    activeIndex.value = props.files.length - 1;
  }

  // No files left → close composer (optional)
  if (props.files.length === 0) {
    activeIndex.value = 0;
    emit('close'); // optional but recommended
  }
};

const addMoreFiles = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const newFiles = Array.from(input.files).map(file => ({
      file,
      preview: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined,
      type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
      name: file.name,
      size: file.size,
      caption: ''
    }));
    emit('file-add', newFiles);
  }
  // Reset input
  input.value = '';
};


// Utils
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

<style scoped>
/* Fixed heights ensure consistent layout */
:deep(.grid) {
  max-height: 80px;
}

/* Smooth fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Custom scrollbar for grid */
.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>