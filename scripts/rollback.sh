#!/bin/bash
set -e

RELEASES_DIR="/home/ec2-user/tms/releases"
CURRENT_LINK="/home/ec2-user/tms/current"

# Get current release
CURRENT=$(readlink "${CURRENT_LINK}" | xargs basename 2>/dev/null || echo "none")
echo "Current release: ${CURRENT}"
echo ""

# List available releases (newest first)
echo "Available releases:"
ls -dt "${RELEASES_DIR}"/*/ 2>/dev/null | while read dir; do
  name=$(basename "$dir")
  if [ "$name" = "$CURRENT" ]; then
    echo "  * ${name} (ACTIVE)"
  else
    echo "    ${name}"
  fi
done
echo ""

# If a target is provided, roll back to it; otherwise roll back to previous
TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  TARGET=$(ls -dt "${RELEASES_DIR}"/*/ | head -2 | tail -1 | xargs basename 2>/dev/null || echo "")
fi

if [ -z "$TARGET" ] || [ ! -d "${RELEASES_DIR}/${TARGET}" ]; then
  echo "ERROR: No valid rollback target found."
  echo "Usage: rollback.sh [release-name]"
  exit 1
fi

if [ "$TARGET" = "$CURRENT" ]; then
  echo "Already on release ${TARGET}. Nothing to do."
  exit 0
fi

echo "Rolling back to: ${TARGET}"
ln -sfn "${RELEASES_DIR}/${TARGET}" "${CURRENT_LINK}"
cd "${CURRENT_LINK}"
pm2 restart tms

echo ""
echo "Rollback complete. Active release: ${TARGET}"
echo "Verify: curl -s http://localhost:3001/api/version | jq ."
