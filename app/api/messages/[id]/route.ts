import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: messageId } = await params;

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: { include: { members: true } } },
    });

    if (!message) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only sender or admin can delete
    const isSender = message.senderId === session.user.id;
    const isMember = message.chat.members.some(m => m.userId === session.user.id);

    if (!isSender && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
