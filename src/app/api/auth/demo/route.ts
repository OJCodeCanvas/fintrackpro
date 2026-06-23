import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { ensureDefaultCategories, seedSampleData } from "@/lib/seed";

export async function POST() {
  try {
    const demoEmail = "demo@financeapp.com";
    let user = await db.user.findUnique({ where: { email: demoEmail } });

    if (!user) {
      user = await db.user.create({
        data: {
          email: demoEmail,
          password: "demo123",
          name: "Demo User",
          isDemo: true,
        },
      });
      await ensureDefaultCategories(user.id);
      await seedSampleData(user.id);
    }

    const token = btoa(`pf_session_${user.id}`);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, isDemo: user.isDemo, currency: user.currency },
    });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });
    return res;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Demo login failed" }, { status: 500 });
  }
}
