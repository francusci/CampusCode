import bcrypt from 'bcryptjs';
import { db } from '../server/db.js';

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Uso: node --env-file=.env.production scripts/set-password.mjs <correo> <contraseña>');
  process.exit(1);
}

if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

const user = db
  .prepare('SELECT id, email FROM users WHERE email = ? COLLATE NOCASE')
  .get(email);

if (!user) {
  console.error(`No existe una cuenta con el correo ${email}.`);
  db.close();
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, user.id);
db.close();

console.log(`Contraseña actualizada para ${user.email}.`);
