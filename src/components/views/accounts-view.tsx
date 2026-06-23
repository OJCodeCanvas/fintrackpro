"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  CreditCard,
  PiggyBank,
  Banknote,
  TrendingUp,
  Star,
  ArrowLeftRight,
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
import { Account } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking", icon: "Wallet" },
  { value: "savings", label: "Savings", icon: "PiggyBank" },
  { value: "credit", label: "Credit Card", icon: "CreditCard" },
  { value: "cash", label: "Cash", icon: "Banknote" },
  { value: "investment", label: "Investment", icon: "TrendingUp" },
];

const PRESET_COLORS = [
  "#10b981", "#0ea5e9", "#8b5cf6", "#ef4444", "#f59e0b",
  "#ec4899", "#14b8a6", "#6366f1", "#84cc16", "#64748b",
];

export function AccountsView() {
  const { currency, setView } = useAppStore();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);

  const { data, isLoading } = useQuery<{ accounts: Account[] }>({
    queryKey: ["accounts"],
    queryFn: () => apiFetch<{ accounts: Account[] }>("/api/accounts"),
  });

  const accounts = data?.accounts || [];

  const totalAssets = accounts
    .filter((a) => a.type !== "credit" && a.balance >= 0)
    .reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts
    .filter((a) => a.balance < 0)
    .reduce((s, a) => s + Math.abs(a.balance), 0);
  const netWorth = totalAssets - totalLiabilities;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account deleted");
      setDeleteAccount(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your wallets and accounts</p>
        </div>
        <Button onClick={() => { setEditingAccount(null); setModalOpen(true); }} className="w-fit">
          <Plus className="w-4 h-4 mr-1" /> New Account
        </Button>
      </div>

      {/* Net worth summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-3 lg:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-5">
            <div className="text-xs text-emerald-50/90 font-medium mb-1">Net Worth</div>
            <div className="text-3xl font-bold">{formatCurrency(netWorth, currency)}</div>
            <div className="text-xs text-emerald-50/80 mt-2">{accounts.length} accounts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xs text-muted-foreground font-medium">Total Assets</div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalAssets, currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-xs text-muted-foreground font-medium">Total Liabilities</div>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalLiabilities, currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No accounts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first account to start tracking balances</p>
            <Button onClick={() => { setEditingAccount(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> New Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc, i) => {
            const typeInfo = ACCOUNT_TYPES.find((t) => t.value === acc.type) || ACCOUNT_TYPES[0];
            const isNegative = acc.balance < 0;
            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group relative overflow-hidden h-full">
                  <div className={`absolute inset-0 opacity-5`} style={{ background: acc.color }} />
                  <CardContent className="p-5 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                        style={{ background: acc.color }}
                      >
                        <CategoryIcon name={acc.icon} className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1">
                        {acc.isDefault && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5">
                            <Star className="w-2.5 h-2.5" /> Default
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => { setEditingAccount(acc); setModalOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteAccount(acc)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-semibold text-base mb-0.5">{acc.name}</div>
                    <div className="text-xs text-muted-foreground capitalize mb-3">{typeInfo.label}</div>
                    <div className={`text-2xl font-bold ${isNegative ? "text-red-600 dark:text-red-400" : ""}`}>
                      {formatCurrency(acc.balance, currency)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {acc._count?.transactions ?? 0} transactions
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingAccount={editingAccount}
      />

      {/* Delete */}
      <AlertDialog open={!!deleteAccount} onOpenChange={(open) => !open && setDeleteAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteAccount?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Transactions linked to this account will be unlinked (not deleted). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccount && deleteMutation.mutate(deleteAccount.id)}
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

function AccountModal({
  open,
  onOpenChange,
  editingAccount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount: Account | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AccountForm
          key={editingAccount?.id ?? "new"}
          editingAccount={editingAccount}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AccountForm({
  editingAccount,
  onDone,
}: {
  editingAccount: Account | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(editingAccount?.name ?? "");
  const [type, setType] = useState(editingAccount?.type ?? "checking");
  const [balance, setBalance] = useState(editingAccount ? String(editingAccount.balance) : "");
  const [color, setColor] = useState(editingAccount?.color ?? PRESET_COLORS[0]);
  const [icon, setIcon] = useState(editingAccount?.icon ?? "Wallet");
  const [isDefault, setIsDefault] = useState(editingAccount?.isDefault ?? false);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = { name, type, balance, color, icon, isDefault };
      if (editingAccount) {
        return apiFetch(`/api/accounts/${editingAccount.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return apiFetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(editingAccount ? "Account updated" : "Account created");
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Account name is required");
      return;
    }
    mutation.mutate();
  };

  const iconOptions = ACCOUNT_TYPES.map((t) => t.icon);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editingAccount ? "Edit Account" : "New Account"}</DialogTitle>
        <DialogDescription>
          {editingAccount ? "Update account details" : "Add a wallet or account to track"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="acc-name">Name *</Label>
          <Input
            id="acc-name"
            placeholder="e.g. Main Checking"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Account Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setType(t.value); setIcon(t.icon); }}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 transition-all ${
                  type === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <CategoryIcon name={t.icon} className="w-4 h-4" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acc-balance">Current Balance</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="acc-balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="pl-7"
            />
          </div>
          <p className="text-xs text-muted-foreground">Use negative for credit card debt</p>
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
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="grid grid-cols-5 gap-2">
            {iconOptions.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-full aspect-square rounded-lg flex items-center justify-center border-2 transition-all ${
                  icon === ic ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <CategoryIcon name={ic} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-sm">Set as default account</span>
        </label>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : editingAccount ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
