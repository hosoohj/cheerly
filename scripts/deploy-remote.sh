#!/usr/bin/env bash
# =============================================================================
# Cheerly — Jenkins 원격 배포 헬퍼 스크립트
# Jenkins에서 SSH로 호출되는 서버 사이드 스크립트
# 환경변수로 전달: ARTIFACT, DEPLOY_DIR, PM2_APP, DATABASE_URL 등
# =============================================================================
set -euo pipefail

ARTIFACT="${ARTIFACT:?ARTIFACT 환경변수 필요}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/cheerly}"
PM2_APP="${PM2_APP:-cheerly}"
PORT="${PORT:-3000}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${DEPLOY_DIR}/backups"
LOG_DIR="${DEPLOY_DIR}/logs"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
ok()  { echo "[$(date '+%H:%M:%S')] ✅ $*"; }

mkdir -p "${DEPLOY_DIR}" "${BACKUP_DIR}" "${LOG_DIR}"

# DB 백업
DB_PATH="${DATABASE_URL#file:}"
if [[ -f "${DB_PATH}" ]]; then
    log "DB 백업..."
    sqlite3 "${DB_PATH}" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
    cp "${DB_PATH}" "${BACKUP_DIR}/db_${TIMESTAMP}.db"
    ls -t "${BACKUP_DIR}"/db_*.db | tail -n +11 | xargs rm -f 2>/dev/null || true
    ok "DB 백업 완료"
fi

# 아티팩트 압축 해제
log "아티팩트 배포 중: ${ARTIFACT}"
tar -xzf "/tmp/${ARTIFACT}" -C "${DEPLOY_DIR}"

# 의존성 설치 (production only)
cd "${DEPLOY_DIR}"
npm ci --prefer-offline --omit=dev 2>&1 | tail -5

# Prisma
npx prisma generate
DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy

# .env 파일 생성
cat > "${DEPLOY_DIR}/.env.production" <<EOF
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
TEAMS_WEBHOOK_URL=${TEAMS_WEBHOOK_URL:-}
PORT=${PORT}
NEXT_TELEMETRY_DISABLED=1
EOF
chmod 600 "${DEPLOY_DIR}/.env.production"

# PM2 재시작
if pm2 describe "${PM2_APP}" &>/dev/null; then
    pm2 reload "${DEPLOY_DIR}/ecosystem.config.js" --update-env
else
    pm2 start "${DEPLOY_DIR}/ecosystem.config.js"
fi
pm2 save

# 헬스체크
log "헬스체크 중..."
for i in $(seq 1 12); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:${PORT}/api/schedules" 2>/dev/null || echo "000")
    if [[ "${CODE}" == "200" ]]; then
        ok "헬스체크 통과 (HTTP ${CODE})"
        break
    fi
    log "시도 ${i}/12: HTTP ${CODE}"
    sleep 5
done

# 임시 아티팩트 정리
rm -f "/tmp/${ARTIFACT}" "/tmp/artifact.properties"

ok "원격 배포 완료"
