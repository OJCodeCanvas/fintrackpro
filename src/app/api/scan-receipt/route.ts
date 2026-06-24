import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const categories = await db.category.findMany({ where: { userId: user.id } });
    const categoryList = categories.map((c) => `${c.id}:${c.name}:${c.type}`).join(", ");

    const prompt = `You are a receipt scanner. Extract transaction details from this receipt image and return ONLY valid JSON.

User's expense categories: ${categoryList}

Extract and return this JSON:
{
  "amount": number (total amount paid, always positive),
  "type": "expense",
  "categoryId": "best matching category id from the list",
  "date": "YYYY-MM-DD" (from receipt, or today: ${new Date().toISOString().split("T")[0]}),
  "notes": "merchant name and brief description",
  "tags": "",
  "confidence": "high" or "medium" or "low"
}

Return ONLY the JSON object, nothing else.`;

    // Groq supports vision with llama-3.2-11b-vision-preview
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Could not extract receipt data" }, { status: 400 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ transaction: parsed });
  } catch (error) {
    console.error("Receipt scan error:", error);
    return NextResponse.json({ error: "Failed to scan receipt" }, { status: 500 });
  }
}
