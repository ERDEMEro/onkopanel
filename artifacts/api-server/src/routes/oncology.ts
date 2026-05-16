import { Router, Request, Response } from "express";
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
  "başvuru açılma tarihi": string;
  "başvuru kapanma tarihi": string;
  "yatış tipi": string;
  "başvuru tipi": string;
  "geliş tipi": string;
  "order ilaç": string;
  "order atc": string;
  "order tarih": string;
  "işlem adı": string;
  "işlem tipi": string;
  "işlem tarihi": string;
}

let cachedRows: RawRow[] | null = null;

function loadData(): RawRow[] {
  if (cachedRows) return cachedRows;
  const csvPath = path.join(__dirname, "../data/oncology.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<RawRow>(content, {
    header: true,
    skipEmptyLines: true,
  });
  cachedRows = parsed.data;
  return cachedRows;
}

function extractBracketValues(raw: string): string[] {
  if (!raw) return [];
  const matches = raw.match(/\[([^\]]+)\]/g);
  if (!matches) return raw.trim() ? [raw.trim()] : [];
  return matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
}

function extractGender(raw: string): string {
  const v = raw.replace(/[\[\]]/g, "").trim();
  if (!v) return "";
  if (v.includes("kadın") || v.toLowerCase().includes("kadin")) return "Kadın";
  if (v.includes("erkek")) return "Erkek";
  return v;
}

function getBirthYear(raw: string): number | null {
  const v = raw.replace(/[\[\]]/g, "").trim();
  if (!v) return null;
  const m = v.match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

function getAge(raw: string): number | null {
  const yr = getBirthYear(raw);
  if (!yr) return null;
  return 2024 - yr;
}

function countBy(items: string[]): Array<{ label: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (item) counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

router.get("/summary", (_req: Request, res: Response): void => {
  const rows = loadData();
  const seenClients = new Set<string>();
  const deceasedClients = new Set<string>();
  let femaleCount = 0;
  let maleCount = 0;
  const ages: number[] = [];
  let withGeneticTest = 0;
  const departments = new Set<string>();

  for (const row of rows) {
    if (row.client_id) {
      if (!seenClients.has(row.client_id)) {
        seenClients.add(row.client_id);
        const gender = extractGender(row.cinsiyet);
        if (gender === "Kadın") femaleCount++;
        else if (gender === "Erkek") maleCount++;
        const age = getAge(row["doğum tarihi"]);
        if (age !== null && age > 0 && age < 120) ages.push(age);
      }
      if (row["ölüm tarihi"] && row["ölüm tarihi"].trim()) {
        deceasedClients.add(row.client_id);
      }
    }
    if (row["genetic test "] && row["genetic test "].trim()) withGeneticTest++;
    const depts = extractBracketValues(row.department);
    depts.forEach((d) => departments.add(d));
  }

  const avgAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
  const total = seenClients.size;

  res.json({
    totalPatients: total,
    femaleCount,
    maleCount,
    averageAge: Math.round(avgAge * 10) / 10,
    withGeneticTest,
    totalAdmissions: rows.length,
    departmentCount: departments.size,
    deceasedCount: deceasedClients.size,
    mortalityRate: total > 0 ? Math.round((deceasedClients.size / total) * 100) : 0,
  });
});

router.get("/gender-distribution", (_req: Request, res: Response): void => {
  const rows = loadData();
  const genders = rows.map((r) => extractGender(r.cinsiyet)).filter(Boolean);
  res.json(countBy(genders));
});

router.get("/age-distribution", (_req: Request, res: Response): void => {
  const rows = loadData();
  const buckets: Record<string, number> = {};
  for (const row of rows) {
    const age = getAge(row["doğum tarihi"]);
    if (age !== null && age > 0 && age < 120) {
      const decade = Math.floor(age / 10) * 10;
      const label = `${decade}-${decade + 9}`;
      buckets[label] = (buckets[label] || 0) + 1;
    }
  }
  const result = Object.entries(buckets)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([label, count]) => ({ label, count }));
  res.json(result);
});

router.get("/department-distribution", (_req: Request, res: Response): void => {
  const rows = loadData();
  const depts: string[] = [];
  for (const row of rows) {
    extractBracketValues(row.department).forEach((d) => depts.push(d));
  }
  res.json(countBy(depts).slice(0, 15));
});

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

function shortenMedLabel(raw: string): string {
  const tc = toTitleCase(raw.replace(/\(SETSIZ\)/gi, "").replace(/\(MEDIFLEKS\)/gi, "Medifleks").trim());
  const doseMatch = tc.match(/^([\w%,]+(?:\s+[\w%,]+)?)\s+(\d+[,.]?\d*\s*(?:mg|mcg|g|ml|iu|miu|%\d+)?)/i);
  if (doseMatch) {
    const name = doseMatch[1].trim();
    const dose = doseMatch[2].trim();
    const combined = `${name} ${dose}`;
    return combined.length > 24 ? combined.slice(0, 24).trim() + "…" : combined;
  }
  const words = tc.split(/\s+/).slice(0, 2).join(" ");
  return words.length > 24 ? words.slice(0, 24).trim() + "…" : words;
}

const GENETIC_SHORT: Record<string, string> = {
  "HLA-DR Low resolution(Molekül düşük çözünürlükte)": "HLA-DR",
  "HCV-RNA, kantitatif": "HCV-RNA",
  "Mikrosatellit İnstabilitesi (MSI)": "MSI",
  "HLA-DQ Low resolution ( Mol.düşük çöz )": "HLA-DQ",
  "HLA-A Low resolution( Molekül düşük çözünürlükte )": "HLA-A",
  "CMV DNA PCR (Kan)": "CMV DNA PCR",
  "Human papilloma virus (HPV)-genotiplendirme": "HPV Genotiplendirme",
  "HIV 1 RNA (Viral Yük)": "HIV 1 RNA",
  "Hepatit C (HCV) genotiplendirme": "HCV Genotiplendirme",
  "JAK2 V617F": "JAK2 V617F",
  "Trombofili Paneli (F2-F5-FXIII, MTHFR, PAI)": "Trombofili Paneli",
};

function shortenGeneticLabel(raw: string): string {
  if (GENETIC_SHORT[raw]) return GENETIC_SHORT[raw];
  const paren = raw.match(/^([^(]+)/);
  const base = (paren ? paren[1] : raw).trim();
  return base.length > 28 ? base.slice(0, 28).trim() + "…" : base;
}

router.get("/admission-types", (_req: Request, res: Response): void => {
  const rows = loadData();
  const basvuru: string[] = [];
  const gelis: string[] = [];
  const yatis: string[] = [];

  for (const row of rows) {
    const bRaw = row["başvuru tipi"]?.trim();
    if (bRaw) extractBracketValues(bRaw).forEach((v) => basvuru.push(toTitleCase(v)));

    const gRaw = row["geliş tipi"]?.trim();
    if (gRaw) extractBracketValues(gRaw).forEach((v) => gelis.push(toTitleCase(v)));

    const yRaw = row["yatış tipi"]?.trim();
    if (yRaw) extractBracketValues(yRaw).forEach((v) => yatis.push(toTitleCase(v)));
  }

  res.json({
    basvuruTipi: countBy(basvuru),
    gelisTipi: countBy(gelis),
    yatisTipi: countBy(yatis),
  });
});

router.get("/genetic-tests", (_req: Request, res: Response): void => {
  const rows = loadData();
  const tests: string[] = [];
  for (const row of rows) {
    const rawTest = row["genetic test "];
    if (rawTest && rawTest.trim()) {
      const vals = extractBracketValues(rawTest);
      if (vals.length > 0) {
        vals.forEach((t) => tests.push(shortenGeneticLabel(t)));
      } else {
        tests.push(shortenGeneticLabel(rawTest.trim()));
      }
    }
  }
  res.json(countBy(tests).slice(0, 15));
});

router.get("/top-medications", (_req: Request, res: Response): void => {
  const rows = loadData();
  const meds: string[] = [];
  for (const row of rows) {
    const raw = row["order ilaç"];
    if (raw && raw.trim()) {
      extractBracketValues(raw).forEach((m) => meds.push(shortenMedLabel(m)));
    }
  }
  res.json(countBy(meds).slice(0, 20));
});

router.get("/procedure-types", (_req: Request, res: Response): void => {
  const rows = loadData();
  const procs: string[] = [];
  for (const row of rows) {
    const raw = row["işlem tipi"];
    if (raw && raw.trim()) {
      extractBracketValues(raw).forEach((p) => procs.push(p));
      if (!raw.includes("[")) procs.push(raw.trim());
    }
  }
  res.json(countBy(procs).slice(0, 20));
});

router.get("/admission-trend", (_req: Request, res: Response): void => {
  const rows = loadData();
  const months: Record<string, number> = {};
  for (const row of rows) {
    const raw = row["başvuru açılma tarihi"]?.trim();
    if (raw) {
      const dates = extractBracketValues(raw);
      const dateStr = dates.length > 0 ? dates[0] : raw;
      const m = dateStr.match(/(\d{4}-\d{2})/);
      if (m) {
        months[m[1]] = (months[m[1]] || 0) + 1;
      }
    }
  }
  const result = Object.entries(months)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));
  res.json(result);
});

const CANCER_KEYWORDS: Record<string, string[]> = {
  "Meme": ["meme karsinomu", "meme kanseri", "meme malign", "meme ca"],
  "Akciğer": ["akciğer karsinomu", "akciğer kanseri", "nsclc", "sclc", "akciger"],
  "Kolorektal": ["kolorektal", "kolon kanseri", "rektum kanseri", "colorektal"],
  "Lenfoma": ["lenfoma", "hodgkin", "diffuse large"],
  "Prostat": ["prostat kanseri", "prostat karsinomu"],
  "Over": ["over kanseri", "over karsinomu"],
  "Mide": ["mide kanseri", "gastrik karsinom", "gastric"],
  "Pankreas": ["pankreas kanseri", "pankreatik"],
};

function detectCancerType(text: string): string | null {
  const t = text.toLowerCase();
  for (const [type, keywords] of Object.entries(CANCER_KEYWORDS)) {
    if (keywords.some((kw) => t.includes(kw))) return type;
  }
  return null;
}

router.get("/meds-by-cancer-type", (_req: Request, res: Response): void => {
  const rows = loadData();
  const medsByCancer: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    const text = [
      row["epikriz"] || "",
      (row as any)["hikaye"] || "",
      (row as any)["patoloji rapor özet"] || "",
    ].join(" ");

    const cancerType = detectCancerType(text);
    if (!cancerType) continue;

    const medRaw = row["order ilaç"];
    if (!medRaw || !medRaw.trim()) continue;

    if (!medsByCancer[cancerType]) medsByCancer[cancerType] = {};

    extractBracketValues(medRaw).forEach((m) => {
      const label = shortenMedLabel(m);
      if (label) {
        medsByCancer[cancerType][label] = (medsByCancer[cancerType][label] || 0) + 1;
      }
    });
  }

  const result = Object.entries(medsByCancer)
    .sort((a, b) => {
      const totalA = Object.values(a[1]).reduce((s, v) => s + v, 0);
      const totalB = Object.values(b[1]).reduce((s, v) => s + v, 0);
      return totalB - totalA;
    })
    .map(([cancerType, counts]) => ({
      cancerType,
      medications: Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([label, count]) => ({ label, count })),
    }));

  res.json(result);
});

router.get("/patients", (req: Request, res: Response): void => {
  const rows = loadData();
  const page = parseInt((req.query.page as string) || "1");
  const limit = Math.min(parseInt((req.query.limit as string) || "50"), 200);
  const genderFilter = (req.query.gender as string) || "";
  const deptFilter = (req.query.department as string) || "";
  const search = ((req.query.search as string) || "").toLowerCase();

  const seen = new Set<string>();
  const patients = [];

  for (const row of rows) {
    const clientId = row.client_id;
    if (seen.has(clientId)) continue;
    seen.add(clientId);

    const gender = extractGender(row.cinsiyet);
    const dept = extractBracketValues(row.department)[0] || "";
    const age = getAge(row["doğum tarihi"]);

    if (genderFilter && gender !== genderFilter) continue;
    if (deptFilter && !dept.toLowerCase().includes(deptFilter.toLowerCase())) continue;
    if (search && !clientId.toLowerCase().includes(search) && !dept.toLowerCase().includes(search)) continue;

    const admDate = extractBracketValues(row["başvuru açılma tarihi"] || "")[0] || "";

    patients.push({
      id: row.id || clientId,
      clientId,
      gender,
      birthDate: (row["doğum tarihi"] || "").replace(/[\[\]]/g, "").trim(),
      age,
      department: dept,
      admissionDate: admDate,
      hasGeneticTest: !!(row["genetic test "] && row["genetic test "].trim()),
      admissionType: (row["başvuru tipi"] || "").trim(),
      arrivalType: (row["geliş tipi"] || "").trim(),
    });
  }

  const total = patients.length;
  const offset = (page - 1) * limit;
  const pageData = patients.slice(offset, offset + limit);

  res.json({ patients: pageData, total, page, limit });
});

router.get("/cohort", (req: Request, res: Response): void => {
  const rows = loadData();
  const ageGroup = (req.query.ageGroup as string) || "all";
  const genderFilter = (req.query.gender as string) || "all";

  const patientRows = new Map<string, RawRow[]>();
  for (const row of rows) {
    if (!row.client_id) continue;
    if (!patientRows.has(row.client_id)) patientRows.set(row.client_id, []);
    patientRows.get(row.client_id)!.push(row);
  }

  const medCounts: Record<string, number> = {};
  const procTypeCounts: Record<string, number> = {};
  let patientCount = 0;
  let hasHospitalization = 0;
  let hasICU = 0;
  let hasSurgery = 0;
  let hasEmergency = 0;
  let hasGeneticTest = 0;
  let hasDeceased = 0;
  let totalProcItems = 0;

  for (const [, pRows] of patientRows) {
    const firstRow = pRows[0];
    const age = getAge(firstRow["doğum tarihi"]);
    const gender = extractGender(firstRow.cinsiyet);

    if (genderFilter !== "all" && gender !== genderFilter) continue;
    if (ageGroup !== "all") {
      const [min, max] = ageGroup.split("-").map(Number);
      if (age === null || age < min || age > max) continue;
    }

    patientCount++;
    let patProcItems = 0;

    let pHasHosp = false;
    let pHasICU = false;
    let pHasSurgery = false;
    let pHasEmergency = false;
    let pHasGenetic = false;
    let pHasDeceased = false;

    for (const row of pRows) {
      if (row["genetic test "]?.trim()) pHasGenetic = true;
      if (row["ölüm tarihi"]?.trim()) pHasDeceased = true;

      const yatisVals = extractBracketValues(row["yatış tipi"] || "").map((v) => v.toLowerCase());
      if (yatisVals.length > 0) {
        pHasHosp = true;
        if (yatisVals.some((v) => v.includes("yogun") || v.includes("yoğun"))) pHasICU = true;
        if (yatisVals.some((v) => v.includes("ameliyat"))) pHasSurgery = true;
      }

      const basvuruVals = extractBracketValues(row["başvuru tipi"] || "").map((v) => v.toLowerCase());
      if (basvuruVals.some((v) => v.includes("acil"))) pHasEmergency = true;
      if (basvuruVals.some((v) => v.includes("ameliyat"))) pHasSurgery = true;

      const procVals = extractBracketValues(row["işlem tipi"] || "").map((v) => v.toLowerCase());
      if (procVals.some((v) => v.includes("yoğun") || v.includes("yogun"))) pHasICU = true;

      const medRaw = row["order ilaç"];
      if (medRaw) {
        extractBracketValues(medRaw).forEach((m) => {
          const short = shortenMedLabel(m);
          medCounts[short] = (medCounts[short] || 0) + 1;
        });
      }

      const procRaw = row["işlem tipi"];
      if (procRaw) {
        const vals = extractBracketValues(procRaw);
        if (vals.length > 0) {
          vals.forEach((p) => { procTypeCounts[p] = (procTypeCounts[p] || 0) + 1; });
          patProcItems += vals.length;
        } else if (procRaw.trim()) {
          procTypeCounts[procRaw.trim()] = (procTypeCounts[procRaw.trim()] || 0) + 1;
          patProcItems += 1;
        }
      }
    }

    totalProcItems += patProcItems;
    if (pHasHosp) hasHospitalization++;
    if (pHasICU) hasICU++;
    if (pHasSurgery) hasSurgery++;
    if (pHasEmergency) hasEmergency++;
    if (pHasGenetic) hasGeneticTest++;
    if (pHasDeceased) hasDeceased++;
  }

  if (patientCount === 0) {
    res.json({ patientCount: 0, totalPatientsOverall: patientRows.size });
    return;
  }

  const pct = (n: number) => Math.round((n / patientCount) * 100);

  const topMedications = Object.entries(medCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  const topProcedureTypes = Object.entries(procTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  res.json({
    patientCount,
    totalPatientsOverall: patientRows.size,
    avgProceduresPerPatient: Math.round(totalProcItems / patientCount),
    hospitalizationRate: pct(hasHospitalization),
    icuRate: pct(hasICU),
    surgeryRate: pct(hasSurgery),
    emergencyRate: pct(hasEmergency),
    geneticTestRate: pct(hasGeneticTest),
    mortalityRate: pct(hasDeceased),
    topMedications,
    topProcedureTypes,
  });
});

// ─── Cancer Library Stats ───────────────────────────────────────────────────

const LIBRARY_CANCER_DETECT: Array<{ key: string; labelTr: string; labelEn: string; keywords: string[] }> = [
  { key: "breast",      labelTr: "Meme Kanseri",                   labelEn: "Breast Cancer",           keywords: ["meme karsinomu", "meme kanseri", "meme malign", "meme ca"] },
  { key: "prostate",    labelTr: "Prostat Kanseri",                 labelEn: "Prostate Cancer",         keywords: ["prostat"] },
  { key: "bladder",     labelTr: "Mesane Kanseri",                  labelEn: "Bladder Cancer",          keywords: ["mesane"] },
  { key: "lung",        labelTr: "Akciğer Kanseri",                 labelEn: "Lung Cancer",             keywords: ["akciğer karsinomu", "akciğer kanseri", "nsclc", "sclc", "akciger"] },
  { key: "liver",       labelTr: "Karaciğer Kanseri",               labelEn: "Liver Cancer",            keywords: ["hepatosellüler", "karaciğer karsinomu", "karaciğer kanseri", "karaciğer ca"] },
  { key: "colorectal",  labelTr: "Kolon/Rektum Kanseri",            labelEn: "Colorectal Cancer",       keywords: ["kolorektal", "kolon kanseri", "rektum kanseri", "colorektal"] },
  { key: "pancreatic",  labelTr: "Pankreas Kanseri",                labelEn: "Pancreatic Cancer",       keywords: ["pankreas kanseri", "pankreatik"] },
  { key: "cervical",    labelTr: "Serviks/Endometriyum Kanseri",    labelEn: "Cervical/Endometrial",    keywords: ["serviks", "endometrium", "endometriyum"] },
  { key: "lymphoma",    labelTr: "Lenfoma",                         labelEn: "Lymphoma",                keywords: ["lenfoma", "hodgkin", "diffuse large"] },
  { key: "stomach",     labelTr: "Mide Kanseri",                    labelEn: "Stomach Cancer",          keywords: ["mide kanseri", "gastrik karsinom", "gastric"] },
  { key: "myeloma",     labelTr: "Multipl Miyelom",                 labelEn: "Multiple Myeloma",        keywords: ["miyelom", "myeloma"] },
  { key: "kidney",      labelTr: "Böbrek Kanseri",                  labelEn: "Kidney Cancer",           keywords: ["böbrek kanseri", "böbrek karsinomu"] },
];

const CITY_MAP: Record<string, string> = {
  ADN: "Adana",   ANT: "Antalya",    IST: "İstanbul", SAM: "Samsun",
  KON: "Konya",   BUR: "Bursa",      ESK: "Eskişehir", IZM: "İzmir",
  TRZ: "Trabzon",
};

function extractCity(clientId: string): string {
  const parts = clientId.split("_");
  for (const p of parts) { if (CITY_MAP[p]) return CITY_MAP[p]; }
  return "Diğer";
}

function detectLibraryCancerType(text: string): string | null {
  const t = text.toLowerCase();
  for (const { key, keywords } of LIBRARY_CANCER_DETECT) {
    if (keywords.some((kw) => t.includes(kw))) return key;
  }
  return null;
}

interface PatientInfo {
  cancerKey: string | null;
  age: number | null;
  gender: string;
  isDead: boolean;
  city: string;
}

let _patientCache: Map<string, PatientInfo> | null = null;

function buildPatientCache(): Map<string, PatientInfo> {
  if (_patientCache) return _patientCache;
  const rows = loadData();
  const rowsByClient = new Map<string, RawRow[]>();
  for (const row of rows) {
    if (!row.client_id) continue;
    if (!rowsByClient.has(row.client_id)) rowsByClient.set(row.client_id, []);
    rowsByClient.get(row.client_id)!.push(row);
  }
  _patientCache = new Map();
  for (const [clientId, pRows] of rowsByClient) {
    const text = pRows.map((r) => [(r as any)["hikaye"] || "", (r as any)["epikriz"] || ""].join(" ")).join(" ");
    const firstRow = pRows[0];
    _patientCache.set(clientId, {
      cancerKey: detectLibraryCancerType(text),
      age: getAge(firstRow["doğum tarihi"]),
      gender: extractGender(firstRow.cinsiyet),
      isDead: pRows.some((r) => r["ölüm tarihi"]?.trim()),
      city: extractCity(clientId),
    });
  }
  return _patientCache;
}

router.get("/cancer-type-list", (_req: Request, res: Response): void => {
  const cache = buildPatientCache();
  const counts: Record<string, number> = {};
  for (const { cancerKey } of cache.values()) {
    if (cancerKey) counts[cancerKey] = (counts[cancerKey] || 0) + 1;
  }
  const result = LIBRARY_CANCER_DETECT
    .filter(({ key }) => counts[key])
    .map(({ key, labelTr, labelEn }) => ({ key, labelTr, labelEn, count: counts[key] || 0 }))
    .sort((a, b) => b.count - a.count);
  res.json(result);
});

router.get("/cancer-type-detail/:key", (req: Request, res: Response): void => {
  const { key } = req.params;
  const typeInfo = LIBRARY_CANCER_DETECT.find((c) => c.key === key);
  if (!typeInfo) { res.status(404).json({ error: "Not found" }); return; }

  const cache = buildPatientCache();
  const matched = [...cache.values()].filter((p) => p.cancerKey === key);
  const totalPatients = matched.length;
  const totalOverall = cache.size;

  if (totalPatients === 0) {
    res.json({ key, labelTr: typeInfo.labelTr, labelEn: typeInfo.labelEn, totalPatients: 0 });
    return;
  }

  const ages = matched.map((p) => p.age).filter((a): a is number => a !== null && a > 0 && a < 120);
  const avgAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
  const deaths = matched.filter((p) => p.isDead).length;
  const genderF = matched.filter((p) => p.gender === "Kadın").length;
  const genderM = matched.filter((p) => p.gender === "Erkek").length;

  const ageBuckets: Record<string, number> = {};
  for (const age of ages) {
    const b = age < 30 ? "0-29" : age < 45 ? "30-44" : age < 60 ? "45-59" : age < 75 ? "60-74" : "75+";
    ageBuckets[b] = (ageBuckets[b] || 0) + 1;
  }
  const ageGroups = ["0-29","30-44","45-59","60-74","75+"]
    .map((b) => ({ label: b, count: ageBuckets[b] || 0 }))
    .filter((b) => b.count > 0);

  const cityBuckets: Record<string, number> = {};
  for (const p of matched) cityBuckets[p.city] = (cityBuckets[p.city] || 0) + 1;
  const cityDistribution = Object.entries(cityBuckets)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));

  res.json({
    key,
    labelTr: typeInfo.labelTr,
    labelEn: typeInfo.labelEn,
    totalPatients,
    prevalence: Math.round((totalPatients / totalOverall) * 10000) / 100,
    avgAge: Math.round(avgAge * 10) / 10,
    minAge: ages.length ? Math.min(...ages) : null,
    maxAge: ages.length ? Math.max(...ages) : null,
    deaths,
    mortalityRate: Math.round((deaths / totalPatients) * 1000) / 10,
    genderF,
    genderM,
    ageGroups,
    cityDistribution,
  });
});

export default router;

