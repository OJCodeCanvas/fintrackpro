import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";
import { processRecurringTransactions } from "@/lib/recurring";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    // Process any due recurring transactions first
    await processRecurringTransactions(user.id);

    const recurring = await db.recurring.findMany({
      where: { userId: user.id },
      include: { category: true, account: true },
      orderBy: [{ isActive: "desc" }, { nextDate: "asc" }],
    });

    return NextResponse.json({ recurring });
  } catch (error) {
    console.error("GET recurring error:", error);
    return NextResponse.json({ error: "Failed to fetch recurring" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { amount, type, categoryId, accountId, frequency, dayOfMonth, startDate, endDate, notes } = body;

    if (!amount || !type || !categoryId || !frequency || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await db.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });
    if (!category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const start = new Date(startDate);
    const recurring = await db.recurring.create({
      data: {
        amount: parseFloat(amount),
        type,
        categoryId,
        accountId: accountId || null,
        frequency,
        dayOfMonth: dayOfMonth || null,
        startDate: start,
        nextDate: start,
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
        notes: notes || "",
        userId: user.id,
      },
      include: { category: true, account: true },
    });

    return NextResponse.json({ recurring }, { status: 201 });
  } catch (error) {
    console.error("POST recurring error:", error);
    return NextResponse.json({ error: "Failed to create recurring" }, { status: 500 });
  }
}
