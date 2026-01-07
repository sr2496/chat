<template>
    <div class="notification-settings p-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
            🔔 Notification Settings
        </h3>

        <!-- Sound Toggle -->
        <div class="setting-item">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">🔊</span>
                        <h4 class="font-semibold text-gray-900 dark:text-white">Notification Sound</h4>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">
                        Play sound for new messages
                    </p>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" v-model="preferences.notification_sound" @change="savePreferences">
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <!-- Browser Push Toggle -->
        <div class="setting-item">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">🔔</span>
                        <h4 class="font-semibold text-gray-900 dark:text-white">Browser Push Notifications</h4>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">
                        Receive alerts when app is closed
                    </p>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" v-model="pushEnabled" @change="togglePush" :disabled="!pushSupported">
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <!-- Message Preview Toggle -->
        <div class="setting-item">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">👁️</span>
                        <h4 class="font-semibold text-gray-900 dark:text-white">Message Preview</h4>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">
                        Show message content in notifications
                    </p>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" v-model="preferences.notification_preview" @change="savePreferences">
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <!-- Do Not Disturb -->
        <div class="setting-item dnd-section">
            <div class="flex items-center gap-2 mb-3">
                <span class="text-2xl">🌙</span>
                <h4 class="font-semibold text-gray-900 dark:text-white">Do Not Disturb</h4>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Mute all notifications for a specific duration
                </p>

                <div class="flex gap-2 mb-3">
                    <select v-model="selectedMuteDuration" @change="applyMute"
                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option :value="0">Unmute</option>
                        <option :value="30">30 minutes</option>
                        <option :value="60">1 hour</option>
                        <option :value="120">2 hours</option>
                        <option :value="240">4 hours</option>
                        <option :value="480">8 hours</option>
                        <option value="tomorrow">Until tomorrow (8 AM)</option>
                    </select>
                </div>

                <div v-if="isDNDActive" class="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clip-rule="evenodd" />
                    </svg>
                    <span>Muted until {{ formatMutedUntil }}</span>
                </div>
            </div>
        </div>

        <!-- Save Status -->
        <div v-if="saveStatus" class="mt-4 text-sm"
            :class="saveStatus.type === 'success' ? 'text-green-600' : 'text-red-600'">
            {{ saveStatus.message }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../../axios';
import { usePushNotifications } from '../../composables/usePushNotifications';

const preferences = ref({
    notification_sound: true,
    notification_preview: true,
    notification_muted_until: null as string | null,
});

const selectedMuteDuration = ref<number | string>(0);
const saveStatus = ref<{ type: string; message: string } | null>(null);

const { isSupported: pushSupported, subscribe, unsubscribe, checkSubscription } = usePushNotifications();
const pushEnabled = ref(false);

const isDNDActive = computed(() => {
    return preferences.value.notification_muted_until &&
        new Date(preferences.value.notification_muted_until) > new Date();
});

const formatMutedUntil = computed(() => {
    if (!preferences.value.notification_muted_until) return '';
    const date = new Date(preferences.value.notification_muted_until);
    return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
});

const loadPreferences = async () => {
    try {
        const response = await api.get('/notification-preferences');
        preferences.value = response.data.data;
    } catch (error) {
        console.error('Failed to load preferences:', error);
    }
};

const savePreferences = async () => {
    try {
        const response = await api.put('/notification-preferences', {
            notification_sound: preferences.value.notification_sound,
            notification_preview: preferences.value.notification_preview,
        });

        preferences.value = response.data.data;
        showSaveStatus('success', 'Preferences saved!');
    } catch (error) {
        console.error('Failed to save preferences:', error);
        showSaveStatus('error', 'Failed to save preferences');
    }
};

const applyMute = async () => {
    try {
        let duration = selectedMuteDuration.value;

        // Calculate "until tomorrow" (8 AM next day)
        if (duration === 'tomorrow') {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(8, 0, 0, 0);
            const diffMinutes = Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60));
            duration = diffMinutes;
        }

        const response = await api.put('/notification-preferences', {
            mute_duration: duration
        });

        preferences.value = response.data.data;

        if (typeof duration === 'number' && duration > 0) {
            showSaveStatus('success', 'Do Not Disturb enabled');
        } else {
            showSaveStatus('success', 'Do Not Disturb disabled');
        }
    } catch (error) {
        console.error('Failed to update DND:', error);
        showSaveStatus('error', 'Failed to update DND');
    }
};

const togglePush = async () => {
    try {
        if (pushEnabled.value) {
            await subscribe();
            showSaveStatus('success', 'Push notifications enabled');
        } else {
            await unsubscribe();
            showSaveStatus('success', 'Push notifications disabled');
        }
    } catch (error) {
        console.error('Failed to toggle push:', error);
        pushEnabled.value = !pushEnabled.value; // Revert
        showSaveStatus('error', 'Failed to update push settings');
    }
};

const showSaveStatus = (type: string, message: string) => {
    saveStatus.value = { type, message };
    setTimeout(() => {
        saveStatus.value = null;
    }, 3000);
};

onMounted(async () => {
    await loadPreferences();
    pushEnabled.value = await checkSubscription();
});
</script>

<style scoped>
.notification-settings {
    max-width: 600px;
}

.setting-item {
    padding: 1.25rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dark .setting-item {
    border-bottom-color: rgba(255, 255, 255, 0.1);
}

.setting-item:last-child {
    border-bottom: none;
}

.dnd-section {
    padding-top: 1.5rem;
}

/* Toggle Switch */
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 28px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 28px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

input:checked+.slider {
    background-color: #3b82f6;
}

input:disabled+.slider {
    opacity: 0.5;
    cursor: not-allowed;
}

input:checked+.slider:before {
    transform: translateX(22px);
}
</style>
