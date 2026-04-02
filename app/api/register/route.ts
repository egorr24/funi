import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import User from "@/models/User.js";
import Chat from "@/models/Chat.js";
import { pool } from "@/models/database.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Registration attempt for:", body.email);
    
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      console.log("Registration validation failed:", parsed.error);
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const exists = await User.findByEmail(parsed.data.email);
    
    if (exists) {
      console.log("User already exists:", parsed.data.email);
      return NextResponse.json({ error: "Email уже занят" }, { status: 409 });
    }

    const newUser = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    console.log("User created, ID:", newUser.id);

    // Create or find a global chat
    let globalChatResult = await pool.query('SELECT * FROM "Chat" WHERE title = $1 LIMIT 1', ["Global FLUX Chat"]);
    let globalChat = globalChatResult.rows[0];

    if (!globalChat) {
      globalChat = await Chat.create({
        title: "Global FLUX Chat",
        kind: "PERSONAL",
      });
      console.log("Global chat created");
    }

    await Chat.addMember(globalChat.id, newUser.id);

    console.log("User added to global chat");

    return NextResponse.json({ ok: true, user: { id: newUser.id, email: newUser.email } }, { status: 201 });
  } catch (error: any) {
    console.error("CRITICAL Registration error:", error);
    return NextResponse.json({ 
      error: "Ошибка при регистрации", 
      details: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
