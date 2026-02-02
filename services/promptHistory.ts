
export interface KeywordStat {
    text: string;
    count: number;
    lastUsed: number;
}

// In-memory cache to avoid constant fetching during typing
let keywordCache: Record<string, KeywordStat> = {};
let isLoaded = false;

// Load all history from server
export const loadKeywordHistory = async (): Promise<void> => {
    try {
        const res = await fetch('/api/keywords');
        if (res.ok) {
            keywordCache = await res.json();
            isLoaded = true;
        }
    } catch (e) {
        console.error('Failed to load keyword history', e);
    }
};

export const getKeywordHistory = (): Record<string, KeywordStat> => {
    if (!isLoaded) {
        // Trigger load if not loaded, but return empty for now to avoid blocking sync calls
        loadKeywordHistory();
    }
    return keywordCache;
};

// Get suggestions based on partial text
export const getSuggestions = (partial: string): KeywordStat[] => {
    if (!partial || partial.length < 3) return [];

    const history = getKeywordHistory();
    const lowerPartial = partial.toLowerCase();

    return Object.values(history)
        .filter(item => item.text.toLowerCase().startsWith(lowerPartial))
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return b.lastUsed - a.lastUsed;
        })
        .slice(0, 10);
};

// Record a full prompt string (comma separated)
export const recordPromptKeywords = async (prompt: string) => {
    if (!prompt || !prompt.trim()) return;

    // Ensure we have latest data
    await loadKeywordHistory();

    const history = { ...keywordCache };
    const parts = prompt.split(',');
    const now = Date.now();
    let changed = false;

    parts.forEach(part => {
        const clean = part.trim();
        if (!clean) return;

        if (history[clean]) {
            history[clean].count += 1;
            history[clean].lastUsed = now;
        } else {
            history[clean] = {
                text: clean,
                count: 1,
                lastUsed: now
            };
        }
        changed = true;
    });

    if (changed) {
        try {
            const res = await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(history, null, 2)
            });
            if (res.ok) {
                keywordCache = history;
            }
        } catch (e) {
            console.error('Failed to save keyword history', e);
        }
    }
};

// Helper to save history to server
const saveHistory = async (history: Record<string, KeywordStat>) => {
    try {
        const res = await fetch('/api/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(history, null, 2)
        });
        if (res.ok) {
            keywordCache = history;
        }
    } catch (e) {
        console.error('Failed to save keyword history', e);
    }
};

// Update a keyword (rename or change count)
export const updateKeyword = async (oldText: string, newText: string, newCount: number) => {
    await loadKeywordHistory();
    const history = { ...keywordCache };
    const now = Date.now();

    // If renaming
    if (oldText !== newText) {
        if (history[newText]) {
            // Merge
            // The requirement says: "Fusionar ambas keywords. Sumar count. Conservar el lastUsed más reciente."
            // Let's assume newCount is the intended count for the 'old' entity.
            // If merging, we usually sum the existing count of target + intended count of source.
            // But if user manually set count to X, maybe they want X.
            // "Sumar count" implies adding the *source's* count to the *target's* count.
            // But we might have edited the source count too.
            // Let's simplicity: if merging, existing target count + newCount.

            history[newText].count += newCount;
            history[newText].lastUsed = Math.max(history[newText].lastUsed, history[oldText]?.lastUsed || 0);
        } else {
            // Rename
            history[newText] = {
                text: newText,
                count: newCount,
                lastUsed: history[oldText]?.lastUsed || now
            };
        }
        delete history[oldText];
    } else {
        // Just updating count usually
        if (history[oldText]) {
            history[oldText].count = newCount;
        }
    }

    await saveHistory(history);
};

export const deleteKeyword = async (text: string) => {
    await loadKeywordHistory();
    const history = { ...keywordCache };
    if (history[text]) {
        delete history[text];
        await saveHistory(history);
    }
};

export const addKeyword = async (text: string, count: number) => {
    await loadKeywordHistory();
    const history = { ...keywordCache };
    const now = Date.now();

    if (history[text]) {
        // Already exists? requirement says "Fusionar" if rename, but for add? 
        // "crear inmediatamente". if exists, maybe just update?
        // Let's assume we overwrite or add to it.
        history[text].count += count;
        history[text].lastUsed = now; // Update last used
    } else {
        history[text] = {
            text,
            count,
            lastUsed: now
        };
    }
    await saveHistory(history);
};

// Initialize load
loadKeywordHistory();
