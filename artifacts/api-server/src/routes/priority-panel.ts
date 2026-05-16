import { Router, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

interface RawRow {
  No: string;
  id: string;
  client_id: string;
  cinsiyet: string;
  "doğum tarihi": string;
  department: string;
  "oluşturma tarihi": string;
  "ölüm durumu": string;
  "ölüm tarihi": string;
  "genetic test ": string;
  "başvuru tipi": string;
  "yatış tipi": string;
  "order ilaç": string;
  "işlem adı": string;
  hikaye: string;
  epikriz: string;
  "patoloji rapor özet": string;
  bulgu: string;
  not: string;
  lab_sonuclari: string;
  "başvuru açılma tarihi": string;
  "başvuru kapanma tarihi": string;
}

let cachedRows: RawRow[] | null = null;

function loadData(): RawRow[] {
  if (cachedRows) return cachedRows;
  const csvPath = path.join(__dirname, "../data/oncology.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<RawRow>(content, { header: true, skipEmptyLines: true });
  cachedRows = parsed.data;
  return cachedRows;
}

function extractBracket(raw: string): string {
  if (!raw) return "";
  const m = raw.match(/\[([^\]]+)\]/);
  return m ? m[1] : raw.trim();
}

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split(".");
  if (parts.length !== 3) return null;
  const birth = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return isNaN(age) ? null : age;
}

function scorePatient(r: RawRow): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  // Metastasis / stage indicators in text
  const texts = [r.hikaye, r.epikriz, r["patoloji rapor özet"], r.bulgu, r.not]
    .map((t) => (t ?? "").toLowerCase())
    .join(" ");

  if (texts.includes("metastaz") || texts.includes("evre iv") || texts.includes("stage 4")) {
    score += 40; flags.push("Metastaz/Evre IV");
  } else if (texts.includes("evre iii") || texts.includes("stage 3")) {
    score += 20; flags.push("Evre III");
  }

  if (texts.includes("acil") || texts.includes("kritik") || texts.includes("ağır")) {
    score += 30; flags.push("Acil durum");
  }

  if (texts.includes("febril nötropeni") || texts.includes("nötropeni")) {
    score += 35; flags.push("Nötropeni");
  }

  if (texts.includes("pulmoner emboli") || texts.includes("tromboz")) {
    score += 30; flags.push("Tromboz/Emboli");
  }

  if (texts.includes("kanama") || texts.includes("hemoraji")) {
    score += 25; flags.push("Kanama");
  }

  if (texts.includes("sepsis") || texts.includes("ateş") && texts.includes("kemo")) {
    score += 30; flags.push("Enfeksiyon riski");
  }

  // Inpatient flag
  const yatis = extractBracket(r["yatış tipi"]).toLowerCase();
  if (yatis.includes("yatış") || yatis.includes("yatan")) {
    score += 15; flags.push("Yatarak tedavi");
  }

  // Genetic test positive
  const genetic = (r["genetic test "] ?? "").toLowerCase();
  if (genetic.includes("pozitif") || genetic.includes("mutasyon")) {
    score += 10; flags.push("Genetik mutasyon");
  }

  // Age > 70
  const age = calcAge(r["doğum tarihi"]);
  if (age !== null && age >= 70) {
    score += 10; flags.push(`Yaşlı hasta (${age})`);
  }

  return { score, flags };
}

router.get("/priority-panel", async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = loadData();

    // Deduplicate by client_id — take last row per patient
    const byClient = new Map<string, RawRow>();
    for (const r of rows) {
      if (r.client_id) byClient.set(r.client_id, r);
    }

    const scored = Array.from(byClient.values())
      .map((r) => {
        const { score, flags } = scorePatient(r);
        const age = calcAge(r["doğum tarihi"]);
        return {
          clientId: r.client_id,
          hastaNo: r.No || r.id,
          cinsiyet: extractBracket(r.cinsiyet),
          age,
          department: extractBracket(r.department),
          score,
          flags,
          isDeceased: r["ölüm durumu"] === "1",
        };
      })
      .filter((p) => !p.isDeceased && p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    // Risk buckets
    const critical = scored.filter((p) => p.score >= 40);
    const high = scored.filter((p) => p.score >= 20 && p.score < 40);
    const moderate = scored.filter((p) => p.score < 20);

    res.json({ critical, high, moderate, total: scored.length });
  } catch (err) {
    req.log?.error?.({ err }, "priority-panel error");
    res.status(500).json({ error: "Öncelik paneli hesaplanamadı." });
  }
});

export default router;
