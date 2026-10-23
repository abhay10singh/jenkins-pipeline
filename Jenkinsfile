pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    tools {
        nodejs 'NodeJS-1.6.6'
    }

    options {
        timestamps()
    }

    stages {
        stage('Verify Environment') {
            steps {
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
                archiveArtifacts artifacts: 'dist/**',
                                 fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'CI passed: tests and build completed.'
        }
        failure {
            echo 'CI failed. Inspect the stage logs.'
        }
    }
}
