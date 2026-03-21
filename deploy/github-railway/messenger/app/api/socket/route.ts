import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    socketPath: "/api/socket",
    reconnect: true,
    queueing: "enabled",
    sync: ["delivery", "read"],
  });
}
