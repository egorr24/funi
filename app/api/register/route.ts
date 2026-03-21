import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (exists) {
      return NextResponse.json({ error: "Email уже занят" }, { status: 409 });
    }

    const passwordHash = await hash(parsed.data.password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });

    // Create or find a global chat and add the user to it
    let globalChat = await prisma.chat.findFirst({
      where: { title: "Global FLUX Chat" },
    });

    if (!globalChat) {
      globalChat = await prisma.chat.create({
        data: {
          title: "Global FLUX Chat",
          kind: "PERSONAL",
        },
      });
    }

    await prisma.chatMember.create({
      data: {
        userId: newUser.id,
        chatId: globalChat.id,
      },
    });

    return NextResponse.json({ ok: true, user: { id: newUser.id, email: newUser.email } }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ 
      error: "Ошибка при регистрации", 
      details: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
