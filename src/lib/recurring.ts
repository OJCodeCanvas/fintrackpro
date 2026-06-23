import { db } from "@/lib/db";

// Compute the next occurrence date based on frequency
export function computeNextDate(
  current: Date,
  frequency: string,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null
): Date {
  const next = new Date(current);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "monthly":
    default:
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth) {
        // Clamp to last day of month if needed
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, lastDay));
      }
      break;
  }
  return next;
}

// Process all due recurring transactions for a user (or all users if userId omitted)
// Creates Transaction rows for any recurring.nextDate <= now and advances nextDate.
export async function processRecurringTransactions(userId?: string): Promise<number> {
  const now = new Date();
  const where: Record<string, unknown> = {
    isActive: true,
    nextDate: { lte: now },
  };
  if (userId) where.userId = userId;

  const due = await db.recurring.findMany({
    where,
    include: { category: true },
  });

  let created = 0;
  for (const r of due) {
    // Don't process past endDate
    if (r.endDate && r.nextDate > r.endDate) {
      await db.recurring.update({
        where: { id: r.id },
        data: { isActive: false },
      });
      continue;
    }

    // Create the transaction dated at nextDate
    await db.transaction.create({
      data: {
        amount: r.amount,
        type: r.type,
        categoryId: r.categoryId,
        accountId: r.accountId,
        date: r.nextDate,
        notes: r.notes || r.category.name,
        tags: "recurring",
        userId: r.userId,
      },
    });
    created++;

    // Advance nextDate
    const newNext = computeNextDate(r.nextDate, r.frequency, r.dayOfMonth, r.dayOfWeek);

    // Stop if past endDate
    if (r.endDate && newNext > r.endDate) {
      await db.recurring.update({
        where: { id: r.id },
        data: { isActive: false, nextDate: newNext },
      });
    } else {
      await db.recurring.update({
        where: { id: r.id },
        data: { nextDate: newNext },
      });
    }
  }

  return created;
}
