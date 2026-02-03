
import React, { useState, useEffect } from 'react';
import { View } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ExecutionView from './components/ExecutionView';
import SettingsView from './components/SettingsView';
import KeywordsView from './components/KeywordsView';
import KeywordsManager from './components/KeywordsManager';
import I2ISettingsView from './components/I2ISettingsView';
import * as ComfyUI from './services/comfyui';
import { useSettings } from './contexts/SettingsContext';

import Modal from './components/Modal';
import ImageSettingsModal from './components/ImageSettingsModal';
import { ImageSettings } from './utilities/patching';

const App: React.FC = () => {
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState<View>(View.EXECUTION);
  const [availableWorkflows, setAvailableWorkflows] = useState<string[]>([]);

  // Execution Control
  const [executionOverrides, setExecutionOverrides] = useState<ImageSettings | undefined>(undefined);

  // State Initialization
  const [selectedWorkflow, setSelectedWorkflow] = useState(() => {
    return localStorage.getItem('selectedWorkflow') || 'SDXL_Image_Enhancer_v4.json';
  });

  const [prompt, setPrompt] = useState(() => {
    return localStorage.getItem('positivePrompt') || '';
  });

  // Effects
  useEffect(() => {
    localStorage.setItem('positivePrompt', prompt);
  }, [prompt]);

  useEffect(() => {
    const defaultPrompt = settings.workflowPrompts?.[selectedWorkflow];
    setPrompt(defaultPrompt || '');
  }, [selectedWorkflow, settings.workflowPrompts]);

  useEffect(() => {
    if (selectedWorkflow) {
      localStorage.setItem('selectedWorkflow', selectedWorkflow);
    }
  }, [selectedWorkflow]);

  useEffect(() => {
    const loadWorkflows = async () => {
      const workflows = await ComfyUI.getAvailableWorkflows();
      setAvailableWorkflows(workflows);

      if (workflows.length > 0 && !workflows.includes(selectedWorkflow)) {
        setSelectedWorkflow(workflows[0]);
      }
    };
    loadWorkflows();
  }, [selectedWorkflow]);

  // Modal Render Logic
  const renderModalContent = () => {
    switch (currentView) {
      case View.KEYWORDS:
        return <KeywordsView />;
      case View.KEYWORDS_AC:
        return <KeywordsManager />;
      case View.I2I_SETTINGS:
        return <I2ISettingsView onWorkflowsChange={() => {
          const loadWorkflows = async () => {
            const workflows = await ComfyUI.getAvailableWorkflows();
            setAvailableWorkflows(workflows);
          };
          loadWorkflows();
        }} />;
      case View.SETTINGS:
        return <SettingsView />;
      case View.IMAGE_SETTINGS:
        return (
          <ImageSettingsModal
            selectedWorkflow={selectedWorkflow}
            onClose={handleCloseModal}
            currentSettings={executionOverrides}
            onSettingsChange={setExecutionOverrides}
          />
        );
      default:
        return null;
    }
  };

  const handleCloseModal = () => {
    setCurrentView(View.EXECUTION);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-neutral-900 dark:text-neutral-100">
      {/* Sidebar: passes current view and updater. Note: If modal is open, sidebar highlights it. */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          selectedWorkflow={selectedWorkflow}
          onWorkflowChange={setSelectedWorkflow}
          currentView={currentView} // Header doesn't need to know about modals really, but we keep it
          availableWorkflows={availableWorkflows}
          prompt={prompt}
          setPrompt={setPrompt}
        />

        {/* MAIN VIEW: ALWAYS EXECUTION */}
        <div className="flex-1 overflow-hidden relative z-0">
          <ExecutionView
            selectedWorkflow={selectedWorkflow}
            prompt={prompt}
            overrides={executionOverrides}
          />
        </div>

        {/* MODAL OVERLAY */}
        {currentView !== View.EXECUTION && (
          <Modal onClose={handleCloseModal}>
            {renderModalContent()}
          </Modal>
        )}
      </main>
    </div>
  );
};

export default App;
