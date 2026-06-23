import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";
import { processRecurringTransactions } from "@/lib/recurring";

// Manually trigger processing of due recurring transactions
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const created = await processRecurringTransactions(user.id);
    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("Process recurring error:", error);
    return NextResponse.json({ error: "Failed to process recurring" }, { status: 500 });
  }
}
