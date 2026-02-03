
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const navItems = [
    { id: View.EXECUTION, label: 'Execution', icon: 'dashboard' },
    { id: View.IMAGE_SETTINGS, label: 'Image Settings', icon: 'aspect_ratio' },
    { id: View.I2I_SETTINGS, label: 'Workflow Settings', icon: 'tune' },
    { id: View.KEYWORDS, label: 'Keywords', icon: 'translate' },
    { id: View.KEYWORDS_AC, label: 'Autocompleter', icon: 'dictionary' },
    { id: View.SETTINGS, label: 'API Settings', icon: 'api' },
  ];

  return (
    <aside
      className={`
        relative flex-shrink-0 border-r border-border-dark bg-background-light dark:bg-background-dark 
        flex flex-col justify-between py-6 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-background-light dark:bg-neutral-800 border border-border-dark rounded-full p-1 text-neutral-500 hover:text-primary transition-colors shadow-sm z-50"
      >
        <span className="material-symbols-outlined text-[16px]">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      <div className={`flex flex-col gap-8 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
          <div className="size-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">hub</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap">
              <h1 className="text-base font-bold leading-none tracking-tight">xOrchestrator</h1>
              <p className="text-neutral-500 text-xs font-medium">Engine v0.1</p>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer group
                ${isCollapsed ? 'justify-center' : ''}
                ${currentView === item.id
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }
              `}
            >
              <span className={`material-symbols-outlined ${currentView === item.id ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <p className={`text-sm whitespace-nowrap ${currentView === item.id ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </p>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className={`${isCollapsed ? 'px-2' : 'px-4'}`}>
        {!isCollapsed ? (
          <div className="bg-neutral-100 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-4 flex flex-col gap-3 border border-neutral-200 dark:border-white/5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">GPU Status</p>
              <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium">
                <span>RTX 4070Ti</span>
                <span className="text-neutral-400">12GB VRAM</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[12%] transition-all duration-1000"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="GPU Status: Active">
            <div className="relative">
              <span className="material-symbols-outlined text-green-500">memory</span>
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
