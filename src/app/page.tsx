"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AuthScreen } from "@/components/auth-screen";
import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/views/dashboard-view";
import { TransactionsView } from "@/components/views/transactions-view";
import { CategoriesView } from "@/components/views/categories-view";
import { BudgetsView } from "@/components/views/budgets-view";
import { ReportsView } from "@/components/views/reports-view";
import { apiFetch } from "@/lib/api-client";
import { useAppStore, CurrentUser } from "@/lib/store";

export default function Home() {
  const { view } = useAppStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => apiFetch<{ user: CurrentUser | null }>("/api/auth/me"),
    retry: false,
  });

  const user = data?.user ?? null;

  const handleAuthSuccess = (u: CurrentUser) => {
    queryClient.setQueryData(["session"], { user: u });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <AppShell user={user}>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {view === "dashboard" && <DashboardView />}
          {view === "transactions" && <TransactionsView />}
          {view === "categories" && <CategoriesView />}
          {view === "budgets" && <BudgetsView />}
          {view === "reports" && <ReportsView />}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
