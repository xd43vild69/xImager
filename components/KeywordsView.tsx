import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const KeywordsView: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if (!newKey.trim() || !newValue.trim()) return;

        // Remove @ if user typed it
        const cleanKey = newKey.replace(/^@/, '');

        const updatedKeywords = {
            ...settings.keywords,
            [cleanKey]: newValue
        };

        updateSettings({ keywords: updatedKeywords });
        setNewKey('');
        setNewValue('');
    };

    const handleDelete = (key: string) => {
        const updatedKeywords = { ...settings.keywords };
        delete updatedKeywords[key];
        updateSettings({ keywords: updatedKeywords });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark/50 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-[800px] mx-auto flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold">Keyword Expansion</h2>
                        <p className="text-slate-500">
                            Define keywords that will be automatically replaced in your prompt.
                            Use <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">@keyword</code> in your
                            prompt to trigger the replacement.
                        </p>
                    </div>

                    {/* Add New */}
                    <div className="bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm">
                        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-400">Add New Mapping</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/3">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Keyword (e.g. rb)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                                    <input
                                        type="text"
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                        placeholder="rb"
                                        className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Expansion (e.g. remove background)</label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="remove background, high quality, 8k..."
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleAdd}
                                    disabled={!newKey.trim() || !newValue.trim()}
                                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Keywords</h3>

                        {Object.keys(settings.keywords).length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2">translate</span>
                                <p>No keywords defined yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {Object.entries(settings.keywords).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-4 bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-lg p-3 shadow-sm group">
                                        <div className="w-1/4 sm:w-1/6 min-w-[80px]">
                                            <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-sm font-bold">
                                                @{key}
                                            </span>
                                        </div>
                                        <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {value}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(key)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KeywordsView;
