import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: true,
    },
    plugins: [
      react(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use('/api/keywords', async (req, res, next) => {
            const fs = await import('fs');
            const keywordsPath = path.resolve(__dirname, 'keywords.json');

            if (req.method === 'GET') {
              if (fs.existsSync(keywordsPath)) {
                const data = fs.readFileSync(keywordsPath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
              } else {
                // Create default empty file
                fs.writeFileSync(keywordsPath, '{}', 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end('{}');
              }
              return;
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  // Validate JSON
                  JSON.parse(body);
                  fs.writeFileSync(keywordsPath, body, 'utf-8');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true }));
                } catch (e) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
              });
              return;
            }

            next();
          });

          // Workflow Rename Endpoint
          server.middlewares.use('/api/workflows/rename', async (req, res, next) => {
            const fs = await import('fs');
            const path = await import('path');
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const { oldName, newName } = JSON.parse(body);
                  // Validate filenames to prevent traversal
                  if (!oldName || !newName || oldName.includes('/') || newName.includes('/') || oldName.includes('\\') || newName.includes('\\')) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Invalid filenames' }));
                    return;
                  }

                  const workflowsDir = path.resolve(__dirname, 'public/workflows');
                  const oldPath = path.join(workflowsDir, oldName);
                  // Ensure extension is .json
                  const safeNewName = newName.endsWith('.json') ? newName : newName + '.json';
                  const newPath = path.join(workflowsDir, safeNewName);

                  if (fs.existsSync(oldPath)) {
                    if (fs.existsSync(newPath) && oldName !== safeNewName) {
                      res.statusCode = 409;
                      res.end(JSON.stringify({ error: 'Target file already exists' }));
                      return;
                    }
                    fs.renameSync(oldPath, newPath);

                    // Update manifest.json
                    const manifestPath = path.resolve(workflowsDir, 'manifest.json');
                    if (fs.existsSync(manifestPath)) {
                      try {
                        const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
                        const manifest = JSON.parse(manifestContent);
                        if (manifest.workflows && Array.isArray(manifest.workflows)) {
                          const index = manifest.workflows.indexOf(oldName);
                          if (index !== -1) {
                            manifest.workflows[index] = safeNewName;
                            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
                          }
                        }
                      } catch (e) {
                        console.error('Failed to update manifest.json', e);
                      }
                    }

                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true, newName: safeNewName }));
                  } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Source file not found' }));
                  }
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Rename failed' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
