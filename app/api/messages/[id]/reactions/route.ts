import { auth } from "@/src/auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/models/database.js";
import Message from "@/models/Message.js";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: messageId } = await params;
  const { emoji } = await request.json();

  if (!emoji) {
    return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
  }

  try {
    // Находим сообщение и проверяем членство в чате
    const messageResult = await pool.query(`
      SELECT m.*, c.id as chat_id FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE m.id = $1
    `, [messageId]);
    const message = messageResult.rows[0];

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const membershipResult = await pool.query(`
      SELECT 1 FROM chat_members 
      WHERE user_id = $1 AND chat_id = $2
    `, [session.user.id, message.chat_id]);

    if (membershipResult.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Удаляем предыдущую реакцию этого пользователя на это сообщение (если хотим один лайк на юзера)
    await pool.query(`
      DELETE FROM reactions 
      WHERE message_id = $1 AND user_id = $2
    `, [messageId, session.user.id]);

    const reaction = await Message.addReaction(messageId, session.user.id, emoji);
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [session.user.id]);

    return NextResponse.json({
      emoji: reaction.emoji,
      userId: reaction.user_id,
      userName: userResult.rows[0].name,
    });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
