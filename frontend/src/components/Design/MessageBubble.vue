<!-- MessageBubble.vue -->
<template>
  <div :ref="(el) => setMessageRef(message.id, el)" :data-day="getMessageDay(message.created_at)"
    class="flex mb-6 message-row group relative" :class="isSent ? 'justify-end' : 'gap-3 items-end'">
    <!-- Avatar for received -->

    <UserAvatar v-if="!isSent && isGroup && message.type !== 'audio'" :avatar="message.sender?.avatar" size="sm"
      :is-online="message.sender?.online" :show-online="false" :is-group="false" />

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

          <!-- Replied Message Preview – Polished & Premium -->
          <div v-if="message.reply_to" @click="$emit('scroll-to-message', message.reply_to.id)" class="
            mb-3
            -mx-3 px-3 py-2.5
            rounded-lg
            bg-blue-50/80 dark:bg-gray-800/80
            border-l-4 border-blue-500
            cursor-pointer
            select-none
            transition-all duration-200
            hover:bg-blue-100/80 dark:hover:bg-gray-700/80
            hover:shadow-sm
          ">
            <p class="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
              {{ message.reply_to.sender_name }}
            </p>

            <p class="
                text-sm text-gray-700 dark:text-gray-300
                mt-1 leading-relaxed
                line-clamp-2
                break-all whitespace-pre-wrap overflow-wrap-anywhere
              ">
              {{ message.reply_to.body }}
            </p>
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

          <!-- Audio Player (Custom) -->
          <div v-else-if="message.type === 'audio'" class="flex items-center gap-3 min-w-[240px] p-1 pr-4">
            <!-- Play/Pause Button -->
            <button @click.stop="toggleAudio"
              class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
              :class="isSent ? 'bg-white text-blue-500 hover:bg-gray-100' : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'">
              <svg v-if="!isPlaying" class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>

            <!-- Progress & Time -->
            <div class="flex-1 flex flex-col justify-center min-w-[120px] gap-1">
              <!-- Waveform / Progress Bar -->
              <div class="relative h-1 bg-black/10 dark:bg-white/20 rounded-full overflow-hidden cursor-pointer"
                @click.stop="seekAudio">
                <div class="absolute inset-y-0 left-0 transition-all duration-100 ease-linear rounded-full"
                  :class="isSent ? 'bg-white' : 'bg-gray-800 dark:bg-gray-200'" :style="{ width: progress + '%' }">
                </div>
              </div>

              <!-- Duration Text -->
              <div class="flex justify-between text-[10px] font-medium opacity-70">
                <span>{{ formatAudioTime(currentTime) }}</span>
                <span>{{ formatAudioTime(duration || message.file_size / 5000)
                  }}<!-- Fallback if duration not ready --></span>
              </div>
            </div>

            <!-- Hidden Audio Element -->
            <audio ref="audioRef" :src="message.file_path" @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata"
              @ended="onEnded" @play="isPlaying = true" @pause="isPlaying = false" class="hidden"></audio>
          </div>

          <!-- Video Preview -->
          <video v-else-if="message.type === 'video'" :src="message.file_path" controls
            class="w-full rounded-lg max-w-sm">
            Your browser does not support video.
          </video>

          <!-- File Preview -->
          <div v-else-if="message.type === 'file'"
            class="flex items-center gap-4 bg-black/5 dark:bg-white/10 rounded-xl p-4 shadow-sm border border-transparent dark:border-white/10">
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

          <!-- Message actions (⋮) inside bubble -->
          <button @click.stop="$emit('open-actions', $event, message)" class="
              absolute top-2 right-2
              w-5 h-5
              flex items-center justify-center
              rounded-full
              bg-white/90 dark:bg-gray-700
              backdrop-blur-sm
              shadow-md
              border border-gray-200 dark:border-gray-600
              text-gray-700 dark:text-gray-100
              opacity-0 group-hover:opacity-100
              hover:bg-gray-100 dark:hover:bg-gray-700
              hover:scale-110
              transition-all duration-200
              z-30
            ">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M6.7 9.3a1 1 0 011.4 0L12 13.17l3.9-3.88a1 1 0 111.4 1.42l-4.6 4.6a1 1 0 01-1.4 0l-4.6-4.6a1 1 0 010-1.42z" />
            </svg>

          </button>

        </div>

        <!-- Reactions -->
        <div v-if="message.reactions && Object.keys(message.reactions).length" class="flex gap-1 mt-2"
          :class="isSent ? 'justify-end -mr-2' : '-ml-2'">
          <span v-for="(users, emoji) in message.reactions" :key="emoji"
            class="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded-full shadow">
            {{ emoji }} {{ users.length > 1 ? users.length : "" }}
          </span>
        </div>

        <!-- Reaction Button -->
        <transition name="fade">
          <button @click.stop="$emit('open-emoji', message.id)"
            class="absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-10"
            :class="isSent ? '-left-9' : '-right-9'">
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
import { computed, ref } from "vue";
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


const emit = defineEmits(["cancel-upload", "open-emoji", "open-actions", "scroll-to-message", "mounted"]);

// Custom Audio Player Logic
const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progress = ref(0);

const toggleAudio = () => {
  if (!audioRef.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
};

const onTimeUpdate = () => {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
  if (duration.value) {
    progress.value = (currentTime.value / duration.value) * 100;
  }
};

const onLoadedMetadata = () => {
  if (!audioRef.value) return;
  duration.value = audioRef.value.duration;
};

const onEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  progress.value = 0;
};

const seekAudio = (e: MouseEvent) => {
  if (!audioRef.value || !duration.value) return;
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = Math.min(Math.max(x / rect.width, 0), 1);

  audioRef.value.currentTime = percent * duration.value;
  progress.value = percent * 100;
};

// Update play status binding
// Note: <audio> play/pause events are better, but simplified toggle works for MVP.
// Let's add listeners to sync state precisely if external events pause it.
// e.g. audioRef.value.onplay = () => isPlaying.value = true;

const formatAudioTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};


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
  "bg-chat-bubble-received text-chat-text rounded-bl-none":
    !props.isSent,
  "bg-chat-bubble-sent text-white rounded-br-none": props.isSent,
}));

const tailClasses = computed(() => ({
  "left-0 -translate-x-2 text-chat-bubble-received": !props.isSent,
  "right-0 translate-x-2 text-chat-bubble-sent": props.isSent,
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
