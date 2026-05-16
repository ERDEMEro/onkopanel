import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Pill, CalendarDays, Clock, CheckCircle2, AlertCircle } from "lucide-react";

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

const STORAGE_MED = "onko_med_reminders";
const STORAGE_APPT = "onko_appt_reminders";

function loadMeds(): MedReminder[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_MED) ?? "[]"); } catch { return []; }
}
function loadApts(): ApptReminder[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_APPT) ?? "[]"); } catch { return []; }
}
function saveMeds(d: MedReminder[]) { localStorage.setItem(STORAGE_MED, JSON.stringify(d)); }
function saveApts(d: ApptReminder[]) { localStorage.setItem(STORAGE_APPT, JSON.stringify(d)); }

function uid() { return Math.random().toString(36).slice(2, 10); }

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function ApptBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Geçti</span>;
  if (days === 0) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Bugün</span>;
  if (days <= 3) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">{days} gün kaldı</span>;
  if (days <= 7) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{days} gün kaldı</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">{days} gün kaldı</span>;
}

export default function HatirlaticiTakip() {
  const [tab, setTab] = useState<"ilac" | "randevu">("ilac");
  const [meds, setMeds] = useState<MedReminder[]>([]);
  const [apts, setApts] = useState<ApptReminder[]>([]);
  const [showMedForm, setShowMedForm] = useState(false);
  const [showAptForm, setShowAptForm] = useState(false);

  const [medForm, setMedForm] = useState({ name: "", dose: "", time: "08:00", frequency: "Günlük" as MedReminder["frequency"] });
  const [aptForm, setAptForm] = useState({ doctor: "", location: "", date: "", time: "09:00", notes: "" });

  useEffect(() => { setMeds(loadMeds()); setApts(loadApts()); }, []);

  function addMed() {
    if (!medForm.name.trim()) return;
    const updated = [...meds, { id: uid(), ...medForm, name: medForm.name.trim(), dose: medForm.dose.trim(), createdAt: new Date().toISOString() }];
    setMeds(updated); saveMeds(updated); setShowMedForm(false);
    setMedForm({ name: "", dose: "", time: "08:00", frequency: "Günlük" });
  }

  function deleteMed(id: string) {
    const updated = meds.filter((m) => m.id !== id); setMeds(updated); saveMeds(updated);
  }

  function addApt() {
    if (!aptForm.doctor.trim() || !aptForm.date) return;
    const updated = [...apts, { id: uid(), ...aptForm, doctor: aptForm.doctor.trim(), location: aptForm.location.trim(), notes: aptForm.notes.trim() }];
    const sorted = [...updated].sort((a, b) => a.date.localeCompare(b.date));
    setApts(sorted); saveApts(sorted); setShowAptForm(false);
    setAptForm({ doctor: "", location: "", date: "", time: "09:00", notes: "" });
  }

  function deleteApt(id: string) {
    const updated = apts.filter((a) => a.id !== id); setApts(updated); saveApts(updated);
  }

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
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
          {(["ilac", "randevu"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "ilac" ? <Pill className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
              {t === "ilac" ? "İlaçlarım" : "Randevularım"}
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
            {meds.map((m) => (
              <div key={m.id} className="flex items-start gap-3 bg-white rounded-xl border border-violet-100 px-4 py-3 shadow-sm">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {m.dose && <span className="text-xs text-slate-500">{m.dose}</span>}
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{m.time}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">{m.frequency}</span>
                  </div>
                </div>
                <button onClick={() => deleteMed(m.id)} className="text-slate-300 hover:text-red-400 transition-colors mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {showMedForm && (
              <div className="bg-white rounded-xl border border-violet-200 p-4 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-slate-700">Yeni İlaç Ekle</p>
                <input
                  placeholder="İlaç adı *"
                  value={medForm.name}
                  onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                <input
                  placeholder="Doz (örn: 500 mg)"
                  value={medForm.dose}
                  onChange={(e) => setMedForm((f) => ({ ...f, dose: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={medForm.time}
                    onChange={(e) => setMedForm((f) => ({ ...f, time: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  />
                  <select
                    value={medForm.frequency}
                    onChange={(e) => setMedForm((f) => ({ ...f, frequency: e.target.value as MedReminder["frequency"] }))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  >
                    <option>Günlük</option>
                    <option>Haftalık</option>
                    <option>Gerektiğinde</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={addMed} className="flex-1 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors">
                    Kaydet
                  </button>
                  <button onClick={() => setShowMedForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                    İptal
                  </button>
                </div>
              </div>
            )}

            {!showMedForm && (
              <button
                onClick={() => setShowMedForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-violet-200 text-violet-500 hover:border-violet-300 hover:bg-violet-50/50 text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" /> İlaç Ekle
              </button>
            )}
          </div>
        )}

        {/* Randevu tab */}
        {tab === "randevu" && (
          <div className="space-y-3">
            {apts.length === 0 && !showAptForm && (
              <div className="text-center py-10 text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz randevu eklemediniz</p>
              </div>
            )}
            {apts.map((a) => {
              const days = daysUntil(a.date);
              return (
                <div key={a.id} className={`flex items-start gap-3 bg-white rounded-xl border px-4 py-3 shadow-sm ${
                  days < 0 ? "border-slate-200 opacity-60" : days <= 3 ? "border-orange-200" : "border-purple-100"
                }`}>
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    days < 0 ? "bg-slate-100" : "bg-purple-100"
                  }`}>
                    {days < 0
                      ? <CheckCircle2 className="w-4 h-4 text-slate-400" />
                      : days <= 1 ? <AlertCircle className="w-4 h-4 text-orange-500" />
                      : <CalendarDays className="w-4 h-4 text-purple-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{a.doctor}</p>
                      <ApptBadge days={days} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {new Date(a.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} {a.time}
                      </span>
                      {a.location && <span className="text-xs text-slate-500">{a.location}</span>}
                    </div>
                    {a.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{a.notes}</p>}
                  </div>
                  <button onClick={() => deleteApt(a.id)} className="text-slate-300 hover:text-red-400 transition-colors mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {showAptForm && (
              <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-slate-700">Yeni Randevu Ekle</p>
                <input
                  placeholder="Doktor / Klinik adı *"
                  value={aptForm.doctor}
                  onChange={(e) => setAptForm((f) => ({ ...f, doctor: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <input
                  placeholder="Hastane / Konum"
                  value={aptForm.location}
                  onChange={(e) => setAptForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={aptForm.date}
                    onChange={(e) => setAptForm((f) => ({ ...f, date: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <input
                    type="time"
                    value={aptForm.time}
                    onChange={(e) => setAptForm((f) => ({ ...f, time: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <textarea
                  placeholder="Notlar (isteğe bağlı)"
                  value={aptForm.notes}
                  onChange={(e) => setAptForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <div className="flex gap-2">
                  <button onClick={addApt} className="flex-1 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors">
                    Kaydet
                  </button>
                  <button onClick={() => setShowAptForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                    İptal
                  </button>
                </div>
              </div>
            )}

            {!showAptForm && (
              <button
                onClick={() => setShowAptForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-purple-200 text-purple-500 hover:border-purple-300 hover:bg-purple-50/50 text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" /> Randevu Ekle
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
