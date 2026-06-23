import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { ensureDefaultCategories } from "@/lib/seed";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        email,
        password,
        name: name || email.split("@")[0],
        isDemo: false,
      },
    });

    // Real sign-ups start fresh — only default categories, no sample data
    await ensureDefaultCategories(user.id);

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
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
