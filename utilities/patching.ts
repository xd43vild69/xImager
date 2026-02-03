export interface ImageSettings {
    width?: number;
    height?: number;
}

/**
 * Patches the workflow JSON with user-defined image settings.
 * Only applies overrides if the values are provided.
 * 
 * @param originalWorkflow The original workflow JSON object
 * @param settings The settings to apply (width, height)
 * @returns A new workflow object with the patches applied
 */
export function applyOverrides(originalWorkflow: any, settings: ImageSettings): any {
    if (!originalWorkflow || typeof originalWorkflow !== 'object') {
        return originalWorkflow;
    }

    // Deep clone to avoid mutating the original
    const updatedWorkflow = structuredClone(originalWorkflow);

    for (const nodeId in updatedWorkflow) {
        if (!Object.prototype.hasOwnProperty.call(updatedWorkflow, nodeId)) continue;

        const node = updatedWorkflow[nodeId];

        // Robust check for node structure
        if (!node || !node.class_type || !node._meta) continue;

        if (node.class_type === "PrimitiveInt") {
            const title = node._meta.title;

            // Check for Width
            if (title === "Width" && settings.width !== undefined && settings.width !== null) {
                if (!node.inputs) node.inputs = {};
                node.inputs.value = settings.width;
            }
            // Check for Height
            else if (title === "Height" && settings.height !== undefined && settings.height !== null) {
                if (!node.inputs) node.inputs = {};
                node.inputs.value = settings.height;
            }
        }
    }

    return updatedWorkflow;
}

/**
 * Extracts the current Width and Height from a workflow if available.
 * used for initializing the modal with current values.
 */
export function extractCurrentDimensions(workflow: any): ImageSettings {
    const settings: ImageSettings = { width: 512, height: 512 }; // Default falback

    if (!workflow || typeof workflow !== 'object') return settings;

    let foundWidth = false;
    let foundHeight = false;

    for (const nodeId in workflow) {
        const node = workflow[nodeId];
        if (!node || node.class_type !== "PrimitiveInt" || !node._meta) continue;

        const title = node._meta.title;
        const value = node.inputs?.value;

        if (title === "Width" && typeof value === 'number') {
            settings.width = value;
            foundWidth = true;
        } else if (title === "Height" && typeof value === 'number') {
            settings.height = value;
            foundHeight = true;
        }
    }

    // If not found, revert to 512 but we return what we found
    return settings;
}
