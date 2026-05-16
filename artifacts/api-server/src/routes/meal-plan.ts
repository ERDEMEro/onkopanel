import { Router, type Request, type Response } from "express";

const router = Router();

interface MealDay {
  dayName: string;
  kahvalti: string;
  araOgun1?: string;
  ogle: string;
  araOgun2?: string;
  aksam: string;
  tip?: string;
}

interface MealPlanResponse {
  planTitle: string;
  days: MealDay[];
  generalTips: string[];
}

router.post("/meal-plan", async (req: Request, res: Response): Promise<void> => {
  const { days, mealsPerDay, restrictions, cancerType, treatmentPhase } = req.body as {
    days?: number;
    mealsPerDay?: number;
    restrictions?: string[];
    cancerType?: string;
    treatmentPhase?: string;
  };

  const numDays = days ?? 7;
  const numMeals = mealsPerDay ?? 3;

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  const systemPrompt = `Sen bir kanser hastalarına özel beslenme planı oluşturan uzman bir diyetisyensin.
Türk mutfağını iyi biliyorsun, kültürel açıdan uygun, pratik ve uygulanabilir öneriler sunuyorsun.
Yanıtını YALNIZCA geçerli JSON formatında ver, başka hiçbir metin ekleme.

JSON şeması:
{
  "planTitle": "string",
  "days": [
    {
      "dayName": "string",
      "kahvalti": "string (kısa, somut yemek isimleri)",
      "araOgun1": "string (sadece 5 öğün istendiğinde, yoksa boş bırakma — bu alanı ekleme)",
      "ogle": "string",
      "araOgun2": "string (sadece 5 öğün istendiğinde, yoksa boş bırakma — bu alanı ekleme)",
      "aksam": "string",
      "tip": "string (o güne özgü kısa beslenme ipucu)"
    }
  ],
  "generalTips": ["string", "string", "string"]
}

Kurallar:
- Her öğün için 1-3 yiyecek/içecek öner, çok uzun yazma
- Türk mutfağına uygun yemekler kullan (pilav, çorba, zeytinyağlı, ızgara vb.)
- Kanser türü ve tedavi aşamasına göre kişiselleştir
- Besin kısıtlarına kesinlikle uy
- generalTips: 3-4 madde, kısa ve pratik`;

  const userPrompt = `${numDays} günlük, günde ${numMeals} öğünlük kanser hastası beslenme planı oluştur.
Günler: ${dayNames.slice(0, numDays).join(", ")}
${cancerType ? `Kanser türü: ${cancerType}` : "Kanser türü belirtilmedi (genel plan yap)"}
${treatmentPhase ? `Tedavi aşaması: ${treatmentPhase}` : ""}
${restrictions && restrictions.length > 0 ? `Besin kısıtları: ${restrictions.join(", ")}` : "Özel kısıt yok"}
${numMeals === 5 ? "5 öğün: Kahvaltı, Ara Öğün, Öğle, Ara Öğün, Akşam" : "3 öğün: Kahvaltı, Öğle, Akşam (araOgun1 ve araOgun2 alanlarını EKLEME)"}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: errText }, "groq meal-plan error");
      res.status(502).json({ error: "Yapay zeka servisi yanıt vermedi." });
      return;
    }

    const data = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message?.content ?? "{}";
    let parsed: MealPlanResponse;

    try {
      parsed = JSON.parse(content) as MealPlanResponse;
    } catch {
      req.log?.error?.({ content }, "meal-plan JSON parse error");
      res.status(502).json({ error: "Plan oluşturulamadı. Lütfen tekrar deneyin." });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log?.error?.({ err }, "meal-plan error");
    res.status(500).json({ error: "Yanıt alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
