import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Node >= 20.12 puede leer .env sin dependencias. Si no existe, se usan
// variables del sistema (por ejemplo en produccion o en las pruebas).
try {
  const envFile = path.join(root, '.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
} catch {
  // Un .env ausente o invalido no debe impedir el arranque.
}

const dbPath = path.resolve(root, process.env.DB_PATH || './data/campuscode.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');

export const isProduction = process.env.NODE_ENV === 'production';

export function initDatabase() {
  const schema = fs.readFileSync(path.join(root, 'db', 'schema.sql'), 'utf8');
  db.exec(schema);
}

export async function ensureSeed() {
  const row = db.prepare('SELECT COUNT(*) AS total FROM users').get();
  if (Number(row.total) === 0) {
    const { seedDatabase } = await import('./seed-data.js');
    seedDatabase(db);
    console.log('[campuscode] Datos de demostracion cargados.');
  }
}

export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export { dbPath };
