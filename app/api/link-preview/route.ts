import { NextRequest, NextResponse } from "next/server";

const getMetaContent = (html: string, key: string, attr: "property" | "name" = "property") => {
  const regex = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(regex)?.[1];
};

const getTitle = (html: string) => {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return title?.trim();
};

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let normalizedUrl: URL;
  try {
    normalizedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (normalizedUrl.protocol !== "http:" && normalizedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(normalizedUrl.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "FluxLinkPreviewBot/1.0",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: "Unable to fetch URL" }, { status: 502 });
    }

    const html = await response.text();
    const title = getMetaContent(html, "og:title") || getTitle(html);
    const description =
      getMetaContent(html, "og:description") || getMetaContent(html, "description", "name");
    const image = getMetaContent(html, "og:image");
    const favicon =
      html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] ||
      `${normalizedUrl.origin}/favicon.ico`;

    return NextResponse.json({
      url: normalizedUrl.toString(),
      title,
      description,
      image,
      favicon: favicon?.startsWith("http") ? favicon : new URL(favicon, normalizedUrl.origin).toString(),
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ error: "Preview fetch failed" }, { status: 502 });
  }
}
