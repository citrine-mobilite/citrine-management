#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${HOME}/repositories/citrine-management"
LOG_DIR="${HOME}/logs"
PID_FILE="${HOME}/.management-node.pid"
mkdir -p "${LOG_DIR}"
cd "${APP_DIR}"

ENV_PORT=""
if [[ -f "${APP_DIR}/.env" ]]; then
  ENV_PORT="$(/usr/bin/node -e "require('dotenv').config({ path: '.env' }); process.stdout.write(process.env.PORT || '')" 2>/dev/null || true)"
fi
PORT="${PORT:-${ENV_PORT:-3000}}"

if [[ ! -f "${APP_DIR}/dist/server.cjs" ]]; then
  echo "Build absent. Run npm run build first." >&2
  exit 1
fi
if [[ -f "${PID_FILE}" ]]; then
  OLD_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [[ "${OLD_PID}" =~ ^[0-9]+$ ]] && kill -0 "${OLD_PID}" 2>/dev/null; then
    PROCESS_CMD="$(ps -p "${OLD_PID}" -o args= 2>/dev/null || true)"
    if [[ "${PROCESS_CMD}" == *"${APP_DIR}/dist/server.cjs"* ]]; then
      echo "Management Node process already exists (PID ${OLD_PID})."
      exit 0
    fi
  fi
  rm -f "${PID_FILE}"
fi

export NODE_ENV=production PORT
nohup /usr/bin/node "${APP_DIR}/dist/server.cjs" >> "${LOG_DIR}/management.log" 2>&1 < /dev/null &
echo $! > "${PID_FILE}"
echo "Management started with PID $(cat "${PID_FILE}") on port ${PORT}."
