<template>
  <ChatLayout />
</template>

<script lang="ts">
import { defineComponent, onUnmounted } from "vue";
import ChatLayout from "../components/Design/ChatLayout.vue";
import { useChatStore } from "../stores/chat";
import { useUserStore } from "../stores/user";

export default defineComponent({
  components: { ChatLayout },
  setup() {
    const chatStore = useChatStore();
    const userStore = useUserStore();

    // Initialize listeners
    chatStore.initUserListener();

    onUnmounted(() => {
      chatStore.stopAllListeners();
      userStore.leavePresenceChannel();
    });

    return {};
  },
});
</script>