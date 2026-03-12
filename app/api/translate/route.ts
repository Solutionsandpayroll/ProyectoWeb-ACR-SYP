import { NextRequest, NextResponse } from "next/server";

// Uses the unofficial Google Translate endpoint — no API key, no registration, no credit card.
const GT_URL = "https://translate.googleapis.com/translate_a/single";

async function translateOne(text: string, target: string): Promise<string> {
  if (!text) return text;
  const url = new URL(GT_URL);
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl",     "auto"); // auto-detect source language
  url.searchParams.set("tl",     target);
  url.searchParams.set("dt",     "t");
  url.searchParams.set("q",      text);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Google Translate status ${res.status}`);

  // Response shape: [ [ [translatedChunk, originalChunk], ... ], ... ]
  const data = await res.json() as [[string, string][]];
  return (data[0] ?? []).map((chunk) => chunk[0] ?? "").join("");
}

// POST /api/translate
// Body:    { texts: string[], target?: string }
// Returns: { results: string[] }
export async function POST(request: NextRequest) {
  let body: { texts?: unknown; target?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { texts, target = "en" } = body;

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: "texts debe ser un array no vacío" }, { status: 400 });
  }

  const safeTexts: string[] = texts.slice(0, 50).map((t) =>
    typeof t === "string" ? t.trim() : ""
  );
  const targetLang = typeof target === "string"
    ? target.slice(0, 2).toLowerCase() // "EN-US" → "en", "en" → "en"
    : "en";

  try {
    // Translate all non-empty texts in parallel
    const results = await Promise.all(
      safeTexts.map((t) => (t ? translateOne(t, targetLang) : Promise.resolve("")))
    );
    return NextResponse.json({ results });
  } catch (e) {
    console.error("Translation error:", e);
    return NextResponse.json(
      { error: "Error al comunicarse con el servicio de traducción. Inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
