import { Router, type Request, type Response } from "express";

const router = Router();

interface ExerciseDay {
  dayName: string;
  exercises: { name: string; duration: string; note?: string }[];
  tip?: string;
  rest?: boolean;
}

interface ExercisePlanResponse {
  planTitle: string;
  level: string;
  days: ExerciseDay[];
  generalTips: string[];
}

router.post("/exercise-plan", async (req: Request, res: Response): Promise<void> => {
  const { cancerType, treatmentPhase, fitnessLevel, restrictions } = req.body as {
    cancerType?: string;
    treatmentPhase?: string;
    fitnessLevel?: string;
    restrictions?: string[];
  };

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  const systemPrompt = `Sen kanser hastalarına kişiselleştirilmiş egzersiz programları oluşturan bir fizik tedavi uzmanısın.
Yanıtını YALNIZCA geçerli JSON formatında ver, başka hiçbir metin ekleme.

JSON şeması:
{
  "planTitle": "string",
  "level": "string (Başlangıç / Orta / İleri)",
  "days": [
    {
      "dayName": "string (Pazartesi...Pazar)",
      "rest": false,
      "exercises": [
        { "name": "string", "duration": "string (örn: 10 dk, 2x10 tekrar)", "note": "string (isteğe bağlı, kısa açıklama)" }
      ],
      "tip": "string (o güne özgü kısa öneri)"
    }
  ],
  "generalTips": ["string", "string", "string"]
}

Kurallar:
- 7 gün (Pazartesi-Pazar) için plan yap
- Dinlenme günlerine rest:true ekle, egzersiz listesi boş dizi olsun
- Kanser türü ve tedavi aşamasına göre kişiselleştir
- Fitness seviyesine uygun yoğunluk seç
- Güvenlik önce: kemoterapi günlerinde hafif ol
- generalTips: 3-4 madde, kısa ve pratik`;

  const userPrompt = `1 haftalık kanser hastası egzersiz programı oluştur.
${cancerType ? `Kanser türü: ${cancerType}` : "Kanser türü belirtilmedi"}
${treatmentPhase ? `Tedavi aşaması: ${treatmentPhase}` : ""}
${fitnessLevel ? `Fiziksel kapasite: ${fitnessLevel}` : "Başlangıç seviyesi varsay"}
${restrictions && restrictions.length > 0 ? `Kısıtlamalar: ${restrictions.join(", ")}` : "Özel kısıt yok"}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: errText }, "groq exercise-plan error");
      res.status(502).json({ error: "Yapay zeka servisi yanıt vermedi." });
      return;
    }

    const data = (await groqRes.json()) as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(content) as ExercisePlanResponse;
      res.json(parsed);
    } catch {
      req.log?.error?.({ content }, "exercise-plan JSON parse error");
      res.status(502).json({ error: "Plan oluşturulamadı. Lütfen tekrar deneyin." });
    }
  } catch (err) {
    req.log?.error?.({ err }, "exercise-plan error");
    res.status(500).json({ error: "Yanıt alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
