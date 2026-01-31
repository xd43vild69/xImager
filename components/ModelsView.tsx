
import React from 'react';
import { ModelItem } from '../types';

const MOCK_MODELS: ModelItem[] = [
  { id: 'm1', name: 'sd_xl_base_1.0.safetensors', type: 'Checkpoint', size: '6.46 GB', lastUsed: '2 hours ago' },
  { id: 'm2', name: 'sd_xl_refiner_1.0.safetensors', type: 'Checkpoint', size: '5.62 GB', lastUsed: '3 hours ago' },
  { id: 'm3', name: 'v1-5-pruned-emaonly.ckpt', type: 'Checkpoint', size: '3.97 GB', lastUsed: 'Yesterday' },
  { id: 'm4', name: 'pytorch_lora_weights.safetensors', type: 'LoRA', size: '144 MB', lastUsed: '5 days ago' },
  { id: 'm5', name: 'control_v11p_sd15_canny.pth', type: 'ControlNet', size: '1.45 GB', lastUsed: 'Today' },
  { id: 'm6', name: 'vae-ft-mse-840000-ema-pruned.safetensors', type: 'VAE', size: '335 MB', lastUsed: '1 hour ago' },
];

const ModelsView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-background-light dark:bg-background-dark/50 p-6">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Models Library</h2>
            <p className="text-slate-500 text-xs font-medium">Manage your local weights and specialized nodes.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            Add New Model
          </button>
        </div>

        <div className="bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">File Size</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Used</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_MODELS.map((model) => (
                <tr key={model.id} className="border-b border-slate-50 dark:border-border-dark/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">description</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{model.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-full ${
                      model.type === 'Checkpoint' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                      model.type === 'LoRA' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'
                    }`}>
                      {model.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">{model.size}</td>
                  <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">{model.lastUsed}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelsView;
