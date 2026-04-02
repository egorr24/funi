import { auth } from "@/src/auth";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User.js";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, avatar } = await request.json();
    
    const updatedUser = await User.updateProfile(session.user.id, {
      name,
      avatar
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("User update error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message || String(error) 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
    const users = await User.searchUsers(query, session.user.id);
    const currentEmail = (session.user.email || "").toLowerCase();

    return NextResponse.json(
      users
        .filter((u) => (u.email || "").toLowerCase() !== currentEmail)
        .map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
        }))
    );
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
