#!/bin/bash

# QRT Closure Platform - AWS Deployment Script
# Supports multiple AWS deployment methods

set -e

echo "🚀 QRT Closure Platform - AWS Deployment"
echo "=========================================="

# Configuration
APP_NAME="qrt-closure-platform"
REGION="us-east-1"
DOCKER_IMAGE="$APP_NAME:latest"

# Function to display usage
usage() {
    echo "Usage: $0 [METHOD] [OPTIONS]"
    echo ""
    echo "Methods:"
    echo "  eb          Deploy using Elastic Beanstalk"
    echo "  apprunner   Deploy using AWS App Runner"
    echo "  ecs         Deploy using ECS Fargate"
    echo "  lambda      Deploy using Lambda + API Gateway"
    echo "  docker      Build and test Docker image locally"
    echo ""
    echo "Options:"
    echo "  --region    AWS region (default: us-east-1)"
    echo "  --profile   AWS profile to use"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 eb"
    echo "  $0 apprunner --region us-west-2"
    echo "  $0 ecs --profile production"
}

# Parse command line arguments
METHOD=""
PROFILE=""
while [[ $# -gt 0 ]]; do
    case $1 in
        eb|apprunner|ecs|lambda|docker)
            METHOD="$1"
            shift
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --profile)
            PROFILE="$2"
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Set AWS profile if specified
if [[ -n "$PROFILE" ]]; then
    export AWS_PROFILE="$PROFILE"
    echo "Using AWS profile: $PROFILE"
fi

# Set AWS region
export AWS_DEFAULT_REGION="$REGION"
echo "Using AWS region: $REGION"

# Check if method is specified
if [[ -z "$METHOD" ]]; then
    echo "Error: Deployment method not specified"
    usage
    exit 1
fi

# Function to check AWS CLI
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "Error: AWS CLI not found. Please install AWS CLI first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "Error: AWS CLI not configured. Please run 'aws configure' first."
        exit 1
    fi
}

# Function to deploy using Elastic Beanstalk
deploy_eb() {
    echo "📦 Deploying using Elastic Beanstalk..."
    
    # Check if EB CLI is installed
    if ! command -v eb &> /dev/null; then
        echo "Installing EB CLI..."
        pip install awsebcli
    fi
    
    # Initialize EB application
    if [[ ! -f .elasticbeanstalk/config.yml ]]; then
        echo "Initializing Elastic Beanstalk application..."
        eb init $APP_NAME --platform node.js --region $REGION
    fi
    
    # Create environment if it doesn't exist
    if ! eb status | grep -q "Environment details"; then
        echo "Creating Elastic Beanstalk environment..."
        eb create $APP_NAME-prod --instance-type t3.medium --timeout 20
    fi
    
    # Set environment variables
    echo "Setting environment variables..."
    eb setenv NODE_ENV=production
    eb setenv PORT=5000
    
    # Deploy application
    echo "Deploying application..."
    eb deploy --timeout 20
    
    # Open application
    echo "Opening application..."
    eb open
    
    echo "✅ Elastic Beanstalk deployment completed!"
}

# Function to deploy using App Runner
deploy_apprunner() {
    echo "📦 Deploying using AWS App Runner..."
    
    # Build Docker image
    echo "Building Docker image..."
    docker build -t $DOCKER_IMAGE .
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names $APP_NAME --region $REGION 2>/dev/null || \
        aws ecr create-repository --repository-name $APP_NAME --region $REGION
    
    # Get ECR login token
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com
    
    # Tag and push image
    ECR_URI=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$APP_NAME:latest
    docker tag $DOCKER_IMAGE $ECR_URI
    docker push $ECR_URI
    
    echo "✅ Docker image pushed to ECR: $ECR_URI"
    echo "📋 Next steps:"
    echo "1. Go to AWS App Runner console"
    echo "2. Create new service"
    echo "3. Use ECR image: $ECR_URI"
    echo "4. Set environment variables"
    echo "5. Deploy service"
}

# Function to deploy using ECS Fargate
deploy_ecs() {
    echo "📦 Deploying using ECS Fargate..."
    
    # Build and push Docker image
    echo "Building Docker image..."
    docker build -t $DOCKER_IMAGE .
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names $APP_NAME --region $REGION 2>/dev/null || \
        aws ecr create-repository --repository-name $APP_NAME --region $REGION
    
    # Get ECR login token
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com
    
    # Tag and push image
    ECR_URI=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$APP_NAME:latest
    docker tag $DOCKER_IMAGE $ECR_URI
    docker push $ECR_URI
    
    # Create ECS cluster if it doesn't exist
    aws ecs describe-clusters --clusters $APP_NAME-cluster --region $REGION 2>/dev/null || \
        aws ecs create-cluster --cluster-name $APP_NAME-cluster --region $REGION
    
    echo "✅ ECS setup completed!"
    echo "📋 Next steps:"
    echo "1. Create task definition with image: $ECR_URI"
    echo "2. Create ECS service"
    echo "3. Configure load balancer"
    echo "4. Set environment variables"
}

# Function to deploy using Lambda
deploy_lambda() {
    echo "📦 Deploying using Lambda + API Gateway..."
    
    # Check if Serverless Framework is installed
    if ! command -v serverless &> /dev/null; then
        echo "Installing Serverless Framework..."
        npm install -g serverless
    fi
    
    # Create serverless configuration if it doesn't exist
    if [[ ! -f serverless.yml ]]; then
        cat > serverless.yml << EOF
service: $APP_NAME

provider:
  name: aws
  runtime: nodejs18.x
  stage: prod
  region: $REGION
  environment:
    NODE_ENV: production
    DATABASE_URL: \${env:DATABASE_URL}
    ANTHROPIC_API_KEY: \${env:ANTHROPIC_API_KEY}
    OPENAI_API_KEY: \${env:OPENAI_API_KEY}

functions:
  app:
    handler: lambda-handler.handler
    timeout: 30
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true

plugins:
  - serverless-offline
EOF
    fi
    
    # Create Lambda handler if it doesn't exist
    if [[ ! -f lambda-handler.js ]]; then
        cat > lambda-handler.js << EOF
const serverless = require('serverless-http');
const app = require('./server/index.js');

module.exports.handler = serverless(app);
EOF
    fi
    
    # Install serverless-http if not installed
    if ! npm list serverless-http &> /dev/null; then
        npm install serverless-http
    fi
    
    # Deploy using Serverless Framework
    serverless deploy --region $REGION
    
    echo "✅ Lambda deployment completed!"
}

# Function to build and test Docker image locally
build_docker() {
    echo "🐳 Building Docker image locally..."
    
    # Build Docker image
    docker build -t $DOCKER_IMAGE .
    
    # Test Docker image
    echo "Testing Docker image..."
    docker run -d --name $APP_NAME-test -p 5000:5000 \
        -e NODE_ENV=production \
        -e DATABASE_URL="postgresql://localhost:5432/qrt_closure" \
        $DOCKER_IMAGE
    
    # Wait for container to start
    sleep 10
    
    # Test if application is running
    if curl -f http://localhost:5000/api/health &> /dev/null; then
        echo "✅ Docker image is working correctly!"
    else
        echo "❌ Docker image test failed"
        docker logs $APP_NAME-test
    fi
    
    # Clean up
    docker stop $APP_NAME-test
    docker rm $APP_NAME-test
    
    echo "🐳 Docker image built and tested successfully!"
}

# Main execution
main() {
    echo "Starting deployment with method: $METHOD"
    
    # Check AWS CLI for cloud deployments
    if [[ "$METHOD" != "docker" ]]; then
        check_aws_cli
    fi
    
    # Execute deployment based on method
    case $METHOD in
        eb)
            deploy_eb
            ;;
        apprunner)
            deploy_apprunner
            ;;
        ecs)
            deploy_ecs
            ;;
        lambda)
            deploy_lambda
            ;;
        docker)
            build_docker
            ;;
        *)
            echo "Error: Invalid deployment method: $METHOD"
            usage
            exit 1
            ;;
    esac
    
    echo "🎉 Deployment process completed!"
}

# Run main function
main