import React from 'react';
import { 
  Activity, 
  Upload, 
  Database, 
  Award, 
  History, 
  BookOpen, 
  Layers 
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemHealthy?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemHealthy = true }) => {
  const navItems = [
    { id: 'home', label: 'Home Dashboard', icon: Activity },
    { id: 'upload', label: 'Upload & Analysis', icon: Upload },
    { id: 'dataset', label: 'Dataset Explorer', icon: Database },
    { id: 'rubric', label: 'Evaluation Rubric', icon: Award },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'docs', label: 'Docs / About', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  VocalJudge AI
                </span>
                <span className="text-[10px] uppercase font-semibold bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded">
                  Track C
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Temporal Flaw Grounding & Speech Analytics
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System Status Pill */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs">
              <span className={`w-2 h-2 rounded-full ${systemHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-slate-300 font-medium">{systemHealthy ? 'Engine Active' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
