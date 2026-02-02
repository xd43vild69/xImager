import React, { useState, useRef, useEffect } from 'react';
import { getSuggestions, KeywordStat } from '../services/promptHistory';

interface PromptInputProps {
    value: string;
    onChange: (value: string) => void;
    onEnter?: () => void;
}

const PromptInput = React.forwardRef<HTMLTextAreaElement, PromptInputProps>(({ value, onChange, onEnter }, ref) => {
    const [suggestions, setSuggestions] = useState<KeywordStat[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [cursorPos, setCursorPos] = useState(0);

    // We use the forwarded ref if provided, but we also rely on internal state for selection range.
    // Actually onSelect gives us the cursor pos. We don't strictly need the ref internally 
    // unless we want to manipulate it directly, but we do need to attach it to the textarea.

    const getCurrentToken = (text: string, position: number) => {
        const textBefore = text.slice(0, position);
        // Find last delimiter (comma or newline)
        const lastDelimiterIndex = Math.max(
            textBefore.lastIndexOf(','),
            textBefore.lastIndexOf('\n')
        );

        const startIndex = lastDelimiterIndex === -1 ? 0 : lastDelimiterIndex + 1;

        return {
            text: textBefore.slice(startIndex),
            startIndex
        };
    };

    useEffect(() => {
        const { text } = getCurrentToken(value, cursorPos);
        const cleanText = text.trimStart();

        if (cleanText.length >= 3) {
            const matches = getSuggestions(cleanText);
            if (matches.length > 0) {
                setSuggestions(matches);
                setSelectedIndex(0);
                setShowSuggestions(true);
                return;
            }
        }
        setShowSuggestions(false);
    }, [value, cursorPos]);

    const handleSelect = (keyword: string) => {
        const { text, startIndex } = getCurrentToken(value, cursorPos);
        const beforeToken = value.slice(0, startIndex);

        // Ensure space after comma if previous token exists
        const prefix = startIndex === 0 ? '' : (value[startIndex - 1] === ' ' ? '' : ' ');

        // Insert keyword + comma
        const newValue = beforeToken + prefix + keyword + ', ';

        const suffix = value.slice(cursorPos);
        onChange(newValue + suffix);

        setShowSuggestions(false);

        // We rely on the user to keep typing or the parent to maintain focus.
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                handleSelect(suggestions[selectedIndex].text);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        } else {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                onEnter?.();
            }
        }
    };

    return (
        <div className="relative w-full h-full group">
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setCursorPos(e.target.selectionStart);
                }}
                onSelect={(e) => setCursorPos(e.currentTarget.selectionStart)}
                onKeyDown={handleKeyDown}
                placeholder="Enter positive prompt (comma separated)..."
                className="w-full h-full bg-neutral-100 dark:bg-panel-dark border border-neutral-200 dark:border-border-dark rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all hover:border-neutral-300 dark:hover:border-neutral-600 placeholder-neutral-400 resize-y align-top min-h-[40px] max-h-[500px] leading-relaxed whitespace-pre-wrap"
                style={{ minHeight: '40px' }}
            />
            <span className="material-symbols-outlined absolute right-3 top-2 text-neutral-400 pointer-events-none text-sm group-focus-within:text-primary">
                edit
            </span>

            {showSuggestions && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-panel-dark border border-neutral-200 dark:border-border-dark rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                        <div
                            key={s.text}
                            className={`px-3 py-2 text-xs cursor-pointer flex justify-between items-center ${i === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-neutral-50 dark:hover:bg-white/5'}`}
                            onClick={() => handleSelect(s.text)}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <span className="font-medium">{s.text}</span>
                            <span className="text-[10px] text-neutral-400 opacity-75">{s.count} uses</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default PromptInput;
