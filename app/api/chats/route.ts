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

    const preferPrisma = true; // Force use of quoted table names as per initDatabase
    let savedChatResult = await pool.query(`
        SELECT c.id FROM "Chat" c
        JOIN "ChatMember" cm ON c.id = cm."chatId"
        WHERE cm."userId" = $1
          AND c.kind = 'PERSONAL'
          AND c.title = '⭐️ Избранное'
        LIMIT 1
      `, [session.user.id]);

    if (savedChatResult.rowCount === 0) {
      const newSavedChat = await Chat.create({
        title: "⭐️ Избранное",
        kind: "SAVED",
        preferPrisma,
      });
      await pool.query('UPDATE "Chat" SET "isPinned" = true WHERE id = $1', [newSavedChat.id]);
      await Chat.addMember(newSavedChat.id, session.user.id, "member", preferPrisma);
    }

    let chatsResult = await pool.query(`
        SELECT
          c.id,
          c.title,
          c.kind,
          c."isPinned",
          c."updatedAt",
          cm.muted,
          (SELECT "encryptedBody" FROM "Message" m WHERE m."chatId" = c.id ORDER BY m."createdAt" DESC LIMIT 1) AS last_message,
          (SELECT "createdAt" FROM "Message" m WHERE m."chatId" = c.id ORDER BY m."createdAt" DESC LIMIT 1) AS last_activity_at,
          (SELECT COUNT(*)::int FROM "Message" m WHERE m."chatId" = c.id AND m."senderId" != $1 AND m.status != 'READ') AS unread_count,
          (
            SELECT json_agg(json_build_object('id', u2.id, 'name', u2.name, 'avatar', u2.avatar))
            FROM "ChatMember" cm2
            JOIN "User" u2 ON cm2."userId" = u2.id
            WHERE cm2."chatId" = c.id AND cm2."userId" != $1
          ) AS other_members
        FROM "Chat" c
        JOIN "ChatMember" cm ON c.id = cm."chatId"
        WHERE cm."userId" = $1
        ORDER BY c."isPinned" DESC, COALESCE((SELECT "createdAt" FROM "Message" m WHERE m."chatId" = c.id ORDER BY m."createdAt" DESC LIMIT 1), c."updatedAt") DESC
      `, [session.user.id]);

    const chats = chatsResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      isPinned: row.isPinned,
      updatedAt: row.updatedAt,
      muted: row.muted,
      lastMessage: row.last_message,
      lastActivityAt: row.last_activity_at || row.updatedAt,
      unreadCount: row.unread_count,
      otherMembers: row.other_members || [],
    }));

    return NextResponse.json(chats);
  } catch (error: any) {
    console.error("Chats fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    
    const normalizedKind = (kind === "CHAT" || kind === "Chat") ? "PERSONAL" : kind;
    const preferPrisma = true; // Force use of quoted table names

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
