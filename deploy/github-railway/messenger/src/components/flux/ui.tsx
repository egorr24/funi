"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic, Paperclip, Phone, Pin, Search, SendHorizontal, Shield, Video, Plus, X, MessageSquare, Settings, User, Bell, Check, CheckCheck, Maximize2, MicOff, VideoOff, PhoneOff, Share, Reply } from "lucide-react";
import { PropsWithChildren, ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { FluxChat, FluxMessage } from "@/src/types/flux";

type LinkPreviewData = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
};

const LinkPreview = ({ data }: { data: LinkPreviewData }) => {
  if (!data.title && !data.description && !data.image) return null; // Don't render if no useful data

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 mt-2 border border-white/10 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
    >
      {data.image && (
        <img src={data.image} alt="Preview" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
      )}
      <div className="flex-1 overflow-hidden">
        {data.title && <div className="text-sm font-semibold truncate">{data.title}</div>}
        {data.description && (
          <div className="text-xs text-zinc-400 line-clamp-2">{data.description}</div>
        )}
        <div className="text-[10px] text-violet-400 truncate mt-1">{new URL(data.url).hostname}</div>
      </div>
    </a>
  );
};

type BaseProps = {
  className?: string;
};

type ChatSearchUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

export const BetaWelcomeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-900 p-8 shadow-2xl text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="h-20 w-20 rounded-3xl bg-violet-500/20 flex items-center justify-center mx-auto mb-6 border border-violet-500/30">
            <Shield className="h-10 w-10 text-violet-400" />
          </div>
          <h2 className="text-2xl font-black mb-3 tracking-tight text-white uppercase">Beta Version 1.0</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Мы очень старались сделать защиту максимально надежной. 
            Это бета-тест системы <span className="text-violet-400 font-bold tracking-widest">NEURAL GHOST</span>. 
            Спасибо, что вы с нами!
          </p>
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20 active:scale-95"
          >
            ПОНЯТНО
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const TimerConfigModal = ({ 
  isOpen, 
  onClose, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (seconds: number) => void;
}) => {
  if (!isOpen) return null;
  const options = [
    { label: '10 секунд', value: 10 },
    { label: '30 секунд', value: 30 },
    { label: '1 минута', value: 60 },
    { label: '5 минут', value: 300 },
  ];

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
      >
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4 text-center">Время просмотра</h3>
        <div className="space-y-2">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onSelect(opt.value);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-sm font-medium hover:bg-violet-500/20 hover:border-violet-500/30 transition-all active:scale-95"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest hover:text-white transition-colors">Отмена</button>
      </motion.div>
    </div>
  );
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
    className={`mx-auto flex h-screen h-screen-safe max-w-[1600px] text-zinc-100 overflow-hidden relative w-full bg-[radial-gradient(circle_at_15%_20%,rgba(168,85,247,0.2),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_35%),linear-gradient(160deg,#070510_0%,#0b0816_45%,#050308_100%)]`}
  >
    {children}
  </div>
);

export const NavSidebar = ({
  activeTab,
  onTabChange,
  className = "",
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}) => (
  <div className={`flex lg:flex-col items-center lg:py-8 bg-black/35 border-r border-white/10 gap-6 fixed bottom-0 left-0 right-0 h-20 lg:static lg:h-auto lg:w-[100px] z-50 safe-area-inset pb-safe backdrop-blur-2xl supports-[backdrop-filter]:bg-black/25 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] lg:shadow-none ${className}`}>
    <div className="flex lg:flex-col items-center justify-around lg:justify-start gap-8 w-full lg:w-auto px-4 lg:px-0">
      <NavIcon
        active={activeTab === "chats"}
        onClick={() => onTabChange("chats")}
        icon={<MessageSquare className="h-6 w-6 lg:h-7 lg:w-7" />}
        label="Чаты"
      />
      <NavIcon
        active={activeTab === "profile"}
        onClick={() => onTabChange("profile")}
        icon={<User className="h-6 w-6 lg:h-7 lg:w-7" />}
        label="Профиль"
      />
      <NavIcon
        active={activeTab === "notifications"}
        onClick={() => onTabChange("notifications")}
        icon={<Bell className="h-6 w-6 lg:h-7 lg:w-7" />}
        label="Уведомления"
      />
      <NavIcon
        active={activeTab === "settings"}
        onClick={() => onTabChange("settings")}
        icon={<Settings className="h-6 w-6 lg:h-7 lg:w-7" />}
        label="Настройки"
      />
    </div>
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
    className="group relative flex flex-col items-center gap-1 transition-all duration-300"
  >
    <div
      className={`relative h-14 w-14 rounded-[22px] flex items-center justify-center transition-all duration-300 ${
        active 
          ? "bg-[#2d1b4d] text-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
      }`}
    >
      {active && (
        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#a855f7] rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
      )}
      {icon}
    </div>
  </button>
);

export const Sidebar = ({ children, className = "" }: PropsWithChildren<BaseProps>) => (
  <aside className={`flex flex-col border-r border-violet-300/20 bg-gradient-to-b from-[#1a1030]/55 via-[#100b1f]/50 to-[#090713]/65 lg:w-[360px] shrink-0 backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${className}`}>{children}</aside>
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
  const [users, setUsers] = useState<ChatSearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchUsers = useCallback(async (rawQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?q=${encodeURIComponent(rawQuery)}`);
      if (res.ok) {
        const payload = await res.json();
        setUsers(Array.isArray(payload) ? payload : []);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setHasSearched(false);
    const timer = setTimeout(() => {
      void searchUsers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen, searchUsers]);

  useEffect(() => {
    if (isOpen) return;
    setQuery("");
    setUsers([]);
    setHasSearched(false);
  }, [isOpen]);

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
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void searchUsers(query);
                }
              }}
              placeholder="Поиск по имени или email..."
              className="w-full rounded-xl bg-black/40 border border-white/10 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-500/50"
            />
          </div>
          <button
            onClick={() => void searchUsers(query)}
            className="rounded-xl border border-violet-400/40 bg-violet-500/20 px-4 text-sm font-medium text-violet-100 hover:bg-violet-500/30 transition-colors"
          >
            Найти
          </button>
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
                <AvatarPill label={(user.name || "?").slice(0, 2).toUpperCase()} />
                <div>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </div>
              </button>
            ))
          ) : hasSearched ? (
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

// Sidebar Header Component
export const SidebarHeader = ({
  title,
  onAddChat,
  onBack,
  onCreateGroup,
}: {
  title: string;
  onAddChat?: () => void;
  onBack?: () => void;
  onCreateGroup?: () => void;
}) => (
  <div className="px-4 lg:px-5 pb-3 lg:pb-4 pt-4 lg:pt-5 flex flex-col gap-1">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        {onBack && (
          <button onClick={onBack} className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-xl transition-colors shrink-0">
            <X className="h-5 w-5 rotate-90" />
          </button>
        )}
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight truncate">{title}</h1>
      </div>
      <div className="flex gap-2 shrink-0">
        {onCreateGroup && (
          <button
            onClick={onCreateGroup}
            className="grid h-9 w-9 lg:h-10 lg:w-10 place-items-center rounded-xl lg:rounded-2xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            title="Создать группу"
          >
            <User className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        )}
        {onAddChat && (
          <button
            onClick={onAddChat}
            className="grid h-9 w-9 lg:h-10 lg:w-10 place-items-center rounded-xl lg:rounded-2xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
            title="Новый чат"
          >
            <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        )}
      </div>
    </div>
    <p className="text-[10px] lg:text-xs text-zinc-300/70 truncate">Hyper-Glass 2026 realtime channeling</p>
  </div>
);

export const SearchBar = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <label className="mx-3 lg:mx-4 mb-3 lg:mb-4 flex items-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-black/30 to-violet-500/15 px-3 py-2.5 shadow-[0_12px_35px_rgba(0,0,0,0.28)] backdrop-blur-xl">
    <Search className="h-4 w-4 text-zinc-400" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
      placeholder="Поиск чатов, сообщений, медиа..."
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
    {["ALL", "PERSONAL", "WORK", "AI", "SAVED"].map((item) => (
      <FolderPill key={item} label={item === "SAVED" ? "⭐️ ИЗБРАННОЕ" : item} active={item === active} onClick={() => onSelect(item)} />
    ))}
  </div>
);

export const ChatList = ({ children }: PropsWithChildren) => (
  <div className="space-y-2.5 px-2.5 lg:px-3 pb-3 flex-1 overflow-y-auto">{children}</div>
);

export const ChatListItem = ({
  chat,
  active,
  onClick,
  isOnline = false,
  onMute,
}: {
  chat: FluxChat;
  active: boolean;
  onClick: () => void;
  isOnline?: boolean;
  onMute?: () => void;
}) => {
  const folderGlow = {
    PERSONAL: "from-violet-500/30 via-fuchsia-500/20 to-transparent",
    WORK: "from-indigo-500/30 via-violet-500/15 to-transparent",
    AI: "from-purple-500/35 via-violet-500/20 to-transparent",
    CHANNEL: "from-pink-500/30 via-purple-500/20 to-transparent",
    SAVED: "from-violet-400/35 via-fuchsia-400/20 to-transparent",
  }[chat.folder] || "from-violet-500/25 via-fuchsia-500/10 to-transparent";

  return (
    <button
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onMute?.();
      }}
      className={`w-full rounded-2xl p-3 text-left transition-all duration-200 relative group border overflow-hidden ${active ? "bg-white/10 border-violet-300/40 shadow-[0_12px_36px_rgba(139,92,246,0.35)]" : "bg-white/5 hover:bg-white/10 border-violet-300/10 hover:border-violet-300/20"}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${folderGlow} opacity-80 pointer-events-none`} />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AvatarPill label={chat.avatar} />
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-zinc-100">{chat.title}</div>
              {chat.isMuted && <Bell className="h-3 w-3 text-zinc-400" />}
            </div>
            <div className="max-w-[210px] truncate text-xs text-zinc-200/80">{chat.lastMessagePreview}</div>
            <div className="max-w-[210px] truncate text-[10px] text-violet-200/70 mt-0.5">
              {chat.participants.slice(0, 3).join(" • ")}
            </div>
          </div>
        </div>
        <div className="text-right pl-2">
          {chat.unreadCount > 0 ? (
            <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.45)]">{chat.unreadCount}</span>
          ) : null}
          <div className="flex flex-col items-end gap-1 mt-1">
            {chat.pinned && <Pin className="h-3.5 w-3.5 text-violet-200/80" />}
            <div className="text-[9px] text-zinc-400">
              {new Date(chat.updatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-[9px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {isOnline ? "онлайн" : "был недавно"}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export const ConnectionBadge = ({ online, queued }: { online: boolean; queued: number }) => (
  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur-md">
    <StatusDot online={online} />
    <span>{online ? "Online" : "Offline"}</span>
    {queued > 0 && <span className="rounded-full border border-violet-300/25 px-1.5 py-0.5 text-[9px] text-violet-200">{queued}</span>}
  </div>
);

export const MessagePane = ({ children, className = "" }: PropsWithChildren<BaseProps>) => (
  <main className={`flex flex-col bg-gradient-to-b from-black/30 via-violet-950/10 to-black/30 backdrop-blur-2xl h-full overflow-hidden flex-1 border-l border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}>{children}</main>
);

export const ChatHeader = ({
  title,
  participants,
  extraAction,
  onCall,
  onVideoCall,
  onShareLink,
  onBack,
  onSearchChange,
  searchValue = "",
}: {
  title: string;
  participants: string[];
  extraAction?: ReactNode;
  onCall?: () => void;
  onVideoCall?: () => void;
  onShareLink?: () => void;
  onBack?: () => void;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
}) => (
  <div className="border-b border-white/10 px-3 lg:px-6 py-3.5 lg:py-4 bg-white/[0.03] backdrop-blur-xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="h-5 w-5 rotate-90" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-[10px] text-zinc-400 mt-0.5">{participants.join(" • ")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onSearchChange && (
          <div className="relative mr-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск сообщений..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-32 lg:w-48 h-8 pl-8 pr-3 bg-white/5 border border-white/5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>
        )}
        <div className="hidden lg:block">
          {extraAction}
        </div>
        <QuickActions onCall={onCall} onVideoCall={onVideoCall} onShareLink={onShareLink} />
      </div>
    </div>
  </div>
);

export const QuickActions = ({ onCall, onVideoCall, onShareLink }: { onCall?: () => void; onVideoCall?: () => void; onShareLink?: () => void }) => (
  <div className="flex items-center gap-1 lg:gap-2">
    <IconAction onClick={onCall} icon={<Phone className="h-4 w-4" />} />
    <IconAction onClick={onVideoCall} icon={<Video className="h-4 w-4" />} />
    <IconAction onClick={onShareLink} icon={<Share className="h-4 w-4" />} />
  </div>
);

export const IconAction = ({ icon, onClick }: { icon: ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="rounded-xl border border-white/15 bg-white/10 p-2 text-zinc-200 hover:bg-white/20 backdrop-blur-md">{icon}</button>
);

export const PinnedBanner = ({ message }: { message: string }) => (
  <div className="mx-3 lg:mx-4 mt-3 lg:mt-4 rounded-2xl border border-violet-300/35 bg-violet-500/15 px-4 py-2 text-sm text-violet-100 backdrop-blur-md">
    <span className="mr-1 text-xs uppercase text-violet-300">Pinned</span>
    {message}
  </div>
);

export const MessageScroll = ({
  children,
  onScroll,
  scrollRef,
}: PropsWithChildren<{ onScroll?: (event: React.UIEvent<HTMLDivElement>) => void; scrollRef?: React.Ref<HTMLDivElement> }>) => (
  <motion.div
    ref={scrollRef}
    onScroll={onScroll}
    layout
    className="flex-1 overflow-y-auto px-3 lg:px-4 py-3 lg:py-4 flex flex-col"
  >
    {children}
  </motion.div>
);

export const MoireOverlay = ({ viewerName }: { viewerName?: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-30 select-none">
    {/* НЕЙРОННЫЙ ПРИЗРАК: Высокочастотные микро-вспышки (v8 Light Spectrum) */}
    <motion.div 
      className="absolute inset-0 bg-white mix-blend-overlay"
      animate={{ 
        opacity: [0, 0.03, 0, 0.05, 0],
        backgroundColor: ["#fff", "#f8fafc", "#fff", "#f1f5f9", "#fff"] 
      }}
      transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
    />

    {/* ДИНАМИЧЕСКИЙ ГРИД С ПОСТОЯННОЙ СМЕНОЙ ФАЗЫ (Anti-Focus Light) */}
    <motion.div 
      className="absolute inset-[-200%] opacity-10"
      animate={{ 
        rotate: [0, 360],
        scale: [1, 1.02, 1]
      }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      style={{
        backgroundImage: `radial-gradient(circle, #000 0.3px, transparent 0.3px)`,
        backgroundSize: '6px 6px'
      }}
    />

    {/* КВАНТОВЫЙ ВОДЯНОЙ ЗНАК С ЦВЕТОВЫМ ШИФТОМ (v8 Inverse) */}
    <div className="absolute inset-0 flex flex-col justify-around">
      {[1, 2, 3].map(i => (
        <motion.div 
          key={i}
          className="whitespace-nowrap text-[8px] font-black uppercase tracking-[1.5em]"
          style={{ color: i % 2 === 0 ? '#6366f1' : '#8b5cf6' }}
          animate={{ 
            x: i % 2 === 0 ? ["-100%", "100%"] : ["100%", "-100%"],
            opacity: [0.03, 0.1, 0.03]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          {Array(5).fill(`• INVERSE PHANTOM ACTIVE • v8 • ${viewerName || 'ENCRYPTED'} • `).join("")}
        </motion.div>
      ))}
    </div>
  </div>
);

export const SecureCanvasImage = ({ url, revealed, viewerName }: { url: string, revealed: boolean, viewerName?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const frameCounter = useRef(0);

  useEffect(() => {
    if (!revealed || !url || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    
    img.onload = () => {
      const containerWidth = canvas.parentElement?.clientWidth || 400;
      const scale = containerWidth / img.width;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // ULTRA NEURAL GHOST (v12: Final Professional Protection)
      // Разработано для идеальной видимости глазом и полного разрушения изображения на камере
      const sliceCount = 128;

      const render = () => {
        frameCounter.current++;
        const sliceWidth = canvas.width / sliceCount;

        // 1. BLACK RESET (Основа для сброса экспозиции и контраста)
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. HFTLM & CHROMATIC VECTOR ROTATION
        // Чередуем яркость и фазу цвета для ослепления камеры
        const phase = frameCounter.current % 2;
        const hueShift = phase === 0 ? 8 : -8; // Минимальный сдвиг для глаза, критичный для камеры
        const luma = phase === 0 ? 1.0 : 0.85; // Пульсация яркости для обмана HDR

        for (let i = 0; i < sliceCount; i++) {
          const x = i * sliceWidth;
          const isMainPhase = (i % 2 === phase);
          
          if (isMainPhase) {
            ctx.filter = `hue-rotate(${hueShift}deg) brightness(${luma}) saturate(1.1)`;
            ctx.globalAlpha = 1.0;
          } else {
            // Пассивная фаза для плавности восприятия глазом
            ctx.filter = `hue-rotate(${-hueShift}deg) brightness(${0.4 * luma})`;
            ctx.globalAlpha = 0.35;
          }
          
          ctx.drawImage(
            img, 
            (i * img.width) / sliceCount, 0, img.width / sliceCount, img.height,
            x, 0, sliceWidth, canvas.height
          );
        }
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;

        // 3. DYNAMIC MOIRE LATTICE (Sensor Aliasing)
        // Тонкая сетка, создающая аппаратный муар на матрице
        ctx.fillStyle = phase === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
        for (let y = 0; y < canvas.height; y += 3) {
          for (let x = (frameCounter.current % 4); x < canvas.width; x += 4) {
            ctx.fillRect(x, y, 1, 1);
          }
        }

        // 4. LUMINANCE JITTER (Anti-Exposure)
        const flash = Math.random() > 0.98 ? 0.1 : 0;
        if (flash > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 5. STABLE REFRESH
        const jitter = 0.5 + Math.random() * 0.5;
        setTimeout(() => {
            animationRef.current = requestAnimationFrame(render);
        }, jitter); 
      };
      
      render();
    };

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [url, revealed]);

  return (
    <div className="relative w-full overflow-hidden min-h-[250px] bg-zinc-950 border border-white/5 rounded-xl">
      <canvas 
        ref={canvasRef} 
        className={`w-full h-auto transition-opacity duration-300 ${!revealed ? "opacity-0" : "opacity-100"}`}
      />
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black transition-colors duration-500">
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-16 w-16 rounded-[24px] bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4"
          >
            <Shield className="h-8 w-8 text-violet-400" />
          </motion.div>
          <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] mb-2">Final Protocol Active</p>
          <p className="text-[9px] text-zinc-500 text-center leading-relaxed italic">
            Технология темпоральной хроматической аберрации. Изображение существует только в вашем восприятии.
          </p>
        </div>
      )}
    </div>
  );
};

const renderInlineRichText = (text: string, keyPrefix: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s]+|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let index = 0;
  for (const match of text.matchAll(tokenRegex)) {
    const full = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    if (match[3]) {
      parts.push(
        <a
          key={`${keyPrefix}-mdlink-${index}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-violet-300/70 underline-offset-2 text-violet-200 hover:text-violet-100 break-all"
        >
          {match[2]}
        </a>
      );
    } else if (full.startsWith("http://") || full.startsWith("https://")) {
      const cleanUrl = full.replace(/[),.!?;:]+$/, "");
      const trailing = full.slice(cleanUrl.length);
      parts.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          href={cleanUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-violet-300/70 underline-offset-2 text-violet-200 hover:text-violet-100 break-all"
        >
          {cleanUrl}
        </a>
      );
      if (trailing) {
        parts.push(trailing);
      }
    } else if (match[4]) {
      parts.push(<strong key={`${keyPrefix}-bold-${index}`} className="font-bold text-white">{match[4]}</strong>);
    } else if (match[5]) {
      parts.push(<em key={`${keyPrefix}-italic-${index}`} className="italic text-zinc-100">{match[5]}</em>);
    } else if (match[6]) {
      parts.push(
        <code key={`${keyPrefix}-code-${index}`} className="rounded-md bg-black/35 border border-white/10 px-1.5 py-0.5 font-mono text-[0.84em] text-violet-100">
          {match[6]}
        </code>
      );
    }
    lastIndex = start + full.length;
    index += 1;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
};

const renderRichText = (text: string) => {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="my-1 space-y-0.5 list-disc pl-4 marker:text-violet-300/80">
        {listBuffer.map((item, index) => (
          <li key={`${key}-${index}`} className="leading-relaxed">
            {renderInlineRichText(item, `${key}-${index}`)}
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };
  lines.forEach((line, index) => {
    const itemMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (itemMatch) {
      listBuffer.push(itemMatch[1]);
      return;
    }
    flushList(`list-${index}`);
    if (!line.trim()) {
      blocks.push(<div key={`sp-${index}`} className="h-2" />);
      return;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const textValue = heading[2];
      const headingClass = level === 1 ? "text-base font-black" : level === 2 ? "text-[15px] font-bold" : "text-sm font-semibold";
      blocks.push(
        <div key={`h-${index}`} className={`${headingClass} mt-1 mb-0.5`}>
          {renderInlineRichText(textValue, `h-${index}`)}
        </div>
      );
      return;
    }
    blocks.push(
      <div key={`p-${index}`} className="leading-relaxed break-words">
        {renderInlineRichText(line, `p-${index}`)}
      </div>
    );
  });
  flushList("list-end");
  return blocks;
};

export const MessageBubble = ({ 
  message, 
  mine,
  showSender = false,
  compactTop = false,
  compactBottom = false,
  onImageClick,
  onReaction,
  onReply,
  onDelete,
  onEdit,
  onForward,
  viewerName
}: { 
  message: FluxMessage; 
  mine: boolean;
  showSender?: boolean;
  compactTop?: boolean;
  compactBottom?: boolean;
  onImageClick?: (url: string) => void;
  onReaction?: (emoji: string) => void;
  onReply?: () => void;
  onDelete?: () => void;
  onEdit?: (newBody: string) => void;
  onForward?: () => void;
  viewerName?: string;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [peekTimer, setPeekTimer] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.decryptedBody || "");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const swipeThreshold = 56;
  const [touchSwipeActive, setTouchSwipeActive] = useState(false);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreviewData[]>([]);
  const bubbleShapeClass = mine
    ? `${compactTop ? "rounded-tr-xl" : "rounded-tr-none"} ${compactBottom ? "rounded-br-xl" : "rounded-br-[24px]"}`
    : `${compactTop ? "rounded-tl-xl" : "rounded-tl-none"} ${compactBottom ? "rounded-bl-xl" : "rounded-bl-[24px]"}`;

  useEffect(() => {
    const fetchLinkPreviews = async () => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = (message.decryptedBody || message.encryptedBody || "").match(urlRegex);
      if (urls && urls.length > 0) {
        const dedupedUrls = Array.from(new Set(urls.map((url) => url.replace(/[),.!?;:]+$/, ""))));
        const previews: LinkPreviewData[] = [];
        for (const url of dedupedUrls) {
          try {
            const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            if (response.ok) {
              const data = await response.json() as LinkPreviewData;
              if (data.title || data.description || data.image) {
                previews.push({ ...data, url });
              }
            }
          } catch {
            continue;
          }
        }
        setLinkPreviews(previews);
      } else {
        setLinkPreviews([]);
      }
    };

    void fetchLinkPreviews();
  }, [message.decryptedBody]);

  // Обработка таймера и удаления
  useEffect(() => {
    if (peekTimer !== null && peekTimer > 0) {
      const t = setTimeout(() => setPeekTimer(peekTimer - 1), 1000);
      return () => clearTimeout(t);
    } else if (peekTimer === 0) {
      onDelete?.();
    }
  }, [peekTimer, onDelete]);



  const handleStartPeek = () => {
    if (!message.isSecure || peekTimer !== null) return;
    setPeekTimer(30); // 30 секунд на просмотр
    setIsRevealed(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleEditSave = () => {
    if (editValue.trim() && editValue !== message.decryptedBody) {
      onEdit?.(editValue);
    }
    setIsEditing(false);
  };

  const handlePanStart = (event: any) => {
    const pointerType = event?.pointerType ?? event?.nativeEvent?.pointerType;
    setTouchSwipeActive(pointerType === "touch");
  };

  const handlePan = (event: any, info: any) => {
    if (info.offset.x > 0) {
      setSwipeX(Math.min(info.offset.x, swipeThreshold + 20));
    } else {
      setSwipeX(0);
    }
  };

  const handlePanEnd = (event: any, info: any) => {
    if (info.offset.x >= swipeThreshold) {
      onReply?.();
    }
    setSwipeX(0);
  };

  return (
    <div className={`group relative flex items-end gap-2 px-1 lg:px-2 ${mine ? "flex-row-reverse" : "flex-row"} ${compactTop ? "mt-0.5" : "mt-3 lg:mt-4"} mb-0.5`}>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: swipeThreshold + 20 }}
        dragElastic={0.1}
        onDragStart={handlePanStart}
        onDrag={handlePan}
        onDragEnd={handlePanEnd}
        style={{ x: swipeX }}
        className={`relative max-w-[85%] lg:max-w-[70%] transition-transform duration-200`}
      >
        {/* Reply Indicator Background */}
        <div 
          className="absolute right-full top-1/2 -translate-y-1/2 pr-4 opacity-0 transition-opacity"
          style={{ opacity: swipeX / swipeThreshold }}
        >
          <div className="rounded-full bg-violet-500/20 p-2 text-violet-400">
            <Reply className="h-4 w-4" />
          </div>
        </div>

        <div className={`relative overflow-hidden ${bubbleShapeClass} ${mine ? "bg-violet-600 text-white shadow-lg shadow-violet-600/10" : "bg-white/10 text-zinc-100 border border-white/5"} px-3.5 py-2.5 lg:px-4 lg:py-3 shadow-sm`}>
          {showSender && !mine && (
            <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1.5 px-0.5">
              {message.senderName}
            </div>
          )}
          
          {message.replyTo && (
            <div className="mb-2 border-l-2 border-white/20 bg-white/5 p-2 rounded-lg text-xs opacity-80 cursor-pointer hover:bg-white/10 transition-colors">
              <div className="font-bold text-[10px] uppercase tracking-wider mb-0.5">В ответ на</div>
              <div className="truncate italic">"{message.replyTo.body}"</div>
            </div>
          )}

          {message.type === "IMAGE" && message.mediaUrl && (
            <div className="mb-2 -mx-1 -mt-1 rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" onClick={() => onImageClick?.(message.mediaUrl!)}>
              {message.isSecure ? (
                <SecureCanvasImage url={message.mediaUrl} revealed={isRevealed} viewerName={viewerName} />
              ) : (
                <img src={message.mediaUrl} alt="Media" className="w-full h-auto object-cover max-h-[350px]" />
              )}
            </div>
          )}

          {message.type === "VOICE" && message.mediaUrl && (
            <div className="flex items-center gap-3 py-1.5 min-w-[180px]">
              <button onClick={togglePlay} className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${mine ? "bg-white/20 text-white hover:bg-white/30" : "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"}`}>
                {isPlaying ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <div className="flex-1 space-y-1.5">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${mine ? "bg-white" : "bg-violet-500"}`}
                    animate={{ width: isPlaying ? "100%" : "0%" }}
                    transition={{ duration: 15, ease: "linear" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] opacity-60 font-medium">
                  <span>0:15</span>
                  <span>Voice message</span>
                </div>
              </div>
              <audio ref={audioRef} src={message.mediaUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
            </div>
          )}

          {isEditing ? (
            <div className="space-y-2 py-1">
              <textarea
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/30 resize-none min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleEditSave();
                  }
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white">Отмена</button>
                <button onClick={handleEditSave} className="px-3 py-1 rounded-lg bg-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white/30 transition-colors">Сохранить</button>
              </div>
            </div>
          ) : (
            <div className="text-[14px] lg:text-[15px] whitespace-pre-wrap">
              {renderRichText(message.decryptedBody || message.encryptedBody)}
            </div>
          )}

          {linkPreviews.length > 0 && (
            <div className="space-y-2 mt-2">
              {linkPreviews.map((preview, idx) => (
                <LinkPreview key={idx} data={preview} />
              ))}
            </div>
          )}

          <div className={`mt-1.5 flex items-center gap-2 text-[10px] font-medium ${mine ? "text-white/60" : "text-zinc-500"}`}>
            <span>{new Date(message.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
            {message.isEdited && <span className="italic">ред.</span>}
            {mine && (
              <span className="flex items-center">
                {message.isRead ? <CheckCheck className="h-3.5 w-3.5 text-white" /> : <Check className="h-3.5 w-3.5" />}
              </span>
            )}
          </div>

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((r, idx) => (
                <button 
                  key={idx}
                  onClick={() => onReaction?.(r.emoji)}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border transition-all ${r.count > 0 ? "bg-violet-500/20 border-violet-500/40 text-violet-200" : "bg-white/5 border-white/5 text-zinc-400"}`}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span className="font-bold">{r.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {message.isSecure && !isRevealed && (
          <button 
            onClick={handleStartPeek}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300 hover:bg-violet-500/20 transition-all active:scale-95 shadow-lg shadow-violet-500/10"
          >
            <Shield className="h-3.5 w-3.5" />
            Раскрыть сообщение
          </button>
        )}

        {peekTimer !== null && (
          <div className="mt-2 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Самоуничтожение через:</span>
            </div>
            <span className="text-xs font-mono font-black text-white bg-red-500/20 px-2 py-0.5 rounded-md border border-red-500/30">{peekTimer}s</span>
          </div>
        )}
      </motion.div>

      {/* Message Actions Menu (Desktop Hover) */}
      <div className={`flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center ${mine ? "mr-1" : "ml-1"}`}>
        <button onClick={() => onReply?.()} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors" title="Ответить">
          <Reply className="h-3.5 w-3.5" />
        </button>
        {mine && (
          <>
            <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors" title="Изменить">
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors" title="Удалить">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const Composer = ({
  value,
  onChange,
  onSend,
  onAttach,
  onAttachSecure,
  onVoiceStart,
  isRecording = false,
  onTimerClick,
  activeTimer = 0,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onAttach?: () => void;
  onAttachSecure?: () => void;
  onVoiceStart?: () => void;
  isRecording?: boolean;
  onTimerClick?: () => void;
  activeTimer?: number;
}) => {
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  return (
    <div className="p-3 md:p-4 bg-zinc-950/40 backdrop-blur-xl border-t border-white/5 flex items-end gap-2 md:gap-3 z-10 relative pb-safe">
      <div className="relative">
        <button 
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className={`p-2.5 md:p-3 rounded-2xl transition-all group ${showAttachMenu ? "bg-violet-500/20 text-violet-400" : "hover:bg-white/5 text-zinc-400 hover:text-white"}`}
        >
          <Paperclip className={`w-5 h-5 transition-transform ${showAttachMenu ? "rotate-45" : "group-hover:rotate-12"}`} />
        </button>

        <AnimatePresence>
          {showAttachMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-4 w-56 rounded-3xl border border-white/10 bg-zinc-900 p-2 shadow-2xl backdrop-blur-xl z-50"
            >
              <button
                onClick={() => {
                  onAttach?.();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Обычное</div>
                  <div className="text-[10px] text-zinc-500">Фото или документ</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAttachSecure?.();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Защищенное</div>
                  <div className="text-[10px] text-zinc-500">Temporal Phantom v8</div>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex-1 relative group">
      <textarea
        value={value}
        onChange={onChange}
        placeholder="Сообщение..."
        rows={1}
        className="w-full bg-white/5 border border-white/10 rounded-[22px] md:rounded-[24px] px-4 md:px-5 py-2.5 md:py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none placeholder:text-zinc-600"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
    </div>

    {value.trim() ? (
      <button
        onClick={() => onSend()}
        className="p-3 md:p-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl shadow-lg shadow-violet-600/20 transition-all active:scale-95"
      >
        <SendHorizontal className="w-5 h-5" />
      </button>
    ) : (
      <button 
        onClick={onVoiceStart}
        className={`p-3 md:p-3.5 rounded-2xl transition-all active:scale-95 ${
          isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-zinc-400 hover:text-white"
        }`}
      >
        <Mic className="w-5 h-5" />
      </button>
    )}
  </div>
  );
};

export const VideoCallOverlay = ({ 
  isOpen, 
  onClose, 
  peerName,
  peerAvatar,
  isVideo = true
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  peerName: string;
  peerAvatar: string;
  isVideo?: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6">
      <div className="relative mb-12">
        <div className="h-32 w-32 rounded-[48px] bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
          <AvatarPill label={peerAvatar} />
        </div>
        <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center border-4 border-black animate-pulse">
          <Phone className="h-5 w-5 text-white" />
        </div>
      </div>
      
      <h2 className="text-3xl font-black mb-2 tracking-tight text-white uppercase">{peerName}</h2>
      <p className="text-violet-400 font-bold tracking-[0.3em] text-xs uppercase mb-16 animate-pulse">
        {isVideo ? "Входящий видеозвонок..." : "Входящий аудиозвонок..."}
      </p>

      <div className="flex gap-8">
        <button 
          onClick={onClose}
          className="h-20 w-20 rounded-[32px] bg-red-500 flex items-center justify-center text-white shadow-2xl shadow-red-500/20 hover:scale-110 active:scale-95 transition-all"
        >
          <PhoneOff className="h-8 w-8" />
        </button>
        <button 
          className="h-20 w-20 rounded-[32px] bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all"
        >
          {isVideo ? <Video className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
        </button>
      </div>
    </div>
  );
};
