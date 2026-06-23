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
    const { amount, type, categoryId, accountId, date, notes, tags } = body;

    const existing = await db.transaction.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (categoryId) {
      const category = await db.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
    }

    if (accountId !== undefined) {
      const newAmount = amount !== undefined ? parseFloat(amount) : existing.amount;
      const newType = type || existing.type;
      const delta = newType === "income" ? newAmount : -newAmount;

      if (existing.accountId) {
        const oldDelta = existing.type === "income" ? -existing.amount : existing.amount;
        await db.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: oldDelta } },
        });
      }
      if (accountId) {
        const account = await db.account.findFirst({
          where: { id: accountId, userId: user.id },
        });
        if (!account) {
          return NextResponse.json({ error: "Invalid account" }, { status: 400 });
        }
        await db.account.update({
          where: { id: accountId },
          data: { balance: { increment: delta } },
        });
      }
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        type: type || undefined,
        categoryId: categoryId || undefined,
        accountId: accountId !== undefined ? (accountId || null) : undefined,
        date: date ? new Date(date) : undefined,
        notes: notes !== undefined ? notes : undefined,
        tags: tags !== undefined ? tags : undefined,
      },
      include: { category: true, account: true },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("PUT transaction error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
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
    const existing = await db.transaction.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.accountId) {
      const delta = existing.type === "income" ? -existing.amount : existing.amount;
      await db.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: delta } },
      });
    }

    await db.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE transaction error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
