export type ChatFolder = "PERSONAL" | "WORK" | "AI" | "CHANNEL";

export type DeliveryState = "QUEUED" | "SENT" | "DELIVERED" | "READ";

export type MediaKind = "image" | "video" | "audio" | "file";

export type FluxReaction = {
  emoji: string;
  count: number;
  reacted: boolean;
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
  mediaUrl?: string;
  mediaType?: MediaKind;
  waveform?: number[];
  reactions: FluxReaction[];
};

export type FluxChat = {
  id: string;
  title: string;
  avatar: string;
  folder: ChatFolder;
  unreadCount: number;
  pinned: boolean;
  typing: boolean;
  participants: string[];
  lastMessagePreview: string;
  updatedAt: string;
};

export type SocketPayloadMap = {
  "chat:join": { chatId: string; userId: string };
  "chat:leave": { chatId: string; userId: string };
  "message:queue": FluxMessage;
  "message:sent": FluxMessage;
  "message:delivered": { messageId: string; chatId: string; deliveredAt: string };
  "message:read": { messageId: string; chatId: string; readAt: string; readerId: string };
  "message:reaction": { messageId: string; emoji: string; userId: string };
  "presence:typing": { chatId: string; userId: string; isTyping: boolean };
  "call:offer": { chatId: string; from: string; sdp: RTCSessionDescriptionInit };
  "call:answer": { chatId: string; from: string; sdp: RTCSessionDescriptionInit };
  "call:ice": { chatId: string; from: string; candidate: RTCIceCandidateInit };
  "call:end": { chatId: string; from: string };
};

export type AIAssistantSummary = {
  chatId: string;
  generatedAt: string;
  summary: string;
  unreadCount: number;
};
