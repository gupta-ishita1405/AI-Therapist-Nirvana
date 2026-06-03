import React from "react";
import { 
  Sparkles, CheckCircle, Heart, Brain, 
  Shield, Users, ArrowRight, Star, 
  ShieldCheck, Activity, MessageCircle, 
  Lock, Zap, Globe 
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLoginClick }) => {
  return (
    <div className="min-h-screen bg-[#FDFDFB] text-slate-900 selection:bg-[#93C572]/30">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#93C572] rounded-xl flex items-center justify-center shadow-lg shadow-[#93C572]/20">
            <Heart className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Nirvana</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <a href="#features" className="hover:text-[#93C572] transition-colors">Modality</a>
          <a href="#privacy" className="hover:text-[#93C572] transition-colors">Privacy</a>
          <a href="#clinical" className="hover:text-[#93C572] transition-colors">Clinical Standards</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLoginClick} className="text-sm font-bold text-slate-600 hover:text-slate-900 px-4">Sign In</button>
          <button onClick={onGetStarted} className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-6 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-[#93C572]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-[100px]" />

        <div className="max-w-6xl mx-auto text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#93C572]/10 rounded-full border border-[#93C572]/20 text-[#7AA55C] text-[10px] font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5" />
            Empathetic AI • Clinical Precision
          </div>
          
          <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Find your center in a <br className="hidden md:block" /> 
            <span className="text-[#93C572] italic font-serif">digital sanctuary.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Nirvana bridges the gap between AI-driven accessibility and clinical mental health standards. Your 24/7 companion for emotional resilience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-3 bg-[#93C572] text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-[#82b461] transition-all shadow-xl shadow-[#93C572]/20 hover:-translate-y-1 active:translate-y-0"
            >
              Start Free Session
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                </div>
              ))}
              <div className="pl-6 text-sm text-slate-400 font-semibold flex items-center gap-1">
                <Star className="w-4 h-4 text-orange-400 fill-current" /> 4.9/5 Trust Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Clinical Standards Bar */}
      <section className="bg-white border-y border-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] text-center mb-8">Guided by Global Modalities</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            {['Cognitive Behavioral', 'Mindfulness Based', 'Dialectical Theory', 'Positive Psychology'].map(t => (
              <span key={t} className="text-sm font-bold text-slate-400 tracking-tighter uppercase">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features: Modern Bento Grid */}
      <section id="features" className="py-24 px-6 bg-[#FDFDFB]">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-semibold text-slate-900 tracking-tight">Ecosystem of Care</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">
              We provide a multi-layered approach to wellness, combining conversation, analytics, and active exercises.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-6 auto-rows-[240px]">
            {/* Feature 1: Large AI Card */}
            <div className="md:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#93C572]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 bg-[#93C572]/10 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#93C572]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Advanced Clinical AI</h3>
                <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                  Real-time conversational therapy trained on validated psychological frameworks with proactive crisis detection.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-[#93C572] relative z-10">
                <span>Adaptive Learning</span> • <span>24/7 Availability</span>
              </div>
            </div>

            {/* Feature 2: Small Mood Card */}
            <div className="md:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#93C572]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Biometric Insights</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Map your emotional landscape through high-fidelity mood tracking and trend analytics.
                </p>
              </div>
            </div>

            {/* Feature 3: Small Privacy Card */}
            <div className="md:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-800">Data Sovereignty</h4>
                <p className="text-xs text-slate-500">
                  HIPAA-compliant, end-to-end encrypted storage. Your mind stays your business.
                </p>
              </div>
            </div>

            {/* Feature 4: Large Journal Card */}
            <div className="md:col-span-8 bg-[#93C572]/5 p-10 rounded-[2.5rem] border border-[#93C572]/10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-2xl font-bold text-slate-800">Intelligent Journaling</h3>
                <p className="text-slate-500 font-medium">
                  Structured reflection logs that help identify cognitive distortions and celebrate small wins.
                </p>
                <ul className="grid grid-cols-2 gap-2 pt-4">
                  {['Mood Tags', 'Private Lock', 'Auto-Sync', 'Exportable'].map(tag => (
                    <li key={tag} className="flex items-center gap-2 text-xs font-bold text-[#7AA55C]">
                      <CheckCircle className="w-4 h-4" /> {tag}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-48 h-full bg-white rounded-3xl shadow-lg border border-slate-50 overflow-hidden hidden md:block">
                 <div className="p-4 space-y-2">
                    <div className="w-full h-2 bg-slate-50 rounded" />
                    <div className="w-2/3 h-2 bg-slate-50 rounded" />
                    <div className="w-full h-12 bg-[#93C572]/10 rounded-xl" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof: Testimonial */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-white border border-slate-100 p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
          <div className="text-5xl text-[#93C572]/20 font-serif absolute top-10 left-10">“</div>
          <p className="text-2xl md:text-3xl font-medium text-slate-800 italic leading-relaxed relative z-10 mb-8">
            Nirvana has fundamentally changed how I view my mental health. It’s the first time I felt like I had a therapist in my pocket that actually understood the science of my anxiety.
          </p>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 mb-4 overflow-hidden">
               <img src="https://i.pravatar.cc/150?img=32" alt="Sarah J." />
            </div>
            <div className="font-bold text-slate-900">Sarah Jenkins</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Member</div>
          </div>
        </div>
      </section>

      {/* CTA: Final Invitation */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-slate-900 tracking-tight">The first step to <span className="text-[#93C572] italic font-serif">peace.</span></h2>
            <p className="text-slate-500 font-medium">Join 50,000+ others navigating their mental health with clarity and confidence. No commitment required.</p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <button onClick={onGetStarted} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] text-xl font-bold hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-95">
              Begin Free Trial
            </button>
            <div className="flex items-center gap-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Secured Session</span>
              <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> HIPAA Compliant</span>
              <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Instant Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-50 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="text-slate-400 text-xs font-medium">
             © 2024 Nirvana AI Therapeutics. All clinical protocols verified.
           </div>
           <div className="flex gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <a href="#" className="hover:text-[#93C572] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#93C572] transition-colors">Terms of Care</a>
              <a href="#" className="hover:text-[#93C572] transition-colors">Crisis Resources</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;