
import React from 'react';
import { HistoryItem } from '../types';

const MOCK_HISTORY: HistoryItem[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', prompt: 'Abstract fluid dynamics, neon purple and teal', timestamp: '2023-10-24 14:22', workflow: 'SDXL_Image_Enhancer' },
  { id: '2', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=400&q=80', prompt: 'Cyberpunk city street, rainy night, cinematic lighting', timestamp: '2023-10-24 13:05', workflow: 'SDXL_Image_Enhancer' },
  { id: '3', url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&w=400&q=80', prompt: 'Ethereal forest with floating lanterns', timestamp: '2023-10-23 22:45', workflow: 'ControlNet_Canny' },
  { id: '4', url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=400&q=80', prompt: 'Portrait of a futuristic samurai', timestamp: '2023-10-23 20:12', workflow: 'SDXL_Image_Enhancer' },
  { id: '5', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80', prompt: 'Minimalist geometric architecture', timestamp: '2023-10-23 18:30', workflow: 'SDXL_Image_Enhancer' },
  { id: '6', url: 'https://images.unsplash.com/photo-1617396900799-f4ec2b43c7ae?auto=format&fit=crop&w=400&q=80', prompt: 'Close up of a mechanical eye', timestamp: '2023-10-22 15:44', workflow: 'SDXL_Image_Enhancer' },
];

const HistoryView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-background-light dark:bg-background-dark/50 p-6">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Generation History</h2>
          <div className="flex gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search prompt..." 
                className="bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary outline-none transition-all w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {MOCK_HISTORY.map((item) => (
            <div key={item.id} className="group relative bg-white dark:bg-panel-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all">
              <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{item.timestamp}</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">{item.prompt}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-bold">{item.workflow}</span>
                  <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
