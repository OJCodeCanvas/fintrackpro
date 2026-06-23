export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: "income" | "expense";
  isDefault: boolean;
  userId: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  category: Category;
  date: string;
  notes: string;
  tags: string;
  userId: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  category: Category;
  userId: string;
}

export interface BudgetProgress {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface MonthlyDataPoint {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySpending {
  name: string;
  color: string;
  value: number;
}

export interface Summary {
  year: number;
  totalBalance: number;
  currentMonth: {
    month: number;
    income: number;
    expense: number;
    balance: number;
  };
  yearTotals: {
    income: number;
    expense: number;
    balance: number;
  };
  monthlyData: MonthlyDataPoint[];
  spendingByCategory: CategorySpending[];
  budgetProgress: BudgetProgress[];
}
