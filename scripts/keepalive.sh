#!/bin/bash
# Pings the TMS health endpoint every 15s to keep the full stack warm
# (Next.js process, DB connections, EC2 CPU/RAM, EBS disk)
while true; do
  curl -sf http://localhost:3001/api/health > /dev/null 2>&1 || echo "[keepalive] health check failed"
  sleep 15
done
