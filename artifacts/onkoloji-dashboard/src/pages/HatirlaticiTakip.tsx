import { useState, useEffect, useRef } from "react";
import { Bell, Plus, Trash2, Pill, CalendarDays, Clock, CheckCircle2, AlertCircle, Sparkles, Send, Loader2, Bot, CalendarClock } from "lucide-react";

interface MedReminder {
  id: string;
  name: string;
  dose: string;
  time: string;
  frequency: "Günlük" | "Haftalık" | "Gerektiğinde";
  createdAt: string;
}

interface ApptReminder {
  id: string;
  doctor: string;
  location: string;
  date: string;
  time: string;
  notes: string;
}

interface ChatMsg { role: "user" | "assistant"; content: string; }

const STORAGE_MED = "onko_med_reminders";
const STORAGE_APPT = "onko_appt_reminders";
const CHAT_KEY = "onko_chat_ilac";

function loadMeds(): MedReminder[] { try { return JSON.parse(localStorage.getItem(STORAGE_MED) ?? "[]"); } catch { return []; } }
function loadApts(): ApptReminder[] { try { return JSON.parse(localStorage.getItem(STORAGE_APPT) ?? "[]"); } catch { return []; } }
function saveMeds(d: MedReminder[]) { localStorage.setItem(STORAGE_MED, JSON.stringify(d)); }
function saveApts(d: ApptReminder[]) { localStorage.setItem(STORAGE_APPT, JSON.stringify(d)); }
function loadChat(): ChatMsg[] { try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]"); } catch { return []; } }
function saveChat(d: ChatMsg[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(d)); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target.getTime()-today.getTime())/86400000);
}

function ApptBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Geçti</span>;
  if (days === 0) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Bugün</span>;
  if (days <= 3) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">{days} gün kaldı</span>;
  if (days <= 7) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{days} gün kaldı</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">{days} gün kaldı</span>;
}

const STARTER_QUESTIONS = [
  "Kemoterapinin yaygın yan etkileri nelerdir?",
  "İlaçlarımı aç mı tok mu almalıyım?",
  "Randevu öncesi doktora hangi soruları sormalıyım?",
  "İlaç atladığımda ne yapmalıyım?",
];

const WEEK_DAYS = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
const FULL_DAYS = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];

function getWeekDates(): string[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0=Mon
  return Array.from({length:7},(_,i) => {
    const d = new Date(today); d.setDate(today.getDate()-dow+i);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  });
}

function timeToMinutes(t: string): number {
  const [h,m] = t.split(":").map(Number);
  return (h||0)*60+(m||0);
}

function medTimeSlot(time: string): "sabah"|"ogle"|"aksam" {
  const mins = timeToMinutes(time);
  if (mins < 12*60) return "sabah";
  if (mins < 17*60) return "ogle";
  return "aksam";
}

export default function HatirlaticiTakip() {
  const [tab, setTab] = useState<"ilac"|"randevu"|"takvim"|"ai">("ilac");
  const [meds, setMeds] = useState<MedReminder[]>([]);
  const [apts, setApts] = useState<ApptReminder[]>([]);
  const [showMedForm, setShowMedForm] = useState(false);
  const [showAptForm, setShowAptForm] = useState(false);
  const [medForm, setMedForm] = useState({ name:"", dose:"", time:"08:00", frequency:"Günlük" as MedReminder["frequency"] });
  const [aptForm, setAptForm] = useState({ doctor:"", location:"", date:"", time:"09:00", notes:"" });
  const [selectedDay, setSelectedDay] = useState(0); // 0 = today (relative to Mon)

  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMeds(loadMeds()); setApts(loadApts()); setChatMsgs(loadChat()); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [chatMsgs]);

  // Set selectedDay to today on mount
  useEffect(() => {
    const todayDow = (new Date().getDay()+6)%7;
    setSelectedDay(todayDow);
  }, []);

  function addMed() {
    if (!medForm.name.trim()) return;
    const updated = [...meds, {id:uid(),...medForm,name:medForm.name.trim(),dose:medForm.dose.trim(),createdAt:new Date().toISOString()}];
    setMeds(updated); saveMeds(updated); setShowMedForm(false);
    setMedForm({name:"",dose:"",time:"08:00",frequency:"Günlük"});
  }
  function deleteMed(id: string) { const u=meds.filter(m=>m.id!==id); setMeds(u); saveMeds(u); }
  function addApt() {
    if (!aptForm.doctor.trim()||!aptForm.date) return;
    const updated=[...apts,{id:uid(),...aptForm,doctor:aptForm.doctor.trim(),location:aptForm.location.trim(),notes:aptForm.notes.trim()}];
    const sorted=[...updated].sort((a,b)=>a.date.localeCompare(b.date));
    setApts(sorted); saveApts(sorted); setShowAptForm(false);
    setAptForm({doctor:"",location:"",date:"",time:"09:00",notes:""});
  }
  function deleteApt(id: string) { const u=apts.filter(a=>a.id!==id); setApts(u); saveApts(u); }

  async function sendChat(text: string) {
    if (!text.trim()||chatLoading) return;
    const userMsg: ChatMsg={role:"user",content:text.trim()};
    const updated=[...chatMsgs,userMsg];
    setChatMsgs(updated); saveChat(updated); setChatInput(""); setChatLoading(true);
    try {
      const res=await fetch("/api/ai-advisor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"medication",messages:updated})});
      const data=(await res.json()) as {reply?:string;error?:string};
      const reply:ChatMsg={role:"assistant",content:data.reply??data.error??"Yanıt alınamadı."};
      const final=[...updated,reply]; setChatMsgs(final); saveChat(final);
    } catch {
      const err:ChatMsg={role:"assistant",content:"Bağlantı hatası."};
      const final=[...updated,err]; setChatMsgs(final); saveChat(final);
    } finally { setChatLoading(false); }
  }

  // Takvim data
  const weekDates = getWeekDates();
  const todayDow = (new Date().getDay()+6)%7;
  const selectedDate = weekDates[selectedDay];

  const dailyMeds = meds
    .filter(m => m.frequency === "Günlük" || m.frequency === "Gerektiğinde")
    .sort((a,b) => timeToMinutes(a.time)-timeToMinutes(b.time));
  const weeklyMeds = meds.filter(m => m.frequency === "Haftalık");

  const dayApts = apts.filter(a => a.date === selectedDate);

  const sabahMeds = dailyMeds.filter(m=>medTimeSlot(m.time)==="sabah");
  const ogleMeds  = dailyMeds.filter(m=>medTimeSlot(m.time)==="ogle");
  const aksamMeds = dailyMeds.filter(m=>medTimeSlot(m.time)==="aksam");

  const upcomingApts = apts.filter(a => daysUntil(a.date) >= 0).slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-violet-50/30 via-white to-purple-50/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">İlaç & Randevu Takibi</h1>
            <p className="text-xs text-slate-400">Kişisel takibiniz — yalnızca bu cihazda saklanır</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 overflow-x-auto">
          {([
            {v:"ilac", label:"İlaçlarım", icon:<Pill className="w-3.5 h-3.5"/>},
            {v:"randevu", label:"Randevularım", icon:<CalendarDays className="w-3.5 h-3.5"/>},
            {v:"takvim", label:"Takvim", icon:<CalendarClock className="w-3.5 h-3.5"/>},
            {v:"ai", label:"İlaçBot", icon:<Sparkles className="w-3.5 h-3.5 text-violet-500"/>},
          ] as const).map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium rounded-lg transition-all ${tab===t.v?"bg-white shadow-sm text-slate-800":"text-slate-500 hover:text-slate-700"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* İlaç tab */}
        {tab === "ilac" && (
          <div className="space-y-3">
            {meds.length === 0 && !showMedForm && (
              <div className="text-center py-10 text-slate-400">
                <Pill className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz ilaç eklemediniz</p>
              </div>
            )}
            {meds.map(m=>(
              <div key={m.id} className="flex items-start gap-3 bg-white rounded-xl border border-violet-100 px-4 py-3 shadow-sm">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {m.dose && <span className="text-xs text-slate-500">{m.dose}</span>}
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/>{m.time}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">{m.frequency}</span>
                  </div>
                </div>
                <button onClick={()=>deleteMed(m.id)} className="text-slate-300 hover:text-red-400 transition-colors mt-0.5"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
            {showMedForm && (
              <div className="bg-white rounded-xl border border-violet-200 p-4 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-slate-700">Yeni İlaç Ekle</p>
                <input placeholder="İlaç adı *" value={medForm.name} onChange={e=>setMedForm(f=>({...f,name:e.target.value}))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"/>
                <input placeholder="Doz (örn: 500 mg)" value={medForm.dose} onChange={e=>setMedForm(f=>({...f,dose:e.target.value}))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"/>
                <div className="flex gap-2">
                  <input type="time" value={medForm.time} onChange={e=>setMedForm(f=>({...f,time:e.target.value}))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"/>
                  <select value={medForm.frequency} onChange={e=>setMedForm(f=>({...f,frequency:e.target.value as MedReminder["frequency"]}))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option>Günlük</option><option>Haftalık</option><option>Gerektiğinde</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={addMed} className="flex-1 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors">Kaydet</button>
                  <button onClick={()=>setShowMedForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">İptal</button>
                </div>
              </div>
            )}
            {!showMedForm && (
              <button onClick={()=>setShowMedForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-violet-200 text-violet-500 hover:border-violet-300 hover:bg-violet-50/50 text-sm font-medium transition-all">
                <Plus className="w-4 h-4"/> İlaç Ekle
              </button>
            )}
          </div>
        )}

        {/* Randevu tab */}
        {tab === "randevu" && (
          <div className="space-y-3">
            {apts.length === 0 && !showAptForm && (
              <div className="text-center py-10 text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">Henüz randevu eklemediniz</p>
              </div>
            )}
            {apts.map(a=>{
              const days=daysUntil(a.date);
              return (
                <div key={a.id} className={`flex items-start gap-3 bg-white rounded-xl border px-4 py-3 shadow-sm ${days<0?"border-slate-200 opacity-60":days<=3?"border-orange-200":"border-purple-100"}`}>
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${days<0?"bg-slate-100":"bg-purple-100"}`}>
                    {days<0?<CheckCircle2 className="w-4 h-4 text-slate-400"/>:days<=1?<AlertCircle className="w-4 h-4 text-orange-500"/>:<CalendarDays className="w-4 h-4 text-purple-500"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{a.doctor}</p>
                      <ApptBadge days={days}/>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})} {a.time}</span>
                      {a.location && <span className="text-xs text-slate-500">{a.location}</span>}
                    </div>
                    {a.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{a.notes}</p>}
                  </div>
                  <button onClick={()=>deleteApt(a.id)} className="text-slate-300 hover:text-red-400 transition-colors mt-0.5"><Trash2 className="w-4 h-4"/></button>
                </div>
              );
            })}
            {showAptForm && (
              <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-slate-700">Yeni Randevu Ekle</p>
                <input placeholder="Doktor / Klinik adı *" value={aptForm.doctor} onChange={e=>setAptForm(f=>({...f,doctor:e.target.value}))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"/>
                <input placeholder="Hastane / Konum" value={aptForm.location} onChange={e=>setAptForm(f=>({...f,location:e.target.value}))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"/>
                <div className="flex gap-2">
                  <input type="date" value={aptForm.date} onChange={e=>setAptForm(f=>({...f,date:e.target.value}))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"/>
                  <input type="time" value={aptForm.time} onChange={e=>setAptForm(f=>({...f,time:e.target.value}))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"/>
                </div>
                <textarea placeholder="Notlar (isteğe bağlı)" value={aptForm.notes} onChange={e=>setAptForm(f=>({...f,notes:e.target.value}))} rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"/>
                <div className="flex gap-2">
                  <button onClick={addApt} className="flex-1 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors">Kaydet</button>
                  <button onClick={()=>setShowAptForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">İptal</button>
                </div>
              </div>
            )}
            {!showAptForm && (
              <button onClick={()=>setShowAptForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-purple-200 text-purple-500 hover:border-purple-300 hover:bg-purple-50/50 text-sm font-medium transition-all">
                <Plus className="w-4 h-4"/> Randevu Ekle
              </button>
            )}
          </div>
        )}

        {/* Takvim tab */}
        {tab === "takvim" && (
          <div className="space-y-4">
            {/* Week strip */}
            <div className="bg-white rounded-xl border border-violet-100 shadow-sm p-2">
              <div className="grid grid-cols-7 gap-1">
                {WEEK_DAYS.map((d,i)=>{
                  const isToday = i===todayDow;
                  const dateStr = weekDates[i];
                  const hasAppt = apts.some(a=>a.date===dateStr);
                  const hasMed = dailyMeds.length>0;
                  return (
                    <button key={d} onClick={()=>setSelectedDay(i)}
                      className={`flex flex-col items-center py-2 rounded-lg transition-all ${selectedDay===i?"bg-violet-500 text-white":"hover:bg-violet-50"}`}>
                      <span className={`text-[10px] font-medium mb-1 ${selectedDay===i?"text-violet-100":isToday?"text-violet-600":"text-slate-500"}`}>{d}</span>
                      <span className={`text-sm font-bold ${selectedDay===i?"text-white":isToday?"text-violet-700":"text-slate-700"}`}>
                        {new Date(dateStr+"T12:00:00").getDate()}
                      </span>
                      <div className="flex gap-0.5 mt-1">
                        {hasMed && <div className={`w-1 h-1 rounded-full ${selectedDay===i?"bg-white/60":"bg-violet-300"}`}/>}
                        {hasAppt && <div className={`w-1 h-1 rounded-full ${selectedDay===i?"bg-white/60":"bg-purple-400"}`}/>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-700 px-1">
              {FULL_DAYS[selectedDay]}, {new Date(selectedDate+"T12:00:00").toLocaleDateString("tr-TR",{day:"numeric",month:"long"})}
            </p>

            {meds.length===0 && apts.length===0 && (
              <div className="text-center py-10 text-slate-400">
                <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">İlaç veya randevu eklemek için</p>
                <p className="text-xs mt-1">İlaçlarım veya Randevularım sekmesini kullanın</p>
              </div>
            )}

            {/* Medication time slots */}
            {dailyMeds.length>0 && (
              <div className="space-y-3">
                {[
                  {slot:"sabah", label:"🌅 Sabah", meds:sabahMeds, color:"amber"},
                  {slot:"ogle", label:"☀️ Öğle", meds:ogleMeds, color:"blue"},
                  {slot:"aksam", label:"🌙 Akşam", meds:aksamMeds, color:"indigo"},
                ].filter(s=>s.meds.length>0).map(s=>(
                  <div key={s.slot} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-600">{s.label}</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {s.meds.map(m=>(
                        <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4 text-violet-500"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                            <p className="text-xs text-slate-500">{m.dose && `${m.dose} · `}{m.time}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-100 shrink-0">{m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Weekly meds */}
            {weeklyMeds.length>0 && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-600">📅 Haftalık İlaçlar</p>
                </div>
                {weeklyMeds.map(m=>(
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-t border-slate-50 first:border-t-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4 text-purple-500"/>
                    </div>
                    <div className="flex-1"><p className="text-sm font-semibold text-slate-800">{m.name}</p><p className="text-xs text-slate-500">{m.dose && `${m.dose} · `}Haftalık</p></div>
                  </div>
                ))}
              </div>
            )}

            {/* Day appointments */}
            {dayApts.length>0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 px-1">Bu Günün Randevuları</p>
                {dayApts.map(a=>(
                  <div key={a.id} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{a.doctor}</p>
                      <p className="text-xs text-slate-500">{a.time}{a.location && ` · ${a.location}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming appointments */}
            {upcomingApts.filter(a=>a.date!==selectedDate).length>0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 px-1">Yaklaşan Randevular</p>
                {upcomingApts.filter(a=>a.date!==selectedDate).map(a=>{
                  const days=daysUntil(a.date);
                  return (
                    <div key={a.id} className="bg-white border border-purple-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                      <CalendarDays className="w-4 h-4 text-purple-400 shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{a.doctor}</p>
                        <p className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString("tr-TR",{day:"numeric",month:"short"})} {a.time}</p>
                      </div>
                      <ApptBadge days={days}/>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AI Chat tab */}
        {tab === "ai" && (
          <div className="flex flex-col gap-3">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-4 flex items-center gap-3 text-white shadow-md shadow-violet-100">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Bot className="w-5 h-5"/></div>
              <div>
                <p className="text-sm font-semibold">İlaçBot</p>
                <p className="text-xs text-violet-100">İlaç bilgisi ve randevu hazırlık rehberi</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{minHeight:340}}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{maxHeight:400}}>
                {chatMsgs.length===0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 text-center">İlaçlarınız veya randevularınız hakkında merak ettiklerinizi sorun</p>
                    <div className="grid grid-cols-1 gap-2">
                      {STARTER_QUESTIONS.map(q=>(
                        <button key={q} onClick={()=>sendChat(q)}
                          className="text-left text-xs bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-lg px-3 py-2.5 text-violet-700 transition-colors">{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMsgs.map((m,i)=>(
                  <div key={i} className={`flex gap-2 ${m.role==="user"?"justify-end":"justify-start"}`}>
                    {m.role==="assistant"&&<div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5"><Bot className="w-3.5 h-3.5 text-violet-600"/></div>}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${m.role==="user"?"bg-violet-500 text-white rounded-br-sm":"bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-sm"}`}>{m.content}</div>
                  </div>
                ))}
                {chatLoading&&(
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-violet-600"/></div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl rounded-bl-sm px-3 py-2"><Loader2 className="w-4 h-4 text-violet-400 animate-spin"/></div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>
              <div className="border-t border-slate-100 p-3 flex gap-2">
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void sendChat(chatInput);}}}
                  placeholder="İlaç veya randevu hakkında sorun…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  disabled={chatLoading}/>
                <button onClick={()=>void sendChat(chatInput)} disabled={!chatInput.trim()||chatLoading}
                  className="w-9 h-9 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0">
                  <Send className="w-4 h-4"/>
                </button>
              </div>
            </div>
            {chatMsgs.length>0&&(
              <button onClick={()=>{setChatMsgs([]);saveChat([]);}} className="text-xs text-slate-400 hover:text-slate-600 text-center transition-colors">Sohbeti temizle</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
