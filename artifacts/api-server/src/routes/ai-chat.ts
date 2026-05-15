import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

interface RawRow {
  No: string;
  id: string;
  client_id: string;
  cinsiyet: string;
  "doğum tarihi": string;
  department: string;
  "oluşturma tarihi": string;
  "ölüm durumu": string;
  "order ilaç": string;
  "order atc": string;
  "işlem adı": string;
  "işlem tipi": string;
  [key: string]: string;
}

let cachedRows: RawRow[] | null = null;

function loadData(): RawRow[] {
  if (cachedRows) return cachedRows;
  const csvPath = path.join(__dirname, "../data/oncology.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<RawRow>(content, { header: true, skipEmptyLines: true });
  cachedRows = parsed.data;
  return cachedRows;
}

function extractBracket(raw: string): string {
  if (!raw) return "";
  const m = raw.match(/\[([^\]]+)\]/);
  return m ? m[1].trim() : raw.trim();
}

function rowToText(row: RawRow): string {
  return Object.values(row).filter(Boolean).join(" ").toLowerCase();
}

function scoreRow(rowText: string, keywords: string[]): number {
  return keywords.reduce((acc, kw) => acc + (rowText.includes(kw) ? 1 : 0), 0);
}

function findRelevantRows(rows: RawRow[], question: string, topK = 6): RawRow[] {
  const keywords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (!keywords.length) return rows.slice(0, topK);

  const scored = rows.map((row) => ({
    row,
    score: scoreRow(rowToText(row), keywords),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, topK)
    .map((s) => s.row);
}

function buildContext(rows: RawRow[]): string {
  return rows
    .map((r, i) => {
      const gender = extractBracket(r.cinsiyet);
      const dept = extractBracket(r.department);
      const meds = r["order ilaç"] ? extractBracket(r["order ilaç"]) : "";
      const proc = r["işlem adı"] ? extractBracket(r["işlem adı"]) : "";
      const death = r["ölüm durumu"] === "1" ? "Vefat" : "Hayatta";
      const parts = [
        `[Kayıt ${i + 1}]`,
        `Hasta: ${r.No || r.id || "?"}`,
        `Cinsiyet: ${gender}`,
        `Bölüm: ${dept}`,
        `Durum: ${death}`,
        meds ? `İlaçlar: ${meds}` : "",
        proc ? `İşlem: ${proc}` : "",
      ].filter(Boolean);
      return parts.join(" | ");
    })
    .join("\n");
}

const SYSTEM_PROMPT = `Sen deneyimli bir onkoloji uzmanı ve klinik karar destek asistanısın.
Görevin iki katmanlıdır:

1. Önce sana verilen HASTA KAYITLARI bağlamını incele. Soruyla ilgili kayıt varsa oradan istatistik, örüntü ve özet bilgi çıkar.
2. Hasta kayıtlarında yeterli bilgi yoksa veya soru genel tıbbi/onkolojik bir bilgi gerektiriyorsa, onkoloji alanındaki geniş tıbbi bilgini kullanarak kapsamlı ve doğru bir cevap ver.

Önemli kurallar:
- Hasta ismi veya TC kimlik numarası gibi kişisel kimlik bilgisi ASLA paylaşma; yalnızca istatistik ve özet ver.
- Cevaplarını her zaman Türkçe ver.
- Klinik açıdan doğru, güncel ve faydalı bilgi sun.
- "Bu bilgi kayıtlarda yok" diyerek soruyu geçiştirme; genel tıbbi bilgini kullanarak yanıtla.
- Hasta kayıtlarından elde ettiğin bilgileri genel tıbbi bilgiden gerektiğinde ayırt et.`;

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { question } = req.body as { question?: string };

  if (!question || question.trim().length < 3) {
    res.status(400).json({ error: "Lütfen bir soru girin." });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  try {
    const rows = loadData();
    const relevant = findRelevantRows(rows, question.trim(), 6);
    const context = buildContext(relevant);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `--- HASTA KAYITLARI (Bağlam) ---\n${context}\n---------------------------------\n\nSORU: ${question.trim()}\n\nCEVAP:`,
      },
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        max_tokens: 2048,
        messages,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: errText }, "groq api error");
      res.status(502).json({ error: "Yapay zeka servisi yanıt vermedi. Lütfen tekrar deneyin." });
      return;
    }

    const data = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const answer = data.choices[0]?.message?.content ?? "";

    const sources = relevant.map((r) => ({
      hastaNo: r.No || r.id || "?",
      cinsiyet: extractBracket(r.cinsiyet),
      department: extractBracket(r.department),
      ozet: [
        r["order ilaç"] ? `İlaç: ${extractBracket(r["order ilaç"])}` : "",
        r["işlem adı"] ? `İşlem: ${extractBracket(r["işlem adı"])}` : "",
        r["ölüm durumu"] === "1" ? "Durum: Vefat" : "Durum: Hayatta",
      ]
        .filter(Boolean)
        .join(" | "),
    }));

    res.json({ answer, sources });
  } catch (err) {
    req.log?.error?.({ err }, "ai-chat error");
    res.status(500).json({ error: "Yanıt alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
