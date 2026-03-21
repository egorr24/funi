import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const members = await prisma.chatMember.findMany({
      where: { chatId: params.id },
      include: { user: true },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching chat members:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
