import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
    comfyUIServerUrl: string;
    workflowDirectory: string;
    inputDirectory: string;
    outputDirectory: string;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    saveSettings: () => void;
}

const defaultSettings: Settings = {
    comfyUIServerUrl: 'http://127.0.0.1:8188',
    workflowDirectory: 'C:/Users/Admin/Documents/AI-Workflows',
    inputDirectory: 'D:/Data/AI-Input',
    outputDirectory: 'D:/Generations/Comfy-Output',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'xImager_settings';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        // Load settings from localStorage on initialization
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...defaultSettings, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error);
        }
        return defaultSettings;
    });

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const saveSettings = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
        }
    };

    // Auto-save settings when they change (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveSettings();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, saveSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
