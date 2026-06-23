export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: "income" | "expense";
  isDefault: boolean;
  userId: string;
}

export interface Account {
  id: string;
  name: string;
  type: string; // checking | savings | credit | cash | investment
  balance: number;
  color: string;
  icon: string;
  currency: string;
  isDefault: boolean;
  userId: string;
  _count?: { transactions: number };
}

export interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  category: Category;
  accountId: string | null;
  account?: Account | null;
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

export interface Recurring {
  id: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  category: Category;
  accountId: string | null;
  account?: Account | null;
  frequency: string; // daily | weekly | monthly | yearly
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  nextDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string;
  userId: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon: string;
  targetDate: string | null;
  createdAt: string;
  userId: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
  categoryId: string | null;
  accountId: string | null;
  notes: string;
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

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
}

