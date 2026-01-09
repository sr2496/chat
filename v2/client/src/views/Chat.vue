<script setup>
import ChatLayout from '../components/Design/ChatLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
    if (!authStore.user) {
        router.push('/login')
    }
})
</script>

<template>
    <ChatLayout />
</template>
