import { auth } from "@/src/auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/models/database.js";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: messageId } = await params;

  try {
    const messageResult = await pool.query(`
      SELECT m.*, c.id as chat_id FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE m.id = $1
    `, [messageId]);
    const message = messageResult.rows[0];

    if (!message) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only sender or chat member can delete
    const isSender = message.sender_id === session.user.id;
    const membershipResult = await pool.query(`
      SELECT 1 FROM chat_members 
      WHERE user_id = $1 AND chat_id = $2
    `, [session.user.id, message.chat_id]);

    if (!isSender && membershipResult.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
