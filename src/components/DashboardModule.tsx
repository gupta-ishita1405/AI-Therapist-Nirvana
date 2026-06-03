import React, { useState, useEffect } from "react";
import { 
  Users, ShieldAlert, Activity, Cpu, 
  CheckCircle, RefreshCw, Server, 
  AlertTriangle, Search, ChevronRight, Smile, PenTool, Wind
} from "lucide-react";
import { UserSession, MoodRecord, JournalEntry, CrisisLog } from "../types";

interface DashboardModuleProps {
  user: UserSession | null;
  moods: MoodRecord[];
  journals: JournalEntry[];
  token: string;
  onNavigate?: (tab: string) => void;
  advice: string;
  crisisStatus: boolean;
}

export default function DashboardModule({ 
  user, 
  moods, 
  journals, 
  token, 
  onNavigate, 
  advice, 
  crisisStatus 
}: DashboardModuleProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin && token) {
      fetchMetrics();
    } else {
      setLoading(false);
    }
  }, [token, isAdmin]);

  const fetchMetrics = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/metrics", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err: any) {
      console.warn("Failed to load admin metrics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#93C572]/20 border-t-[#93C572] rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  const crisisIncidents = metrics?.crisisLogs || [];
  const systemHealth = metrics?.systemHealth || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {isAdmin ? "System Overview" : "Welcome Back"}
          </h1>
          <p className="text-sm text-slate-500">
            {isAdmin 
              ? "Clinical node status and client metrics" 
              : `Keep going, ${user?.name || "Friend"}. You are doing great.`}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={fetchMetrics}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-50 text-slate-500 hover:text-[#93C572] rounded-full transition-colors border border-slate-100 shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Admin: System Metrics */}
      {isAdmin && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Clients", val: metrics?.totalUsers, icon: Users },
              { label: "Active Threads", val: metrics?.totalsessions, icon: Activity },
              { label: "Crisis Alerts", val: metrics?.crisisReportsCount, icon: AlertTriangle, critical: metrics?.crisisReportsCount > 0 },
              { label: "Node Latency", val: `${systemHealth.latencyMs}ms`, icon: Server }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.critical ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-[#93C572]'}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-800">{stat.val}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Crisis Monitor */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  Active Crisis Logs
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live</span>
              </div>
              <div className="p-2 overflow-y-auto max-h-75 divide-y divide-slate-50">
                {crisisIncidents.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm italic">All parameters normal.</div>
                ) : (
                  crisisIncidents.map((log: CrisisLog, i: number) => (
                    <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex gap-4">
                      <div className={`w-1 shrink-0 rounded-full ${log.severity === 'high' ? 'bg-red-500' : 'bg-orange-400'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-slate-700">{log.userName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{new Date(log.incidentTime).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-slate-500 italic line-clamp-2">"{log.content}"</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#93C572]" />
                System Status
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Database", status: systemHealth.databaseStatus, icon: CheckCircle },
                  { label: "Storage", status: ".data/db.json", icon: Server },
                  { label: "Service Load", status: systemHealth.serviceLoad, icon: Activity }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Client Directory</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-3">Identity</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Engagement</th>
                    <th className="px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics?.allUsers?.map((u: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors text-sm">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                          ${u.role === 'admin' ? 'text-red-500 bg-red-50' : 
                            u.role === 'therapist' ? 'text-blue-500 bg-blue-50' : 'text-slate-500 bg-slate-100'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#93C572]" />
                          {u.streak} Days
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(u.joined).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* User: Personal Dashboard */}
      {!isAdmin && (
        <>
          {/* Personal Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-slate-50 text-[#93C572]">
                  <Smile className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Moods Logged</span>
              </div>
              <div className="text-3xl font-bold text-slate-800">{moods?.length || 0}</div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-slate-50 text-[#93C572]">
                  <PenTool className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Journals</span>
              </div>
              <div className="text-3xl font-bold text-slate-800">{journals?.length || 0}</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${crisisStatus ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-[#93C572]'}`}>
                  <Wind className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {crisisStatus ? '🔴 In Support' : '🟢 Wellness'}
              </div>
            </div>
          </div>

          {/* AI Advisor */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              ✨ Daily Insight
            </h3>
            <p className="text-slate-700 leading-relaxed italic">"{advice}"</p>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Moods */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 text-sm">Recent Moods</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-75 overflow-y-auto">
                {moods?.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No moods logged yet</div>
                ) : (
                  moods.slice(0, 5).map((mood, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-700 text-sm">{mood.emoji} (Score: {mood.score})</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(mood.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {mood.notes && (
                        <p className="text-xs text-slate-500 line-clamp-2">{mood.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Journals */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 text-sm">Recent Journals</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-75 overflow-y-auto">
                {journals?.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No journals yet</div>
                ) : (
                  journals.slice(0, 5).map((journal, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-700 text-sm line-clamp-1">
                          {journal.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(journal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{journal.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}