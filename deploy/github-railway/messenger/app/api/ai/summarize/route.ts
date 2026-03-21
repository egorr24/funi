import { NextRequest, NextResponse } from "next/server";
import { mockMessages } from "@/src/lib/mock-data";

export async function POST(request: NextRequest) {
  const { chatId } = (await request.json()) as { chatId: string };
  const unread = mockMessages.filter((message) => message.chatId === chatId && message.status !== "READ");
  const summary = unread
    .slice(0, 5)
    .map((message) => `${message.senderName}: ${message.decryptedBody ?? "Encrypted message"}`)
    .join(" ");

  return NextResponse.json({
    chatId,
    generatedAt: new Date().toISOString(),
    unreadCount: unread.length,
    summary: summary || "No unread messages in this chat.",
  });
}
