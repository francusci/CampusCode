import { createApp } from './app.js';
import { db, ensureSeed, initDatabase } from './db.js';

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.JWT_SECRET) {
  console.error('[campuscode] Falta JWT_SECRET. El servidor no arranca en producción sin un secreto propio.');
  process.exit(1);
}

initDatabase();
await ensureSeed();

const app = createApp();
const port = Number(process.env.PORT || 4000);

const server = app.listen(port, () => {
  const publicOrigin = (process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || '')
    .split(',')[0]
    .trim();
  console.log(`[campuscode] API escuchando en http://localhost:${port}`);
  if (isProduction) {
    console.log(`[campuscode] Aplicación: ${publicOrigin || `http://localhost:${port}`}`);
  } else {
    console.log('[campuscode] Interfaz de desarrollo: http://localhost:5173');
    const demoPassword = process.env.DEMO_PASSWORD || 'Campus123!';
    console.log(`[campuscode] Cuentas demo: estudiante@campuscode.co · empresa@campuscode.co · admin@campuscode.co (${demoPassword})`);
  }
});

function shutdown(signal) {
  console.log(`\n[campuscode] Cerrando (${signal})...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
