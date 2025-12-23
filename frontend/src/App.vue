<template>
  <div class="min-h-screen bg-gray-100">
    <router-view />
    <Toaster ref="toasterRef" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, provide, onMounted } from 'vue'
import { api } from './axios'
import { useUserStore } from './stores/user'
import Toaster from './components/Toaster.vue'

export default defineComponent({
  components: { Toaster },

  setup() {
    /* -----------------------------
       Global Toaster
    ------------------------------ */
    const toasterRef = ref<InstanceType<typeof Toaster> | null>(null)

    // PROVIDE toaster globally
    provide('toaster', toasterRef)

    /* -----------------------------
       Restore auth on reload
    ------------------------------ */
    const userStore = useUserStore()

    userStore.isLoading = true;

    onMounted(async () => {
      try {
        const res = await api.get('/user') // Sanctum session check

        userStore.setUser(res.data)
      } catch {
        userStore.clearUser()
      }
    })

    return {
      toasterRef,
    }
  },
})
</script>
<style>
html,
body,
#app {
  height: 100%;
  overflow: hidden;
}

button:not(:disabled) {
  cursor: pointer;
}
</style>