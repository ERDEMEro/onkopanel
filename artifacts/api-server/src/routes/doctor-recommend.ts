import { Router, Request, Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `Sen Türkiye'deki onkoloji uzmanlarını tanıtan bir sağlık rehberi asistanısın. Hastanın kanser türü, şehri ve bütçesine göre gerçekçi doktor ve hastane önerileri sunuyorsun.

Türkiye'deki büyük onkoloji merkezleri: İstanbul'da Acıbadem, Memorial, Florence Nightingale, Amerikan Hastanesi, İstanbul Üniversitesi Onkoloji Enstitüsü, Kartal Eğitim Araştırma Hastanesi; Ankara'da Hacettepe Üniversitesi, Gazi Üniversitesi, Ankara Şehir Hastanesi; İzmir'de Ege Üniversitesi, Dokuz Eylül Üniversitesi, Türkiye'nin diğer büyük şehirlerinde benzer kurumlar bulunmaktadır.

Bütçe kategorileri:
- "Kısıtlı": Devlet/üniversite hastanesi, SGK kapsamında, muayene ücreti 0-200 TL
- "Orta": Özel anlaşmalı hastane veya sigortalı özel, muayene 500-1500 TL
- "Premium": Üst düzey özel hastane, muayene 2000-5000 TL, VIP hizmet

Aşağıdaki JSON formatında SADECE JSON döndür, başka metin ekleme:
{
  "doctors": [
    {
      "name": "Prof. Dr. / Doç. Dr. / Uzm. Dr. Ad Soyad",
      "title": "Unvan (Profesör / Doçent / Uzman)",
      "hospital": "Hastane adı",
      "hospitalType": "Devlet" veya "Üniversite" veya "Özel",
      "specialization": "Uzmanlık alanı (kanser türüne özel)",
      "city": "Şehir adı",
      "district": "İlçe adı",
      "estimatedFee": "Yaklaşık muayene ücreti",
      "sgkCovered": true veya false,
      "appointmentTip": "Randevu alma ipucu (MHRS, hastane sitesi, telefon vs.)",
      "note": "Bu hekim veya merkez hakkında kısa bilgi"
    }
  ],
  "generalTip": "O şehirde o kanser türü için genel öneri (2-3 cümle)",
  "urgentNote": "Eğer durum acilse özellikle vurgulanacak mesaj"
}

Kurallar:
- 3-4 doktor öner, bütçeye uygun
- Kanser türüne uygun onkoloji uzmanı seç (akciğer → göğüs/toraks onkologu, meme → meme onkologu, vb.)
- İsimler ve hastaneler Türkiye'de gerçekten var olan veya gerçekçi kurumlar olmalı
- Türkçe yanıt ver
- Sadece JSON döndür`;

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { cancerType, location, budget } = req.body as {
    cancerType?: string;
    location?: string;
    budget?: string;
  };

  if (!cancerType || !location || !budget) {
    res.status(400).json({ error: "Kanser türü, konum ve bütçe gereklidir." });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Kanser türü: ${cancerType}\nKonum: ${location}\nBütçe: ${budget}\n\nBu hastaya uygun onkoloji uzmanlarını öner.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Yanıt ayrıştırılamadı." });
      return;
    }

    res.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    req.log?.error?.({ err }, "doctor-recommend error");
    res.status(500).json({ error: "Öneri alınamadı. Lütfen tekrar deneyin." });
  }
});

export default router;
