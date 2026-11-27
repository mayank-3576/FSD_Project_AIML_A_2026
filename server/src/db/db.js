import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const sqliteDbPath = path.join(dbDir, 'placement_tracker.db');

let pgPool = null;
let sqliteDb = null;
let activeEngine = 'sqlite'; // 'postgres' or 'sqlite'

// Initialize SQLite connection
function initSqlite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqliteDbPath, (err) => {
      if (err) {
        return reject(err);
      }
      db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
        if (pragmaErr) return reject(pragmaErr);
        resolve(db);
      });
    });
  });
}

// Convert PostgreSQL style $1, $2 query to SQLite ? query
function convertQueryForSqlite(sql, params = []) {
  let paramIndex = 0;
  // Replace $1, $2 with ?
  const sqliteSql = sql.replace(/\$(\d+)/g, () => '?');
  return { sql: sqliteSql, params };
}

export async function initDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const pool = new pg.Pool({
        connectionString: dbUrl,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });
      // Test connection
      await pool.query('SELECT 1');
      pgPool = pool;
      activeEngine = 'postgres';
      console.log('✅ Connected to PostgreSQL database');
      return { engine: 'postgres' };
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed, falling back to local SQLite:', err.message);
    }
  }

  // SQLite fallback
  sqliteDb = await initSqlite();
  activeEngine = 'sqlite';
  console.log(`✅ Using SQLite database at: ${sqliteDbPath}`);
  return { engine: 'sqlite' };
}

export async function query(text, params = []) {
  if (activeEngine === 'postgres') {
    return await pgPool.query(text, params);
  }

  if (!sqliteDb) {
    sqliteDb = await initSqlite();
  }

  return new Promise((resolve, reject) => {
    const { sql, params: sqliteParams } = convertQueryForSqlite(text, params);
    const trimmed = sql.trim();
    const isSelect = /^SELECT/i.test(trimmed);

    if (isSelect) {
      sqliteDb.all(sql, sqliteParams, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
      });
    } else {
      sqliteDb.run(sql, sqliteParams, function (err) {
        if (err) return reject(err);
        // If RETURNING is requested in non-select, simulate it if possible
        if (/RETURNING/i.test(sql) && this.lastID) {
          // fetch inserted row
          const match = sql.match(/INTO\s+([a-zA-Z0-9_]+)/i);
          const table = match ? match[1] : null;
          if (table) {
            // Get primary key column or default to rowid
            sqliteDb.get(`SELECT * FROM ${table} WHERE rowid = ?`, [this.lastID], (fetchErr, row) => {
              if (fetchErr) return reject(fetchErr);
              resolve({
                rows: row ? [row] : [],
                rowCount: this.changes || 1,
                lastID: this.lastID,
              });
            });
            return;
          }
        }
        resolve({
          rows: [],
          rowCount: this.changes || 0,
          lastID: this.lastID,
        });
      });
    }
  });
}

export function getEngine() {
  return activeEngine;
}

export default {
  initDb,
  query,
  getEngine,
};
