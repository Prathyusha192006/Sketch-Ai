import React from 'react';
import { 
  Sparkles, 
  Layers, 
  BarChart3, 
  Activity, 
  History, 
  BookOpen, 
  Wrench, 
  Award,
  Zap
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, mode, setMode, telemetry }) {
  const navItems = [
    { id: 'canvas', label: 'Drawing Studio', icon: Layers },
    { id: 'learning', label: 'Learning Center', icon: Award },
    { id: 'evaluation', label: 'Model Evaluation', icon: BarChart3 },
    { id: 'telemetry', label: 'Performance', icon: Activity },
    { id: 'history', label: 'History', icon: History },
    { id: 'custom', label: 'Custom Training', icon: Wrench },
    { id: 'docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('canvas')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-bold text-xl tracking-tight text-white">
                  Sketch<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Client-Side DL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                TensorFlow.js • In-Browser Neural Inference
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Telemetry Pill & Mode Badge */}
          <div className="flex items-center space-x-3">
            {/* Live latency indicator */}
            {telemetry && (
              <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <Zap className="w-3.5 h-3.5 animate-pulse" />
                <span>{telemetry.lastLatencyMs ? `${telemetry.lastLatencyMs}ms` : 'Ready'}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 uppercase">{telemetry.backend || 'WebGL'}</span>
              </div>
            )}

            {/* Quick Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setMode('digit')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'digit'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Digits 0-9
              </button>
              <button
                onClick={() => setMode('doodle')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'doodle'
                    ? 'bg-pink-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                QuickDraw
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Horizontal Sub-menu */}
        <div className="flex md:hidden overflow-x-auto py-2.5 space-x-1.5 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
