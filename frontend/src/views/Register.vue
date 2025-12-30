<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden px-4">
    <!-- Animated background elements (consistent with Login) -->
    <div
      class="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] animate-pulse">
    </div>
    <div
      class="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[120px] animate-pulse"
      style="animation-delay: 2s"></div>

    <div class="w-full max-w-md z-10 py-8">
      <!-- Logo / Header -->
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto mb-4 -rotate-3 hover:rotate-0 transition-transform duration-300">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-4xl font-extrabold text-gray-800 tracking-tight mb-2">Create Account</h1>
        <p class="text-gray-600">Join our community and start chatting</p>
      </div>

      <form @submit.prevent="register"
        class="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 space-y-5">

        <!-- Name Field -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2 px-1">Full Name</label>
          <div class="relative group">
            <input v-model="name" type="text" placeholder="John Doe"
              class="w-full h-12 px-4 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 group-hover:border-gray-300" />
          </div>
          <p v-if="errors.name" class="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1 px-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd" />
            </svg>
            {{ errors.name }}
          </p>
        </div>

        <!-- Email Field -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2 px-1">Email Address</label>
          <div class="relative group">
            <input v-model="email" type="email" placeholder="name@example.com"
              class="w-full h-12 px-4 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 group-hover:border-gray-300" />
          </div>
          <p v-if="errors.email" class="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1 px-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd" />
            </svg>
            {{ errors.email }}
          </p>
        </div>

        <!-- Password Field -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2 px-1">Password</label>
          <div class="relative group">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
              class="w-full h-12 px-4 pr-12 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 group-hover:border-gray-300" />

            <button type="button" @click="togglePassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
              tabindex="-1">
              <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" class="h-4 w-4" />
            </button>
          </div>
          <p v-if="errors.password" class="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1 px-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd" />
            </svg>
            {{ errors.password }}
          </p>
        </div>

        <button type="submit"
          class="w-full h-12 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
          <span>Create Account</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <p class="text-center text-sm text-gray-600 pt-2">
          Already have an account?
          <router-link to="/login"
            class="font-bold text-indigo-600 hover:text-indigo-700 transition ml-1 decoration-2 underline-offset-4 hover:underline">
            Sign In
          </router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, inject, nextTick } from 'vue';
import { api, csrf } from '../axios';
import router from '../router';

import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default defineComponent({
  setup() {
    const name = ref('');
    const email = ref('');
    const password = ref('');
    const showPassword = ref(false);
    const errors = reactive({
      name: '',
      email: '',
      password: ''
    })

    const toaster = inject('toaster') as { value: any } | undefined;


    const validate = () => {
      errors.name = '';
      errors.email = '';
      errors.password = '';

      let valid = true;

      if (!name.value.trim()) {
        errors.name = 'Name is required';
        valid = false;
      }

      if (!email.value) {
        errors.email = 'Email is required';
        valid = false;
      } else if (!/\S+@\S+\.\S+/.test(email.value)) {
        errors.email = 'Email format is invalid';
        valid = false;
      }

      if (!password.value) {
        errors.password = 'Password is required';
        valid = false;
      } else if (password.value.length < 6) {
        errors.password = 'Password must be at least 6 characters';
        valid = false;
      }

      return valid;
    }

    const register = async () => {
      if (!validate()) return;

      NProgress.start()

      try {

        await csrf.get('/sanctum/csrf-cookie');

        await api.post('/register', {
          name: name.value,
          email: email.value,
          password: password.value
        });

        await nextTick();
        toaster?.value?.show('Registration successful!', 'success');

        router.push('/login');
      } catch (err: any) {
        if (err.response?.data?.errors) {
          const serverError = err.response.data.errors;
          errors.name = serverError.name?.[0] || '';
          errors.email = serverError.email?.[0] || '';
          errors.password = serverError.password?.[0] || '';
        } else {
          errors.password = err.response?.data?.message || 'Registration failed';
        }
      } finally {
        NProgress.done();
      }
    };

    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    }

    return {
      name,
      email,
      password,
      errors,
      register,
      togglePassword,
      showPassword,
    };
  }
});
</script>
