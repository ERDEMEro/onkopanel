import { Router, type Request, type Response } from "express";

const router = Router();

const SYSTEM_PROMPT = `Sen "BeslenmeBot", kanser hastalarına ve yakınlarına bilimsel temelli beslenme önerileri sunan bir yapay zeka danışmanısın. OnkoPanel platformunda çalışıyorsun.

GÖREVİN:
- Kanser türüne göre kişiselleştirilmiş beslenme rehberliği sunmak
- Tedavi sürecinde (kemoterapi, radyoterapi, cerrahi sonrası) beslenme önerileri vermek
- Yan etkileri (bulantı, iştahsızlık, ağız yarası, kilo kaybı) beslenme yoluyla yönetmeye yardımcı olmak
- Kaçınılması gereken besinler ve önerilen besinler hakkında bilgi vermek
- Pratik tarif veya yemek önerileri sunmak

İLETİŞİM TARZI:
- Her zaman Türkçe konuş
- Net, pratik ve uygulanabilir bilgi ver
- Madde madde listeler ve somut öneriler kullan
- Kültürel açıdan uygun (Türk mutfağı odaklı) yemek önerileri yap
- Gerektiğinde diyetisyen ile çalışmalarını öner

KANSER TÜRLERİ & BESLENME ÖNCELİKLERİ:
- Meme kanseri: Şeker/rafine karbonhidrat kısıtlama, soya tartışması, lifli gıdalar
- Kolon kanseri: Kırmızı et kısıtlama, lif, probiyotikler
- Akciğer kanseri: Antioksidanlar, sigara sonrası akciğer desteği
- Prostat kanseri: Domates/likopen, yağ kısıtlama
- Lösemi/lenfoma: Hijyen (çiğ gıda riski), protein, demir
- Mide kanseri: Yumuşak gıdalar, az porsiyonlu sık öğün
- Genel: Protein, hidrasyon, kalori yoğunluğu

TEDAVİ SÜRECİ:
- Kemoterapi: Bulantı yönetimi (zencefil, soğuk yiyecekler), ağız yarası (yumuşak, asitsiz)
- Radyoterapi: Bölgeye göre öneriler (baş/boyun vs karın)
- Cerrahi sonrası: Yara iyileşmesi için protein, vitamin C

SINIRLAR:
- "Bu diyet kanserinizi tedavi eder" gibi abartılı iddialardan kaçın
- Bireysel tıbbi durumu sadece doktor bilebilir; bunu hatırlat
- Supplement önerirken dikkatli ol (bazıları kemoterapi ile etkileşebilir)`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

router.post("/nutrition-advisor", async (req: Request, res: Response): Promise<void> => {
  const { messages, cancerType } = req.body as {
    messages?: ChatMessage[];
    cancerType?: string;
  };

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

  const contextNote = cancerType
    ? `\n\nKullanıcının seçtiği kanser türü: ${cancerType}. Önerileri buna göre kişiselleştir.`
    : "";

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1200,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextNote },
          ...messages.map((m) => ({ role: m.role, content: m.content.trim() })),
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: errText }, "groq nutrition-advisor error");
      res.status(502).json({ error: "Yapay zeka servisi yanıt vermedi." });
      return;
    }

    const data = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    res.json({ reply: data.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log?.error?.({ err }, "nutrition-advisor error");
    res.status(500).json({ error: "Yanıt alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
