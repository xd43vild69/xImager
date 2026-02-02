
import React from 'react';
import { View } from '../types';
import PromptInput from './PromptInput';

interface HeaderProps {
  selectedWorkflow: string;
  onWorkflowChange: (workflow: string) => void;
  currentView: View;
  availableWorkflows: string[];
  prompt: string;
  setPrompt: (prompt: string) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedWorkflow, onWorkflowChange, currentView, availableWorkflows, prompt, setPrompt }) => {
  const promptInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + Shift + 1 (Meta + Shift + 1)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '1') {
        e.preventDefault();
        promptInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 border-b border-border-dark bg-background-light dark:bg-background-dark px-6 flex items-center justify-between z-10 gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-sm">folder_open</span>
          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap hidden sm:inline">Workflow:</span>
        </div>

        <div className="h-4 w-px bg-border-dark hidden sm:block"></div>

        <div className="w-64 max-w-sm flex-shrink-0">
          <label className="relative block">
            <select
              value={selectedWorkflow}
              onChange={(e) => onWorkflowChange(e.target.value)}
              className="appearance-none w-full bg-slate-100 dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer transition-all hover:border-slate-300 dark:hover:border-slate-600 truncate pr-8"
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

        {/* Prompt Input in Header */}
        <div className="flex-1 h-10"> {/* Fixed height for textarea align */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onEnter={() => {
              // Trigger execution? Header doesn't have runProcess.
              // We can leave onEnter empty or trigger a global event?
              // The Execute button is in the Footer.
              // Cmd+Enter is handled by ExecutionView globally.
            }}
            // We need to pass the Ref for the focus shortcut
            ref={promptInputRef}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
