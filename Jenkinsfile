// Cheerly — Jenkins 선언형 파이프라인
// 5단계: Checkout → Build → Test → Package → Deploy

pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        NODE_VERSION   = '20'
        APP_NAME       = 'cheerly'
        DEPLOY_DIR     = '/opt/cheerly'
        PM2_APP        = 'cheerly'
        DOCKER_IMAGE   = "cheerly:${env.BUILD_NUMBER}"
        NODE_ENV       = 'production'
        NEXT_TELEMETRY_DISABLED = '1'
    }

    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['staging', 'production'],
            description: '배포 환경 선택'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: '테스트 건너뜀 (긴급 배포 시에만 사용)'
        )
    }

    stages {
        // ────────────────────────────────────────────────────
        // Stage 1: Checkout — 소스 코드 체크아웃
        // ────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "📥 Stage 1: Checkout"
                checkout scm

                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.GIT_BRANCH_NAME = sh(
                        script: 'git rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                    ).trim()
                    echo "Branch: ${env.GIT_BRANCH_NAME} | Commit: ${env.GIT_COMMIT_SHORT}"
                }
            }
        }

        // ────────────────────────────────────────────────────
        // Stage 2: Build — 의존성 설치 + Prisma 클라이언트 생성 + Next.js 빌드
        // ────────────────────────────────────────────────────
        stage('Build') {
            steps {
                echo "🔨 Stage 2: Build"

                nodejs(nodeJSInstallationName: "NodeJS ${NODE_VERSION}") {
                    sh 'node --version && npm --version'

                    // 의존성 설치 (lockfile 기반 재현 가능 설치)
                    sh 'npm ci --prefer-offline'

                    // Prisma 클라이언트 생성
                    sh 'npx prisma generate'

                    // Next.js 프로덕션 빌드
                    withCredentials([
                        string(credentialsId: 'ANTHROPIC_API_KEY', variable: 'ANTHROPIC_API_KEY'),
                        string(credentialsId: 'TEAMS_WEBHOOK_URL', variable: 'TEAMS_WEBHOOK_URL'),
                        string(credentialsId: "DATABASE_URL_${params.DEPLOY_ENV.toUpperCase()}", variable: 'DATABASE_URL')
                    ]) {
                        sh 'npm run build'
                    }
                }
            }
        }

        // ────────────────────────────────────────────────────
        // Stage 3: Test — Lint + Vitest 단위/통합 테스트
        // ────────────────────────────────────────────────────
        stage('Test') {
            when {
                expression { !params.SKIP_TESTS }
            }
            parallel {
                stage('Lint') {
                    steps {
                        echo "🔍 Lint 검사"
                        nodejs(nodeJSInstallationName: "NodeJS ${NODE_VERSION}") {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Unit & Integration Tests') {
                    steps {
                        echo "🧪 단위 + 통합 테스트"
                        nodejs(nodeJSInstallationName: "NodeJS ${NODE_VERSION}") {
                            sh '''
                                DATABASE_URL="file:./jenkins-test.db" \
                                ANTHROPIC_API_KEY="" \
                                TEAMS_WEBHOOK_URL="" \
                                NODE_ENV=test \
                                npm run test:run
                            '''
                        }
                    }
                    post {
                        always {
                            // 임시 테스트 DB 정리
                            sh 'rm -f jenkins-test.db jenkins-test.db-shm jenkins-test.db-wal'
                        }
                    }
                }
            }
        }

        // ────────────────────────────────────────────────────
        // Stage 4: Package — 배포 아티팩트 패키징
        // ────────────────────────────────────────────────────
        stage('Package') {
            steps {
                echo "📦 Stage 4: Package — 배포 아티팩트 생성"

                script {
                    def version = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                    env.ARTIFACT_NAME = "${APP_NAME}-${version}.tar.gz"

                    // 배포에 필요한 파일만 패키징 (.next, public, node_modules, prisma 등)
                    sh """
                        tar -czf ${env.ARTIFACT_NAME} \
                            .next/ \
                            public/ \
                            prisma/ \
                            prisma.config.ts \
                            next.config.ts \
                            package.json \
                            package-lock.json \
                            --exclude='.next/cache'
                    """

                    echo "✅ 아티팩트 생성: ${env.ARTIFACT_NAME}"

                    // 아티팩트 메타데이터 기록
                    sh """
                        echo "build=${env.BUILD_NUMBER}" > artifact.properties
                        echo "commit=${env.GIT_COMMIT_SHORT}" >> artifact.properties
                        echo "branch=${env.GIT_BRANCH_NAME}" >> artifact.properties
                        echo "env=${params.DEPLOY_ENV}" >> artifact.properties
                        echo "artifact=${env.ARTIFACT_NAME}" >> artifact.properties
                        echo "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> artifact.properties
                    """
                }

                archiveArtifacts artifacts: "${env.ARTIFACT_NAME}, artifact.properties",
                                 fingerprint: true
            }
        }

        // ────────────────────────────────────────────────────
        // Stage 5: Deploy — 운영/스테이징 서버 배포
        // ────────────────────────────────────────────────────
        stage('Deploy') {
            steps {
                echo "🚀 Stage 5: Deploy → ${params.DEPLOY_ENV}"

                script {
                    if (params.DEPLOY_ENV == 'production') {
                        // 프로덕션 배포는 수동 승인 후 진행
                        timeout(time: 10, unit: 'MINUTES') {
                            input message: "프로덕션 배포를 승인하시겠습니까? (Build #${env.BUILD_NUMBER})",
                                  ok: '배포 승인'
                        }
                    }
                }

                withCredentials([
                    string(credentialsId: 'ANTHROPIC_API_KEY', variable: 'ANTHROPIC_API_KEY'),
                    string(credentialsId: 'TEAMS_WEBHOOK_URL', variable: 'TEAMS_WEBHOOK_URL'),
                    string(credentialsId: "DATABASE_URL_${params.DEPLOY_ENV.toUpperCase()}", variable: 'DATABASE_URL'),
                    sshUserPrivateKey(
                        credentialsId: "deploy-ssh-${params.DEPLOY_ENV}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'DEPLOY_USER'
                    ),
                    string(credentialsId: "deploy-host-${params.DEPLOY_ENV}", variable: 'DEPLOY_HOST')
                ]) {
                    sh """
                        # 아티팩트 전송
                        scp -i \$SSH_KEY -o StrictHostKeyChecking=no \
                            ${env.ARTIFACT_NAME} artifact.properties \
                            \$DEPLOY_USER@\$DEPLOY_HOST:/tmp/

                        # 원격 배포 스크립트 실행
                        ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \
                            \$DEPLOY_USER@\$DEPLOY_HOST \
                            "ARTIFACT=${env.ARTIFACT_NAME} \
                             DEPLOY_DIR=${DEPLOY_DIR} \
                             PM2_APP=${PM2_APP} \
                             DATABASE_URL='\$DATABASE_URL' \
                             ANTHROPIC_API_KEY='\$ANTHROPIC_API_KEY' \
                             TEAMS_WEBHOOK_URL='\$TEAMS_WEBHOOK_URL' \
                             bash /opt/deploy/deploy-remote.sh"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ 파이프라인 성공 — Build #${env.BUILD_NUMBER} (${env.GIT_COMMIT_SHORT})"
            // 슬랙/Teams 알림은 환경에 맞게 추가
        }
        failure {
            echo "❌ 파이프라인 실패 — Build #${env.BUILD_NUMBER}"
        }
        always {
            // 워크스페이스 정리 (node_modules 등 대용량 파일 제외)
            cleanWs(patterns: [
                [pattern: 'node_modules/', type: 'EXCLUDE'],
                [pattern: '.next/', type: 'EXCLUDE']
            ])
        }
    }
}
