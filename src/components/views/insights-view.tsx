"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw, Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { Summary } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export function InsightsView() {
  const { currency } = useAppStore();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [fetchKey, setFetchKey] = useState(0);

  const { data: summary } = useQuery<Summary>({
    queryKey: ["summary", year],
    queryFn: () => apiFetch<Summary>(`/api/reports/summary?year=${year}`),
  });

  const { data: insightsData, isLoading, isFetching, error } = useQuery<{ insights: string }>({
    queryKey: ["insights", year, fetchKey],
    queryFn: () => apiFetch<{ insights: string }>(`/api/insights?year=${year}`),
    retry: false,
  });

  const refresh = () => setFetchKey((k) => k + 1);

  const savingsRate = summary && summary.yearTotals.income > 0
    ? (summary.yearTotals.balance / summary.yearTotals.income) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
            AI Insights
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 gap-1">
              <Sparkles className="w-3 h-3" /> AI
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personalized analysis of your spending patterns
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
          <Button variant="outline" onClick={refresh} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickStat
            label="Year Income"
            value={formatCurrency(summary.yearTotals.income, currency)}
            icon={TrendingUp}
            color="emerald"
          />
          <QuickStat
            label="Year Expenses"
            value={formatCurrency(summary.yearTotals.expense, currency)}
            icon={TrendingDown}
            color="red"
          />
          <QuickStat
            label="Net Savings"
            value={formatCurrency(summary.yearTotals.balance, currency)}
            icon={Sparkles}
            color={summary.yearTotals.balance >= 0 ? "emerald" : "red"}
          />
          <QuickStat
            label="Savings Rate"
            value={`${savingsRate.toFixed(1)}%`}
            icon={Lightbulb}
            color="amber"
          />
        </div>
      )}

      {/* AI Insights panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            Your Financial Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || isFetching ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing your financial data...
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold mb-1">Couldn't generate insights</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {(error as Error).message || "Something went wrong"}
              </p>
              <Button onClick={refresh}>
                <RefreshCw className="w-4 h-4 mr-1" /> Try Again
              </Button>
            </div>
          ) : insightsData?.insights ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-sm dark:prose-invert max-w-none"
            >
              <InsightsMarkdown content={insightsData.insights} />
            </motion.div>
          ) : null}
        </CardContent>
      </Card>

      {/* Tips card */}
      <Card className="bg-muted/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-sm">
              <div className="font-medium mb-1">How this works</div>
              <p className="text-muted-foreground">
                AI Insights analyzes your transaction history, spending categories, and monthly trends
                to provide personalized observations and recommendations. The more transactions you
                record, the more accurate the insights become. Click "Refresh" to regenerate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: "emerald" | "red" | "amber";
}) {
  const colorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold mt-0.5">{value}</div>
      </CardContent>
    </Card>
  );
}

// Lightweight markdown renderer for the LLM's ## headings and paragraphs
function InsightsMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          const heading = block.substring(3);
          const rest = heading.includes("\n") ? heading.split("\n").slice(1).join("\n") : "";
          const title = heading.split("\n")[0];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <h3 className="font-semibold text-base flex items-center gap-2 mb-2 text-foreground">
                <span className="w-1 h-4 bg-primary rounded-full" />
                {title}
              </h3>
              {rest && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{rest}</p>}
            </motion.div>
          );
        }
        return (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
          >
            {block}
          </motion.p>
        );
      })}
    </div>
  );
}
