import React from "react";
import { 
  Sparkles, ArrowRight, Wind, MessageSquare, 
  Activity, ShieldCheck, Heart, Lock, Globe, Zap, 
} from "lucide-react";
import { Navbar } from "./Navbar";

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
  isDark: boolean;
  onToggleDarkMode: () => void;
}

export default function LandingPage({ onGetStarted, onLoginClick, isDark, onToggleDarkMode }: LandingPageProps) {
  const benefits = [
    {
      icon: <Wind className="w-5 h-5 text-[#93C572]" />,
      title: "Interactive Decompression",
      description: "Validated mindfulness simulations including Zen pebble work and forest-immersion word catching."
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-[#7AA55C]" />,
      title: "Clinical-Grade AI Chat",
      description: "Real-time conversational support trained in CBT and DBT frameworks with crisis detection."
    },
    {
      icon: <Activity className="w-5 h-5 text-[#93C572]" />,
      title: "Sentiment Tracking",
      description: "High-fidelity mood logging with longitudinal analysis and a secure reflection workspace."
    }
  ];

  return (
    <div id="landing_container" className="min-h-screen bg-[#FDFDFB] dark:bg-[#121413] text-slate-900 dark:text-slate-50 selection:bg-[#93C572]/20">
      <Navbar isDark={isDark} onToggleDarkMode={onToggleDarkMode} />

      {/* Hero Section - Tightened Padding */}
      <section className="relative max-w-7xl mx-auto px-6 py-12 md:py-16 lg:py-20">
        <div className="absolute top-10 right-0 -z-10 w-[400px] h-[400px] bg-[#93C572]/5 rounded-full blur-[100px] animate-pulse" />
        
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            
            <h1 className="text-4xl md:text-6xl font-semibold text-slate-800 dark:text-white tracking-tight leading-tight">
              Find your center in a <br />
              <span className="text-[#93C572] italic font-serif">digital sanctuary.</span>
            </h1>
            
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-medium">
              Nirvana bridges the gap between AI-driven accessibility and mental health standards. A secure, 24/7 companion for cultivating emotional resilience.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                onClick={onGetStarted} 
                className="group px-6 py-3.5 bg-slate-900 dark:bg-[#93C572] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0 text-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onLoginClick} 
                className="px-6 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Open Session
              </button>
            </div>
          </div>

          {/* Visual Element - Adjusted Aspect Ratio */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="relative">
              <div className="w-full aspect-[16/11] bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-slate-100 dark:border-white/5">
                <img 
                  src="https://i.pinimg.com/736x/e1/c6/e0/e1c6e059af516c4b1848f1b389367db6.jpg"
                  alt="Sanctuary" 
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000"
                />
                {/* Floating Indicators */}
                <div className="absolute top-6 left-6 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-lg animate-bounce">
                  <Heart className="w-5 h-5 text-[#93C572] fill-current" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Reduced Vertical Gaps */}
      <section className="py-16 bg-white dark:bg-[#1A1D1B] border-y border-slate-50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800 dark:text-white tracking-tight">An Ecosystem of Wellness</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
              A multi-layered approach to mental hygiene, combining conversational support with active mindfulness modules.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-[#FDFDFB] dark:bg-[#121413] border border-slate-100 dark:border-white/5 hover:border-[#93C572]/30 transition-all group shadow-sm">
                <div className="w-12 h-12 bg-[#93C572]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-tight">{benefit.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{benefit.description}</p>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#93C572]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#93C572]/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Condensed Container */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-slate-900 dark:bg-[#93C572] p-10 md:p-14 text-center space-y-8 relative overflow-hidden shadow-xl">
          <Sparkles className="absolute top-6 left-6 w-16 h-16 text-white/5" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Prioritize Your Emotional Health.
            </h2>
            <p className="text-white/70 max-w-lg mx-auto font-medium text-sm leading-relaxed">
              Step into a secure environment designed for clarity, reflection, and proactive mental care.
            </p>
          </div>
          <button 
            onClick={onGetStarted} 
            className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl text-base hover:shadow-2xl transition-all relative z-10 hover:-translate-y-0.5 active:translate-y-0"
          >
            Start Your Journey
          </button>
        </div>
      </section>

      {/* Footer - Reduced Padding */}
      <footer className="py-12 px-6 border-t border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-end">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#93C572] rounded-lg flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-white fill-current" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white tracking-tight">Nirvana Project</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-sm font-medium">
              Disclaimer: This is a mental wellness project. If you are experiencing a crisis, contact <span className="text-slate-600 dark:text-slate-300 font-bold">112</span> immediately. Protocols are simulation-based.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest md:justify-end">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-[#93C572]" /> Encrypted Data</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-[#93C572]" /> Local Node Host</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#93C572]" /> Active Response</span>
          </div>
        </div>
      </footer>

    </div>
  );
}