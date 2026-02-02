
import React from 'react';
import { View } from '../types';
import PromptInput from './PromptInput';
import SearchableSelect from './SearchableSelect';

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

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [canOverflow, setCanOverflow] = React.useState(true); // Default open = visible

  const handleToggle = () => {
    if (isCollapsed) {
      // Opening
      setIsCollapsed(false);
      // Wait for transition to allow overflow
      setTimeout(() => setCanOverflow(true), 300);
    } else {
      // Closing
      setCanOverflow(false); // Disable overflow immediately
      setIsCollapsed(true);
    }
  };

  return (
    <header className="border-b border-border-dark bg-background-light dark:bg-background-dark z-50 transition-all duration-300 flex flex-col relative">
      {/* Collapse Toggle Bar */}
      <div className="h-4 flex items-center justify-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group" onClick={handleToggle}>
        <span className="material-symbols-outlined text-[16px] text-neutral-400 group-hover:text-primary transition-colors transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_less
        </span>
      </div>

      <div className={`px-6 transition-all duration-300 ${canOverflow ? 'overflow-visible' : 'overflow-hidden'} ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 py-3'}`}>
        <div className="flex items-start gap-4 flex-1">
          <div className="flex items-center gap-2 text-neutral-400 mt-2">
            <span className="material-symbols-outlined text-sm">folder_open</span>
            <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap hidden sm:inline">Workflow:</span>
          </div>

          <div className="h-8 w-px bg-border-dark hidden sm:block mt-1"></div>

          <div className="w-64 max-w-sm flex-shrink-0 relative mt-0.5">
            <SearchableSelect
              options={availableWorkflows.map(workflow => ({
                value: workflow,
                label: workflow.replace('.json', '').replace(/_/g, ' ')
              }))}
              value={selectedWorkflow}
              onChange={onWorkflowChange}
              className="w-full bg-neutral-100 dark:bg-panel-dark border border-neutral-200 dark:border-border-dark rounded-lg px-4 py-1.5 text-xs font-bold focus-within:ring-2 focus-within:ring-primary transition-all hover:border-neutral-300 dark:hover:border-neutral-600 h-[34px]"
            />
          </div>

          {/* Prompt Input in Header */}
          <div className="flex-1">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              onEnter={() => {
                // Trigger execution? Header doesn't have runProcess.
              }}
              ref={promptInputRef}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
