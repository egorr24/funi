import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  return NextResponse.json({
    url: `https://media.flux.local/${Date.now()}-${file.name}`,
    size: file.size,
    type: file.type,
  });
}
