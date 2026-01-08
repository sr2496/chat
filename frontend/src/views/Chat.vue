<template>
  <ChatLayout />
  <PushPermissionBanner ref="permissionBanner" @enabled="onPushEnabled" />
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, watch, computed, ref } from "vue";
import ChatLayout from "../components/Design/ChatLayout.vue";
import PushPermissionBanner from "../components/Design/PushPermissionBanner.vue";
import { useChatStore } from "../stores/chat";
import { useUserStore } from "../stores/user";
import { registerServiceWorker } from "../utils/serviceWorker";
import { usePushNotifications } from "../composables/usePushNotifications";

export default defineComponent({
  components: { ChatLayout, PushPermissionBanner },
  setup() {
    const chatStore = useChatStore();
    const userStore = useUserStore();
    const permissionBanner = ref<InstanceType<typeof PushPermissionBanner> | null>(null);
    const { isSupported, checkSubscription, subscribe } = usePushNotifications();

    // Calculate count of conversations with unread messages
    const unreadConversationsCount = computed(() => {
      return chatStore.conversations.filter((conv) => (conv.unread_count || 0) > 0).length;
    });

    // Update document title with unread count
    watch(unreadConversationsCount, (count) => {
      if (count > 0) {
        document.title = `(${count}) ChatApp`;
      } else {
        document.title = 'ChatApp';
      }
    }, { immediate: true });



    // Handle service worker messages (navigation from push notification click)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_CONVERSATION') {
        const conversationId = event.data.conversationId;
        if (conversationId) {
          chatStore.setActiveConversation(conversationId);
        }
      }
    };

    const onPushEnabled = () => {
      console.log('Push notifications enabled successfully');
    };

    onMounted(async () => {
      // window.addEventListener('focus', handleFocus);

      // Register service worker
      await registerServiceWorker();

      // Check if push notifications are supported
      if (isSupported.value) {
        const isSubscribed = await checkSubscription();

        if (isSubscribed) {
          console.log('Already subscribed to push notifications');
        } else {
          // Check if user previously declined
          const declined = localStorage.getItem('push-notifications-declined');

          if (!declined && Notification.permission === 'default') {
            // Show permission banner after 10 seconds
            setTimeout(() => {
              permissionBanner.value?.show();
            }, 10000);
          } else if (Notification.permission === 'granted') {
            // Permission granted but not subscribed - subscribe now
            await subscribe();
          }
        }
      }

      // Listen for service worker messages
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      }

      // Initialize listeners
      chatStore.initUserListener();
    });

    onUnmounted(() => {
      chatStore.stopAllListeners();
      userStore.leavePresenceChannel();
      // window.removeEventListener('focus', handleFocus);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }

      document.title = 'ChatApp'; // Reset on unmount
    });

    return {
      permissionBanner,
      onPushEnabled,
    };
  },
});
</script>