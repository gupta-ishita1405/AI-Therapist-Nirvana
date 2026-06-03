import React from 'react';
import { Moon, Sun, Heart } from 'lucide-react';

interface NavbarProps {
  isDark: boolean;
  onToggleDarkMode: () => void;
  onLogoClick?: () => void;
}

export function Navbar({ isDark, onToggleDarkMode, onLogoClick }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-[60] border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-[#121413]/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo Branding */}
        <div
          onClick={onLogoClick}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 bg-[#93C572] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#93C572]/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-white text-xl tracking-tight leading-none">
              Nirvana
            </span>
            <span className="text-[9px] font-bold text-[#7AA55C] uppercase tracking-[0.3em] mt-1">
              AI Sanctuary
            </span>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          
          {/* Status Badge (Professional touch for projects) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#93C572] animate-pulse" />
          </div>

          <div className="h-6 w-[1px] bg-slate-100 dark:bg-white/5 hidden sm:block" />

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#93C572]/50 hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-500 dark:text-slate-400 group"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            ) : (
              <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-500" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}