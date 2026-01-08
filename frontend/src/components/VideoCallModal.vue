<template>
    <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
        <div class="relative w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
            <!-- Header -->
            <div class="bg-gray-800 p-4 flex justify-between items-center">
                <h3 class="text-white text-lg font-semibold flex items-center gap-2">
                    <font-awesome-icon icon="video" />
                    {{ statusText }}
                </h3>
                <span class="text-gray-400 text-sm">{{ durationFormatted }}</span>
            </div>

            <!-- Video Grid - SHOWN ONLY IF CONNECTED OR CALLING (after accept) -->
            <div v-show="isConnected || !isIncoming" class="relative aspect-video bg-black">
                <!-- Remote Video (Main) -->
                <video ref="remoteVideo" autoplay playsinline class="w-full h-full object-cover"></video>

                <!-- Local Video (PIP) -->
                <div v-if="isConnected"
                    class="absolute bottom-4 right-4 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
                    <video ref="localVideo" autoplay playsinline muted
                        class="w-full h-full object-cover transform scale-x-[-1]"></video>
                </div>

                <!-- Overlay for 'Calling...' (Outgoing) -->
                <div v-if="!isConnected && !isIncoming"
                    class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-10">
                    <div class="mb-6">
                        <div class="flex justify-center mb-4">
                            <UserAvatar :avatar="callerAvatar" size="xl" />
                        </div>
                        <h2 class="text-2xl text-white font-bold text-center">{{ peerName }}</h2>
                        <p class="text-gray-300 text-center animate-pulse">Calling...</p>
                    </div>
                    <button @click="onEndCall"
                        class="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 w-16 h-16 flex items-center justify-center transition-transform hover:scale-110">
                        <font-awesome-icon icon="phone-slash" class="text-xl" />
                    </button>
                </div>
            </div>

            <!-- Incoming Call Overlay - SHOWN ONLY IF INCOMING AND NOT CONNECTED -->
            <div v-if="isIncoming && !isConnected"
                class="relative aspect-video bg-gray-900 flex flex-col items-center justify-center">
                <div class="mb-8">
                    <div class="flex justify-center mb-6">
                        <UserAvatar :avatar="callerAvatar" size="xl" />
                    </div>
                    <h2 class="text-3xl text-white font-bold text-center mb-2">{{ peerName }}</h2>
                    <p class="text-gray-400 text-center text-lg animate-pulse">Incoming Call...</p>
                </div>

                <div class="flex gap-8">
                    <button @click="onAccept"
                        class="bg-green-600 hover:bg-green-700 text-white rounded-full p-6 w-20 h-20 flex items-center justify-center transition-transform hover:scale-110 shadow-lg">
                        <font-awesome-icon icon="phone" class="text-2xl" />
                    </button>
                    <button @click="onReject"
                        class="bg-red-600 hover:bg-red-700 text-white rounded-full p-6 w-20 h-20 flex items-center justify-center transition-transform hover:scale-110 shadow-lg">
                        <font-awesome-icon icon="phone-slash" class="text-2xl" />
                    </button>
                </div>
            </div>

            <!-- Controls (Only show when connected or calling out) -->
            <div v-if="isConnected || !isIncoming" class="bg-gray-800 p-6 flex justify-center gap-6">
                <!-- Mute/Video Controls only if connected -->
                <template v-if="isConnected">
                    <button @click="toggleMute" class="p-4 rounded-full transition-colors"
                        :class="isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'">
                        <font-awesome-icon :icon="isMuted ? 'microphone-slash' : 'microphone'" class="text-xl" />
                    </button>

                    <button @click="toggleVideo" class="p-4 rounded-full transition-colors"
                        :class="isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'">
                        <font-awesome-icon :icon="isVideoOff ? 'video-slash' : 'video'" class="text-xl" />
                    </button>
                </template>

                <button @click="onEndCall"
                    class="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-transform hover:scale-110">
                    <font-awesome-icon icon="phone-slash" class="text-xl" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted, nextTick } from 'vue';
import UserAvatar from "./Design/UserAvatar.vue";

const props = defineProps<{
    isVisible: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isIncoming: boolean;
    callerName?: string;
    callerAvatar?: string;
    connectionState: RTCPeerConnectionState | 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
}>();

const emit = defineEmits(['accept', 'reject', 'end', 'toggleMute', 'toggleVideo']);

const localVideo = ref<HTMLVideoElement | null>(null);
const remoteVideo = ref<HTMLVideoElement | null>(null);
const isMuted = ref(false);
const isVideoOff = ref(false);
const callDuration = ref(0);
let durationInterval: any = null;

const statusText = computed(() => {
    if (props.isIncoming) return 'Incoming Call...';
    if (props.connectionState === 'connected') return 'Connected';
    if (props.connectionState === 'closed') return 'Call Ended';
    return 'Calling...';
});

const isConnected = computed(() => props.connectionState === 'connected');
const peerName = computed(() => props.callerName || 'Unknown User');

const durationFormatted = computed(() => {
    const mins = Math.floor(callDuration.value / 60).toString().padStart(2, '0');
    const secs = (callDuration.value % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
});

watch([() => props.localStream, isConnected], async ([newStream, connected]) => {
    // Only attach if connected (element exists) and stream exists
    if (connected && newStream) {
        // Wait for DOM
        await nextTick();
        if (localVideo.value) {
            localVideo.value.srcObject = newStream;
        }
    }
}, { immediate: true });

watch(() => props.remoteStream, (newStream) => {
    if (remoteVideo.value && newStream) {
        remoteVideo.value.srcObject = newStream;
    }
});

watch(() => props.connectionState, (newState) => {
    if (newState === 'connected') {
        startTimer();
    } else {
        stopTimer();
    }
});

function startTimer() {
    stopTimer();
    callDuration.value = 0;
    durationInterval = setInterval(() => {
        callDuration.value++;
    }, 1000);
}

function stopTimer() {
    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }
}

const toggleMute = () => {
    isMuted.value = !isMuted.value;
    if (props.localStream) {
        props.localStream.getAudioTracks().forEach(track => track.enabled = !isMuted.value);
    }
    emit('toggleMute', isMuted.value);
};

const toggleVideo = () => {
    isVideoOff.value = !isVideoOff.value;
    if (props.localStream) {
        props.localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOff.value);
    }
    emit('toggleVideo', isVideoOff.value);
};

const onAccept = () => emit('accept');
const onReject = () => emit('reject');
const onEndCall = () => emit('end');

onUnmounted(() => {
    stopTimer();
});
</script>
