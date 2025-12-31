import { ref } from 'vue';

interface NotificationSoundOptions {
  volume?: number;
  throttleMs?: number;
}

export function useNotificationSound(options: NotificationSoundOptions = {}) {
  const { volume = 0.5, throttleMs = 1000 } = options;
  
  const audio = ref<HTMLAudioElement | null>(null);
  const lastPlayedAt = ref<number>(0);
  const enabled = ref(true);

  // Initialize audio element
  const initAudio = () => {
    if (!audio.value) {
      audio.value = new Audio('/notification.mp3');
      audio.value.volume = volume;
    }
  };

  const play = () => {
    if (!enabled.value) return;

    // Throttle to prevent sound spam
    const now = Date.now();
    if (now - lastPlayedAt.value < throttleMs) {
      return;
    }

    initAudio();
    
    if (audio.value) {
      audio.value.currentTime = 0; // Reset to start
      audio.value.play().catch(err => {
        console.warn('Failed to play notification sound:', err);
      });
      lastPlayedAt.value = now;
    }
  };

  const setVolume = (newVolume: number) => {
    if (audio.value) {
      audio.value.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  const setEnabled = (isEnabled: boolean) => {
    enabled.value = isEnabled;
  };

  return {
    play,
    setVolume,
    setEnabled,
    enabled,
  };
}
