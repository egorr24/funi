import { NextRequest, NextResponse } from "next/server";
import { mockMessages } from "@/src/lib/mock-data";

export async function POST(request: NextRequest) {
  const { messageId } = (await request.json()) as { messageId: string };
  const target = mockMessages.find((message) => message.id === messageId);
  if (!target) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  target.status = "READ";

  return NextResponse.json({
    messageId: target.id,
    chatId: target.chatId,
    readAt: new Date().toISOString(),
  });
}
