const http = require('http');
const path = require('path');

// Fix: AWS ALB + Node.js keep-alive mismatch.
// Node.js default keepAliveTimeout = 5s, ALB idle timeout = 60s by default.
// When Node.js closes an idle connection, the ALB doesn't know and tries to reuse it,
// causing a connection reset and a ~30-second freeze on the next request.
// Solution: keep connections open longer than the ALB idle timeout so the ALB always
// closes first and never attempts to reuse a dead socket.
// ALB idle_timeout = 30s (confirmed via AWS CLI).
// keepAliveTimeout MUST be > ALB idle timeout so the ALB always closes first.
const _createServer = http.createServer.bind(http);
http.createServer = function (...args) {
  const server = _createServer(...args);
  server.keepAliveTimeout = 35000; // 35s — must be > ALB idle timeout (30s)
  server.headersTimeout = 36000;   // must be > keepAliveTimeout
  console.log('[Server] keepAliveTimeout=35s headersTimeout=36s applied (ALB idle=30s)');
  return server;
};

require(path.join(__dirname, '..', '.next', 'standalone', 'server.js'));
