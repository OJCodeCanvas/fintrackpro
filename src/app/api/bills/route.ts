import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // paid | unpaid | all
    const overdueOnly = searchParams.get("overdue") === "true";

    const where: Record<string, unknown> = { userId: user.id };
    if (status === "paid") where.isPaid = true;
    if (status === "unpaid") where.isPaid = false;
    if (overdueOnly) {
      where.isPaid = false;
      where.dueDate = { lt: new Date() };
    }

    const bills = await db.bill.findMany({
      where,
      orderBy: [{ isPaid: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("GET bills error:", error);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { name, amount, dueDate, isRecurring, notes } = body;

    if (!name || !amount || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bill = await db.bill.create({
      data: {
        name,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        isRecurring: isRecurring || false,
        notes: notes || "",
        userId: user.id,
      },
    });

    return NextResponse.json({ bill }, { status: 201 });
  } catch (error) {
    console.error("POST bill error:", error);
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
  }
}
