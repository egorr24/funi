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

export const ProfileSettingsModal = ({
  isOpen,
  onClose,
  user,
  onUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (data: { name: string; avatar?: string }) => Promise<void>;
}) => {
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatar(user.avatar || "");
    }
  }, [user, isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setAvatar(data.secure_url);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({ name, avatar });
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-white/5 rounded-full">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold mb-8 text-center">Настройки профиля</h2>

        <div className="flex flex-col items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="h-24 w-24 rounded-full border-2 border-violet-500/30 overflow-hidden bg-zinc-800 flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-zinc-500" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-violet-500 border-t-transparent animate-spin rounded-full" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Сменить</span>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Имя пользователя</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 text-sm outline-none focus:border-violet-500/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email (нельзя изменить)</label>
              <input
                disabled
                value={user?.email || ""}
                className="w-full rounded-2xl bg-white/5 border border-white/5 p-4 text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="w-full py-4 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSaving ? "СОХРАНЯЕМ..." : "СОХРАНИТЬ ИЗМЕНЕНИЯ"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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

export const SidebarHeader = ({
  title,
  onAddChat,
  onBack,
  onCreateGroup,
  onSearch,
}: {
  title: string;
  onAddChat?: () => void;
  onBack?: () => void;
  onCreateGroup?: () => void;
  onSearch?: () => void;
}) => (
  <div className="px-5 pb-4 pt-5 flex items-center justify-between">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-xl transition-colors">
          <X className="h-5 w-5 rotate-90" />
        </button>
      )}
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-[10px] lg:text-xs text-zinc-300/70 hidden lg:block">Hyper-Glass 2026 realtime channeling</p>
      </div>
      {onSearch && (
        <button
          onClick={onSearch}
          className="lg:hidden grid h-8 w-8 place-items-center rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
          title="Поиск"
        >
          <Search className="h-4 w-4" />
        </button>
      )}
    </div>
    <div className="flex gap-2">
      {onCreateGroup && (
        <button
          onClick={onCreateGroup}
          className="hidden lg:grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          title="Создать группу"
        >
          <User className="h-5 w-5" />
        </button>
      )}
      {onAddChat && (
        <button
          onClick={onAddChat}
          className="grid h-8 w-8 lg:h-10 lg:w-10 place-items-center rounded-2xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
          title="Новый чат"
        >
          <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
        </button>
      )}
    </div>
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
  <div className="space-y-2.5 px-2.5 lg:px-3 pb-3">{children}</div>
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
    className="flex-1 space-y-3 overflow-y-auto px-3 lg:px-4 py-3 lg:py-4"
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

  const handlePan = (event: any, info: { offset: { x: number; y: number } }) => {
    if (!touchSwipeActive) return;
    const directionalOffset = mine ? Math.min(0, info.offset.x) : Math.max(0, info.offset.x);
    setSwipeX(directionalOffset);
  };

  const handlePanEnd = (event: any, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    if (touchSwipeActive) {
      const directionalOffset = mine ? Math.min(0, info.offset.x) : Math.max(0, info.offset.x);
      const directionalVelocity = mine ? Math.min(0, info.velocity.x) : Math.max(0, info.velocity.x);
      if (Math.abs(directionalOffset) > swipeThreshold || Math.abs(directionalVelocity) > 500) {
        onReply?.();
      }
    }
    setSwipeX(0);
    setTouchSwipeActive(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      onPanStart={onReply ? handlePanStart : undefined}
      onPan={onReply ? handlePan : undefined} // Only enable pan if onReply is provided
      onPanEnd={onReply ? handlePanEnd : undefined} // Only enable pan end if onReply is provided
      style={{ x: swipeX }}
      className={`max-w-[90%] lg:max-w-[70%] rounded-[24px] px-4 lg:px-5 py-3 shadow-xl shadow-black/20 group relative border backdrop-blur-xl touch-pan-y ${
        mine ? "ml-auto bg-gradient-to-br from-violet-500/70 via-violet-600/55 to-fuchsia-600/45 text-white rounded-tr-none border-violet-200/30" : "bg-white/10 text-zinc-100 rounded-tl-none border-white/15"
      }`}
    >
      {/* Swipe-to-reply indicator */}
      {onReply && !mine && swipeX > 8 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute -left-12 top-1/2 -translate-y-1/2 text-violet-400"
        >
          <Reply className="h-5 w-5" />
        </motion.div>
      )}
      {onReply && mine && swipeX < -8 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute -right-12 top-1/2 -translate-y-1/2 text-violet-300"
        >
          <Reply className="h-5 w-5 scale-x-[-1]" />
        </motion.div>
      )}
      <div className={`absolute ${mine ? "-left-28" : "-right-28"} top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
        <button onClick={onReply} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Reply">
          <Share className="h-4 w-4 rotate-180" />
        </button>
        <button onClick={onForward} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Forward">
          <Share className="h-4 w-4" />
        </button>
        {mine && (
          <>
            <button onClick={() => { setIsEditing(true); setEditValue(message.decryptedBody || ""); }} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Edit">
              <Settings className="h-4 w-4" />
            </button>
            <button onClick={onDelete} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors" title="Delete">
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {!mine && onReaction && (
        <div className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          {["👍", "❤️", "🔥", "😂"].map(emoji => (
            <button 
              key={emoji}
              onClick={() => onReaction(emoji)}
              className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-sm hover:bg-zinc-800 hover:scale-110 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {message.isForwarded && (
        <div className="flex items-center gap-1 mb-1 text-[10px] opacity-60 italic">
          <Share className="h-3 w-3" />
          Переслано от {message.forwardedFrom || "пользователя"}
        </div>
      )}

      {message.replyTo && (
        <div className={`mb-2 p-2 rounded-xl border-l-4 text-[11px] bg-black/20 ${mine ? "border-violet-400" : "border-zinc-500"}`}>
          <div className="font-bold mb-0.5 text-violet-400">{message.replyTo.senderName}</div>
          <div className="opacity-70 truncate text-zinc-300 italic">
            «{message.replyTo.body}»
          </div>
        </div>
      )}

      {message.mediaType === "image" && message.mediaUrl && (
        <div 
          className={`relative overflow-hidden rounded-xl mb-2 group/img bg-zinc-900/50 min-h-[120px] select-none ${
            message.isSecure ? "cursor-help pointer-events-auto" : "cursor-pointer"
          }`}
          onClick={handleStartPeek}
          onContextMenu={(e) => message.isSecure && e.preventDefault()}
        >
          {/* СКРЫТИЕ ПРЯМОГО URL ЧЕРЕЗ CANVAS ДЛЯ ЗАЩИЩЕННЫХ ФОТО */}
          {message.isSecure ? (
            <SecureCanvasImage 
              url={message.mediaUrl} 
              revealed={isRevealed} 
              viewerName={viewerName}
            />
          ) : (
            <img 
              src={message.mediaUrl} 
              alt="media" 
              className="w-full max-h-80 object-contain"
              onClick={() => onImageClick?.(message.mediaUrl!)}
            />
          )}

          {/* СУПЕР-ЗАЩИТА ПРИ ПРОСМОТРЕ */}
          {message.isSecure && isRevealed && <MoireOverlay viewerName={viewerName} />}
          
          {/* ТАЙМЕР (ВЕРХНИЙ СЛОЙ) */}
          {peekTimer !== null && (
            <div className="absolute top-3 right-3 z-50 px-2 py-1 rounded-lg bg-red-600/90 backdrop-blur-md text-[9px] font-black text-white shadow-xl">
              {peekTimer}S
            </div>
          )}
        </div>
      )}

      {message.mediaType === "file" && message.mediaUrl && (
        <div className="flex items-center gap-3 mb-2 bg-black/20 p-3 rounded-2xl border border-white/5 hover:bg-black/30 transition-colors cursor-pointer">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Paperclip className="h-5 w-5" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-bold truncate text-blue-400">Документ</div>
            <div className="text-[10px] text-zinc-500 italic">Нажмите для скачивания</div>
          </div>
          <a href={message.mediaUrl} download className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Maximize2 className="h-4 w-4 rotate-90" />
          </a>
        </div>
      )}

      {message.mediaType === "audio" && message.mediaUrl && (
        <div className="flex flex-col gap-2 mb-2 bg-black/20 p-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <button 
              onClick={togglePlay}
              className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
            >
              {isPlaying ? <X className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
            </button>
            <div className="flex-1">
              <VoiceWaveform points={message.waveform || Array.from({length: 20}, () => Math.random() * 20 + 5)} />
            </div>
            <div className="flex flex-col gap-1">
              <button className="text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded-md hover:bg-violet-500/50 transition-colors">1.5x</button>
              <button className="text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded-md hover:bg-violet-500/50 transition-colors">2x</button>
            </div>
          </div>
          <audio 
            ref={audioRef} 
            src={message.mediaUrl} 
            onEnded={() => setIsPlaying(false)}
            className="hidden" 
          />
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-2 text-sm outline-none focus:border-violet-400"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="text-[10px] font-bold uppercase opacity-60 hover:opacity-100">Отмена</button>
            <button onClick={handleEditSave} className="text-[10px] font-bold uppercase text-violet-400 hover:text-violet-300">Сохранить</button>
          </div>
        </div>
      ) : (
        <div className="text-sm leading-relaxed font-medium">
          {renderRichText(message.decryptedBody || "")}
          {linkPreviews.map((preview) => (
            <LinkPreview key={`${message.id}-${preview.url}`} data={preview} />
          ))}
          {message.isEdited && <span className="ml-2 text-[9px] opacity-40 italic">(изм.)</span>}
        </div>
      )}
      
      {message.reactions && message.reactions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
            const count = message.reactions!.filter(r => r.emoji === emoji).length;
            return (
              <div key={emoji} className="px-1.5 py-0.5 rounded-full bg-black/20 border border-white/5 text-[10px] flex items-center gap-1">
                <span>{emoji}</span>
                <span className="font-bold opacity-80">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-1 flex items-center justify-end gap-1.5 opacity-60">
        <span className="text-[10px] uppercase font-bold tracking-wider">
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
};

export const PhotoViewer = ({ url, onClose, onForward }: { url: string | null; onClose: () => void; onForward?: () => void }) => (
  <AnimatePresence>
    {url && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute top-6 right-6 flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onForward?.(); }} 
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <Share className="h-5 w-5 text-white" />
            ПЕРЕСЛАТЬ
          </button>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
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
  <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 safe-area-inset">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-violet-500/20 grid place-items-center mx-auto mb-6 border-2 border-violet-500/50 shadow-lg shadow-violet-500/20">
          <User className="h-10 w-10 md:h-12 md:w-12 text-violet-400" />
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight text-white">Входящий звонок</h3>
        <p className="text-zinc-400 text-xs md:text-sm mb-8 font-medium">От: {from}</p>
        
        <div className="flex gap-4">
          <button 
            onClick={onReject}
            className="flex-1 py-3.5 md:py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold flex items-center justify-center gap-2 text-sm"
          >
            <PhoneOff className="h-5 w-5" />
            <span className="hidden xs:inline">Отклонить</span>
            <span className="xs:hidden">Нет</span>
          </button>
          <button 
            onClick={onAccept}
            className="flex-1 py-3.5 md:py-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 animate-bounce text-sm"
          >
            <Phone className="h-5 w-5" />
            <span className="hidden xs:inline">Принять</span>
            <span className="xs:hidden">Да</span>
          </button>
        </div>
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
        {reaction.emoji}
      </button>
    ))}
  </div>
);

export const VoiceWaveform = ({ points }: { points: number[] }) => (
  <svg width="220" height="38" viewBox="0 0 220 38" className="mt-2">
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

export const TypingIndicator = ({ 
  visible, 
  userNames = [] 
}: { 
  visible: boolean;
  userNames?: string[];
}) => (
  <AnimatePresence>
    {visible ? (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="px-6 py-2 text-[11px] text-zinc-500 font-medium flex items-center gap-2"
      >
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" />
        </div>
        <span>
          {userNames.length > 0 
            ? `${userNames.join(", ")} ${userNames.length > 1 ? "печатают" : "печатает"}...` 
            : "Кто-то печатает..."}
        </span>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export const Composer = ({
  value,
  onChange,
  onSend,
  onAttach,
  onAttachSecure,
  onVoiceStart,
  isRecording = false,
  onTimerClick,
  activeTimer = 30
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-16 left-0 w-56 bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl z-50"
            >
              <button
                onClick={() => {
                  onAttach?.();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Maximize2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Обычное фото</div>
                  <div className="text-[10px] text-zinc-500 italic">Стандартная отправка</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAttachSecure?.();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-500/10 transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-violet-400">Скрытое (Муар)</div>
                  <div className="text-[10px] text-zinc-500 italic">Защита от пересъемки</div>
                </div>
              </button>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Логика загрузки файла будет в flux-app.tsx через пропс onAttach
                      onAttach?.(); 
                    }
                  };
                  input.click();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Paperclip className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Документ</div>
                  <div className="text-[10px] text-zinc-500 italic">PDF, DOCX, ZIP...</div>
                </div>
              </button>
              
              <div className="h-px bg-white/5 my-1" />
              
              <button
                onClick={() => {
                  onTimerClick?.();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-red-400">Таймер удаления</div>
                  <div className="text-[10px] text-zinc-500 italic">Сейчас: {activeTimer}с</div>
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
        onClick={onSend}
        className="p-3 md:p-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl shadow-lg shadow-violet-600/20 transition-all active:scale-95"
      >
        <SendHorizontal className="w-5 h-5" />
      </button>
    ) : (
      <button 
        onClick={onVoiceStart}
        className={`p-3 md:p-3.5 rounded-2xl transition-all active:scale-95 ${
          isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
        }`}
      >
        <Mic className="w-5 h-5" />
      </button>
    )}
  </div>
  );
};

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
  callStatus = "idle",
  failReason,
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
  callStatus?: "idle" | "ringing" | "connecting" | "active" | "failed";
  failReason?: string | null;
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, active]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      // ВАЖНО для iOS: Попытка автоматического воспроизведения
      remoteVideoRef.current.play().catch(e => {
        console.warn("[CALL] Remote audio/video blocked by browser", e);
        setAudioBlocked(true);
      });
    }
  }, [remoteStream, active]);

  const resumeAudio = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play();
      setAudioBlocked(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-zinc-950/95 backdrop-blur-2xl flex flex-col safe-area-inset"
    >
        <div className="flex-1 relative p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center overflow-y-auto">
          {/* Remote Video / Status */}
          <div className="relative aspect-[4/3] md:aspect-video rounded-[24px] md:rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden shadow-2xl">
            {callStatus === "active" && remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-violet-500/20 grid place-items-center relative">
                  <User className="h-10 w-10 md:h-12 md:w-12 text-violet-400" />
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-violet-500/50"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="text-center px-4">
                  <p className="text-base md:text-lg font-bold text-white mb-1">
                    {callStatus === "ringing" ? "Вызов..." : 
                     callStatus === "connecting" ? "Подключение..." : 
                     callStatus === "failed" ? "Сбой вызова" : "Ожидание..."}
                  </p>
                  <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
                    {callStatus === "failed" 
                      ? (failReason === "busy" ? "Собеседник занят" : "Собеседник офлайн") 
                      : "Ждем ответа собеседника"}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-medium">
              Собеседник
            </div>

            {audioBlocked && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                <div className="bg-zinc-900/80 p-6 rounded-3xl border border-white/10 shadow-2xl">
                  <p className="text-sm font-bold text-white mb-4">Браузер заблокировал звук</p>
                  <button 
                    onClick={resumeAudio}
                    className="px-6 py-3 bg-violet-600 rounded-xl text-xs font-bold hover:bg-violet-500 transition-all active:scale-95"
                  >
                    ВКЛЮЧИТЬ ЗВУК
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Local Video */}
          <div className="relative aspect-[4/3] md:aspect-video rounded-[24px] md:rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-medium">
              Вы
            </div>
            {cameraOff && (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <VideoOff className="h-10 w-10 md:h-12 md:w-12 text-zinc-700" />
              </div>
            )}
          </div>
        </div>

        <div className="pb-8 md:pb-0 h-32 md:h-32 flex items-center justify-center gap-4 md:gap-6 px-6">
          <CallControlBtn onClick={toggleMute} active={!muted} icon={muted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />} label={muted ? "Вкл" : "Выкл"} />
          <CallControlBtn onClick={toggleCamera} active={!cameraOff} icon={cameraOff ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <Video className="w-5 h-5 md:w-6 md:h-6" />} label={cameraOff ? "Вкл" : "Выкл"} />
          <CallControlBtn onClick={onShare} active={mode === "screen"} icon={<Share className="w-5 h-5 md:w-6 md:h-6" />} label="Экран" />
          <button
            onClick={onEnd}
            className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors grid place-items-center shadow-xl shadow-red-500/20 active:scale-95"
          >
            <PhoneOff className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </button>
        </div>
      </motion.div>
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
