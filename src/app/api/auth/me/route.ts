import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const userId = parseSession(cookieHeader);
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, isDemo: true, currency: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

function parseSession(cookieHeader: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === "pf_session") {
      const value = valueParts.join("=");
      try {
        const decoded = atob(value);
        if (decoded.startsWith("pf_session_")) {
          return decoded.substring("pf_session_".length);
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}
