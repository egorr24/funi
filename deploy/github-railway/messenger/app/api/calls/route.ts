import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    turn: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
    issuedAt: new Date().toISOString(),
  });
}
