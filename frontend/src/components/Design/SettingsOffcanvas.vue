<template>
  <transition name="slide-fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" @click="close">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 transition-opacity"></div>

      <!-- Offcanvas Panel -->
      <div @click.stop class="absolute right-0 top-0 h-full w-full max-w-sm bg-chat-surface shadow-2xl flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-chat-border">
          <h2 class="text-xl font-bold text-chat-text">Settings</h2>
          <button @click="close" class="p-2 rounded-lg hover:bg-chat-bg/50 text-chat-text-muted transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <!-- Profile Section -->
          <div class="space-y-4 mb-8">
            <h3 class="text-sm font-semibold text-chat-text-muted uppercase tracking-wider">
              Profile
            </h3>

            <!-- Avatar Upload -->
            <div class="flex flex-col items-center gap-4">
              <div @click="triggerAvatarUpload" class="relative group cursor-pointer">
                <div class="w-24 h-24 rounded-full bg-cover bg-center border-4 border-blue-500/20 shadow-lg"
                  :style="{ backgroundImage: `url(${avatarPreview || avatarUrl})` }">
                </div>
                <!-- Hover overlay -->
                <div
                  class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input ref="avatarInput" type="file" class="hidden" accept="image/*" @change="handleAvatarChange" />
              </div>
              <p class="text-xs text-chat-text-muted">Click to change avatar</p>
            </div>

            <!-- Name Input with Emoji Picker -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-chat-text">Name</label>
              <div class="relative" ref="emojiContainerRef">
                <input v-model="profileForm.name" type="text" placeholder="Your name"
                  class="w-full pl-4 pr-12 py-3 rounded-xl bg-chat-bg text-chat-text placeholder-chat-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow border border-chat-border"
                  :class="{ 'border-red-500 ring-2 ring-red-500/50': nameError }" maxlength="50" />
                <button @click="toggleEmojiPicker"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-chat-text-muted hover:text-blue-500 transition p-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <p v-if="nameError" class="text-xs text-red-500">{{ nameError }}</p>

              <!-- Emoji Picker Teleported -->
              <teleport to="body">
                <div v-if="showEmojiPicker"
                  class="fixed z-[9999] shadow-2xl rounded-2xl overflow-hidden border border-chat-border"
                  :style="emojiPickerStyle" ref="emojiPickerEl">
                  <EmojiPicker :native="true" @select="handleEmojiSelect" :theme="theme" />
                </div>
              </teleport>
            </div>

            <!-- Email (Read Only) -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-chat-text">Email</label>
              <div
                class="w-full px-4 py-3 rounded-xl bg-chat-bg/50 text-chat-text-muted border border-chat-border cursor-not-allowed">
                {{ userStore.user?.email }}
              </div>
            </div>

            <!-- Save Button -->
            <button @click="saveProfile" :disabled="!hasChanges || isSaving"
              class="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="hasChanges && !isSaving
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
              <svg v-if="isSaving" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
            </button>
          </div>

          <!-- Theme Section -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-chat-text-muted uppercase tracking-wider">
              Appearance
            </h3>

            <div class="space-y-3">
              <label class="text-sm font-medium text-chat-text">Theme</label>

              <!-- Theme Options -->
              <div class="grid grid-cols-2 gap-3">
                <!-- Light Theme -->
                <button @click="setTheme('light')" :class="[
                  'relative p-4 rounded-xl border-2 transition-all duration-200',
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50/70'
                    : 'border-chat-border hover:border-chat-border/70'
                ]">
                  <div class="flex flex-col items-center gap-2">
                    <div
                      class="w-12 h-12 rounded-lg bg-chat-surface border border-chat-border flex items-center justify-center shadow-sm">
                      <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clip-rule="evenodd" />
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-chat-text">Light</span>
                  </div>

                  <div v-if="theme === 'light'"
                    class="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                </button>

                <!-- Dark Theme -->
                <button @click="setTheme('dark')" :class="[
                  'relative p-4 rounded-xl border-2 transition-all duration-200',
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-950/30'
                    : 'border-chat-border hover:border-chat-border/70'
                ]">
                  <div class="flex flex-col items-center gap-2">
                    <div
                      class="w-12 h-12 rounded-lg bg-chat-bg border border-chat-border flex items-center justify-center shadow-sm">
                      <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-chat-text">Dark</span>
                  </div>

                  <div v-if="theme === 'dark'"
                    class="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Account Section -->
          <div class="space-y-4 mt-8">
            <h3 class="text-sm font-semibold text-chat-text-muted uppercase tracking-wider">
              Account
            </h3>
            <button @click="logout"
              class="w-full p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-2 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue';
import { useTheme } from '../../composables/useTheme';
import { useUserStore } from '../../stores/user';
import { useRouter } from 'vue-router';
import EmojiPicker from 'vue3-emoji-picker';
import { useEmojiPicker } from '../../composables/useEmojiPicker';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { theme, setTheme } = useTheme();
const userStore = useUserStore();
const router = useRouter();
const toaster = inject('toaster') as { value: any } | undefined;

// Profile Form State
const profileForm = ref({
  name: '',
  avatar: null as File | null
});
const avatarPreview = ref<string | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);
const isSaving = ref(false);
const nameError = ref('');

// Construct full avatar URL
const avatarUrl = computed(() => {
  if (!userStore.user?.avatar) return '/default-avatar.png';
  return userStore.user.avatar;
});

// Emoji Picker using composable
const emoji = useEmojiPicker({
  onSelectEmoji: (emoji: any) => {
    profileForm.value.name += emoji.i;
  }
});

const showEmojiPicker = emoji.showEmojiPicker;
const emojiContainerRef = emoji.emojiContainerRef;
const emojiPickerEl = emoji.emojiPickerEl;
const emojiPickerStyle = emoji.emojiPickerStyle;
const toggleEmojiPicker = emoji.toggleEmojiPicker;
const handleEmojiSelect = emoji.onSelectEmoji;

// Mark template-only refs as used for TypeScript
void (emojiContainerRef && emojiPickerEl);

// Initialize form with current user data
onMounted(() => {
  if (userStore.user) {
    profileForm.value.name = userStore.user.name || '';
  }
});

// Detect changes
const hasChanges = computed(() => {
  const nameChanged = profileForm.value.name !== (userStore.user?.name || '');
  const avatarChanged = profileForm.value.avatar !== null;
  return nameChanged || avatarChanged;
});

// Validate name
const validateName = () => {
  const name = profileForm.value.name.trim();
  if (name.length < 2) {
    nameError.value = 'Name must be at least 2 characters';
    return false;
  }
  if (name.length > 50) {
    nameError.value = 'Name must be less than 50 characters';
    return false;
  }
  nameError.value = '';
  return true;
};

// Avatar Upload
const triggerAvatarUpload = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toaster?.value?.show('Please select an image file', 'error');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toaster?.value?.show('Image must be less than 2MB', 'error');
      return;
    }

    profileForm.value.avatar = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};


// Save Profile
const saveProfile = async () => {
  if (!validateName()) return;

  isSaving.value = true;

  try {
    await userStore.updateProfile({
      name: profileForm.value.name.trim(),
      avatar: profileForm.value.avatar || undefined
    });

    // Reset avatar state
    profileForm.value.avatar = null;
    avatarPreview.value = null;

    // Success notification
    toaster?.value?.show('Profile updated successfully!', 'success');
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    toaster?.value?.show(error.response?.data?.message || 'Failed to update profile', 'error');
  } finally {
    isSaving.value = false;
  }
};

// Reset profile form to initial state
const resetProfileForm = () => {
  profileForm.value.name = userStore.user?.name || '';
  profileForm.value.avatar = null;
  avatarPreview.value = null;
  nameError.value = '';
  showEmojiPicker.value = false;
  if (avatarInput.value) {
    avatarInput.value.value = '';
  }
};

const close = () => {
  resetProfileForm();
  emit('close');
};

const logout = async () => {
  await userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>