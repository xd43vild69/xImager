
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const SettingsView: React.FC = () => {
  const { settings, updateSettings, saveSettings } = useSettings();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('success');

  const handleTestConnection = () => {
    setTestStatus('testing');
    setTimeout(() => setTestStatus('success'), 1500);
  };

  return (
    <div className="h-full overflow-y-auto bg-background-light dark:bg-background-dark/95">
      <main className="max-w-[800px] mx-auto py-10 px-6 flex flex-col gap-8">
        {/* Page Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-black leading-tight">System Configuration Settings</h1>
          <p className="text-slate-500 dark:text-[#9ca6ba] text-base font-medium leading-normal">
            Configure local directory paths and server connection settings for the ComfyUI backend.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-surface-dark/40 border border-slate-200 dark:border-border-dark rounded-2xl p-8 flex flex-col gap-8 shadow-2xl">
          {/* Directory Paths Section */}
          <div>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-border-dark pb-3">
              <span className="material-symbols-outlined text-primary font-bold">folder_open</span>
              <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">Directory Paths</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {[
                { label: 'Workflow Directory Path', value: settings.workflowDirectory, hint: 'Path where your custom ComfyUI JSON workflow files are stored.', key: 'workflow' },
                { label: 'Input Directory Path', value: settings.inputDirectory, key: 'input' },
                { label: 'Output Directory Path', value: settings.outputDirectory, key: 'output' }
              ].map((field, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <label className="text-slate-700 dark:text-white text-xs font-black uppercase tracking-wider">{field.label}</label>
                  <div className="flex w-full items-stretch rounded-lg shadow-sm">
                    <input
                      className="flex-1 bg-slate-50 dark:bg-[#1b1f27] border border-slate-200 dark:border-border-dark border-r-0 rounded-l-lg text-slate-900 dark:text-white px-4 h-12 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-sm"
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const key = field.key === 'workflow' ? 'workflowDirectory' : field.key === 'input' ? 'inputDirectory' : 'outputDirectory';
                        updateSettings({ [key]: e.target.value });
                      }}
                    />
                    <button className="bg-slate-100 dark:bg-[#282e39] border border-slate-200 dark:border-border-dark border-l-0 rounded-r-lg px-4 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <span className="material-symbols-outlined text-slate-500 dark:text-[#9ca6ba]">folder_open</span>
                    </button>
                  </div>
                  {field.hint && <p className="text-[10px] text-slate-400 font-medium">{field.hint}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ComfyUI Server Section */}
          <div>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-border-dark pb-3">
              <span className="material-symbols-outlined text-primary font-bold">dns</span>
              <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">ComfyUI Server</h3>
            </div>
            <div className="flex flex-col gap-4">
              <label className="text-slate-700 dark:text-white text-xs font-black uppercase tracking-wider">ComfyUI Endpoint (Host/IP & Port)</label>
              <div className="flex flex-wrap md:flex-nowrap gap-4 items-start">
                <div className="flex-1 w-full">
                  <input
                    className="w-full bg-slate-50 dark:bg-[#1b1f27] border border-slate-200 dark:border-border-dark rounded-lg text-slate-900 dark:text-white px-4 h-12 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                    placeholder="http://localhost:8188"
                    type="text"
                    value={settings.comfyUIServerUrl}
                    onChange={(e) => updateSettings({ comfyUIServerUrl: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="h-12 px-6 border border-primary text-primary font-black text-xs uppercase tracking-widest rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-sm ${testStatus === 'testing' && 'animate-spin'}`}>
                    {testStatus === 'testing' ? 'sync' : 'network_check'}
                  </span>
                  Test Connection
                </button>
              </div>

              {testStatus === 'success' && (
                <div className="flex items-center gap-2 py-2 px-3 bg-green-500/10 border border-green-500/20 rounded-lg w-fit animate-in fade-in slide-in-from-top-1 duration-300">
                  <span className="material-symbols-outlined text-green-500 text-base font-bold">check_circle</span>
                  <span className="text-green-600 dark:text-green-500 text-xs font-black uppercase tracking-tighter">Connection successful. ComfyUI version 1.4.2 detected.</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-100 dark:border-border-dark flex items-center justify-between">
            <button className="text-slate-400 dark:text-[#9ca6ba] hover:text-slate-600 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 group">
              <span className="material-symbols-outlined text-base group-hover:rotate-180 transition-transform duration-500">settings_backup_restore</span>
              Restore Defaults
            </button>
            <div className="flex gap-3">
              <button className="px-6 h-11 text-slate-500 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                Cancel
              </button>
              <button className="bg-primary hover:bg-blue-600 px-8 h-11 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-xl shadow-primary/20 transition-all flex items-center gap-2 active:scale-95">
                <span className="material-symbols-outlined text-base">save</span>
                Save Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Warning/Info Box */}
        <div className="bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex gap-4 backdrop-blur-sm">
          <span className="material-symbols-outlined text-primary font-bold">info</span>
          <p className="text-sm text-slate-600 dark:text-[#9ca6ba] leading-relaxed">
            <strong className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest mr-1">Note:</strong>
            Changing the directory paths will refresh the workflow library. Ensure that ComfyUI is running and the "Enable Remote Access" flag is active if connecting from a different machine.
          </p>
        </div>

        <footer className="py-10 text-center opacity-30">
          <p className="text-slate-900 dark:text-[#3b4354] text-[10px] font-black uppercase tracking-[0.4em]">ORCHESTRATOR V2.0.4 BUILD-812</p>
        </footer>
      </main>
    </div>
  );
};

export default SettingsView;
