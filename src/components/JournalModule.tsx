import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Plus, Save, Trash, FileDown, Lock, 
  Unlock, Eye, Archive, ChevronRight, Hash, 
  Clock, MoreVertical
} from "lucide-react";
import { JournalEntry } from "../types";

interface JournalModuleProps {
  token: string;
}

export default function JournalModule({ token }: JournalModuleProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  
  // State Management
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<JournalEntry["category"]>("Reflections");
  const [isPrivate, setIsPrivate] = useState(true);
  const [search, setSearch] = useState("");
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const categories = ["Reflections", "Gratitude", "Anxiety Relief", "Personal Growth", "Dream Journal"];

  useEffect(() => { fetchEntries(); }, [token]);

  useEffect(() => {
    if (selected) {
      setTitle(selected.title);
      setContent(selected.content);
      setCategory(selected.category);
      setIsPrivate(selected.isPrivate);
    } else {
      resetForm();
    }
  }, [selected]);

  // Simplified Auto-save logic
  useEffect(() => {
    if (!selected || (title === selected.title && content === selected.content)) return;
    setSavingStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(triggerAutoSave, 2000);
    return () => clearTimeout(saveTimerRef.current!);
  }, [title, content]);

  const fetchEntries = async () => {
    const res = await fetch("/api/journals", { headers: { "Authorization": `Bearer ${token}` } });
    const data = await res.json();
    if (Array.isArray(data)) {
      setEntries(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    }
  };

  const resetForm = () => {
    setTitle(""); setContent(""); setCategory("Reflections"); setIsPrivate(true);
  };

  const triggerAutoSave = async () => {
    if (!selected) return;
    const res = await fetch(`/api/journals/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ title, content, category, isPrivate, tags: [], moodAttached: 5 })
    });
    if (res.ok) {
      const updated = await res.json();
      setEntries(prev => prev.map(e => e.id === selected.id ? updated : e));
      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 2000);
    }
  };

  const handleSave = async () => {
    const method = selected ? "PUT" : "POST";
    const url = selected ? `/api/journals/${selected.id}` : "/api/journals";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ title, content, category, isPrivate, tags: [], moodAttached: 5 })
    });
    const data = await res.json();
    if (res.ok) {
      if (selected) setEntries(prev => prev.map(e => e.id === selected.id ? data : e));
      else setEntries([data, ...entries]);
      setSelected(data);
    }
  };

  const filtered = entries.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-180px)] gap-8 animate-in fade-in duration-500">
      
      {/* Sidebar: Navigation */}
      <div className="w-80 flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 tracking-tight">Reflections</h3>
            <button onClick={() => setSelected(null)} className="p-2 bg-[#93C572]/10 text-[#93C572] rounded-xl hover:bg-[#93C572]/20 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" placeholder="Search entries..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-1 focus:ring-[#93C572]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-20 text-center opacity-30 italic text-xs">No entries found</div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${
                  selected?.id === item.id ? "bg-[#93C572]/5 text-[#93C572]" : "hover:bg-slate-50 text-slate-500"
                }`}
              >
                <div className="truncate pr-4">
                  <div className={`text-xs font-bold truncate ${selected?.id === item.id ? "text-slate-800" : ""}`}>
                    {item.title || "Untitled Entry"}
                  </div>
                  <div className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        
        {/* Workspace Toolbar */}
        <div className="px-8 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${savingStatus === 'saving' ? 'bg-orange-400 animate-pulse' : savingStatus === 'saved' ? 'bg-[#93C572]' : 'bg-slate-200'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {savingStatus === 'saving' ? 'Syncing...' : savingStatus === 'saved' ? 'Saved to Sanctuary' : 'Draft'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors"><FileDown className="w-4 h-4" /></button>
            <button className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"><Trash className="w-4 h-4" /></button>
            <button 
              onClick={handleSave}
              className="ml-2 px-6 py-2 bg-[#93C572] hover:bg-[#82b461] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#93C572]/20 transition-all"
            >
              {selected ? "Save Changes" : "Create Entry"}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto px-12 py-10 space-y-6">
          <input 
            type="text" placeholder="Entry Title..." 
            value={title} onChange={e => setTitle(e.target.value)}
            className="w-full text-3xl font-bold text-slate-800 placeholder:text-slate-200 border-none focus:ring-0 p-0"
          />

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-6 py-4 border-y border-slate-50">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-[#93C572]" />
              <select 
                value={category} onChange={e => setCategory(e.target.value as any)}
                className="text-[11px] font-bold text-slate-500 uppercase tracking-tight bg-transparent border-none p-0 focus:ring-0"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button 
              onClick={() => setIsPrivate(!isPrivate)}
              className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase hover:text-[#93C572] transition-colors"
            >
              {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {isPrivate ? "Private Entry" : "Public Entry"}
            </button>
            <div className="text-[11px] font-bold text-slate-300 uppercase ml-auto">
              {content.split(/\s+/).filter(Boolean).length} Words
            </div>
          </div>

          <textarea 
            placeholder="Close your eyes, take a deep breath, and begin writing..."
            value={content} onChange={e => setContent(e.target.value)}
            className="w-full flex-1 min-h-[400px] text-lg text-slate-600 leading-relaxed placeholder:text-slate-200 border-none focus:ring-0 p-0 resize-none"
          />
        </div>

        {/* Footer info */}
        <div className="px-12 py-4 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Eye className="w-3 h-3 text-[#93C572]" />
              Markdown formatting active
           </div>
           <div className="text-[10px] font-medium text-slate-400 italic">
             Last synced: {selected ? new Date(selected.updatedAt || selected.createdAt).toLocaleTimeString() : 'Never'}
           </div>
        </div>
      </div>
    </div>
  );
}