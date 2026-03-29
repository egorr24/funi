import { auth } from "@/src/auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/models/database.js";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId } = await request.json();
    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    if (isUuid(session.user.id) && isUuid(chatId)) {
      await pool.query(`
        UPDATE messages 
        SET status = 'READ', read_at = CURRENT_TIMESTAMP
        WHERE chat_id = $1 AND sender_id != $2 AND status != 'READ'
      `, [chatId, session.user.id]);
    } else {
      await pool.query(`
        UPDATE "Message"
        SET status = 'READ'
        WHERE "chatId" = $1 AND "senderId" != $2 AND status != 'READ'
      `, [chatId, session.user.id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
