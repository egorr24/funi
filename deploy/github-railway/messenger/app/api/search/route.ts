import { NextRequest, NextResponse } from "next/server";
import { mockChats, mockMessages } from "@/src/lib/mock-data";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").toLowerCase();
  if (!q) {
    return NextResponse.json({ chats: [], messages: [] });
  }
  const chats = mockChats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(q) || chat.lastMessagePreview.toLowerCase().includes(q)
  );
  const messages = mockMessages.filter((message) =>
    (message.decryptedBody ?? "").toLowerCase().includes(q)
  );

  return NextResponse.json({ chats, messages });
}
