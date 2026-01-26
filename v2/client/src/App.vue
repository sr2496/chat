<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { requestNotificationPermission, registerPushSubscription } from './utils/pushManager'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.user) {
    try {
        if (Notification.permission === 'default') {
             // We can't request here without user interaction usually, but let's try or wait for user action
             // For now, let's just log or ignore.
        } else if (Notification.permission === 'granted') {
             await registerPushSubscription();
        }
    } catch (e) {
        console.error(e);
    }
  }
})
</script>

<template>
  <RouterView />
</template>
