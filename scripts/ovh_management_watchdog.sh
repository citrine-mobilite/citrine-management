#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${HOME}/repositories/citrine-management"
LOG_DIR="${HOME}/logs"
PID_FILE="${HOME}/.management-node.pid"
LOG_FILE="${LOG_DIR}/management.log"

mkdir -p "${LOG_DIR}"
cd "${APP_DIR}"

ENV_PORT=""
if [[ -f "${APP_DIR}/.env" ]]; then
  ENV_PORT="$(/usr/bin/node -e "require('dotenv').config({ path: '.env' }); process.stdout.write(process.env.PORT || '')" 2>/dev/null || true)"
fi
PORT="${PORT:-${ENV_PORT:-3000}}"
HEALTH_URL="http://127.0.0.1:${PORT}/api/health"

if curl --silent --fail --max-time 4 "${HEALTH_URL}" >/dev/null 2>&1; then
  exit 0
fi

if [[ -f "${PID_FILE}" ]]; then
  OLD_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [[ "${OLD_PID}" =~ ^[0-9]+$ ]] && kill -0 "${OLD_PID}" 2>/dev/null; then
    PROCESS_CMD="$(ps -p "${OLD_PID}" -o args= 2>/dev/null || true)"
    if [[ "${PROCESS_CMD}" == *"${APP_DIR}/dist/server.cjs"* ]]; then
      kill "${OLD_PID}" 2>/dev/null || true
      sleep 2
    else
      echo "PID file points to a different process; refusing to kill PID ${OLD_PID}." >> "${LOG_FILE}"
    fi
  fi
  rm -f "${PID_FILE}"
fi

export NODE_ENV=production PORT
nohup /usr/bin/node "${APP_DIR}/dist/server.cjs" >> "${LOG_FILE}" 2>&1 < /dev/null &
NEW_PID=$!
echo "${NEW_PID}" > "${PID_FILE}"

sleep 3
if ! curl --silent --fail --max-time 5 "${HEALTH_URL}" >/dev/null 2>&1; then
  echo "Management API did not become healthy; inspect ${LOG_FILE}" >> "${LOG_FILE}"
  exit 1
fi
