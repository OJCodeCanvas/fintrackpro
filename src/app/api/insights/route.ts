import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfYear, lte: endOfYear },
      },
      include: { category: true },
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        insights: "Add some transactions first, then I'll be able to analyze your spending patterns and give you personalized insights.",
      });
    }

    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const byCategory = new Map<string, { name: string; color: string; total: number }>();
    for (const t of transactions.filter((t) => t.type === "expense")) {
      const existing = byCategory.get(t.category.name) || { name: t.category.name, color: t.category.color, total: 0 };
      existing.total += t.amount;
      byCategory.set(t.category.name, existing);
    }
    const topCategories = Array.from(byCategory.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const monthly: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
      const key = new Date(t.date).toLocaleDateString("en-US", { month: "short" });
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      if (t.type === "income") monthly[key].income += t.amount;
      else monthly[key].expense += t.amount;
    }

    const context = {
      currency: user.currency,
      year,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netSavings: Math.round((totalIncome - totalExpense) * 100) / 100,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10 : 0,
      topExpenseCategories: topCategories.map((c) => ({ name: c.name, amount: Math.round(c.total * 100) / 100 })),
      monthlyBreakdown: Object.entries(monthly).map(([month, v]) => ({
        month,
        income: Math.round(v.income * 100) / 100,
        expense: Math.round(v.expense * 100) / 100,
      })),
      transactionCount: transactions.length,
    };

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const systemPrompt = `You are a friendly, concise personal finance advisor. Analyze the user's financial data and provide actionable insights. Be specific, use numbers, and keep it under 250 words. Structure your response with 3-4 short sections using markdown headings (##) like "## Spending Patterns", "## Top Insights", "## Recommendations". Do not use emoji.`;

    const userPrompt = `Here is my financial data for ${year} (in ${context.currency}):\n\n${JSON.stringify(context, null, 2)}\n\nAnalyze my spending patterns, highlight anything notable (good or concerning), and give me 2-3 specific actionable recommendations to improve my finances.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    const insights = completion.choices[0]?.message?.content || "Unable to generate insights at this time.";

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights. Please try again later." },
      { status: 500 }
    );
  }
}
