import React, { useEffect, useState } from 'react';
import * as ComfyUI from '../services/comfyui';
import { extractCurrentDimensions, ImageSettings } from '../utilities/patching';

interface ImageSettingsModalProps {
    selectedWorkflow: string;
    onClose: () => void;
    currentSettings?: ImageSettings;
    onSettingsChange: (settings: ImageSettings) => void;
}

const ImageSettingsModal: React.FC<ImageSettingsModalProps> = ({
    selectedWorkflow,
    onClose,
    currentSettings,
    onSettingsChange,
}) => {
    const [width, setWidth] = useState<number>(512);
    const [height, setHeight] = useState<number>(512);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial settings: either from props (memory) or from workflow (fresh)
    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                if (currentSettings) {
                    if (currentSettings.width) setWidth(currentSettings.width);
                    if (currentSettings.height) setHeight(currentSettings.height);
                    setIsLoading(false);
                } else {
                    const workflow = await ComfyUI.loadWorkflow(selectedWorkflow);
                    const current = extractCurrentDimensions(workflow);
                    const w = current.width || 512;
                    const h = current.height || 512;
                    setWidth(w);
                    setHeight(h);

                    // Initial sync to parent so it matches what we see
                    onSettingsChange({ width: w, height: h });
                }
            } catch (error) {
                console.error('Failed to load workflow for settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (selectedWorkflow) {
            loadSettings();
        }
    }, [selectedWorkflow, currentSettings, onSettingsChange]);

    const handleBlur = () => {
        onSettingsChange({ width, height });
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) setWidth(val);
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) setHeight(val);
    };

    return (
        <div className="flex flex-col gap-6 p-2 w-[400px]">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Image Settings</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Configure temporary resolution overrides for this session.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <span className="material-symbols-outlined animate-spin text-neutral-400">progress_activity</span>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Width</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step={64}
                                min={64}
                                value={width}
                                onChange={handleWidthChange}
                                onBlur={handleBlur}
                                className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg px-3 py-2 text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-center"
                            />
                            <span className="text-xs text-neutral-400 font-mono">px</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Height</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step={64}
                                min={64}
                                value={height}
                                onChange={handleHeightChange}
                                onBlur={handleBlur}
                                className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg px-3 py-2 text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-center"
                            />
                            <span className="text-xs text-neutral-400 font-mono">px</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-3 mt-2">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-95"
                >
                    Close
                </button>
            </div>
        </div>
    );
};
export default ImageSettingsModal;
