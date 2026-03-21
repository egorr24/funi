"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic, Paperclip, Phone, Pin, Search, SendHorizontal, Shield, Video } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";
import { FluxChat, FluxMessage } from "@/src/types/flux";

type BaseProps = {
  className?: string;
};

export const GlassCard = ({ children, className = "" }: PropsWithChildren<BaseProps>) => (
  <div className={`rounded-3xl border border-white/15 bg-white/10 backdrop-blur-3xl ${className}`}>{children}</div>
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

export const FluxShell = ({ children }: PropsWithChildren) => (
  <div className="mx-auto grid h-screen max-w-[1600px] grid-cols-[360px_1fr_340px] gap-5 p-6 text-zinc-100">{children}</div>
);

export const Sidebar = ({ children }: PropsWithChildren) => (
  <GlassCard className="overflow-hidden">{children}</GlassCard>
);

export const SidebarHeader = ({ title }: { title: string }) => (
  <div className="px-5 pb-4 pt-5">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="text-xs text-zinc-300/70">Hyper-Glass 2026 realtime channeling</p>
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

export const ChatHeader = ({ title, participants }: { title: string; participants: string[] }) => (
  <div className="border-b border-white/10 px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-zinc-400">{participants.join(" • ")}</p>
      </div>
      <QuickActions />
    </div>
  </div>
);

export const QuickActions = () => (
  <div className="flex items-center gap-2">
    <IconAction icon={<Phone className="h-4 w-4" />} />
    <IconAction icon={<Video className="h-4 w-4" />} />
    <IconAction icon={<Search className="h-4 w-4" />} />
  </div>
);

export const IconAction = ({ icon }: { icon: ReactNode }) => (
  <button className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-200 hover:bg-white/10">{icon}</button>
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

export const MessageBubble = ({ message, mine }: { message: FluxMessage; mine: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`max-w-[70%] rounded-2xl px-4 py-3 ${mine ? "ml-auto bg-violet-500/35" : "bg-white/8"}`}
  >
    <div className="mb-1 text-xs text-zinc-300">{message.senderName}</div>
    <div className="text-sm leading-6">{message.decryptedBody}</div>
    {message.mediaType === "audio" ? <VoiceWaveform points={message.waveform ?? []} /> : null}
    <div className="mt-2 flex items-center justify-between gap-2">
      <ReactionRail reactions={message.reactions} />
      <DeliveryBadge status={message.status} />
    </div>
  </motion.div>
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
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) => (
  <div className="border-t border-white/10 px-4 py-4">
    <div className="flex items-center gap-2">
      <AttachmentButton />
      <MessageInput value={value} onChange={onChange} />
      <VoiceButton />
      <SendButton onClick={onSend} />
    </div>
  </div>
);

export const MessageInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <input
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="h-11 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none"
    placeholder="Write encrypted message…"
  />
);

export const SendButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/80">
    <SendHorizontal className="h-4 w-4" />
  </button>
);

export const AttachmentButton = () => (
  <button className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
    <Paperclip className="h-4 w-4" />
  </button>
);

export const VoiceButton = () => (
  <button className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
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
}: {
  active: boolean;
  mode: string;
  onEnd: () => void;
  onShare: () => void;
}) => (
  <AnimatePresence>
    {active ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 grid place-items-center bg-black/60 backdrop-blur-xl"
      >
        <GlassCard className="w-[520px] space-y-4 p-5">
          <h3 className="text-lg font-semibold">Unified {mode} call</h3>
          <div className="grid grid-cols-2 gap-3">
            <VideoTile name="You" />
            <VideoTile name="Remote" />
          </div>
          <ParticipantStrip />
          <div className="flex gap-2">
            <button onClick={onShare} className="rounded-xl border border-white/10 px-4 py-2 text-sm">
              Share Screen
            </button>
            <button onClick={onEnd} className="rounded-xl bg-red-500/80 px-4 py-2 text-sm">
              End Call
            </button>
          </div>
        </GlassCard>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export const VideoTile = ({ name }: { name: string }) => (
  <div className="aspect-video rounded-2xl border border-white/10 bg-black/25 p-3">
    <div className="text-xs text-zinc-300">{name}</div>
  </div>
);

export const ParticipantStrip = () => (
  <div className="flex gap-2">
    <AvatarPill label="AR" />
    <AvatarPill label="KL" />
    <AvatarPill label="YO" />
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

export const ProfileSheet = () => (
  <GlassCard className="space-y-3 p-4">
    <h3 className="text-sm font-semibold">Profile</h3>
    <div className="flex items-center gap-3">
      <AvatarPill label="YO" />
      <div>
        <p className="text-sm font-medium">You</p>
        <p className="text-xs text-zinc-400">sovereign@flux.app</p>
      </div>
    </div>
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

export const EmptyState = ({ label }: { label: string }) => (
  <GlassCard className="grid place-items-center p-5 text-sm text-zinc-400">{label}</GlassCard>
);
