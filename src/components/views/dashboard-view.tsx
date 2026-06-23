"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api-client";
import { Summary, Transaction } from "@/lib/types";
import { formatCurrency, formatCompact, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export function DashboardView() {
  const { currency, setView } = useAppStore();

  const { data: summary, isLoading: summaryLoading } = useQuery<Summary>({
    queryKey: ["summary"],
    queryFn: () => apiFetch<Summary>("/api/reports/summary"),
  });

  const { data: recentTxData } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ["transactions", "recent"],
    queryFn: () => apiFetch<{ transactions: Transaction[] }>("/api/transactions?limit=5&sort=date-desc"),
  });

  if (summaryLoading || !summary) {
    return <DashboardSkeleton />;
  }

  const chartData = summary.monthlyData.slice(-6).map((m) => ({
    name: m.monthName,
    Income: m.income,
    Expense: m.expense,
  }));

  const pieData = summary.spendingByCategory.slice(0, 6);
  const savingsRate = summary.currentMonth.income > 0
    ? ((summary.currentMonth.income - summary.currentMonth.expense) / summary.currentMonth.income) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button onClick={() => setView("transactions")} className="w-fit">
          <ArrowUpRight className="w-4 h-4 mr-1" /> View Transactions
        </Button>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(summary.totalBalance, currency)}
          icon={Wallet}
          gradient="from-emerald-500 to-teal-600"
          delay={0}
        />
        <StatCard
          title="This Month Income"
          value={formatCurrency(summary.currentMonth.income, currency)}
          icon={ArrowUpRight}
          subtitle="current month"
          delay={0.05}
        />
        <StatCard
          title="This Month Expenses"
          value={formatCurrency(summary.currentMonth.expense, currency)}
          icon={ArrowDownRight}
          subtitle="current month"
          delay={0.1}
        />
        <StatCard
          title="Savings Rate"
          value={`${savingsRate.toFixed(0)}%`}
          icon={TrendingUp}
          subtitle="this month"
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Income vs Expenses</CardTitle>
            <p className="text-xs text-muted-foreground">Last 6 months overview</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tickFormatter={(v) => formatCompact(v, currency)} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, currency)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      fontSize: "13px",
                    }}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
                No expenses this month
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value, currency)}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        background: "var(--popover)",
                        color: "var(--popover-foreground)",
                        fontSize: "13px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget alerts + Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" /> Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.budgetProgress.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No budgets set for this month.
                <Button variant="link" size="sm" onClick={() => setView("budgets")} className="block mx-auto">
                  Set up budgets →
                </Button>
              </div>
            ) : (
              summary.budgetProgress.slice(0, 4).map((b) => (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-1.5">
                      {b.percentage >= 90 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      {b.categoryName}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatCurrency(b.spent, currency)} / {formatCurrency(b.budget, currency)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(b.percentage, 100)}%`,
                        background: b.percentage >= 100 ? "var(--destructive)" : b.percentage >= 80 ? "#f59e0b" : b.categoryColor,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setView("transactions")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recentTxData?.transactions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No transactions yet. Add your first one!
              </div>
            ) : (
              <div className="space-y-1">
                {recentTxData?.transactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ background: tx.category.color }}
                    >
                      {tx.type === "income" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{tx.category.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatDate(tx.date)}
                        {tx.notes && ` · ${tx.notes}`}
                      </div>
                    </div>
                    <div className={`font-semibold text-sm ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, currency)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  gradient,
  delay = 0,
}: {
  title: string;
  value: string;
  icon: any;
  subtitle?: string;
  gradient?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden">
        {gradient && (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
        )}
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${gradient ? `bg-gradient-to-br ${gradient}` : "bg-primary/10"}`}>
              <Icon className={`w-4 h-4 ${gradient ? "text-white" : "text-primary"}`} />
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-medium">{title}</div>
          <div className="text-2xl font-bold mt-1 tracking-tight">{value}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-80 bg-muted rounded-xl animate-pulse lg:col-span-2" />
        <div className="h-80 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
