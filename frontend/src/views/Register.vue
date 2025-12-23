<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
    <form @submit.prevent="register"
      class="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">

      <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Create Account</h1>

      <!-- Name Field -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input v-model="name" type="text" placeholder="John Doe"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
        <p v-if="errors.name" class="mt-2 text-sm text-red-600">{{ errors.name }}</p>
      </div>

      <!-- Email Field -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input v-model="email" type="email" placeholder="you@example.com"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
        <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
      </div>

      <!-- Password Field -->
      <div class="mb-8">
        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <div class="relative">
          <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
            class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />

          <!-- Password Toggle -->
          <button type="button" @click="togglePassword"
            class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            tabindex="-1">
            <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" class="h-5 w-5" />
          </button>
        </div>
        <p v-if="errors.password" class="mt-2 text-sm text-red-600">{{ errors.password }}</p>
      </div>

      <!-- Submit Button -->
      <button type="submit"
        class="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-md">
        Register
      </button>

      <!-- Login Link -->
      <p class="mt-6 text-center text-sm text-gray-600">
        Already have an account?
        <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500 transition">
          Login
        </router-link>
      </p>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, inject, nextTick } from 'vue';
import { api, csrf } from '../axios';
import router from '../router';
import { useUserStore } from '../stores/user';
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
    const userStore = useUserStore();

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

        const response = await api.post('/register', {
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
