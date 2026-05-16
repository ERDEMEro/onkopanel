import { useState, useRef, useEffect } from "react";
import { Heart, Send, Bot, User, RefreshCw, History, Clock, Trash2, X, ClipboardList, Sparkles, Loader2, ChevronRight, RotateCcw } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const CURRENT_KEY = "onko_chat_psiko_current";
const HISTORY_KEY = "onko_chat_psiko_history";
const PLAN_KEY = "onko_psiko_plan";

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface Session {
  id: string;
  date: string;
  preview: string;
  messages: Message[];
}

interface Practice { title: string; description: string; duration: string; icon: string; }
interface CopingStrategy { trigger: string; strategy: string; }
interface SupportPlan {
  planTitle: string;
  summary: string;
  dailyPractices: Practice[];
  weeklyGoals: string[];
  copingStrategies: CopingStrategy[];
  affirmations: string[];
  professionalNote: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Merhaba. Ben Umut. Bu platformda, sevdiklerinizi kanser nedeniyle kaybetmiş bireylere eşlik etmek için buradayım.\n\nBurası sizin için güvenli bir alan — istediğinizi paylaşabilir, hiçbir şeyi paylaşmak zorunda değilsiniz. Dinliyorum.",
};

const SUGGESTIONS = [
  "Kayıptan sonra nasıl başa çıkabilirim?",
  "Sürekli suçluluk hissediyorum",
  "Acımı anlatmak istiyorum",
  "Ailemdeki diğer kişiler nasıl destek verebilir?",
];

const CHALLENGES = [
  "Yoğun üzüntü ve ağlama nöbetleri",
  "Uyku güçlüğü",
  "İştahsızlık",
  "Konsantrasyon sorunu",
  "Sosyal izolasyon",
  "Suçluluk duygusu",
  "Öfke ve sinirlilik",
  "Gelecek kaygısı",
  "Yalnızlık hissi",
  "Anlam arayışı",
];
const PREFERENCES = [
  "Meditasyon ve nefes egzersizleri",
  "Yazı yazmak / günlük tutmak",
  "Fiziksel aktivite",
  "Sosyal bağlantı",
  "Doğayla vakit geçirmek",
  "Yaratıcı aktiviteler",
  "Okumak / müzik dinlemek",
  "Dini / manevi pratikler",
];

function loadCurrent(): Message[] {
  try { const s=localStorage.getItem(CURRENT_KEY); if (s) return JSON.parse(s); } catch {}
  return [WELCOME_MESSAGE];
}
function loadHistory(): Session[] {
  try { const s=localStorage.getItem(HISTORY_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}
function loadPlan(): SupportPlan | null {
  try { const s=localStorage.getItem(PLAN_KEY); return s ? JSON.parse(s) as SupportPlan : null; } catch { return null; }
}

async function sendMessage(messages: Message[]): Promise<string> {
  const res = await fetch(`${BASE}/api/grief-support`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map(m=>({role:m.role,content:m.content})) }),
  });
  if (!res.ok) { const err=await res.json().catch(()=>({})); throw new Error((err as {error?:string}).error??"Hata oluştu"); }
  return ((await res.json()) as {reply:string}).reply;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 rounded-full bg-rose-400/70 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
    </div>
  );
}

function AssistantBubble({ content, error }: { content: string; error?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center">
        <Heart className="w-4 h-4 text-rose-500 fill-rose-200"/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-rose-400/80 mb-1 tracking-wide uppercase">Umut</p>
        <div className={`rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] ${error?"bg-red-50 border border-red-200 text-red-700":"bg-rose-50/80 border border-rose-100 text-slate-700"}`}>
          {content}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3 items-start justify-end">
      <div className="flex-1 min-w-0 flex flex-col items-end">
        <p className="text-[11px] font-semibold text-slate-400 mb-1 tracking-wide uppercase">Siz</p>
        <div className="rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-slate-700 text-white max-w-[85%]">{content}</div>
      </div>
      <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center">
        <User className="w-4 h-4 text-slate-500"/>
      </div>
    </div>
  );
}

export default function PsikolojikDestek() {
  const [messages, setMessages] = useState<Message[]>(loadCurrent);
  const [history, setHistory] = useState<Session[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Plan state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [plan, setPlan] = useState<SupportPlan|null>(loadPlan);
  const [planStep, setPlanStep] = useState<"wizard"|"loading"|"result">("wizard");
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [moodLevel, setMoodLevel] = useState(3);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [planError, setPlanError] = useState("");

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, loading]);
  useEffect(() => { localStorage.setItem(CURRENT_KEY, JSON.stringify(messages)); }, [messages]);
  useEffect(() => {
    if (showPlanModal && plan) setPlanStep("result");
    else if (showPlanModal && !plan) setPlanStep("wizard");
  }, [showPlanModal, plan]);

  function archiveAndReset() {
    const userMsgs=messages.filter(m=>m.role==="user");
    if (userMsgs.length>0) {
      const session:Session={id:Date.now().toString(),date:new Date().toLocaleString("tr-TR"),preview:userMsgs[0].content.slice(0,80),messages:[...messages]};
      const updated=[session,...history].slice(0,15);
      setHistory(updated); localStorage.setItem(HISTORY_KEY,JSON.stringify(updated));
    }
    setMessages([WELCOME_MESSAGE]); setInput(""); setShowHistory(false);
    setTimeout(()=>textareaRef.current?.focus(),50);
  }

  function loadSession(session: Session) { setMessages(session.messages); setShowHistory(false); }
  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated=history.filter(s=>s.id!==id); setHistory(updated);
    localStorage.setItem(HISTORY_KEY,JSON.stringify(updated));
  }

  async function send(text: string) {
    const q=text.trim(); if (!q||loading) return;
    const next=[...messages,{role:"user" as const,content:q}];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const reply=await sendMessage(next.filter(m=>!m.error));
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
    } catch {
      setMessages(prev=>[...prev,{role:"assistant",content:"Şu an yanıt veremiyorum. Lütfen birkaç dakika sonra tekrar deneyin.",error:true}]);
    } finally { setLoading(false); setTimeout(()=>textareaRef.current?.focus(),50); }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); send(input); }
  }

  async function generatePlan() {
    setPlanStep("loading"); setPlanError("");
    try {
      const res=await fetch(`${BASE}/api/support-plan`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({challenges:selectedChallenges,moodLevel,preferences:selectedPrefs})});
      const data=(await res.json()) as SupportPlan & {error?:string};
      if (data.error) { setPlanError(data.error); setPlanStep("wizard"); return; }
      localStorage.setItem(PLAN_KEY,JSON.stringify(data));
      setPlan(data); setPlanStep("result");
    } catch { setPlanError("Bağlantı hatası."); setPlanStep("wizard"); }
  }

  function toggleChallenge(c: string) { setSelectedChallenges(prev=>prev.includes(c)?prev.filter(x=>x!==c):[...prev,c]); }
  function togglePref(p: string) { setSelectedPrefs(prev=>prev.includes(p)?prev.filter(x=>x!==p):[...prev,p]); }

  const showSuggestions = messages.length===1&&!loading&&!showHistory;
  const MOOD_LABELS = ["","Çok kötü","Kötü","Orta","İyi","Çok iyi"];

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] bg-gradient-to-br from-rose-50/40 via-white to-purple-50/30">
      {/* Header */}
      <div className="shrink-0 border-b border-rose-100/80 bg-white/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md shadow-rose-200">
              <Heart className="w-5 h-5 text-white fill-white/40"/>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Psikolojik Destek</h1>
              <p className="text-xs text-slate-400">Umut · Empatik Yapay Zeka Danışmanı</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setShowPlanModal(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors font-medium">
              <ClipboardList className="w-3.5 h-3.5"/>
              {plan ? "Planım" : "Yardım Planı"}
              {plan && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>}
            </button>
            <button onClick={()=>setShowHistory(v=>!v)}
              className={`flex items-center gap-1.5 text-xs transition-colors px-2.5 py-1.5 rounded-lg border ${showHistory?"bg-rose-50 border-rose-200 text-rose-600":"border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}>
              <History className="w-3.5 h-3.5"/>
              Geçmiş {history.length>0&&<span className="bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{history.length}</span>}
            </button>
            <button onClick={archiveAndReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100">
              <RefreshCw className="w-3.5 h-3.5"/> Yeni Sohbet
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="shrink-0 bg-amber-50/80 border-b border-amber-100 px-6 py-2">
        <p className="text-[11px] text-amber-700 text-center max-w-3xl mx-auto">
          Bu araç psikolojik destek amaçlıdır; profesyonel terapi veya tıbbi tavsiyenin yerini tutmaz. Acil durumlarda <strong>182 İntihar Önleme Hattı</strong>'nı arayın.
        </p>
      </div>

      {/* Messages or History */}
      <div className="flex-1 overflow-y-auto px-6 py-6 relative">
        {showHistory ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><History className="w-4 h-4 text-rose-500"/> Sohbet Geçmişi</h2>
              <button onClick={()=>setShowHistory(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4"/></button>
            </div>
            {history.length===0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                <p className="text-sm">Henüz kaydedilmiş sohbet yok.</p>
                <p className="text-xs mt-1">Yeni Sohbet başlatıldığında mevcut konuşma buraya kaydedilir.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(session=>(
                  <div key={session.id} onClick={()=>loadSession(session)} role="button" tabIndex={0}
                    onKeyDown={e=>e.key==="Enter"&&loadSession(session)}
                    className="w-full text-left rounded-xl border border-rose-100 bg-white hover:bg-rose-50 hover:border-rose-200 px-4 py-3 transition-all shadow-sm group cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate font-medium">{session.preview}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3"/> {session.date} · {session.messages.filter(m=>m.role==="user").length} mesaj</p>
                      </div>
                      <button onClick={e=>deleteSession(session.id,e)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg,i)=>msg.role==="assistant"?<AssistantBubble key={i} content={msg.content} error={msg.error}/>:<UserBubble key={i} content={msg.content}/>)}
            {loading && (
              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center"><Heart className="w-4 h-4 text-rose-500 fill-rose-200"/></div>
                <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-rose-50/80 border border-rose-100"><TypingDots/></div>
              </div>
            )}
            {showSuggestions && (
              <div className="pt-2">
                <p className="text-xs text-slate-400 mb-3 text-center">Başlamak için bir konu seçebilir ya da kendi düşüncelerinizi yazabilirsiniz</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map(s=><button key={s} onClick={()=>send(s)} className="text-left text-sm px-4 py-3 rounded-xl border border-rose-100 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 transition-all shadow-sm">{s}</button>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      {/* Input */}
      {!showHistory && (
        <div className="shrink-0 border-t border-rose-100/80 bg-white/90 backdrop-blur-sm px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <textarea ref={textareaRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} rows={1}
              placeholder="Düşüncelerinizi buraya yazın..." disabled={loading}
              className="flex-1 resize-none rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 disabled:opacity-50 min-h-[46px] max-h-[140px] overflow-y-auto leading-relaxed shadow-sm"
              onInput={e=>{const el=e.currentTarget;el.style.height="auto";el.style.height=`${Math.min(el.scrollHeight,140)}px`;}}/>
            <button onClick={()=>send(input)} disabled={loading||!input.trim()}
              className="shrink-0 w-11 h-11 rounded-full bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-md shadow-rose-200">
              <Send className="w-4 h-4"/>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">Enter ile gönder · Shift+Enter satır atla</p>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-rose-500"/>
                <p className="font-semibold text-slate-800 text-sm">Kişisel Yardım Planı</p>
              </div>
              <button onClick={()=>setShowPlanModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4"/></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Wizard */}
              {planStep==="wizard" && (
                <div className="p-5 space-y-5">
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-rose-500"/>
                      <p className="text-sm font-medium text-rose-800">Yapay Zeka Destekli Plan</p>
                    </div>
                    <p className="text-xs text-rose-600">Durumunuza özel günlük pratikler, baş etme stratejileri ve hedefler oluşturuyoruz.</p>
                  </div>

                  {planError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{planError}</p>}

                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Şu an en çok hangi zorlukları yaşıyorsunuz? <span className="text-slate-400 font-normal">(birden fazla seçebilirsiniz)</span></p>
                    <div className="flex flex-wrap gap-2">
                      {CHALLENGES.map(c=>(
                        <button key={c} onClick={()=>toggleChallenge(c)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${selectedChallenges.includes(c)?"border-rose-400 bg-rose-50 text-rose-700":"border-slate-200 text-slate-500 hover:border-rose-200"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-3">Şu anki ruh halinizi nasıl tanımlarsınız?</p>
                    <div className="flex gap-1 items-center">
                      {[1,2,3,4,5].map(v=>(
                        <button key={v} onClick={()=>setMoodLevel(v)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${moodLevel===v?"border-rose-400 bg-rose-500 text-white":"border-slate-200 text-slate-500 hover:border-rose-200"}`}>
                          {["😔","😟","😐","🙂","😊"][v-1]}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-1">{MOOD_LABELS[moodLevel]}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Hangi aktiviteleri tercih edersiniz? <span className="text-slate-400 font-normal">(isteğe bağlı)</span></p>
                    <div className="flex flex-wrap gap-2">
                      {PREFERENCES.map(p=>(
                        <button key={p} onClick={()=>togglePref(p)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${selectedPrefs.includes(p)?"border-rose-400 bg-rose-50 text-rose-700":"border-slate-200 text-slate-500 hover:border-rose-200"}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading */}
              {planStep==="loading" && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-14 h-14 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-rose-400 animate-spin"/>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Kişisel planınız hazırlanıyor…</p>
                  <p className="text-xs text-slate-400 text-center">Durumunuza özel pratikler oluşturuyoruz</p>
                </div>
              )}

              {/* Result */}
              {planStep==="result" && plan && (
                <div className="p-5 space-y-4">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-4 text-white flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{plan.planTitle}</p>
                      <p className="text-xs text-rose-100 mt-1 leading-relaxed">{plan.summary}</p>
                    </div>
                    <button onClick={()=>{setPlan(null);localStorage.removeItem(PLAN_KEY);setPlanStep("wizard");}}
                      className="shrink-0 ml-2 flex items-center gap-1 text-xs text-rose-100 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg transition-all">
                      <RotateCcw className="w-3.5 h-3.5"/>
                    </button>
                  </div>

                  {/* Daily practices */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">🌅 Günlük Pratikler</p>
                    <div className="space-y-2">
                      {plan.dailyPractices.map((p,i)=>(
                        <div key={i} className="bg-white border border-rose-100 rounded-xl p-3 flex gap-3">
                          <span className="text-xl shrink-0">{p.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                              <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full">{p.duration}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{p.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly goals */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">🎯 Haftalık Hedefler</p>
                    <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50">
                      {plan.weeklyGoals.map((g,i)=>(
                        <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                          <ChevronRight className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0"/>
                          <p className="text-sm text-slate-700">{g}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coping strategies */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">🛡️ Baş Etme Stratejileri</p>
                    <div className="space-y-2">
                      {plan.copingStrategies.map((c,i)=>(
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-3">
                          <p className="text-xs font-medium text-rose-600 mb-1">{c.trigger}</p>
                          <p className="text-sm text-slate-700">{c.strategy}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Affirmations */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">💬 Olumlu Düşünceler</p>
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-4 space-y-2">
                      {plan.affirmations.map((a,i)=>(
                        <p key={i} className="text-sm text-rose-700 italic leading-relaxed">"{a}"</p>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs text-amber-700">{plan.professionalNote}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            {planStep==="wizard" && (
              <div className="shrink-0 px-5 py-4 border-t border-slate-100">
                <button onClick={generatePlan}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm font-semibold transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4"/> Planımı Oluştur
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
