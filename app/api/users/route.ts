import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
        NOT: { id: session.user.id }, // Don't find self
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
