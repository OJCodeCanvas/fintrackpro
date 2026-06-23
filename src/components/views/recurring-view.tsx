"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Calendar,
  Repeat,
  Pause,
  Play,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Recurring, Category, Account } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function frequencyLabel(r: Recurring): string {
  switch (r.frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return r.dayOfMonth ? `Monthly on day ${r.dayOfMonth}` : "Monthly";
    case "yearly":
      return "Yearly";
    default:
      return r.frequency;
  }
}

export function RecurringView() {
  const { currency } = useAppStore();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [deleteItem, setDeleteItem] = useState<Recurring | null>(null);

  const { data, isLoading } = useQuery<{ recurring: Recurring[] }>({
    queryKey: ["recurring"],
    queryFn: () => apiFetch<{ recurring: Recurring[] }>("/api/recurring"),
  });

  const { data: catData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ categories: Category[] }>("/api/categories"),
  });

  const { data: accData } = useQuery<{ accounts: Account[] }>({
    queryKey: ["accounts"],
    queryFn: () => apiFetch<{ accounts: Account[] }>("/api/accounts"),
  });

  const recurring = data?.recurring || [];
  const categories = catData?.categories || [];
  const accounts = accData?.accounts || [];

  const processMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; created: number }>("/api/recurring/process", {
        method: "POST",
      }),
    onSuccess: (res) => {
      toast.success(
        `Processed ${res.created} ${res.created === 1 ? "transaction" : "transactions"}`
      );
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch(`/api/recurring/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/recurring/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      toast.success("Recurring transaction deleted");
      setDeleteItem(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Stats
  const activeCount = recurring.filter((r) => r.isActive).length;
  const monthlyExpenseTotal = recurring
    .filter((r) => r.isActive && r.type === "expense" && r.frequency === "monthly")
    .reduce((s, r) => s + r.amount, 0);
  const upcoming = recurring
    .filter((r) => r.isActive)
    .sort(
      (a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime()
    )[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Recurring Transactions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automate repeating income and expenses
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending}
            className="w-fit"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${processMutation.isPending ? "animate-spin" : ""}`}
            />
            Process Now
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="w-fit"
          >
            <Plus className="w-4 h-4 mr-1" /> New Recurring
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Repeat className="w-3.5 h-3.5" /> Active
            </div>
            <div className="text-2xl font-bold">{activeCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              of {recurring.length} total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Monthly expenses
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyExpenseTotal, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              sum of active monthly
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5" /> Next upcoming
            </div>
            <div className="text-2xl font-bold">
              {upcoming ? formatDate(upcoming.nextDate) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {upcoming ? upcoming.category.name : "no active recurring"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : recurring.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No recurring transactions</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Automate repeating income and expenses like rent, salary, or
              subscriptions
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Create Recurring
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recurring.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className={`group ${!r.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ background: r.category.color }}
                    >
                      <CategoryIcon name={r.category.icon} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{r.category.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          <Repeat className="w-3 h-3 mr-1" />
                          {frequencyLabel(r)}
                        </Badge>
                        {r.account && (
                          <Badge variant="outline" className="text-xs">
                            {r.account.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Next:{" "}
                          <span className="text-foreground font-medium">
                            {formatDate(r.nextDate)}
                          </span>
                        </span>
                        {r.endDate && (
                          <span className="inline-flex items-center gap-1">
                            · Until: {formatDate(r.endDate)}
                          </span>
                        )}
                      </div>
                      {r.notes && (
                        <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {r.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div
                        className={`font-semibold ${
                          r.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : ""
                        }`}
                      >
                        {r.type === "income" ? "+" : "-"}
                        {formatCurrency(r.amount, currency)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.isActive}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: r.id, isActive: checked })
                          }
                          aria-label={r.isActive ? "Pause" : "Activate"}
                        />
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          {r.isActive ? (
                            <>
                              <Play className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3" /> Paused
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2 -mb-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditing(r);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteItem(r)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <RecurringModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        categories={categories}
        accounts={accounts}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete recurring transaction for &ldquo;{deleteItem?.category.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will stop future auto-generated transactions. Past
              transactions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
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

function RecurringModal({
  open,
  onOpenChange,
  editing,
  categories,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Recurring | null;
  categories: Category[];
  accounts: Account[];
}) {
  // The Dialog content unmounts when closed, so we use a key-based inner form
  // that re-initializes its state from props on each open. This avoids any
  // setState-in-effect patterns.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <RecurringForm
          key={editing?.id ?? "new"}
          editing={editing}
          categories={categories}
          accounts={accounts}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function RecurringForm({
  editing,
  categories,
  accounts,
  onDone,
}: {
  editing: Recurring | null;
  categories: Category[];
  accounts: Account[];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<"income" | "expense">(
    editing?.type ?? "expense"
  );
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [accountId, setAccountId] = useState(editing?.accountId ?? "none");
  const [frequency, setFrequency] = useState(editing?.frequency ?? "monthly");
  const [dayOfMonth, setDayOfMonth] = useState(
    editing?.dayOfMonth ? String(editing.dayOfMonth) : ""
  );
  const [startDate, setStartDate] = useState(
    editing ? editing.startDate.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    editing?.endDate ? editing.endDate.split("T")[0] : ""
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const filteredCategories = categories.filter((c) => c.type === type);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        amount: parseFloat(amount),
        type,
        categoryId,
        accountId: accountId === "none" ? null : accountId,
        frequency,
        dayOfMonth:
          frequency === "monthly" && dayOfMonth ? parseInt(dayOfMonth, 10) : null,
        startDate,
        endDate: endDate || null,
        notes,
      };
      if (editing) {
        return apiFetch(`/api/recurring/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return apiFetch("/api/recurring", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      toast.success(editing ? "Recurring updated" : "Recurring created");
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !frequency || !startDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    mutation.mutate();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Recurring" : "New Recurring"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Update the recurring transaction details"
            : "Set up a new recurring income or expense"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setCategoryId("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all ${
              type === "expense"
                ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                : "border-border hover:border-red-300"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span className="font-medium text-sm">Expense</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setCategoryId("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all ${
              type === "income"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                : "border-border hover:border-emerald-300"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span className="font-medium text-sm">Income</span>
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rcr-amount">Amount *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="rcr-amount"
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

        <div className="space-y-2">
          <Label htmlFor="rcr-category">Category *</Label>
          <Select value={categoryId} onValueChange={setCategoryId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: c.color }}
                    />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rcr-account">
            Account{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="No account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No account</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="rcr-frequency">Frequency *</Label>
            <Select value={frequency} onValueChange={setFrequency} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {frequency === "monthly" && (
            <div className="space-y-2">
              <Label htmlFor="rcr-day">
                Day of month{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="rcr-day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 1"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="rcr-start">Start date *</Label>
            <Input
              id="rcr-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rcr-end">
              End date{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="rcr-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rcr-notes">Notes</Label>
          <Textarea
            id="rcr-notes"
            placeholder="Add a note..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
