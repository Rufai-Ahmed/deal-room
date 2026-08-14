// Thin entry point for the platform. The Nest application is bundled ahead of
// time by webpack so nothing has to compile TypeScript decorators at deploy.
const handler = require('../apps/api/dist-serverless/main.js');

module.exports = handler.default || handler;
