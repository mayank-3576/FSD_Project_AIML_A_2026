import app from './app.js';
import { config } from './config/env.js';
import { initDb } from './db/db.js';
import { runMigrations } from './db/migrate.js';

async function startServer() {
  try {
    await initDb();
    await runMigrations();

    app.listen(config.port, () => {
      console.log(`
======================================================================
🎓 ABES Engineering College (College Code: 032)
🚀 Placement Tracker — Campus Recruitment Management System
📡 REST API Server listening on http://localhost:${config.port}
🔗 Health Check: http://localhost:${config.port}/api/health
📚 Base API URL: http://localhost:${config.port}/api/v1
======================================================================
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
