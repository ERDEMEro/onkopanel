import { Router, type Request, type Response } from "express";
import { db, casesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getSessionId, getSession } from "../lib/auth";

const router = Router();

async function requireDoctor(req: Request, res: Response): Promise<boolean> {
  const sid = getSessionId(req);
  if (!sid) {
    res.status(401).json({ error: "Oturum açmanız gerekiyor." });
    return false;
  }
  const session = await getSession(sid);
  if (!session?.user?.isDoctor) {
    res.status(403).json({ error: "Bu işlem yalnızca doktorlara açıktır." });
    return false;
  }
  return true;
}

router.get("/cases", async (req: Request, res: Response) => {
  if (!(await requireDoctor(req, res))) return;

  const sid = getSessionId(req)!;
  const session = await getSession(sid);
  const doctorId = session!.user.id;

  const rows = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.doctorId, doctorId))
    .orderBy(desc(casesTable.createdAt));

  res.json({ cases: rows });
});

router.post("/cases", async (req: Request, res: Response) => {
  if (!(await requireDoctor(req, res))) return;

  const sid = getSessionId(req)!;
  const session = await getSession(sid);
  const doctorId = session!.user.id;

  const {
    gender, birthDate, age, department, admissionDate, diagnosis,
    medications, procedures, hasGeneticTest, admissionType, arrivalType,
    deathStatus, notes, rawConversation,
  } = req.body as Record<string, unknown>;

  const [inserted] = await db
    .insert(casesTable)
    .values({
      doctorId,
      gender: typeof gender === "string" ? gender : null,
      birthDate: typeof birthDate === "string" ? birthDate : null,
      age: typeof age === "number" ? age : null,
      department: typeof department === "string" ? department : null,
      admissionDate: typeof admissionDate === "string" ? admissionDate : null,
      diagnosis: typeof diagnosis === "string" ? diagnosis : null,
      medications: typeof medications === "string" ? medications : null,
      procedures: typeof procedures === "string" ? procedures : null,
      hasGeneticTest: typeof hasGeneticTest === "boolean" ? hasGeneticTest : false,
      admissionType: typeof admissionType === "string" ? admissionType : null,
      arrivalType: typeof arrivalType === "string" ? arrivalType : null,
      deathStatus: typeof deathStatus === "boolean" ? deathStatus : false,
      notes: typeof notes === "string" ? notes : null,
      rawConversation: rawConversation ?? null,
    })
    .returning();

  res.status(201).json({ case: inserted });
});

router.post("/cases/ai-chat", async (req: Request, res: Response) => {
  if (!(await requireDoctor(req, res))) return;

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  const { messages } = req.body as { messages: Array<{ role: string; content: string }> };
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages dizisi gerekli." });
    return;
  }

  const systemPrompt = `Sen OnkoPanel'in onkoloji vaka kayıt asistanısın. Doktorlara yeni hasta vakalarını veritabanına kaydetmelerinde yardım ediyorsun.

Görevin: Doktorla konuşarak aşağıdaki bilgileri toplamak:
1. Cinsiyet (Kadın/Erkek)
2. Doğum tarihi veya yaş
3. Bölüm/Klinik (örn: Medikal Onkoloji, Hematoloji, Radyasyon Onkolojisi)
4. Başvuru tarihi
5. Tanı (kanser türü ve evresi)
6. Kullanılan ilaçlar/kemoterapi protokolü
7. Yapılan işlemler (ameliyat, radyasyon vb.)
8. Genetik test yapıldı mı?
9. Başvuru tipi (Acil/Elektif/Poliklinik)
10. Geliş tipi (Ayaktan/Yatan)
11. Ölüm durumu
12. Ek notlar

KURALLAR:
- Sohbet dilinde Türkçe konuş
- Her seferinde en fazla 2-3 soru sor, tümünü birden sorma
- Verilen yanıtları onaylarken kısa özetle
- Tüm bilgiler toplandığında şunu söyle: "Tüm bilgiler toplandı. Vakayı kaydetmek için 'Vakayı Kaydet' butonuna tıklayabilirsiniz."
- JSON çıktı verme, sadece doğal dilde konuş
- Eğer kullanıcı bir bilgiyi bilmiyorsa "bilinmiyor" olarak kabul et ve devam et`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      req.log?.error?.({ status: groqRes.status, body: err }, "groq api error");
      res.status(502).json({ error: "AI servisine ulaşılamadı." });
      return;
    }

    const data = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content ?? "";
    res.json({ reply });
  } catch (err) {
    req.log?.error?.({ err }, "cases ai-chat error");
    res.status(500).json({ error: "Beklenmeyen bir hata oluştu." });
  }
});

router.post("/cases/extract", async (req: Request, res: Response) => {
  if (!(await requireDoctor(req, res))) return;

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY yapılandırılmamış." });
    return;
  }

  const { messages } = req.body as { messages: Array<{ role: string; content: string }> };

  const extractPrompt = `Aşağıdaki doktor-asistan sohbetinden hasta vaka bilgilerini JSON formatında çıkar.

Sohbet:
${messages.map((m) => `${m.role === "user" ? "Doktor" : "Asistan"}: ${m.content}`).join("\n")}

Şu JSON formatında döndür (bilinmeyenler için null kullan):
{
  "gender": "Kadın" veya "Erkek" veya null,
  "birthDate": "YYYY-MM-DD" formatında veya null,
  "age": sayı veya null,
  "department": string veya null,
  "admissionDate": "YYYY-MM-DD" formatında veya null,
  "diagnosis": string veya null,
  "medications": virgülle ayrılmış ilaç listesi veya null,
  "procedures": virgülle ayrılmış işlem listesi veya null,
  "hasGeneticTest": true veya false,
  "admissionType": "Acil" veya "Elektif" veya "Poliklinik" veya null,
  "arrivalType": "Ayaktan" veya "Yatan" veya null,
  "deathStatus": true veya false,
  "notes": ek notlar veya null
}

Sadece JSON döndür, başka açıklama ekleme.`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: extractPrompt }],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    const data = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const extracted = JSON.parse(raw);
    res.json({ extracted });
  } catch (err) {
    req.log?.error?.({ err }, "cases extract error");
    res.status(500).json({ error: "Veri çıkarma başarısız." });
  }
});

export default router;
