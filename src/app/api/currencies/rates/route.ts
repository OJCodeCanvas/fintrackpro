import { NextResponse } from "next/server";

const BASE_CURRENCY = "USD";
const SUPPORTED = ["USD", "EUR", "GBP", "JPY", "CNY", "INR"];

// In-memory cache with 1 hour TTL
let cache: { rates: Record<string, number>; ts: number } | null = null;
const TTL = 60 * 60 * 1000;

export async function GET() {
  try {
    // Return cached rates if fresh
    if (cache && Date.now() - cache.ts < TTL) {
      return NextResponse.json({ base: BASE_CURRENCY, rates: cache.rates });
    }

    // Fetch live rates from exchangerate.host (free, no API key)
    let rates: Record<string, number> = { USD: 1 };
    let fetched = false;
    try {
      const res = await fetch(
        `https://api.exchangerate.host/latest?base=${BASE_CURRENCY}&symbols=${SUPPORTED.filter((c) => c !== BASE_CURRENCY).join(",")}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && Object.keys(data.rates).length > 0) {
          rates = { USD: 1, ...data.rates };
          fetched = true;
        }
      }
    } catch {
      // fall through to fallback
    }

    // Fallback to approximate static rates if the API is unreachable or empty
    if (!fetched) {
      rates = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 156,
        CNY: 7.24,
        INR: 83.5,
      };
    }

    cache = { rates, ts: Date.now() };
    return NextResponse.json({ base: BASE_CURRENCY, rates });
  } catch (error) {
    console.error("Currency rates error:", error);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
