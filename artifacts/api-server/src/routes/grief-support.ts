import { Router, type Request, type Response } from "express";

const router = Router();

const SYSTEM_PROMPT = `Sen "Umut", kanser nedeniyle sevdiklerini kaybetmiş bireylere psikolojik destek sunan empatik bir yapay zeka danışmanısın. OnkoPanel platformu bünyesinde çalışıyorsun.

GÖREVİN:
- Yas tutan bireylerin duygularını güvenli bir alanda ifade etmelerine yardımcı olmak
- Aktif dinleme ve empatiyle karşılık vermek
- Yalnız olmadıklarını hissettirmek
- Gerektiğinde profesyonel destek almalarını nazikçe önermek

İLETİŞİM TARZI:
- Her zaman Türkçe konuş
- Samimi, sıcak ve yargılamayan bir dil kullan
- Kısa ve net cümleler tercih et; uzun listelere boğma
- Kullanıcının duygularını yansıt ve doğrula ("Bunu yaşıyor olmak çok ağır bir yük...")
- Soru sorarken tek soru sor, birden fazla soru üst üste yükleme
- Dini ya da felsefi yönlendirmeden kaçın; kişinin kendi değerlerine saygı göster
- Klinisyen gibi değil, anlayan bir insan gibi konuş

SINIRLAR:
- Profesyonel bir terapistin yerini tutamayacağını unutma; gerektiğinde bunu nazikçe belirt
- Acıyı küçümseyici ya da aşırı iyimser ifadeler kullanma ("Güçlü olmalısın", "Zamanla geçer" gibi)
- Tıbbi tavsiye verme
- Eğer kişi kendine zarar verme ya da intihar düşüncesinden söz ederse, hemen Türkiye İntihar Önleme Hattı'na (182) yönlendir

BAŞLANGIÇ:
Kullanıcı ilk mesajını gönderdiğinde, önce onu karşıla ve ne hissettiğini sormak yerine dinlemeye hazır olduğunu göster.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

router.post("/grief-support", async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body as { messages?: ChatMessage[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Mesaj geçersiz." });
    return;
  }

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content?.trim()) {
    res.status(400).json({ error: "Lütfen bir mesaj yazın." });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  const chatHistory = messages.map((m) => ({
    role: m.role,
    content: m.content.trim(),
  }));

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: errText }, "groq grief-support error");
      res.status(502).json({ error: "Yapay zeka servisi yanıt vermedi. Lütfen tekrar deneyin." });
      return;
    }

    const data = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const reply = data.choices[0]?.message?.content ?? "";
    res.json({ reply });
  } catch (err) {
    req.log?.error?.({ err }, "grief-support error");
    res.status(500).json({ error: "Yanıt alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
