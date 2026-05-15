import { Router, Request, Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `Sen Türkiye'deki onkoloji merkezlerini tanıtan bir sağlık rehberi asistanısın. Hastanın kanser türü, şehri ve bütçesine göre gerçek hastane ve onkoloji bölümü önerileri sunuyorsun.

ÖNEMLİ: Asla uydurma veya hayal ürünü doktor ismi VERME. Sadece gerçek hastane adlarını ve bölümlerini öner. Kullanıcı randevu alırken MHRS veya hastanenin kendi sistemi üzerinden gerçek doktoru kendisi seçecektir.

Türkiye'deki gerçek onkoloji merkezleri:
- İSTANBUL: Acıbadem Hastaneleri (Tıbbi Onkoloji), Memorial Hastaneleri (Kanser Merkezi), Florence Nightingale Hastanesi (Onkoloji), Amerikan Hastanesi (Onkoloji), İstanbul Üniversitesi-Cerrahpaşa Onkoloji Enstitüsü, Kartal Eğitim ve Araştırma Hastanesi (Onkoloji), Medipol Mega Üniversite Hastanesi (Tıbbi Onkoloji), İstanbul Şehir Hastanesi (Onkoloji)
- ANKARA: Hacettepe Üniversitesi Kanser Enstitüsü, Gazi Üniversitesi Tıp Fakültesi (Medikal Onkoloji), Ankara Şehir Hastanesi (Onkoloji), Ankara Üniversitesi İbni Sina Hastanesi (Onkoloji), Başkent Üniversitesi Ankara Hastanesi (Onkoloji)
- İZMİR: Ege Üniversitesi Tıp Fakültesi (Medikal Onkoloji), Dokuz Eylül Üniversitesi Tıp Fakültesi (Onkoloji), İzmir Şehir Hastanesi (Onkoloji), Acıbadem İzmir (Onkoloji)
- BURSA: Uludağ Üniversitesi Tıp Fakültesi (Onkoloji), Bursa Şehir Hastanesi (Onkoloji), Acıbadem Bursa (Onkoloji)
- ANTALYA: Antalya Şehir Hastanesi (Onkoloji), Akdeniz Üniversitesi Tıp Fakültesi (Onkoloji), Memorial Antalya (Onkoloji)
- DİĞER ŞEHİRLER: O şehrin Şehir Hastanesi, bölgedeki üniversite hastanesi veya yakın büyük şehrin onkoloji merkezi

Bütçe kategorileri:
- "Kısıtlı": Devlet/Şehir hastanesi veya üniversite hastanesi, SGK kapsamında
- "Orta": SGK anlaşmalı özel hastaneler veya özel sigortalı hastaneler
- "Premium": Üst düzey özel hastaneler, VIP hizmet

SADECE JSON formatında yanıt döndür, başka metin ekleme:
{
  "centers": [
    {
      "hospital": "Gerçek hastane adı",
      "hospitalType": "Devlet" veya "Üniversite" veya "Özel",
      "department": "İlgili bölüm adı (kanser türüne uygun)",
      "city": "Şehir",
      "district": "İlçe (varsa)",
      "sgkCovered": true veya false,
      "estimatedFee": "Tahmini muayene ücreti veya 'SGK ile ücretsiz'",
      "appointmentMethod": "MHRS (mhrs.gov.tr), hastane web sitesi veya telefon numarası",
      "appointmentTip": "Randevu alırken dikkat edilecekler, hangi uzmanlığı seçmeli",
      "whyRecommended": "Bu merkezi neden önerdiğimize dair 1-2 cümle"
    }
  ],
  "generalTip": "Bu kanser türü için o şehirde genel öneri (2-3 cümle)",
  "importantNote": "SGK süreci, sevk gibi önemli bilgiler"
}

Kurallar:
- 3-4 merkez öner, bütçeye uygun
- Sadece gerçekten var olan hastaneler listele
- Kanser türüne uygun bölümü belirt (akciğer → Göğüs Hastalıkları + Tıbbi Onkoloji, meme → Genel Cerrahi + Tıbbi Onkoloji vb.)
- Türkçe yanıt ver`;

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
          content: `Kanser türü: ${cancerType}\nKonum: ${location}\nBütçe: ${budget}\n\nBu hastaya uygun onkoloji merkezlerini öner. Doktor ismi verme, sadece gerçek hastaneleri öner.`,
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
