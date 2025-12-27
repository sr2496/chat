<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900 selection:bg-indigo-200">
    <!-- Animated background elements (consistent with Auth pages) -->
    <div class="fixed inset-0 pointer-events-none">
      <div
        class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/15 rounded-full blur-[120px] animate-pulse">
      </div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/15 rounded-full blur-[120px] animate-pulse"
        style="animation-delay: 2s"></div>
    </div>

    <!-- Sticky Glass Header -->
    <header
      class="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 mx-4 mt-4 rounded-2xl shadow-lg">
      <nav class="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center text-sm">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 group">
          <div
            class="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span class="text-lg font-bold tracking-tight text-gray-800 uppercase italic">Vue Chat <span
              class="text-indigo-600 font-extrabold not-italic">Pro</span></span>
        </router-link>

        <!-- Navigation links -->
        <div class="hidden md:flex items-center gap-8 font-medium text-gray-600">
          <a href="#features" class="hover:text-gray-900 transition-colors cursor-pointer">Features</a>
          <a href="#how-it-works" class="hover:text-gray-900 transition-colors cursor-pointer">How it works</a>
          <router-link to="/about" class="hover:text-gray-900 transition-colors">About</router-link>
        </div>

        <!-- CTA / User Menu -->
        <div class="flex items-center gap-4">
          <!-- Authenticated -->
          <template v-if="isAuthenticated">
            <span class="hidden sm:inline text-gray-600">
              Hi,
              <span class="text-gray-900 font-bold">
                {{ user?.name?.split(' ')[0] }}
              </span>
            </span>

            <router-link to="/chat"
              class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-white transition-all transform hover:scale-105 shadow-lg shadow-indigo-600/20">
              Open Chat
            </router-link>

            <button @click="logout" class="p-2 text-gray-500 hover:text-rose-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </template>

          <!-- Guest -->
          <template v-else>
            <router-link to="/login" class="text-gray-600 hover:text-gray-900 transition-colors font-semibold">
              Sign In
            </router-link>

            <router-link to="/register"
              class="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
              Get Started
            </router-link>
          </template>
        </div>


      </nav>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-40 pb-20 px-6">
      <div class="max-w-5xl mx-auto text-center">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8 animate-bounce">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          New: Voice Message Recording & Emoji Picker
        </div>
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Experience the <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Next
            Evolution</span> of Real-time Chat
        </h1>
        <p class="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Connect, collaborate, and share with a lightning-fast interface. Built with modern technology for an unmatched
          user experience.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <router-link :to="isAuthenticated ? '/chat' : '/register'"
            class="w-full sm:w-auto px-8 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-lg font-bold shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-transform">
            {{ isAuthenticated ? 'Start Chatting Now' : 'Join Vue Chat Free' }}
          </router-link>
          <a href="#features"
            class="w-full sm:w-auto px-8 h-14 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center text-lg font-bold hover:bg-slate-800 transition-colors">
            See Features
          </a>
        </div>
      </div>
    </section>

    <!-- App Preview Mockup -->
    <section class="px-6 py-10">
      <div class="max-w-6xl mx-auto">
        <div
          class="relative p-2 bg-slate-800/30 border border-white/10 rounded-3xl shadow-3xl backdrop-blur-sm overflow-hidden group">
          <div class="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center">
            <div class="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 z-10"></div>
            <!-- Mock UI elements -->
            <div class="relative z-20 flex flex-col items-center gap-6">
              <div
                class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-lg border border-white/10 group-hover:scale-110 transition-transform cursor-pointer">
                <svg class="w-10 h-10 text-white fill-white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div class="text-slate-500 font-medium">Watch Demo Video</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 px-6 relative">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p class="text-slate-400 max-w-xl mx-auto">Everything you need for seamless communication, designed with
            precision.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Real-time -->
          <div
            class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 hover:border-indigo-500/30 transition-colors group">
            <div
              class="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3">Instant Messaging</h3>
            <p class="text-slate-400 leading-relaxed text-sm">Experience lightning-fast delivery with our optimized
              backend.
              No more waiting for messages.</p>
          </div>

          <!-- Voice Messages -->
          <div
            class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 hover:border-purple-500/30 transition-colors group">
            <div
              class="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3">Voice Notes</h3>
            <p class="text-slate-400 leading-relaxed text-sm">Sometimes text isn't enough. Record and send high-quality
              voice messages instantly.</p>
          </div>

          <!-- Emoji & Rich Media -->
          <div
            class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 hover:border-pink-500/30 transition-colors group">
            <div
              class="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3">Emoji & Media</h3>
            <p class="text-slate-400 leading-relaxed text-sm">Integrated emoji picker and seamless file sharing for
              photos,
              videos, and documents.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it Works section -->
    <section id="how-it-works" class="py-24 px-6 bg-slate-900/30">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p class="text-slate-400">Three simple steps to start connecting.</p>
        </div>

        <div class="flex flex-col lg:flex-row gap-12 items-center">
          <div class="flex-1 space-y-12">
            <div class="flex gap-6">
              <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 font-bold">1
              </div>
              <div>
                <h4 class="text-xl font-bold mb-2">Create an account</h4>
                <p class="text-slate-400">Sign up in seconds with just your email. No complex forms.</p>
              </div>
            </div>
            <div class="flex gap-6">
              <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 font-bold">2
              </div>
              <div>
                <h4 class="text-xl font-bold mb-2">Join or Start a Conversation</h4>
                <p class="text-slate-400">Search for your friends or create a new group chat instantly.</p>
              </div>
            </div>
            <div class="flex gap-6">
              <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 font-bold">3
              </div>
              <div>
                <h4 class="text-xl font-bold mb-2">Connect in Real-time</h4>
                <p class="text-slate-400">Start chatting, sending voice notes, and sharing life's moments.</p>
              </div>
            </div>
          </div>
          <div class="flex-1 w-full flex justify-center">
            <!-- Simple animated graphic or placeholder -->
            <div
              class="w-full max-w-sm aspect-square bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-[60px] relative flex items-center justify-center">
              <div class="absolute inset-0 flex items-center justify-center">
                <div
                  class="w-32 h-32 bg-indigo-600 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl animate-bounce">
                  <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-20 px-6 border-t border-gray-200 bg-gray-50">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div class="col-span-1 md:col-span-1">
          <router-link to="/" class="flex items-center gap-3 mb-6">
            <div
              class="w-7 h-7 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span class="text-lg font-bold tracking-tight text-white uppercase italic">Vue Chat <span
                class="text-indigo-500 font-extrabold not-italic">Pro</span></span>
          </router-link>
          <p class="text-gray-500 text-sm italic">Making real-time communication beautiful and simple for everyone.</p>
        </div>
        <div class="space-y-4">
          <h5 class="font-bold text-sm uppercase tracking-widest text-gray-700">Product</h5>
          <ul class="text-gray-600 text-sm space-y-2">
            <li><a href="#" class="hover:text-gray-900 transition-colors">Features</a></li>
            <li><a href="#" class="hover:text-gray-900 transition-colors">Pricing</a></li>
            <li><a href="#" class="hover:text-gray-900 transition-colors">API Docs</a></li>
          </ul>
        </div>
        <div class="space-y-4">
          <h5 class="font-bold text-sm uppercase tracking-widest text-gray-700">Company</h5>
          <ul class="text-gray-600 text-sm space-y-2">
            <li><a href="#" class="hover:text-gray-900 transition-colors">About Us</a></li>
            <li><a href="#" class="hover:text-gray-900 transition-colors">Blog</a></li>
            <li><a href="#" class="hover:text-gray-900 transition-colors">Careers</a></li>
          </ul>
        </div>
        <div class="space-y-4">
          <h5 class="font-bold text-sm uppercase tracking-widest text-slate-300">Stay Connected</h5>
          <div class="flex gap-4">
            <a href="#"
              class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
            <a href="#"
              class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div
        class="max-w-7xl mx-auto pt-10 mt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs tracking-widest uppercase font-bold text-slate-600">
        <p>&copy; 2025 Vue Chat Pro. All rights reserved.</p>
        <div class="flex gap-6">
          <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
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

html {
  scroll-behavior: smooth;
}
</style>
