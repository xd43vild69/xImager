import React, { useState, useEffect } from 'react';
import { ExecutionState, LogEntry } from '../types';
import LogFeed from './LogFeed';
import * as ComfyUI from '../services/comfyui';
import { useSettings } from '../contexts/SettingsContext';

interface ExecutionViewProps {
  selectedWorkflow: string;
}

const ExecutionView: React.FC<ExecutionViewProps> = ({ selectedWorkflow }) => {
  const { settings } = useSettings();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Initialize prompt from localStorage
  const [prompt, setPrompt] = useState(() => {
    return localStorage.getItem('positivePrompt') || '';
  });

  // Save prompt to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('positivePrompt', prompt);
  }, [prompt]);

  // Apply default positive prompt when workflow changes
  useEffect(() => {
    // When workflow changes, clear prompt and set to default if configured, or empty.
    const defaultPrompt = settings.workflowPrompts?.[selectedWorkflow];
    setPrompt(defaultPrompt || '');
  }, [selectedWorkflow, settings.workflowPrompts]);

  const [referenceImages, setReferenceImages] = useState<Record<number, File>>({});
  const [referencePreviews, setReferencePreviews] = useState<Record<number, string>>({});

  // Reset references when workflow changes if mode changes? 
  // User might want to keep image if switching workflows. logic matches single image behavior for now.

  const isMultiRef = selectedWorkflow.startsWith('klein_mix');
  const requiredSlots = isMultiRef ? 2 : 1;

  const [execution, setExecution] = useState<ExecutionState>({
    isProcessing: false,
    progress: 0,
    step: 0,
    totalSteps: 50,
    eta: '0s',
    iterRate: '0 it/s',
    totalTime: '0s',
    resultUrl: '/removeCharacter.jpg',
  });



  // Handle paste events for reference images - pastes into first empty slot or slot 0
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Ignore if prompt textarea is focused
      if (document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            // Find first empty slot
            const targetIndex = !referenceImages[0] ? 0 : (isMultiRef && !referenceImages[1] ? 1 : 0);

            setReferenceImages(prev => ({ ...prev, [targetIndex]: blob }));
            setReferencePreviews(prev => ({ ...prev, [targetIndex]: URL.createObjectURL(blob) }));
            addLog('INFO', `Image loaded from clipboard into Slot ${targetIndex + 1}.`);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [referenceImages, isMultiRef]);

  const addLog = (level: LogEntry['level'], message: string) => {
    const now = new Date();
    const timestamp = `${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now
          .getSeconds()
          .toString()
          .padStart(2, '0')}`;

    setLogs(prev => [...prev, { timestamp, level, message }]);
  };

  const runProcess = React.useCallback(async () => {
    if (execution.isProcessing) return;

    const startTime = Date.now();

    setExecution(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      step: 0,
      resultUrl: null,
      totalTime: '0s',
    }));

    setLogs([]);

    addLog('INFO', 'Initializing ComfyUI workflow engine...');
    addLog('INFO', `Connecting to ComfyUI server at ${ComfyUI.getServerUrl()}...`);
    addLog('INFO', `Loading workflow: ${selectedWorkflow}`);

    try {
      // Load workflow JSON
      const workflow = await ComfyUI.loadWorkflow(selectedWorkflow);
      addLog('INFO', 'Workflow loaded successfully.');

      const uploadedFilenames: string[] = [];
      const slots = isMultiRef ? [0, 1] : [0];

      // Upload reference images
      for (const index of slots) {
        const file = referenceImages[index];
        if (file) {
          addLog('INFO', `Uploading reference image ${index + 1}: ${file.name}`);
          const name = await ComfyUI.uploadImage(file);
          uploadedFilenames[index] = name; // Ensure index alignment
          addLog('INFO', `Image ${index + 1} uploaded: ${name}`);
        }
      }

      // If single mode and we have array likely [filename], clean array for single arg if desired?
      // No, updated queuePrompt handles array or string. Array is safer.
      const imagesArg = uploadedFilenames.length > 0 ? uploadedFilenames : undefined;

      addLog('LOAD', "Model 'sd_xl_base_1.0.safetensors' requested...");

      // Queue the prompt
      let promptText = prompt || 'Abstract aesthetic digital art rendering, architectural forms';

      // Expand keywords (e.g. @rb -> remove background)
      if (settings.keywords) {
        Object.entries(settings.keywords).forEach(([key, value]) => {
          const regex = new RegExp(`@${key}\\b`, 'g');
          if (regex.test(promptText)) {
            promptText = promptText.replace(regex, value);
            addLog('INFO', `Expanded keyword: @${key} -> "${value}"`);
          }
        });
      }

      addLog('INFO', 'Queueing workflow execution...');
      const promptId = await ComfyUI.queuePrompt(workflow, promptText, imagesArg);

      setExecution(prev => ({ ...prev, promptId }));
      addLog('INFO', `Workflow queued with ID: ${promptId}`);
      addLog('EXEC', 'Starting generation process...');

      // Simulate progress while polling
      const totalSteps = 50;
      const stepDuration = 100;
      let currentStep = 0;

      const progressInterval = setInterval(() => {
        currentStep++;
        if (currentStep > totalSteps) {
          clearInterval(progressInterval);
          return;
        }

        const progress = (currentStep / totalSteps) * 95; // Cap at 95% until complete
        const elapsed = (Date.now() - startTime) / 1000;

        setExecution(prev => ({
          ...prev,
          step: currentStep,
          progress,
          eta: `${((totalSteps - currentStep) * stepDuration / 1000).toFixed(1)}s`,
          iterRate: `${(1000 / stepDuration).toFixed(1)} it/s`,
          totalTime: `${elapsed.toFixed(1)}s`,
        }));

        if (currentStep % 10 === 0 || currentStep === 1) {
          addLog(
            'EXEC',
            `Sampling step ${currentStep} of ${totalSteps}... denoising: ${(1 - currentStep / totalSteps).toFixed(2)}`
          );
        }
      }, stepDuration);

      // Poll for completion
      addLog('INFO', 'Polling for execution results...');
      const history = await ComfyUI.pollForCompletion(promptId, 120, 1000);
      clearInterval(progressInterval);

      addLog('INFO', 'Generation complete. Decoding results...');

      // Extract image from history
      const imageUrl = await ComfyUI.extractImageFromHistory(history);

      if (!imageUrl) {
        throw new Error('No image generated in workflow output');
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

      setExecution(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        step: totalSteps,
        resultUrl: imageUrl,
        totalTime: `${totalTime}s`,
      }));

      addLog('LOAD', 'Output assets synchronized to storage.');
      addLog('INFO', `Execution finished successfully in ${totalTime}s.`);
    } catch (error) {
      addLog(
        'ERROR',
        `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setExecution(prev => ({ ...prev, isProcessing: false }));
    }
  }, [execution.isProcessing, selectedWorkflow, referenceImages, prompt, isMultiRef, settings.keywords]);

  // Handle keyboard shortcut (Cmd/Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runProcess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runProcess]);

  const handlePasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        // Find the image type if present
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          // Create a File object from the Blob
          const file = new File([blob], `pasted_image_${Date.now()}.${imageType.split('/')[1]}`, { type: imageType });

          // Paste into first empty or slot 0
          const targetIndex = !referenceImages[0] ? 0 : (isMultiRef && !referenceImages[1] ? 1 : 0);

          setReferenceImages(prev => ({ ...prev, [targetIndex]: file }));
          setReferencePreviews(prev => ({ ...prev, [targetIndex]: URL.createObjectURL(file) }));
          addLog('INFO', `Image pasted from clipboard into Slot ${targetIndex + 1}.`);
          return;
        }
      }
      addLog('INFO', 'No image found in the clipboard.');
    } catch (error) {
      console.error('Clipboard paste error:', error);
      addLog('ERROR', 'Failed to paste from clipboard. Please allow clipboard access.');
    }
  };

  // Helper to handle file selection for a specific slot
  const handleFileSelect = (file: File, index: number) => {
    setReferenceImages(prev => ({ ...prev, [index]: file }));
    setReferencePreviews(prev => ({ ...prev, [index]: URL.createObjectURL(file) }));
    addLog('INFO', `Slot ${index + 1} image loaded: ${file.name}`);
  };

  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(true);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark/50 overflow-hidden">
      {/* Hidden file input - generic one, we'll trigger specific behavior via helper */}
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/tiff"
        id="reference-input-hidden"
        className="hidden"
        onChange={e => {
          // This is a dummy handler, actual handling logic moved to onClick of visible elements opening a specific input?
          // React best practice: create inputs for each or manage state.
          // Simplified: We will render inputs dynamically in the loop below.
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-col gap-6 h-full max-w-[1400px] mx-auto">
          {/* Prompt */}
          <div className="bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-all duration-300">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}>
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Positive Prompt
                </h3>
                <span className="material-symbols-outlined text-sm text-slate-400">
                  {isPromptCollapsed ? 'expand_more' : 'expand_less'}
                </span>
              </div>
              {!isPromptCollapsed && (
                <span className="text-[10px] text-slate-400 font-mono">
                  CLIP_L + CLIP_G
                </span>
              )}
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${isPromptCollapsed ? 'h-0 opacity-0' : 'h-24 opacity-100'}`}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Enter generation prompt here..."
                className="w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
            {/* Reference Images */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Reference Images {isMultiRef && '(Multi)'}
                </h3>
                <button
                  onClick={handlePasteFromClipboard}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
                  title="Paste from Clipboard"
                >
                  <span className="material-symbols-outlined text-sm">content_paste</span>
                </button>
              </div>

              <div className={`grid gap-4 ${isMultiRef ? 'grid-cols-2' : 'grid-cols-1'} flex-1`}>
                {Array.from({ length: requiredSlots }).map((_, index) => (
                  <div key={index} className="flex flex-col h-full">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/tiff"
                      id={`ref-input-${index}`}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, index);
                      }}
                    />
                    <div
                      onClick={() => document.getElementById(`ref-input-${index}`)?.click()}
                      className="flex-1 bg-slate-100 dark:bg-panel-dark border-2 border-dashed border-slate-300 dark:border-border-dark rounded-xl flex items-center justify-center cursor-pointer relative overflow-hidden shadow-inner hover:border-primary/50 transition-all min-h-[200px]"
                    >
                      {referencePreviews[index] ? (
                        <div className="absolute inset-0 p-2 flex items-center justify-center">
                          <img
                            src={referencePreviews[index]}
                            alt={`Reference ${index + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="text-center z-10">
                          <div className="size-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3 mx-auto">
                            <span className="material-symbols-outlined text-3xl text-slate-400">
                              add_photo_alternate
                            </span>
                          </div>
                          <p className="text-sm font-bold tracking-tight">
                            {isMultiRef ? `Image ${index + 1}` : 'Drop Image'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Live Result View
              </h3>

              <div className="flex-1 bg-slate-100 dark:bg-panel-dark border rounded-xl relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 p-2 flex items-center justify-center group">
                  <img
                    src={execution.resultUrl || '/removeCharacter.jpg'}
                    alt="Generation Result"
                    className={`max-w-full max-h-full object-contain rounded-lg transition-all duration-500 ${execution.isProcessing ? 'blur-md opacity-50 grayscale' : ''
                      }`}
                  />

                  {execution.resultUrl && !execution.isProcessing && (
                    <button
                      onClick={() => {
                        window.open(execution.resultUrl!, '_blank');
                        addLog('INFO', 'Image opened in new tab.');
                      }}
                      className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-primary z-10"
                      title="Open in New Tab"
                    >
                      <span className="material-symbols-outlined">open_in_new</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-panel-dark border-t p-4 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-2">
          {/* Controls Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={runProcess}
              disabled={execution.isProcessing}
              className={`px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wide transition-all ${execution.isProcessing
                ? 'bg-slate-200 text-slate-400'
                : 'bg-primary text-white hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/25'
                }`}
            >
              {execution.isProcessing ? 'Processing' : 'Queue Prompt'}
            </button>

            <button
              onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors"
            >
              {isLogsCollapsed ? 'Show Logs' : 'Hide Logs'}
              <span className="material-symbols-outlined text-sm">
                {isLogsCollapsed ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>

          {/* Collapsible Logs */}
          <div className={`overflow-hidden transition-all duration-300 ${isLogsCollapsed ? 'h-0 opacity-0' : 'h-32 opacity-100'}`}>
            <LogFeed logs={logs} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExecutionView;
