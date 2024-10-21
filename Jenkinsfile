pipeline {
    agent any
    stages {
        stage('Clone repository') {
            steps {
                git 'https://github.com/alinches22/course-tasks.git'
            }
        }
        stage('Build and Test') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'sudo dpkg -i ~/debpackage.deb || sudo rpm -i ~/rpmbuild/RPMS/x86_64/file_count-1.0-1.x86_64.rpm'
                        sh '/usr/local/bin/file_count.sh'
                    } else {
                        error "This pipeline only runs on Unix-like systems."
                    }
                }
            }
        }
    }
}
