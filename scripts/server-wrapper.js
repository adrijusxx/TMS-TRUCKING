const http = require('http');
const path = require('path');

// Fix: AWS ALB + Node.js keep-alive mismatch.
// Node.js default keepAliveTimeout = 5s, ALB idle timeout = 300s (configured via AWS CLI).
// When Node.js closes an idle connection, the ALB doesn't know and tries to reuse it,
// causing a connection reset and a ~30-second freeze on the next request.
// Solution: keep connections open longer than the ALB idle timeout so the ALB always
// closes first and never attempts to reuse a dead socket.
// keepAliveTimeout MUST be > ALB idle timeout so the ALB always closes first.
const _createServer = http.createServer.bind(http);
http.createServer = function (...args) {
  const server = _createServer(...args);
  server.keepAliveTimeout = 310000; // 310s — must be > ALB idle timeout (300s)
  server.headersTimeout = 311000;   // must be > keepAliveTimeout
  console.log('[Server] keepAliveTimeout=310s headersTimeout=311s applied (ALB idle=300s)');
  return server;
};

require(path.join(__dirname, '..', '.next', 'standalone', 'server.js'));
