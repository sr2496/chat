<template>
  <div
    :ref="el => setMessageRef(msg?.id, el)"
    :data-day="getMessageDay(msg?.created_at)"
    class="flex message-row py-2 group/row relative"
    :class="{ 'justify-end': isSent }"
  >
    <!-- Received Message -->
    <div v-if="!isSent" class="flex gap-3">
      <div class="max-w-[80%] sm:max-w-[65%]"> <!-- Better responsive max width -->
        <div class="relative">
          <div
            class="received-bubble bg-white dark:bg-slate-800 rounded-2xl shadow-sm px-4 py-2 flex flex-col min-w-fit"
          >
            <!-- Message Content -->
            <MessageContent :msg="msg" @openImage="openImage" />

            <!-- Time -->
            <div class="flex justify-end mt-1">
              <span class="text-[11px] opacity-60 whitespace-nowrap">
                {{ formatTime(msg?.created_at) }}
              </span>
            </div>
          </div>

          <!-- Reactions -->
          <ReactionsRow :reactions="groupedReactions(msg?.reactions)" />
          <ReactionButton @click="openReaction(msg)" side="right" />
        </div>
      </div>
    </div>

    <!-- Sent Message -->
    <div v-else class="flex justify-end">
      <div class="max-w-[80%] sm:max-w-[65%]">
        <div class="relative">
          <div
            class="sent-bubble bg-blue-500 text-white rounded-2xl shadow-sm px-4 py-2 flex flex-col min-w-fit"
          >
            <MessageContent :msg="msg" @openImage="openImage" />

            <!-- Time + Read Receipt -->
            <div class="flex justify-end items-center gap-1 mt-1">
              <span class="text-[11px] opacity-60">{{ formatTime(msg?.created_at) }}</span>
              <span
                class="text-[11px]"
                :class="msg?.read_by_count > 0 ? 'text-white' : 'text-white/60'"
              >
                {{ msg?.read_by_count > 0 ? '✓✓' : '✓' }}
              </span>
            </div>
          </div>

          <ReactionsRow :key="msg?.id" :reactions="groupedReactions(msg?.reactions)" />
          <ReactionButton :key="msg?.id" @click="openReaction(msg)" side="left" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MessageContent from './MessageContent.vue';
import ReactionsRow from './ReactionsRow.vue';
import ReactionButton from './ReactionButton.vue';
import { useUserStore } from '../../stores/user';
export default defineComponent({
    components: { MessageContent, ReactionsRow, ReactionButton },
    props: {
        msg: Object,
        isSent: Boolean,
        setMessageRef: Function,
        getMessageDay: Function
    },
    emits: ['openImage', 'openReaction'],
    setup(_, { emit }) {

        const userStore = useUserStore();
        const currentUserId = computed(() => userStore.user?.id);

        const openImage = (path: string) => {
            emit('openImage', path);
        }

        const openReaction = (msg: any) => {
            emit('openReaction', msg);
        }

        const formatTime = (timestamp?: string) => {
            if (!timestamp) return "Just now";

            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return "";

            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        };

        const groupedReactions = (reactions: Record<string, number[]> | undefined) => {
            if (!reactions || Object.keys(reactions).length === 0) return [];

            const currentUserIdVal = currentUserId.value;

            return Object.entries(reactions)
                .map(([emoji, userIds]) => ({
                    emoji,
                    count: userIds.length,
                    isReactedByMe: currentUserIdVal ? userIds.includes(currentUserIdVal) : false,
                }))
                .sort((a, b) => b.count - a.count);
        };

        return {
            openImage,
            openReaction,
            formatTime,
            groupedReactions
        };
    }
});
</script>
