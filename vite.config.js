import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Vite plugin: local API for saving CSV data to disk
function csvSavePlugin() {
  return {
    name: 'csv-save',
    configureServer(server) {
      const dataDir = path.resolve(process.cwd(), 'data');

      // GET /api/sessions — return all saved session JSON files
      server.middlewares.use('/api/sessions', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end(); return; }
        try {
          if (!fs.existsSync(dataDir)) { res.setHeader('Content-Type','application/json'); res.end('[]'); return; }
          const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
          const sessions = files.map(f => {
            try { return JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8')); }
            catch { return null; }
          }).filter(Boolean);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(sessions));
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
      });

      // POST /api/save-csv — append rows to per-course CSV
      server.middlewares.use('/api/save-csv', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const { courseCode, rows } = JSON.parse(body);
            if (!courseCode || !rows) throw new Error('Missing courseCode or rows');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const file = path.join(dataDir, `SECaT_${courseCode.replace(/\//g, '-')}.csv`);
            const header = 'Course,Question,Type,Response,Sentiment,Timestamp,SessionID\n';
            const exists = fs.existsSync(file);
            if (!exists) fs.writeFileSync(file, header);
            fs.appendFileSync(file, rows);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, file: `data/SECaT_${courseCode.replace(/\//g, '-')}.csv`, appended: !exists ? 'created' : 'appended' }));
          } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })); }
        });
      });

      // POST /api/save-session — save full session JSON
      server.middlewares.use('/api/save-session', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (!data.course?.code) throw new Error('Missing course.code');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const file = path.join(dataDir, `session_${data.course.code.replace(/\//g, '-')}_${ts}.json`);
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, file: file }));
          } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })); }
        });
      });

      // DELETE /api/clear-data — remove all data files
      server.middlewares.use('/api/clear-data', (req, res) => {
        if (req.method !== 'DELETE') { res.statusCode = 405; res.end(); return; }
        try {
          if (fs.existsSync(dataDir)) {
            fs.readdirSync(dataDir).forEach(f => fs.unlinkSync(path.join(dataDir, f)));
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, message: 'All data cleared' }));
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), csvSavePlugin()],
  server: {
    proxy: {
      '/local-llm': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local-llm/, '')
      }
    }
  }
})
