
// ComfyUI API Service
// Handles communication with ComfyUI server for workflow execution and image generation

let COMFYUI_SERVER_URL = 'http://127.0.0.1:8188';

/**
 * Set the ComfyUI server URL (called from settings)
 */
export const setServerUrl = (url: string): void => {
    COMFYUI_SERVER_URL = url;
};

/**
 * Get the current ComfyUI server URL
 */
export const getServerUrl = (): string => {
    return COMFYUI_SERVER_URL;
};

/**
 * Upload an image file to ComfyUI server
 * @param file - The image file to upload
 * @returns The filename assigned by ComfyUI
 */
export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('overwrite', 'true');

    const response = await fetch(`${COMFYUI_SERVER_URL}/upload/image`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    const data = await response.json();
    return data.name;
};

/**
 * Queue a workflow prompt for execution
 * @param workflowJson - The workflow JSON object
 * @param prompt - The text prompt to use
 * @param imageFilename - Optional uploaded image filename
 * @returns The prompt ID for tracking execution
 */
export const queuePrompt = async (
    workflowJson: any,
    prompt: string,
    imageFilename?: string
): Promise<string> => {
    // Clone the workflow to avoid mutating the original
    const workflow = JSON.parse(JSON.stringify(workflowJson));

    // Update prompt in the workflow
    // This assumes a common structure - adjust based on your actual workflow
    for (const nodeId in workflow) {
        const node = workflow[nodeId];

        // Look for text prompt nodes (common class_type values)
        if (node.class_type === 'CLIPTextEncode' ||
            node.class_type === 'PromptNode' ||
            node.class_type === 'Text') {
            if (node.inputs && 'text' in node.inputs) {
                node.inputs.text = prompt;
            }
        }

        // Look for image loader nodes
        if (imageFilename && (
            node.class_type === 'LoadImage' ||
            node.class_type === 'ImageLoader')) {
            if (node.inputs && 'image' in node.inputs) {
                node.inputs.image = imageFilename;
            }
        }
    }

    const payload = {
        prompt: workflow,
        client_id: generateClientId(),
    };

    const response = await fetch(`${COMFYUI_SERVER_URL}/prompt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to queue prompt: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prompt_id;
};

/**
 * Get execution history for a prompt
 * @param promptId - The prompt ID to check
 * @returns The history data including outputs
 */
export const getHistory = async (promptId: string): Promise<any> => {
    const response = await fetch(`${COMFYUI_SERVER_URL}/history/${promptId}`);

    if (!response.ok) {
        throw new Error(`Failed to get history: ${response.statusText}`);
    }

    const data = await response.json();
    return data[promptId];
};

/**
 * Download a generated image from ComfyUI
 * @param filename - The image filename
 * @param subfolder - The subfolder path
 * @param type - The file type (usually 'output')
 * @returns The image as a Blob
 */
export const getImage = async (
    filename: string,
    subfolder: string = '',
    type: string = 'output'
): Promise<Blob> => {
    const params = new URLSearchParams({
        filename,
        subfolder,
        type,
    });

    const response = await fetch(`${COMFYUI_SERVER_URL}/view?${params}`);

    if (!response.ok) {
        throw new Error(`Failed to get image: ${response.statusText}`);
    }

    return await response.blob();
};

/**
 * Poll for workflow execution completion
 * @param promptId - The prompt ID to monitor
 * @param maxAttempts - Maximum polling attempts
 * @param intervalMs - Polling interval in milliseconds
 * @returns The completed history data
 */
export const pollForCompletion = async (
    promptId: string,
    maxAttempts: number = 60,
    intervalMs: number = 1000
): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
        const history = await getHistory(promptId);

        if (history && history.outputs) {
            return history;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Workflow execution timed out');
};

/**
 * Extract the first generated image URL from history
 * @param history - The execution history
 * @returns The image data URL or null
 */
export const extractImageFromHistory = async (history: any): Promise<string | null> => {
    if (!history || !history.outputs) {
        return null;
    }

    // Find the first output node with images
    for (const nodeId in history.outputs) {
        const output = history.outputs[nodeId];

        if (output.images && output.images.length > 0) {
            const imageInfo = output.images[0];
            const blob = await getImage(
                imageInfo.filename,
                imageInfo.subfolder || '',
                imageInfo.type || 'output'
            );

            return URL.createObjectURL(blob);
        }
    }

    return null;
};

/**
 * Load a workflow JSON file
 * @param workflowName - The workflow filename
 * @returns The workflow JSON object
 */
export const loadWorkflow = async (workflowName: string): Promise<any> => {
    // For now, we'll fetch from a local workflows directory
    // Adjust the path based on your project structure
    const response = await fetch(`/workflows/${workflowName}`);

    if (!response.ok) {
        throw new Error(`Failed to load workflow: ${workflowName}`);
    }

    return await response.json();
};

/**
 * Get list of available workflows from the workflows directory
 * @returns Array of workflow filenames
 */
export const getAvailableWorkflows = async (): Promise<string[]> => {
    try {
        // Since we can't list directory contents directly in the browser,
        // we'll try to fetch a manifest file or use a predefined list
        // For now, we'll attempt to fetch common workflow files
        const commonWorkflows = [
            'SDXL_Image_Enhancer_v1.json',
            'SDXL_Image_Enhancer_v4.json',
            'Text_to_Video_StableVideo.json',
            'ControlNet_Canny_Face.json',
        ];

        const availableWorkflows: string[] = [];

        // Try to fetch each workflow to see if it exists
        for (const workflow of commonWorkflows) {
            try {
                const response = await fetch(`/workflows/${workflow}`, { method: 'HEAD' });
                if (response.ok) {
                    availableWorkflows.push(workflow);
                }
            } catch {
                // Workflow doesn't exist, skip it
            }
        }

        return availableWorkflows;
    } catch (error) {
        console.error('Failed to get available workflows:', error);
        return [];
    }
};

/**
 * Generate a unique client ID for ComfyUI
 */
const generateClientId = (): string => {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
