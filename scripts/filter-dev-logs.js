#!/usr/bin/env node

/**
 * Filters Next.js development server logs to only show errors and important messages
 * Usage: node scripts/filter-dev-logs.js
 * 
 * This script filters out successful API request logs (200 status) but keeps:
 * - Errors (4xx, 5xx status codes or error messages)
 * - Warnings
 * - Compilation messages
 * - Server startup messages
 * - Other important information
 */

const { spawn } = require('child_process');

// Get additional args from command line (e.g., port number)
const args = process.argv.slice(2);
const nextArgs = args.length > 0 ? ['dev', ...args] : ['dev'];

// Start Next.js dev server
const nextDev = spawn('next', nextArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: process.cwd(),
});

let buffer = '';

// Filter stdout (successful requests)
nextDev.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  
  // Keep the last incomplete line in buffer
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    
    // Check if this is a successful API request log (format: "GET /path 200 in Xms")
    const isSuccessfulRequest = /^\s*(GET|POST|PUT|DELETE|PATCH)\s+\/[^\s]+\s+200\s+in/.test(line);
    
    if (isSuccessfulRequest) {
      // Skip successful requests - don't output them
      continue;
    }
    
    // Show everything else:
    // - Errors (status codes >= 400, or error keywords)
    // - Warnings
    // - Compilation messages
    // - Server startup/ready messages
    // - Route information
    // - Any other important messages
    
    const isError = /\s(4\d{2}|5\d{2})\s/.test(line) || 
                    /error|Error|ERROR/i.test(line);
    const isWarning = /warn|Warn|WARN/i.test(line);
    const isCompilation = /compiled|Compiling|compiling|Building|building/i.test(line);
    const isServerInfo = /ready|Ready|started|Started|localhost|port|Local|listening/i.test(line);
    const isRouteInfo = /Route|route/i.test(line);
    
    if (isError || isWarning || isCompilation || isServerInfo || isRouteInfo || !isSuccessfulRequest) {
      process.stdout.write(line + '\n');
    }
  }
});

// Pass through stderr (errors) as-is - these are always important
nextDev.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process exit
nextDev.on('close', (code) => {
  // Output any remaining buffer
  if (buffer.trim()) {
    process.stdout.write(buffer);
  }
  process.exit(code);
});

// Handle process errors
nextDev.on('error', (error) => {
  console.error('Error starting Next.js dev server:', error);
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
  process.exit(0);
});

