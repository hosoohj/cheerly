# Cheerly — 배포 가이드

> 최종 수정: 2026-03-15
> 배포 자동화 상태: ✅ 완료

---

## 배포 자동화 현황

| 항목 | 상태 | 파일 |
|------|------|------|
| GitHub Actions CI | ✅ 완료 | `.github/workflows/ci.yml` |
| Jenkins 5단계 파이프라인 | ✅ 완료 | `Jenkinsfile` |
| 운영 배포 스크립트 | ✅ 완료 | `scripts/deploy.sh` |
| 롤백 자동화 | ✅ 완료 | `scripts/rollback.sh` |
| 원격 배포 헬퍼 | ✅ 완료 | `scripts/deploy-remote.sh` |

---

## 1. 환경 구성

### 1.1 필수 환경변수

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `DATABASE_URL` | ✅ | SQLite DB 파일 경로 | `file:/opt/cheerly/data/prod.db` |
| `ANTHROPIC_API_KEY` | 선택 | Claude AI API 키 (없으면 정적 폴백) | `sk-ant-...` |
| `TEAMS_WEBHOOK_URL` | 선택 | Teams Incoming Webhook URL | `https://outlook.office.com/webhook/...` |
| `PORT` | 선택 | 서버 포트 (기본값: 3000) | `3000` |

### 1.2 .env.local 설정 (로컬 개발)

```bash
cp .env.local.example .env.local
# 실제 값으로 수정
```

`.env.local.example` 내용:
```env
DATABASE_URL=file:./dev.db
ANTHROPIC_API_KEY=sk-ant-...
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
PORT=3000
```

---

## 2. GitHub Actions CI ✅

### 2.1 파이프라인 구조

```
push / PR
    │
    ├── Job 1: Backend Tests (병렬)
    │     ├── Checkout + Node.js 20 설정
    │     ├── npm ci
    │     ├── Prisma generate
    │     ├── ESLint 검사
    │     └── Vitest run (단위 + 통합 102개)
    │
    ├── Job 2: Frontend Build (backend-test 통과 후)
    │     ├── npm ci + Prisma generate
    │     └── next build (production)
    │
    └── Job 3: E2E Tests (main/master push 시에만)
          ├── Playwright 브라우저 설치
          ├── DB 마이그레이션 + 시드
          └── playwright test (25 시나리오)
```

### 2.2 트리거 조건

| 이벤트 | Backend Tests | Frontend Build | E2E |
|--------|:---:|:---:|:---:|
| PR 생성/업데이트 | ✅ | ✅ | ❌ |
| `main`/`master` push | ✅ | ✅ | ✅ |
| `sprint*` 브랜치 push | ✅ | ✅ | ❌ |

### 2.3 실행 방법

```bash
# GitHub에 push하면 자동 실행
git push origin main

# 특정 워크플로우 수동 실행 (gh CLI)
gh workflow run ci.yml
```

---

## 3. Jenkins 파이프라인 ✅

### 3.1 5단계 파이프라인

```
Stage 1: Checkout ──→ Stage 2: Build ──→ Stage 3: Test ──→ Stage 4: Package ──→ Stage 5: Deploy
  소스 체크아웃           npm ci + prisma       Lint + Vitest        tar.gz 패키징        SSH 원격 배포
  커밋 정보 기록          generate + next        (병렬 실행)           artifact.properties   PM2 재시작
                        build                                        archiveArtifacts      헬스체크
```

### 3.2 Jenkins 설정 요구사항

**플러그인:**
- NodeJS Plugin
- SSH Agent Plugin
- Pipeline Plugin
- Blue Ocean (권장)

**Credentials 등록 (Jenkins → Manage Jenkins → Credentials):**

| ID | 종류 | 설명 |
|----|------|------|
| `ANTHROPIC_API_KEY` | Secret Text | Claude AI API 키 |
| `TEAMS_WEBHOOK_URL` | Secret Text | Teams Webhook URL |
| `DATABASE_URL_STAGING` | Secret Text | 스테이징 DB URL |
| `DATABASE_URL_PRODUCTION` | Secret Text | 프로덕션 DB URL |
| `deploy-ssh-staging` | SSH Username with private key | 스테이징 서버 SSH 키 |
| `deploy-ssh-production` | SSH Username with private key | 프로덕션 서버 SSH 키 |
| `deploy-host-staging` | Secret Text | 스테이징 서버 호스트 |
| `deploy-host-production` | Secret Text | 프로덕션 서버 호스트 |

**NodeJS 도구 설정:**
- Name: `NodeJS 20`
- Version: `Node.js 20.x`

### 3.3 파이프라인 실행

```bash
# Jenkins 웹 UI에서
# 1. New Item → Pipeline
# 2. Pipeline script from SCM → Git URL 입력
# 3. Build with Parameters → DEPLOY_ENV: staging/production
```

---

## 4. 운영 환경 배포 스크립트 ✅

### 4.1 배포 실행 (PM2 기반)

```bash
# 프로덕션 배포
DATABASE_URL="file:/opt/cheerly/data/prod.db" \
ANTHROPIC_API_KEY="sk-ant-..." \
TEAMS_WEBHOOK_URL="https://..." \
./scripts/deploy.sh production

# 스테이징 배포
DATABASE_URL="file:/opt/cheerly/data/staging.db" \
./scripts/deploy.sh staging
```

### 4.2 deploy.sh 단계별 동작

| 단계 | 동작 | 안전장치 |
|------|------|---------|
| 사전 검사 | node/npm/pm2/git 존재 확인, 환경변수 검사 | 실패 시 즉시 중단 |
| DB 백업 | WAL 체크포인트 후 타임스탬프 파일 복사 | 최근 10개 유지 |
| 코드 업데이트 | git pull, 이전 커밋을 `.previous_commit`에 저장 | rollback-prev 태그 생성 |
| 의존성 설치 | `npm ci --omit=dev` | lockfile 기반 재현 |
| DB 마이그레이션 | `prisma migrate deploy` | 롤포워드만 적용 |
| 빌드 | `next build` (production) | 실패 시 배포 중단 |
| PM2 재시작 | `pm2 reload` (무중단) 또는 `pm2 start` | ecosystem.config.js 사용 |
| 헬스체크 | `GET /api/schedules` 60초간 재시도 | 실패 시 PM2 로그 출력 |

### 4.3 서버 사전 준비

```bash
# 서버에 Node.js 20, PM2, SQLite3 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs sqlite3
sudo npm install -g pm2

# 배포 디렉토리 생성
sudo mkdir -p /opt/cheerly/data /opt/cheerly/backups /opt/cheerly/logs
sudo chown -R $(whoami):$(whoami) /opt/cheerly

# 배포 스크립트 서버에 배치
sudo mkdir -p /opt/deploy
sudo cp scripts/deploy-remote.sh /opt/deploy/
sudo chmod +x /opt/deploy/deploy-remote.sh
```

---

## 5. 롤백 절차 ✅

### 5.1 자동 롤백 (가장 최근 배포로)

```bash
# 직전 커밋으로 자동 롤백
DATABASE_URL="file:/opt/cheerly/data/prod.db" \
ANTHROPIC_API_KEY="sk-ant-..." \
./scripts/rollback.sh

# 롤백 가능 지점 목록 확인
./scripts/rollback.sh --list

# 특정 커밋으로 롤백
./scripts/rollback.sh abc1234

# Git 태그로 롤백
./scripts/rollback.sh rollback-prev

# DB만 롤백 (코드 변경 없이)
./scripts/rollback.sh --db-only
```

### 5.2 롤백 시나리오별 절차

#### 시나리오 A: 배포 직후 서비스 장애

```bash
# 1. 즉시 이전 버전으로 롤백
./scripts/rollback.sh

# 2. 서비스 상태 확인
pm2 status
pm2 logs cheerly --lines 100

# 3. 원인 분석 후 수정하여 재배포
```

#### 시나리오 B: DB 마이그레이션 오류

```bash
# 1. DB만 롤백 (코드는 유지)
./scripts/rollback.sh --db-only

# 2. 선택할 백업 파일 확인 후 복원
# 3. PM2 자동 재시작 확인
```

#### 시나리오 C: 특정 버전으로 롤백

```bash
# 1. 커밋 이력 확인
git log --oneline -20

# 2. 원하는 커밋으로 롤백
./scripts/rollback.sh <commit-hash>
```

#### 시나리오 D: 긴급 수동 롤백 (스크립트 없이)

```bash
# 1. PM2 프로세스 중단
pm2 stop cheerly

# 2. 이전 코드로 되돌리기
git checkout <이전-커밋-해시> -- .

# 3. DB 백업 복원
cp /opt/cheerly/backups/db_<타임스탬프>.db /opt/cheerly/data/prod.db

# 4. 재빌드
npm ci --omit=dev && npx prisma generate && npm run build

# 5. PM2 재시작
pm2 start ecosystem.config.js
pm2 save
```

### 5.3 롤백 단계별 동작

| 단계 | 동작 | 안전장치 |
|------|------|---------|
| DB 복원 | 최신 백업으로 복원 | 현재 DB를 safety 백업으로 보존 |
| 코드 롤백 | `git reset --hard <target>` | safety 태그(`rollback-before-<ts>`) 생성 |
| 재빌드 | `npm ci` + `prisma generate` + `next build` | 빌드 실패 시 중단 |
| PM2 재시작 | `pm2 reload` (무중단) | 실패 시 `pm2 start` |
| 헬스체크 | 60초간 재시도 | 실패 시 PM2 로그 출력 |

---

## 6. 모니터링 및 운영

### 6.1 PM2 기본 명령어

```bash
pm2 status              # 프로세스 상태
pm2 logs cheerly        # 실시간 로그
pm2 logs cheerly --lines 200  # 최근 200줄
pm2 restart cheerly     # 재시작 (다운타임 있음)
pm2 reload cheerly      # 무중단 재시작
pm2 monit               # 대화형 모니터링 UI
pm2 startup             # 시스템 재시작 시 자동 복구 설정
```

### 6.2 헬스체크 엔드포인트

| 엔드포인트 | 기대 응답 | 용도 |
|-----------|---------|------|
| `GET /api/schedules` | HTTP 200 + JSON | 앱 + DB 동작 확인 |
| `GET /api/notifications` | HTTP 200 + JSON | 알림 API 확인 |

### 6.3 로그 위치

| 파일 | 내용 |
|------|------|
| `/opt/cheerly/logs/out.log` | 표준 출력 (스케줄러 로그 포함) |
| `/opt/cheerly/logs/error.log` | 에러 로그 |
| `/opt/cheerly/logs/combined.log` | 통합 로그 |

### 6.4 스케줄러 정상 동작 확인

```bash
# 서버 로그에서 스케줄러 실행 확인
pm2 logs cheerly | grep '\[Scheduler\]'

# 예상 출력:
# [Scheduler] 알림 스케줄러 시작
# [Scheduler] checking reminders...
# [Scheduler] 알림 발송: 팀 회의 (sched-xxx)
```

---

## 7. 백업 전략

| 백업 유형 | 주기 | 보존 기간 | 위치 |
|---------|------|---------|------|
| 배포 전 자동 백업 | 배포 시마다 | 최근 10개 | `/opt/cheerly/backups/db_*.db` |
| Safety 백업 (롤백 전) | 롤백 시마다 | 최근 5개 | `/opt/cheerly/backups/db_safety_*.db` |
| 정기 백업 (cron 권장) | 매일 03:00 | 30일 | 별도 백업 서버 |

### 정기 백업 cron 설정

```bash
# crontab -e
0 3 * * * DATABASE_URL="file:/opt/cheerly/data/prod.db" \
           /opt/cheerly/scripts/deploy.sh backup-only \
           >> /opt/cheerly/logs/backup.log 2>&1
```

---

## 8. 알려진 이슈

| 이슈 | 원인 | 해결책 |
|------|------|-------|
| `npm run build` 실패 | Next.js 16 내부 `workUnitAsyncStorage` 버그 | 프레임워크 픽스 대기. 개발 서버(`npm run dev`) + PM2 직접 실행으로 우회 |
| Playwright 브라우저 미설치 | 사내 SSL 차단 | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` 설정 후 수동 설치 |
| Windows 배포 미지원 | `deploy.sh`는 Linux/macOS 전용 | WSL2 또는 Linux 서버 사용 |
