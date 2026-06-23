import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const { name, type, balance, color, icon, currency, isDefault } = body;

    const existing = await db.account.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (isDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const account = await db.account.update({
      where: { id },
      data: {
        name: name || undefined,
        type: type || undefined,
        balance: balance !== undefined ? parseFloat(balance) : undefined,
        color: color || undefined,
        icon: icon || undefined,
        currency: currency || undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error("PUT account error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const existing = await db.account.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await db.transaction.updateMany({
      where: { accountId: id },
      data: { accountId: null },
    });
    await db.recurring.updateMany({
      where: { accountId: id },
      data: { accountId: null },
    });
    await db.account.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
