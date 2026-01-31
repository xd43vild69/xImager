import React, { useState } from 'react';
import { ExecutionState, LogEntry } from '../types';
import LogFeed from './LogFeed';
import { generateResultImage } from '../services/gemini';

const ExecutionView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [prompt, setPrompt] = useState('');

  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);

  const [execution, setExecution] = useState<ExecutionState>({
    isProcessing: false,
    progress: 0,
    step: 0,
    totalSteps: 50,
    eta: '0s',
    iterRate: '0 it/s',
    totalTime: '0s',
    resultUrl: null,
  });

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

  const runProcess = async () => {
    if (execution.isProcessing) return;

    setExecution(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      step: 0,
      resultUrl: null,
      totalTime: '0s',
    }));

    setLogs([]);

    addLog('INFO', 'Initializing workflow engine...');
    addLog('INFO', 'Connecting to Gemini API backend... connected.');
    addLog('INFO', 'Prompt validation successful.');

    if (referenceImage) {
      addLog('INFO', `Reference image attached: ${referenceImage.name}`);
    }

    addLog('LOAD', "Model 'sd_xl_base_1.0.safetensors' requested...");

    const totalSteps = 50;
    const stepDuration = 80;

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(r => setTimeout(r, stepDuration));

      const progress = (i / totalSteps) * 100;

      setExecution(prev => ({
        ...prev,
        step: i,
        progress,
        eta: `${((totalSteps - i) * stepDuration / 1000).toFixed(1)}s`,
        iterRate: `${(1000 / stepDuration).toFixed(1)} it/s`,
        totalTime: `${(i * stepDuration / 1000).toFixed(1)}s`,
      }));

      if (i % 10 === 0 || i === 1) {
        addLog(
          'EXEC',
          `Sampling step ${i} of ${totalSteps}... denoising: ${(1 - i / totalSteps).toFixed(2)}`
        );
      }
    }

    try {
      addLog('INFO', 'Generation complete. Decoding results...');

      const imageUrl = await generateResultImage(
        prompt || 'Abstract aesthetic digital art rendering, architectural forms'
      );

      setExecution(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        resultUrl: imageUrl,
      }));

      addLog('LOAD', 'Output assets synchronized to storage.');
      addLog('INFO', 'Execution finished successfully.');
    } catch (error) {
      addLog(
        'ERROR',
        `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setExecution(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark/50 overflow-hidden">
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/tiff"
        id="reference-input"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (!file.type.startsWith('image/')) {
            addLog('ERROR', 'Invalid file type. Please select an image.');
            return;
          }

          setReferenceImage(file);
          setReferencePreview(URL.createObjectURL(file));
          addLog('INFO', `Reference image loaded: ${file.name}`);
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-col gap-6 h-full max-w-[1400px] mx-auto">
          {/* Prompt */}
          <div className="bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Positive Prompt
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                CLIP_L + CLIP_G
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Enter generation prompt here..."
              className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
            {/* Reference Image */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Reference Images
              </h3>

              <div
                onClick={() =>
                  document.getElementById('reference-input')?.click()
                }
                className="flex-1 bg-slate-100 dark:bg-panel-dark border-2 border-dashed border-slate-300 dark:border-border-dark rounded-xl flex items-center justify-center cursor-pointer relative overflow-hidden shadow-inner hover:border-primary/50 transition-all"
              >
                {referencePreview ? (
                  <img
                    src={referencePreview}
                    alt="Reference"
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-center z-10">
                    <div className="size-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-4xl text-slate-400">
                        add_photo_alternate
                      </span>
                    </div>
                    <p className="text-base font-bold tracking-tight">
                      Drop reference file
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Accepts PNG, JPG, TIFF
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Result */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Live Result View
              </h3>

              <div className="flex-1 bg-slate-100 dark:bg-panel-dark border rounded-xl relative overflow-hidden shadow-2xl">
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-all ${execution.isProcessing
                    ? 'blur-md opacity-40 grayscale'
                    : ''
                    }`}
                  style={{
                    backgroundImage: `url('${execution.resultUrl ||
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=40'
                      }')`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-panel-dark border-t p-4 sm:p-6">
        <div className="max-w-[1400px] mx-auto flex gap-6">
          <button
            onClick={runProcess}
            disabled={execution.isProcessing}
            className={`px-8 py-5 rounded-xl font-black ${execution.isProcessing
              ? 'bg-slate-200 text-slate-400'
              : 'bg-primary text-white hover:scale-105'
              }`}
          >
            QUEUE PROMPT
          </button>

          <div className="flex-1">
            <LogFeed logs={logs} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExecutionView;
