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
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);

  // Очистка ресурсов
  const cleanup = useCallback(() => {
    console.log("[CALL] Cleanup started");
    localStream?.getTracks().forEach(track => track.stop());
    peerRef.current?.close();
    peerRef.current = null;
    targetIdRef.current = null;
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
    if (targetIdRef.current && socket) {
      socket.emit("call:end", { targetId: targetIdRef.current });
    }
    cleanup();
  }, [socket, cleanup]);

  // Создание PeerConnection
  const createPeer = useCallback((targetId: string) => {
    console.log("[CALL] Creating PeerConnection for", targetId);
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("call:ice", { targetId, candidate: event.candidate });
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
    return peer;
  }, [socket, cleanup]);

  // Начало звонка (Outgoing)
  const start = useCallback(async (targetId: string, fromName: string, callMode: CallMode = "video") => {
    if (inCall) return;
    console.log("[CALL] Starting outgoing call to", targetId, "as", fromName);
    
    try {
      const constraints = { audio: true, video: callMode !== "audio" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setMode(callMode);
      setInCall(true);
      setIsOutgoing(true);
      setCallStatus("ringing");

      const peer = createPeer(targetId);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      
      socket?.emit("call:offer", { targetId, fromName, offer, mode: callMode });
    } catch (err) {
      console.error("[CALL] Start call error:", err);
      cleanup();
    }
  }, [inCall, socket, createPeer, cleanup]);

  // Принятие звонка (Incoming)
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;
    console.log("[CALL] Accepting call from", incomingCall.from);

    try {
      const constraints = { audio: true, video: incomingCall.mode !== "audio" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setMode(incomingCall.mode);
      setInCall(true);
      setIsOutgoing(false);
      setCallStatus("connecting");

      const peer = createPeer(incomingCall.from);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      
      // Добавляем буферизованные ICE-кандидаты
      while (iceCandidatesBuffer.current.length > 0) {
        const candidate = iceCandidatesBuffer.current.shift();
        if (candidate) await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      socket.emit("call:answer", { targetId: incomingCall.from, answer });
      setIncomingCall(null);
    } catch (err) {
      console.error("[CALL] Accept call error:", err);
      cleanup();
    }
  }, [incomingCall, socket, createPeer, cleanup]);

  // Отклонение звонка
  const rejectCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit("call:end", { targetId: incomingCall.from });
    }
    setIncomingCall(null);
  }, [incomingCall, socket]);

  // Обработка входящих событий сокета
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ from, fromName, offer, mode: offerMode }: any) => {
      console.log("[CALL] Received offer from", fromName);
      if (inCall || incomingCall) {
        console.log("[CALL] Busy, sending call:busy");
        socket.emit("call:busy", { targetId: from });
        return;
      }
      setIncomingCall({ from, fromName, offer, mode: offerMode });
    };

    const handleAnswer = async ({ from, answer }: any) => {
      console.log("[CALL] Received answer from", from);
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("connecting");
        
        // Добавляем буферизованные ICE-кандидаты
        while (iceCandidatesBuffer.current.length > 0) {
          const candidate = iceCandidatesBuffer.current.shift();
          if (candidate) await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
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
        // Буферизуем кандидатов, если RemoteDescription еще не установлен
        iceCandidatesBuffer.current.push(candidate);
      }
    };

    const handleEnd = () => {
      console.log("[CALL] Received end event");
      cleanup();
    };

    const handleBusy = () => {
      console.log("[CALL] Target is busy");
      setCallStatus("failed");
      setFailReason("busy");
      setTimeout(cleanup, 3000);
    };

    const handleFailed = ({ reason }: any) => {
      console.log("[CALL] Call failed:", reason);
      setCallStatus("failed");
      setFailReason(reason);
      setTimeout(cleanup, 3000);
    };

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice", handleIce);
    socket.on("call:end", handleEnd);
    socket.on("call:busy", handleBusy);
    socket.on("call:failed", handleFailed);

    return () => {
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice", handleIce);
      socket.off("call:end", handleEnd);
      socket.off("call:busy", handleBusy);
      socket.off("call:failed", handleFailed);
    };
  }, [socket, inCall, incomingCall, cleanup]);

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
