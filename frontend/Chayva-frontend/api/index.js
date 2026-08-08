// Vercel serverless function wrapper for TanStack Start SSR
const { handler } = require('../dist/server/server.js');

module.exports = async (req, res) => {
  await handler(req, res);
};
