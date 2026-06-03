import React, { useState, useEffect } from "react";
import { 
  Users, ShieldAlert, Activity, Cpu, 
  CheckCircle, RefreshCw, Server, 
  AlertTriangle, Search, ChevronRight
} from "lucide-react";
import { CrisisLog } from "../types";

interface AdminModuleProps {
  token: string;
}

export default function AdminModule({ token }: AdminModuleProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  const fetchMetrics = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/metrics", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Administrative credentials required.");
      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load system analytics.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#93C572]/20 border-t-[#93C572] rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-400">Loading Clinical Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-8 bg-white border border-slate-100 rounded-2xl text-center shadow-sm">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Access Denied</h3>
        <p className="text-slate-500 text-sm mt-2 mb-6">Administrative clearance is required to view this module.</p>
        <div className="text-[10px] uppercase font-bold text-slate-300 border-t pt-4 tracking-widest">Auth: admin@nirvana.com</div>
      </div>
    );
  }

  const crisisIncidents = metrics?.crisisLogs || [];
  const systemHealth = metrics?.systemHealth || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header: Clean & Minimal */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">System Overview</h1>
          <p className="text-sm text-slate-500">Clinical node status and client metrics</p>
        </div>
        <button 
          onClick={fetchMetrics}
          disabled={isRefreshing}
          className="p-2.5 bg-slate-50 text-slate-500 hover:text-[#93C572] rounded-full transition-colors border border-slate-100 shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Simplified KPIs */}
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
        
        {/* Simplified Crisis Monitor */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Active Crisis Logs
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Live Update</span>
          </div>

          <div className="p-2 overflow-y-auto max-h-[360px] divide-y divide-slate-50">
            {crisisIncidents.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-sm italic">All parameters normal.</div>
            ) : (
              crisisIncidents.map((log: CrisisLog, i: number) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors group flex gap-4">
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

        {/* Simplified Health Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#93C572]" />
              System Vitality
            </h3>
            <div className="space-y-4">
              {[
                { label: "Database", status: systemHealth.databaseStatus, icon: CheckCircle },
                { label: "Storage Path", status: ".data/db.json", icon: Server },
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
          
          <div className="mt-8 p-4 bg-[#93C572]/5 rounded-xl border border-[#93C572]/10">
            <p className="text-[11px] text-[#7AA55C] leading-relaxed">
              <strong>Clinical Protocol:</strong> Flagged logs require manual verification within 15 minutes of system detection.
            </p>
          </div>
        </div>
      </div>

      {/* User Table: Cleanest Version */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">Client Directory</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter names..." 
              className="pl-9 pr-4 py-1.5 bg-slate-50 border-none rounded-lg text-xs focus:ring-1 focus:ring-[#93C572] w-48"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-6 py-3">Identity</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Engagement</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {metrics?.allUsers?.map((user: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors group text-sm">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">{user.name}</div>
                    <div className="text-[10px] text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                      ${user.role === 'admin' ? 'text-red-500 bg-red-50' : 
                        user.role === 'therapist' ? 'text-blue-500 bg-blue-50' : 'text-slate-500 bg-slate-100'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#93C572]" />
                      {user.streak} Days
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(user.joined).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#93C572] transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}