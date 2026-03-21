import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

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
        kind: chat.kind,
        isPinned: chat.isPinned,
        pinnedMessage: chat.pinnedMessage,
        lastMessagePreview: lastMessage ? lastMessage.encryptedBody : "No messages yet",
        lastMessageTime: lastMessage ? lastMessage.createdAt.toISOString() : chat.updatedAt.toISOString(),
        unreadCount: 0, // Logic for unread count can be added later
        online: chat.members.some(member => member.user.id !== session.user.id), // Simple online logic
        folder: chat.kind,
      };
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
