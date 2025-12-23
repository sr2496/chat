<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
    <form @submit.prevent="login"
      class="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">
      <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Welcome Back</h1>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input v-model="email" type="email" placeholder="you@example.com"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
        <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
      </div>

      <div class="mb-8">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>

        <div class="relative">
          <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-indigo-500
             focus:border-transparent transition" />

          <!-- Show / Hide Button -->
          <button type="button" @click="togglePassword" class="absolute inset-y-0 right-3 flex items-center text-gray-500
         hover:text-gray-700 focus:outline-none" tabindex="-1">
            <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" class="h-5 w-5" />
          </button>
        </div>

        <p v-if="errors.password" class="mt-2 text-sm text-red-600">
          {{ errors.password }}
        </p>
      </div>


      <button type="submit"
        class="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-md">
        Login
      </button>

      <p class="mt-6 text-center text-sm text-gray-600">
        Don't have an account?
        <router-link to="/register" class="font-medium text-indigo-600 hover:text-indigo-500 transition">
          Register
        </router-link>
      </p>
    </form>
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