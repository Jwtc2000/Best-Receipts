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
        stage('Supply chain') {
            steps {
                sh 'osv-scanner scan source -L package-lock.json'
            }
        }
    }
}
