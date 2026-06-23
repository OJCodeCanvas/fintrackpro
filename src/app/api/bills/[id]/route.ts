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
    const { name, amount, dueDate, isPaid, isRecurring, notes } = body;

    const existing = await db.bill.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const bill = await db.bill.update({
      where: { id },
      data: {
        name: name || undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isPaid: isPaid !== undefined ? isPaid : undefined,
        isRecurring: isRecurring !== undefined ? isRecurring : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json({ bill });
  } catch (error) {
    console.error("PUT bill error:", error);
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
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
    const existing = await db.bill.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    await db.bill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE bill error:", error);
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 });
  }
}
