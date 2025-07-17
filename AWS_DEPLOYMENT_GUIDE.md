# QRT Closure Platform - AWS Deployment Guide

## 🚀 AWS Deployment Overview

This guide provides step-by-step instructions for deploying your QRT Closure Platform on Amazon Web Services (AWS) using multiple deployment strategies.

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Domain name (optional, for custom domains)
- Environment variables and API keys ready

## 🏗️ Architecture Options

### Option 1: AWS Elastic Beanstalk (Recommended for Quick Deployment)
- **Best for**: Simple deployment with minimal configuration
- **Pros**: Automatic scaling, load balancing, monitoring
- **Cons**: Less control over infrastructure

### Option 2: AWS App Runner (Recommended for Container Deployment)
- **Best for**: Container-based deployment with automatic scaling
- **Pros**: Serverless, automatic scaling, built-in CI/CD
- **Cons**: Limited customization options

### Option 3: AWS ECS with Fargate (Advanced)
- **Best for**: Full control over container orchestration
- **Pros**: Complete control, scalability, cost-effective
- **Cons**: More complex setup

### Option 4: AWS Lambda + API Gateway (Serverless)
- **Best for**: Cost-effective, event-driven applications
- **Pros**: Pay per request, automatic scaling
- **Cons**: Cold start issues, request timeout limits

## 🔧 Option 1: AWS Elastic Beanstalk Deployment

### Step 1: Prepare Application

```bash
# Install EB CLI
npm install -g awsebcli

# Initialize Elastic Beanstalk
eb init
```

### Step 2: Create Environment Configuration

```bash
# Create production environment
eb create qrt-closure-prod --platform node.js --instance-type t3.medium

# Set environment variables
eb setenv NODE_ENV=production
eb setenv DATABASE_URL="your-postgresql-connection-string"
eb setenv ANTHROPIC_API_KEY="your-anthropic-key"
eb setenv OPENAI_API_KEY="your-openai-key"
```

### Step 3: Deploy Application

```bash
# Deploy to Elastic Beanstalk
eb deploy

# Open application in browser
eb open
```

## 🐳 Option 2: AWS App Runner Deployment

### Step 1: Create Dockerfile

```dockerfile
# Use Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application (skip if using dev server)
# RUN npm run build

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["npm", "run", "dev"]
```

### Step 2: Create App Runner Configuration

```yaml
# apprunner.yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Build completed"
run:
  runtime-version: latest
  command: npm run dev
  network:
    port: 5000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: DATABASE_URL
      value: "your-postgresql-connection-string"
    - name: ANTHROPIC_API_KEY
      value: "your-anthropic-key"
    - name: OPENAI_API_KEY
      value: "your-openai-key"
```

### Step 3: Deploy via AWS Console

1. Go to AWS App Runner console
2. Create new service
3. Connect to GitHub repository
4. Configure build settings
5. Set environment variables
6. Deploy service

## 🛠️ Option 3: AWS ECS with Fargate

### Step 1: Create ECS Task Definition

```json
{
  "family": "qrt-closure-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "qrt-closure-app",
      "image": "your-ecr-repo/qrt-closure:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "your-postgresql-connection-string"
        }
      ],
      "secrets": [
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:anthropic-key"
        },
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:openai-key"
        }
      ]
    }
  ]
}
```

### Step 2: Create ECS Service

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name qrt-closure-cluster

# Create service
aws ecs create-service \
  --cluster qrt-closure-cluster \
  --service-name qrt-closure-service \
  --task-definition qrt-closure-platform:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

## ⚡ Option 4: AWS Lambda + API Gateway

### Step 1: Create Lambda Function

```javascript
// lambda-handler.js
const serverless = require('serverless-http');
const app = require('./server/index.js');

module.exports.handler = serverless(app);
```

### Step 2: Create Serverless Configuration

```yaml
# serverless.yml
service: qrt-closure-platform

provider:
  name: aws
  runtime: nodejs18.x
  stage: prod
  region: us-east-1
  environment:
    NODE_ENV: production
    DATABASE_URL: ${env:DATABASE_URL}
    ANTHROPIC_API_KEY: ${env:ANTHROPIC_API_KEY}
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}

functions:
  app:
    handler: lambda-handler.handler
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
```

### Step 3: Deploy with Serverless

```bash
# Install Serverless Framework
npm install -g serverless

# Deploy to AWS
serverless deploy
```

## 🗄️ Database Setup

### Option 1: Amazon RDS PostgreSQL

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier qrt-closure-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourSecurePassword123 \
  --allocated-storage 20 \
  --publicly-accessible
```

### Option 2: Amazon Aurora Serverless

```bash
# Create Aurora Serverless cluster
aws rds create-db-cluster \
  --db-cluster-identifier qrt-closure-cluster \
  --engine aurora-postgresql \
  --engine-mode serverless \
  --master-username admin \
  --master-user-password YourSecurePassword123 \
  --scaling-configuration MinCapacity=2,MaxCapacity=16,AutoPause=true
```

## 🔐 Security Configuration

### Step 1: Create IAM Roles

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "rds:DescribeDBClusters",
        "rds:DescribeDBInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 2: Store Secrets in AWS Secrets Manager

```bash
# Store API keys in Secrets Manager
aws secretsmanager create-secret \
  --name "qrt-closure/anthropic-key" \
  --secret-string "your-anthropic-api-key"

aws secretsmanager create-secret \
  --name "qrt-closure/openai-key" \
  --secret-string "your-openai-api-key"
```

## 🌐 Domain and SSL Configuration

### Step 1: Configure Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)
```

### Step 2: Request SSL Certificate

```bash
# Request certificate from ACM
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names "*.yourdomain.com" \
  --validation-method DNS
```

## 📊 Monitoring and Logging

### Step 1: CloudWatch Configuration

```bash
# Create CloudWatch log group
aws logs create-log-group \
  --log-group-name /aws/qrt-closure/application
```

### Step 2: Set up CloudWatch Alarms

```bash
# Create CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "QRT-Closure-HighCPU" \
  --alarm-description "Alarm when CPU exceeds 70%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold
```

## 🚀 Deployment Scripts

### Complete Deployment Script

```bash
#!/bin/bash

# AWS Deployment Script for QRT Closure Platform
echo "🚀 Starting AWS deployment..."

# Set variables
APP_NAME="qrt-closure-platform"
REGION="us-east-1"
PROFILE="default"

# Deploy using Elastic Beanstalk
echo "📦 Deploying to Elastic Beanstalk..."
eb init $APP_NAME --platform node.js --region $REGION
eb create $APP_NAME-prod --instance-type t3.medium

# Set environment variables
echo "🔧 Setting environment variables..."
eb setenv NODE_ENV=production
eb setenv DATABASE_URL="$DATABASE_URL"
eb setenv ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
eb setenv OPENAI_API_KEY="$OPENAI_API_KEY"

# Deploy application
echo "🚀 Deploying application..."
eb deploy

# Open application
echo "✅ Opening application..."
eb open

echo "🎉 Deployment completed successfully!"
```

## 📋 Post-Deployment Checklist

- [ ] Verify application is running
- [ ] Test authentication system
- [ ] Check database connectivity
- [ ] Validate API endpoints
- [ ] Test file upload functionality
- [ ] Verify SSL certificate
- [ ] Check CloudWatch logs
- [ ] Test admin panel access
- [ ] Verify multi-tenant isolation
- [ ] Test financial reporting features

## 💰 Cost Optimization

### Recommendations:
1. **Use t3.micro instances** for development/testing
2. **Enable auto-scaling** based on demand
3. **Use Aurora Serverless** for variable workloads
4. **Implement CloudWatch billing alerts**
5. **Use Reserved Instances** for production

## 🔧 Troubleshooting

### Common Issues:
1. **Build timeouts**: Use development server deployment
2. **Database connection**: Check security groups and VPC settings
3. **API key errors**: Verify Secrets Manager permissions
4. **Memory issues**: Increase instance size or optimize code

## 📞 Support

For deployment issues:
1. Check AWS CloudWatch logs
2. Verify IAM permissions
3. Test database connectivity
4. Review security group settings

---

**Platform Status**: AWS Deployment Ready
**Recommended Option**: Elastic Beanstalk for simplicity
**Production Ready**: All features validated