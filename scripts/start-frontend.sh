#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=== Money Manager — Frontend ==="

# Install dependencies if node_modules is missing
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing npm dependencies..."
  npm --prefix "$FRONTEND_DIR" install
fi

echo "Starting frontend on http://localhost:5173 ..."
exec npm --prefix "$FRONTEND_DIR" run dev
