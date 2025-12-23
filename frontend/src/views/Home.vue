<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
    <!-- Animated blobs -->
    <div class="absolute inset-0 opacity-30 pointer-events-none">
      <div
        class="absolute -top-40 -left-40 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob">
      </div>
      <div
        class="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000">
      </div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000">
      </div>
    </div>

    <!-- Header -->
    <header class="relative z-50 bg-white/90 backdrop-blur-md shadow-lg">
      <nav class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex justify-between items-center">
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-3">
            <svg class="w-9 h-9 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20" />
            </svg>
            <h1 class="text-2xl font-bold text-gray-900">Vue Chat</h1>
          </router-link>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-8">
            <router-link to="/features"
              class="text-gray-700 hover:text-indigo-600 font-medium transition">Features</router-link>
            <router-link to="/pricing"
              class="text-gray-700 hover:text-indigo-600 font-medium transition">Pricing</router-link>
            <router-link to="/about"
              class="text-gray-700 hover:text-indigo-600 font-medium transition">About</router-link>

            <!-- Authenticated User Menu -->
            <div v-if="isAuthenticated" class="flex items-center gap-6 ml-8 pl-8 border-l border-gray-300">
              <span class="text-gray-700 font-medium">Hi, {{ user?.name?.split(' ')[0] || 'User' }} 👋</span>
              <button @click="logout" class="text-red-600 hover:text-red-700 font-medium transition">
                Logout
              </button>
            </div>

            <!-- Guest Menu -->
            <div v-else class="flex items-center gap-4">
              <router-link to="/login"
                class="text-indigo-600 hover:text-indigo-800 font-medium transition">Login</router-link>
              <router-link to="/register"
                class="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition shadow-md">
                Get Started
              </router-link>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden text-gray-700 focus:outline-none">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                :d="mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'" />
            </svg>
          </button>
        </div>

        <!-- Mobile Menu -->
        <div v-if="mobileMenuOpen" class="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
          <div class="flex flex-col gap-4">
            <router-link to="/features"
              class="text-gray-700 hover:text-indigo-600 font-medium transition">Features</router-link>
            <router-link to="/pricing"
              class="text-gray-700 hover:text-indigo-600 font-medium transition">Pricing</router-link>
            <router-link to="/about"
              class="text-gray-700 hover:text-indigo-600 font-medium transition">About</router-link>

            <div v-if="isAuthenticated" class="pt-4 border-t border-gray-200">
              <p class="text-gray-700 font-medium mb-3">Hi, {{ user?.name?.split(' ')[0] || 'User' }} 👋</p>
              <button @click="logout" class="text-red-600 hover:text-red-700 font-medium transition">
                Logout
              </button>
            </div>

            <div v-else class="flex flex-col gap-3 pt-4 border-t border-gray-200">
              <router-link to="/login" class="text-indigo-600 hover:text-indigo-800 font-medium transition text-center">
                Login
              </router-link>
              <router-link to="/register"
                class="bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition shadow-md text-center">
                Get Started
              </router-link>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <!-- Hero Section -->
    <main class="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 text-center">
      <div class="max-w-4xl">
        <h2 class="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight"
          v-html="isAuthenticated ? `Welcome back, ${user?.name?.split(' ')[0]}!` : 'Real-time Chat,<br>Reimagined'">
        </h2>
        <p class="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
          {{ isAuthenticated
            ? 'Jump back into your conversations and connect instantly.'
            : 'Connect with friends instantly. Simple, fast, secure, and beautifully designed.' }}
        </p>

        <!-- CTA Buttons -->
        <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/login"
            class="bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition shadow-xl transform hover:scale-105">
            Sign In
          </router-link>
          <router-link to="/register"
            class="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-indigo-600 transition shadow-xl transform hover:scale-105">
            Create Account
          </router-link>
        </div>

        <router-link v-else to="/chat"
          class="inline-block bg-white text-indigo-600 px-10 py-5 rounded-full text-xl font-bold hover:bg-gray-100 transition shadow-2xl transform hover:scale-105">
          Go to Chat
        </router-link>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import { useUserStore } from '../stores/user'
import { api } from '../axios'

export default defineComponent({
  setup() {
    const userStore = useUserStore()
    const isAuthenticated = computed(() => userStore.isAuthenticated)
    const user = computed(() => userStore.user)
    const mobileMenuOpen = ref(false)

    const logout = async () => {
      try {
        await api.post('/logout')
      } catch (e) {
        console.error('Logout error:', e)
      } finally {
        userStore.leavePresenceChannel();
        userStore.clearUser()
        mobileMenuOpen.value = false
      }
    }

    return { isAuthenticated, user, logout, mobileMenuOpen }
  },
})
</script>

<style scoped>
@keyframes blob {

  0%,
  100% {
    transform: translate(0px, 0px) scale(1);
  }

  33% {
    transform: translate(30px, -50px) scale(1.1);
  }

  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.animate-blob {
  animation: blob 12s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
