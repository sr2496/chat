<template>
  <TooltipProvider :delay-duration="300">
    <div class="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <router-view />
      <Toaster ref="toasterRef" />
      <ConfirmDialog />
    </div>
  </TooltipProvider>
</template>

<script lang="ts">
import { defineComponent, ref, provide, onMounted } from 'vue'
import { useUserStore } from './stores/user'
import * as chatApi from './services/chatApi'
import Toaster from './components/Toaster.vue'
import ConfirmDialog from './components/Design/ConfirmDialog.vue'
import { TooltipProvider } from './components/ui/tooltip'

export default defineComponent({
  components: { Toaster, ConfirmDialog, TooltipProvider },

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
        const user = await chatApi.fetchCurrentUser()
        userStore.setUser(user)
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
  overflow: auto;
}

button:not(:disabled) {
  cursor: pointer;
}
</style>