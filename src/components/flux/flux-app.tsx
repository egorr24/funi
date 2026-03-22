"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCallEngine } from "@/src/hooks/useCallEngine";
import { useSocket } from "@/src/hooks/useSocket";
import { useThemeEngine } from "@/src/hooks/useThemeEngine";
import { useWaveform } from "@/src/hooks/useWaveform";
import { FluxMessage, FluxChat } from "@/src/types/flux";
import {
  AIInsightCard,
  CallOverlay,
  ChatHeader,
  ChatList,
  ChatListItem,
  Composer,
  ConnectionBadge,
  CreateChatModal,
  EmptyState,
  FluxShell,
  FolderTabs,
  GlobalSearchPanel,
  IncomingCallModal,
  MediaPicker,
  MessageBubble,
  MessagePane,
  MessageScroll,
  NavSidebar,
  NeonDivider,
  PhotoViewer,
  PinnedBanner,
  ProfileSheet,
  SearchBar,
  SecurityPanel,
  SettingsPanel,
  Sidebar,
  SidebarHeader,
  SmartFolderPanel,
  ThreadPanel,
  ThreadReplyInput,
  TypingIndicator,
  VoiceRecorder,
} from "@/src/components/flux/ui";

const demoPublicKey =
  "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqghxAI+v2OZcRmM4QfM2HAi2YThzM8mimS/93Dx7Ug9lbBfPdD9LNZz6uhRUsjRx3wQ2toKRP5PQxqjqrybq8qQso3g3x6E9x8SWgq4rE8WP4riQ7nTM+xxRp4aK2vBzMCAH4O8lRJgxd9f5nRhh3fkS5z2gsfO9T3rq3pP3vVn3aL9wzNPNR9xWqdXfMbkCz9q2rmjkQYO4QVj7jE5H4Q4qO8ViVw3o0yWcduAF6xLk8yYxKj0o2Q4F2r0K7FG9xjS9WnZl2stx0qjR6HDzH0ncz3UrJkJCAd3M2LNg9D9oT6lGvo5JkQv2Q9N7iBtfI8M6xY4JrV0nI9RjNfW6D7RkGm0z7f3xMXiXfQ3j8j0d8B4e2y6UQpOJ3Jp7WQh4sMSQktj9Kp0hc1nlmW5mZy2mQfxWw3uFv2o7fWFLxH8mE2b+4L22jY8mW2FfNnM3v7x8Ka5noNoQ2b4kzFg9sGf3pLs9s3fI+WQ0k6U2L+IhJQ2Y46p7S4o7kU6wY0yG+1xYzF1L8nABr9Cz7M5C3x6Am5nYQ8P0+f4lsZBf7f3q9N+J5hN8vS9dD4lG5H0h3B6D7J3S6GqYkLx3sQ1E+lQAvJ4E4JQ8sKbVWuYxYp5PR7Lgj7o3gJeWmmkCAwEAAQ==";

export const FluxApp = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [folder, setFolder] = useState("ALL");
  const [search, setSearch] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [threadInput, setThreadInput] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [messages, setMessages] = useState<FluxMessage[]>([]);
  const [chatsData, setChatsData] = useState<FluxChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState("Unread summary will appear here.");
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const { 
    variables, 
    accentColor, setAccentColor, 
    blurIntensity, setBlurIntensity, 
    glowIntensity, setGlowIntensity 
  } = useThemeEngine();
  const socket = useSocket(session?.user?.id || "u_me");
  const call = useCallEngine(socket.socket, session?.user?.id || "");
  const waveform = useWaveform(`${chatId}-${messages.length}`);

  // Обработка ссылки на звонок из URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const callId = params.get("call");
      if (callId && session?.user?.id) {
        // Если это не наш собственный ID (хотя в ссылке chatId)
        // Для простоты — просто открываем чат и предлагаем звонок
        setChatId(callId);
        // Убираем параметр из URL чтобы не звонить при каждой перезагрузке
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [session?.user?.id]);

  // Браузерные уведомления
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Звук звонка
  useEffect(() => {
    if (call.incomingCall) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.loop = true;
      audio.play().catch(() => {});
      
      if (Notification.permission === "granted") {
        new Notification("Входящий звонок FLUX", {
          body: `Звонит: ${call.incomingCall.from}`,
          icon: "/favicon.ico"
        });
      }
      
      return () => {
        audio.pause();
        audio.src = "";
      };
    }

    if (call.isOutgoing && call.callStatus === "calling") {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/1350/1350-preview.mp3");
      audio.loop = true;
      audio.play().catch(() => {});
      return () => {
        audio.pause();
        audio.src = "";
      };
    }
  }, [call.incomingCall, call.isOutgoing, call.callStatus]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch chats function (reusable)
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setChatsData(data);
        // Не выбираем первый чат автоматически на мобилках
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch chats on mount
  useEffect(() => {
    if (session?.user?.id) fetchChats();
  }, [session?.user?.id, fetchChats]);

  // Handle chat creation
  const handleCreateChat = useCallback(async (userId: string, name: string) => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: name }),
      });
      if (res.ok) {
        const newChat = await res.json();
        setIsCreateChatOpen(false);
        // Уведомляем другого пользователя через сокет
        if (socket.socket) {
          socket.socket.emit("chat:new", { targetId: userId, chat: newChat });
        }
        await fetchChats(); // Refresh the list
        setChatId(newChat.id); // Select the new chat
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  }, [fetchChats, socket.socket]);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        // Присоединяемся к комнате чата в сокетах
        if (socket.socket) {
          socket.socket.emit("chat:join", { chatId });
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [chatId, socket.socket]);

  // Fetch messages when chatId changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!socket.socket) return;

    const handleNewMessage = (message: FluxMessage) => {
      // Avoid duplicate messages if we are in the active chat and already added it
      if (message.chatId === chatId) {
        setMessages((current) => {
          if (current.some(m => m.id === message.id)) return current;
          return [...current, message];
        });
      }
      
      // Update last message in chatsData
      setChatsData(current => current.map(chat => {
        if (chat.id === message.chatId) {
          return {
            ...chat,
            lastMessagePreview: message.encryptedBody,
            updatedAt: message.createdAt
          };
        }
        return chat;
      }));
    };

    const handleNewChat = (chat: FluxChat) => {
      setChatsData(current => {
        if (current.some(c => c.id === chat.id)) return current;
        return [chat, ...current];
      });
    };

    socket.socket.on("new_message", handleNewMessage);
    socket.socket.on("chat:new", handleNewChat);
    
    return () => {
      socket.socket?.off("new_message", handleNewMessage);
      socket.socket?.off("chat:new", handleNewChat);
    };
  }, [socket.socket, chatId]);

  const chats = useMemo(() => {
    return chatsData.filter((chat) => {
      const folderMatch = folder === "ALL" || chat.folder === folder;
      const searchMatch =
        !search ||
        chat.title.toLowerCase().includes(search.toLowerCase()) ||
        chat.lastMessagePreview.toLowerCase().includes(search.toLowerCase());
      return folderMatch && searchMatch;
    });
  }, [chatsData, folder, search]);

  const activeChat = useMemo(() => {
    if (!chatId) return null;
    return chats.find((chat) => chat.id === chatId) ?? null;
  }, [chats, chatId]);
  const visibleMessages = useMemo(() => {
    if (!activeChat) return [];
    return messages.filter((message) => message.chatId === activeChat.id);
  }, [messages, activeChat]);

  const startCall = useCallback((mode: "audio" | "video") => {
    if (!activeChat || !session?.user?.id) return;
    fetch(`/api/chats/${activeChat.id}/members`)
      .then(res => res.json())
      .then(members => {
        const other = members.find((m: any) => m.userId !== session.user?.id);
        if (other) call.start(other.userId, session.user?.name || "Anonymous", mode);
      });
  }, [activeChat, session?.user, call]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!activeChat || !session?.user?.id) return;
    
    // Оптимистичное медиа-сообщение
    const tempId = "upload-" + Math.random().toString(36).substring(7);
    const optimisticMedia: FluxMessage = {
      id: tempId,
      chatId: activeChat.id,
      senderId: session.user.id,
      senderName: session.user.name || "You",
      encryptedBody: "Uploading...",
      decryptedBody: "Uploading...",
      encryptedAes: "unsupported",
      iv: "unsupported",
      createdAt: new Date().toISOString(),
      status: "SENT",
      reactions: [],
      mediaType: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
    };
    setMessages(prev => [...prev, optimisticMedia]);

    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (uploadRes.ok) {
        const { url, type } = await uploadRes.json();
        
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: activeChat.id,
            encryptedBody: `Sent a ${type}`,
            encryptedAes: "unsupported",
            iv: "unsupported",
            mediaUrl: url,
            mediaType: type,
          }),
        });

        if (res.ok) {
          const newMessage = await res.json();
          if (socket.socket) {
            socket.socket.emit("message:queue", newMessage);
          }
          setMessages((current) => current.map(m => m.id === tempId ? newMessage : m));
        }
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  }, [activeChat, session?.user, socket.socket]);

  const sendMessage = useCallback(async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || !activeChat || !session?.user) {
      return;
    }

    if (!customText) setInput("");

    // Оптимистичное обновление UI
    const tempId = Math.random().toString(36).substring(7);
    const optimisticMessage: FluxMessage = {
      id: tempId,
      chatId: activeChat.id,
      senderId: session.user.id!,
      senderName: session.user.name || "You",
      encryptedBody: textToSend,
      decryptedBody: textToSend,
      encryptedAes: "unsupported",
      iv: "unsupported",
      createdAt: new Date().toISOString(),
      status: "SENT",
      reactions: [],
    };

    setMessages((current) => [...current, optimisticMessage]);

    // Обновление превью чата
    setChatsData(current => current.map(chat => {
      if (chat.id === activeChat.id) {
        return {
          ...chat,
          lastMessagePreview: textToSend,
          updatedAt: new Date().toISOString()
        };
      }
      return chat;
    }));
    
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChat.id,
          encryptedBody: textToSend,
          encryptedAes: "unsupported",
          iv: "unsupported",
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        if (socket.socket) {
          socket.socket.emit("message:queue", newMessage);
        }
        // Заменяем временное сообщение реальным
        setMessages((current) => current.map(m => m.id === tempId ? newMessage : m));
      } else {
        // В случае ошибки возвращаем текст в инпут если это не авто-сообщение
        if (!customText) setInput(textToSend);
        setMessages((current) => current.filter(m => m.id !== tempId));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      if (!customText) setInput(textToSend);
      setMessages((current) => current.filter(m => m.id !== tempId));
    }
  }, [input, activeChat, session?.user, socket.socket]);

  const sendCallLink = useCallback(() => {
    if (!activeChat) return;
    const callLink = `📞 Присоединяйтесь к звонку FLUX: https://${window.location.host}/?call=${activeChat.id}`;
    sendMessage(callLink);
  }, [activeChat, sendMessage]);

  const summarize = useCallback(async () => {
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ chatId }),
    });
    const payload = (await response.json()) as { summary: string };
    setAiSummary(payload.summary);
  }, [chatId]);

  if (status === "loading") {
    return (
      <div className="grid h-screen place-items-center bg-black text-zinc-100">
        <div className="text-xl font-medium animate-pulse">FLUX IS LOADING...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div style={{ background: variables.background, boxShadow: `inset 0 0 160px ${variables.glow}` }} className="h-screen w-full overflow-hidden">
      <PhotoViewer url={viewingPhoto} onClose={() => setViewingPhoto(null)} />
      {call.incomingCall && (
        <IncomingCallModal 
          from={call.incomingCall.fromName || call.incomingCall.from}
          mode={call.incomingCall.mode}
          onAccept={call.acceptCall}
          onReject={call.rejectCall}
        />
      )}
      <CallOverlay 
        active={call.inCall} 
        mode={call.mode} 
        onEnd={call.end} 
        onShare={call.shareScreen}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        muted={call.muted}
        cameraOff={call.cameraOff}
        toggleMute={call.toggleMute}
        toggleCamera={call.toggleCamera}
        callStatus={call.callStatus}
      />
      <CreateChatModal
        isOpen={isCreateChatOpen}
        onClose={() => setIsCreateChatOpen(false)}
        onCreate={handleCreateChat}
      />
      <FluxShell showRightPanel={showRightPanel}>
        <NavSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          className={chatId ? "hidden lg:flex" : "flex"}
        />
        
        {activeTab === "chats" && (
          <>
            <Sidebar className={`${chatId ? "hidden lg:flex" : "flex"}`}>
              <SidebarHeader title="FLUX" onAddChat={() => setIsCreateChatOpen(true)} />
              <SearchBar value={search} onChange={setSearch} />
              <FolderTabs active={folder} onSelect={setFolder} />
              <NeonDivider />
              <ChatList>
                {chats.map((chat) => (
                  <ChatListItem key={chat.id} chat={chat} active={chat.id === chatId} onClick={() => setChatId(chat.id)} />
                ))}
              </ChatList>
            </Sidebar>

            {activeChat ? (
              <MessagePane className={`${chatId ? "flex" : "hidden lg:flex"}`}>
                <ChatHeader
                  title={activeChat.title}
                  participants={activeChat.participants}
                  onCall={() => startCall("audio")}
                  onVideoCall={() => startCall("video")}
                  onShareLink={sendCallLink}
                  onBack={() => setChatId(null)}
                  extraAction={
                    <button
                      onClick={() => setShowRightPanel((value) => !value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                    >
                      {showRightPanel ? "Скрыть меню" : "Открыть меню"}
                    </button>
                  }
                />
                <PinnedBanner message="Tomorrow 09:00 UTC — ship candidate freeze with encrypted calls." />
                <div className="px-4 pt-3 flex items-center justify-between">
                  <ConnectionBadge online={socket.connected} queued={socket.queuedCount} />
                  <div className={`text-[10px] uppercase font-bold tracking-widest ${socket.connected ? "text-emerald-500" : "text-red-500"}`}>
                    {socket.connected ? "Realtime Active" : "Connecting..."}
                  </div>
                </div>
                <MessageScroll>
                  {visibleMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={{ ...message, waveform, decryptedBody: message.encryptedBody }}
                      mine={message.senderId === session?.user?.id}
                      onImageClick={(url) => setViewingPhoto(url)}
                    />
                  ))}
                </MessageScroll>
                <TypingIndicator visible={activeChat.typing} />
                
                {isRecording ? (
                  <div className="px-4 py-2">
                    <VoiceRecorder 
                      onCancel={() => setIsRecording(false)}
                      onSend={(blob) => {
                        const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
                        handleFileUpload(file);
                        setIsRecording(false);
                      }}
                    />
                  </div>
                ) : (
                  <Composer
                    value={input}
                    onChange={setInput}
                    onSend={sendMessage}
                    onAttach={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*,video/*,audio/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload(file);
                      };
                      input.click();
                    }}
                    onVoice={() => setIsRecording(true)}
                  />
                )}
              </MessagePane>
            ) : (
              <div className="hidden lg:flex flex-1">
                <EmptyState label="Select a conversation to begin." />
              </div>
            )}
          </>
        )}

        {activeTab === "profile" && (
          <div className="lg:col-span-2 p-8 flex flex-col items-center justify-center text-center">
             <div className="h-24 w-24 rounded-full bg-violet-500/20 grid place-items-center mb-4 border-2 border-violet-500/50">
               <User className="h-12 w-12 text-violet-400" />
             </div>
             <h2 className="text-2xl font-bold mb-2">{session?.user?.name}</h2>
             <p className="text-zinc-400 mb-6">{session?.user?.email}</p>
             <button
               onClick={() => signOut()}
               className="px-6 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
             >
               Выйти из аккаунта
             </button>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="col-span-2 p-8 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Настройки FLUX</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl space-y-6">
                <h3 className="text-sm font-semibold mb-4">Кастомизация темы</h3>
                
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Акцентный цвет</label>
                  <div className="flex gap-2">
                    {["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"].map(color => (
                      <button 
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`h-8 w-8 rounded-full border-2 ${accentColor === color ? "border-white" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={accentColor} 
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-8 w-8 rounded-full bg-transparent border-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <label className="text-zinc-400">Интенсивность размытия</label>
                    <span>{blurIntensity}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={blurIntensity} 
                    onChange={(e) => setBlurIntensity(parseInt(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <label className="text-zinc-400">Яркость свечения</label>
                    <span>{Math.round(glowIntensity * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01"
                    value={glowIntensity} 
                    onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>
              </div>

              <SecurityPanel />
              <SmartFolderPanel />
              <div className="p-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl">
                <h3 className="text-sm font-semibold mb-4">Тема оформления</h3>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 rounded-xl border border-violet-500 bg-violet-500/10 text-center text-xs">Темная (Default)</div>
                  <div className="flex-1 p-3 rounded-xl border border-white/10 bg-white/5 text-center text-xs opacity-50">Светлая (Coming soon)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="col-span-2 p-8 flex flex-col items-center justify-center text-center">
            <Bell className="h-16 w-16 text-zinc-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Уведомлений нет</h2>
            <p className="text-zinc-400 text-sm">Мы сообщим вам, когда появится что-то важное.</p>
          </div>
        )}

        {showRightPanel && activeTab === "chats" ? (
          <div className="space-y-4 p-4 border-l border-white/5 overflow-y-auto bg-black/20">
            <AIInsightCard summary={aiSummary} />
            <button onClick={summarize} className="w-full rounded-2xl bg-violet-500/70 py-2 text-sm font-medium">
              Summarize unread
            </button>
            <ThreadPanel>
              <h3 className="text-sm font-semibold">Thread</h3>
              <p className="mt-2 text-xs text-zinc-300">Nested replies stay contextual and synced.</p>
              <ThreadReplyInput value={threadInput} onChange={setThreadInput} />
            </ThreadPanel>
            <MediaPicker />
            <SmartFolderPanel />
            <GlobalSearchPanel query={search} />
            <SecurityPanel />
            <p className="text-center text-xs text-zinc-400 mt-auto pt-4">Theme mode: {mode}</p>
          </div>
        ) : null}
      </FluxShell>
    </div>
  );
};
