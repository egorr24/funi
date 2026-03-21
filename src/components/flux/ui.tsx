"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic, Paperclip, Phone, Pin, Search, SendHorizontal, Shield, Video, Plus, X, MessageSquare, Settings, User, Bell, Check, CheckCheck, Maximize2, MicOff, VideoOff, PhoneOff, Share } from "lucide-react";
import { PropsWithChildren, ReactNode, useState, useEffect, useRef } from "react";
import { FluxChat, FluxMessage } from "@/src/types/flux";

type BaseProps = {
  className?: string;
};

export const GlassCard = ({ children, className = "" }: PropsWithChildren<BaseProps>) => (
  <div className={`rounded-none border-x border-white/5 bg-zinc-950/40 backdrop-blur-3xl transition-all duration-300 ${className}`}>{children}</div>
);

export const NeonDivider = () => <div className="h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />;

export const StatusDot = ({ online }: { online: boolean }) => (
  <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400" : "bg-zinc-500"}`} />
);

export const AvatarPill = ({ label }: { label: string }) => (
  <div className="h-10 w-10 rounded-2xl bg-violet-500/30 text-sm font-semibold grid place-items-center">{label}</div>
);

export const StatChip = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-white/15 px-3 py-1.5 text-xs text-zinc-200">
    <span className="text-zinc-400">{label}</span> {value}
  </div>
);

export const FluxShell = ({
  children,
  showRightPanel = true,
}: PropsWithChildren<{ showRightPanel?: boolean }>) => (
  <div
    className={`mx-auto grid h-screen max-w-[1600px] gap-0 p-0 text-zinc-100 ${
      showRightPanel ? "grid-cols-[72px_360px_1fr_340px]" : "grid-cols-[72px_360px_1fr]"
    }`}
  >
    {children}
  </div>
);

export const NavSidebar = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => (
  <div className="flex flex-col items-center py-6 bg-black/40 border-r border-white/5 gap-4">
    <div className="mb-4">
      <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 grid place-items-center shadow-lg shadow-violet-500/20">
        <span className="font-bold text-lg italic">F</span>
      </div>
    </div>
    <NavIcon
      active={activeTab === "chats"}
      onClick={() => onTabChange("chats")}
      icon={<MessageSquare className="h-6 w-6" />}
      label="Чаты"
    />
    <NavIcon
      active={activeTab === "profile"}
      onClick={() => onTabChange("profile")}
      icon={<User className="h-6 w-6" />}
      label="Профиль"
    />
    <NavIcon
      active={activeTab === "notifications"}
      onClick={() => onTabChange("notifications")}
      icon={<Bell className="h-6 w-6" />}
      label="Уведомления"
    />
    <div className="mt-auto" />
    <NavIcon
      active={activeTab === "settings"}
      onClick={() => onTabChange("settings")}
      icon={<Settings className="h-6 w-6" />}
      label="Настройки"
    />
  </div>
);

const NavIcon = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`group relative p-3 rounded-2xl transition-all ${
      active ? "bg-violet-500/20 text-violet-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
    }`}
    title={label}
  >
    {icon}
    {active && (
      <motion.div
        layoutId="nav-active"
        className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-r-full"
      />
    )}
  </button>
);

export const Sidebar = ({ children }: PropsWithChildren) => (
  <GlassCard className="overflow-hidden">{children}</GlassCard>
);

export const CreateChatModal = ({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (userId: string, name: string) => void;
}) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const searchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?q=${query}`);
        if (res.ok) setUsers(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Начать новый чат</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full rounded-xl bg-black/40 border border-white/10 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-500/50"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-center text-xs text-zinc-500 py-4 italic">Ищем людей...</p>
          ) : users.length > 0 ? (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => onCreate(user.id, user.name)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
              >
                <AvatarPill label={user.name.slice(0, 2).toUpperCase()} />
                <div>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </div>
              </button>
            ))
          ) : query ? (
            <p className="text-center text-xs text-zinc-500 py-4">Никого не нашли :(</p>
          ) : (
            <p className="text-center text-xs text-zinc-500 py-4 italic">Введите имя для поиска</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const EmptyState = ({ label }: { label: string }) => (
  <GlassCard className="grid place-items-center p-5 text-sm text-zinc-400">{label}</GlassCard>
);

export const SidebarHeader = ({ title, onAddChat }: { title: string; onAddChat?: () => void }) => (
  <div className="px-5 pb-4 pt-5 flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-xs text-zinc-300/70">Hyper-Glass 2026 realtime channeling</p>
    </div>
    {onAddChat && (
      <button
        onClick={onAddChat}
        className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
        title="Новый чат"
      >
        <Plus className="h-5 w-5" />
      </button>
    )}
  </div>
);

export const SearchBar = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <label className="mx-4 mb-4 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/20 px-3 py-2">
    <Search className="h-4 w-4 text-zinc-400" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
      placeholder="Search chats, messages, media..."
    />
  </label>
);

export const FolderPill = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`rounded-2xl px-3 py-1.5 text-xs transition ${
      active ? "bg-violet-500/30 text-violet-100" : "bg-white/5 text-zinc-300 hover:bg-white/10"
    }`}
  >
    {label}
  </button>
);

export const FolderTabs = ({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (value: string) => void;
}) => (
  <div className="mx-4 mb-4 flex flex-wrap gap-2">
    {["ALL", "PERSONAL", "WORK", "AI", "CHANNEL"].map((item) => (
      <FolderPill key={item} label={item} active={item === active} onClick={() => onSelect(item)} />
    ))}
  </div>
);

export const ChatList = ({ children }: PropsWithChildren) => (
  <div className="space-y-2 px-3 pb-3">{children}</div>
);

export const ChatListItem = ({
  chat,
  active,
  onClick,
}: {
  chat: FluxChat;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full rounded-2xl p-3 text-left transition ${active ? "bg-violet-500/25" : "bg-white/5 hover:bg-white/10"}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <AvatarPill label={chat.avatar} />
        <div>
          <div className="text-sm font-semibold">{chat.title}</div>
          <div className="max-w-[210px] truncate text-xs text-zinc-400">{chat.lastMessagePreview}</div>
        </div>
      </div>
      <div className="text-right">
        {chat.unreadCount > 0 ? (
          <span className="rounded-full bg-violet-500/80 px-2 py-0.5 text-[10px]">{chat.unreadCount}</span>
        ) : null}
        {chat.pinned ? <Pin className="ml-auto mt-1 h-3.5 w-3.5 text-zinc-400" /> : null}
      </div>
    </div>
  </button>
);

export const ConnectionBadge = ({ online, queued }: { online: boolean; queued: number }) => (
  <div className="flex items-center gap-2 text-xs text-zinc-300">
    <StatusDot online={online} />
    {online ? "Synced" : "Offline queueing"}
    <span className="rounded-full border border-violet-300/25 px-2 py-0.5">{queued}</span>
  </div>
);

export const MessagePane = ({ children }: PropsWithChildren) => (
  <GlassCard className="flex min-h-0 flex-col overflow-hidden">{children}</GlassCard>
);

export const ChatHeader = ({
  title,
  participants,
  extraAction,
  onCall,
  onVideoCall,
}: {
  title: string;
  participants: string[];
  extraAction?: ReactNode;
  onCall?: () => void;
  onVideoCall?: () => void;
}) => (
  <div className="border-b border-white/10 px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-zinc-400">{participants.join(" • ")}</p>
      </div>
      <div className="flex items-center gap-2">
        {extraAction}
        <QuickActions onCall={onCall} onVideoCall={onVideoCall} />
      </div>
    </div>
  </div>
);

export const QuickActions = ({ onCall, onVideoCall }: { onCall?: () => void; onVideoCall?: () => void }) => (
  <div className="flex items-center gap-2">
    <IconAction onClick={onCall} icon={<Phone className="h-4 w-4" />} />
    <IconAction onClick={onVideoCall} icon={<Video className="h-4 w-4" />} />
    <IconAction icon={<Search className="h-4 w-4" />} />
  </div>
);

export const IconAction = ({ icon, onClick }: { icon: ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-200 hover:bg-white/10">{icon}</button>
);

export const PinnedBanner = ({ message }: { message: string }) => (
  <div className="mx-4 mt-4 rounded-2xl border border-violet-300/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-100">
    <span className="mr-1 text-xs uppercase text-violet-300">Pinned</span>
    {message}
  </div>
);

export const MessageScroll = ({ children }: PropsWithChildren) => (
  <motion.div layout className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
    {children}
  </motion.div>
);

export const MessageBubble = ({ 
  message, 
  mine,
  onImageClick
}: { 
  message: FluxMessage; 
  mine: boolean;
  onImageClick?: (url: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-lg shadow-black/5 group ${
      mine ? "ml-auto bg-violet-600/90 text-white rounded-tr-none" : "bg-zinc-800/80 text-zinc-100 rounded-tl-none border border-white/5"
    }`}
  >
    {message.mediaType === "image" && message.mediaUrl && (
      <div className="relative overflow-hidden rounded-xl mb-2 cursor-pointer group/img" onClick={() => onImageClick?.(message.mediaUrl!)}>
        <img src={message.mediaUrl} alt="media" className="max-h-60 w-full object-cover transition-transform group-hover/img:scale-105" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity grid place-items-center">
          <Maximize2 className="h-6 w-6 text-white" />
        </div>
      </div>
    )}
    {message.mediaType === "video" && message.mediaUrl && (
      <video src={message.mediaUrl} controls className="rounded-xl mb-2 max-h-60 w-full" />
    )}
    {message.mediaType === "audio" && message.mediaUrl && (
      <audio src={message.mediaUrl} controls className="mb-2 w-full h-10 filter invert brightness-200" />
    )}
    <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.decryptedBody}</div>
    <div className="mt-1 flex items-center justify-end gap-1.5 opacity-60">
      <span className="text-[10px] uppercase font-medium">
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      {mine && (
        <span className="text-[10px]">
          {message.status === "READ" ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
        </span>
      )}
    </div>
  </motion.div>
);

export const PhotoViewer = ({ url, onClose }: { url: string | null; onClose: () => void }) => (
  <AnimatePresence>
    {url && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <X className="h-6 w-6 text-white" />
        </button>
        <motion.img
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          src={url}
          className="max-w-full max-h-full rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

export const IncomingCallModal = ({ 
  from, 
  mode, 
  onAccept, 
  onReject 
}: { 
  from: string; 
  mode: string; 
  onAccept: () => void; 
  onReject: () => void;
}) => (
  <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-center"
    >
      <div className="h-20 w-20 rounded-full bg-violet-500/20 grid place-items-center mx-auto mb-4 border-2 border-violet-500/50">
        <User className="h-10 w-10 text-violet-400" />
      </div>
      <h3 className="text-xl font-bold mb-1">Входящий звонок</h3>
      <p className="text-zinc-400 text-sm mb-6">Тип: {mode === "video" ? "Видео" : "Аудио"}</p>
      
      <div className="flex gap-4">
        <button 
          onClick={onReject}
          className="flex-1 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-semibold"
        >
          Отклонить
        </button>
        <button 
          onClick={onAccept}
          className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/20"
        >
          Принять
        </button>
      </div>
    </motion.div>
  </div>
);

export const DeliveryBadge = ({ status }: { status: FluxMessage["status"] }) => (
  <span className="text-[10px] text-zinc-300/80">{status.toLowerCase()}</span>
);

export const ReactionRail = ({ reactions }: { reactions: FluxMessage["reactions"] }) => (
  <div className="flex flex-wrap gap-1">
    {reactions.map((reaction) => (
      <button key={reaction.emoji} className="rounded-full border border-white/10 px-2 py-0.5 text-[11px]">
        {reaction.emoji} {reaction.count}
      </button>
    ))}
  </div>
);

export const VoiceWaveform = ({ points }: { points: number[] }) => (
  <svg width="220" height="38" className="mt-2">
    {points.map((value, index) => (
      <rect
        key={`${value}-${index}`}
        x={index * 4.4}
        y={19 - value / 2}
        width="3"
        height={value}
        rx="2"
        className="fill-violet-300/80"
      />
    ))}
  </svg>
);

export const TypingIndicator = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="px-5 pb-2 text-xs text-zinc-400"
      >
        Typing with spring-physics…
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export const Composer = ({
  value,
  onChange,
  onSend,
  onAttach,
  onVoice,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onVoice?: () => void;
}) => (
  <div className="border-t border-white/10 px-4 py-4">
    <div className="flex items-center gap-2">
      <AttachmentButton onClick={onAttach} />
      <MessageInput value={value} onChange={onChange} onSend={onSend} />
      <VoiceButton onClick={onVoice} />
      <SendButton onClick={onSend} />
    </div>
  </div>
);

export const MessageInput = ({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
}) => (
  <input
    value={value}
    onChange={(event) => onChange(event.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend?.();
      }
    }}
    className="h-11 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none"
    placeholder="Write encrypted message…"
  />
);

export const SendButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/80 hover:bg-violet-600 transition-colors">
    <SendHorizontal className="h-4 w-4" />
  </button>
);

export const AttachmentButton = ({ onClick }: { onClick?: () => void }) => (
  <button onClick={onClick} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
    <Paperclip className="h-4 w-4" />
  </button>
);

export const VoiceButton = ({ onClick }: { onClick?: () => void }) => (
  <button onClick={onClick} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
    <Mic className="h-4 w-4" />
  </button>
);

export const ThreadPanel = ({ children }: PropsWithChildren) => <GlassCard className="p-4">{children}</GlassCard>;

export const ThreadReplyInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <input
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
    placeholder="Reply in thread..."
  />
);

export const AIInsightCard = ({ summary }: { summary: string }) => (
  <GlassCard className="p-4">
    <div className="mb-2 flex items-center gap-2 text-sm">
      <Shield className="h-4 w-4 text-violet-300" />
      AI Helper
    </div>
    <p className="text-xs leading-5 text-zinc-300">{summary}</p>
  </GlassCard>
);

export const CallOverlay = ({
  active,
  mode,
  onEnd,
  onShare,
  localStream,
  remoteStream,
  muted,
  cameraOff,
  toggleMute,
  toggleCamera,
}: {
  active: boolean;
  mode: string;
  onEnd: () => void;
  onShare: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, active]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, active]);

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-zinc-950/90 backdrop-blur-2xl flex flex-col"
      >
        <div className="flex-1 relative p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="relative aspect-video rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden shadow-2xl">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-xs font-medium">
              Собеседник
            </div>
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="h-20 w-20 rounded-full bg-violet-500/20 grid place-items-center animate-pulse">
                  <User className="h-10 w-10 text-violet-400" />
                </div>
                <p className="text-sm text-zinc-400">Ожидание подключения...</p>
              </div>
            )}
          </div>

          <div className="relative aspect-video rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-xs font-medium">
              Вы (Вы)
            </div>
            {cameraOff && (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <VideoOff className="h-12 w-12 text-zinc-700" />
              </div>
            )}
          </div>
        </div>

        <div className="h-32 flex items-center justify-center gap-6 px-6">
          <CallControlBtn onClick={toggleMute} active={!muted} icon={muted ? <MicOff /> : <Mic />} label={muted ? "Включить" : "Выключить"} />
          <CallControlBtn onClick={toggleCamera} active={!cameraOff} icon={cameraOff ? <VideoOff /> : <Video />} label={cameraOff ? "Включить" : "Выключить"} />
          <CallControlBtn onClick={onShare} active={mode === "screen"} icon={<Share />} label="Экран" />
          <button
            onClick={onEnd}
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors grid place-items-center shadow-xl shadow-red-500/20"
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const CallControlBtn = ({ onClick, active, icon, label }: { onClick: () => void; active: boolean; icon: ReactNode; label: string }) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onClick}
      className={`h-14 w-14 rounded-2xl grid place-items-center transition-all ${
        active ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 border border-red-500/20"
      }`}
    >
      {icon}
    </button>
    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{label}</span>
  </div>
);

export const GlobalSearchPanel = ({ query }: { query: string }) => (
  <GlassCard className="p-4">
    <h3 className="mb-2 text-sm font-semibold">Global Search</h3>
    <p className="text-xs text-zinc-400">Searching across encrypted index for “{query || "..." }”</p>
  </GlassCard>
);

export const SecurityPanel = () => (
  <GlassCard className="space-y-3 p-4">
    <h3 className="text-sm font-semibold">Privacy</h3>
    <EncryptionBadge />
    <SyncBadge />
  </GlassCard>
);

export const EncryptionBadge = () => (
  <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
    End-to-end encryption enabled (RSA-OAEP + AES-GCM)
  </div>
);

export const SyncBadge = () => (
  <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs">
    Delivery/read synchronization active
  </div>
);

export const SmartFolderPanel = () => (
  <GlassCard className="space-y-2 p-4">
    <h3 className="text-sm font-semibold">Smart Folders</h3>
    <div className="flex flex-wrap gap-2">
      <StatChip label="Personal" value="14" />
      <StatChip label="Work" value="23" />
      <StatChip label="AI" value="5" />
      <StatChip label="Channels" value="9" />
    </div>
  </GlassCard>
);

export const MediaPicker = () => (
  <GlassCard className="p-4">
    <h3 className="mb-3 text-sm font-semibold">Media Engine</h3>
    <p className="text-xs text-zinc-300">4K images, HLS streams, waveform voice clips, and secure upload pipeline.</p>
  </GlassCard>
);

export const ProfileSheet = ({ name, email, onSignOut }: { name?: string; email?: string; onSignOut?: () => void }) => (
  <GlassCard className="space-y-3 p-4">
    <h3 className="text-sm font-semibold">Profile</h3>
    <div className="flex items-center gap-3">
      <AvatarPill label={(name || "U").slice(0, 2).toUpperCase()} />
      <div>
        <p className="text-sm font-medium">{name || "You"}</p>
        <p className="text-xs text-zinc-400">{email || "sovereign@flux.app"}</p>
      </div>
    </div>
    {onSignOut && (
      <button
        onClick={onSignOut}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        Sign Out
      </button>
    )}
  </GlassCard>
);

export const ToggleField = ({ label, enabled }: { label: string; enabled: boolean }) => (
  <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs">
    {label}
    <span className={`h-5 w-9 rounded-full ${enabled ? "bg-violet-500/80" : "bg-zinc-500/40"}`} />
  </div>
);

export const SliderField = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-white/10 px-3 py-2 text-xs">
    <div className="mb-2 flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-2 rounded-full bg-white/10">
      <div className="h-2 rounded-full bg-violet-400" style={{ width: `${value}%` }} />
    </div>
  </div>
);

export const SettingsPanel = () => (
  <GlassCard className="space-y-2 p-4">
    <h3 className="text-sm font-semibold">Settings</h3>
    <ToggleField label="Adaptive theme engine" enabled />
    <ToggleField label="Offline queueing" enabled />
    <ToggleField label="Auto summarize unread" enabled />
    <SliderField label="Blur intensity" value={88} />
  </GlassCard>
);

export const VoiceRecorder = ({ onSend, onCancel }: { onSend: (blob: Blob) => void; onCancel: () => void }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onSend(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setRecording(true);
      setDuration(0);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 bg-violet-600/20 px-4 py-2 rounded-2xl border border-violet-500/30 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-mono text-violet-100">{formatTime(duration)}</span>
      </div>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-violet-400"
          animate={{ width: ["0%", "100%"] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400">
          <X className="h-5 w-5" />
        </button>
        <button 
          onClick={recording ? stopRecording : startRecording}
          className={`h-10 w-10 rounded-xl grid place-items-center transition-all ${
            recording ? "bg-red-500 shadow-lg shadow-red-500/20" : "bg-violet-500"
          }`}
        >
          {recording ? <Check className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
        </button>
      </div>
    </div>
  );
};
