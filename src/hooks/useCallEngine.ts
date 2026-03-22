"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Socket } from "socket.io-client";

type CallMode = "audio" | "video" | "screen";

export const useCallEngine = (socket: Socket | null, userId: string) => {
  const [inCall, setInCall] = useState(false);
  const [isOutgoing, setIsOutgoing] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "connecting" | "active">("idle");
  const [incomingCall, setIncomingCall] = useState<{ from: string; offer: any; mode: CallMode } | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [mode, setMode] = useState<CallMode>("video");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const targetIdRef = useRef<string | null>(null);

  const end = useCallback(() => {
    if (targetIdRef.current) {
      socket?.emit("call:end", { targetId: targetIdRef.current });
    }
    
    localStream?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();
    
    peerRef.current = null;
    targetIdRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
    setIsOutgoing(false);
    setCallStatus("idle");
    setMuted(false);
    setCameraOff(false);
    setMode("video");
  }, [localStream, socket]);

  const createPeer = useCallback((targetId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("call:ice", { targetId, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setCallStatus("active");
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "disconnected" || peer.connectionState === "failed") {
        end();
      }
    };

    peerRef.current = peer;
    targetIdRef.current = targetId;
    return peer;
  }, [socket, end]);

  const start = useCallback(async (targetId: string, nextMode: CallMode = "video") => {
    const constraints = { 
      audio: true, 
      video: nextMode !== "audio" 
    };
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      const peer = createPeer(targetId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      
      socket?.emit("call:offer", { targetId, offer, mode: nextMode });
      setMode(nextMode);
      setInCall(true);
      setIsOutgoing(true);
      setCallStatus("calling");
    } catch (err) {
      console.error("Failed to start call:", err);
    }
  }, [socket, createPeer]);

  useEffect(() => {
    if (!socket) return;

    socket.on("call:offer", async ({ from, offer, mode: offerMode }) => {
      setIncomingCall({ from, offer, mode: offerMode });
    });

    socket.on("call:answer", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("connecting");
      }
    });

    socket.on("call:ice", async ({ candidate }) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });

    socket.on("call:end", () => {
      end();
    });

    return () => {
      socket.off("call:offer");
      socket.off("call:answer");
      socket.off("call:ice");
      socket.off("call:end");
    };
  }, [socket, createPeer, end]);

  const shareScreen = useCallback(async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const track = display.getVideoTracks()[0];
      const sender = peerRef.current?.getSenders().find((item) => item.track?.kind === "video");
      await sender?.replaceTrack(track);
      setMode("screen");
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  }, []);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;
    
    const constraints = { audio: true, video: incomingCall.mode !== "audio" };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      const peer = createPeer(incomingCall.from);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      socket.emit("call:answer", { targetId: incomingCall.from, answer });
      setMode(incomingCall.mode);
      setInCall(true);
      setIsOutgoing(false);
      setCallStatus("connecting");
      setIncomingCall(null);
    } catch (err) {
      console.error("Accept call failed:", err);
    }
  }, [incomingCall, socket, createPeer]);

  const rejectCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit("call:end", { targetId: incomingCall.from });
    }
    setIncomingCall(null);
  }, [incomingCall, socket]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = muted;
      });
      setMuted(!muted);
    }
  }, [localStream, muted]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = cameraOff;
      });
      setCameraOff(!cameraOff);
    }
  }, [localStream, cameraOff]);

  return { 
    inCall, isOutgoing, callStatus, incomingCall, acceptCall, rejectCall,
    muted, cameraOff, mode, 
    start, end, shareScreen, 
    localStream, remoteStream,
    toggleMute, toggleCamera 
  };
};
