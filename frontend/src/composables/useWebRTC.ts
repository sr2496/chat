import { ref, shallowRef } from 'vue';

// Define types for better safety


export function useWebRTC() {
    const localStream = shallowRef<MediaStream | null>(null);
    const remoteStream = shallowRef<MediaStream | null>(null);
    const peerConnection = shallowRef<RTCPeerConnection | null>(null);
    const isCaller = ref(false);
    const incomingCall = ref<{ fromUserId: number, offer: RTCSessionDescriptionInit } | null>(null);
    const inCall = ref(false);

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };

    // Initialize WebRTC
    const initializePeerConnection = (onSignal: (type: string, data: any) => void) => {
        peerConnection.value = new RTCPeerConnection(iceServers);

        // Handle ICE candidates
        peerConnection.value.onicecandidate = (event) => {
            if (event.candidate) {
                onSignal('candidate', { candidate: event.candidate });
            }
        };

        // Handle remote stream
        peerConnection.value.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                remoteStream.value = event.streams[0];
            }
        };

        // Add local tracks to peer connection
        if (localStream.value) {
            localStream.value.getTracks().forEach(track => {
                peerConnection.value?.addTrack(track, localStream.value!);
            });
        }
    };

    const startLocalStream = async () => {
        try {
            localStream.value = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    };

    const createOffer = async (onSignal: (type: string, data: any) => void) => {
        await startLocalStream();
        initializePeerConnection(onSignal);
        isCaller.value = true;

        const offer = await peerConnection.value!.createOffer();
        await peerConnection.value!.setLocalDescription(offer);

        return offer;
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit, fromUserId: number) => {
        incomingCall.value = { fromUserId, offer };
    };

    const acceptCall = async (onSignal: (type: string, data: any) => void) => {
        if (!incomingCall.value) return;

        await startLocalStream();
        initializePeerConnection(onSignal);
        inCall.value = true;

        await peerConnection.value!.setRemoteDescription(new RTCSessionDescription(incomingCall.value.offer));
        const answer = await peerConnection.value!.createAnswer();
        await peerConnection.value!.setLocalDescription(answer);

        return { answer, toUserId: incomingCall.value.fromUserId };
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        if (peerConnection.value) {
            await peerConnection.value.setRemoteDescription(new RTCSessionDescription(answer));
            inCall.value = true;
        }
    };

    const handleCandidate = async (candidate: RTCIceCandidateInit) => {
        if (peerConnection.value) {
            await peerConnection.value.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const endCall = () => {
        if (peerConnection.value) {
            peerConnection.value.close();
            peerConnection.value = null;
        }
        if (localStream.value) {
            localStream.value.getTracks().forEach(track => track.stop());
            localStream.value = null;
        }
        remoteStream.value = null;
        inCall.value = false;
        incomingCall.value = null;
    };

    return {
        localStream,
        remoteStream,
        createOffer,
        handleOffer,
        acceptCall,
        handleAnswer,
        handleCandidate,
        endCall,
        incomingCall,
        inCall
    };
}
