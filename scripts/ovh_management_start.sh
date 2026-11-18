#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${HOME}/repositories/citrine-management"
LOG_DIR="${HOME}/logs"
PID_FILE="${HOME}/.management-node.pid"
PORT="${PORT:-3000}"
mkdir -p "${LOG_DIR}"
cd "${APP_DIR}"
if [[ ! -f "${APP_DIR}/dist/server.cjs" ]]; then
  echo "Build absent. Run npm run build first." >&2
  exit 1
fi
if [[ -f "${PID_FILE}" ]] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; then
  echo "Management Node process already exists."
  exit 0
fi
export NODE_ENV=production PORT
nohup /usr/bin/node "${APP_DIR}/dist/server.cjs" >> "${LOG_DIR}/management.log" 2>&1 < /dev/null &
echo $! > "${PID_FILE}"
echo "Management started with PID $(cat "${PID_FILE}") on port ${PORT}."
