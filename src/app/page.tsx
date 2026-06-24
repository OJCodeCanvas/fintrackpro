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
import { RecurringView } from "@/components/views/recurring-view";
import { GoalsView } from "@/components/views/goals-view";
import { BillsView } from "@/components/views/bills-view";
import { AccountsView } from "@/components/views/accounts-view";
import { InsightsView } from "@/components/views/insights-view";
import { CoachView } from "@/components/views/coach-view";
import { apiFetch } from "@/lib/api-client";
import { useAppStore, CurrentUser } from "@/lib/store";

export default function Home() {
  const { view, setCurrency } = useAppStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => apiFetch<{ user: CurrentUser | null }>("/api/auth/me"),
    retry: false,
  });

  const user = data?.user ?? null;

  // Keep the store's currency in sync with the session user
  const sessionCurrency = data?.user?.currency;
  if (sessionCurrency && sessionCurrency !== useAppStore.getState().currency) {
    setCurrency(sessionCurrency);
  }

  const handleAuthSuccess = (u: CurrentUser) => {
    queryClient.setQueryData(["session"], { user: u });
    setCurrency(u.currency);
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
          {view === "recurring" && <RecurringView />}
          {view === "goals" && <GoalsView />}
          {view === "bills" && <BillsView />}
          {view === "accounts" && <AccountsView />}
          {view === "insights" && <InsightsView />}
          {view === "coach" && <CoachView />}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
