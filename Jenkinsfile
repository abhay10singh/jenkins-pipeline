pipeline {
    agent any
	
    triggers {
       pollSCM('H/5 * * * *')
	}

    options {
        timestamps()
    }

    stages {
        stage('Verify Environment') {
            steps {
                sh 'uname -a'
                sh 'git --version'
                sh 'echo "Jenkins environment verified"'
            }
        }

        stage('Validate Source') {
            steps {
                sh 'test -f README.md'
                sh 'test -f Jenkinsfile'
                sh 'echo "Required files found"'
            }
        }

        stage('Build') {
            steps {
                sh 'mkdir -p build'
                sh 'printf "Build number: %s\n" "$BUILD_NUMBER" > build/build-info.txt'
                sh 'cat build/build-info.txt'
            }
        }
    }

    post {
        success {
            echo 'CI checks passed!'
        }
        failure {
            echo 'Pipeline failed. Check the console output.'
        }
    }
}
