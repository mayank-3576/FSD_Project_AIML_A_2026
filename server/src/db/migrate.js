import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, query, getEngine } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  await initDb();
  const engine = getEngine();
  console.log(`Running migrations for engine: ${engine}...`);

  const schemaPath = path.join(__dirname, 'schema.sql');
  let sql = fs.readFileSync(schemaPath, 'utf8');

  if (engine === 'postgres') {
    // Adapt SQLite syntax to PostgreSQL
    sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    await query(sql);
  } else {
    // For SQLite, strip line comments and split by semicolon
    const cleanSql = sql
      .split('\n')
      .map((line) => {
        const commentIdx = line.indexOf('--');
        return commentIdx >= 0 ? line.substring(0, commentIdx) : line;
      })
      .join('\n');

    const statements = cleanSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await query(statement);
    }

    // Add safe column migrations for SQLite if upgrading from earlier schema
    const safeAddColumns = [
      { table: 'placement_drives', col: 'role_overview', type: 'TEXT' },
      { table: 'placement_drives', col: 'responsibilities', type: 'TEXT' },
      { table: 'placement_drives', col: 'must_have_skills', type: 'TEXT' },
      { table: 'placement_drives', col: 'good_to_have_skills', type: 'TEXT' },
      { table: 'placement_drives', col: 'bond_details', type: 'TEXT' },
      { table: 'placement_drives', col: 'perks', type: 'TEXT' },
      { table: 'placement_drives', col: 'ctc_breakdown', type: 'TEXT' },
      { table: 'student_profiles', col: 'resume_text', type: 'TEXT' },
      { table: 'applications', col: 'ats_score', type: 'NUMERIC(5,2)' },
      { table: 'training_scores', col: 'ai_interview_avg_score', type: 'NUMERIC(5,2) DEFAULT 0' },
      { table: 'training_scores', col: 'best_ats_score', type: 'NUMERIC(5,2) DEFAULT 0' },
      { table: 'training_scores', col: 'readiness_verdict', type: 'VARCHAR(50) DEFAULT "In Progress"' },
    ];

    for (const item of safeAddColumns) {
      try {
        await query(`ALTER TABLE ${item.table} ADD COLUMN ${item.col} ${item.type}`);
      } catch (e) {
        // Ignored if column already exists
      }
    }
  }

  console.log('✅ Migrations completed successfully');
}

// Allow CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
