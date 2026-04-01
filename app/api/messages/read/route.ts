import { auth } from "@/src/auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/models/database.js";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Mark messages as read - chatId:", body.chatId, "userId:", session.user.id);
    
    const { chatId } = body;
    if (!chatId) {
      return NextResponse.json({ error: "chatId is required", received: body }, { status: 400 });
    }

    const preferPrisma = !isUuid(session.user.id) || !isUuid(chatId);
    
    console.log("Using Prisma mode:", preferPrisma);

    if (preferPrisma) {
      await pool.query(`
        UPDATE "Message"
        SET status = 'READ', "readAt" = CURRENT_TIMESTAMP
        WHERE "chatId" = $1 AND "senderId" != $2 AND status != 'READ'
      `, [chatId, session.user.id]);
    } else {
      await pool.query(`
        UPDATE messages 
        SET status = 'READ', read_at = CURRENT_TIMESTAMP
        WHERE chat_id = $1 AND sender_id != $2 AND status != 'READ'
      `, [chatId, session.user.id]);
    }

    console.log("Messages marked as read successfully");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/messages/read error:", error);
    return NextResponse.json({ 
      error: "Failed to mark messages as read", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
