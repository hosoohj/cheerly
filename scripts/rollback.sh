#!/usr/bin/env bash
# =============================================================================
# Cheerly — 배포 롤백 스크립트
# 사용법: ./scripts/rollback.sh [target]
#
# target 옵션:
#   (없음)         — 직전 배포 커밋으로 자동 롤백
#   <commit-hash>  — 지정 커밋으로 롤백
#   <tag>          — 지정 Git 태그로 롤백
#   --list         — 롤백 가능 지점 목록 표시
#   --db-only      — DB만 롤백 (코드 변경 없음)
# =============================================================================
set -euo pipefail

# ─── 설정 ─────────────────────────────────────────────────────────────────────
APP_NAME="cheerly"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/cheerly}"
BACKUP_DIR="${DEPLOY_DIR}/backups"
LOG_DIR="${DEPLOY_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PORT="${PORT:-3000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${BLUE}[$(date '+%H:%M:%S')] $*${NC}"; }
ok()   { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $*${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $*${NC}"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $*${NC}" >&2; }

# ─── 롤백 가능 지점 목록 ──────────────────────────────────────────────────────
show_list() {
    echo -e "${CYAN}══════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Cheerly 롤백 가능 지점${NC}"
    echo -e "${CYAN}══════════════════════════════════════════${NC}"

    echo ""
    echo "🔖 Git 롤백 태그:"
    git tag --list 'rollback-*' --sort=-creatordate | head -10 | while read -r tag; do
        local commit date
        commit=$(git rev-list -n 1 "${tag}" | cut -c1-8)
        date=$(git log -1 --format="%ci" "${tag}" 2>/dev/null | cut -c1-16)
        echo "  ${tag}  (${commit}) — ${date}"
    done

    echo ""
    echo "📦 DB 백업 파일:"
    ls -t "${BACKUP_DIR}"/db_*.db 2>/dev/null | head -10 | while read -r f; do
        local size
        size=$(du -sh "${f}" | cut -f1)
        echo "  $(basename "${f}")  (${size})"
    done

    echo ""
    echo "📌 직전 커밋:"
    if [[ -f "${DEPLOY_DIR}/.previous_commit" ]]; then
        local prev_commit
        prev_commit=$(cat "${DEPLOY_DIR}/.previous_commit")
        echo "  ${prev_commit}"
        git log --oneline -1 "${prev_commit}" 2>/dev/null || echo "  (Git 이력 없음)"
    else
        echo "  (이전 배포 정보 없음)"
    fi

    echo ""
    echo -e "${CYAN}══════════════════════════════════════════${NC}"
    echo "사용법: ./scripts/rollback.sh <commit|tag>"
    echo ""
}

# ─── DB 백업 복원 ─────────────────────────────────────────────────────────────
restore_database() {
    local target_backup="${1:-}"
    local db_path="${DATABASE_URL#file:}"

    if [[ -z "${target_backup}" ]]; then
        # 가장 최근 백업 파일 사용
        target_backup=$(ls -t "${BACKUP_DIR}"/db_*.db 2>/dev/null | head -1 || echo "")
    fi

    if [[ -z "${target_backup}" || ! -f "${target_backup}" ]]; then
        warn "복원할 DB 백업 파일이 없습니다"
        return 0
    fi

    log "DB 복원 중: ${target_backup} → ${db_path}"

    # 현재 DB를 safety 백업
    if [[ -f "${db_path}" ]]; then
        local safety_backup="${BACKUP_DIR}/db_safety_${TIMESTAMP}.db"
        cp "${db_path}" "${safety_backup}"
        warn "현재 DB를 safety 백업으로 보존: ${safety_backup}"
    fi

    # WAL 파일 정리 후 복원
    rm -f "${db_path}-shm" "${db_path}-wal" 2>/dev/null || true
    cp "${target_backup}" "${db_path}"

    ok "DB 복원 완료: ${target_backup}"
}

# ─── Git 기반 코드 롤백 ───────────────────────────────────────────────────────
rollback_code() {
    local target="${1}"

    log "코드 롤백 대상: ${target}"

    # 현재 상태를 safety 태그로 보존
    local current_commit
    current_commit=$(git rev-parse HEAD)
    git tag -f "rollback-before-${TIMESTAMP}" "${current_commit}" 2>/dev/null || true
    echo "${current_commit}" > "${BACKUP_DIR}/pre_rollback_commit_${TIMESTAMP}"

    # 대상 커밋/태그로 체크아웃
    git checkout "${target}" -- .
    git reset --hard "${target}"

    local new_commit
    new_commit=$(git rev-parse --short HEAD)
    echo "${new_commit}" > "${DEPLOY_DIR}/.current_commit"

    ok "코드 롤백 완료 → ${new_commit}"
}

# ─── 의존성 재설치 + 빌드 ────────────────────────────────────────────────────
rebuild_app() {
    log "의존성 재설치 중..."
    npm ci --prefer-offline --omit=dev 2>&1 | tail -5

    log "Prisma 클라이언트 생성 중..."
    npx prisma generate

    log "Next.js 빌드 중..."
    NODE_ENV=production \
    DATABASE_URL="${DATABASE_URL}" \
    ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
    TEAMS_WEBHOOK_URL="${TEAMS_WEBHOOK_URL:-}" \
    NEXT_TELEMETRY_DISABLED=1 \
    npm run build

    ok "재빌드 완료"
}

# ─── PM2 재시작 ───────────────────────────────────────────────────────────────
restart_app() {
    log "PM2 프로세스 재시작 중..."

    if pm2 describe "${APP_NAME}" &>/dev/null; then
        pm2 reload "${DEPLOY_DIR}/ecosystem.config.js" --update-env
    else
        pm2 start "${DEPLOY_DIR}/ecosystem.config.js"
    fi

    pm2 save
    ok "PM2 재시작 완료"
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
            ok "헬스체크 통과 (HTTP ${http_code})"
            return 0
        fi

        warn "헬스체크 시도 ${attempt}/${max_attempts}: HTTP ${http_code}"
        sleep 5
        ((attempt++))
    done

    err "롤백 후 헬스체크 실패 — 수동 확인 필요"
    pm2 logs "${APP_NAME}" --lines 50 --nostream
    return 1
}

# ─── 롤백 요약 ────────────────────────────────────────────────────────────────
print_summary() {
    local target="${1}"
    local commit
    commit=$(cat "${DEPLOY_DIR}/.current_commit" 2>/dev/null || echo "unknown")

    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ↩️  Cheerly 롤백 완료${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo "  대상:  ${target}"
    echo "  버전:  ${commit}"
    echo "  시간:  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  URL:   http://localhost:${PORT}"
    echo ""
    echo "  다음 단계:"
    echo "  1. 서비스 상태 확인: pm2 status"
    echo "  2. 로그 확인:       pm2 logs ${APP_NAME}"
    echo "  3. 원인 분석 후 재배포: ./scripts/deploy.sh"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
}

# ─── DB Only 롤백 ─────────────────────────────────────────────────────────────
rollback_db_only() {
    log "DB 전용 롤백 시작..."

    echo "사용 가능한 DB 백업:"
    ls -t "${BACKUP_DIR}"/db_*.db 2>/dev/null | head -10 | nl -v1

    echo ""
    read -r -p "복원할 백업 번호 입력 (Enter = 가장 최신): " choice

    local target_backup=""
    if [[ -z "${choice}" ]]; then
        target_backup=$(ls -t "${BACKUP_DIR}"/db_*.db 2>/dev/null | head -1 || echo "")
    else
        target_backup=$(ls -t "${BACKUP_DIR}"/db_*.db 2>/dev/null | sed -n "${choice}p" || echo "")
    fi

    if [[ -z "${target_backup}" ]]; then
        err "백업 파일을 찾을 수 없습니다"
        exit 1
    fi

    restore_database "${target_backup}"
    restart_app
    health_check
    print_summary "DB rollback: $(basename "${target_backup}")"
}

# ─── 메인 실행 흐름 ──────────────────────────────────────────────────────────
main() {
    local target="${1:-}"

    # 필수 환경변수 확인
    if [[ -z "${DATABASE_URL:-}" ]]; then
        err "DATABASE_URL 환경변수가 설정되지 않았습니다"
        exit 1
    fi

    # 특수 옵션 처리
    case "${target}" in
        --list)
            show_list
            exit 0
            ;;
        --db-only)
            rollback_db_only
            exit 0
            ;;
    esac

    # 롤백 대상 결정
    if [[ -z "${target}" ]]; then
        # 직전 커밋으로 자동 롤백
        if [[ -f "${DEPLOY_DIR}/.previous_commit" ]]; then
            target=$(cat "${DEPLOY_DIR}/.previous_commit")
            warn "자동 롤백 대상: ${target}"
        else
            err "이전 배포 정보가 없습니다. 커밋 해시를 직접 지정해 주세요"
            echo "사용법: ./scripts/rollback.sh <commit-hash>"
            echo "목록 확인: ./scripts/rollback.sh --list"
            exit 1
        fi
    fi

    # 롤백 대상 확인
    log "롤백 대상 확인: ${target}"
    if ! git cat-file -e "${target}" 2>/dev/null; then
        err "유효하지 않은 커밋/태그: ${target}"
        show_list
        exit 1
    fi

    # 롤백 확인 (대화형 모드에서만)
    if [[ -t 0 ]]; then
        echo ""
        warn "롤백을 실행합니다: 현재 → ${target}"
        warn "이 작업은 코드와 DB를 모두 되돌립니다."
        echo -n "계속 진행하시겠습니까? [y/N] "
        read -r confirm
        if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
            log "롤백 취소됨"
            exit 0
        fi
    fi

    log "=== Cheerly 롤백 시작 (→ ${target}) ==="

    restore_database  # DB를 직전 백업으로 복원
    rollback_code "${target}"
    rebuild_app
    restart_app
    health_check
    print_summary "${target}"

    ok "롤백 완료"
}

main "$@"
