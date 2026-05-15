import { Router, Request, Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

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
- Her kanser türü için 3-5 doğal/bitkisel destekleyici yaklaşım öner; bunlar tıbbi tedavinin YANINDA kullanılabilir, yerini alamaz
- naturalRemedies yalnızca bilimsel literatürde veya geleneksel tıpta kabul görmüş bitkisel/diyet/yaşam tarzı yaklaşımları içersin
- Belirtilerle en iyi eşleşen türleri önce listele
- Türkçe yanıt ver
- Bu bir kesin tanı değil, yönlendirme aracıdır; bunu yansıt
- Sadece geçerli JSON döndür`;

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { symptoms } = req.body as { symptoms?: string };

  if (!symptoms || symptoms.trim().length < 5) {
    res.status(400).json({ error: "Lütfen en az birkaç belirti belirtin." });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Hasta şikayetleri ve belirtileri:\n${symptoms.trim()}` },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Yanıt ayrıştırılamadı. Lütfen tekrar deneyin." });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err: any) {
    req.log?.error?.({ err }, "symptom-check error");
    res.status(500).json({ error: "Analiz yapılamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
