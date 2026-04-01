import { auth } from "@/src/auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/models/database.js";
import Message from "@/models/Message.js";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    console.log("Fetching messages for chat:", chatId, "user:", session.user.id);

    const preferPrisma = !isUuid(session.user.id) || !isUuid(chatId);
    // Fallback для старых клиентских версий с виртуальным ID "saved-"
    if (chatId.startsWith("saved-")) {
      const savedChatResult = preferPrisma
        ? await pool.query(`
            SELECT c.id FROM "Chat" c
            JOIN "ChatMember" cm ON c.id = cm."chatId"
            WHERE c.title = '⭐️ Избранное' AND cm."userId" = $1
            LIMIT 1
          `, [session.user.id])
        : await pool.query(`
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
    const membershipResult = preferPrisma
      ? await pool.query(`
          SELECT 1 FROM "ChatMember" 
          WHERE "userId" = $1 AND "chatId" = $2
        `, [session.user.id, chatId])
      : await pool.query(`
          SELECT 1 FROM chat_members 
          WHERE user_id = $1 AND chat_id = $2
        `, [session.user.id, chatId]);

    if (membershipResult.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messagesResult = preferPrisma
      ? await pool.query(`
          SELECT m.id, m."chatId" as chat_id, m."senderId" as sender_id, m."encryptedBody" as encrypted_body,
                 m."encryptedAes" as encrypted_aes, m.iv, m."mediaUrl" as media_url, m."mediaType" as media_type,
                 m.waveform, m.status, m."createdAt" as created_at, u.name as sender_name,
                 r.id as reply_id, r."encryptedBody" as reply_body, ru.name as reply_sender_name
          FROM "Message" m
          JOIN "User" u ON m."senderId" = u.id
          LEFT JOIN "Message" r ON m."replyToId" = r.id
          LEFT JOIN "User" ru ON r."senderId" = ru.id
          WHERE m."chatId" = $1
          ORDER BY m."createdAt" ASC
        `, [chatId])
      : await pool.query(`
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
    console.log("Fetched", messages.length, "messages");

    // Fetch reactions for these messages
    const messageIds = messages.map(m => m.id);
    let reactionsMap: Record<string, any[]> = {};
    
    if (messageIds.length > 0) {
      const reactionsResult = preferPrisma
        ? await pool.query(`
            SELECT re.emoji, re."messageId" as message_id, re."userId" as user_id, u.name as user_name
            FROM "Reaction" re
            JOIN "User" u ON re."userId" = u.id
            WHERE re."messageId" = ANY($1)
          `, [messageIds])
        : await pool.query(`
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
  } catch (error: any) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch messages", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Creating message with body:", body);
    
    let { chatId, encryptedBody, encryptedAes, iv, mediaUrl, mediaType, waveform, replyToId } = body;

    if (!chatId || !encryptedBody || !encryptedAes || !iv) {
      return NextResponse.json({ error: "Missing required fields", received: { chatId, hasEncryptedBody: !!encryptedBody, hasEncryptedAes: !!encryptedAes, hasIv: !!iv } }, { status: 400 });
    }

    const preferPrisma = !isUuid(session.user.id) || !isUuid(chatId);
    // Fallback для старых клиентских версий с виртуальным ID "saved-"
    if (chatId.startsWith("saved-")) {
      const savedChatResult = preferPrisma
        ? await pool.query(`
            SELECT c.id FROM "Chat" c
            JOIN "ChatMember" cm ON c.id = cm."chatId"
            WHERE c.title = '⭐️ Избранное' AND cm."userId" = $1
            LIMIT 1
          `, [session.user.id])
        : await pool.query(`
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
    const membershipResult = preferPrisma
      ? await pool.query(`
          SELECT 1 FROM "ChatMember" 
          WHERE "userId" = $1 AND "chatId" = $2
        `, [session.user.id, chatId])
      : await pool.query(`
          SELECT 1 FROM chat_members 
          WHERE user_id = $1 AND chat_id = $2
        `, [session.user.id, chatId]);

    if (membershipResult.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Creating message in database...");
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

    console.log("Message created:", message.id);
    const senderResult = preferPrisma
      ? await pool.query('SELECT name FROM "User" WHERE id = $1', [session.user.id])
      : await pool.query('SELECT name FROM users WHERE id = $1', [session.user.id]);
    const senderName = senderResult.rows[0].name;

    let replyTo = undefined;
    if (replyToId) {
      const replyResult = preferPrisma
        ? await pool.query(`
            SELECT m.id, m."encryptedBody" as encrypted_body, u.name as sender_name
            FROM "Message" m
            JOIN "User" u ON m."senderId" = u.id
            WHERE m.id = $1
          `, [replyToId])
        : await pool.query(`
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
      chatId: message.chat_id || message.chatId,
      senderId: message.sender_id || message.senderId,
      senderName: senderName,
      encryptedBody: message.encrypted_body || message.encryptedBody,
      encryptedAes: message.encrypted_aes || message.encryptedAes,
      iv: message.iv,
      createdAt: new Date(message.created_at || message.createdAt || Date.now()).toISOString(),
      status: message.status,
      reactions: [],
      replyTo
    });
  } catch (error: any) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ 
      error: "Failed to create message", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
