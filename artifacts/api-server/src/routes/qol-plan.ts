import { Router, type Request, type Response } from "express";

const router = Router();

interface LowScore {
  scale: string;
  score: number;
  type: "functional" | "symptom" | "global";
}

interface QolRecommendation {
  scale: string;
  score: number;
  issue: string;
  actions: string[];
  icon: string;
}

interface QolPlanResponse {
  summary: string;
  recommendations: QolRecommendation[];
  weeklyFocus: string;
  dailyPractice: string;
  professionalNote: string;
}

router.post("/qol-plan", async (req: Request, res: Response): Promise<void> => {
  const { lowScores, globalScore } = req.body as {
    lowScores?: LowScore[];
    globalScore?: number;
  };

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  if (!lowScores || lowScores.length === 0) {
    res.status(400).json({ error: "Düşük skor verisi eksik." });
    return;
  }

  const scaleDescriptions: Record<string, string> = {
    "Fiziksel": "fiziksel işlevsellik ve günlük aktivite kapasitesi",
    "Rol": "iş/günlük yaşam rollerini yerine getirebilme",
    "Duygusal": "duygusal iyilik hali, kaygı ve depresyon",
    "Bilişsel": "dikkat, bellek ve düşünme kapasitesi",
    "Sosyal": "sosyal ilişkiler ve toplumsal katılım",
    "Yorgunluk": "yorgunluk ve enerji düzeyi",
    "Bulantı": "bulantı ve mide rahatsızlığı belirtileri",
    "Ağrı": "ağrı yönetimi ve ağrı düzeyi",
    "Nefes Darlığı": "solunum güçlüğü ve nefes darlığı",
    "Uyku": "uyku kalitesi ve uyku düzeni",
    "İştah": "iştah ve beslenme isteği",
    "Genel Sağlık": "genel sağlık algısı",
    "Genel QoL": "genel yaşam kalitesi algısı",
  };

  const scalesSummary = lowScores
    .map(s => `- ${s.scale} (${scaleDescriptions[s.scale] ?? s.scale}): Skor ${s.score}/100 — ${s.type === "symptom" ? "yüksek belirti yükü" : "düşük işlevsellik"}`)
    .join("\n");

  const systemPrompt = `Sen kanser hastalarının yaşam kalitesini artırmak için kişiselleştirilmiş eylem planları hazırlayan bir onkoloji rehabilitasyon uzmanısın.
Yanıtını YALNIZCA geçerli JSON formatında ver, başka hiçbir metin ekleme.

JSON şeması:
{
  "summary": "string (2-3 cümle, hastaya yönelik sıcak ve umut verici bir giriş)",
  "recommendations": [
    {
      "scale": "string (etkilenen alan adı)",
      "score": number (0-100),
      "issue": "string (1 cümle, bu skorun ne anlama geldiği)",
      "actions": ["string (somut eylem adımı)", "string", "string", "string"],
      "icon": "string (tek bir emoji)"
    }
  ],
  "weeklyFocus": "string (bu hafta odaklanılacak tek ana hedef, 1-2 cümle)",
  "dailyPractice": "string (her gün 10-15 dakikada yapılabilecek somut bir pratik uygulama, 2-3 cümle)",
  "professionalNote": "string (profesyonel destek hakkında kısa hatırlatma)"
}`;

  const userPrompt = `Kanser hastasının EORTC QLQ-C30 değerlendirmesinde şu alanlarda düşük skor tespit edildi:
${scalesSummary}
Genel QoL skoru: ${globalScore ?? "bilinmiyor"}/100

Bu alanlardaki sorunları gidermek için kanıta dayalı, uygulanabilir ve kişiselleştirilmiş bir eylem planı hazırla. 
Her alan için 4 somut, günlük yaşama entegre edilebilir adım öner.`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      res.status(502).json({ error: (err as { error?: { message?: string } }).error?.message ?? "AI servisi hatası." });
      return;
    }

    const data = await groqRes.json() as { choices: { message: { content: string } }[] };
    const raw = data.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(502).json({ error: "Geçersiz AI yanıtı." });
      return;
    }

    const plan = JSON.parse(jsonMatch[0]) as QolPlanResponse;
    res.json(plan);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Bilinmeyen hata." });
  }
});

export default router;
