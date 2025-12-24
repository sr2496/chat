<template>
  <div class="flex justify-end">
    <div class="max-w-[75%] relative">
      <div
        class="sent-bubble bg-blue-500 text-white rounded-2xl shadow-sm px-4 py-2 flex flex-col gap-2 w-fit max-w-full relative">

        <!-- Preview for image/video -->
        <div v-if="upload.preview" class="relative">
          <img v-if="upload.type === 'image'" :src="upload.preview" class="rounded-xl max-w-[250px] opacity-70" />
          <video v-else-if="upload.type === 'video'" :src="upload.preview"
            class="rounded-xl max-w-[250px] w-full opacity-70" muted />

          <!-- Progress overlay -->
          <div class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
            <div class="relative">
              <!-- Circular Progress -->
              <svg class="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.3)" stroke-width="6" fill="none" />
                <circle cx="32" cy="32" r="28" stroke="white" stroke-width="6" fill="none"
                  :stroke-dasharray="uploadCircumference"
                  :stroke-dashoffset="uploadCircumference - (upload.progress / 100) * uploadCircumference"
                  class="transition-all duration-300" />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-white font-medium text-sm">{{ upload.progress }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- File upload (no preview) -->
        <div v-else class="flex items-center gap-3 opacity-70">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ upload.file.name }}</p>
            <p class="text-xs opacity-70">{{ formatFileSize(upload.file.size) }}</p>
          </div>
        </div>

        <!-- Progress bar for non-preview uploads -->
        <div v-if="!upload.preview" class="w-full bg-white/20 rounded-full h-2 mt-2">
          <div class="bg-white h-2 rounded-full transition-all duration-300"
            :style="{ width: upload.progress + '%' }" />
        </div>

        <!-- Cancel button -->
        <button @click="cancelUpload(upload)"
          class="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110"
          title="Cancel upload">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  emits: ["cancel"],
  props: {
    upload: {
      type: Object as () => {
        tempId: string;
        file: File;
        type: string;
        preview?: string;
        progress: number;
        controller: AbortController;
      },
      required: true
    }
  },
  setup(_, { emit }) {

    const UPLOAD_RADIUS = 28;
    const uploadCircumference = 2 * Math.PI * UPLOAD_RADIUS;
    

    function formatFileSize(size: number): string {
      if (size < 1024) return size + ' B';
      else if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
      else return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    const cancelUpload = (item: any) => {
      emit("cancel", item);
    };

    return {
      uploadCircumference,
      formatFileSize,
      cancelUpload
    };
  },
});
</script>
