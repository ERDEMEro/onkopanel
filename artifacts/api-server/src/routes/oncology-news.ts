import { Router, type Request, type Response } from "express";

const router = Router();

interface NewsItem {
  title: string;
  snippet: string;
  link: string;
  source: string;
  date?: string;
  imageUrl?: string;
}

let newsCache: { data: NewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

async function fetchNews(query: string): Promise<NewsItem[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY eksik");

  const res = await fetch("https://google.serper.dev/news", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: "tr", hl: "tr", num: 20 }),
  });

  if (!res.ok) throw new Error(`Serper hata: ${res.status}`);
  const data = (await res.json()) as {
    news?: Array<{
      title: string;
      snippet?: string;
      link: string;
      source?: string;
      date?: string;
      imageUrl?: string;
    }>;
  };

  return (data.news ?? []).map((n) => ({
    title: n.title,
    snippet: n.snippet ?? "",
    link: n.link,
    source: n.source ?? "",
    date: n.date,
    imageUrl: n.imageUrl,
  }));
}

router.get("/oncology-news", async (req: Request, res: Response): Promise<void> => {
  const category = (req.query.category as string) ?? "genel";

  const queries: Record<string, string> = {
    genel: "kanser araştırma tedavi 2025",
    meme: "meme kanseri tedavi araştırma 2025",
    akciger: "akciğer kanseri tedavi 2025",
    kolon: "kolon kanseri araştırma 2025",
    immuno: "kanser immünoterapi haber 2025",
    turkiye: "Türkiye onkoloji kanser haber 2025",
  };

  const q = queries[category] ?? queries.genel;

  try {
    if (newsCache && Date.now() - newsCache.fetchedAt < CACHE_TTL && category === "genel") {
      res.json({ items: newsCache.data, cached: true });
      return;
    }

    const items = await fetchNews(q);

    if (category === "genel") {
      newsCache = { data: items, fetchedAt: Date.now() };
    }

    res.json({ items, cached: false });
  } catch (err) {
    req.log?.error?.({ err }, "oncology-news error");
    res.status(500).json({ error: "Haberler alınamadı." });
  }
});

export default router;
