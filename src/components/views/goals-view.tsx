"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Goal } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#10b981", "#22c55e", "#84cc16", "#14b8a6", "#06b6d4",
  "#f97316", "#ef4444", "#8b5cf6", "#0ea5e9", "#ec4899",
  "#f59e0b", "#e11d48", "#6366f1", "#a855f7", "#64748b",
];

const ICON_OPTIONS = [
  "Target", "Shield", "Plane", "Laptop", "Home", "Car",
  "Gift", "GraduationCap", "Heart", "Star", "Trophy", "PiggyBank",
];

const ACCENT = "#10b981";

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function GoalsView() {
  const { currency } = useAppStore();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [fundsGoal, setFundsGoal] = useState<Goal | null>(null);

  const { data, isLoading } = useQuery<{ goals: Goal[] }>({
    queryKey: ["goals"],
    queryFn: () => apiFetch<{ goals: Goal[] }>("/api/goals"),
  });

  const goals = data?.goals || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted");
      setDeleteGoal(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track progress toward your financial goals
          </p>
        </div>
        <Button
          onClick={() => { setEditingGoal(null); setModalOpen(true); }}
          className="w-fit"
          style={{ background: ACCENT }}
        >
          <Plus className="w-4 h-4 mr-1" /> New Goal
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="w-3.5 h-3.5" /> Total Goals
            </div>
            <div className="text-2xl font-bold">{goals.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {goals.length === 1 ? "goal in progress" : "goals in progress"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total Saved
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalSaved, currency)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              across all goals
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5" /> Total Target
              </div>
              <span className="text-xs font-medium">{totalPercentage.toFixed(0)}%</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalTarget, currency)}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(totalPercentage, 100)}%`,
                    background: ACCENT,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Target className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No savings goals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set your first goal and start tracking your progress
            </p>
            <Button onClick={() => { setEditingGoal(null); setModalOpen(true); }} style={{ background: ACCENT }}>
              <Plus className="w-4 h-4 mr-1" /> Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g, i) => {
            const percentage = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const isCompleted = percentage >= 100;
            const remaining = g.targetAmount - g.currentAmount;

            let daysLeft: number | null = null;
            let isOverdue = false;
            if (g.targetDate) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const target = new Date(g.targetDate);
              target.setHours(0, 0, 0, 0);
              daysLeft = daysBetween(today, target);
              isOverdue = daysLeft < 0;
            }

            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group h-full flex flex-col">
                  <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
                    {/* Top row: icon + name + actions */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ background: g.color }}
                      >
                        <CategoryIcon name={g.icon} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{g.name}</span>
                          {isCompleted && (
                            <Badge className="bg-emerald-500 text-white border-transparent text-[10px] h-5">
                              <CheckCircle2 className="w-3 h-3" /> Completed!
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {formatCurrency(g.currentAmount, currency)} / {formatCurrency(g.targetAmount, currency)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => { setEditingGoal(g); setModalOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteGoal(g)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5 mt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{percentage.toFixed(0)}% funded</span>
                        <span className="text-muted-foreground">
                          {remaining > 0
                            ? `${formatCurrency(remaining, currency)} to go`
                            : "Goal reached"}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percentage, 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: isCompleted ? "#10b981" : g.color }}
                        />
                      </div>
                    </div>

                    {/* Target date row */}
                    {g.targetDate && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Target: {formatDate(g.targetDate)}
                        </span>
                        {daysLeft !== null && !isOverdue && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium ml-auto">
                            <Clock className="w-3 h-3" /> in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium ml-auto">
                            <Clock className="w-3 h-3" /> overdue
                          </span>
                        )}
                      </div>
                    )}

                    {/* Add funds buttons */}
                    <div className="mt-auto pt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setFundsGoal(g)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Funds
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => setFundsGoal(g)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      <GoalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingGoal={editingGoal}
      />

      {/* Add funds dialog */}
      <FundsDialog
        open={!!fundsGoal}
        onOpenChange={(open) => !open && setFundsGoal(null)}
        goal={fundsGoal}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteGoal} onOpenChange={(open) => !open && setDeleteGoal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteGoal?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this savings goal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGoal && deleteMutation.mutate(deleteGoal.id)}
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

/* ---------------- Add/Edit Modal ---------------- */

function GoalModal({
  open,
  onOpenChange,
  editingGoal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal: Goal | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <GoalForm
          key={editingGoal?.id ?? "new"}
          editingGoal={editingGoal}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function GoalForm({
  editingGoal,
  onDone,
}: {
  editingGoal: Goal | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(editingGoal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    editingGoal ? String(editingGoal.targetAmount) : ""
  );
  const [currentAmount, setCurrentAmount] = useState(
    editingGoal ? String(editingGoal.currentAmount) : "0"
  );
  const [color, setColor] = useState(editingGoal?.color ?? PRESET_COLORS[0]);
  const [icon, setIcon] = useState(editingGoal?.icon ?? "Target");
  const [targetDate, setTargetDate] = useState(
    editingGoal?.targetDate ? editingGoal.targetDate.slice(0, 10) : ""
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || "0"),
        color,
        icon,
        targetDate: targetDate || null,
      };
      if (editingGoal) {
        return apiFetch(`/api/goals/${editingGoal.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return apiFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success(editingGoal ? "Goal updated" : "Goal created");
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }
    mutation.mutate();
  };

  // Live preview values
  const previewTarget = parseFloat(targetAmount) || 0;
  const previewCurrent = parseFloat(currentAmount) || 0;
  const previewPct = previewTarget > 0 ? Math.min((previewCurrent / previewTarget) * 100, 100) : 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editingGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
        <DialogDescription>
          {editingGoal ? "Update your savings goal" : "Set a new savings goal to track"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal-name">Name *</Label>
          <Input
            id="goal-name"
            placeholder="e.g. Emergency Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="goal-target">Target Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="goal-target"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-current">Current Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="goal-current"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"
                }`}
                style={{ background: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1">
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-full aspect-square rounded-lg flex items-center justify-center border-2 transition-all ${
                  icon === ic ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
                aria-label={`Select icon ${ic}`}
              >
                <CategoryIcon name={ic} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal-date">Target Date (optional)</Label>
          <Input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>

        {/* Live preview */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground mb-2">Preview</div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: color }}
            >
              <CategoryIcon name={icon} className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{name || "Goal name"}</div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(previewCurrent, "USD")} / {formatCurrency(previewTarget, "USD")}
              </div>
            </div>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${previewPct}%`,
                background: previewPct >= 100 ? "#10b981" : color,
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} style={{ background: ACCENT }}>
            {mutation.isPending ? "Saving..." : editingGoal ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/* ---------------- Add Funds Dialog ---------------- */

function FundsDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}) {
  if (!goal) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <FundsForm key={goal.id} goal={goal} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FundsForm({
  goal,
  onDone,
}: {
  goal: Goal;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const { currency } = useAppStore();
  const [amount, setAmount] = useState("");

  const newTotal = goal.currentAmount + (parseFloat(amount) || 0);
  const newPct = goal.targetAmount > 0 ? Math.min((newTotal / goal.targetAmount) * 100, 100) : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const add = parseFloat(amount);
      if (!add || add <= 0) throw new Error("Enter a valid amount");
      return apiFetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        body: JSON.stringify({ currentAmount: newTotal }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success(`Added ${formatCurrency(parseFloat(amount), currency)} to ${goal.name}`);
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Funds to "{goal.name}"</DialogTitle>
        <DialogDescription>
          Current: {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="funds-amount">Amount to Add *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="funds-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">New total</span>
            <span className="font-medium">{formatCurrency(newTotal, currency)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">New progress</span>
            <span className="font-medium">{newPct.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${newPct}%`,
                background: newPct >= 100 ? "#10b981" : goal.color,
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} style={{ background: ACCENT }}>
            {mutation.isPending ? "Adding..." : "Add Funds"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
