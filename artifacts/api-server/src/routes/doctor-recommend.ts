import { Router, Request, Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

async function searchDoctors(query: string): Promise<string> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY eksik");

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      gl: "tr",
      hl: "tr",
      num: 10,
    }),
  });

  if (!res.ok) throw new Error(`Serper API hatası: ${res.status}`);
  const data = await res.json() as any;

  const snippets: string[] = [];

  if (data.answerBox?.answer) snippets.push(`Cevap: ${data.answerBox.answer}`);
  if (data.answerBox?.snippet) snippets.push(`Bilgi: ${data.answerBox.snippet}`);

  for (const item of data.organic ?? []) {
    snippets.push(`[${item.title}] ${item.snippet ?? ""} — ${item.link}`);
  }

  for (const item of data.knowledgeGraph ? [data.knowledgeGraph] : []) {
    if (item.title) snippets.push(`Bilgi Grafiği: ${item.title} — ${item.description ?? ""}`);
  }

  return snippets.slice(0, 12).join("\n");
}

const FORMAT_PROMPT = `Sana Google arama sonuçları verilecek. Bu sonuçlardan gerçek Türk onkolog doktorları ve onkoloji merkezleri hakkında bilgi çıkar.

SADECE gerçekten var olan ve arama sonuçlarında adı geçen doktor ve hastaneleri listele.
Arama sonuçlarında adı geçmeyen hiçbir doktor veya hastane UYDURMA.
Yeterli bilgi yoksa "centers" listesini boş bırak ve generalTip'te "Bu şehir ve kanser türü için yeterli sonuç bulunamadı" yaz.

SADECE JSON döndür:
{
  "centers": [
    {
      "doctorName": "Gerçek doktor adı (arama sonuçlarında geçiyorsa) veya null",
      "hospital": "Hastane adı",
      "hospitalType": "Devlet" veya "Üniversite" veya "Özel",
      "department": "İlgili bölüm (kanser türüne uygun)",
      "city": "Şehir",
      "district": "İlçe veya null",
      "sgkCovered": true veya false,
      "estimatedFee": "Tahmini ücret veya 'SGK ile ücretsiz'",
      "appointmentMethod": "Randevu yöntemi (MHRS, web sitesi, telefon)",
      "appointmentTip": "Randevu ipucu",
      "sourceUrl": "Bilginin alındığı URL (arama sonucundan)",
      "whyRecommended": "Neden önerildiği (1 cümle, arama sonuçlarına dayalı)"
    }
  ],
  "generalTip": "Genel öneri (2-3 cümle)",
  "importantNote": "SGK sevk veya önemli bilgi"
}`;

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { cancerType, location, budget } = req.body as {
    cancerType?: string;
    location?: string;
    budget?: string;
  };

  if (!cancerType || !location || !budget) {
    res.status(400).json({ error: "Kanser türü, konum ve bütçe gereklidir." });
    return;
  }

  try {
    const cancerShort = cancerType.replace(" kanseri", "").replace(" kanseri", "");

    const query = `${location} ${cancerType} onkolog uzman doktor hastane`;
    const combined = await searchDoctors(query);

    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: FORMAT_PROMPT },
        {
          role: "user",
          content: `Kanser türü: ${cancerType}\nKonum: ${location}\nBütçe: ${budget}\n\nGoogle Arama Sonuçları:\n${combined}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Yanıt ayrıştırılamadı." });
      return;
    }

    res.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    req.log?.error?.({ err }, "doctor-recommend error");
    res.status(500).json({ error: err.message ?? "Öneri alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
