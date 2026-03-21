"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type CallMode = "audio" | "video" | "screen";

export const useCallEngine = () => {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [mode, setMode] = useState<CallMode>("video");
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async (nextMode: CallMode) => {
    const constraints =
      nextMode === "audio" ? { audio: true, video: false } : { audio: true, video: true };
    const media = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = media;
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    media.getTracks().forEach((track) => peer.addTrack(track, media));
    peerRef.current = peer;
    setMode(nextMode);
    setInCall(true);
  }, []);

  const shareScreen = useCallback(async () => {
    const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const track = display.getVideoTracks()[0];
    const sender = peerRef.current?.getSenders().find((item) => item.track?.kind === "video");
    await sender?.replaceTrack(track);
    setMode("screen");
  }, []);

  const end = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();
    localStreamRef.current = null;
    peerRef.current = null;
    setInCall(false);
    setMuted(false);
    setCameraOff(false);
    setMode("video");
  }, []);

  const controls = useMemo(
    () => ({
      toggleMute: () => {
        localStreamRef.current?.getAudioTracks().forEach((track) => {
          track.enabled = muted;
        });
        setMuted((value) => !value);
      },
      toggleCamera: () => {
        localStreamRef.current?.getVideoTracks().forEach((track) => {
          track.enabled = cameraOff;
        });
        setCameraOff((value) => !value);
      },
    }),
    [cameraOff, muted]
  );

  return { inCall, muted, cameraOff, mode, start, end, shareScreen, ...controls };
};
