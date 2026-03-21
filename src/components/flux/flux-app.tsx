"use client";

import { useMemo, useState } from "react";
import { useCallEngine } from "@/src/hooks/useCallEngine";
import { useSocket } from "@/src/hooks/useSocket";
import { useThemeEngine } from "@/src/hooks/useThemeEngine";
import { useWaveform } from "@/src/hooks/useWaveform";
import { mockChats, mockMessages } from "@/src/lib/mock-data";
import { encryptMessage } from "@/src/lib/crypto";
import { FluxMessage } from "@/src/types/flux";
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
  const [folder, setFolder] = useState("ALL");
  const [search, setSearch] = useState("");
  const [chatId, setChatId] = useState(mockChats[0].id);
  const [input, setInput] = useState("");
  const [threadInput, setThreadInput] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [aiSummary, setAiSummary] = useState("Unread summary will appear here.");
  const { mode, variables } = useThemeEngine();
  const socket = useSocket("u_me");
  const call = useCallEngine();
  const waveform = useWaveform(`${chatId}-${messages.length}`);

  const chats = useMemo(() => {
    return mockChats.filter((chat) => {
      const folderMatch = folder === "ALL" || chat.folder === folder;
      const searchMatch =
        !search ||
        chat.title.toLowerCase().includes(search.toLowerCase()) ||
        chat.lastMessagePreview.toLowerCase().includes(search.toLowerCase());
      return folderMatch && searchMatch;
    });
  }, [folder, search]);

  const activeChat = chats.find((chat) => chat.id === chatId) ?? chats[0];
  const visibleMessages = messages.filter((message) => message.chatId === activeChat?.id);

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) {
      return;
    }

    const encrypted = await encryptMessage(input, demoPublicKey);
    const next: FluxMessage = {
      id: `msg_${Date.now()}`,
      chatId: activeChat.id,
      senderId: "u_me",
      senderName: "You",
      decryptedBody: input,
      encryptedBody: encrypted.encryptedBody,
      encryptedAes: encrypted.encryptedAes,
      iv: encrypted.iv,
      createdAt: new Date().toISOString(),
      status: "QUEUED",
      reactions: [],
    };
    socket.emit("message:queue", next);
    setMessages((current) => [...current, next]);
    setInput("");
  };

  const summarize = async () => {
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ chatId }),
    });
    const payload = (await response.json()) as { summary: string };
    setAiSummary(payload.summary);
  };

  return (
    <div style={{ background: variables.background, boxShadow: `inset 0 0 160px ${variables.glow}` }} className="min-h-screen">
      <FluxShell>
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
            <ChatHeader title={activeChat.title} participants={activeChat.participants} />
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
          <ProfileSheet />
          <SettingsPanel />
          <button
            onClick={() => call.start("video")}
            className="w-full rounded-2xl border border-white/20 bg-white/10 py-2 text-sm"
          >
            Start unified call
          </button>
          <p className="text-center text-xs text-zinc-400">Theme mode: {mode}</p>
        </div>
      </FluxShell>
    </div>
  );
};
