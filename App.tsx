
import React, { useState, useEffect } from 'react';
import { View } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ExecutionView from './components/ExecutionView';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import ModelsView from './components/ModelsView';
import KeywordsView from './components/KeywordsView';
import * as ComfyUI from './services/comfyui';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.EXECUTION);
  const [availableWorkflows, setAvailableWorkflows] = useState<string[]>([]);
  // Initialize from localStorage or default
  const [selectedWorkflow, setSelectedWorkflow] = useState(() => {
    return localStorage.getItem('selectedWorkflow') || 'SDXL_Image_Enhancer_v4.json';
  });

  // Save selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedWorkflow) {
      localStorage.setItem('selectedWorkflow', selectedWorkflow);
    }
  }, [selectedWorkflow]);

  // Load available workflows on mount
  useEffect(() => {
    const loadWorkflows = async () => {
      const workflows = await ComfyUI.getAvailableWorkflows();
      setAvailableWorkflows(workflows);

      // Validate current selection against available workflows
      if (workflows.length > 0 && !workflows.includes(selectedWorkflow)) {
        // If stored/current workflow is invalid, fallback to the first available
        setSelectedWorkflow(workflows[0]);
      }
    };

    loadWorkflows();
  }, [selectedWorkflow]); // Add selectedWorkflow dependency to ensure check runs correctly if state updates

  const renderView = () => {
    switch (currentView) {
      case View.EXECUTION:
        return <ExecutionView selectedWorkflow={selectedWorkflow} />;
      case View.HISTORY:
        return <HistoryView />;
      case View.MODELS:
        return <ModelsView />;
      case View.KEYWORDS:
        return <KeywordsView />;
      case View.SETTINGS:
        return <SettingsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4">construction</span>
            <h2 className="text-xl font-bold">View Under Construction</h2>
            <p>The {currentView} module is currently being optimized.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          selectedWorkflow={selectedWorkflow}
          onWorkflowChange={setSelectedWorkflow}
          currentView={currentView}
          availableWorkflows={availableWorkflows}
        />

        <div className="flex-1 overflow-hidden relative">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
