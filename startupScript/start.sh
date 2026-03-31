#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

cleanup() {
  echo ""
  echo "Stopping all processes..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo "Done."
}
trap cleanup INT TERM

echo "╔══════════════════════════════════════╗"
echo "║      Money Manager — Starting Up     ║"
echo "╚══════════════════════════════════════╝"
echo ""

echo "► Starting backend...  (logs: logs/backend.log)"
bash "$PROJECT_DIR/startupScript/start-backend.sh" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait for the backend to become ready (up to 40s)
echo -n "  Waiting for backend on :8080 "
for i in $(seq 1 40); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/actuator/health 2>/dev/null | grep -qE "^(200|401)"; then
    echo " ✓"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

echo "► Starting frontend... (logs: logs/frontend.log)"
bash "$PROJECT_DIR/startupScript/start-frontend.sh" > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅  Both services are starting:"
echo "   Backend  → http://localhost:8080"
echo "   Frontend → http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both."
echo ""

# Tail both logs so output is visible
tail -f "$BACKEND_LOG" "$FRONTEND_LOG" &
TAIL_PID=$!

# Wait for either process to exit
wait "$BACKEND_PID" "$FRONTEND_PID"
kill "$TAIL_PID" 2>/dev/null || true
