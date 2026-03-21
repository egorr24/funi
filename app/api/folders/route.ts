import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    folders: [
      { id: "PERSONAL", title: "Personal", rules: ["1:1", "family", "close friends"] },
      { id: "WORK", title: "Work", rules: ["teams", "projects", "ops"] },
      { id: "AI", title: "AI", rules: ["assistant", "bots", "agents"] },
      { id: "CHANNEL", title: "Channels", rules: ["broadcast", "communities"] },
    ],
  });
}
