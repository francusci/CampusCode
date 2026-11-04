// Arranque de producción: fija NODE_ENV antes de cargar el servidor.
// Se usa junto con `node --env-file=.env.production`.
process.env.NODE_ENV = 'production';
await import('../server/index.js');
