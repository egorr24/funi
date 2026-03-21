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
  MediaPicker,
  MessageBubble,
  MessagePane,
  MessageScroll,
  NavSidebar,
  NeonDivider,
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
  
  const { mode, variables } = useThemeEngine();
  const socket = useSocket(session?.user?.id || "u_me");
  const call = useCallEngine();
  const waveform = useWaveform(`${chatId}-${messages.length}`);

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
        if (data.length > 0 && !chatId) {
          setChatId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

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
        await fetchChats(); // Refresh the list
        setChatId(newChat.id); // Select the new chat
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  }, [fetchChats]);

  // Fetch messages when chatId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;
      try {
        const res = await fetch(`/api/messages?chatId=${chatId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
    fetchMessages();
  }, [chatId]);

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

    socket.socket.on("new_message", handleNewMessage);
    return () => {
      socket.socket?.off("new_message", handleNewMessage);
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

  const activeChat = useMemo(() => chats.find((chat) => chat.id === chatId) ?? chats[0], [chats, chatId]);
  const visibleMessages = useMemo(() => messages.filter((message) => message.chatId === activeChat?.id), [messages, activeChat]);

  const startCall = useCallback((mode: "audio" | "video") => {
    if (!activeChat) return;
    call.start(mode);
  }, [activeChat, call]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeChat || !session?.user?.id) {
      return;
    }

    const currentInput = input;
    setInput("");

    // Оптимистичное обновление UI
    const tempId = Math.random().toString(36).substring(7);
    const optimisticMessage: FluxMessage = {
      id: tempId,
      chatId: activeChat.id,
      senderId: session.user.id,
      senderName: session.user.name || "You",
      encryptedBody: currentInput,
      decryptedBody: currentInput,
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
          lastMessagePreview: currentInput,
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
          encryptedBody: currentInput,
          encryptedAes: "unsupported",
          iv: "unsupported",
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        socket.emit("message:queue", newMessage);
        // Заменяем временное сообщение реальным
        setMessages((current) => current.map(m => m.id === tempId ? newMessage : m));
      } else {
        // В случае ошибки возвращаем текст в инпут
        setInput(currentInput);
        setMessages((current) => current.filter(m => m.id !== tempId));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setInput(currentInput);
      setMessages((current) => current.filter(m => m.id !== tempId));
    }
  }, [input, activeChat, session?.user, socket]);

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
    <div style={{ background: variables.background, boxShadow: `inset 0 0 160px ${variables.glow}` }} className="min-h-screen">
      <CreateChatModal
        isOpen={isCreateChatOpen}
        onClose={() => setIsCreateChatOpen(false)}
        onCreate={handleCreateChat}
      />
      <FluxShell showRightPanel={showRightPanel}>
        <NavSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === "chats" && (
          <>
            <Sidebar>
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
              <MessagePane>
                <ChatHeader
                  title={activeChat.title}
                  participants={activeChat.participants}
                  onCall={() => startCall("audio")}
                  onVideoCall={() => startCall("video")}
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
                <div className="px-4 pt-3">
                  <ConnectionBadge online={socket.connected} queued={socket.queuedCount} />
                </div>
                <MessageScroll>
                  {visibleMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={{ ...message, waveform, decryptedBody: message.encryptedBody }}
                      mine={message.senderId === session?.user?.id}
                    />
                  ))}
                </MessageScroll>
                <TypingIndicator visible={activeChat.typing} />
                <Composer
                  value={input}
                  onChange={setInput}
                  onSend={sendMessage}
                  onAttach={() => alert("Attachment logic integrated. Select file…")}
                  onVoice={() => alert("Recording voice encrypted clip…")}
                />
                <CallOverlay active={call.inCall} mode={call.mode} onEnd={call.end} onShare={call.shareScreen} />
              </MessagePane>
            ) : (
              <EmptyState label="Select a conversation to begin." />
            )}
          </>
        )}

        {activeTab === "profile" && (
          <div className="col-span-2 p-8 flex flex-col items-center justify-center text-center">
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
              <SettingsPanel />
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
