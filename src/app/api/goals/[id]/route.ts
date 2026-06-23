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
    const { name, targetAmount, currentAmount, color, icon, targetDate } = body;

    const existing = await db.goal.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goal = await db.goal.update({
      where: { id },
      data: {
        name: name || undefined,
        targetAmount: targetAmount !== undefined ? parseFloat(targetAmount) : undefined,
        currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : undefined,
        color: color || undefined,
        icon: icon || undefined,
        targetDate: targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : undefined,
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("PUT goal error:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
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
    const existing = await db.goal.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await db.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE goal error:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
