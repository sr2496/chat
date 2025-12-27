<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden px-4">
    <!-- Animated background elements -->
    <div
      class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] animate-pulse">
    </div>
    <div
      class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[120px] animate-pulse"
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
        <h1 class="text-4xl font-extrabold text-gray-800 tracking-tight mb-2">Welcome Back</h1>
        <p class="text-gray-600">Please enter your details to sign in</p>
      </div>

      <form @submit.prevent="login"
        class="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 space-y-6">

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

        <div>
          <div class="flex items-center justify-between mb-2 px-1">
            <label class="block text-sm font-semibold text-gray-700">Password</label>
            <a href="#" class="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition">Forgot?</a>
          </div>
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
          <span>Sign In</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <div class="relative py-2">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase"><span
              class="bg-white border border-gray-200 px-4 py-1 rounded-full text-gray-500 font-semibold tracking-wider">Or
              continue with</span></div>
        </div>

        <div class="flex gap-4">
          <button type="button"
            class="flex-1 h-11 flex items-center justify-center bg-white/50 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <span class="text-sm font-semibold text-gray-700">Google</span>
          </button>
          <button type="button"
            class="flex-1 h-11 flex items-center justify-center bg-white/50 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <span class="text-sm font-semibold text-gray-700">GitHub</span>
          </button>
        </div>

        <p class="text-center text-sm text-gray-600 pt-2">
          New here?
          <router-link to="/register"
            class="font-bold text-indigo-600 hover:text-indigo-700 transition ml-1 decoration-2 underline-offset-4 hover:underline">
            Create an account
          </router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, inject, nextTick } from 'vue';
import { api, csrf } from '../axios';
import router from '../router';
import { useUserStore } from '../stores/user';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default defineComponent({
  setup() {
    const email = ref('');
    const password = ref('');
    const showPassword = ref(false);

    const errors = reactive({
      email: '',
      password: '',
    });

    const toaster = inject('toaster') as { value: any } | undefined;
    const userStore = useUserStore();

    const validate = () => {
      errors.email = '';
      errors.password = '';

      let valid = true;

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
      }

      return valid;
    };

    const login = async () => {
      if (!validate()) return;

      NProgress.start();

      try {

        await csrf.get('/sanctum/csrf-cookie');

        const response = await api.post('/login', {
          email: email.value,
          password: password.value
        });

        userStore.setUser(response.data.user);

        await nextTick();
        toaster?.value?.show('Login successful!', 'success');

        router.push('/');
      } catch (err: any) {
        errors.password = err.response?.data?.message || 'Invalid email or password';
      } finally {
        NProgress.done();
      }
    };

    const togglePassword = () => {
      showPassword.value = !showPassword.value
    }



    return { email, password, errors, login, toaster, togglePassword, showPassword };
  },
});
</script>