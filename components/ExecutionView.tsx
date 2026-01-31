
import React, { useState } from 'react';
import { ExecutionState, LogEntry } from '../types';
import LogFeed from './LogFeed';
import { generateResultImage } from '../services/gemini';

const ExecutionView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [prompt, setPrompt] = useState('');
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
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
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
      totalTime: '0s'
    }));
    setLogs([]);

    addLog('INFO', 'Initializing workflow engine...');
    addLog('INFO', 'Connecting to Gemini API backend... connected.');
    addLog('INFO', 'Prompt validation successful.');
    addLog('LOAD', "Model 'sd_xl_base_1.0.safetensors' requested...");

    // Simulate steps
    const totalSteps = 50;
    const stepDuration = 80; // ms

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(r => setTimeout(r, stepDuration));
      const progress = (i / totalSteps) * 100;
      
      setExecution(prev => ({
        ...prev,
        step: i,
        progress: progress,
        eta: `${((totalSteps - i) * stepDuration / 1000).toFixed(1)}s`,
        iterRate: `${(1000 / stepDuration).toFixed(1)} it/s`,
        totalTime: `${(i * stepDuration / 1000).toFixed(1)}s`
      }));

      if (i % 10 === 0 || i === 1) {
        addLog('EXEC', `Sampling step ${i} of ${totalSteps}... denoising: ${(1 - (i/totalSteps)).toFixed(2)}`);
      }
    }

    try {
      addLog('INFO', 'Generation complete. Decoding results...');
      const imageUrl = await generateResultImage(prompt || "Abstract aesthetic digital art rendering, architectural forms");
      setExecution(prev => ({ ...prev, isProcessing: false, progress: 100, resultUrl: imageUrl }));
      addLog('LOAD', 'Output assets synchronized to storage.');
      addLog('INFO', 'Execution finished successfully.');
    } catch (error) {
      addLog('ERROR', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setExecution(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark/50 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-col gap-6 h-full max-w-[1400px] mx-auto">
          
          {/* Top Section: Prompt Input */}
          <div className="bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Positive Prompt</h3>
              <span className="text-[10px] text-slate-400 font-mono">CLIP_L + CLIP_G</span>
            </div>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter generation prompt here... (e.g. A lush magical forest with glowing plants)"
              className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
            {/* Input Source Column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reference Images</h3>
                <button className="text-primary text-[11px] font-bold flex items-center gap-1 hover:underline group">
                  <span className="material-symbols-outlined text-sm group-hover:rotate-45 transition-transform">settings</span>
                  Load Node
                </button>
              </div>
              
              <div className="flex-1 bg-slate-100 dark:bg-panel-dark border-2 border-dashed border-slate-300 dark:border-border-dark rounded-xl flex flex-col items-center justify-center p-8 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden shadow-inner">
                <div className="text-center z-10">
                  <div className="size-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors">add_photo_alternate</span>
                  </div>
                  <p className="text-base font-bold tracking-tight">Drop reference file</p>
                  <p className="text-xs text-slate-500 mt-1">Accepts PNG, JPG, TIFF</p>
                </div>
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent pointer-events-none"></div>
              </div>
            </div>

            {/* Execution Result Column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Result View</h3>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-lg">image_search</span>
                  </button>
                  <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-lg">fullscreen</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-100 dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-xl flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                <div 
                  className={`w-full h-full absolute inset-0 bg-cover bg-center transition-all duration-1000 ${execution.isProcessing ? 'blur-md opacity-40 grayscale' : 'blur-none opacity-100'}`}
                  style={{ backgroundImage: `url('${execution.resultUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=40"}')` }}
                ></div>

                {execution.isProcessing || !execution.resultUrl ? (
                  <div className="z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col items-center shadow-2xl scale-95 transition-transform group-hover:scale-100">
                    <div className="relative size-12 mb-3">
                       <span className={`material-symbols-outlined text-4xl text-white/50 absolute inset-0 flex items-center justify-center ${execution.isProcessing ? 'animate-spin' : ''}`}>
                        {execution.isProcessing ? 'refresh' : 'monitoring'}
                      </span>
                    </div>
                    <p className="text-white font-black text-xs uppercase tracking-widest">
                      {execution.isProcessing ? `Step ${execution.step} of ${execution.totalSteps}` : 'System Ready'}
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8 gap-3">
                    <button className="px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/40 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">download</span>
                      Export
                    </button>
                    <button className="px-4 py-2.5 bg-white text-slate-900 rounded-lg text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">history</span>
                      History
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Execution Panel */}
      <footer className="bg-white dark:bg-panel-dark border-t border-border-dark p-4 sm:p-6 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.3)] z-20">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch max-w-[1400px] mx-auto">
          {/* Run Control */}
          <div className="flex-shrink-0 flex items-center">
            <button 
              onClick={runProcess}
              disabled={execution.isProcessing}
              className={`h-full min-w-[200px] px-8 py-5 rounded-xl text-lg font-black tracking-tighter transition-all flex flex-col items-center justify-center gap-1 group shadow-lg ${
                execution.isProcessing 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-primary text-white hover:scale-[1.02] active:scale-95 btn-run-glow shadow-primary/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-2xl ${!execution.isProcessing && 'group-hover:translate-x-1'} transition-transform`}>
                  {execution.isProcessing ? 'hourglass_top' : 'rocket_launch'}
                </span>
                QUEUE PROMPT
              </div>
              <span className="text-[9px] opacity-70 uppercase font-bold tracking-[0.2em]">Ready for Generation</span>
            </button>
          </div>

          {/* Progress and Logs */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Multi-stage Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end px-1">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${execution.isProcessing ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(13,89,242,0.8)]' : 'bg-slate-400'}`}></span>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${execution.isProcessing ? 'text-primary' : 'text-slate-400'}`}>
                      {execution.isProcessing ? 'K-Sampler Processing' : 'Engine Idle'}
                    </span>
                  </div>
                  {execution.isProcessing && (
                    <div className="text-[9px] text-slate-500 font-mono tracking-tighter hidden sm:block">
                      {execution.step}/{execution.totalSteps} | DPM++ 2M Karras | ETA: {execution.eta} | {execution.iterRate}
                    </div>
                  )}
                </div>
                <span className="text-sm font-black text-primary">{Math.round(execution.progress)}%</span>
              </div>
              
              <div className="relative h-2.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_15px_rgba(13,89,242,0.6)] transition-all duration-300" 
                  style={{ width: `${execution.progress}%` }}
                ></div>
                <div className="absolute inset-0 flex justify-between px-[20%] pointer-events-none">
                  <div className="h-full w-px bg-black/5 dark:bg-white/10"></div>
                  <div className="h-full w-px bg-black/5 dark:bg-white/10"></div>
                  <div className="h-full w-px bg-black/5 dark:bg-white/10"></div>
                  <div className="h-full w-px bg-black/5 dark:bg-white/10"></div>
                </div>
              </div>
            </div>

            {/* Real-time Status Log Feed */}
            <LogFeed logs={logs} />
          </div>

          {/* Quick Stats */}
          <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-1 gap-2 min-w-[140px]">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg flex flex-col border border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Duration</span>
              <span className="text-xs font-bold tracking-tight font-mono">{execution.totalTime}</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg flex flex-col border border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Queue Size</span>
              <span className="text-xs font-bold tracking-tight font-mono">0 pending</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExecutionView;
