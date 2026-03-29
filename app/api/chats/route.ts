import { auth } from "@/src/auth";
import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/models/database.js";
import Chat from "@/models/Chat.js";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Ensure "Saved Messages" chat exists for this user
    let savedChatResult = await pool.query(`
      SELECT c.id FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id
      WHERE c.kind = 'SAVED' AND cm.user_id = $1
      LIMIT 1
    `, [session.user.id]);

    if (savedChatResult.rowCount === 0) {
      const newSavedChat = await Chat.create({
        title: "⭐️ Избранное",
        kind: "SAVED"
      });
      await pool.query('UPDATE chats SET is_pinned = true WHERE id = $1', [newSavedChat.id]);
      await Chat.addMember(newSavedChat.id, session.user.id);
    }

    const chatsResult = await pool.query(`
      SELECT c.*, cm.role, cm.muted,
             (SELECT m.encrypted_body FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
             (SELECT u.name FROM users u JOIN chat_members cm2 ON u.id = cm2.user_id WHERE cm2.chat_id = c.id AND cm2.user_id != $1 LIMIT 1) as other_member_name,
             (SELECT u.id FROM users u JOIN chat_members cm2 ON u.id = cm2.user_id WHERE cm2.chat_id = c.id AND cm2.user_id != $1 LIMIT 1) as other_member_id
      FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id
      WHERE cm.user_id = $1
      ORDER BY c.updated_at DESC
    `, [session.user.id]);

    const allowedFolders = new Set(["PERSONAL", "WORK", "AI", "CHANNEL", "SAVED"]);
    const chats = chatsResult.rows.map((chat) => {
      const folder = allowedFolders.has(chat.kind) ? chat.kind : "PERSONAL";
      const participants = chat.other_member_name
        ? [chat.other_member_name, "You"]
        : ["You"];
      return {
        id: chat.id,
        title: chat.title || chat.other_member_name || "Unknown Chat",
        avatar: (chat.title || chat.other_member_name || "??").slice(0, 2).toUpperCase(),
        folder,
        unreadCount: 0,
        pinned: chat.is_pinned,
        typing: false,
        participants,
        otherUserId: chat.other_member_id,
        lastMessagePreview: chat.last_message || "No messages yet",
        updatedAt: chat.updated_at.toISOString(),
      };
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, title, kind = "PERSONAL" } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Check if private chat already exists between these two users
    if (kind === "PERSONAL") {
      const existingChat = await Chat.findPersonalChat(session.user.id, userId);
      if (existingChat) {
        return NextResponse.json({ id: existingChat.id });
      }
    }

    // Create new chat
    const chat = await Chat.create({
      title: title || "Private Chat",
      kind: kind,
    });

    // Add members
    await Chat.addMember(chat.id, session.user.id);
    await Chat.addMember(chat.id, userId);

    return NextResponse.json({ id: chat.id });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
