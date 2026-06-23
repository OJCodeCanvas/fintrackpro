import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = { userId: user.id };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const budgets = await db.budget.findMany({
      where,
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("GET budgets error:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { amount, month, year, categoryId } = body;

    if (!amount || !month || !year || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await db.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });
    if (!category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // upsert: if budget exists for this category/month/year, update it
    const existing = await db.budget.findFirst({
      where: { userId: user.id, categoryId, month, year },
    });

    let budget;
    if (existing) {
      budget = await db.budget.update({
        where: { id: existing.id },
        data: { amount: parseFloat(amount) },
        include: { category: true },
      });
    } else {
      budget = await db.budget.create({
        data: {
          amount: parseFloat(amount),
          month,
          year,
          categoryId,
          userId: user.id,
        },
        include: { category: true },
      });
    }

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error("POST budget error:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}
