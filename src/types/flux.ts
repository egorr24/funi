export type ChatFolder = "PERSONAL" | "WORK" | "AI" | "CHANNEL" | "SAVED";

export type DeliveryState = "QUEUED" | "SENT" | "DELIVERED" | "READ";

export type MediaKind = "image" | "video" | "audio" | "file";

export type FluxReaction = {
  emoji: string;
  userId: string;
  userName?: string;
};

export type FluxMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  encryptedBody: string;
  decryptedBody?: string;
  encryptedAes: string;
  iv: string;
  createdAt: string;
  status: DeliveryState;
  replyToId?: string;
  replyTo?: {
    id: string;
    body?: string;
    senderName: string;
  };
  mediaUrl?: string;
  mediaType?: MediaKind;
  waveform?: number[];
  isSecure?: boolean;
  isEdited?: boolean;
  isForwarded?: boolean;
  forwardedFrom?: string;
  reactions: FluxReaction[];
};

export type FluxChat = {
  id: string;
  title: string;
  avatar?: string | null;
  color?: string;
  folder: ChatFolder;
  unreadCount: number;
  pinned: boolean;
  isMuted?: boolean;
  typing: boolean;
  participants: string[];
  otherUserId?: string;
  lastMessagePreview: string;
  updatedAt: string;
  otherMembers?: Array<{
    id: string;
    name: string;
    avatar?: string | null;
  }>;
};

export type SocketPayloadMap = {
  "chat:join": { chatId: string; userId: string };
  "chat:leave": { chatId: string; userId: string };
  "message:queue": FluxMessage;
  "message:sent": FluxMessage;
  "message:delivered": { messageId: string; chatId: string; deliveredAt: string };
  "message:read": { messageId: string; chatId: string; readAt: string; readerId: string };
  "message:reaction": { messageId: string; emoji: string; userId: string; chatId: string };
  "message:edit": { messageId: string; chatId: string; newBody: string };
  "message:delete": { messageId: string; chatId: string };
  "presence:typing": { chatId: string; userId: string; isTyping: boolean };
  "call:offer": { chatId: string; from: string; sdp: RTCSessionDescriptionInit; targetId: string; fromName: string };
  "call:answer": { chatId: string; from: string; sdp: RTCSessionDescriptionInit; targetId: string };
  "call:ice": { chatId: string; from: string; candidate: RTCIceCandidateInit; targetId: string };
  "call:end": { chatId: string; from: string; targetId: string };
};

export type AIAssistantSummary = {
  chatId: string;
  generatedAt: string;
  summary: string;
  unreadCount: number;
};
