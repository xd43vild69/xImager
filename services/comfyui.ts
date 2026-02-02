// ComfyUI API Service (via Backend Proxy)
// Frontend NEVER talks directly to ComfyUI (:8188)

let COMFY_PROXY_URL = import.meta.env.VITE_COMFY_API_URL || 'http://127.0.0.1:8188/api/comfy';

/**
 * Set proxy base URL (normally not needed unless you change it)
 */
export const setServerUrl = (url: string): void => {
    COMFY_PROXY_URL = url.replace(/\/+$/, '');
    console.log('[ComfyUI] Proxy URL set to:', COMFY_PROXY_URL);
};

/**
 * Get current proxy URL
 */
export const getServerUrl = (): string => {
    return COMFY_PROXY_URL;
};

/* ===============================
   UPLOAD IMAGE
================================ */
export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('overwrite', 'true');

    const response = await fetch(`${COMFY_PROXY_URL}/upload/image`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    const data = await response.json();
    return data.name;
};

/* ===============================
   QUEUE PROMPT
================================ */
export const queuePrompt = async (
    workflowJson: any,
    prompt: string,
    images?: string | string[]
): Promise<string> => {
    const workflow = JSON.parse(JSON.stringify(workflowJson));

    // Identify image nodes
    const imageNodes: any[] = [];
    for (const nodeId in workflow) {
        const node = workflow[nodeId];
        if (
            node.class_type === 'LoadImage' ||
            node.class_type === 'ImageLoader'
        ) {
            imageNodes.push({ id: nodeId, node });
        }
    }

    // Sort nodes to ensure deterministic assignment order (optional but recommended)
    // Here we use simple iteration order if IDs are numeric strings "1", "2", etc
    imageNodes.sort((a, b) => {
        const idA = parseInt(a.id);
        const idB = parseInt(b.id);
        return !isNaN(idA) && !isNaN(idB) ? idA - idB : a.id.localeCompare(b.id);
    });

    // Assign images
    if (images) {
        if (Array.isArray(images)) {
            // Assign sequentially
            images.forEach((img, index) => {
                if (index < imageNodes.length && imageNodes[index].node.inputs?.image !== undefined) {
                    imageNodes[index].node.inputs.image = img;
                }
            });
        } else {
            // Legacy behavior: Assign single image to ALL image nodes (or just the first?)
            // To maintain compatibility with existing functionality where we likely only had 1 node
            // or wanted the same ref image everywhere:
            imageNodes.forEach((item) => {
                if (item.node.inputs?.image !== undefined) {
                    item.node.inputs.image = images;
                }
            });
        }
    }

    // Apply text prompt
    for (const nodeId in workflow) {
        const node = workflow[nodeId];
        if (
            node.class_type === 'CLIPTextEncode' ||
            node.class_type === 'PromptNode' ||
            node.class_type === 'Text'
        ) {
            if (node.inputs?.text !== undefined) {
                node.inputs.text = prompt;
            }
        }
    }

    const payload = {
        prompt: workflow,
        client_id: generateClientId(),
    };

    const response = await fetch(`${COMFY_PROXY_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to queue prompt: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prompt_id;
};

/* ===============================
   HISTORY
================================ */
export const getHistory = async (promptId: string): Promise<any> => {
    const response = await fetch(`${COMFY_PROXY_URL}/history/${promptId}`);

    if (!response.ok) {
        throw new Error(`Failed to get history: ${response.statusText}`);
    }

    const data = await response.json();
    return data[promptId];
};

/* ===============================
   POLLING
================================ */
export const pollForCompletion = async (
    promptId: string,
    maxAttempts: number = 60,
    intervalMs: number = 1000
): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
        const history = await getHistory(promptId);

        if (history?.outputs) {
            return history;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Workflow execution timed out');
};

/* ===============================
   IMAGE EXTRACTION
================================ */
export const extractImageFromHistory = async (
    history: any
): Promise<string | null> => {
    if (!history?.outputs) return null;

    for (const nodeId in history.outputs) {
        const output = history.outputs[nodeId];

        if (output.images?.length) {
            const img = output.images[0];

            // NOTE: this URL still points to proxy, not ComfyUI directly
            return `${COMFY_PROXY_URL.replace(
                '/api/comfy',
                ''
            )}/view?filename=${encodeURIComponent(
                img.filename
            )}&subfolder=${encodeURIComponent(
                img.subfolder || ''
            )}&type=${img.type || 'output'}`;
        }
    }

    return null;
};

/* ===============================
   WORKFLOWS
================================ */
export const loadWorkflow = async (workflowName: string): Promise<any> => {
    const response = await fetch(`/workflows/${workflowName}`);

    if (!response.ok) {
        throw new Error(`Failed to load workflow: ${workflowName}`);
    }

    return await response.json();
};

export const getAvailableWorkflows = async (): Promise<string[]> => {
    try {
        // Fetch from dynamic API first
        const response = await fetch('/api/workflows');
        if (response.ok) {
            const data = await response.json();
            return data.workflows || [];
        }

        // Fallback to manifest if API fails (unlikely in dev)
        const manifestRes = await fetch('/workflows/manifest.json');
        if (manifestRes.ok) {
            const manifest = await manifestRes.json();
            return manifest.workflows || [];
        }
        return [];
    } catch {
        return [];
    }
};

/* ===============================
    TEST CONNECTION
   =============================== */
export const testConnection = async (): Promise<{ success: boolean; version?: string; error?: string }> => {
    console.log('[ComfyUI] Testing connection to:', COMFY_PROXY_URL);
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${COMFY_PROXY_URL}/system_stats`, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('[ComfyUI] Connection response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('[ComfyUI] Connection successful, version:', data.version);
        return {
            success: true,
            version: data.version || '1.4.2',
        };
    } catch (error) {
        console.error('[ComfyUI] Connection failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed',
        };
    }
};

/* ===============================
    CLIENT ID
   =============================== */
const generateClientId = (): string => {
    return `client_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
};

// Rename a workflow file
export const renameWorkflow = async (oldName: string, newName: string): Promise<{ success: boolean; newName?: string; error?: string }> => {
    try {
        const res = await fetch('/api/workflows/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName, newName })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Rename failed');
        }
        return data;
    } catch (error) {
        console.error('Failed to rename workflow:', error);
        return { success: false, error: String(error) };
    }
};
