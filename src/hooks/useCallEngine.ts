"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Socket } from "socket.io-client";

type CallMode = "audio" | "video" | "screen";
type CallStatus = "idle" | "ringing" | "connecting" | "active" | "failed";

interface IncomingCall {
  from: string;
  fromName: string;
  offer: RTCSessionDescriptionInit;
  mode: CallMode;
  chatId: string;
}

export const useCallEngine = (socket: Socket | null, userId: string) => {
  const [inCall, setInCall] = useState(false);
  const [isOutgoing, setIsOutgoing] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [failReason, setFailReason] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [mode, setMode] = useState<CallMode>("video");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const targetIdRef = useRef<string | null>(null);
  const chatIdRef = useRef<string | null>(null);
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);

  // Очистка ресурсов
  const cleanup = useCallback(() => {
    console.log("[CALL] Cleanup started");
    localStream?.getTracks().forEach(track => track.stop());
    peerRef.current?.close();
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
    setIncomingCall(null);
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
    cleanup();
  }, [socket, cleanup]);

  // Создание PeerConnection
  const createPeer = useCallback((targetId: string, chatId: string) => {
    console.log(`[CALL] Creating PeerConnection. Target: ${targetId}, Chat: ${chatId}`);
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("call:ice", { targetId, candidate: event.candidate, chatId });
      }
    };

    peer.ontrack = (event) => {
      console.log("[CALL] Received remote track");
      setRemoteStream(event.streams[0]);
      setCallStatus("active");
    };

    peer.onconnectionstatechange = () => {
      console.log("[CALL] Connection state:", peer.connectionState);
      if (["disconnected", "failed", "closed"].includes(peer.connectionState)) {
        cleanup();
      }
    };

    peerRef.current = peer;
    targetIdRef.current = targetId;
    chatIdRef.current = chatId;
    return peer;
  }, [socket, cleanup]);

  // Начало звонка (Outgoing) - ТЕПЕРЬ ПО CHAT_ID
  const start = useCallback(async (chatId: string, fromName: string, callMode: CallMode = "video") => {
    if (inCall) return;
    console.log(`[CALL] Room-based start. Chat: ${chatId}, From: ${fromName}`);
    
    try {
      const constraints = { audio: true, video: callMode !== "audio" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setMode(callMode);
      setInCall(true);
      setIsOutgoing(true);
      setCallStatus("ringing");
      chatIdRef.current = chatId;

      // Мы не создаем peer здесь, так как не знаем КТО ответит.
      // Мы создаем его, когда получим call:answer.
      // Но нам нужно подготовить offer.
      const tempPeer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      stream.getTracks().forEach(track => tempPeer.addTrack(track, stream));
      const offer = await tempPeer.createOffer();
      await tempPeer.setLocalDescription(offer);
      
      // Сохраняем временный peer, чтобы потом заменить его на настоящий с нужным targetId
      peerRef.current = tempPeer;
      
      socket?.emit("call:offer", { chatId, fromName, offer, mode: callMode });
    } catch (err) {
      console.error("[CALL] Start call error:", err);
      cleanup();
    }
  }, [inCall, socket, cleanup]);

  // Принятие звонка (Incoming)
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;
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
      
      while (iceCandidatesBuffer.current.length > 0) {
        const candidate = iceCandidatesBuffer.current.shift();
        if (candidate) await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      socket.emit("call:answer", { 
        targetId: incomingCall.from, 
        answer, 
        chatId: incomingCall.chatId 
      });
      setIncomingCall(null);
    } catch (err) {
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

  // Обработка входящих событий сокета
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ from, fromName, offer, mode: offerMode, chatId }: any) => {
      console.log("[CALL] Room offer from", fromName, "in chat", chatId);
      if (inCall || incomingCall) {
        return; // Уже заняты
      }
      setIncomingCall({ from, fromName, offer, mode: offerMode, chatId });
    };

    const handleAnswer = async ({ from, answer, chatId }: any) => {
      console.log("[CALL] Someone answered!", from);
      if (peerRef.current && isOutgoing) {
        // Добавляем обработчики к уже существующему peer (который мы создали в start)
        const peer = peerRef.current;
        targetIdRef.current = from;
        chatIdRef.current = chatId;

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("call:ice", { targetId: from, candidate: event.candidate, chatId });
          }
        };

        peer.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          setCallStatus("active");
        };

        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("connecting");
        
        while (iceCandidatesBuffer.current.length > 0) {
          const candidate = iceCandidatesBuffer.current.shift();
          if (candidate) await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    };

    const handleIce = async ({ from, candidate }: any) => {
      if (peerRef.current && peerRef.current.remoteDescription) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("[CALL] ICE error", e);
        }
      } else {
        iceCandidatesBuffer.current.push(candidate);
      }
    };

    const handleEnd = () => {
      console.log("[CALL] Call ended by remote");
      cleanup();
    };

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice", handleIce);
    socket.on("call:end", handleEnd);

    return () => {
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice", handleIce);
      socket.off("call:end", handleEnd);
    };
  }, [socket, inCall, incomingCall, isOutgoing, cleanup]);

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
