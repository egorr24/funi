"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCallEngine } from "@/src/hooks/useCallEngine";
import { useSocket } from "@/src/hooks/useSocket";
import { useThemeEngine } from "@/src/hooks/useThemeEngine";
import { useWaveform } from "@/src/hooks/useWaveform";
import { encryptMessage } from "@/src/lib/crypto";
import { FluxMessage, FluxChat } from "@/src/types/flux";
import {
  AIInsightCard,
  CallOverlay,
  ChatHeader,
  ChatList,
  ChatListItem,
  Composer,
  ConnectionBadge,
  EmptyState,
  FluxShell,
  FolderTabs,
  GlobalSearchPanel,
  MediaPicker,
  MessageBubble,
  MessagePane,
  MessageScroll,
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

  // Fetch chats on mount
  useEffect(() => {
    const fetchChats = async () => {
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
    };
    if (session?.user?.id) fetchChats();
  }, [session?.user?.id]);

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
      if (message.chatId === chatId) {
        setMessages((current) => {
          // Avoid duplicates
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
            lastMessageTime: message.createdAt
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

  const activeChat = chats.find((chat) => chat.id === chatId) ?? chats[0];
  const visibleMessages = messages.filter((message) => message.chatId === activeChat?.id);

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || !session?.user?.id) {
      return;
    }

    const encrypted = await encryptMessage(input, demoPublicKey);
    
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChat.id,
          encryptedBody: input, // In a real app, this would be the actual encrypted body
          encryptedAes: encrypted.encryptedAes,
          iv: encrypted.iv,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        socket.emit("message:queue", newMessage);
        setMessages((current) => [...current, newMessage]);
        setInput("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const summarize = async () => {
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ chatId }),
    });
    const payload = (await response.json()) as { summary: string };
    setAiSummary(payload.summary);
  };

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
      <FluxShell showRightPanel={showRightPanel}>
        <Sidebar>
          <SidebarHeader title="FLUX" />
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
                <MessageBubble key={message.id} message={{ ...message, waveform }} mine={message.senderId === "u_me"} />
              ))}
            </MessageScroll>
            <TypingIndicator visible={activeChat.typing} />
            <Composer value={input} onChange={setInput} onSend={sendMessage} />
            <CallOverlay active={call.inCall} mode={call.mode} onEnd={call.end} onShare={call.shareScreen} />
          </MessagePane>
        ) : (
          <EmptyState label="Select a conversation to begin." />
        )}

        {showRightPanel ? (
          <div className="space-y-4">
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
            <ProfileSheet
              name={session?.user?.name || undefined}
              email={session?.user?.email || undefined}
              onSignOut={() => signOut()}
            />
            <SettingsPanel />
            <button
              onClick={() => call.start("video")}
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-2 text-sm"
            >
              Start unified call
            </button>
            <p className="text-center text-xs text-zinc-400">Theme mode: {mode}</p>
          </div>
        ) : null}
      </FluxShell>
    </div>
  );
};
