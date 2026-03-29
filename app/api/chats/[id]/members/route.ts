import { auth } from "@/src/auth";
import { NextResponse } from "next/server";
import { pool } from "@/models/database.js";
import Chat from "@/models/Chat.js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const members = await Chat.findChatMembers(id);

    return NextResponse.json(members.map(m => ({
      userId: m.id,
      chatId: id,
      role: m.role,
      user: {
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        status: m.status,
        lastSeen: m.last_seen,
      }
    })));
  } catch (error) {
    console.error("Error fetching chat members:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
