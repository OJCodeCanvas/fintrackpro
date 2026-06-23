import { db } from "@/lib/db";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
  currency: string;
}

export function getUserIdFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === "pf_session") {
      const value = valueParts.join("=");
      try {
        const decoded = atob(value);
        if (decoded.startsWith("pf_session_")) {
          return decoded.substring("pf_session_".length);
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function getUserFromRequest(req: Request): Promise<SessionUser | null> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, isDemo: true, currency: true },
  });
  return user;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
