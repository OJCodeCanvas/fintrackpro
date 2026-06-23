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
    const { amount, type, categoryId, accountId, frequency, dayOfMonth, startDate, endDate, notes, isActive } = body;

    const existing = await db.recurring.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Recurring not found" }, { status: 404 });
    }

    const recurring = await db.recurring.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        type: type || undefined,
        categoryId: categoryId || undefined,
        accountId: accountId !== undefined ? accountId : undefined,
        frequency: frequency || undefined,
        dayOfMonth: dayOfMonth !== undefined ? dayOfMonth : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        notes: notes !== undefined ? notes : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: { category: true, account: true },
    });

    return NextResponse.json({ recurring });
  } catch (error) {
    console.error("PUT recurring error:", error);
    return NextResponse.json({ error: "Failed to update recurring" }, { status: 500 });
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
    const existing = await db.recurring.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Recurring not found" }, { status: 404 });
    }

    await db.recurring.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE recurring error:", error);
    return NextResponse.json({ error: "Failed to delete recurring" }, { status: 500 });
  }
}
