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

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const prompt = `You are a receipt scanner. Extract transaction details from this receipt image and return ONLY valid JSON.

User's expense categories: ${categoryList}

Extract and return this JSON:
{
  "amount": number (total amount paid, always positive),
  "type": "expense",
  "categoryId": "best matching category id from the list",
  "date": "YYYY-MM-DD" (from receipt, or today: ${new Date().toISOString().split("T")[0]}),
  "notes": "merchant name and brief description",
  "tags": "any relevant tags comma separated",
  "confidence": "high" or "medium" or "low"
}

Return ONLY the JSON object, nothing else.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` },
            },
            { type: "text", text: prompt },
          ] as never,
        },
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Could not extract receipt data" }, { status: 400 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ transaction: parsed });
  } catch (error) {
    console.error("Receipt scan error:", error);
    return NextResponse.json({ error: "Failed to scan receipt" }, { status: 500 });
  }
}
