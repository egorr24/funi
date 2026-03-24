import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  try {
    // Check if user is a member of the chat
    const membership = await prisma.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId: session.user.id,
          chatId: chatId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: true,
        reactions: {
          include: { user: true },
        },
        replyTo: {
          include: { sender: true }
        }
      },
    });

    return NextResponse.json(messages.map(m => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      senderName: m.sender.name,
      encryptedBody: m.encryptedBody,
      encryptedAes: m.encryptedAes,
      iv: m.iv,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      waveform: m.waveform,
      createdAt: m.createdAt.toISOString(),
      status: m.status,
      reactions: m.reactions.map(r => ({
        emoji: r.emoji,
        userId: r.userId,
        userName: r.user.name,
      })),
      replyTo: m.replyTo ? {
        id: m.replyTo.id,
        body: m.replyTo.encryptedBody, // Use encryptedBody since it's the main content field
        senderName: m.replyTo.sender.name
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
    const { chatId, encryptedBody, encryptedAes, iv, mediaUrl, mediaType, waveform, replyToId } = body;

    if (!chatId || !encryptedBody || !encryptedAes || !iv) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check membership
    const membership = await prisma.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId: session.user.id,
          chatId: chatId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: session.user.id,
        encryptedBody,
        encryptedAes,
        iv,
        mediaUrl,
        mediaType,
        waveform,
        replyToId,
        status: "SENT",
      },
      include: {
        sender: true,
        replyTo: {
          include: { sender: true }
        }
      },
    });

    return NextResponse.json({
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      senderName: message.sender.name,
      encryptedBody: message.encryptedBody,
      encryptedAes: message.encryptedAes,
      iv: message.iv,
      createdAt: message.createdAt.toISOString(),
      status: message.status,
      reactions: [],
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        body: message.replyTo.encryptedBody,
        senderName: message.replyTo.sender.name
      } : undefined
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
