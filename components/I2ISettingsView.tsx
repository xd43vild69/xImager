import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import * as ComfyUI from '../services/comfyui';

interface I2ISettingsViewProps {
    onWorkflowsChange?: () => void;
}

const I2ISettingsView: React.FC<I2ISettingsViewProps> = ({ onWorkflowsChange }) => {
    const { settings, updateSettings } = useSettings();
    const [availableWorkflows, setAvailableWorkflows] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWorkflows = async () => {
            try {
                const workflows = await ComfyUI.getAvailableWorkflows();
                setAvailableWorkflows(workflows);
            } catch (error) {
                console.error('Failed to load workflows', error);
            } finally {
                setLoading(false);
            }
        };
        loadWorkflows();
    }, []);

    const handlePromptChange = (workflowName: string, prompt: string) => {
        const updatedPrompts = {
            ...settings.workflowPrompts,
            [workflowName]: prompt
        };
        updateSettings({ workflowPrompts: updatedPrompts });
    };

    const handleRenameSuccess = (oldName: string, newName: string) => {
        // Migrate settings
        const currentPrompt = settings.workflowPrompts?.[oldName];
        let newPrompts = { ...settings.workflowPrompts };

        if (currentPrompt) {
            newPrompts[newName] = currentPrompt;
            delete newPrompts[oldName];
        } else {
            // Even if no prompt, ensure we clean up old key if it existed as empty
            if (newPrompts[oldName] !== undefined) {
                delete newPrompts[oldName];
            }
        }

        updateSettings({ workflowPrompts: newPrompts });

        // Refresh list locally
        const loadWorkflows = async () => {
            const wfs = await ComfyUI.getAvailableWorkflows();
            setAvailableWorkflows(wfs);
            // Notify parent to refresh globally
            onWorkflowsChange?.();
        };
        loadWorkflows();
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark/50 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-[800px] mx-auto flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold">Workflow Settings</h2>
                        <p className="text-slate-500">
                            Configure default positive prompts for each workflow.
                            These will be automatically prepended to your prompt when you select the workflow.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="text-center py-10 text-slate-400">Loading workflows...</div>
                        ) : availableWorkflows.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">No workflows found.</div>
                        ) : (
                            availableWorkflows.map(workflow => (
                                <WorkflowSettingsItem
                                    key={workflow}
                                    workflow={workflow}
                                    prompt={settings.workflowPrompts?.[workflow] || ''}
                                    onPromptChange={(prompt) => handlePromptChange(workflow, prompt)}
                                    onRenameSuccess={handleRenameSuccess}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface WorkflowSettingsItemProps {
    workflow: string;
    prompt: string;
    onPromptChange: (prompt: string) => void;
    onRenameSuccess: (oldName: string, newName: string) => void;
}

const WorkflowSettingsItem: React.FC<WorkflowSettingsItemProps> = ({ workflow, prompt, onPromptChange, onRenameSuccess }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(workflow);
    const [isRenaming, setIsRenaming] = useState(false);

    const handleSaveName = async () => {
        if (!newName.trim() || newName === workflow) {
            setIsEditingName(false);
            return;
        }

        setIsRenaming(true);
        const result = await ComfyUI.renameWorkflow(workflow, newName);
        setIsRenaming(false);

        if (result.success && result.newName) {
            setIsEditingName(false);
            onRenameSuccess(workflow, result.newName);
        } else {
            alert(result.error || 'Rename failed');
        }
    };

    return (
        <div className="bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm group">
            <div className="flex items-center justify-between mb-2">
                {isEditingName ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') setIsEditingName(false);
                            }}
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-1 text-sm font-bold flex-1 focus:ring-2 focus:ring-primary outline-none"
                            autoFocus
                        />
                        <button
                            onClick={handleSaveName}
                            disabled={isRenaming}
                            className="text-green-500 hover:bg-green-50 rounded p-1"
                            title="Save"
                        >
                            <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsEditingName(false);
                                setNewName(workflow);
                            }}
                            className="text-slate-400 hover:bg-slate-100 rounded p-1"
                            title="Cancel"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 truncate" title={workflow}>
                            {workflow}
                        </label>
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            title="Rename workflow file"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                    </div>
                )}
            </div>
            <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Enter default positive prompt..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none min-h-[80px] resize-y"
            />
        </div>
    );
};

export default I2ISettingsView;
