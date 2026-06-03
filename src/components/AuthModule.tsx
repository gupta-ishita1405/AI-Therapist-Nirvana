import React, { useState } from "react";
import { 
  ShieldCheck, Mail, Lock, User as UserIcon, 
  Target, ChevronRight, X, Fingerprint, 
  Globe, ShieldAlert, HeartPulse 
} from "lucide-react";

interface AuthModuleProps {
  onAuthSuccess: (token: string, user: any) => void;
  onCancel: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModule({ onAuthSuccess, onCancel, initialMode = "login" }: AuthModuleProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    gender: "",
    goals: [] as string[]
  });

  const goalOptions = ["Stress Reduction", "Anxiety Management", "Sleep Hygiene", "Cognitive Focus", "Relationship Health"];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const apiPath = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication protocol failed.");
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <div className="bg-white rounded-[32px] w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/20 animate-in zoom-in-95 duration-300">
        
        {/* LEFT PANEL: Context & Trust (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-[40%] bg-slate-50 p-12 flex-col justify-between border-r border-slate-100">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#93C572] rounded-xl flex items-center justify-center shadow-lg shadow-[#93C572]/20">
                <HeartPulse className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-slate-800 tracking-tight text-xl font-display">Nirvana Clinical</span>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-slate-900 leading-snug">
                The standard for <br />
                <span className="text-[#93C572]">digital therapeutic care.</span>
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: ShieldCheck, text: "End-to-end clinical encryption" },
                  { icon: Globe, text: "Global healthcare accessibility" },
                  { icon: Fingerprint, text: "Strict identity verification" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <item.icon className="w-4 h-4 text-[#93C572]" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "This platform is designed to supplement professional clinical guidance. All data is processed in compliance with global privacy standards."
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Form Action */}
        <div className="flex-1 p-8 md:p-16 relative bg-white overflow-y-auto max-h-[90vh]">
          <button onClick={onCancel} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors group">
            <X className="w-5 h-5 text-slate-300 group-hover:text-slate-600" />
          </button>

          <div className="max-w-md mx-auto space-y-8">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {mode === "login" ? "Account Access" : "Clinical Enrollment"}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Please enter your credentials to establish a secure link.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-1">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold tracking-tight">{error}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <div className="space-y-5">
                {mode === "signup" && (
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Legal Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#93C572] transition-colors" />
                      <input 
                        type="text" required 
                        className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#93C572]/5 focus:border-[#93C572]/30 transition-all font-medium"
                        placeholder="Idhika Sharma"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Clinical Identifier (Email)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#93C572] transition-colors" />
                    <input 
                      type="email" required
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#93C572]/5 focus:border-[#93C572]/30 transition-all font-medium"
                      placeholder="name@gmail.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 group">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security Key</label>
                    {mode === "login" && <button type="button" className="text-[10px] text-[#93C572] font-bold hover:underline">Recovery?</button>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#93C572] transition-colors" />
                    <input 
                      type="password" required
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#93C572]/5 focus:border-[#93C572]/30 transition-all font-medium"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Mode-Specific Content */}
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Age</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-[#93C572]/30 transition-all"
                      placeholder="21"
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                    <select
  className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-[#93C572]/30 transition-all"
  value={formData.gender}
  onChange={(e) =>
    setFormData({ ...formData, gender: e.target.value })
  }
>
  <option value="">Select Gender</option>
  <option value="Female">Female</option>
  <option value="Male">Male</option>
</select>
                  </div>
                </div>
              )}

              <button 
                type="submit" disabled={loading}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === "login" ? "Verify Credentials" : "Create Clinical Identity"}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-4">
              <p className="text-xs font-semibold text-slate-400">
                {mode === "login" ? "New practitioner or client?" : "Already have clinical access?"}
                <button 
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="ml-2 text-[#93C572] font-bold hover:underline underline-offset-4"
                >
                  {mode === "login" ? "Register Now" : "Sign In"}
                </button>
              </p>
            </div>

            {/* Quick Demo Identities (Styled as non-intrusive cards) */}
            {mode === "login" && (
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center mb-4">Internal Demo Nodes</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Admin", email: "admin@nirvana.com" },
                    { label: "Therapist", email: "therapist@nirvana.com" },
                    { label: "Client", email: "client@nirvana.com" }
                  ].map(demo => (
                    <button
                      key={demo.label}
                      onClick={() => {
                        setFormData({ ...formData, email: demo.email, password: demo.label.toLowerCase() + "123" });
                      }}
                      className="text-[10px] font-bold py-2 px-1 border border-slate-100 rounded-xl text-slate-400 hover:border-[#93C572] hover:text-[#93C572] hover:bg-[#93C572]/5 transition-all"
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}