
import React, { useState, useEffect } from 'react';
import { View } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ExecutionView from './components/ExecutionView';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import ModelsView from './components/ModelsView';
import * as ComfyUI from './services/comfyui';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.EXECUTION);
  const [availableWorkflows, setAvailableWorkflows] = useState<string[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('SDXL_Image_Enhancer_v4.json');

  // Load available workflows on mount
  useEffect(() => {
    const loadWorkflows = async () => {
      const workflows = await ComfyUI.getAvailableWorkflows();
      setAvailableWorkflows(workflows);

      // Set first workflow as default if current selection doesn't exist
      if (workflows.length > 0 && !workflows.includes(selectedWorkflow)) {
        setSelectedWorkflow(workflows[0]);
      }
    };

    loadWorkflows();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case View.EXECUTION:
        return <ExecutionView selectedWorkflow={selectedWorkflow} />;
      case View.HISTORY:
        return <HistoryView />;
      case View.MODELS:
        return <ModelsView />;
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
