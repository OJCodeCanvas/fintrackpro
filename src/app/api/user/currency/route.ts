import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { currency } = body;

    const supported = ["USD", "EUR", "GBP", "JPY", "CNY", "INR"];
    if (!currency || !supported.includes(currency)) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { currency },
      select: { id: true, email: true, name: true, isDemo: true, currency: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Update currency error:", error);
    return NextResponse.json({ error: "Failed to update currency" }, { status: 500 });
  }
}
