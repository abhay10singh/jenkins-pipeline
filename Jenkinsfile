pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    tools {
        nodejs 'NodeJS-26'
    }

    environment {
        ACR_LOGIN_SERVER = 'taskflowacr1792851774-ade2bqchgngyhag5.azurecr.io'
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

        stage('Build and Push to ACR') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'acr-sp-credentials',
                        usernameVariable: 'ACR_USERNAME',
                        passwordVariable: 'ACR_PASSWORD'
                    )
                ]) {
                    sh '''
                        set +x
                        set -eu

                        printf '%s' "$ACR_PASSWORD" |
                          docker login "$ACR_LOGIN_SERVER" \
                            --username "$ACR_USERNAME" \
                            --password-stdin

                        trap 'docker logout "$ACR_LOGIN_SERVER" >/dev/null 2>&1 || true' EXIT

                        docker build --pull \
                          -t "$ACR_LOGIN_SERVER/taskflow:$BUILD_NUMBER" \
                          -t "$ACR_LOGIN_SERVER/taskflow:latest" .

                        docker push "$ACR_LOGIN_SERVER/taskflow:$BUILD_NUMBER"
                        docker push "$ACR_LOGIN_SERVER/taskflow:latest"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'CI passed: tests completed and image published to ACR.'
        }
        failure {
            echo 'CI failed. Check the Console Output.'
        }
    }
}
