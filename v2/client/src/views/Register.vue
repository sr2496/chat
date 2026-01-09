<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, RouterLink } from 'vue-router'

const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errors = ref({})
const isLoading = ref(false)
const authStore = useAuthStore()
const router = useRouter()

const validate = () => {
    errors.value = {}
    let isValid = true
    if (!name.value) {
        errors.value.name = 'Name is required'
        isValid = false
    }
    if (!email.value) {
        errors.value.email = 'Email is required'
        isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email.value)) {
        errors.value.email = 'Invalid email format'
        isValid = false
    }
    if (!password.value) {
        errors.value.password = 'Password is required'
        isValid = false
    } else if (password.value.length < 6) {
        errors.value.password = 'Password must be at least 6 characters'
        isValid = false
    }
    return isValid
}

const handleRegister = async () => {
    if (!validate()) return

    isLoading.value = true
    const result = await authStore.register(name.value, email.value, password.value)
    if (result.success) {
        router.push('/')
    } else {
        errors.value.general = result.message
        isLoading.value = false
    }
}
</script>

<template>
    <div
        class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden px-4">
        <!-- Animated background elements -->
        <div
            class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] animate-pulse">
        </div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[120px] animate-pulse"
            style="animation-delay: 2s"></div>

        <div class="w-full max-w-md z-10">
            <!-- Logo / Header -->
            <div class="text-center mb-8">
                <div
                    class="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                <h1 class="text-4xl font-extrabold text-gray-800 tracking-tight mb-2">Create Account</h1>
                <p class="text-gray-600">Join us and start chatting today</p>
            </div>

            <form @submit.prevent="handleRegister"
                class="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 space-y-6">

                <!-- General Error -->
                <div v-if="errors.general"
                    class="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm text-center font-medium">
                    {{ errors.general }}
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2 px-1">Full Name</label>
                    <div class="relative group">
                        <input v-model="name" type="text" placeholder="John Doe"
                            class="w-full h-12 px-4 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 group-hover:border-gray-300"
                            :class="{ 'border-red-500': errors.name }" />
                    </div>
                    <p v-if="errors.name" class="text-xs text-red-500 mt-1 ml-1">{{ errors.name }}</p>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2 px-1">Email Address</label>
                    <div class="relative group">
                        <input v-model="email" type="email" placeholder="name@example.com"
                            class="w-full h-12 px-4 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 group-hover:border-gray-300"
                            :class="{ 'border-red-500': errors.email }" />
                    </div>
                    <p v-if="errors.email" class="text-xs text-red-500 mt-1 ml-1">{{ errors.email }}</p>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2 px-1">Password</label>
                    <div class="relative group">
                        <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                            class="w-full h-12 px-4 pr-12 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 group-hover:border-gray-300"
                            :class="{ 'border-red-500': errors.password }" />

                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                            tabindex="-1">
                            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                        </button>
                    </div>
                    <p v-if="errors.password" class="text-xs text-red-500 mt-1 ml-1">{{ errors.password }}</p>
                </div>

                <button type="submit" :disabled="isLoading"
                    class="w-full h-12 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    <span v-if="!isLoading">Register</span>
                    <svg v-if="!isLoading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <svg v-else class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                        fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                </button>

                <p class="text-center text-sm text-gray-600 pt-2">
                    Already have an account?
                    <RouterLink to="/login"
                        class="font-bold text-indigo-600 hover:text-indigo-700 transition ml-1 decoration-2 underline-offset-4 hover:underline">
                        Sign In
                    </RouterLink>
                </p>
            </form>
        </div>
    </div>
</template>
