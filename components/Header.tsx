
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  selectedWorkflow: string;
  onWorkflowChange: (workflow: string) => void;
  currentView: View;
  availableWorkflows: string[];
}

const Header: React.FC<HeaderProps> = ({ selectedWorkflow, onWorkflowChange, currentView, availableWorkflows }) => {
  return (
    <header className="h-16 border-b border-border-dark bg-background-light dark:bg-background-dark px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-sm">folder_open</span>
          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Project: Default</span>
        </div>

        <div className="h-4 w-px bg-border-dark hidden sm:block"></div>

        <div className="w-full max-w-sm">
          <label className="relative block">
            <select
              value={selectedWorkflow}
              onChange={(e) => onWorkflowChange(e.target.value)}
              className="appearance-none w-full bg-slate-100 dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              {availableWorkflows.length > 0 ? (
                availableWorkflows.map((workflow) => (
                  <option key={workflow} value={workflow}>
                    {workflow.replace('.json', '').replace(/_/g, ' ')}
                  </option>
                ))
              ) : (
                <option disabled>No workflows available</option>
              )}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">
              unfold_more
            </span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-panel-dark border border-slate-200 dark:border-border-dark text-[11px] font-black uppercase tracking-tighter hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined text-base">save</span>
          Save JSON
        </button>
        <button className="p-2 rounded-lg bg-slate-100 dark:bg-panel-dark border border-slate-200 dark:border-border-dark text-slate-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-lg">share</span>
        </button>
        <button className="p-2 rounded-lg bg-slate-100 dark:bg-panel-dark border border-slate-200 dark:border-border-dark text-slate-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-lg">help</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
