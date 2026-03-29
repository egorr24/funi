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
      SELECT
        c.id,
        c.title,
        c.kind,
        c.is_pinned,
        c.updated_at,
        cm.muted,
        COALESCE(last_message.encrypted_body, 'No messages yet') AS last_message,
        COALESCE(last_message.created_at, c.updated_at) AS last_activity_at,
        COALESCE(unread.unread_count, 0) AS unread_count,
        COALESCE(
          json_agg(
            json_build_object('id', u2.id, 'name', u2.name, 'avatar', u2.avatar)
            ORDER BY u2.name
          ) FILTER (WHERE u2.id IS NOT NULL),
          '[]'::json
        ) AS other_members
      FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id
      LEFT JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != $1
      LEFT JOIN users u2 ON u2.id = cm2.user_id
      LEFT JOIN LATERAL (
        SELECT m.encrypted_body, m.created_at
        FROM messages m
        WHERE m.chat_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_message ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unread_count
        FROM messages m
        WHERE m.chat_id = c.id
          AND m.sender_id != $1
          AND m.status != 'READ'
      ) AS unread ON true
      WHERE cm.user_id = $1
      GROUP BY
        c.id,
        c.title,
        c.kind,
        c.is_pinned,
        c.updated_at,
        cm.muted,
        last_message.encrypted_body,
        last_message.created_at,
        unread.unread_count
      ORDER BY COALESCE(last_message.created_at, c.updated_at) DESC
    `, [session.user.id]);

    const allowedFolders = new Set(["PERSONAL", "WORK", "AI", "CHANNEL", "SAVED"]);
    const chats = chatsResult.rows.map((chat) => {
      const otherMembers = Array.isArray(chat.other_members) ? chat.other_members : [];
      const memberNames = otherMembers
        .map((member: { id: string; name: string | null; avatar: string | null }) => member.name)
        .filter(Boolean);
      const folder = allowedFolders.has(chat.kind) ? chat.kind : "PERSONAL";
      const hasCustomTitle = Boolean(chat.title && chat.title !== "Private Chat");
      const title = folder === "SAVED"
        ? "⭐️ Избранное"
        : hasCustomTitle
          ? chat.title
          : memberNames.length > 0
            ? memberNames.join(", ")
            : "Диалог";
      const initials = title
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word: string) => word[0])
        .join("")
        .toUpperCase();
      const participants = [...memberNames.slice(0, 4), "You"];
      const otherUserId = otherMembers.length === 1 ? otherMembers[0].id : undefined;
      return {
        id: chat.id,
        title,
        avatar: initials || "??",
        folder,
        unreadCount: chat.unread_count ?? 0,
        pinned: chat.is_pinned,
        isMuted: chat.muted,
        typing: false,
        participants,
        otherUserId,
        lastMessagePreview: chat.last_message || "No messages yet",
        updatedAt: chat.last_activity_at.toISOString(),
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
