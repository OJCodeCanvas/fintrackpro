import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const categories = await db.category.findMany({ where: { userId: user.id } });
    const categoryList = categories.map((c) => `${c.id}:${c.name}:${c.type}`).join(", ");

    const prompt = `You are a transaction parser. Extract transaction details from natural language and return ONLY valid JSON, no other text.

User's categories: ${categoryList}

Parse this transaction: "${text}"

Return JSON with these exact fields:
{
  "amount": number (required, always positive),
  "type": "income" or "expense",
  "categoryId": "best matching category id from the list above",
  "date": "YYYY-MM-DD" (today if not specified: ${new Date().toISOString().split("T")[0]}),
  "notes": "merchant or description extracted",
  "tags": ""
}

Rules:
- Words like "spent", "bought", "paid" = expense
- Words like "received", "got paid", "earned", "salary" = income
- Match the most relevant category from the list
- If amount has $ sign, strip it
- Return ONLY the JSON object, nothing else`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Could not parse transaction" }, { status: 400 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ transaction: parsed });
  } catch (error) {
    console.error("NL parse error:", error);
    return NextResponse.json({ error: "Failed to parse transaction" }, { status: 500 });
  }
}
