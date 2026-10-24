pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    tools {
        nodejs 'NodeJS-26'
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

        stage('Validate Code') {
            steps {
                sh 'npm run check'
            }
        }

        stage('Test API') {
            steps {
                sh 'npm test'
            }
        }

        stage('Package') {
            steps {
                sh 'npm pack --dry-run'
            }
        }
    }

    post {
        success {
            echo 'CI passed: API validation and tests succeeded.'
        }
        failure {
            echo 'CI failed. Check the failing stage in Console Output.'
        }
    }
}
