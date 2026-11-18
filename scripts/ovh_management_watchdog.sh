#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${HOME}/repositories/citrine-management"
LOG_DIR="${HOME}/logs"
PID_FILE="${HOME}/.management-node.pid"
PORT="${PORT:-3000}"
LOG_FILE="${LOG_DIR}/management.log"
HEALTH_URL="http://127.0.0.1:${PORT}/api/health"

mkdir -p "${LOG_DIR}"
cd "${APP_DIR}"

if curl --silent --fail --max-time 4 "${HEALTH_URL}" >/dev/null 2>&1; then
  exit 0
fi

if [[ -f "${PID_FILE}" ]]; then
  OLD_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [[ "${OLD_PID}" =~ ^[0-9]+$ ]] && kill -0 "${OLD_PID}" 2>/dev/null; then
    kill "${OLD_PID}" 2>/dev/null || true
    sleep 2
  fi
  rm -f "${PID_FILE}"
fi

export NODE_ENV=production
export PORT
nohup /usr/bin/node "${APP_DIR}/dist/server.cjs" >> "${LOG_FILE}" 2>&1 < /dev/null &
NEW_PID=$!
echo "${NEW_PID}" > "${PID_FILE}"

sleep 3
if ! curl --silent --fail --max-time 5 "${HEALTH_URL}" >/dev/null 2>&1; then
  echo "Management API did not become healthy; inspect ${LOG_FILE}" >> "${LOG_FILE}"
  exit 1
fi
