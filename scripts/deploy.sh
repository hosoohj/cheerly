#!/usr/bin/env bash
# =============================================================================
# Cheerly — 운영 환경 배포 스크립트
# 사용법: ./scripts/deploy.sh [staging|production]
#
# 필수 환경변수:
#   DATABASE_URL        예) file:/opt/cheerly/data/prod.db
#   ANTHROPIC_API_KEY   Claude AI API 키
#   TEAMS_WEBHOOK_URL   Microsoft Teams Incoming Webhook URL (선택)
#   PORT                서버 포트 (기본값: 3000)
# =============================================================================
set -euo pipefail

# ─── 설정 ─────────────────────────────────────────────────────────────────────
DEPLOY_ENV="${1:-production}"
APP_NAME="cheerly"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/cheerly}"
BACKUP_DIR="${DEPLOY_DIR}/backups"
LOG_DIR="${DEPLOY_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PORT="${PORT:-3000}"
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1

# 컬러 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${BLUE}[$(date '+%H:%M:%S')] $*${NC}"; }
ok()   { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $*${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $*${NC}"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $*${NC}" >&2; }

# ─── 사전 검사 ────────────────────────────────────────────────────────────────
preflight_check() {
    log "사전 검사 시작..."

    # 필수 명령어 확인
    for cmd in node npm pm2 git; do
        if ! command -v "$cmd" &>/dev/null; then
            err "필수 명령어 '$cmd' 를 찾을 수 없습니다"
            exit 1
        fi
    done

    # 필수 환경변수 확인
    if [[ -z "${DATABASE_URL:-}" ]]; then
        err "DATABASE_URL 환경변수가 설정되지 않았습니다"
        exit 1
    fi

    if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
        warn "ANTHROPIC_API_KEY 미설정 — AI 격려 메시지 대신 정적 메시지가 사용됩니다"
    fi

    if [[ -z "${TEAMS_WEBHOOK_URL:-}" ]]; then
        warn "TEAMS_WEBHOOK_URL 미설정 — Teams 알림이 비활성화됩니다"
    fi

    ok "사전 검사 통과"
}

# ─── 디렉토리 초기화 ─────────────────────────────────────────────────────────
init_dirs() {
    log "배포 디렉토리 초기화..."
    mkdir -p "${DEPLOY_DIR}" "${BACKUP_DIR}" "${LOG_DIR}"
    ok "디렉토리 준비 완료: ${DEPLOY_DIR}"
}

# ─── DB 백업 ──────────────────────────────────────────────────────────────────
backup_database() {
    # SQLite 파일 경로 추출 (file:/path/to/db.db → /path/to/db.db)
    local db_path="${DATABASE_URL#file:}"

    if [[ -f "${db_path}" ]]; then
        local backup_file="${BACKUP_DIR}/db_${TIMESTAMP}.db"
        log "DB 백업 중: ${db_path} → ${backup_file}"

        # WAL 체크포인트 후 복사 (데이터 일관성 보장)
        sqlite3 "${db_path}" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
        cp "${db_path}" "${backup_file}"

        # 최근 10개 백업만 유지
        ls -t "${BACKUP_DIR}"/db_*.db 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

        ok "DB 백업 완료: ${backup_file}"
        echo "${backup_file}" > "${DEPLOY_DIR}/.last_backup"
    else
        warn "DB 파일 없음 — 초기 배포로 간주합니다"
    fi
}

# ─── Git 기반 코드 업데이트 ───────────────────────────────────────────────────
update_code() {
    log "코드 업데이트 중 (현재 커밋: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown'))..."

    # 현재 커밋을 rollback 태그로 저장
    local current_commit
    current_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
    if [[ -n "${current_commit}" ]]; then
        echo "${current_commit}" > "${DEPLOY_DIR}/.previous_commit"
        git tag -f "rollback-prev" "${current_commit}" 2>/dev/null || true
    fi

    git fetch --all --tags
    git pull origin "$(git rev-parse --abbrev-ref HEAD)"

    local new_commit
    new_commit=$(git rev-parse --short HEAD)
    echo "${new_commit}" > "${DEPLOY_DIR}/.current_commit"

    ok "코드 업데이트 완료 → ${new_commit}"
}

# ─── 의존성 설치 ─────────────────────────────────────────────────────────────
install_deps() {
    log "의존성 설치 중..."
    npm ci --prefer-offline --omit=dev 2>&1 | tail -5
    ok "의존성 설치 완료"
}

# ─── Prisma 마이그레이션 ──────────────────────────────────────────────────────
run_migrations() {
    log "Prisma 클라이언트 생성 중..."
    npx prisma generate

    log "DB 마이그레이션 실행 중..."
    DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy

    ok "마이그레이션 완료"
}

# ─── Next.js 빌드 ────────────────────────────────────────────────────────────
build_app() {
    log "Next.js 프로덕션 빌드 중..."
    NODE_ENV=production \
    DATABASE_URL="${DATABASE_URL}" \
    ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
    TEAMS_WEBHOOK_URL="${TEAMS_WEBHOOK_URL:-}" \
    NEXT_TELEMETRY_DISABLED=1 \
    npm run build

    ok "빌드 완료"
}

# ─── .env 파일 생성 ──────────────────────────────────────────────────────────
write_env_file() {
    log ".env.production 파일 작성 중..."
    cat > "${DEPLOY_DIR}/.env.production" <<EOF
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
TEAMS_WEBHOOK_URL=${TEAMS_WEBHOOK_URL:-}
PORT=${PORT}
NEXT_TELEMETRY_DISABLED=1
EOF
    chmod 600 "${DEPLOY_DIR}/.env.production"
    ok ".env.production 작성 완료"
}

# ─── PM2 기반 프로세스 시작/재시작 ───────────────────────────────────────────
restart_app() {
    log "PM2 프로세스 재시작 중..."

    # PM2 ecosystem 설정 파일 생성
    cat > "${DEPLOY_DIR}/ecosystem.config.js" <<EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '${DEPLOY_DIR}',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env.production',
    env: {
      NODE_ENV: 'production',
      PORT: ${PORT},
    },
    log_file: '${LOG_DIR}/combined.log',
    out_file: '${LOG_DIR}/out.log',
    error_file: '${LOG_DIR}/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '512M',
    watch: false,
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 5,
  }]
}
EOF

    if pm2 describe "${APP_NAME}" &>/dev/null; then
        pm2 reload "${DEPLOY_DIR}/ecosystem.config.js" --update-env
    else
        pm2 start "${DEPLOY_DIR}/ecosystem.config.js"
    fi

    pm2 save

    ok "PM2 프로세스 시작 완료"
}

# ─── 헬스체크 ────────────────────────────────────────────────────────────────
health_check() {
    log "헬스체크 실행 중..."
    local max_attempts=12
    local attempt=1
    local url="http://localhost:${PORT}/api/schedules"

    while [[ ${attempt} -le ${max_attempts} ]]; do
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${url}" 2>/dev/null || echo "000")

        if [[ "${http_code}" == "200" ]]; then
            ok "헬스체크 통과 (${url} → HTTP ${http_code})"
            return 0
        fi

        warn "헬스체크 시도 ${attempt}/${max_attempts}: HTTP ${http_code} — 5초 후 재시도..."
        sleep 5
        ((attempt++))
    done

    err "헬스체크 실패 — 배포를 확인해 주세요"
    pm2 logs "${APP_NAME}" --lines 50 --nostream
    return 1
}

# ─── 배포 요약 ────────────────────────────────────────────────────────────────
print_summary() {
    local commit
    commit=$(cat "${DEPLOY_DIR}/.current_commit" 2>/dev/null || echo "unknown")
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🎉 Cheerly 배포 완료!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo "  환경:    ${DEPLOY_ENV}"
    echo "  버전:    ${commit}"
    echo "  시간:    $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  URL:     http://localhost:${PORT}"
    echo "  로그:    ${LOG_DIR}/"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
}

# ─── 메인 실행 흐름 ──────────────────────────────────────────────────────────
main() {
    log "=== Cheerly 배포 시작 (${DEPLOY_ENV}) ==="

    preflight_check
    init_dirs
    backup_database
    update_code
    install_deps
    run_migrations
    build_app
    write_env_file
    restart_app
    health_check
    print_summary

    ok "배포 완료"
}

main "$@"
