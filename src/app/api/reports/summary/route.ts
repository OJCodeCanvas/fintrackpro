import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // Get all transactions for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfYear, lte: endOfYear },
      },
      include: { category: true },
    });

    // Monthly breakdown
    const monthlyData: Array<{
      month: number;
      monthName: string;
      income: number;
      expense: number;
      balance: number;
    }> = [];
    for (let m = 0; m < 12; m++) {
      const monthTx = transactions.filter((t) => new Date(t.date).getMonth() === m);
      const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      monthlyData.push({
        month: m + 1,
        monthName: new Date(year, m, 1).toLocaleDateString("en-US", { month: "short" }),
        income,
        expense,
        balance: income - expense,
      });
    }

    // Current month totals
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentMonthData = monthlyData[currentMonth];

    // Spending by category (current month, expenses only)
    const currentMonthTx = transactions.filter(
      (t) => new Date(t.date).getMonth() === currentMonth && t.type === "expense"
    );
    const byCategoryMap = new Map<string, { name: string; color: string; value: number }>();
    for (const t of currentMonthTx) {
      const key = t.category.name;
      const existing = byCategoryMap.get(key) || { name: key, color: t.category.color, value: 0 };
      existing.value += t.amount;
      byCategoryMap.set(key, existing);
    }
    const spendingByCategory = Array.from(byCategoryMap.values()).sort((a, b) => b.value - a.value);

    // Year totals
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // All-time balance (all transactions)
    const allTx = await db.transaction.findMany({ where: { userId: user.id } });
    const allIncome = allTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const allExpense = allTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const totalBalance = allIncome - allExpense;

    // Budget progress for current month
    const budgets = await db.budget.findMany({
      where: { userId: user.id, month: currentMonth + 1, year },
      include: { category: true },
    });
    const budgetProgress = budgets.map((b) => {
      const spent = currentMonthTx
        .filter((t) => t.categoryId === b.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        categoryColor: b.category.color,
        budget: b.amount,
        spent,
        remaining: b.amount - spent,
        percentage: b.amount > 0 ? (spent / b.amount) * 100 : 0,
      };
    });

    return NextResponse.json({
      year,
      totalBalance,
      currentMonth: {
        month: currentMonth + 1,
        income: currentMonthData.income,
        expense: currentMonthData.expense,
        balance: currentMonthData.balance,
      },
      yearTotals: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
      monthlyData,
      spendingByCategory,
      budgetProgress,
    });
  } catch (error) {
    console.error("GET summary error:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
