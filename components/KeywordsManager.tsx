import React, { useState, useEffect } from 'react';
import { getKeywordHistory, loadKeywordHistory, updateKeyword, deleteKeyword, addKeyword, KeywordStat } from '../services/promptHistory';

const KeywordsManager: React.FC = () => {
    const [keywords, setKeywords] = useState<KeywordStat[]>([]);
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState<'count' | 'lastUsed'>('count');
    const [isAddMode, setIsAddMode] = useState(false);
    const [newKeyword, setNewKeyword] = useState({ text: '', count: 1 });

    // Load data
    const refresh = async () => {
        await loadKeywordHistory();
        const history = getKeywordHistory();
        setKeywords(Object.values(history));
    };

    useEffect(() => {
        refresh();
    }, []);

    // Filtering and Sorting
    const filteredKeywords = keywords
        .filter(k => k.text.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'count') return b.count - a.count;
            return b.lastUsed - a.lastUsed;
        });

    const handleAdd = async () => {
        if (!newKeyword.text.trim()) return;
        await addKeyword(newKeyword.text.trim(), newKeyword.count);
        setNewKeyword({ text: '', count: 1 });
        setIsAddMode(false);
        refresh();
    };

    const handleDelete = async (text: string) => {
        if (window.confirm(`Delete keyword "${text}"?`)) {
            await deleteKeyword(text);
            refresh();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark/50 p-6 overflow-hidden">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 h-full">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-gray-100">Autocompleter</h1>
                        <p className="text-slate-500 text-sm">Manage autocomplete dictionary</p>
                    </div>
                    <button
                        onClick={() => setIsAddMode(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Keyword
                    </button>
                </div>

                {/* Add Modal / Form */}
                {isAddMode && (
                    <div className="bg-white dark:bg-panel-dark p-4 rounded-xl shadow-lg border border-slate-200 dark:border-border-dark flex items-end gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Keyword</label>
                            <input
                                autoFocus
                                type="text"
                                value={newKeyword.text}
                                onChange={e => setNewKeyword({ ...newKeyword, text: e.target.value })}
                                className="w-full bg-slate-100 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                placeholder="e.g. cinematic lighting"
                            />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Count</label>
                            <input
                                type="number"
                                min="0"
                                value={newKeyword.count}
                                onChange={e => setNewKeyword({ ...newKeyword, count: parseInt(e.target.value) || 0 })}
                                className="w-full bg-slate-100 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-center"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAdd}
                                className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                                title="Save"
                            >
                                <span className="material-symbols-outlined">check</span>
                            </button>
                            <button
                                onClick={() => setIsAddMode(false)}
                                className="bg-slate-200 dark:bg-slate-700 text-slate-500 p-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                title="Cancel"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-4 bg-white dark:bg-panel-dark p-3 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search keywords..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none placeholder-slate-400"
                        />
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-border-dark"></div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>Sort by:</span>
                        <button
                            onClick={() => setSortBy('count')}
                            className={`px-3 py-1 rounded-md transition-colors ${sortBy === 'count' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Count
                        </button>
                        <button
                            onClick={() => setSortBy('lastUsed')}
                            className={`px-3 py-1 rounded-md transition-colors ${sortBy === 'lastUsed' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Recent
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-panel-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/2">Keyword</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-24">Uses</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Last Used</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredKeywords.map(k => (
                                <KeywordRow key={k.text} keyword={k} onRefresh={refresh} />
                            ))}
                            {filteredKeywords.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                                        No keywords found matching "{filter}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const KeywordRow: React.FC<{ keyword: KeywordStat, onRefresh: () => void }> = ({ keyword, onRefresh }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({ text: keyword.text, count: keyword.count });

    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const handleSave = async () => {
        if (!editValues.text.trim()) return;

        // If changing name or count
        if (editValues.text !== keyword.text || editValues.count !== keyword.count) {
            await updateKeyword(keyword.text, editValues.text.trim(), editValues.count);
            onRefresh();
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <tr className="bg-primary/5">
                <td className="p-3">
                    <input
                        className="w-full bg-white dark:bg-background-dark border border-slate-300 dark:border-border-dark rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={editValues.text}
                        onChange={e => setEditValues({ ...editValues, text: e.target.value })}
                        autoFocus
                    />
                </td>
                <td className="p-3 text-center">
                    <input
                        type="number"
                        className="w-16 bg-white dark:bg-background-dark border border-slate-300 dark:border-border-dark rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-primary outline-none"
                        value={editValues.count}
                        onChange={e => setEditValues({ ...editValues, count: parseInt(e.target.value) || 0 })}
                    />
                </td>
                <td className="p-3 text-right text-sm text-slate-500">
                    -
                </td>
                <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                        <button onClick={handleSave} className="text-green-500 hover:bg-green-500/10 p-1.5 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                        <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 p-1.5 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                {keyword.text}
            </td>
            <td className="p-4 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {keyword.count}
                </span>
            </td>
            <td className="p-4 text-sm text-right text-slate-500 font-mono">
                {timeAgo(keyword.lastUsed)}
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => {
                            setEditValues({ text: keyword.text, count: keyword.count });
                            setIsEditing(true);
                        }}
                        className="text-slate-400 hover:text-primary transition-colors p-1"
                        title="Edit"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm(`Delete keyword "${keyword.text}"?`)) {
                                deleteKeyword(keyword.text).then(onRefresh);
                            }
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Delete"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default KeywordsManager;
