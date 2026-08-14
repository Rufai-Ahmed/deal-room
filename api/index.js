const handler = require('../apps/api/dist-serverless/main.js');

module.exports = handler.default || handler;
