import { useState } from "react";
import { Newspaper, ExternalLink, RefreshCw, Clock, ChevronRight } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface NewsItem {
  title: string;
  snippet: string;
  link: string;
  source: string;
  date?: string;
  imageUrl?: string;
}

const CATEGORIES = [
  { key: "genel",   label: "Genel" },
  { key: "meme",    label: "Meme Kanseri" },
  { key: "akciger", label: "Akciğer" },
  { key: "kolon",   label: "Kolon" },
  { key: "immuno",  label: "İmmünoterapi" },
  { key: "turkiye", label: "Türkiye" },
];

async function fetchNews(cat: string): Promise<NewsItem[]> {
  const res = await fetch(`${BASE}/api/oncology-news?category=${cat}`);
  if (!res.ok) throw new Error("Haberler alınamadı");
  return ((await res.json()) as { items: NewsItem[] }).items;
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all"
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className="w-20 h-20 rounded-lg object-cover shrink-0 bg-slate-100"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-cyan-700 transition-colors line-clamp-2">
          {item.title}
        </p>
        {item.snippet && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.snippet}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {item.source && (
            <span className="text-[11px] font-medium text-slate-400">{item.source}</span>
          )}
          {item.date && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />{item.date}
            </span>
          )}
          <span className="ml-auto text-cyan-500 group-hover:text-cyan-600 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </a>
  );
}

export default function OnkoHaberler() {
  const [category, setCategory] = useState("genel");
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load(cat: string) {
    setCategory(cat);
    setLoading(true);
    setError(null);
    setLoaded(false);
    try {
      const items = await fetchNews(cat);
      setNews(items);
      setLoaded(true);
    } catch (e) {
      setError("Haberler yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-load on first render
  if (!loaded && !loading && !error) {
    load("genel");
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-cyan-50/30 via-white to-sky-50/20 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center shadow-md shadow-cyan-200">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Onkoloji Haberleri</h1>
              <p className="text-xs text-slate-400">Güncel kanser araştırmaları ve tedavi gelişmeleri</p>
            </div>
          </div>
          <button
            onClick={() => load(category)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Yenile
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => load(c.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c.key
                  ? "bg-cyan-500 text-white shadow-sm shadow-cyan-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 mb-5">
          <p className="text-[11px] text-amber-700">
            Haberler Google News üzerinden gerçek zamanlı çekilmektedir. Tıbbi karar vermek için doktorunuza danışın.
          </p>
        </div>

        {/* Content */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button
              onClick={() => load(category)}
              className="text-xs text-cyan-600 flex items-center gap-1 mx-auto hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tekrar dene
            </button>
          </div>
        )}

        {!loading && !error && news && (
          <>
            {news.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Bu kategori için haber bulunamadı.</div>
            ) : (
              <div className="space-y-3">
                {news.map((item, i) => <NewsCard key={i} item={item} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
