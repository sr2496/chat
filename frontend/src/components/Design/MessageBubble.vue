<!-- MessageBubble.vue -->
<template>
  <div :ref="(el) => setMessageRef(message.id, el)" :data-day="getMessageDay(message.created_at)"
    class="flex mb-6 message-row group relative" :class="isSent ? 'justify-end' : 'gap-3 items-end'">
    <!-- Avatar for received -->

    <UserAvatar v-if="!isSent && isGroup" :avatar="message.sender?.avatar" :name="message.sender?.name || 'User'"
      size="sm" :is-online="message.sender?.online" :show-online="false" />

    <div class="max-w-[75%]">
      <div class="relative">
        <div class="relative px-4 py-2 rounded-2xl shadow-sm overflow-hidden" :class="bubbleClasses">
          <!-- Tail -->
          <svg class="absolute bottom-0 w-4 h-4" :class="tailClasses" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 0 Q 16 16, 16 0 L 0 16 Z" />
          </svg>

          <!-- Uploading Overlay (dim + progress bar) -->
          <div v-if="isUploading" class="absolute inset-0 bg-black/30 flex items-center justify-center rounded-2xl">
            <div class="text-center text-white">
              <div class="text-sm font-medium mb-2">{{ uploadProgress }}%</div>
              <div class="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                <div class="h-full bg-white transition-all duration-300" :style="{ width: uploadProgress + '%' }" />
              </div>
              <button @click.stop="$emit('cancel-upload')" class="mt-3 text-xs underline opacity-80 hover:opacity-100">
                Cancel
              </button>
            </div>
          </div>


          <!-- Sender Name INSIDE bubble (only received + group) -->
          <div v-if="!isSent && isGroup" class="mb-2 px-1">
            <span class="text-xs font-bold" :class="nameTextColor">
              {{ message.sender?.name || message.sender?.username || 'Unknown' }}
            </span>
          </div>

          <!-- Text Message -->
          <p v-if="!message?.type || message.type === 'text'"
            class="text-sm leading-relaxed break-all whitespace-pre-wrap overflow-wrap-anywhere">
            {{ message?.message || "" }}
          </p>

          <!-- Image Preview -->
          <div v-else-if="message.type === 'image'" class="relative">
            <img :src="message.file_path" class="w-full rounded-lg max-w-sm" alt="Image" />
            <p v-if="message.message" class="mt-2 text-sm">
              {{ message.message }}
            </p>
          </div>

          <!-- Video Preview -->
          <video v-else-if="message.type === 'video'" :src="message.file_path" controls
            class="w-full rounded-lg max-w-sm">
            Your browser does not support video.
          </video>

          <!-- File Preview -->
          <div v-else-if="message.type === 'file'"
            class="flex items-center gap-4 bg-black/10 dark:bg-white/10 rounded-xl p-4 shadow-sm">
            <!-- Dynamic File Icon -->
            <div class="flex-shrink-0">
              <!-- PDF -->
              <svg v-if="fileExt === 'pdf'" class="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path fill="#fff" d="M14 2v6h6" />
                <text x="7" y="15" font-size="6" font-weight="bold" fill="#fff">
                  PDF
                </text>
              </svg>

              <!-- Word (doc, docx) -->
              <svg v-else-if="/docx?/.test(fileExt)" class="w-12 h-12 text-blue-600" fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path fill="#fff" d="M14 2v6h6" />
                <text x="7" y="15" font-size="6" font-weight="bold" fill="#fff">
                  DOC
                </text>
              </svg>

              <!-- Text file -->
              <svg v-else-if="fileExt === 'txt'" class="w-12 h-12 text-gray-600" fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path fill="#fff" d="M14 2v6h6" />
                <text x="7" y="15" font-size="6" font-weight="bold" fill="#fff">
                  TXT
                </text>
              </svg>

              <!-- ZIP / Archive -->
              <svg v-else-if="/zip|rar|7z/.test(fileExt)" class="w-12 h-12 text-amber-600" fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M20 9H4l8-7z" />
                <path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <text x="8" y="15" font-size="6" font-weight="bold" fill="#fff">
                  ZIP
                </text>
              </svg>

              <!-- Excel (xls, xlsx) -->
              <svg v-else-if="/xls[x]?$/.test(fileExt)" class="w-12 h-12 text-green-600" fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path fill="#fff" d="M14 2v6h6" />
                <text x="7" y="15" font-size="6" font-weight="bold" fill="#fff">
                  XLS
                </text>
              </svg>

              <!-- PowerPoint (ppt, pptx) -->
              <svg v-else-if="/ppt[x]?$/.test(fileExt)" class="w-12 h-12 text-orange-600" fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path fill="#fff" d="M14 2v6h6" />
                <text x="7" y="15" font-size="6" font-weight="bold" fill="#fff">
                  PPT
                </text>
              </svg>

              <!-- Generic File Fallback -->
              <svg v-else class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <!-- File Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ message.file_name }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {{ formatSize(message.file_size) }}
              </p>
            </div>

            <!-- Download Button -->
            <a :href="message.file_path" :download="message.file_name" class="flex-shrink-0">
              <button
                class="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition shadow-md">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </a>
          </div>

          <!-- Time + Read Receipt -->
          <div class="flex justify-end items-center gap-1 mt-2">
            <span class="text-[11px] opacity-70">{{
              formatTime(message.created_at)
            }}</span>
            <span v-if="isSent" class="text-[11px]" :class="readClass">
              {{ message?.read_by_count > 0 ? "✓✓" : "✓" }}
            </span>
          </div>
        </div>

        <!-- Reactions -->
        <div v-if="message.reactions && Object.keys(message.reactions).length" class="flex gap-1 mt-2"
          :class="isSent ? 'justify-end -mr-2' : '-ml-2'">
          <span v-for="(users, emoji) in message.reactions" :key="emoji"
            class="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded-full shadow">
            {{ emoji }} {{ users.length > 1 ? users.length : "" }}
          </span>
        </div>

        <transition name="fade">
          <button @click.stop="$emit('open-emoji', message.id)"
            class="absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-10"
            :class="isSent ? '-left-12' : '-right-12'">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UserAvatar from "./UserAvatar.vue";

const props = defineProps<{
  isGroup: boolean;
  isSent: boolean;
  message?: any;
  senderAvatar?: string;
  setMessageRef: Function;
  getMessageDay: Function;
  isUploading?: boolean;
  uploadProgress?: number;
}>();

const emit = defineEmits(["cancel-upload", "open-emoji"]);

const formatSize = (bytes?: number) => {
  if (!bytes) return "0 KB";
  return bytes > 1024 * 1024
    ? (bytes / (1024 * 1024)).toFixed(1) + " MB"
    : (bytes / 1024).toFixed(1) + " KB";
};

const formatTime = (timestamp?: string) => {
  if (!timestamp) return "Just now";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const fileExt = computed(() => {
  if (!props.message?.file_name) return "";
  return props.message.file_name.split(".").pop()?.toLowerCase() || "";
});

const bubbleClasses = computed(() => ({
  "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none":
    !props.isSent,
  "bg-blue-500 text-white rounded-br-none": props.isSent,
}));

const tailClasses = computed(() => ({
  "left-0 -translate-x-2 text-white dark:text-gray-700": !props.isSent,
  "right-0 translate-x-2 text-blue-500": props.isSent,
}));

const readClass = computed(() =>
  (props.message?.read ? "✓✓" : "✓") === "✓✓" ? "text-white" : "text-white/60"
);

const nameTextColor = computed(() => {
  // Generate consistent color per user based on ID or name
  const seed = props.message.sender?.id || props.message.sender?.name || 'unknown';
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

  // Simple hash for consistent color
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;

  return colors[index];
});;
</script>
