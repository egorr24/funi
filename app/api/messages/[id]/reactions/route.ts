import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messageId = params.id;
  const { emoji } = await request.json();

  if (!emoji) {
    return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
  }

  try {
    // Находим сообщение и проверяем членство в чате
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: { include: { members: true } } },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const isMember = message.chat.members.some(m => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Добавляем или обновляем реакцию (один пользователь — один эмодзи на сообщение)
    // В схеме @@unique([messageId, userId, emoji]), но мы хотим один эмодзи от юзера на сообщение
    // Если нужно разрешить несколько разных эмодзи от одного юзера, используем upsert с уникальным ключом
    // Если хотим "один юзер - один лайк", то удаляем старые перед добавлением нового.
    
    // Удаляем предыдущую реакцию этого пользователя на это сообщение (если хотим один лайк на юзера)
    await prisma.reaction.deleteMany({
      where: {
        messageId,
        userId: session.user.id,
      }
    });

    const reaction = await prisma.reaction.create({
      data: {
        messageId,
        userId: session.user.id,
        emoji,
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({
      emoji: reaction.emoji,
      userId: reaction.userId,
      userName: reaction.user.name,
    });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
