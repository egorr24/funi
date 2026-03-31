import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import User from "@/models/User.js";

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

    const exists = await User.findByEmailInUser(parsed.data.email);
    
    if (exists) {
      console.log("User already exists:", parsed.data.email);
      return NextResponse.json({ error: "Email уже занят" }, { status: 409 });
    }

    const newUser = await User.createInUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    console.log("User created, ID:", newUser.id);

    return NextResponse.json({ ok: true, user: { id: newUser.id, email: newUser.email } }, { status: 201 });
  } catch (error: any) {
    console.error("CRITICAL Registration error:", error);
    return NextResponse.json({ 
      error: "Ошибка при регистрации", 
      details: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
