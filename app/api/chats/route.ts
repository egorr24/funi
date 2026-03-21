import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const chatMemberships = await prisma.chatMember.findMany({
      where: { userId: session.user.id },
      include: {
        chat: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: true },
            },
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    const chats = chatMemberships.map((m) => {
      const chat = m.chat;
      const lastMessage = chat.messages[0];
      
      return {
        id: chat.id,
        title: chat.title,
        avatar: chat.title.slice(0, 2).toUpperCase(),
        folder: chat.kind as any,
        unreadCount: 0,
        pinned: chat.isPinned,
        typing: false,
        participants: chat.members.map(m => m.user.name || "Unknown"),
        lastMessagePreview: lastMessage ? lastMessage.encryptedBody : "No messages yet",
        updatedAt: chat.updatedAt.toISOString(),
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
      const existingChat = await prisma.chat.findFirst({
        where: {
          kind: "PERSONAL",
          members: { every: { userId: { in: [session.user.id, userId] } } },
        },
      });

      if (existingChat) {
        return NextResponse.json(existingChat);
      }
    }

    const chat = await prisma.chat.create({
      data: {
        title: title || "New Chat",
        kind,
        members: {
          create: [
            { userId: session.user.id },
            { userId: userId },
          ],
        },
      },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    const chatResponse = {
      id: chat.id,
      title: chat.title,
      avatar: chat.title.slice(0, 2).toUpperCase(),
      folder: chat.kind as any,
      unreadCount: 0,
      pinned: chat.isPinned,
      typing: false,
      participants: chat.members.map(m => m.user.name || "Unknown"),
      lastMessagePreview: "No messages yet",
      updatedAt: chat.updatedAt.toISOString(),
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("Chat creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
