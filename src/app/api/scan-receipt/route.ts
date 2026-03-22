export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { image, mediaType } = body;

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType || "image/jpeg",
              data: image,
            },
          },
          {
            type: "text",
            text: `Analyze this receipt image and extract all line items. Return ONLY a JSON array with no other text. Each item should have these fields:
- "description": the item name/description
- "amount": the price as a number (no $ sign)
- "date": the receipt date in YYYY-MM-DD format (if visible)

If you can see a store name, include it in the first item's description as a prefix like "StoreName - ItemName".

If you cannot read a field, use "" for strings and 0 for amounts. Skip subtotals, tax lines, and total lines — only include actual purchased items.

Example response format:
[{"description":"USB-C Cable","amount":12.99,"date":"2025-03-15"},{"description":"SD Card 128GB","amount":24.99,"date":"2025-03-15"}]`,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return NextResponse.json({ error: "No response from Claude" }, { status: 500 });
  }

  // Extract JSON from the response
  const text = textContent.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse receipt", raw: text }, { status: 422 });
  }

  const items = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ items });
}
