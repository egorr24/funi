"use client";
import { useCallback, useRef, useState, useEffect } from "react";
export const useCallEngine = (socket, userId) => {
    const [inCall, setInCall] = useState(false);
    const [isOutgoing, setIsOutgoing] = useState(false);
    const [callStatus, setCallStatus] = useState("idle");
    const [failReason, setFailReason] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [mode, setMode] = useState("video");
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerRef = useRef(null);
    const targetIdRef = useRef(null);
    const chatIdRef = useRef(null);
    const iceCandidatesBuffer = useRef([]);
    // Очистка ресурсов
    const cleanup = useCallback(() => {
        var _a;
        console.log("[CALL] Cleanup started");
        localStream === null || localStream === void 0 ? void 0 : localStream.getTracks().forEach(track => track.stop());
        (_a = peerRef.current) === null || _a === void 0 ? void 0 : _a.close();
        peerRef.current = null;
        targetIdRef.current = null;
        chatIdRef.current = null;
        iceCandidatesBuffer.current = [];
        setLocalStream(null);
        setRemoteStream(null);
        setInCall(false);
        setIsOutgoing(false);
        setCallStatus("idle");
        setFailReason(null);
        // НЕ сбрасываем incomingCall здесь, чтобы модалка не пропадала при пересоздании Peer
        // setIncomingCall(null);
        setMuted(false);
        setCameraOff(false);
    }, [localStream]);
    // Завершение звонка
    const end = useCallback(() => {
        console.log("[CALL] Ending call");
        if (socket) {
            socket.emit("call:end", {
                targetId: targetIdRef.current,
                chatId: chatIdRef.current
            });
        }
        setIncomingCall(null); // Сбрасываем входящий звонок при завершении
        cleanup();
    }, [socket, cleanup]);
    // Создание PeerConnection
    const createPeer = useCallback((targetId, chatId) => {
        console.log(`[CALL] Creating PeerConnection. Target: ${targetId}, Chat: ${chatId}`);
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun3.l.google.com:19302" },
                { urls: "stun:stun4.l.google.com:19302" },
                // Metered TURN (Free tier)
                {
                    urls: "turn:openrelay.metered.ca:80",
                    username: "openrelayproject",
                    credential: "openrelayproject"
                },
                {
                    urls: "turn:openrelay.metered.ca:443",
                    username: "openrelayproject",
                    credential: "openrelayproject"
                },
                {
                    urls: "turn:openrelay.metered.ca:443?transport=tcp",
                    username: "openrelayproject",
                    credential: "openrelayproject"
                },
                // Добавляем дополнительные STUN для надежности
                { urls: "stun:stun.nextcloud.com:443" },
                { urls: "stun:stun.stunprotocol.org" }
            ],
            iceCandidatePoolSize: 10,
            iceTransportPolicy: "all"
        });
        peer.onicecandidate = (event) => {
            if (event.candidate && socket) {
                console.log(`[CALL] Generated ICE candidate: ${event.candidate.type}`);
                socket.emit("call:ice", { targetId, candidate: event.candidate, chatId });
            }
        };
        peer.oniceconnectionstatechange = () => {
            console.log("[CALL] ICE Connection state:", peer.iceConnectionState);
            if (peer.iceConnectionState === "failed") {
                console.error("[CALL] ICE Connection failed. Try to restart ICE...");
                peer.restartIce();
            }
        };
        peer.ontrack = (event) => {
            console.log(`[CALL] Received remote track: ${event.track.kind}`);
            setRemoteStream(prev => {
                let stream = prev;
                if (!stream) {
                    if (event.streams && event.streams[0]) {
                        console.log("[CALL] Creating remote stream from event streams");
                        stream = new MediaStream(event.streams[0].getTracks());
                    }
                    else {
                        console.log("[CALL] Creating remote stream from individual track");
                        stream = new MediaStream([event.track]);
                    }
                }
                else {
                    const tracks = stream.getTracks();
                    if (!tracks.find(t => t.id === event.track.id)) {
                        console.log("[CALL] Adding track to existing remote stream");
                        stream = new MediaStream([...tracks, event.track]);
                    }
                }
                // ВАЖНО для iOS: пытаемся воспроизвести звук, если это аудио трек
                if (event.track.kind === "audio") {
                    const audio = new Audio();
                    audio.srcObject = stream;
                    audio.play().catch(e => console.warn("[CALL] Audio autoplay blocked, will need user gesture", e));
                }
                return stream;
            });
            setCallStatus("active");
        };
        peer.onconnectionstatechange = () => {
            console.log("[CALL] Connection state changed:", peer.connectionState);
            if (peer.connectionState === "connected") {
                console.log("[CALL] WebRTC connected successfully!");
                setCallStatus("active");
            }
            if (["disconnected", "failed", "closed"].includes(peer.connectionState)) {
                console.log("[CALL] WebRTC connection failed or closed");
                cleanup();
            }
        };
        peerRef.current = peer;
        targetIdRef.current = targetId;
        chatIdRef.current = chatId;
        return peer;
    }, [socket, cleanup]);
    // Начало звонка (Outgoing)
    const start = useCallback(async (chatId, targetId, fromName, callMode = "video") => {
        if (inCall)
            return;
        console.log(`[CALL] Starting call. Chat: ${chatId}, Target: ${targetId}, From: ${fromName}`);
        try {
            const constraints = { audio: true, video: callMode !== "audio" };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            setMode(callMode);
            setInCall(true);
            setIsOutgoing(true);
            setCallStatus("ringing");
            chatIdRef.current = chatId;
            targetIdRef.current = targetId;
            const peer = createPeer(targetId, chatId);
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket === null || socket === void 0 ? void 0 : socket.emit("call:offer", { chatId, targetId, fromName, offer, mode: callMode });
        }
        catch (err) {
            console.error("[CALL] Start call error:", err);
            cleanup();
        }
    }, [inCall, socket, createPeer, cleanup]);
    // Принятие звонка (Incoming)
    const acceptCall = useCallback(async () => {
        if (!incomingCall || !socket)
            return;
        console.log("[CALL] Accepting call in chat", incomingCall.chatId);
        try {
            const constraints = { audio: true, video: incomingCall.mode !== "audio" };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            setMode(incomingCall.mode);
            setInCall(true);
            setIsOutgoing(false);
            setCallStatus("connecting");
            const peer = createPeer(incomingCall.from, incomingCall.chatId);
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
            await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("call:answer", {
                targetId: incomingCall.from,
                answer,
                chatId: incomingCall.chatId
            });
            // Добавляем накопленные ICE кандидаты после setRemoteDescription
            while (iceCandidatesBuffer.current.length > 0) {
                const candidate = iceCandidatesBuffer.current.shift();
                if (candidate)
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
            setIncomingCall(null);
        }
        catch (err) {
            console.error("[CALL] Accept call error:", err);
            cleanup();
        }
    }, [incomingCall, socket, createPeer, cleanup]);
    // Отклонение звонка
    const rejectCall = useCallback(() => {
        if (incomingCall && socket) {
            socket.emit("call:end", {
                targetId: incomingCall.from,
                chatId: incomingCall.chatId
            });
        }
        setIncomingCall(null);
    }, [incomingCall, socket]);
    const inCallRef = useRef(false);
    const incomingCallRef = useRef(null);
    const isOutgoingRef = useRef(false);
    useEffect(() => {
        inCallRef.current = inCall;
    }, [inCall]);
    useEffect(() => {
        incomingCallRef.current = incomingCall;
    }, [incomingCall]);
    useEffect(() => {
        isOutgoingRef.current = isOutgoing;
    }, [isOutgoing]);
    // Обработка входящих событий сокета
    useEffect(() => {
        if (!socket)
            return;
        const handleOffer = async ({ from, fromName, offer, mode: offerMode, chatId }) => {
            console.log(`[CALL] Offer from ${fromName}. Current inCall: ${inCallRef.current}, incoming: ${!!incomingCallRef.current}`);
            if (inCallRef.current || incomingCallRef.current) {
                console.log("[CALL] Busy, sending busy signal");
                socket.emit("call:busy", { targetId: from });
                return;
            }
            setIncomingCall({ from, fromName, offer, mode: offerMode, chatId });
        };
        const handleAnswer = async ({ from, answer }) => {
            var _a;
            console.log("[CALL] Answer received. Current state:", (_a = peerRef.current) === null || _a === void 0 ? void 0 : _a.signalingState);
            const peer = peerRef.current;
            if (!peer || !isOutgoingRef.current)
                return;
            // Если мы уже в стабильном состоянии, возможно это дубликат ответа
            if (peer.signalingState === "stable") {
                console.log("[CALL] Signaling state is already stable, ignoring duplicate answer");
                setCallStatus("active");
                return;
            }
            if (peer.signalingState !== "have-local-offer") {
                console.warn("[CALL] Signaling state is not have-local-offer, ignoring answer. State:", peer.signalingState);
                return;
            }
            try {
                await peer.setRemoteDescription(new RTCSessionDescription(answer));
                console.log("[CALL] Remote description set successfully (answer)");
                setCallStatus("active");
                // Добавляем накопленные ICE кандидаты
                const candidates = [...iceCandidatesBuffer.current];
                iceCandidatesBuffer.current = [];
                for (const candidate of candidates) {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => {
                        console.error("[CALL] Error adding buffered ICE candidate", e);
                    });
                }
            }
            catch (err) {
                console.error("[CALL] Critical error setting remote answer:", err);
                // Не очищаем сразу, даем шанс на переподключение если это возможно
                // Но если это критическая ошибка SDP, то cleanup
                if (err instanceof Error && err.name === "InvalidStateError") {
                    console.warn("[CALL] InvalidStateError during setRemoteDescription, might be already handled");
                }
                else {
                    cleanup();
                }
            }
        };
        const handleIce = async ({ from, candidate }) => {
            if (peerRef.current && peerRef.current.remoteDescription) {
                try {
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
                catch (e) {
                    console.error("[CALL] ICE error", e);
                }
            }
            else {
                iceCandidatesBuffer.current.push(candidate);
            }
        };
        const handleEnd = () => {
            console.log("[CALL] Call ended by remote");
            setIncomingCall(null);
            cleanup();
        };
        const handleBusy = () => {
            console.log("[CALL] Remote is busy");
            setCallStatus("failed");
            setFailReason("busy");
            setTimeout(cleanup, 3000);
        };
        socket.on("call:offer", handleOffer);
        socket.on("call:answer", handleAnswer);
        socket.on("call:ice", handleIce);
        socket.on("call:end", handleEnd);
        socket.on("call:busy", handleBusy);
        return () => {
            socket.off("call:offer", handleOffer);
            socket.off("call:answer", handleAnswer);
            socket.off("call:ice", handleIce);
            socket.off("call:end", handleEnd);
            socket.off("call:busy", handleBusy);
        };
    }, [socket, cleanup]); // Зависим только от сокета и мемоизированного cleanup
    const toggleMute = useCallback(() => {
        if (localStream) {
            const newState = !muted;
            localStream.getAudioTracks().forEach(track => track.enabled = !newState);
            setMuted(newState);
        }
    }, [localStream, muted]);
    const toggleCamera = useCallback(() => {
        if (localStream) {
            const newState = !cameraOff;
            localStream.getVideoTracks().forEach(track => track.enabled = !newState);
            setCameraOff(newState);
        }
    }, [localStream, cameraOff]);
    return {
        inCall,
        isOutgoing,
        callStatus,
        failReason,
        incomingCall,
        mode,
        muted,
        cameraOff,
        localStream,
        remoteStream,
        start,
        end,
        acceptCall,
        rejectCall,
        toggleMute,
        toggleCamera
    };
};
