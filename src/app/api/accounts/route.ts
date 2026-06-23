import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { transactions: true } },
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("GET accounts error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { name, type, balance, color, icon, currency, isDefault } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If setting as default, unset others
    if (isDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        name,
        type,
        balance: balance !== undefined ? parseFloat(balance) : 0,
        color: color || "#10b981",
        icon: icon || "Wallet",
        currency: currency || "USD",
        isDefault: isDefault || false,
        userId: user.id,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("POST account error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
