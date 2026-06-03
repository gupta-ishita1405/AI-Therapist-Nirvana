import React, { useState, useEffect } from "react";
import { 
  Smile, Calendar, Clock, Activity, 
  TrendingUp, Sparkles, Check, Heart, 
  Zap, Info, ChevronRight 
} from "lucide-react";
import { MoodRecord } from "../types";

interface MoodModuleProps {
  token: string;
  onMoodAdded: () => void;
}

export default function MoodModule({ token, onMoodAdded }: MoodModuleProps) {
  const [score, setScore] = useState(5);
  const [emoji, setEmoji] = useState("🍃");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [history, setHistory] = useState<MoodRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const moodsConfig = [
    { score: 7, label: "Radiant", emoji: "☀️", color: "bg-amber-100 text-amber-600 border-amber-200" },
    { score: 6, label: "Growth", emoji: "🌱", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
    { score: 5, label: "Balanced", emoji: "🍃", color: "bg-[#93C572]/20 text-[#7AA55C] border-[#93C572]/30" },
    { score: 4, label: "Cool", emoji: "☁️", border: "border-blue-100", color: "bg-blue-50 text-blue-500" },
    { score: 3, label: "Static", emoji: "⚡", border: "border-orange-100", color: "bg-orange-50 text-orange-500" },
    { score: 2, label: "Faded", emoji: "🍂", border: "border-pink-100", color: "bg-pink-50 text-pink-500" },
    { score: 1, label: "Storm", emoji: "🌧️", border: "border-purple-100", color: "bg-purple-50 text-purple-500" }
  ];

  useEffect(() => { fetchHistory(); }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/moods", { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data.reverse());
    } catch { console.warn("Failed to sync mood telemetry."); }
  };

  const handleSubmitMood = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ score, emoji, notes, date })
      });
      if (res.ok) {
        setDone(true);
        setNotes("");
        fetchHistory();
        onMoodAdded();
        setTimeout(() => setDone(false), 4000);
      }
    } catch (err) { console.warn("Sync failed."); } finally { setLoading(false); }
  };

  const getTrajectory = () => {
    if (history.length === 0) return "Establishing baseline protocols...";
    const avg = history.reduce((acc, curr) => acc + curr.score, 0) / history.length;
    if (avg >= 5.5) return "Your resilience threshold is high. You are currently in a state of clinical flourishing.";
    if (avg >= 4.0) return "Emotional baseline is stable. Your recovery patterns are performing as expected.";
    return "Increased tension detected. We recommend a 5-minute breathing module to recalibrate.";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      
      {/* Left Column: Logging Form */}
      <div className="lg:col-span-7 bg-white dark:bg-[#1A1D1B] rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-10 relative overflow-hidden">
        
        {/* Dynamic Glow Background */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] -z-10 opacity-20 transition-colors duration-1000 ${moodsConfig.find(m => m.score === score)?.color.split(' ')[0]}`} />

        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">Emotional Vitality</h3>
            <p className="text-xs font-bold text-[#93C572] uppercase tracking-[0.2em] mt-1">Status Check-in</p>
          </div>
          {done && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#93C572]/10 text-[#7AA55C] rounded-full text-[10px] font-bold uppercase animate-bounce">
              <Check className="w-3 h-3" /> Bio-Sync Complete
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitMood} className="space-y-10">
          
          {/* Fun Expression Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Frequency</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {moodsConfig.map((item) => (
                <button
                  key={item.score}
                  type="button"
                  onClick={() => { setScore(item.score); setEmoji(item.emoji); }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border group relative ${
                    score === item.score
                      ? `${item.color} scale-110 shadow-lg shadow-black/5`
                      : "bg-slate-50 border-transparent hover:border-slate-200"
                  }`}
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{item.emoji}</span>
                  <span className={`text-[8px] font-bold mt-2 uppercase transition-opacity ${score === item.score ? 'opacity-100' : 'opacity-40'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Fine Tune Slider */}
            <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intensity Index</span>
                 <span className="px-3 py-1 bg-white rounded-lg text-sm font-bold text-slate-700 shadow-sm">{score}/7</span>
               </div>
               <input 
                type="range" min="1" max="7" step="1" value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#93C572]"
               />
            </div>

            {/* Reflection Area */}
            <div className="group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Contextual Notes</label>
              <textarea 
                placeholder="What anchors this feeling? Work, relationships, health..."
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#93C572]/5 focus:border-[#93C572]/30 transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#93C572] transition-colors" />
                <input 
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-[#93C572]/30 transition-all font-medium text-slate-600"
                />
              </div>
              <button 
                type="submit" disabled={loading}
                className="px-10 py-3.5 bg-slate-900 text-white font-bold text-sm rounded-2xl shadow-xl shadow-slate-200 hover:bg-[#93C572] transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 
                <>Confirm Check-in <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right Column: History & Insights */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Rebranded Insight Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
          <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-[#93C572]">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Emotional Pulse</h3>
            </div>
            <p className="text-sm leading-relaxed font-medium opacity-90">
              "{getTrajectory()}"
            </p>
            <div className="pt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
              <Zap className="w-3 h-3" /> Real-time Pattern Analysis
            </div>
          </div>
        </div>

        {/* Professional Log List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[460px]">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical Telemetry</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-[#93C572]" />
              <div className="w-1 h-1 rounded-full bg-[#93C572]" />
              <div className="w-1 h-1 rounded-full bg-[#93C572]" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-xs">
                <Heart className="w-8 h-8 mb-2" /> No data points indexed.
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-[#93C572]/20 transition-all shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                      {item.emoji}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
                        {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs font-bold text-slate-700">Rating: {item.score}.0 Intensity</div>
                      {item.notes && <p className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5">"{item.notes}"</p>}
                    </div>
                  </div>
                  <Info className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#93C572] transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}