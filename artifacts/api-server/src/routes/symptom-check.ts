import { Router, Request, Response } from "express";
import { openai } from "../lib/ai-client.js";

const router = Router();

const SYSTEM_PROMPT = `Sen uzman bir onkoloji yönlendirme asistanısın. Hastaların belirttiği şikayetlere göre olası kanser türlerini değerlendiriyorsun. 

Türk onkoloji kliniklerinde en sık görülen kanser türleri: akciğer kanseri, prostat kanseri, mesane kanseri, meme kanseri, karaciğer kanseri, böbrek kanseri, mide kanseri, kolon/rektum kanseri, tiroid kanseri, over kanseri, cilt melanomsu, lenfoma, lösemi.

Verilen şikayetlere göre SADECE JSON formatında yanıt döndür, başka hiçbir metin ekleme:
{
  "predictions": [
    {
      "cancerType": "Kanser türü",
      "likelihood": "Yüksek" veya "Orta" veya "Düşük",
      "matchingSymptoms": ["verilen belirtilerden eşleşenler"],
      "otherTypicalSymptoms": ["bu kanser türünde sık görülen ama belirtilmeyen diğer semptomlar"],
      "recommendedTests": ["öncelikle yapılması gereken test/tetkik"],
      "urgency": "acil" veya "bir hafta içinde" veya "bir ay içinde",
      "naturalRemedies": [
        {
          "name": "Bitkisel/doğal yaklaşım adı (örn: Zerdeçal, Yeşil Çay, D Vitamini, Akdeniz Diyeti…)",
          "benefit": "Bu kanser türünde ne işe yarayabileceğinin kısa açıklaması (1 cümle, Türkçe)",
          "warning": "Dikkat edilmesi gereken nokta veya ilaç etkileşimi (1 cümle, yoksa boş string)"
        }
      ]
    }
  ],
  "generalAdvice": "Genel öneri (2-3 cümle Türkçe, kesinlikle doktora başvurmayı vurgula)",
  "urgencyLevel": "acil" veya "bir hafta içinde" veya "bir ay içinde"
}

Kurallar:
- Maksimum 3 kanser türü tahmin et, en az 1
- Her kanser türü için SADECE 2 doğal/bitkisel destekleyici yaklaşım öner (daha fazla değil)
- naturalRemedies yalnızca bilimsel literatürde veya geleneksel tıpta kabul görmüş bitkisel/diyet/yaşam tarzı yaklaşımları içersin
- Her alan için kısa ve öz yaz, gereksiz uzatma
- Belirtilerle en iyi eşleşen türleri önce listele
- Türkçe yanıt ver
- Bu bir kesin tanı değil, yönlendirme aracıdır; bunu yansıt
- Sadece geçerli JSON döndür, başka hiçbir şey ekleme`;

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { symptoms, extraNote } = req.body as { symptoms?: string | string[]; extraNote?: string };

  const symptomsText = Array.isArray(symptoms)
    ? symptoms.join(", ")
    : (symptoms ?? "").trim();

  if (!symptomsText || symptomsText.length < 2) {
    res.status(400).json({ error: "Lütfen en az birkaç belirti belirtin." });
    return;
  }

  const userContent = extraNote?.trim()
    ? `Hasta şikayetleri ve belirtileri:\n${symptomsText}\n\nEk açıklama: ${extraNote.trim()}`
    : `Hasta şikayetleri ve belirtileri:\n${symptomsText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Yanıt ayrıştırılamadı. Lütfen tekrar deneyin." });
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // JSON kesilmiş olabilir — predictions dizisini kurtarmaya çalış
      const partialMatch = jsonMatch[0].match(/"predictions"\s*:\s*(\[[\s\S]*)/);
      if (!partialMatch) {
        res.status(500).json({ error: "Yanıt ayrıştırılamadı. Lütfen tekrar deneyin." });
        return;
      }
      // Eksik kapanışları tamamla ve yeniden dene
      let fixed = `{"predictions":${partialMatch[1]}`;
      const openBraces = (fixed.match(/\{/g) ?? []).length - (fixed.match(/\}/g) ?? []).length;
      const openBrackets = (fixed.match(/\[/g) ?? []).length - (fixed.match(/\]/g) ?? []).length;
      fixed += "]".repeat(Math.max(0, openBrackets)) + "}".repeat(Math.max(0, openBraces));
      fixed += `,"generalAdvice":"Lütfen bir onkoloji uzmanına başvurun.","urgencyLevel":"bir hafta içinde"}}`;
      try {
        parsed = JSON.parse(fixed);
      } catch {
        res.status(500).json({ error: "Yanıt ayrıştırılamadı. Lütfen tekrar deneyin." });
        return;
      }
    }

    res.json(parsed);
  } catch (err: any) {
    req.log?.error?.({ err }, "symptom-check error");
    res.status(500).json({ error: "Analiz yapılamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
