#!/usr/bin/env node

/**
 * Workflow Manifest Generator
 * Scans public/workflows directory and generates a manifest.json file
 * listing all available workflow files
 */

import { readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKFLOWS_DIR = join(__dirname, '../public/workflows');
const OUTPUT_FILE = join(WORKFLOWS_DIR, 'manifest.json');

try {
    // Read all files in workflows directory
    const files = readdirSync(WORKFLOWS_DIR);

    // Filter only .json files (excluding manifest.json itself)
    const workflows = files
        .filter(file => file.endsWith('.json') && file !== 'manifest.json')
        .sort(); // Sort alphabetically

    // Create manifest object
    const manifest = {
        workflows,
        generatedAt: new Date().toISOString(),
        count: workflows.length
    };

    // Write manifest file
    writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

    console.log(`✅ Workflow manifest generated successfully!`);
    console.log(`   Found ${workflows.length} workflow(s):`);
    workflows.forEach(w => console.log(`   - ${w}`));

} catch (error) {
    console.error('❌ Error generating workflow manifest:', error);
    process.exit(1);
}
