import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_CONTENT_TYPES = [
  "text/csv",
  "application/csv",
  "multipart/form-data",
  "application/octet-stream",
];

function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") return false;
    if (host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.")) return false;
    if (host === "[::1]") return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-webhook-secret");
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!secret || authHeader !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL not configured" },
      { status: 503 }
    );
  }

  if (!isValidWebhookUrl(n8nUrl)) {
    return NextResponse.json(
      { error: "Invalid webhook URL configuration" },
      { status: 503 }
    );
  }

  // Validate content type
  const contentType = request.headers.get("content-type") || "";
  const isAllowed = ALLOWED_CONTENT_TYPES.some((t) => contentType.includes(t));
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Only CSV files accepted" },
      { status: 400 }
    );
  }

  // Validate size
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 10 MB." },
      { status: 413 }
    );
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 10 MB." },
      { status: 413 }
    );
  }

  try {
    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "content-type": contentType,
        "x-webhook-secret": secret,
      },
      body: body,
      signal: AbortSignal.timeout(30000),
    });

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text().catch(() => "");
      console.error("n8n import failed:", n8nResponse.status, errText);
      return NextResponse.json(
        { error: "Import processing failed. Please try again." },
        { status: 502 }
      );
    }

    const result = await n8nResponse.json().catch(() => ({ success: true }));
    return NextResponse.json(result);
  } catch (err) {
    console.error("Webhook proxy error:", err);
    return NextResponse.json(
      { error: "Request processing failed. Please try again." },
      { status: 502 }
    );
  }
}
