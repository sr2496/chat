<template>
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
        <!-- Desktop Sidebar: Always visible -->
        <div class="hidden sm:flex w-full sm:w-96 lg:w-[420px] border-r border-chat-border flex-col bg-chat-surface">
            <ChatList />
        </div>

        <!-- Main Chat Area -->
        <div class="flex-1 flex flex-col h-full relative">
            <!-- Desktop: No transition, instant view switch -->
            <div v-if="!isMobile" class="flex flex-col h-full">
                <!-- Empty State -->
                <div v-if="!chatStore.activeConversationId" class="flex-1 flex items-center justify-center bg-chat-bg">
                    <div class="text-center max-w-md px-8">
                        <div class="w-64 h-64 mx-auto mb-10 opacity-30">
                            <svg class="w-full h-full text-gray-400 dark:text-gray-600" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 class="text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Your Messages</h3>
                        <p class="text-lg text-gray-500 dark:text-gray-400">Select a conversation from the list to start
                            chatting
                        </p>
                    </div>
                </div>

                <!-- Chat Window on Desktop -->
                <div v-else class="flex flex-col h-full bg-[var(--chat-window-bg)]">
                    <ChatWindow :conversationId="chatStore.activeConversationId" @start-call="handleStartCall" />
                </div>
            </div>

            <!-- Mobile: With smooth slide transition -->
            <transition v-else mode="out-in" enter-active-class="transition ease-out duration-300"
                enter-from-class="translate-x-full" enter-to-class="translate-x-0"
                leave-active-class="transition ease-in duration-200" leave-from-class="translate-x-0"
                leave-to-class="translate-x-full">
                <!-- Chat View on Mobile -->
                <div v-if="chatStore.activeConversationId" key="chat"
                    class="flex flex-col h-full bg-[var(--chat-window-bg)]">


                    <ChatWindow :conversationId="chatStore.activeConversationId" @start-call="handleStartCall" />
                </div>

                <!-- Chat List on Mobile (when no conversation) -->
                <div v-else key="list" class="flex flex-col h-full bg-white dark:bg-gray-900">
                    <ChatList />
                </div>
            </transition>
        </div>

        <!-- Notification Toast -->
        <NotificationToast ref="notificationToast" @click="chatStore.setActiveConversation($event)" />

        <!-- Global Video Call Modal -->
        <VideoCallModal :is-visible="isVideoModalVisible" :local-stream="localStream" :remote-stream="remoteStream"
            :is-incoming="!!incomingCall" :caller-name="currentPeerUser?.name" :caller-avatar="currentPeerUser?.avatar"
            :connection-state="connectionState" @accept="onAcceptCall" @reject="onEndCallFull" @end="onEndCallFull" />
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from "vue";
import { useChatStore } from "../../stores/chat";
import ChatList from "./ChatList.vue";
import ChatWindow from "./ChatWindow.vue";
import { useUserStore } from "../../stores/user";
import NotificationToast, { type Notification } from "./NotificationToast.vue";
import { useNotificationSound } from "../../composables/useNotificationSound";
import VideoCallModal from "../VideoCallModal.vue";
import { useWebRTC } from "../../composables/useWebRTC";
import { echo } from "../../echo";
import { api } from "../../axios";
import incomingCallSoundUrl from "../../assets/sounds/incoming-call.mp3";

export default defineComponent({
    components: { ChatList, ChatWindow, NotificationToast, VideoCallModal },
    setup() {
        const userStore = useUserStore();
        const chatStore = useChatStore();

        const isMobile = ref(window.innerWidth < 640);

        const updateMobile = () => {
            isMobile.value = window.innerWidth < 640;
        };

        const activeConversation = computed(() => {
            const convId = chatStore.activeConversationId;
            return convId
                ? chatStore.conversations.find((c) => c.id === convId) || null
                : null;
        });

        const isOnline = computed(() => {
            if (!activeConversation.value || activeConversation.value.type !== 'private') return false;
            const otherUser = chatStore.getOtherUser(activeConversation.value);
            return userStore.isUserOnline(otherUser.id);
        });

        onMounted(async () => {
            updateMobile();
            window.addEventListener("resize", updateMobile);

            // Set up notification handler
            (window as any).__chatNotificationHandler = (notification: Notification) => {
                notificationToast.value?.show(notification);
            };

            // Set up sound handler
            (window as any).__chatSoundHandler = () => {
                // Check user preference for notification sound
                if (userStore.user?.notification_sound !== false) {
                    soundPlayer.play();
                }
            };
        });

        onUnmounted(() => {
            window.removeEventListener("resize", updateMobile);

            // Clean up handlers
            delete (window as any).__chatNotificationHandler;
            delete (window as any).__chatSoundHandler;
        });

        const notificationToast = ref<InstanceType<typeof NotificationToast> | null>(null);
        const soundPlayer = useNotificationSound({ volume: 0.6, throttleMs: 1500 });

        // Ringtone player
        // Ringtone player
        const ringtonePlayer = new Audio(incomingCallSoundUrl);
        ringtonePlayer.loop = true;

        let hasInteracted = false;
        const enableAudio = () => { hasInteracted = true; };

        onMounted(() => {
            document.addEventListener('click', enableAudio, { once: true });
            document.addEventListener('scroll', enableAudio, { once: true });
        });

        // --- Video Call Logic ---
        const {
            createOffer, acceptCall, endCall,
            handleOffer, handleAnswer, handleCandidate,
            localStream, remoteStream, incomingCall
        } = useWebRTC();

        const isVideoModalVisible = ref(false);
        const connectionState = ref<RTCPeerConnectionState | 'new'>('new');
        const currentCallTargetId = ref<number | null>(null); // To store who we are calling

        // Peer info for display
        const currentPeerUser = ref<{ name: string; avatar?: string } | null>(null);

        const onSignal = async (type: string, data: any) => {
            let targetUserId = currentCallTargetId.value;

            // If answering an incoming call, target is the caller
            if (incomingCall.value) {
                targetUserId = incomingCall.value.fromUserId;
            }

            if (targetUserId) {
                await api.post(`/video/${type}`, {
                    [type]: data[type],
                    to_user_id: targetUserId
                });
            }
        };

        const setupVideoCallListeners = () => {
            if (userStore.user?.id) {
                echo.private(`user.${userStore.user.id}`)
                    .listen('.video-call.offer', (e: any) => {
                        console.log('Received Offer', e);
                        handleOffer(e.offer, e.fromUserId);
                        currentCallTargetId.value = e.fromUserId; // Store caller ID

                        // Use caller info from event if available
                        if (e.user) {
                            currentPeerUser.value = e.user;
                        } else {
                            // Fallback logic
                            const caller = chatStore.users.find(u => u.id === e.fromUserId) || { name: 'Unknown User' };
                            currentPeerUser.value = caller;
                        }

                        // Show modal for incoming call (global)
                        isVideoModalVisible.value = true;

                        // Play ringtone if not already playing and user interacted
                        if (hasInteracted) {
                            ringtonePlayer.play().catch(e => console.error("Audio play failed", e));
                        } else {
                            console.warn("Autoplay blocked: User has not interacted with the page yet.");
                        }
                    })
                    .listen('.video-call.answer', (e: any) => {
                        console.log('Received Answer', e);
                        ringtonePlayer.pause();
                        ringtonePlayer.currentTime = 0;

                        handleAnswer(e.answer);
                        connectionState.value = 'connected';
                    })
                    .listen('.video-call.candidate', (e: any) => {
                        console.log('Received Candidate', e);
                        handleCandidate(e.candidate);
                    })
                    .listen('.video-call.end', (e: any) => {
                        console.log('Call ended by peer');
                        onEndCallFull(); // cleanup
                    });
            }
        };

        // Call this on mount if user is ready, or watch user
        watch(() => userStore.user, (u) => {
            if (u) setupVideoCallListeners();
        }, { immediate: true });

        const handleStartCall = async (targetUserId: number) => {
            console.log('Starting call to:', targetUserId);
            currentCallTargetId.value = targetUserId;

            // Resolve target info
            const target = chatStore.users.find(u => u.id === targetUserId);
            if (target) {
                currentPeerUser.value = target;
            } else {
                // Try to find in conversations
                const conv = chatStore.conversations.find(c => c.users?.some((u: any) => u.id === targetUserId));
                const u = conv?.users?.find((u: any) => u.id === targetUserId);
                currentPeerUser.value = u || { name: 'Calling...' };
            }

            isVideoModalVisible.value = true;
            connectionState.value = 'new';

            try {
                const offer = await createOffer(targetUserId, onSignal);
                await api.post('/video/offer', {
                    offer,
                    to_user_id: targetUserId
                });
            } catch (err) {
                console.error("Failed to start call", err);
                isVideoModalVisible.value = false;
                currentCallTargetId.value = null;
            }
        };

        const onAcceptCall = async () => {
            ringtonePlayer.pause();
            ringtonePlayer.currentTime = 0;
            try {
                const result = await acceptCall(onSignal);
                if (result) {
                    await api.post('/video/answer', {
                        answer: result.answer,
                        to_user_id: result.toUserId
                    });
                    connectionState.value = 'connected';
                }
            } catch (err) {
                console.error("Failed to accept call", err);
            }
        };

        const onEndCallFull = async () => {
            ringtonePlayer.pause();
            ringtonePlayer.currentTime = 0;

            // Send end signal to peer ONLY if we are connected or initiated it or rejecting incoming
            if (currentCallTargetId.value) {
                try {
                    await api.post('/video/end', { to_user_id: currentCallTargetId.value });
                } catch (e) { console.error('Failed to send end signal', e); }
            }

            endCall();
            isVideoModalVisible.value = false;
            connectionState.value = 'closed';
            currentCallTargetId.value = null;
            currentPeerUser.value = null;
        };

        return {
            userStore,
            chatStore,
            isMobile,
            activeConversation,
            isOnline,
            notificationToast,
            // Video Call props
            isVideoModalVisible,
            localStream,
            remoteStream,
            incomingCall,
            connectionState,
            onAcceptCall,
            onEndCallFull,
            handleStartCall,
            currentPeerUser,
        };
    },
});
</script>
