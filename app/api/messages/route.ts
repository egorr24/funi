import { auth } from "@/src/auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/models/database.js";
import Message from "@/models/Message.js";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let chatId = searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  try {
    // Fallback для старых клиентских версий с виртуальным ID "saved-"
    if (chatId.startsWith("saved-")) {
      const savedChatResult = await pool.query(`
        SELECT c.id FROM chats c
        JOIN chat_members cm ON c.id = cm.chat_id
        WHERE c.kind = 'SAVED' AND cm.user_id = $1
        LIMIT 1
      `, [session.user.id]);
      
      if (savedChatResult.rows[0]) {
        chatId = savedChatResult.rows[0].id;
      } else {
        return NextResponse.json({ error: "Saved messages chat not found" }, { status: 404 });
      }
    }

    // Check if user is a member of the chat
    const membershipResult = await pool.query(`
      SELECT 1 FROM chat_members 
      WHERE user_id = $1 AND chat_id = $2
    `, [session.user.id, chatId]);

    if (membershipResult.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messagesResult = await pool.query(`
      SELECT m.*, u.name as sender_name,
             r.id as reply_id, r.encrypted_body as reply_body, ru.name as reply_sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN messages r ON m.reply_to_id = r.id
      LEFT JOIN users ru ON r.sender_id = ru.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `, [chatId]);

    const messages = messagesResult.rows;

    // Fetch reactions for these messages
    const messageIds = messages.map(m => m.id);
    let reactionsMap: Record<string, any[]> = {};
    
    if (messageIds.length > 0) {
      const reactionsResult = await pool.query(`
        SELECT re.*, u.name as user_name
        FROM reactions re
        JOIN users u ON re.user_id = u.id
        WHERE re.message_id = ANY($1)
      `, [messageIds]);
      
      reactionsResult.rows.forEach(r => {
        if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
        reactionsMap[r.message_id].push({
          emoji: r.emoji,
          userId: r.user_id,
          userName: r.user_name,
        });
      });
    }

    return NextResponse.json(messages.map(m => ({
      id: m.id,
      chatId: m.chat_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      encryptedBody: m.encrypted_body,
      encryptedAes: m.encrypted_aes,
      iv: m.iv,
      mediaUrl: m.media_url,
      mediaType: m.media_type,
      waveform: m.waveform,
      createdAt: m.created_at.toISOString(),
      status: m.status,
      reactions: reactionsMap[m.id] || [],
      replyTo: m.reply_id ? {
        id: m.reply_id,
        body: m.reply_body,
        senderName: m.reply_sender_name
      } : undefined
    })));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { chatId, encryptedBody, encryptedAes, iv, mediaUrl, mediaType, waveform, replyToId } = body;

    if (!chatId || !encryptedBody || !encryptedAes || !iv) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fallback для старых клиентских версий с виртуальным ID "saved-"
    if (chatId.startsWith("saved-")) {
      const savedChatResult = await pool.query(`
        SELECT c.id FROM chats c
        JOIN chat_members cm ON c.id = cm.chat_id
        WHERE c.kind = 'SAVED' AND cm.user_id = $1
        LIMIT 1
      `, [session.user.id]);
      
      if (savedChatResult.rows[0]) {
        chatId = savedChatResult.rows[0].id;
      } else {
        return NextResponse.json({ error: "Saved messages chat not found" }, { status: 404 });
      }
    }

    // Check membership
    const membershipResult = await pool.query(`
      SELECT 1 FROM chat_members 
      WHERE user_id = $1 AND chat_id = $2
    `, [session.user.id, chatId]);

    if (membershipResult.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await Message.create({
      chatId,
      senderId: session.user.id,
      encryptedBody,
      encryptedAes,
      iv,
      mediaUrl,
      mediaType,
      waveform,
      replyToId,
    });

    const senderResult = await pool.query('SELECT name FROM users WHERE id = $1', [session.user.id]);
    const senderName = senderResult.rows[0].name;

    let replyTo = undefined;
    if (replyToId) {
      const replyResult = await pool.query(`
        SELECT m.id, m.encrypted_body, u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = $1
      `, [replyToId]);
      if (replyResult.rows[0]) {
        replyTo = {
          id: replyResult.rows[0].id,
          body: replyResult.rows[0].encrypted_body,
          senderName: replyResult.rows[0].sender_name
        };
      }
    }

    return NextResponse.json({
      id: message.id,
      chatId: message.chat_id,
      senderId: message.sender_id,
      senderName: senderName,
      encryptedBody: message.encrypted_body,
      encryptedAes: message.encrypted_aes,
      iv: message.iv,
      createdAt: message.created_at.toISOString(),
      status: message.status,
      reactions: [],
      replyTo
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
