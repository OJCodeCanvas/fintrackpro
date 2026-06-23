import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const accountId = searchParams.get("accountId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = { userId: user.id };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
    }

    const transactions = await db.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { date: "desc" },
    });

    const headers = ["Date", "Type", "Category", "Account", "Amount", "Notes", "Tags"];
    const rows = transactions.map((t) =>
      [
        t.date.toISOString().split("T")[0],
        t.type,
        t.category.name,
        t.account?.name || "",
        t.amount.toFixed(2),
        t.notes,
        t.tags,
      ]
        .map((v) => escapeCSV(String(v)))
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const dateLabel = new Date().toISOString().split("T")[0];
    const filename = `fintrack-export-${dateLabel}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
