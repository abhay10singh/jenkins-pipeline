pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
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
                sh 'docker version'
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

        stage('Build Docker Image') {
            steps {
                sh 'docker build --pull -t taskflow:${BUILD_NUMBER} -t taskflow:latest .'
                sh 'docker image inspect taskflow:${BUILD_NUMBER} >/dev/null'
                echo 'Docker image built successfully.'
            }
        }
    }

    post {
        success {
            echo 'CI passed: tests succeeded and Docker image was built.'
        }
        failure {
            echo 'CI failed. Inspect Console Output.'
        }
    }
}
