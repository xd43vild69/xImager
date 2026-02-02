import React, { useState, useEffect } from 'react';
import { ExecutionState, LogEntry } from '../types';
import LogFeed from './LogFeed';
import * as ComfyUI from '../services/comfyui';
import { useSettings } from '../contexts/SettingsContext';
import { recordPromptKeywords } from '../services/promptHistory';

interface ExecutionViewProps {
  selectedWorkflow: string;
  prompt: string;
}

const ExecutionView: React.FC<ExecutionViewProps> = ({ selectedWorkflow, prompt }) => {
  const { settings } = useSettings();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [referenceImages, setReferenceImages] = useState<Record<number, File>>({});
  const [referencePreviews, setReferencePreviews] = useState<Record<number, string>>({});
  const [referenceDimensions, setReferenceDimensions] = useState<Record<number, { width: number; height: number }>>({});
  const [resultDimensions, setResultDimensions] = useState<{ width: number; height: number } | null>(null);

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

  const [requiredSlots, setRequiredSlots] = useState(1);
  const isMultiInput = requiredSlots > 1;

  // Dynamic detection of slots
  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const wf = await ComfyUI.loadWorkflow(selectedWorkflow);
        const count = ComfyUI.countImageNodes(wf);
        setRequiredSlots(count > 0 ? count : 1);
        addLog('INFO', `Workflow requires ${count} input images.`);
      } catch (e) {
        console.error(e);
        setRequiredSlots(1);
      }
    };
    fetchWorkflow();
  }, [selectedWorkflow]);

  const addLog = (level: LogEntry['level'], message: string) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [...prev, { timestamp, level, message }]);
  };

  const handleFileSelect = (file: File, index: number) => {
    setReferenceImages(prev => ({ ...prev, [index]: file }));
    setReferencePreviews(prev => ({ ...prev, [index]: URL.createObjectURL(file) }));
    setReferenceDimensions(prev => {
      const newDims = { ...prev };
      delete newDims[index];
      return newDims;
    });
    addLog('INFO', `Slot ${index + 1} image loaded: ${file.name}`);
  };

  const handlePasteToSlot = async (slotIndex: number) => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `pasted_image_${Date.now()}.${imageType.split('/')[1]}`, { type: imageType });
          handleFileSelect(file, slotIndex);
          return;
        }
      }
      addLog('INFO', 'No image found in the clipboard.');
    } catch (error) {
      console.error('Clipboard paste error:', error);
      addLog('ERROR', 'Failed to paste from clipboard.');
    }
  };

  const handlePasteFromClipboard = async () => {
    const targetIndex = !referenceImages[0] ? 0 : (isMultiInput && !referenceImages[1] ? 1 : 0);
    handlePasteToSlot(targetIndex);
  };

  // Handle global paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      handlePasteFromClipboard();
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [referenceImages, isMultiInput]);


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
    setResultDimensions(null); // Clear result dimensions

    setLogs([]);

    addLog('INFO', 'Initializing ComfyUI workflow engine...');
    addLog('INFO', `Connecting to ComfyUI server at ${ComfyUI.getServerUrl()}...`);
    addLog('INFO', `Loading workflow: ${selectedWorkflow}`);

    try {
      // Load workflow JSON
      const workflow = await ComfyUI.loadWorkflow(selectedWorkflow);
      addLog('INFO', 'Workflow loaded successfully.');

      const uploadedFilenames: string[] = [];
      const slots = Array.from({ length: requiredSlots }, (_, i) => i);

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

      const imagesArg = uploadedFilenames.filter(Boolean).length > 0 ? uploadedFilenames : undefined;

      addLog('LOAD', "Model requested...");

      // Queue the prompt (using prop)
      let promptText = prompt || 'Abstract aesthetic digital art rendering, architectural forms';

      // Expand keywords 
      if (settings.keywords) {
        Object.entries(settings.keywords).forEach(([key, value]) => {
          const regex = new RegExp(`@${key}\\b`, 'g');
          if (regex.test(promptText)) {
            promptText = promptText.replace(regex, value);
            addLog('INFO', `Expanded keyword: @${key} -> "${value}"`);
          }
        });
      }

      if (promptText) {
        recordPromptKeywords(promptText);
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

        const progress = (currentStep / totalSteps) * 95; // Cap at 95%
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

      // Extract image
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
  }, [execution.isProcessing, selectedWorkflow, referenceImages, prompt, requiredSlots, settings.keywords]);

  // Keyboard shortcut
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

  const [isLogsCollapsed, setIsLogsCollapsed] = useState(true);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark/50 overflow-hidden">
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/tiff"
        id="reference-input-hidden"
        className="hidden"
        onChange={e => {
          // hidden global input logic if needed
        }}
      />

      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-2 h-full max-w-[1400px] mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 min-h-[400px]">
            {/* Reference Images */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Reference Images {isMultiInput && '(Multi)'}
                </h3>
                <button
                  onClick={handlePasteFromClipboard}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
                  title="Paste from Clipboard (Auto)"
                >
                  <span className="material-symbols-outlined text-sm">content_paste</span>
                </button>
              </div>

              <div className={`grid gap-2 ${isMultiInput ? 'grid-cols-2' : 'grid-cols-1'} flex-1`}>
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
                    <div className="relative flex-1 flex flex-col group/slot">
                      {/* Paste Button specific to this slot */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePasteToSlot(index);
                        }}
                        className="absolute top-2 right-2 z-20 p-1.5 bg-white/80 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black text-slate-500 hover:text-primary transition-all opacity-0 group-hover/slot:opacity-100"
                        title={`Paste into Image ${index + 1}`}
                      >
                        <span className="material-symbols-outlined text-sm">content_paste</span>
                      </button>

                      <div
                        onClick={() => document.getElementById(`ref-input-${index}`)?.click()}
                        className="flex-1 bg-slate-100 dark:bg-panel-dark border-2 border-dashed border-slate-300 dark:border-border-dark rounded-xl flex items-center justify-center cursor-pointer relative overflow-hidden shadow-inner hover:border-primary/50 transition-all min-h-[200px]"
                      >
                        {referencePreviews[index] ? (
                          <div className="absolute inset-0 p-2 flex flex-col items-center justify-center">
                            <img
                              src={referencePreviews[index]}
                              alt={`Reference ${index + 1}`}
                              onLoad={(e) => {
                                const img = e.currentTarget;
                                setReferenceDimensions(prev => ({
                                  ...prev,
                                  [index]: { width: img.naturalWidth, height: img.naturalHeight }
                                }));
                              }}
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
                              {isMultiInput ? `Image ${index + 1}` : 'Drop Image'}
                            </p>
                          </div>
                        )}
                      </div>
                      {referenceDimensions[index] && (
                        <div className="text-center mt-1">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                            {referenceDimensions[index].width} x {referenceDimensions[index].height}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Output
                </h3>
                <button
                  onClick={async () => {
                    if (!execution.resultUrl) return;
                    try {
                      const response = await fetch(execution.resultUrl);
                      const blob = await response.blob();
                      await navigator.clipboard.write([
                        new ClipboardItem({
                          [blob.type]: blob,
                        }),
                      ]);
                      addLog('INFO', 'Result image copied to clipboard.');
                    } catch (error) {
                      console.error('Copy failed:', error);
                      addLog('ERROR', 'Failed to copy image to clipboard.');
                    }
                  }}
                  disabled={!execution.resultUrl || execution.isProcessing}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy to Clipboard"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-panel-dark border rounded-xl relative overflow-hidden shadow-2xl flex flex-col">
                <div className="flex-1 relative p-2 flex items-center justify-center group">
                  <img
                    src={execution.resultUrl || '/removeCharacter.jpg'}
                    alt="Generation Result"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setResultDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                    }}
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
              {resultDimensions && !execution.isProcessing && (
                <div className="text-center">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {resultDimensions.width} x {resultDimensions.height}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white dark:bg-panel-dark border-t p-2 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              onClick={runProcess}
              disabled={execution.isProcessing}
              className={`px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-wide transition-all ${execution.isProcessing
                ? 'bg-slate-200 text-slate-400'
                : 'bg-primary text-white hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/25'
                }`}
            >
              {execution.isProcessing ? 'Processing' : 'Run'}
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

          <div className={`overflow-hidden transition-all duration-300 ${isLogsCollapsed ? 'h-0 opacity-0' : 'h-32 opacity-100'}`}>
            <LogFeed logs={logs} />
          </div>
        </div>
      </footer>
    </div >
  );
};

export default ExecutionView;
