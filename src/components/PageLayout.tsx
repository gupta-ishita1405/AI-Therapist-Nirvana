import React from 'react';
import { Navbar } from './Navbar';

interface PageLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onToggleDarkMode: () => void;
  onLogoClick?: () => void;
}

export function PageLayout({ children, isDark, onToggleDarkMode, onLogoClick }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar isDark={isDark} onToggleDarkMode={onToggleDarkMode} onLogoClick={onLogoClick} />
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
