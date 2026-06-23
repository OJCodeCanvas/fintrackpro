"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Calendar, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { Summary, Category, Account } from "@/lib/types";
import { formatCurrency, formatCompact } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export function ReportsView() {
  const { currency } = useAppStore();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [exportOpen, setExportOpen] = useState(false);

  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ["summary", year],
    queryFn: () => apiFetch<Summary>(`/api/reports/summary?year=${year}`),
  });

  const { data: catData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ categories: Category[] }>("/api/categories"),
  });
  const { data: accData } = useQuery<{ accounts: Account[] }>({
    queryKey: ["accounts"],
    queryFn: () => apiFetch<{ accounts: Account[] }>("/api/accounts"),
  });

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const monthlyData = summary.monthlyData;
  const pieData = summary.spendingByCategory;
  const avgMonthlyExpense = summary.yearTotals.expense / 12;
  const avgMonthlyIncome = summary.yearTotals.income / 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Insights into your financial patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear - 2, currentYear - 1, currentYear].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title={`${year} Total Income`}
          value={formatCurrency(summary.yearTotals.income, currency)}
          icon={TrendingUp}
          color="emerald"
          subtitle={`Avg ${formatCurrency(avgMonthlyIncome, currency)}/mo`}
        />
        <SummaryCard
          title={`${year} Total Expenses`}
          value={formatCurrency(summary.yearTotals.expense, currency)}
          icon={TrendingDown}
          color="red"
          subtitle={`Avg ${formatCurrency(avgMonthlyExpense, currency)}/mo`}
        />
        <SummaryCard
          title={`${year} Net Savings`}
          value={formatCurrency(summary.yearTotals.balance, currency)}
          icon={Wallet}
          color={summary.yearTotals.balance >= 0 ? "emerald" : "red"}
          subtitle={`${summary.yearTotals.income > 0 ? ((summary.yearTotals.balance / summary.yearTotals.income) * 100).toFixed(1) : 0}% savings rate`}
        />
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Monthly Trend — {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="monthName" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatCompact(v, currency)} tick={{ fontSize: 12 }} />
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
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Balance trend + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Monthly net balance over the year</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="monthName" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatCompact(v, currency)} tick={{ fontSize: 12 }} />
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
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--primary)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">By category, current month</p>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
                No spending data for current month
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
                      outerRadius={90}
                      label={(entry: any) => `${entry.name}`}
                      labelLine={false}
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Current month spending by category</p>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No data available</div>
          ) : (
            <div className="space-y-2">
              {pieData.map((cat, i) => {
                const total = pieData.reduce((s, c) => s + c.value, 0);
                const pct = total > 0 ? (cat.value / total) * 100 : 0;
                return (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                    <div className="flex-1 font-medium text-sm">{cat.name}</div>
                    <div className="text-sm font-semibold">{formatCurrency(cat.value, currency)}</div>
                    <div className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        categories={catData?.categories || []}
        accounts={accData?.accounts || []}
      />
    </div>
  );
}

function ExportDialog({
  open,
  onOpenChange,
  categories,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  accounts: Account[];
}) {
  const [type, setType] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [accountId, setAccountId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (type !== "all") params.set("type", type);
      if (categoryId !== "all") params.set("categoryId", categoryId);
      if (accountId !== "all") params.set("accountId", accountId);
      if (startDate) params.set("startDate", new Date(startDate).toISOString());
      if (endDate) params.set("endDate", new Date(endDate).toISOString());

      const res = await fetch(`/api/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fintrack-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setDownloading(false);
    }
  };

  const quickRange = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Transactions
          </DialogTitle>
          <DialogDescription>
            Download a CSV file of your transactions with optional filters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick ranges */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => quickRange(1)}>Last month</Button>
            <Button size="sm" variant="outline" onClick={() => quickRange(3)}>3 months</Button>
            <Button size="sm" variant="outline" onClick={() => quickRange(6)}>6 months</Button>
            <Button size="sm" variant="outline" onClick={() => quickRange(12)}>1 year</Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income only</SelectItem>
                <SelectItem value="expense">Expenses only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5 shrink-0" />
            Filters are optional — leave blank to export everything
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={downloading}>
            <Download className="w-4 h-4 mr-1" />
            {downloading ? "Downloading..." : "Download CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  color: "emerald" | "red";
  subtitle?: string;
}) {
  const colorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-xs text-muted-foreground font-medium">{title}</div>
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
