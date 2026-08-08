// Vercel serverless function for TanStack Start SSR
const { createServer } = require('../dist/server/server.js');

module.exports = async (req, res) => {
  const server = createServer();
  await server(req, res);
};
