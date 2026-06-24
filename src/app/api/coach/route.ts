import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { message, history } = await req.json();
    if (!message) return NextResponse.json({ error: "No message provided" }, { status: 400 });

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [transactions, budgets, goals, bills, accounts] = await Promise.all([
      db.transaction.findMany({
        where: { userId: user.id, date: { gte: startOfYear } },
        include: { category: true },
        orderBy: { date: "desc" },
        take: 200,
      }),
      db.budget.findMany({ where: { userId: user.id }, include: { category: true } }),
      db.goal.findMany({ where: { userId: user.id } }),
      db.bill.findMany({ where: { userId: user.id, isPaid: false } }),
      db.account.findMany({ where: { userId: user.id } }),
    ]);

    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const byCategory = new Map<string, number>();
    for (const t of transactions.filter((t) => t.type === "expense")) {
      byCategory.set(t.category.name, (byCategory.get(t.category.name) || 0) + t.amount);
    }
    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }));

    // Monthly breakdown
    const monthly: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
      const key = new Date(t.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      if (t.type === "income") monthly[key].income += t.amount;
      else monthly[key].expense += t.amount;
    }

    const financialContext = {
      currency: user.currency,
      currentDate: now.toISOString().split("T")[0],
      yearToDate: {
        income: Math.round(totalIncome * 100) / 100,
        expenses: Math.round(totalExpense * 100) / 100,
        savings: Math.round((totalIncome - totalExpense) * 100) / 100,
        savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10 : 0,
      },
      topExpenseCategories: topCategories,
      monthlyBreakdown: Object.entries(monthly).map(([month, v]) => ({
        month,
        income: Math.round(v.income * 100) / 100,
        expenses: Math.round(v.expense * 100) / 100,
      })),
      accounts: accounts.map((a) => ({ name: a.name, type: a.type, balance: a.balance })),
      activeBudgets: budgets.map((b) => ({ category: b.category.name, limit: b.amount, month: b.month, year: b.year })),
      savingsGoals: goals.map((g) => ({ name: g.name, target: g.targetAmount, current: g.currentAmount, progress: Math.round((g.currentAmount / g.targetAmount) * 100) })),
      upcomingBills: bills.slice(0, 5).map((b) => ({ name: b.name, amount: b.amount, dueDate: b.dueDate })),
      recentTransactions: transactions.slice(0, 10).map((t) => ({
        date: new Date(t.date).toISOString().split("T")[0],
        type: t.type,
        category: t.category.name,
        amount: t.amount,
        notes: t.notes,
      })),
    };

    const systemPrompt = `You are a friendly, knowledgeable personal finance coach named "FinCoach". You have access to the user's real financial data below. Answer questions conversationally, be specific with numbers, and give actionable advice. Keep responses concise (under 150 words). Use the user's currency (${user.currency}).

User's Financial Data:
${JSON.stringify(financialContext, null, 2)}`;

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const messages = [
      { role: "assistant" as const, content: systemPrompt },
      ...(history || []),
      { role: "user" as const, content: message },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content || "I couldn't process that. Please try again.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Coach error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
