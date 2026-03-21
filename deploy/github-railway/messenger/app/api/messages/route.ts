import { NextRequest, NextResponse } from "next/server";
import { mockMessages } from "@/src/lib/mock-data";
import { FluxMessage } from "@/src/types/flux";

export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chatId");
  const messages = chatId ? mockMessages.filter((message) => message.chatId === chatId) : mockMessages;
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as FluxMessage;
  const queued: FluxMessage = {
    ...payload,
    status: "QUEUED",
    createdAt: new Date().toISOString(),
  };
  mockMessages.push(queued);
  return NextResponse.json({ message: queued }, { status: 201 });
}
