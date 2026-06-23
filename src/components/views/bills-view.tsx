"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Repeat,
  Clock,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { apiFetch } from "@/lib/api-client";
import { Bill } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

function getBillStatus(bill: Bill): { label: string; color: "red" | "amber" | "emerald" | "muted" } {
  if (bill.isPaid) return { label: "Paid", color: "muted" };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(bill.dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return { label: `Overdue by ${-diffDays} day${-diffDays === 1 ? "" : "s"}`, color: "red" };
  if (diffDays === 0) return { label: "Due today", color: "amber" };
  if (diffDays <= 7) return { label: `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`, color: "emerald" };
  return { label: `Due in ${diffDays} days`, color: "muted" };
}

const colorClasses = {
  red: "text-red-600 dark:text-red-400 bg-red-500/10",
  amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  muted: "text-muted-foreground bg-muted",
};

type FilterTab = "all" | "upcoming" | "overdue" | "paid";

export function BillsView() {
  const { currency } = useAppStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deleteBill, setDeleteBill] = useState<Bill | null>(null);

  const { data, isLoading } = useQuery<{ bills: Bill[] }>({
    queryKey: ["bills"],
    queryFn: () => apiFetch<{ bills: Bill[] }>("/api/bills"),
  });

  const allBills = data?.bills || [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filtered = allBills.filter((b) => {
    if (filter === "all") return true;
    if (filter === "paid") return b.isPaid;
    if (filter === "upcoming") return !b.isPaid;
    if (filter === "overdue") {
      const due = new Date(b.dueDate);
      due.setHours(0, 0, 0, 0);
      return !b.isPaid && due < now;
    }
    return true;
  });

  const upcomingTotal = allBills.filter((b) => !b.isPaid).reduce((s, b) => s + b.amount, 0);
  const overdueCount = allBills.filter((b) => {
    const due = new Date(b.dueDate);
    due.setHours(0, 0, 0, 0);
    return !b.isPaid && due < now;
  }).length;

  const togglePaid = useMutation({
    mutationFn: (bill: Bill) =>
      apiFetch(`/api/bills/${bill.id}`, {
        method: "PUT",
        body: JSON.stringify({ isPaid: !bill.isPaid }),
      }),
    onSuccess: (_data, bill) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success(bill.isPaid ? "Marked as unpaid" : "Marked as paid");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/bills/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Bill deleted");
      setDeleteBill(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const tabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: "upcoming", label: "Upcoming", count: allBills.filter((b) => !b.isPaid).length },
    { id: "overdue", label: "Overdue", count: overdueCount },
    { id: "paid", label: "Paid", count: allBills.filter((b) => b.isPaid).length },
    { id: "all", label: "All", count: allBills.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Bills & Reminders</h1>
          <p className="text-muted-foreground text-sm mt-1">Never miss a payment</p>
        </div>
        <Button onClick={() => { setEditingBill(null); setModalOpen(true); }} className="w-fit">
          <Plus className="w-4 h-4 mr-1" /> New Bill
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Upcoming</div>
              <div className="text-2xl font-bold">{formatCurrency(upcomingTotal, currency)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${overdueCount > 0 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
              <AlertTriangle className={`w-5 h-5 ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Overdue</div>
              <div className="text-2xl font-bold">{overdueCount} {overdueCount === 1 ? "bill" : "bills"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="inline-flex rounded-lg border bg-muted p-1 flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              filter === t.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Bills list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No bills here</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === "overdue" ? "You're all caught up!" : "Add a bill to get reminders"}
            </p>
            <Button onClick={() => { setEditingBill(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> New Bill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((bill, i) => {
            const status = getBillStatus(bill);
            return (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[status.color]}`}>
                      {bill.isPaid ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : status.color === "red" ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Calendar className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{bill.name}</span>
                        {bill.isRecurring && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-0.5">
                            <Repeat className="w-2.5 h-2.5" /> Recurring
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] h-4 px-1 ${colorClasses[status.color]}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {formatDate(bill.dueDate)}
                        {bill.notes && ` · ${bill.notes}`}
                      </div>
                    </div>
                    <div className="font-semibold text-sm shrink-0">
                      {formatCurrency(bill.amount, currency)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant={bill.isPaid ? "outline" : "default"}
                        className="h-8"
                        onClick={() => togglePaid.mutate(bill)}
                        disabled={togglePaid.isPending}
                      >
                        {bill.isPaid ? "Unpay" : "Mark Paid"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setEditingBill(bill); setModalOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteBill(bill)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <BillModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingBill={editingBill}
      />

      {/* Delete */}
      <AlertDialog open={!!deleteBill} onOpenChange={(open) => !open && setDeleteBill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteBill?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBill && deleteMutation.mutate(deleteBill.id)}
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

function BillModal({
  open,
  onOpenChange,
  editingBill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBill: Bill | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <BillForm
          key={editingBill?.id ?? "new"}
          editingBill={editingBill}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function BillForm({
  editingBill,
  onDone,
}: {
  editingBill: Bill | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);

  const [name, setName] = useState(editingBill?.name ?? "");
  const [amount, setAmount] = useState(editingBill ? String(editingBill.amount) : "");
  const [dueDate, setDueDate] = useState(
    editingBill ? editingBill.dueDate.split("T")[0] : defaultDue.toISOString().split("T")[0]
  );
  const [isRecurring, setIsRecurring] = useState(editingBill?.isRecurring ?? false);
  const [notes, setNotes] = useState(editingBill?.notes ?? "");

  const mutation = useMutation({
    mutationFn: async () => {
      const body = { name, amount, dueDate, isRecurring, notes };
      if (editingBill) {
        return apiFetch(`/api/bills/${editingBill.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return apiFetch("/api/bills", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success(editingBill ? "Bill updated" : "Bill added");
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    mutation.mutate();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editingBill ? "Edit Bill" : "New Bill"}</DialogTitle>
        <DialogDescription>
          {editingBill ? "Update the bill details" : "Add a bill to get reminded before it's due"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bill-name">Name *</Label>
          <Input
            id="bill-name"
            placeholder="e.g. Electricity Bill"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bill-amount">Amount *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="bill-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bill-due">Due Date *</Label>
          <Input
            id="bill-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label htmlFor="bill-recurring" className="cursor-pointer">Recurring bill</Label>
            <p className="text-xs text-muted-foreground">This bill repeats monthly</p>
          </div>
          <Switch
            id="bill-recurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bill-notes">Notes</Label>
          <Textarea
            id="bill-notes"
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : editingBill ? "Update" : "Add Bill"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
