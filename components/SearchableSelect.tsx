import React, { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string; // Additional classes for trigger
    disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter options
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    // Find selected label
    const selectedLabel = useMemo(() => {
        return options.find(opt => opt.value === value)?.label || value || placeholder;
    }, [options, value, placeholder]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
            {/* Trigger Button */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex items-center justify-between cursor-pointer ${className}`}
            >
                <span className="truncate flex-1">{selectedLabel}</span>
                <span className="material-symbols-outlined text-slate-400 text-base">
                    unfold_more
                </span>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-panel-dark border border-slate-200 dark:border-border-dark rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[400px]">
                    {/* Search Input */}
                    <div className="p-2 border-b border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-black/20 sticky top-0 z-10">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded px-2 border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-1.5 outline-none"
                                placeholder="Filter..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1 p-1">
                        {options.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs">No options available</div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors flex items-center justify-between
                                        ${option.value === value
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }
                                    `}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.value === value && (
                                        <span className="material-symbols-outlined text-sm">check</span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-400 text-xs">
                                No matching workflows found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
