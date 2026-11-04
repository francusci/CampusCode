import { db, initDatabase } from './db.js';
import { seedDatabase } from './seed-data.js';

initDatabase();
const force = process.argv.includes('--reset');
const count = db.prepare('SELECT COUNT(*) AS total FROM users').get();

if (Number(count.total) > 0 && !force) {
  console.log(`La base de datos ya contiene ${count.total} usuarios. Usa "npm run seed:reset" para reiniciarla.`);
  process.exit(0);
}

seedDatabase(db);
const summary = db
  .prepare(
    `SELECT
      (SELECT COUNT(*) FROM careers) AS carreras,
      (SELECT COUNT(*) FROM subjects) AS materias,
      (SELECT COUNT(*) FROM exercises) AS ejercicios,
      (SELECT COUNT(*) FROM challenges) AS retos,
      (SELECT COUNT(*) FROM users) AS usuarios`,
  )
  .get();

console.log('[campuscode] Datos de demostración insertados:');
console.log(`  Carreras: ${summary.carreras}`);
console.log(`  Materias: ${summary.materias}`);
console.log(`  Ejercicios: ${summary.ejercicios}`);
console.log(`  Retos: ${summary.retos}`);
console.log(`  Usuarios: ${summary.usuarios}`);
console.log('\nCuentas de demostración (contraseña Campus123!):');
console.log('  estudiante@campuscode.co');
console.log('  empresa@campuscode.co');
console.log('  admin@campuscode.co');
