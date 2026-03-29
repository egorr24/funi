import { auth } from "@/src/auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/models/database.js";

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

    // Помечаем все сообщения в этом чате, отправленные не нами, как прочитанные
    await pool.query(`
      UPDATE messages 
      SET status = 'READ', read_at = CURRENT_TIMESTAMP
      WHERE chat_id = $1 AND sender_id != $2 AND status != 'READ'
    `, [chatId, session.user.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
