"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useCallEngine } from "@/src/hooks/useCallEngine";
import { useSocket } from "@/src/hooks/useSocket";
import { useThemeEngine } from "@/src/hooks/useThemeEngine";
import { useWaveform } from "@/src/hooks/useWaveform";
import { FluxMessage, FluxChat } from "@/src/types/flux";
import { User, Settings, Shield, CheckCheck, Plus, Bell, X, ChevronDown } from "lucide-react";
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
  ProfileSettingsModal,
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

export const FluxApp = () => {
  const { data: session, status, update: updateSession } = useSession();
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const creatingChatRef = useRef(false);
  
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

  // Уведомления о звонке (без звука)
  useEffect(() => {
    if (call.incomingCall) {
      if (Notification.permission === "granted") {
        new Notification("Входящий звонок FLUX", {
          body: `Звонит: ${call.incomingCall.fromName}`,
          icon: "/favicon.ico"
        });
      }
    }
  }, [call.incomingCall]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  // Fetch chats function (reusable)
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) {
        throw new Error(`Fetch chats failed: ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid chats payload");
      }
      const normalizedChats = data.map((chat: FluxChat) => {
        const otherMember = chat.otherMembers?.[0];
        return {
          ...chat,
          avatar: chat.avatar || otherMember?.avatar || null,
          participants: Array.isArray(chat.participants) && chat.participants.length > 0
            ? chat.participants
            : [chat.title || "Chat", "You"],
        };
      });
      setChatsData(normalizedChats);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setChatsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch chats on mount
  useEffect(() => {
    if (session?.user?.id) fetchChats();
  }, [session?.user?.id, fetchChats]);

  useEffect(() => {
    if (loading) return;

    if (chatsData.length === 0) {
      if (chatId !== null) {
        setChatId(null);
      }
      return;
    }

    if (chatId && chatsData.some((chat) => chat.id === chatId)) {
      creatingChatRef.current = false; // Reset ref once chat is found
      return;
    }

    if (creatingChatRef.current) {
      // Don't auto-select if we are in the middle of creating a chat
      return;
    }

    if (isDesktop) {
      setChatId(chatsData[0].id);
      return;
    }

    if (chatId !== null) {
      setChatId(null);
    }
  }, [chatsData, chatId, isDesktop, loading]);

  // Handle chat creation
  const handleCreateChat = useCallback(async (userId: string, name: string) => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: name, kind: "Chat" }),
      });
      if (!res.ok) {
        return;
      }
      const newChat = await res.json();
      setIsCreateChatOpen(false);
      if (socket.socket) {
        socket.socket.emit("chat:new", { targetId: userId, chat: newChat });
      }
      creatingChatRef.current = true;
      setChatId(newChat.id);
      await fetchChats();
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
          console.log(`> Joining chat room: ${chatId}`);
          socket.socket.emit("chat:join", { chatId });
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [chatId, socket.socket]);

  const markAsRead = useCallback(async (cId: string) => {
    if (!session?.user?.id) return;
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: cId }),
      });
      if (socket.socket) {
        socket.socket.emit("message:read", { chatId: cId, userId: session.user.id });
      }
    } catch (err) {
      console.error("Mark as read failed", err);
    }
  }, [session?.user?.id, socket.socket]);

  // Fetch messages when chatId changes
  useEffect(() => {
    fetchMessages();
    // При переключении чата сбрасываем непрочитанные локально и в БД
    if (chatId) {
      setChatsData(current => current.map(chat => {
        if (chat.id === chatId) return { ...chat, unreadCount: 0 };
        return chat;
      }));
      markAsRead(chatId);
    }
  }, [fetchMessages, chatId, markAsRead]);

  // Consolidate all socket listeners
  useEffect(() => {
    if (!socket.socket) return;
    const s = socket.socket;

    const handleNewMessage = (message: FluxMessage) => {
      if (message.chatId === chatId) {
        setMessages((current) => {
          if (current.some(m => m.id === message.id)) return current;
          return [...current, message];
        });
        if (message.senderId !== session?.user?.id && !isAtBottomRef.current) {
          setNewMessagesCount((current) => current + 1);
        }
        // Если чат активен, помечаем сообщение прочитанным
        markAsRead(message.chatId);
      }
      setChatsData(current => current.map(chat => {
        if (chat.id === message.chatId) {
          return {
            ...chat,
            lastMessagePreview: message.encryptedBody,
            updatedAt: message.createdAt,
            unreadCount: chat.id === chatId ? 0 : (chat.unreadCount || 0) + 1
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

    const handleReaction = ({ messageId, emoji, userId, userName }: any) => {
      console.log("[SOCKET] Received reaction:", emoji, "from", userId);
      setMessages(current => current.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          const otherReactions = reactions.filter(r => r.userId !== userId);
          return { ...m, reactions: [...otherReactions, { emoji, userId, userName }] };
        }
        return m;
      }));
    };

    const handleDelete = ({ messageId }: any) => {
      console.log("[SOCKET] Received delete for message:", messageId);
      setMessages(current => current.filter(m => m.id !== messageId));
    };

    const handleTyping = ({ chatId: tChatId, userName, isTyping }: any) => {
      // Не показываем индикатор для самого себя
      if (userName === session?.user?.name) return;

      setTypingUsers(prev => {
        const current = prev[tChatId] || [];
        if (isTyping) {
          if (current.includes(userName)) return prev;
          return { ...prev, [tChatId]: [...current, userName] };
        } else {
          return { ...prev, [tChatId]: current.filter(u => u !== userName) };
        }
      });

      // Автоматически убираем через 3 секунды, если не пришло событие остановки
      if (isTyping) {
        const timeoutId = setTimeout(() => {
          setTypingUsers(prev => {
            const current = prev[tChatId] || [];
            if (!current.includes(userName)) return prev;
            return { ...prev, [tChatId]: current.filter(u => u !== userName) };
          });
        }, 3500);
        return () => clearTimeout(timeoutId);
      }
    };

    s.on("new_message", handleNewMessage);
    s.on("chat:new", handleNewChat);
    s.on("message:reaction", handleReaction);
    s.on("message:delete", handleDelete);
    s.on("users:online", (ids: string[]) => setOnlineUserIds(ids));
    s.on("presence:typing", handleTyping);

    return () => {
      s.off("new_message", handleNewMessage);
      s.off("chat:new", handleNewChat);
      s.off("message:reaction", handleReaction);
      s.off("message:delete", handleDelete);
      s.off("users:online");
      s.off("presence:typing", handleTyping);
    };
  }, [socket.socket, chatId, markAsRead, session?.user?.id]);

  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({}); // chatId -> [userName]
  const [messageSearch, setMessageSearch] = useState("");

  const handleForward = useCallback((message?: FluxMessage) => {
    // В реальном приложении здесь открывалось бы окно выбора чата
    console.log("Forwarding message:", message);
    alert("Функция пересылки: выберите чат для отправки (в разработке)");
  }, []);

  const editMessage = async (messageId: string, newBody: string) => {
    if (!activeChat || !socket.socket) return;
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newBody }),
      });
      if (res.ok) {
        socket.socket.emit("message:edit", { messageId, chatId: activeChat.id, newBody });
        setMessages(current => current.map(m => m.id === messageId ? { ...m, decryptedBody: newBody, isEdited: true } : m));
      }
    } catch (err) {
      console.error("Edit failed", err);
    }
  };

  const chats = useMemo(() => {
    return chatsData.filter((chat) => {
      const folderMatch = folder === "ALL" || chat.folder === folder;
      const searchMatch =
        !search ||
        chat.title.toLowerCase().includes(search.toLowerCase()) ||
        (chat.lastMessagePreview && chat.lastMessagePreview.toLowerCase().includes(search.toLowerCase()));
      return folderMatch && searchMatch;
    });
  }, [chatsData, folder, search]);

  const activeChat = useMemo(() => {
    if (!chatId) return null;
    return chatsData.find((chat) => chat.id === chatId) ?? null;
  }, [chatsData, chatId]);


  const typingInActiveChat = useMemo(() => {
    if (!activeChat) return [];
    return typingUsers[activeChat.id] || [];
  }, [typingUsers, activeChat]);

  const visibleMessages = useMemo(() => {
    if (!activeChat) return [];
    let filtered = messages.filter((message) => message && message.chatId === activeChat.id);
    if (messageSearch) {
      const searchLower = messageSearch.toLowerCase();
      filtered = filtered.filter(m => {
        if (!m) return false;
        const body = (m.decryptedBody || m.encryptedBody || "").toLowerCase();
        const sender = (m.senderName || "").toLowerCase();
        return body.includes(searchLower) || sender.includes(searchLower);
      });
    }
    return filtered;
  }, [messages, activeChat, messageSearch]);

  const startCall = useCallback((mode: "audio" | "video") => {
    if (!activeChat || !session?.user?.id) return;
    
    fetch(`/api/chats/${activeChat.id}/members`)
      .then(res => res.json())
      .then(members => {
        const other = members.find((m: any) => m.userId !== session.user?.id);
        if (other) {
          call.start(activeChat.id, other.userId, session.user?.name || "Anonymous", mode);
        } else {
          call.start(activeChat.id, activeChat.id, session.user?.name || "Anonymous", mode);
        }
      })
      .catch(() => {
        call.start(activeChat.id, activeChat.id, session.user?.name || "Anonymous", mode);
      });
  }, [activeChat, session?.user, call]);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setInput(nextValue);
    if (activeChat) {
      setDrafts((current) => ({ ...current, [activeChat.id]: nextValue }));
    }
    
    if (socket.socket && activeChat) {
      // Отправляем событие начала печатания только если раньше не печатали
      if (!typingTimeoutRef.current) {
        socket.socket.emit("presence:typing", {
          chatId: activeChat.id,
          userName: session?.user?.name || "Someone",
          isTyping: true
        });
      }

      // Сбрасываем таймер остановки
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        if (socket.socket && activeChat) {
          socket.socket.emit("presence:typing", {
            chatId: activeChat.id,
            userName: session?.user?.name || "Someone",
            isTyping: false
          });
        }
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };

  const [replyTo, setReplyTo] = useState<FluxMessage | null>(null);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  const scrollToBottom = useCallback((smooth: boolean = true) => {
    const element = messageScrollRef.current;
    if (!element) return;
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
    isAtBottomRef.current = true;
    setShowScrollToBottom(false);
    setNewMessagesCount(0);
  }, []);

  const updateScrollState = useCallback(() => {
    const element = messageScrollRef.current;
    if (!element) return;
    const threshold = 60;
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
    isAtBottomRef.current = atBottom;
    setShowScrollToBottom(!atBottom);
    if (atBottom) {
      setNewMessagesCount(0);
    }
  }, []);

  const addReaction = async (messageId: string, emoji: string) => {
    if (socket.socket && activeChat && session?.user?.id) {
      const userId = session.user.id;
      
      // Оптимистичное обновление
      setMessages(current => current.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          const otherReactions = reactions.filter(r => r.userId !== userId);
          return { ...m, reactions: [...otherReactions, { emoji, userId, userName: session.user?.name || "You" }] };
        }
        return m;
      }));

      try {
        const res = await fetch(`/api/messages/${messageId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });

        if (res.ok) {
          socket.socket.emit("message:reaction", {
            messageId,
            chatId: activeChat.id,
            emoji,
            userId
          });
        }
      } catch (err) {
        console.error("Reaction failed", err);
      }
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeChat || !socket.socket) return;
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
      if (res.ok) {
        socket.socket.emit("message:delete", { messageId, chatId: activeChat.id });
        setMessages(current => current.filter(m => m.id !== messageId));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleFileUpload = useCallback(async (file: File, isSecure: boolean = false) => {
    if (!activeChat || !session?.user?.id) return;
    
    // Оптимистичное медиа-сообщение
    const tempId = "upload-" + Math.random().toString(36).substring(7);
    const optimisticMedia: FluxMessage = {
      id: tempId,
      chatId: activeChat.id,
      senderId: session.user.id,
      senderName: session.user.name || "You",
      encryptedBody: isSecure ? "Secure Image" : "Uploading...",
      decryptedBody: isSecure ? "Secure Image" : "Uploading...",
      encryptedAes: "unsupported",
      iv: "unsupported",
      createdAt: new Date().toISOString(),
      status: "SENT",
      isSecure,
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
            encryptedBody: isSecure ? `Sent a secure ${type}` : `Sent a ${type}`,
            encryptedAes: "unsupported",
            iv: "unsupported",
            mediaUrl: url,
            mediaType: type,
            isSecure,
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

  const sendMessage = useCallback(async (customText?: any) => {
    const textToSend = (typeof customText === "string" ? customText : null) || input;
    if (!textToSend || !textToSend.trim() || !activeChat || !session?.user) {
      return;
    }

    if (!customText) {
      setInput("");
      setDrafts((current) => {
        if (!activeChat) return current;
        const next = { ...current };
        delete next[activeChat.id];
        return next;
      });
    }
    const currentReply = replyTo;
    setReplyTo(null);

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
      replyTo: currentReply ? {
        id: currentReply.id,
        body: currentReply.decryptedBody || currentReply.encryptedBody,
        senderName: currentReply.senderName
      } : undefined
    };

    setMessages((current) => [...current, optimisticMessage]);
    requestAnimationFrame(() => scrollToBottom(true));

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
          replyToId: currentReply?.id
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        if (socket.socket) {
          socket.socket.emit("message:queue", newMessage);
        }
        // Заменяем временное сообщение реальным
        setMessages((current) => current.map(m => m.id === tempId ? newMessage : m));
        requestAnimationFrame(() => scrollToBottom(true));
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
  }, [input, activeChat, session?.user, socket.socket, replyTo, scrollToBottom]);


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

  useEffect(() => {
    setNewMessagesCount(0);
    setShowScrollToBottom(false);
    requestAnimationFrame(() => scrollToBottom(false));
  }, [activeChat?.id, scrollToBottom]);

  useEffect(() => {
    if (!activeChat) return;
    setInput(drafts[activeChat.id] ?? "");
  }, [activeChat?.id, drafts, activeChat]);

  useEffect(() => {
    if (visibleMessages.length === 0) return;
    if (isAtBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [visibleMessages.length, scrollToBottom]);

  const timelineItems = useMemo(() => {
    if (!session?.user?.id) return [];
    const firstUnreadIndex = visibleMessages.findIndex(
      (message) => message.senderId !== session.user.id && message.status !== "READ"
    );
    const items: Array<
      | { type: "date"; key: string; label: string }
      | { type: "unread"; key: string }
      | { type: "message"; key: string; message: FluxMessage; index: number }
    > = [];
    const now = new Date();
    const todayKey = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = yesterday.toDateString();
    visibleMessages.forEach((message, index) => {
      const currentDate = new Date(message.createdAt);
      const prevDate = index > 0 ? new Date(visibleMessages[index - 1].createdAt) : null;
      const currentDayKey = currentDate.toDateString();
      const prevDayKey = prevDate?.toDateString();
      if (index === 0 || currentDayKey !== prevDayKey) {
        const label =
          currentDayKey === todayKey
            ? "Сегодня"
            : currentDayKey === yesterdayKey
              ? "Вчера"
              : currentDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
        items.push({ type: "date", key: `date-${currentDayKey}-${index}`, label });
      }
      if (index === firstUnreadIndex) {
        items.push({ type: "unread", key: `unread-${message.id}` });
      }
      items.push({ type: "message", key: message.id, message, index });
    });
    return items;
  }, [visibleMessages, session?.user?.id]);

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
      <PhotoViewer url={viewingPhoto} onClose={() => setViewingPhoto(null)} onForward={() => handleForward()} />
      <AnimatePresence>
        {call.incomingCall && (
          <IncomingCallModal 
            from={call.incomingCall.fromName || call.incomingCall.from}
            mode={call.incomingCall.mode}
            onAccept={call.acceptCall}
            onReject={call.rejectCall}
          />
        )}
        {call.inCall && (
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
            failReason={call.failReason}
          />
        )}
      </AnimatePresence>
      <CreateChatModal
        isOpen={isCreateChatOpen}
        onClose={() => setIsCreateChatOpen(false)}
        onCreate={handleCreateChat}
      />
      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={session?.user}
        onUpdate={async (data) => {
          try {
            console.log("Updating profile with data:", data);
            const res = await fetch("/api/User", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (res.ok) {
              const updated = await res.json();
              console.log("Profile updated successfully:", updated);
              
              // Принудительно обновляем сессию через NextAuth
              await updateSession({
                ...session,
                user: {
                  ...session?.user,
                  name: updated.name,
                  image: updated.avatar,
                  avatar: updated.avatar
                }
              });
              
              // Для мгновенного эффекта без перезагрузки можно обновить и router, 
              // но updateSession должно хватить
            }
          } catch (error) {
            console.error("Update profile error:", error);
          }
        }}
      />
      <FluxShell showRightPanel={showRightPanel}>
        <NavSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          userAvatar={session?.user?.image || session?.user?.avatar}
          className={chatId ? "hidden lg:flex" : "flex"}
        />
        
        {activeTab === "chats" && (
          <>
            <Sidebar className={`${chatId ? "hidden lg:flex" : "flex"}`}>
              <SidebarHeader 
                title="FLUX" 
                onAddChat={() => setIsCreateChatOpen(true)}
                onSearch={() => setIsCreateChatOpen(true)}
              />
              <SearchBar value={search} onChange={setSearch} />
              <FolderTabs active={folder} onSelect={setFolder} />
              <NeonDivider />
              <ChatList>
                  {chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      active={chatId === chat.id}
                      onClick={() => setChatId(chat.id)}
                      isOnline={chat.otherUserId ? onlineUserIds.includes(chat.otherUserId) : false}
                      onMute={async () => {
                        // Логика Mute
                        setChatsData(prev => prev.map(c => 
                          c.id === chat.id ? { ...c, isMuted: !c.isMuted } : c
                        ));
                      }}
                    />
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
                  searchValue={messageSearch}
                  onSearchChange={setMessageSearch}
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
                </div>
                <div className="relative flex-1 min-h-0 flex flex-col">
                  <MessageScroll scrollRef={messageScrollRef} onScroll={updateScrollState}>
                    {timelineItems.map((item) => {
                      if (item.type === "date") {
                        return (
                          <div key={item.key} className="my-3 flex justify-center">
                            <div className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 backdrop-blur-md">
                              {item.label}
                            </div>
                          </div>
                        );
                      }
                      if (item.type === "unread") {
                        return (
                          <div key={item.key} className="my-3 flex items-center gap-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                            <div className="rounded-full border border-violet-300/35 bg-violet-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-200 backdrop-blur-md">
                              Непрочитанные
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                          </div>
                        );
                      }
                      const message = item.message;
                      const prevMessage = item.index > 0 ? visibleMessages[item.index - 1] : null;
                      const nextMessage = item.index < visibleMessages.length - 1 ? visibleMessages[item.index + 1] : null;
                      const prevGap = prevMessage ? Math.abs(new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) : Number.MAX_SAFE_INTEGER;
                      const nextGap = nextMessage ? Math.abs(new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime()) : Number.MAX_SAFE_INTEGER;
                      const compactTop = Boolean(prevMessage && prevMessage.senderId === message.senderId && prevGap < 5 * 60 * 1000);
                      return (
                        <div key={message.id} className={`${compactTop ? "mt-1" : "mt-3"}`}>
                          <MessageBubble
                            message={{ ...message, waveform, decryptedBody: message.decryptedBody || message.encryptedBody }}
                            mine={message.senderId === session?.user?.id}
                            viewerName={session?.user?.name || "ENCRYPTED"}
                            onImageClick={(url) => setViewingPhoto(url)}
                            onReaction={(emoji) => addReaction(message.id, emoji)}
                            onReply={() => setReplyTo(message)}
                            onDelete={() => deleteMessage(message.id)}
                            onEdit={(newBody) => editMessage(message.id, newBody)}
                            onForward={() => handleForward(message)}
                          />
                        </div>
                      );
                    })}
                  </MessageScroll>
                  {showScrollToBottom && (
                    <button
                      onClick={() => scrollToBottom(true)}
                      className="absolute bottom-4 right-4 lg:right-6 flex items-center gap-2 rounded-full border border-violet-300/35 bg-black/55 px-3 py-2 text-xs font-semibold text-violet-100 shadow-xl backdrop-blur-md hover:bg-black/70"
                    >
                      <ChevronDown className="h-4 w-4" />
                      {newMessagesCount > 0 ? (
                        <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] text-white">
                          {newMessagesCount}
                        </span>
                      ) : null}
                    </button>
                  )}
                </div>

                {replyTo && (
                  <div className="px-6 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-1 h-8 bg-violet-500 rounded-full" />
                      <div className="flex flex-col text-xs truncate">
                        <span className="font-bold text-violet-400">Ответ {replyTo.senderName}</span>
                        <span className="text-zinc-400 truncate">{replyTo.decryptedBody}</span>
                      </div>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                      <X className="h-4 w-4 text-zinc-500" />
                    </button>
                  </div>
                )}

                <TypingIndicator visible={typingInActiveChat.length > 0} userNames={typingInActiveChat} />
                
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
                      onChange={handleTyping}
                      onSend={sendMessage}
                      onAttach={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*,video/*,audio/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileUpload(file, false);
                        };
                        input.click();
                      }}
                      onAttachSecure={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*,video/*,audio/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileUpload(file, true);
                        };
                        input.click();
                      }}
                      onVoiceStart={() => setIsRecording(true)}
                      isRecording={isRecording}
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
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
             <div className="relative group mb-4">
               <div className="h-32 w-32 bg-violet-500/20 grid place-items-center border-4 border-violet-500/30 overflow-hidden shadow-2xl">
                 {session?.user?.image || session?.user?.avatar ? (
                   <img src={session.user.image || session.user.avatar} alt="Profile" className="h-full w-full object-cover" />
                 ) : (
                   <User className="h-16 w-16 text-violet-400" />
                 )}
               </div>
               <button 
                 onClick={() => setIsProfileOpen(true)}
                 className="absolute bottom-1 right-1 p-2 bg-violet-600 border-4 border-zinc-900 hover:bg-violet-500 transition-all active:scale-90"
               >
                 <Settings className="h-4 w-4 text-white" />
               </button>
             </div>
             <h2 className="text-3xl font-black mb-1 text-white tracking-tight uppercase">{session?.user?.name}</h2>
             <p className="text-zinc-500 font-mono text-sm mb-10 tracking-widest">{session?.user?.email}</p>
             
             <div className="flex flex-col gap-3 w-full max-w-xs">
               <button
                 onClick={() => setIsProfileOpen(true)}
                 className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all uppercase tracking-widest"
               >
                 Редактировать профиль
               </button>
               <button
                 onClick={() => signOut()}
                 className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest"
               >
                 Выйти из системы
               </button>
             </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 h-full overflow-y-auto bg-[#0a0a0c]">
            <div className="max-w-4xl mx-auto p-8 lg:p-12">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-1">Настройки</h2>
                  <p className="text-zinc-500 text-sm">Управление вашим аккаунтом и интерфейсом FLUX</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-violet-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Раздел: Безопасность */}
                <div className="space-y-6">
                  <div className="p-6 rounded-[32px] bg-zinc-900/50 border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Shield className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h3 className="font-bold">Безопасность</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Сквозное шифрование</span>
                          <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Активно</span>
                        </div>
                        <CheckCheck className="h-4 w-4 text-emerald-500" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Двухфакторная аутентификация</span>
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Настроить</span>
                        </div>
                        <Plus className="h-4 w-4 text-zinc-500" />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Активные сессии</span>
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">3 устройства</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Раздел: Уведомления */}
                  <div className="p-6 rounded-[32px] bg-zinc-900/50 border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-500/10 rounded-xl">
                        <Bell className="h-5 w-5 text-blue-400" />
                      </div>
                      <h3 className="font-bold">Уведомления</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Звук уведомлений</span>
                        <div className="w-10 h-5 bg-violet-600 rounded-full relative">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Показывать превью</span>
                        <div className="w-10 h-5 bg-violet-600 rounded-full relative">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Раздел: Внешний вид */}
                <div className="space-y-6">
                  <div className="p-6 rounded-[32px] bg-zinc-900/50 border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-violet-500/10 rounded-xl">
                        <Settings className="h-5 w-5 text-violet-400" />
                      </div>
                      <h3 className="font-bold">Внешний вид</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Акцентный цвет</label>
                        <div className="flex flex-wrap gap-3">
                          {["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"].map(color => (
                            <button 
                              key={color}
                              onClick={() => setAccentColor(color)}
                              className={`h-10 w-10 rounded-xl border-2 transition-transform hover:scale-110 ${accentColor === color ? "border-white" : "border-transparent"}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
                          <label>Интенсивность размытия</label>
                          <span className="text-violet-400">{blurIntensity}px</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" 
                          value={blurIntensity} 
                          onChange={(e) => setBlurIntensity(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
                          <label>Яркость свечения</label>
                          <span className="text-violet-400">{Math.round(glowIntensity * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.01"
                          value={glowIntensity} 
                          onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[32px] bg-zinc-900/50 border border-white/5 backdrop-blur-xl">
                    <h3 className="text-sm font-semibold mb-4">О программе</h3>
                    <div className="space-y-2 text-xs text-zinc-500">
                      <div className="flex justify-between">
                        <span>Версия</span>
                        <span className="text-zinc-300 font-mono">2.4.0-stable</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Сборка</span>
                        <span className="text-zinc-300 font-mono">2026.03.22</span>
                      </div>
                    </div>
                  </div>
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
            <p className="text-center text-xs text-zinc-400 mt-auto pt-4">Theme mode: {call.mode}</p>
          </div>
        ) : null}
      </FluxShell>
    </div>
  );
};
