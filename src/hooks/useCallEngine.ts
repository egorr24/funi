"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Socket } from "socket.io-client";

type CallMode = "audio" | "video" | "screen";

export const useCallEngine = (socket: Socket | null, userId: string) => {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [mode, setMode] = useState<CallMode>("video");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const targetIdRef = useRef<string | null>(null);

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
    };

    peerRef.current = peer;
    targetIdRef.current = targetId;
    return peer;
  }, [socket]);

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
    } catch (err) {
      console.error("Failed to start call:", err);
    }
  }, [socket, createPeer]);

  useEffect(() => {
    if (!socket) return;

    socket.on("call:offer", async ({ from, offer, mode: offerMode }) => {
      const constraints = { audio: true, video: offerMode !== "audio" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      const peer = createPeer(from);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      socket.emit("call:answer", { targetId: from, answer });
      setMode(offerMode);
      setInCall(true);
    });

    socket.on("call:answer", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("call:ice", async ({ candidate }) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
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
  }, [socket, createPeer]);

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
    setMuted(false);
    setCameraOff(false);
    setMode("video");
  }, [localStream, socket]);

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
    inCall, muted, cameraOff, mode, 
    start, end, shareScreen, 
    localStream, remoteStream,
    toggleMute, toggleCamera 
  };
};
