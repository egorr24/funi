import { NextResponse } from "next/server";
import { mockChats } from "@/src/lib/mock-data";

export async function GET() {
  return NextResponse.json({ chats: mockChats });
}
