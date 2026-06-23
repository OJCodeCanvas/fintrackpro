"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Target, AlertTriangle, CheckCircle2, Trash2, Pencil, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryIcon } from "@/components/category-icon";
import { apiFetch } from "@/lib/api-client";
import { Budget, Category, Summary } from "@/lib/types";
import { formatCurrency, formatMonthYear, getCurrentMonth } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export function BudgetsView() {
  const { currency } = useAppStore();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteBudget, setDeleteBudget] = useState<Budget | null>(null);
  const { month: currentMonth, year: currentYear } = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: catData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ categories: Category[] }>("/api/categories"),
  });
  const expenseCategories = catData?.categories.filter((c) => c.type === "expense") || [];

  const { data: budgetData, isLoading } = useQuery<{ budgets: Budget[] }>({
    queryKey: ["budgets", selectedMonth, selectedYear],
    queryFn: () =>
      apiFetch<{ budgets: Budget[] }>(
        `/api/budgets?month=${selectedMonth}&year=${selectedYear}`
      ),
  });

  const { data: summary } = useQuery<Summary>({
    queryKey: ["summary"],
    queryFn: () => apiFetch<Summary>("/api/reports/summary"),
  });

  const budgets = budgetData?.budgets || [];

  // Get spending for each budget's category
  const getSpending = (categoryId: string): number => {
    if (!summary) return 0;
    // We need to fetch current month spending per category — use the budgetProgress if current month
    if (selectedMonth === currentMonth && selectedYear === currentYear) {
      const bp = summary.budgetProgress.find((b) => b.categoryId === categoryId);
      return bp?.spent || 0;
    }
    return 0;
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      toast.success("Budget deleted");
      setDeleteBudget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + getSpending(b.categoryId), 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" }),
  }));
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set monthly spending limits and track progress
          </p>
        </div>
        <Button onClick={() => { setEditingBudget(null); setModalOpen(true); }} className="w-fit">
          <Plus className="w-4 h-4 mr-1" /> New Budget
        </Button>
      </div>

      {/* Month/Year selector + overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-xs">Period</Label>
            <div className="flex gap-2">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Budget</div>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget, currency)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {budgets.length} {budgets.length === 1 ? "category" : "categories"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Spent</div>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent, currency)}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(totalPercentage, 100)}%`,
                    background: totalPercentage >= 100 ? "var(--destructive)" : totalPercentage >= 80 ? "#f59e0b" : "var(--primary)",
                  }}
                />
              </div>
              <span className="text-xs font-medium">{totalPercentage.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Target className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No budgets for {formatMonthYear(selectedMonth, selectedYear)}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set spending limits to track your goals
            </p>
            <Button onClick={() => { setEditingBudget(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Create Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((b, i) => {
            const spent = getSpending(b.categoryId);
            const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
            const remaining = b.amount - spent;
            const isOver = percentage >= 100;
            const isWarning = percentage >= 80 && percentage < 100;
            const isGood = percentage < 80;

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="group">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ background: b.category.color }}
                      >
                        <CategoryIcon name={b.category.icon} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{b.category.name}</span>
                          {isOver && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                              <AlertTriangle className="w-3 h-3" /> Over budget
                            </span>
                          )}
                          {isWarning && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="w-3 h-3" /> Almost there
                            </span>
                          )}
                          {isGood && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> On track
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {formatCurrency(spent, currency)} of {formatCurrency(b.amount, currency)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => { setEditingBudget(b); setModalOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteBudget(b)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{percentage.toFixed(0)}% used</span>
                        <span className={remaining < 0 ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}>
                          {remaining < 0 ? `${formatCurrency(Math.abs(remaining), currency)} over` : `${formatCurrency(remaining, currency)} left`}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percentage, 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{
                            background: isOver ? "var(--destructive)" : isWarning ? "#f59e0b" : b.category.color,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingBudget={editingBudget}
        categories={expenseCategories}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />

      {/* Delete */}
      <AlertDialog open={!!deleteBudget} onOpenChange={(open) => !open && setDeleteBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete budget for "{deleteBudget?.category.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the spending limit. Your transactions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBudget && deleteMutation.mutate(deleteBudget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BudgetModal({
  open,
  onOpenChange,
  editingBudget,
  categories,
  defaultMonth,
  defaultYear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBudget: Budget | null;
  categories: Category[];
  defaultMonth: number;
  defaultYear: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <BudgetForm
          key={editingBudget?.id ?? "new"}
          editingBudget={editingBudget}
          categories={categories}
          defaultMonth={defaultMonth}
          defaultYear={defaultYear}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function BudgetForm({
  editingBudget,
  categories,
  defaultMonth,
  defaultYear,
  onDone,
}: {
  editingBudget: Budget | null;
  categories: Category[];
  defaultMonth: number;
  defaultYear: number;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(editingBudget ? String(editingBudget.amount) : "");
  const [categoryId, setCategoryId] = useState(editingBudget?.categoryId ?? "");
  const [month, setMonth] = useState(editingBudget?.month ?? defaultMonth);
  const [year, setYear] = useState(editingBudget?.year ?? defaultYear);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = { amount: parseFloat(amount), month, year, categoryId };
      if (editingBudget) {
        return apiFetch(`/api/budgets/${editingBudget.id}`, {
          method: "PUT",
          body: JSON.stringify({ amount: parseFloat(amount) }),
        });
      }
      return apiFetch("/api/budgets", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      toast.success(editingBudget ? "Budget updated" : "Budget created");
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }
    mutation.mutate();
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" }),
  }));

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editingBudget ? "Edit Budget" : "New Budget"}</DialogTitle>
        <DialogDescription>
          {editingBudget ? "Update the spending limit" : "Set a monthly spending limit for a category"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
          {!editingBudget && (
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="budget-amount">Monthly Limit *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
          </div>

          {!editingBudget && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[defaultYear - 1, defaultYear, defaultYear + 1].map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {editingBudget && (
            <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Budget for <span className="font-medium text-foreground">{editingBudget.category.name}</span> · {formatMonthYear(editingBudget.month, editingBudget.year)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : editingBudget ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}
