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
  const uniqueClients = new Set<string>();
  let femaleCount = 0;
  let maleCount = 0;
  const ages: number[] = [];
  let withGeneticTest = 0;
  const departments = new Set<string>();

  for (const row of rows) {
    if (row.client_id) uniqueClients.add(row.client_id);
    const gender = extractGender(row.cinsiyet);
    if (gender === "Kadın") femaleCount++;
    else if (gender === "Erkek") maleCount++;
    const age = getAge(row["doğum tarihi"]);
    if (age !== null && age > 0 && age < 120) ages.push(age);
    if (row["genetic test "] && row["genetic test "].trim()) withGeneticTest++;
    const depts = extractBracketValues(row.department);
    depts.forEach((d) => departments.add(d));
  }

  const avgAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

  res.json({
    totalPatients: uniqueClients.size,
    femaleCount,
    maleCount,
    averageAge: Math.round(avgAge * 10) / 10,
    withGeneticTest,
    totalAdmissions: rows.length,
    departmentCount: departments.size,
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

    for (const row of pRows) {
      if (row["genetic test "]?.trim()) pHasGenetic = true;

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
    topMedications,
    topProcedureTypes,
  });
});

export default router;
