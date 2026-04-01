import { auth } from "@/src/auth";
import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/models/database.js";
import Chat from "@/models/Chat.js";
import User from "@/models/User.js";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching chats for user:", session.user.id);

    const preferPrisma = !isUuid(session.user.id);
    let savedChatResult;
    if (!preferPrisma) {
      savedChatResult = await pool.query(`
        SELECT c.id FROM chats c
        JOIN chat_members cm ON c.id = cm.chat_id
        WHERE cm.user_id = $1
          AND (
            c.kind::text = 'SAVED'
            OR (c.kind::text = 'PERSONAL' AND c.title = '⭐️ Избранное')
          )
        LIMIT 1
      `, [session.user.id]);
    } else {
      savedChatResult = await pool.query(`
        SELECT c.id FROM "Chat" c
        JOIN "ChatMember" cm ON c.id = cm."chatId"
        WHERE cm."userId" = $1
          AND c.kind = 'PERSONAL'
          AND c.title = '⭐️ Избранное'
        LIMIT 1
      `, [session.user.id]);
    }

    if (savedChatResult.rowCount === 0) {
      const newSavedChat = await Chat.create({
        title: "⭐️ Избранное",
        kind: "SAVED",
        preferPrisma,
      });
      if (!preferPrisma) {
        await pool.query('UPDATE chats SET is_pinned = true WHERE id = $1', [newSavedChat.id]);
      } else {
        await pool.query('UPDATE "Chat" SET "isPinned" = true WHERE id = $1', [newSavedChat.id]);
      }
      await Chat.addMember(newSavedChat.id, session.user.id, "member", preferPrisma);
    }

    let chatsResult;
    if (!preferPrisma) {
      chatsResult = await pool.query(`
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
    } else {
      chatsResult = await pool.query(`
        SELECT
          c.id,
          c.title,
          c.kind,
          c."isPinned" AS is_pinned,
          c."updatedAt" AS updated_at,
          cm.muted,
          COALESCE(last_message."encryptedBody", 'No messages yet') AS last_message,
          COALESCE(last_message."createdAt", c."updatedAt") AS last_activity_at,
          COALESCE(unread.unread_count, 0) AS unread_count,
          COALESCE(
            json_agg(
              json_build_object('id', u2.id, 'name', u2.name, 'avatar', u2.avatar)
              ORDER BY u2.name
            ) FILTER (WHERE u2.id IS NOT NULL),
            '[]'::json
          ) AS other_members
        FROM "Chat" c
        JOIN "ChatMember" cm ON c.id = cm."chatId"
        LEFT JOIN "ChatMember" cm2 ON cm2."chatId" = c.id AND cm2."userId" != $1
        LEFT JOIN "User" u2 ON u2.id = cm2."userId"
        LEFT JOIN LATERAL (
          SELECT m."encryptedBody", m."createdAt"
          FROM "Message" m
          WHERE m."chatId" = c.id
          ORDER BY m."createdAt" DESC
          LIMIT 1
        ) AS last_message ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS unread_count
          FROM "Message" m
          WHERE m."chatId" = c.id
            AND m."senderId" != $1
            AND m.status != 'READ'
        ) AS unread ON true
        WHERE cm."userId" = $1
        GROUP BY
          c.id,
          c.title,
          c.kind,
          c."isPinned",
          c."updatedAt",
          cm.muted,
          last_message."encryptedBody",
          last_message."createdAt",
          unread.unread_count
        ORDER BY COALESCE(last_message."createdAt", c."updatedAt") DESC
      `, [session.user.id]);
    }

    const allowedFolders = new Set(["PERSONAL", "WORK", "AI", "CHANNEL", "SAVED"]);
    const chats = chatsResult.rows.map((chat) => {
      const otherMembers = Array.isArray(chat.other_members) ? chat.other_members : [];
      const memberNames = otherMembers
        .map((member: { id: string; name: string | null; avatar: string | null }) => member.name)
        .filter(Boolean);
      const normalizedKind = chat.kind === "CHAT" ? "PERSONAL" : chat.kind;
      const folder = allowedFolders.has(normalizedKind) ? normalizedKind : "PERSONAL";
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
        updatedAt: new Date(chat.last_activity_at || chat.updated_at || Date.now()).toISOString(),
      };
    });

    return NextResponse.json(chats);
  } catch (error: any) {
    console.error("GET /api/chats error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch chats", 
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

    console.log("Creating chat - user:", session.user.id);
    
    const { userId, title, kind = "PERSONAL" } = await request.json();
    console.log("Chat creation params:", { userId, title, kind });
    
    const normalizedKind = kind === "CHAT" ? "PERSONAL" : kind;
    const preferPrisma = !isUuid(session.user.id);

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const resolvedUserId = await User.resolveAppUserId(userId);
    if (!resolvedUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (resolvedUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot create chat with yourself" }, { status: 400 });
    }

    // Check if private chat already exists between these two users
    if (normalizedKind === "PERSONAL") {
      const existingChat = await Chat.findPersonalChat(session.user.id, resolvedUserId, preferPrisma);
      if (existingChat) {
        console.log("Existing chat found:", existingChat.id);
        return NextResponse.json({ id: existingChat.id });
      }
    }

    // Create new chat
    console.log("Creating new chat...");
    const chat = await Chat.create({
      title: title || "Private Chat",
      kind: normalizedKind,
      preferPrisma,
    });

    console.log("Chat created:", chat.id);
    // Add members
    await Chat.addMember(chat.id, session.user.id, "member", preferPrisma);
    await Chat.addMember(chat.id, resolvedUserId, "member", preferPrisma);

    console.log("Members added successfully");
    return NextResponse.json({ id: chat.id });
  } catch (error: any) {
    console.error("POST /api/chats error:", error);
    return NextResponse.json({ 
      error: "Failed to create chat", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
