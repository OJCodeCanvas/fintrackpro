"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/category-icon";
import { apiFetch } from "@/lib/api-client";
import { Category } from "@/lib/types";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#10b981", "#22c55e", "#84cc16", "#14b8a6", "#06b6d4",
  "#f97316", "#ef4444", "#8b5cf6", "#0ea5e9", "#ec4899",
  "#f59e0b", "#e11d48", "#6366f1", "#a855f7", "#64748b",
];

const ICON_OPTIONS = [
  "Wallet", "Laptop", "TrendingUp", "Gift", "PlusCircle",
  "UtensilsCrossed", "Car", "Home", "Zap", "ShoppingBag",
  "Film", "HeartPulse", "GraduationCap", "Plane", "MoreHorizontal",
  "Coffee", "Dumbbell", "Book", "Smartphone", "PawPrint",
];

export function CategoriesView() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ categories: Category[] }>("/api/categories"),
  });

  const categories = data?.categories || [];
  const filtered = categories.filter((c) => c.type === activeTab);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
      setDeleteCat(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your income and expense categories
          </p>
        </div>
        <Button onClick={() => { setEditingCat(null); setModalOpen(true); }} className="w-fit">
          <Plus className="w-4 h-4 mr-1" /> New Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-lg border bg-muted p-1">
        <button
          onClick={() => setActiveTab("expense")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            activeTab === "expense" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Expense ({categories.filter((c) => c.type === "expense").length})
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            activeTab === "income" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Income ({categories.filter((c) => c.type === "income").length})
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Tags className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No {activeTab} categories</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first category</p>
            <Button onClick={() => { setEditingCat(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> New Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{cat.name}</span>
                      {cat.isDefault && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">Default</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">{cat.type}</div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => { setEditingCat(cat); setModalOpen(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteCat(cat)}
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

      {/* Modal */}
      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingCat={editingCat}
        defaultType={activeTab}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteCat} onOpenChange={(open) => !open && setDeleteCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteCat?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also remove any budgets associated with this category. Transactions will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCat && deleteMutation.mutate(deleteCat.id)}
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

function CategoryModal({
  open,
  onOpenChange,
  editingCat,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCat: Category | null;
  defaultType: "income" | "expense";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <CategoryForm
          key={editingCat?.id ?? "new"}
          editingCat={editingCat}
          defaultType={defaultType}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  editingCat,
  defaultType,
  onDone,
}: {
  editingCat: Category | null;
  defaultType: "income" | "expense";
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(editingCat?.name ?? "");
  const [color, setColor] = useState(editingCat?.color ?? PRESET_COLORS[0]);
  const [icon, setIcon] = useState(editingCat?.icon ?? "MoreHorizontal");
  const [type, setType] = useState<"income" | "expense">(editingCat?.type ?? defaultType);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = { name, color, icon, type };
      if (editingCat) {
        return apiFetch(`/api/categories/${editingCat.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(editingCat ? "Category updated" : "Category created");
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    mutation.mutate();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle>
        <DialogDescription>
          {editingCat ? "Update category details" : "Create a custom category"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                type === "expense" ? "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" : "border-border"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                type === "income" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-border"
              }`}
            >
              Income
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto scrollbar-thin p-1">
              {ICON_OPTIONS.map((ic) => (
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

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: color }}
            >
              <CategoryIcon name={icon} className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium text-sm">{name || "Preview"}</div>
              <div className="text-xs text-muted-foreground capitalize">{type}</div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : editingCat ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}
