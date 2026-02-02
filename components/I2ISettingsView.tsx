import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import * as ComfyUI from '../services/comfyui';

const I2ISettingsView: React.FC = () => {
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
        // Clean up empty strings to keep settings clean? Or keep explicitly empty?
        // Keeping it is fine.
        updateSettings({ workflowPrompts: updatedPrompts });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark/50 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-[800px] mx-auto flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold">I2I Workflow Defaults</h2>
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
                                <div key={workflow} className="bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 truncate" title={workflow}>
                                        {workflow}
                                    </label>
                                    <textarea
                                        value={settings.workflowPrompts?.[workflow] || ''}
                                        onChange={(e) => handlePromptChange(workflow, e.target.value)}
                                        placeholder="Enter default positive prompt..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none min-h-[80px] resize-y"
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default I2ISettingsView;
