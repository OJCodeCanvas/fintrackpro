import { db } from "@/lib/db";

export interface DefaultCategoryDef {
  name: string;
  color: string;
  icon: string;
  type: "income" | "expense";
}

export const DEFAULT_CATEGORIES: DefaultCategoryDef[] = [
  // Income categories
  { name: "Salary", color: "#10b981", icon: "Wallet", type: "income" },
  { name: "Freelance", color: "#22c55e", icon: "Laptop", type: "income" },
  { name: "Investments", color: "#84cc16", icon: "TrendingUp", type: "income" },
  { name: "Gifts", color: "#14b8a6", icon: "Gift", type: "income" },
  { name: "Other Income", color: "#06b6d4", icon: "PlusCircle", type: "income" },

  // Expense categories
  { name: "Food & Dining", color: "#f97316", icon: "UtensilsCrossed", type: "expense" },
  { name: "Transport", color: "#ef4444", icon: "Car", type: "expense" },
  { name: "Rent", color: "#8b5cf6", icon: "Home", type: "expense" },
  { name: "Utilities", color: "#0ea5e9", icon: "Zap", type: "expense" },
  { name: "Shopping", color: "#ec4899", icon: "ShoppingBag", type: "expense" },
  { name: "Entertainment", color: "#f59e0b", icon: "Film", type: "expense" },
  { name: "Healthcare", color: "#e11d48", icon: "HeartPulse", type: "expense" },
  { name: "Education", color: "#6366f1", icon: "GraduationCap", type: "expense" },
  { name: "Travel", color: "#a855f7", icon: "Plane", type: "expense" },
  { name: "Other Expense", color: "#64748b", icon: "MoreHorizontal", type: "expense" },
];

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const existingCount = await db.category.count({ where: { userId } });
  if (existingCount > 0) return;

  await db.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      isDefault: true,
      userId,
    })),
  });
}

export async function seedSampleData(userId: string): Promise<void> {
  await ensureDefaultCategories(userId);

  const hasData = await db.transaction.count({ where: { userId } });
  if (hasData > 0) return;

  const categories = await db.category.findMany({ where: { userId } });
  const findCat = (name: string) => categories.find((c) => c.name === name);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const transactions: Array<{
    amount: number;
    type: string;
    categoryId: string;
    date: Date;
    notes: string;
    tags: string;
    userId: string;
  }> = [];

  // Generate 3 months of data
  for (let m = 2; m >= 0; m--) {
    const monthDate = new Date(currentYear, currentMonth - m, 1);

    // Monthly salary
    const salaryCat = findCat("Salary");
    if (salaryCat) {
      transactions.push({
        amount: 4800 + Math.random() * 200,
        type: "income",
        categoryId: salaryCat.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        notes: "Monthly salary",
        tags: "recurring,work",
        userId,
      });
    }

    // Freelance income (occasional)
    if (m !== 1) {
      const freelanceCat = findCat("Freelance");
      if (freelanceCat) {
        transactions.push({
          amount: 400 + Math.random() * 300,
          type: "income",
          categoryId: freelanceCat.id,
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
          notes: "Side project payment",
          tags: "freelance,project",
          userId,
        });
      }
    }

    // Rent
    const rentCat = findCat("Rent");
    if (rentCat) {
      transactions.push({
        amount: 1450,
        type: "expense",
        categoryId: rentCat.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 3),
        notes: "Monthly rent",
        tags: "recurring,housing",
        userId,
      });
    }

    // Utilities
    const utilCat = findCat("Utilities");
    if (utilCat) {
      transactions.push({
        amount: 80 + Math.random() * 60,
        type: "expense",
        categoryId: utilCat.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        notes: "Electricity & water",
        tags: "recurring,utilities",
        userId,
      });
    }

    // Food & Dining - multiple
    const foodCat = findCat("Food & Dining");
    if (foodCat) {
      const foodEntries = 8 + Math.floor(Math.random() * 4);
      for (let i = 0; i < foodEntries; i++) {
        transactions.push({
          amount: 12 + Math.random() * 60,
          type: "expense",
          categoryId: foodCat.id,
          date: new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            1 + Math.floor(Math.random() * 27)
          ),
          notes: ["Groceries", "Restaurant", "Coffee", "Takeout", "Lunch"][Math.floor(Math.random() * 5)],
          tags: ["food", "dining", "groceries"][Math.floor(Math.random() * 3)],
          userId,
        });
      }
    }

    // Transport
    const transportCat = findCat("Transport");
    if (transportCat) {
      const transportEntries = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < transportEntries; i++) {
        transactions.push({
          amount: 8 + Math.random() * 40,
          type: "expense",
          categoryId: transportCat.id,
          date: new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            1 + Math.floor(Math.random() * 27)
          ),
          notes: ["Gas", "Uber", "Parking", "Bus pass"][Math.floor(Math.random() * 4)],
          tags: "transport",
          userId,
        });
      }
    }

    // Shopping
    const shopCat = findCat("Shopping");
    if (shopCat) {
      const shopEntries = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < shopEntries; i++) {
        transactions.push({
          amount: 25 + Math.random() * 120,
          type: "expense",
          categoryId: shopCat.id,
          date: new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            1 + Math.floor(Math.random() * 27)
          ),
          notes: ["Clothes", "Electronics", "Home goods", "Books"][Math.floor(Math.random() * 4)],
          tags: "shopping",
          userId,
        });
      }
    }

    // Entertainment
    const entCat = findCat("Entertainment");
    if (entCat) {
      transactions.push({
        amount: 15.99,
        type: "expense",
        categoryId: entCat.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10),
        notes: "Streaming subscription",
        tags: "recurring,subscription",
        userId,
      });
      transactions.push({
        amount: 20 + Math.random() * 40,
        type: "expense",
        categoryId: entCat.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 18),
        notes: "Movie night",
        tags: "entertainment",
        userId,
      });
    }

    // Healthcare
    const healthCat = findCat("Healthcare");
    if (healthCat && Math.random() > 0.4) {
      transactions.push({
        amount: 30 + Math.random() * 80,
        type: "expense",
        categoryId: healthCat.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 12),
        notes: "Pharmacy",
        tags: "health",
        userId,
      });
    }
  }

  await db.transaction.createMany({ data: transactions });

  // Create default accounts
  await db.account.createMany({
    data: [
      {
        name: "Checking",
        type: "checking",
        balance: 5200,
        color: "#10b981",
        icon: "Wallet",
        currency: "USD",
        isDefault: true,
        userId,
      },
      {
        name: "Savings",
        type: "savings",
        balance: 8500,
        color: "#0ea5e9",
        icon: "PiggyBank",
        currency: "USD",
        isDefault: false,
        userId,
      },
      {
        name: "Credit Card",
        type: "credit",
        balance: -1240,
        color: "#ef4444",
        icon: "CreditCard",
        currency: "USD",
        isDefault: false,
        userId,
      },
    ],
  });
  const accountRecords = await db.account.findMany({ where: { userId } });
  const checking = accountRecords.find((a) => a.name === "Checking");

  // Assign the default checking account to all created transactions
  if (checking) {
    await db.transaction.updateMany({
      where: { userId, accountId: null },
      data: { accountId: checking.id },
    });
  }

  // Create a couple of recurring templates
  const salaryCat = findCat("Salary");
  const rentCat = findCat("Rent");
  const entCat = findCat("Entertainment");
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);

  if (salaryCat) {
    await db.recurring.create({
      data: {
        amount: 4800,
        type: "income",
        categoryId: salaryCat.id,
        accountId: checking?.id || null,
        frequency: "monthly",
        dayOfMonth: 1,
        startDate: new Date(currentYear, currentMonth - 2, 1),
        nextDate: nextMonth,
        isActive: true,
        notes: "Monthly salary",
        userId,
      },
    });
  }
  if (rentCat) {
    await db.recurring.create({
      data: {
        amount: 1450,
        type: "expense",
        categoryId: rentCat.id,
        accountId: checking?.id || null,
        frequency: "monthly",
        dayOfMonth: 3,
        startDate: new Date(currentYear, currentMonth - 2, 3),
        nextDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 3),
        isActive: true,
        notes: "Monthly rent",
        userId,
      },
    });
  }
  if (entCat) {
    await db.recurring.create({
      data: {
        amount: 15.99,
        type: "expense",
        categoryId: entCat.id,
        accountId: checking?.id || null,
        frequency: "monthly",
        dayOfMonth: 10,
        startDate: new Date(currentYear, currentMonth - 2, 10),
        nextDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10),
        isActive: true,
        notes: "Streaming subscription",
        userId,
      },
    });
  }

  // Savings goals
  await db.goal.createMany({
    data: [
      {
        name: "Emergency Fund",
        targetAmount: 10000,
        currentAmount: 6500,
        color: "#10b981",
        icon: "Shield",
        targetDate: new Date(currentYear + 1, 5, 1),
        userId,
      },
      {
        name: "Vacation to Japan",
        targetAmount: 4000,
        currentAmount: 1200,
        color: "#f59e0b",
        icon: "Plane",
        targetDate: new Date(currentYear, 11, 1),
        userId,
      },
      {
        name: "New Laptop",
        targetAmount: 2000,
        currentAmount: 800,
        color: "#8b5cf6",
        icon: "Laptop",
        userId,
      },
    ],
  });

  // Bills (upcoming)
  const billBaseDate = new Date();
  const inDays = (d: number) => {
    const dt = new Date(billBaseDate);
    dt.setDate(dt.getDate() + d);
    return dt;
  };
  await db.bill.createMany({
    data: [
      {
        name: "Electricity Bill",
        amount: 95,
        dueDate: inDays(3),
        isPaid: false,
        isRecurring: true,
        notes: "Monthly electricity",
        userId,
      },
      {
        name: "Internet Bill",
        amount: 60,
        dueDate: inDays(7),
        isPaid: false,
        isRecurring: true,
        notes: "Fiber internet",
        userId,
      },
      {
        name: "Phone Bill",
        amount: 45,
        dueDate: inDays(-2),
        isPaid: true,
        isRecurring: true,
        notes: "Mobile plan",
        userId,
      },
      {
        name: "Gym Membership",
        amount: 35,
        dueDate: inDays(12),
        isPaid: false,
        isRecurring: true,
        notes: "Monthly gym",
        userId,
      },
    ],
  });
}
