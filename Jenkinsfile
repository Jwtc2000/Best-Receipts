pipeline {
    agent { label 'agent1' }

    stages {
        stage('Secrets scan') {
            steps {
                sh 'gitleaks dir . --redact -v'
            }
        }
        stage('SAST') {
            steps {
                sh 'semgrep scan --config p/default --config p/typescript --config p/react --config p/owasp-top-ten --error --metrics=off .'
            }
        }
        stage('Workflow audit') {
            steps {
                sh 'zizmor .github/workflows/'
            }
        }
        stage('Dockerfile lint') {
            steps {
                sh 'hadolint ci/agent/Dockerfile'
            }
        }
        stage('Supply chain') {
            steps {
                sh 'osv-scanner scan source -L package-lock.json'
            }
        }
        // The two stages below only run on main, not on PRs: a full-history
        // secrets scan and SBOM generation are both slower than the
        // per-commit checks above and are about the state of main as a
        // whole, not about vetting an individual change before merge.
        stage('Secrets scan (full history)') {
            when { branch 'main' }
            steps {
                sh 'gitleaks git . --redact'
            }
        }
        stage('SBOM') {
            when { branch 'main' }
            steps {
                sh 'syft dir:. -o cyclonedx-json > sbom.json'
                archiveArtifacts artifacts: 'sbom.json'
            }
        }
    }
}
