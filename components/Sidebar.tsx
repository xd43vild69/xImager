
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: View.EXECUTION, label: 'Execution', icon: 'dashboard' },
    { id: View.HISTORY, label: 'History', icon: 'history' },
    { id: View.MODELS, label: 'Nodes & Models', icon: 'settings_input_component' },
    { id: View.SETTINGS, label: 'API Settings', icon: 'api' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border-dark bg-background-light dark:bg-background-dark flex flex-col justify-between py-6">
      <div className="flex flex-col gap-8 px-4">
        <div className="flex items-center gap-3 px-2">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">hub</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold leading-none tracking-tight">AI Orchestrator</h1>
            <p className="text-slate-500 text-xs font-medium">Desktop Engine v2.4</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer group ${
                currentView === item.id
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`material-symbols-outlined ${currentView === item.id ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <p className={`text-sm ${currentView === item.id ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </p>
            </div>
          ))}
        </nav>
      </div>

      <div className="px-4">
        <div className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 flex flex-col gap-3 border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GPU Status</p>
            <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium">
              <span>RTX 4090</span>
              <span className="text-slate-400">24GB VRAM</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[12%] transition-all duration-1000"></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
