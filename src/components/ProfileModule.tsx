import React, { useState } from "react";
import { User, Shield, Key, Sliders, Bell, Sparkles, Trash, Check, UserPlus } from "lucide-react";
import { UserSession, UserPreferences } from "../types";

interface ProfileModuleProps {
  user: UserSession;
  token: string;
  onProfileUpdated: (updatedUser: any) => void;
  onLogout: () => void;
}

export default function ProfileModule({ user, token, onProfileUpdated, onLogout }: ProfileModuleProps) {
  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age ? String(user.age) : "");
  const [gender, setGender] = useState(user?.gender || "");
  const [goals, setGoals] = useState<string[]>(user?.goals || []);
  const [theme, setTheme] = useState<"light" | "dark">(user?.preferences?.theme || "light");
  const [volume, setVolume] = useState(user?.preferences?.soundVolume || 50);
  const [dailyGoal, setDailyGoal] = useState(user?.preferences?.dailyGoalMinutes || 15);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const goalOptions = [
    "Reduce Stress",
    "Calm Daily Anxiety",
    "Navigate Relationship Dynamics",
    "Build Self Confidence",
    "Find Career Motivation",
    "Sleep Deeper"
  ];

  const handleGoalToggle = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDone(false);
    setError(null);

    const updatedPreferences: UserPreferences = {
      theme,
      soundVolume: volume,
      dailyGoalMinutes: dailyGoal,
      activitiesSelected: user?.preferences?.activitiesSelected || []
    };

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          age: age ? parseInt(age) : undefined,
          gender,
          preferences: updatedPreferences,
          goals
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Establish credentials error");
      }
      onProfileUpdated(data);
      setDone(true);
      
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      setTimeout(() => setDone(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update security metadata profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        onLogout();
      }
    } catch {
      setError("Failed to process account deletion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="profile_manager_container" className="max-w-4xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <div className="space-y-1">
          <h3 className="font-display font-medium text-lg">Sanctuary Configuration</h3>
          <p className="text-xxs text-gray-400 font-mono uppercase tracking-wider">Configure your profile keys</p>
        </div>
        <button
          id="profile_logout_btn"
          onClick={onLogout}
          className="px-4 py-2 border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
        >
          Sign Out Sanctuary
        </button>
      </div>

      {done && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-light">
          <Check className="w-4 h-4 animate-bounce" />
          <span>Profile configuration keys synchronized with secure storage database.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-655 font-light">
          {error}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: Demographic settings */}
        <div className="md:col-span-7 bg-white dark:bg-[#1A1D1B] p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2 text-[#93C572]">
            <Sliders className="w-5 h-5" />
            <h4 className="font-display text-sm font-semibold">User Credentials</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xxs font-mono uppercase tracking-widest text-gray-400">Name Identity</label>
              <input
                id="conf_name_input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F8F8F7] dark:bg-[#121413] border border-black/5 px-4 py-3 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xxs font-mono uppercase tracking-widest text-gray-400">Age Range</label>
                <input
                  id="conf_age_input"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-[#F8F8F7] dark:bg-[#121413] border border-black/5 px-4 py-3 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xxs font-mono uppercase tracking-widest text-gray-400">Gender</label>
                <input
                  id="conf_gender_input"
                  type="text"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#F8F8F7] dark:bg-[#121413] border border-black/5 px-4 py-3 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-3 pt-3 border-t border-black/5">
              <span className="text-xxs font-mono uppercase tracking-widest text-gray-400 block">Active Wellness Goals</span>
              <div className="grid grid-cols-2 gap-2">
                {goalOptions.map((goal, idx) => (
                  <button
                    key={idx}
                    type="button"
                    id={`conf_goal_btn_${idx}`}
                    onClick={() => handleGoalToggle(goal)}
                    className={`text-left text-xxs px-3 py-2.5 rounded-xl border transition-all ${
                      goals.includes(goal)
                        ? "bg-[#93C572]/10 text-[#93C572] dark:text-[#A8D48C] border-[#93C572]"
                        : "bg-transparent text-gray-400 border-black/5"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Theme preference details */}
        <div className="md:col-span-5 space-y-8">
          
          {/* Aesthetic controls */}
          <div className="bg-white dark:bg-[#1A1D1B] p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-[#93C572]">
              <Bell className="w-5 h-5" />
              <h4 className="font-display text-sm font-semibold">User Preferences</h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xxs font-mono uppercase tracking-widest text-gray-400 block">Workspace Palette Theme</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="theme_light_btn"
                    onClick={() => setTheme("light")}
                    className={`text-xs py-2 rounded-xl transition-all border ${
                      theme === "light" ? "bg-[#93C572] text-white border-[#93C572]" : "bg-black/5 border-transparent text-gray-400"
                    }`}
                  >
                    Luxury Light
                  </button>
                  <button
                    type="button"
                    id="theme_dark_btn"
                    onClick={() => setTheme("dark")}
                    className={`text-xs py-2 rounded-xl transition-all border ${
                      theme === "dark" ? "bg-[#93C572] text-white border-[#93C572]" : "bg-black/5 border-transparent text-gray-400"
                    }`}
                  >
                    Nordic Dark
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xxs font-mono text-gray-400 uppercase tracking-widest">
                  <span>Sound volume</span>
                  <span>{volume}%</span>
                </div>
                <input
                  id="conf_volume_range"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full accent-[#93C572]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xxs font-mono text-gray-400 uppercase tracking-widest">
                  <span>Daily objective minutes</span>
                  <span>{dailyGoal} mins</span>
                </div>
                <input
                  id="conf_goal_range"
                  type="range"
                  min="5"
                  max="60"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                  className="w-full accent-[#93C572]"
                />
              </div>
            </div>

            <button
              id="profile_save_changes_btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#93C572] hover:bg-[#82B362] text-white text-xs font-semibold rounded-2xl transition-colors shadow-md"
            >
              Sync Configuration Preferences
            </button>
          </div>

          {/* Delete Danger Zone card */}
          <div className="bg-red-500/5 rounded-3xl border border-red-500/10 p-6 space-y-4">
            <span className="text-xxs font-mono uppercase tracking-widest text-red-500 font-bold block">Security Danger Zone</span>
            <p className="text-xxs text-gray-400 leading-relaxed font-light">
              Permanently delete all registered items including diaries logs, sentiment trackers and wellness analytics metrics. This action is irreversible.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                id="delete_acc_trigger_btn"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xxs text-red-500 hover:underline font-semibold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-2">
                <span className="text-xxs text-red-700 block font-semibold animate-pulse">Are you absolutely sure as to this purge?</span>
                <div className="flex gap-2">
                  <button
                    id="delete_acc_cancel"
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-xxs bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    id="delete_acc_confirm"
                    type="button"
                    onClick={handleDeleteAccount}
                    className="text-xxs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}