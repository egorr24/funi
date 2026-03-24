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
    className={`mx-auto flex h-screen max-w-[1600px] text-zinc-100 overflow-hidden relative w-full`}
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
  <div className={`flex lg:flex-col items-center lg:py-8 bg-[#0a0a0c] border-r border-white/5 gap-6 fixed bottom-0 left-0 right-0 h-20 lg:static lg:h-auto lg:w-[100px] z-50 ${className}`}>
    <div className="flex lg:flex-col items-center justify-around lg:justify-start gap-8 w-full lg:w-auto px-4 lg:px-0">
      <NavIcon
        active={activeTab === "chats"}
        onClick={() => onTabChange("chats")}
        icon={<MessageSquare className="h-7 w-7" />}
        label="Чаты"
      />
      <NavIcon
        active={activeTab === "profile"}
        onClick={() => onTabChange("profile")}
        icon={<User className="h-7 w-7" />}
        label="Профиль"
      />
      <NavIcon
        active={activeTab === "notifications"}
        onClick={() => onTabChange("notifications")}
        icon={<Bell className="h-7 w-7" />}
        label="Уведомления"
      />
      <NavIcon
        active={activeTab === "settings"}
        onClick={() => onTabChange("settings")}
        icon={<Settings className="h-7 w-7" />}
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
  <aside className={`flex flex-col border-r border-white/5 bg-black/20 lg:w-[360px] shrink-0 ${className}`}>{children}</aside>
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

export const SidebarHeader = ({
  title,
  onAddChat,
  onBack,
}: {
  title: string;
  onAddChat?: () => void;
  onBack?: () => void;
}) => (
  <div className="px-5 pb-4 pt-5 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-xl transition-colors">
          <X className="h-5 w-5 rotate-90" />
        </button>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-xs text-zinc-300/70">Hyper-Glass 2026 realtime channeling</p>
      </div>
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
  isOnline = false,
}: {
  chat: FluxChat;
  active: boolean;
  onClick: () => void;
  isOnline?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full rounded-2xl p-3 text-left transition ${active ? "bg-violet-500/25" : "bg-white/5 hover:bg-white/10"}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <AvatarPill label={chat.avatar} />
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
          )}
        </div>
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

export const MessagePane = ({ children, className = "" }: PropsWithChildren<BaseProps>) => (
  <main className={`flex flex-col bg-zinc-950/20 backdrop-blur-md h-full overflow-hidden flex-1 ${className}`}>{children}</main>
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
  <div className="border-b border-white/10 px-4 lg:px-6 py-4">
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

export const MoireOverlay = ({ viewerName }: { viewerName?: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-30 select-none">
    {/* НЕЙРОННЫЙ ПРИЗРАК: Высокочастотные микро-вспышки */}
    <motion.div 
      className="absolute inset-0 bg-white mix-blend-overlay"
      animate={{ opacity: [0, 0.15, 0] }}
      transition={{ duration: 0.01, repeat: Infinity }}
    />

    {/* ДИНАМИЧЕСКИЙ ГРИД С ПОСТОЯННОЙ СМЕНОЙ ФАЗЫ */}
    <motion.div 
      className="absolute inset-[-200%] opacity-20"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{
        backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
        backgroundSize: '4px 4px'
      }}
    />

    {/* КВАНТОВЫЙ ВОДЯНОЙ ЗНАК */}
    <div className="absolute inset-0 flex flex-col justify-around">
      {[1, 2, 3].map(i => (
        <motion.div 
          key={i}
          className="whitespace-nowrap text-[10px] font-black text-white/20 uppercase tracking-[1.5em]"
          animate={{ x: i % 2 === 0 ? ["-100%", "100%"] : ["100%", "-100%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          {Array(5).fill(`• SENSOR BREAK ACTIVE • ${viewerName || 'ENCRYPTED'} • `).join("")}
        </motion.div>
      ))}
    </div>
  </div>
);

export const SecureCanvasImage = ({ url, revealed, viewerName }: { url: string, revealed: boolean, viewerName?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
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

      const sliceCount = 128; // Увеличено для «Спектрального Фрагментирования»
      const sliceWidth = canvas.width / sliceCount;

      const render = () => {
        frameCounter.current++;
        
        // Очищаем кадр темным фоном для сброса экспозиции камеры
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ТЕХНОЛОГИЯ «PERSISTENCE OF VISION» (POV-COLOR-FLIP)
        // Каждое мгновение цвета инвертируются. Глаз усредняет их в норму, камера - в мусор.
        const povPhase = frameCounter.current % 2;
        
        // 2-ФАЗНАЯ ТЕМПОРАЛЬНАЯ СБОРКА С POV-ИНВЕРСИЕЙ
        const phase = frameCounter.current % 2;
        
        for (let i = 0; i < sliceCount; i++) {
          const x = i * sliceWidth;
          const isMainPhase = (i % 2 === phase);
          
          // POV-Инверсия: инвертируем всё изображение на каждом кадре для сенсора
          // Для глаза: (Positive + Negative) / 2 = сероватая, но разборчивая картинка
          // Для камеры: Либо негатив, либо позитив, либо каша
          ctx.filter = povPhase === 0 ? 'none' : 'invert(1) hue-rotate(180deg)';
          ctx.globalAlpha = isMainPhase ? 1.0 : 0.05;
          
          ctx.drawImage(
            img, 
            (i * img.width) / sliceCount, 0, img.width / sliceCount, img.height,
            x, 0, sliceWidth, canvas.height
          );
        }
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;

        // SPATIAL ALIASING BAIT (Генератор неустранимого муара)
        // Шахматный паттерн из микро-точек, меняющийся каждый кадр
        ctx.fillStyle = povPhase === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
        for (let y = 0; y < canvas.height; y += 2) {
          for (let x = (y % 4); x < canvas.width; x += 4) {
            ctx.fillRect(x, y, 1, 1);
          }
        }

        // HDR OVERDRIVE: Вспышки яркости, выбивающие экспозицию (Anti-HDR)
        const hdrBoost = Math.sin(frameCounter.current * 0.8) * 0.1;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, hdrBoost)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';

        // ДИНАМИЧЕСКАЯ ВИБРАЦИЯ ЧАСТОТЫ (JITTER)
        setTimeout(() => {
            animationRef.current = requestAnimationFrame(render);
        }, 1 + Math.random() * 2); 
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
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="h-16 w-16 rounded-[24px] bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-violet-400" />
          </div>
          <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] mb-2">Neural Ghost Protection</p>
          <p className="text-[9px] text-zinc-500 text-center leading-relaxed italic">
            Технология темпоральной сборки активна. Изображение существует только в вашем восприятии. Камеры зафиксируют лишь цифровой шум.
          </p>
        </div>
      )}
    </div>
  );
};

export const MessageBubble = ({ 
  message, 
  mine,
  onImageClick,
  onReaction,
  onReply,
  onDelete,
  viewerName
}: { 
  message: FluxMessage; 
  mine: boolean;
  onImageClick?: (url: string) => void;
  onReaction?: (emoji: string) => void;
  onReply?: () => void;
  onDelete?: () => void;
  viewerName?: string;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [peekTimer, setPeekTimer] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`max-w-[85%] lg:max-w-[70%] rounded-[24px] px-5 py-3 shadow-lg shadow-black/5 group relative ${
        mine ? "ml-auto bg-violet-600/90 text-white rounded-tr-none" : "bg-zinc-800/80 text-zinc-100 rounded-tl-none border border-white/5"
      }`}
    >
      <div className={`absolute ${mine ? "-left-20" : "-right-20"} top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
        <button onClick={onReply} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Reply">
          <Share className="h-4 w-4 rotate-180" />
        </button>
        {mine && (
          <button onClick={onDelete} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors" title="Delete">
            <X className="h-4 w-4" />
          </button>
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
      {message.mediaType === "audio" && message.mediaUrl && (
        <div className="flex items-center gap-3 mb-2 bg-black/20 p-3 rounded-2xl">
          <button 
            onClick={togglePlay}
            className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          >
            {isPlaying ? <X className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
          </button>
          <div className="flex-1">
            <VoiceWaveform points={message.waveform || Array.from({length: 20}, () => Math.random() * 20 + 5)} />
          </div>
          <audio 
            ref={audioRef} 
            src={message.mediaUrl} 
            onEnded={() => setIsPlaying(false)}
            className="hidden" 
          />
        </div>
      )}
      <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.decryptedBody}</div>
      
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
  <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[32px] p-8 shadow-2xl text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="h-24 w-24 rounded-full bg-violet-500/20 grid place-items-center mx-auto mb-6 border-2 border-violet-500/50 shadow-lg shadow-violet-500/20">
          <User className="h-12 w-12 text-violet-400" />
        </div>
        
        <h3 className="text-2xl font-bold mb-2 tracking-tight text-white">Входящий звонок</h3>
        <p className="text-zinc-400 text-sm mb-8 font-medium">От: {from}</p>
        
        <div className="flex gap-4">
          <button 
            onClick={onReject}
            className="flex-1 py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold flex items-center justify-center gap-2"
          >
            <PhoneOff className="h-5 w-5" />
            Отклонить
          </button>
          <button 
            onClick={onAccept}
            className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 animate-bounce"
          >
            <Phone className="h-5 w-5" />
            Принять
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
        {reaction.emoji} {reaction.count}
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
  isRecording = false
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onAttach?: () => void;
  onAttachSecure?: () => void;
  onVoiceStart?: () => void;
  isRecording?: boolean;
}) => {
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  return (
    <div className="p-4 bg-zinc-950/40 backdrop-blur-xl border-t border-white/5 flex items-end gap-3 z-10 relative">
      <div className="relative">
        <button 
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className={`p-3 rounded-2xl transition-all group ${showAttachMenu ? "bg-violet-500/20 text-violet-400" : "hover:bg-white/5 text-zinc-400 hover:text-white"}`}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex-1 relative group">
      <textarea
        value={value}
        onChange={onChange}
        placeholder="Написать сообщение..."
        rows={1}
        className="w-full bg-white/5 border border-white/10 rounded-[24px] px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none placeholder:text-zinc-600"
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
        className="p-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl shadow-lg shadow-violet-600/20 transition-all active:scale-95"
      >
        <SendHorizontal className="w-5 h-5" />
      </button>
    ) : (
      <button 
        onClick={onVoiceStart}
        className={`p-3.5 rounded-2xl transition-all active:scale-95 ${
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-zinc-950/90 backdrop-blur-2xl flex flex-col"
    >
        <div className="flex-1 relative p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Remote Video / Status */}
          <div className="relative aspect-video rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden shadow-2xl">
            {callStatus === "active" && remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="h-24 w-24 rounded-full bg-violet-500/20 grid place-items-center relative">
                  <User className="h-12 w-12 text-violet-400" />
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-violet-500/50"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white mb-1">
                    {callStatus === "ringing" ? "Вызов..." : 
                     callStatus === "connecting" ? "Подключение..." : 
                     callStatus === "failed" ? "Сбой вызова" : "Ожидание..."}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
                    {callStatus === "failed" 
                      ? (failReason === "busy" ? "Собеседник занят" : "Собеседник офлайн") 
                      : "Ждем ответа собеседника"}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-xs font-medium">
              Собеседник
            </div>
          </div>

          {/* Local Video */}
          <div className="relative aspect-video rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-xs font-medium">
              Вы
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
