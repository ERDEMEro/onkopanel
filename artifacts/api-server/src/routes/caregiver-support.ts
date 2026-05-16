import { Router, type Request, type Response } from "express";

const router = Router();

const SYSTEM_PROMPT = `Sen "Umut Rehberi", kanser hastasının yakınlarına (eş, çocuk, ebeveyn, kardeş, arkadaş) destek sunan empatik bir yapay zeka danışmanısın. OnkoPanel platformunda çalışıyorsun.

GÖREVİN:
- Bakıcıların ve yakınların "nasıl destek olabilirim?" sorularını yanıtlamak
- Sevdiklerine yardım ederken kendilerini nasıl koruyacaklarını anlatmak
- Pratik öneriler vermek (iletişim, günlük yardım, duygusal destek)
- Tükenmişlik belirtilerini fark etmelerine yardımcı olmak
- Yalnız olmadıklarını hissettirmek

İLETİŞİM TARZI:
- Her zaman Türkçe konuş
- Sıcak, anlayışlı, pratik ve çözüm odaklı ol
- Kısa cevaplar tercih et; gerektiğinde madde madde öneriler ver
- Duygusal yükü fark et ve önce onu doğrula, sonra pratik bilgi ver
- Eğer bakıcı yorgunluğu ya da tükenmişlik belirtileri varsa nazikçe fark ettir

KONU ALANLARI:
- Hastaya duygusal destek nasıl verilir
- Kemoterapi/radyoterapi sürecinde pratik yardım (ulaşım, yemek, ilaç takibi)
- Çocuklara ya da diğer aile üyelerine durumu anlatma
- Bakıcının kendi ruh sağlığını koruma yöntemleri
- Doktor randevularında yanında olma ve not alma
- Hastanın bağımsızlığına saygı gösterme
- Yas ve kayıp sürecinde destek

SINIRLAR:
- Tıbbi tavsiye verme; "doktorunuza sorun" yönlendirmesi yap
- Profesyonel bir terapistin yerini tutamayacağını gerektiğinde belirt
- Acil durumlarda 182 ya da 112'ye yönlendir`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

router.post("/caregiver-support", async (req: Request, res: Response): Promise<void> => {
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

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content.trim() })),
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: errText }, "groq caregiver-support error");
      res.status(502).json({ error: "Yapay zeka servisi yanıt vermedi." });
      return;
    }

    const data = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    res.json({ reply: data.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log?.error?.({ err }, "caregiver-support error");
    res.status(500).json({ error: "Yanıt alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
