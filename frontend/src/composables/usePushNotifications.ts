import { ref, computed } from 'vue';
import { api } from '../axios';
import { getServiceWorkerRegistration } from '../utils/serviceWorker';

export function usePushNotifications() {
  const permission = ref<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const isSubscribed = ref(false);
  const isLoading = ref(false);

  const isSupported = computed(() => {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  });

  /**
   * Request notification permission from user
   */
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported.value) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      permission.value = result;
      return result === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  /**
   * Subscribe to push notifications
   */
  const subscribe = async (): Promise<boolean> => {
    if (!isSupported.value || permission.value !== 'granted') {
      return false;
    }

    isLoading.value = true;

    try {
      // Get service worker registration
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        throw new Error('Service worker not registered');
      }

      // Get VAPID public key from backend
      const { data } = await api.get('/push/public-key');
      const publicKey = data.publicKey;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to backend
      await api.post('/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
      });

      isSubscribed.value = true;
      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported.value) {
      return false;
    }

    isLoading.value = true;

    try {
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        isSubscribed.value = false;
        return true;
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from backend
      await api.post('/push/unsubscribe', {
        endpoint: subscription.endpoint,
      });

      isSubscribed.value = false;
      return true;
    } catch (error) {
      console.error('Push unsubscribe failed:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Check if already subscribed
   */
  const checkSubscription = async (): Promise<boolean> => {
    console.log(permission.value);
    
    if (!isSupported.value || permission.value !== 'granted') {
      return false;
    }

    try {
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      isSubscribed.value = !!subscription;
      return isSubscribed.value;
    } catch (error) {
      console.error('Check subscription failed:', error);
      return false;
    }
  };

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

/**
 * Helper: Convert URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Helper: Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
