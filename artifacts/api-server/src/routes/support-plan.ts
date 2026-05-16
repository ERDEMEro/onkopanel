import { Router, type Request, type Response } from "express";

const router = Router();

interface Practice {
  title: string;
  description: string;
  duration: string;
  icon: string;
}

interface CopingStrategy {
  trigger: string;
  strategy: string;
}

interface SupportPlanResponse {
  planTitle: string;
  summary: string;
  dailyPractices: Practice[];
  weeklyGoals: string[];
  copingStrategies: CopingStrategy[];
  affirmations: string[];
  professionalNote: string;
}

router.post("/support-plan", async (req: Request, res: Response): Promise<void> => {
  const { challenges, moodLevel, preferences } = req.body as {
    challenges?: string[];
    moodLevel?: number;
    preferences?: string[];
  };

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  const systemPrompt = `Sen kanser hastalarına ve yakınlarına kişiselleştirilmiş psikolojik destek planları oluşturan bir klinik psikologsun.
Yanıtını YALNIZCA geçerli JSON formatında ver, başka hiçbir metin ekleme.

JSON şeması:
{
  "planTitle": "string",
  "summary": "string (2-3 cümle, kişiselleştirilmiş giriş mesajı)",
  "dailyPractices": [
    {
      "title": "string",
      "description": "string (2-3 cümle, nasıl yapılır)",
      "duration": "string (örn: 5-10 dk)",
      "icon": "string (emoji)"
    }
  ],
  "weeklyGoals": ["string", "string", "string"],
  "copingStrategies": [
    { "trigger": "string (ne zaman)", "strategy": "string (ne yapmalı)" }
  ],
  "affirmations": ["string", "string", "string", "string"],
  "professionalNote": "string (1 cümle, uzman desteği önerisi)"
}

Kurallar:
- dailyPractices: 4-5 madde, pratik ve uygulanabilir
- weeklyGoals: 3 madde, gerçekçi ve ulaşılabilir
- copingStrategies: 3-4 madde, somut durumlar için
- affirmations: 4 madde, olumlu ve güçlendirici Türkçe ifadeler
- Her şeyi Türkçe yaz, sıcak ve destekleyici bir dil kullan`;

  const userPrompt = `Kişiselleştirilmiş psikolojik destek planı oluştur.
${challenges && challenges.length > 0 ? `Ana zorluklar: ${challenges.join(", ")}` : "Zorluklar belirtilmedi"}
${moodLevel !== undefined ? `Mevcut ruh hali düzeyi (1-5): ${moodLevel}` : ""}
${preferences && preferences.length > 0 ? `Tercihler: ${preferences.join(", ")}` : "Tercihler belirtilmedi"}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: errText }, "groq support-plan error");
      res.status(502).json({ error: "Yapay zeka servisi yanıt vermedi." });
      return;
    }

    const data = (await groqRes.json()) as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(content) as SupportPlanResponse;
      res.json(parsed);
    } catch {
      req.log?.error?.({ content }, "support-plan JSON parse error");
      res.status(502).json({ error: "Plan oluşturulamadı. Lütfen tekrar deneyin." });
    }
  } catch (err) {
    req.log?.error?.({ err }, "support-plan error");
    res.status(500).json({ error: "Yanıt alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
