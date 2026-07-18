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
                sh 'semgrep scan --config auto --error --metrics=off .'
            }
        }
    }
}
