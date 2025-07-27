pipeline {
  agent any

  environment {
    NODE_ENV = "production"
  }

  stages {
    stage('Checkout Code') {
      steps {
        git credentialsId: 'github-creds', url: 'https://github.com/your-username/your-backend-repo.git'
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm install'
      }
    }

    stage('Lint Code') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Run Tests') {
      steps {
        sh 'npm run test'
      }
    }

    stage('Deploy to Render') {
  steps {
    withCredentials([string(credentialsId: 'render-deploy-hook', variable: 'RENDER_HOOK')]) {
      sh 'curl -X POST $RENDER_HOOK'
    }
  }
}
  }
}
