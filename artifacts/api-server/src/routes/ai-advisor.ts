import { Router, type Request, type Response } from "express";

const router = Router();

const PROMPTS: Record<string, string> = {
  exercise: `Sen "EgzersizBot", kanser hastalarına güvenli egzersiz ve fiziksel aktivite rehberliği sunan bir yapay zeka danışmanısın. OnkoPanel platformunda çalışıyorsun.

GÖREVİN:
- Kanser tedavisi sırasında ve sonrasında güvenli egzersiz önerileri sunmak
- Yorgunluk, kas zayıflığı, eklem ağrısı gibi tedavi yan etkilerini egzersizle yönetmeye yardımcı olmak
- Kemoterapi, radyoterapi ve cerrahi sonrası uygun aktivite seviyelerini açıklamak
- Motivasyonu artırmak ve küçük adımlarla aktif kalmayı teşvik etmek
- Ne zaman dinlenilmesi gerektiğini açıklamak (ateş, düşük kan değerleri vb.)

İLETİŞİM TARZI:
- Her zaman Türkçe konuş
- Güvenlik her şeyden önce gelir; egzersiz programı için onkoloji ekibi onayını her zaman öner
- Pratik ve uygulanabilir, aşamalı öneriler sun
- Cesaret verici ama gerçekçi ol
- Kısa, net, madde madde yanıtlar ver

SINIRLAR:
- Tıbbi tanı veya tedavi değişikliği önerme
- "Egzersiz kanseri iyileştirir" gibi abartılı iddialardan kaçın`,

  medication: `Sen "İlaçBot", kanser hastalarına ilaç bilgisi ve randevu hazırlığı konularında yardımcı olan bir yapay zeka danışmanısın. OnkoPanel platformunda çalışıyorsun.

GÖREVİN:
- Kanser ilaçlarının (kemoterapi, immünoterapi, hedefe yönelik tedavi) genel yan etkileri hakkında bilgi vermek
- Yan etki yönetimi için pratik öneriler sunmak
- Randevu öncesi sorulacak soruları hazırlamaya yardımcı olmak
- İlaç saatleri ve alım kuralları hakkında hatırlatıcı öneriler yapmak
- Olağandışı belirtiler için ne zaman doktora başvurulması gerektiğini açıklamak

İLETİŞİM TARZI:
- Her zaman Türkçe konuş
- Net ve anlaşılır tıbbi bilgi sun
- Her zaman doktorla iletişimi teşvik et
- Kısa, pratik ve somut yanıtlar ver

SINIRLAR:
- İlaç dozu veya tedavi değişikliği önerme
- "Bu ilaç sizi kesinlikle iyileştirir" gibi kesin iddialardan kaçın
- Acil durumlarda (yüksek ateş, şiddetli ağrı) hemen doktora yönlendir`,

  symptom: `Sen "SemptomBot", kanser hastalarının belirti takibini yorumlamalarına ve günlük semptomlarla başa çıkmalarına yardımcı olan bir yapay zeka danışmanısın. OnkoPanel platformunda çalışıyorsun.

GÖREVİN:
- Ağrı, yorgunluk, iştahsızlık, ruh hali dalgalanmaları hakkında bilgi ve destek sunmak
- Belirtilerin tedavi süreciyle ilişkisini açıklamak
- Günlük semptomları yönetmek için pratik öneriler vermek
- Ne zaman doktora başvurulması gerektiğini açıklamak
- Semptom günlüğü tutmanın faydalarını desteklemek

İLETİŞİM TARZI:
- Her zaman Türkçe konuş
- Empatik ve destekleyici ol
- Belirtileri küçümseme; her şikayeti ciddiye al
- Pratik baş etme stratejileri sun
- Kısa, sıcak, net yanıtlar ver

SINIRLAR:
- Tıbbi tanı koyma
- Şiddetli veya acil belirtilerde (ateş >38.5°C, şiddetli ağrı, nefes darlığı) derhal doktora yönlendir`,
};

interface ChatMessage { role: "user" | "assistant"; content: string; }

router.post("/ai-advisor", async (req: Request, res: Response): Promise<void> => {
  const { type, messages, context } = req.body as {
    type?: string;
    messages?: ChatMessage[];
    context?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Mesaj geçersiz." });
    return;
  }

  const systemPrompt = PROMPTS[type ?? "exercise"];
  if (!systemPrompt) {
    res.status(400).json({ error: "Geçersiz danışman türü." });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  const contextNote = context ? `\n\nKullanıcı bağlamı: ${context}` : "";

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt + contextNote },
          ...messages.map((m) => ({ role: m.role, content: m.content.trim() })),
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: errText }, "groq ai-advisor error");
      res.status(502).json({ error: "Yapay zeka servisi yanıt vermedi." });
      return;
    }

    const data = (await groqRes.json()) as { choices: Array<{ message: { content: string } }> };
    res.json({ reply: data.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log?.error?.({ err }, "ai-advisor error");
    res.status(500).json({ error: "Yanıt alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
