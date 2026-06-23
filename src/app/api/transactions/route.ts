import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // income | expense
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "date-desc";
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = { userId: user.id };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { notes: { contains: search } },
        { tags: { contains: search } },
        { category: { name: { contains: search } } },
      ];
    }

    const orderBy: Record<string, "asc" | "desc">[] = [];
    if (sort === "date-desc") orderBy.push({ date: "desc" });
    else if (sort === "date-asc") orderBy.push({ date: "asc" });
    else if (sort === "amount-desc") orderBy.push({ amount: "desc" });
    else if (sort === "amount-asc") orderBy.push({ amount: "asc" });

    const transactions = await db.transaction.findMany({
      where,
      include: { category: true },
      orderBy,
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("GET transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { amount, type, categoryId, date, notes, tags } = body;

    if (!amount || !type || !categoryId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // verify category belongs to user
    const category = await db.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });
    if (!category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const transaction = await db.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        categoryId,
        date: new Date(date),
        notes: notes || "",
        tags: tags || "",
        userId: user.id,
      },
      include: { category: true },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST transaction error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
