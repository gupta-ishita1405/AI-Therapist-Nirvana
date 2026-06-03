import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AuthModule from "./components/AuthModule";
import { Navbar } from "./components/Navbar";
import DashboardModule from "./components/DashboardModule";
import TherapistModule from "./components/TherapistModule";
import MoodModule from "./components/MoodModule";
import JournalModule from "./components/JournalModule";
import WellnessModule from "./components/WellnessModule";
import ProfileModule from "./components/ProfileModule";

import { UserSession, MoodRecord, JournalEntry } from "./types";
import { 
  LayoutDashboard, MessageSquare, PenTool, 
  Smile, Wind, Settings, LogOut, ShieldAlert,
  Fingerprint, Sparkles, Compass, Play, Pause, RotateCcw,
  Volume2, VolumeX, Save, ShieldCheck, Activity, Trash2, ChevronRight
} from "lucide-react";


export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("landing");
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("nirvana_theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  const [moods, setMoods] = useState<MoodRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [advice, setAdvice] = useState("Establishing initial baseline... Take a slow, mindful breath.");
  const [crisisAlert, setCrisisAlert] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("nirvana_token");
    const savedUser = localStorage.getItem("nirvana_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setCurrentTab("dashboard");
    }

    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("nirvana_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("nirvana_theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (token) syncUserData();
  }, [token]);

  const syncUserData = async () => {
    if (!token) return;
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      
      const [resMood, resJour, resAdvice] = await Promise.all([
        fetch("/api/moods", { headers }),
        fetch("/api/journals", { headers }),
        fetch("/api/chat/advisor", { headers })
      ]);

      const moodsData = await resMood.json();
      const journalsData = await resJour.json();
      const adviceData = await resAdvice.json();

      if (Array.isArray(moodsData)) setMoods(moodsData);
      if (Array.isArray(journalsData)) setJournals(journalsData);
      if (adviceData?.advice) setAdvice(adviceData.advice);
    } catch (e) {
      console.warn("Telemetry synchronization interrupted.");
    }
  };

  const handleAuthSuccess = (newToken: string, newUser: UserSession) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("nirvana_token", newToken);
    localStorage.setItem("nirvana_user", JSON.stringify(newUser));
    setAuthMode(null);
    setCurrentTab("dashboard");
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("nirvana_token");
    localStorage.removeItem("nirvana_user");
    setCurrentTab("landing");
  };

  const handleActivityLogged = async (activityId: string, pointsSecured: number) => {
    if (!token) return;
    try {
      const res = await fetch("/api/activities/log", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ activityId, score: pointsSecured })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem("nirvana_user", JSON.stringify(data.user));
        syncUserData();
      }
    } catch {
      console.warn("Points cached locally.");
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "Clinical Chat", icon: MessageSquare },
    { id: "mood", label: "Mood Logs", icon: Smile },
    { id: "journal", label: "Reflections", icon: PenTool },
    { id: "games", label: "Wellness", icon: Wind },
    { id: "settings", label: "Profile", icon: Settings },
  ];

  return (
    <div id="sanctuary_root" className="min-h-screen bg-[#FDFDFB] dark:bg-[#121413] text-slate-900 dark:text-slate-50 transition-colors duration-500 font-sans">
      
      {!token ? (
        <>
          {authMode ? (
            <AuthModule 
              onAuthSuccess={handleAuthSuccess}
              onCancel={() => setAuthMode(null)}
              initialMode={authMode}
            />
          ) : (
            <LandingPage 
              onGetStarted={() => setAuthMode("signup")} 
              onLoginClick={() => setAuthMode("login")}
              isDark={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}
        </>
      ) : (
        <>
          <Navbar 
            isDark={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onLogoClick={() => setCurrentTab("dashboard")}
          />

          {/* Clinical Navigation Bar */}
          <div className="sticky top-[73px] z-[50] bg-white/80 dark:bg-[#121413]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                      ${currentTab === tab.id 
                        ? "bg-[#93C572] text-white shadow-lg shadow-[#93C572]/20" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Terminate Session</span>
              </button>
            </div>
          </div>

          {/* Main Workspace */}
          <main className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-700">
            {currentTab === "dashboard" && (
              <DashboardModule 
                user={user} 
                moods={moods} 
                journals={journals}
                token={token}
                onNavigate={setCurrentTab} 
                advice={advice} 
                crisisStatus={crisisAlert} 
              />
            )}
            {currentTab === "chat" && (
              <TherapistModule token={token} onCrisisAlert={setCrisisAlert} />
            )}
            {currentTab === "mood" && (
              <MoodModule token={token} onMoodAdded={syncUserData} />
            )}
            {currentTab === "journal" && (
              <JournalModule token={token} />
            )}
            {currentTab === "games" && (
              <WellnessModule token={token} onActivityLogged={handleActivityLogged} />
            )}
            {currentTab === "settings" && user && (
              <ProfileModule 
                user={user} token={token} onLogout={handleLogout}
                onProfileUpdated={(updated) => { setUser(updated); localStorage.setItem("nirvana_user", JSON.stringify(updated)); }} 
              />
            )}
          </main>
        </>
      )}

      {/* Modern Professional Footer */}
      <footer className="mt-20 border-t border-slate-100 dark:border-white/5 py-12 px-6 bg-white dark:bg-[#1A1D1B]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldAlert className="w-5 h-5 text-[#93C572]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Clinical Compliance</span>
            </div>
            <p className="max-w-xs text-[10px] text-slate-400 leading-relaxed text-center md:text-left font-medium italic">
              Nirvana is a wellness simulation. If you are in immediate danger, please contact local emergency services or call <strong>112</strong> / <strong>988</strong> immediately.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Fingerprint className="w-3 h-3" /> Data Encrypted</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> AI Validated</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-2">
              © 2026 Nirvana 
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}