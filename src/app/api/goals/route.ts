import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const goals = await db.goal.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("GET goals error:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { name, targetAmount, currentAmount, color, icon, targetDate } = body;

    if (!name || !targetAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const goal = await db.goal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        color: color || "#10b981",
        icon: icon || "Target",
        targetDate: targetDate ? new Date(targetDate) : null,
        userId: user.id,
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("POST goal error:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
