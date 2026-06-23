import { db } from "@/lib/db";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
}

// Simple cookie-based session. For prototype only — not for production.
const SESSION_COOKIE = "pf_session";
const SESSION_PREFIX = "pf_session_";

export function setSessionCookie(userId: string, res?: Response): void {
  const token = btoa(`${SESSION_PREFIX}${userId}`);
  if (typeof document !== "undefined") {
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `${SESSION_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

export function getSessionUserId(): string | null {
  let cookieHeader = "";
  if (typeof document !== "undefined") {
    cookieHeader = document.cookie;
  } else if (typeof require !== "undefined") {
    // server-side: we rely on the request headers passed in
    return null;
  }
  return parseSessionFromCookies(cookieHeader);
}

export function parseSessionFromCookies(cookieHeader: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === SESSION_COOKIE) {
      const value = valueParts.join("=");
      try {
        const decoded = atob(value);
        if (decoded.startsWith(SESSION_PREFIX)) {
          return decoded.substring(SESSION_PREFIX.length);
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearSessionCookie(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export async function getSessionUser(cookieHeader?: string): Promise<SessionUser | null> {
  const userId = cookieHeader ? parseSessionFromCookies(cookieHeader) : getSessionUserId();
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, isDemo: true },
  });
  return user;
}

export async function requireUser(cookieHeader?: string): Promise<SessionUser> {
  const user = await getSessionUser(cookieHeader);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
