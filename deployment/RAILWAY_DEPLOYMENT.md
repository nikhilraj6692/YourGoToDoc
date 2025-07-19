# MediConnect Railway Deployment Guide

## 🚂 Railway Overview

Railway is a modern deployment platform that makes it easy to deploy full-stack applications. It provides:
- **Automatic deployments** from Git
- **Built-in databases** (PostgreSQL, MySQL, MongoDB)
- **Environment variables** management
- **Custom domains** with SSL
- **Scaling** capabilities
- **Vault integration** for secrets management

## 🗝️ Vault Integration

Railway provides built-in Vault functionality for secure secrets management:

### Setting up Vault in Railway
1. **Go to your Railway project**
2. **Navigate to Variables tab**
3. **Add your secrets** as environment variables
4. **Railway automatically encrypts** and stores them securely

### Vault Best Practices
- ✅ **Never commit secrets** to version control
- ✅ **Use Railway's Variables** for all sensitive data
- ✅ **Rotate secrets** regularly
- ✅ **Use different values** for dev/staging/prod
- ✅ **Limit access** to production secrets

## 🚀 Quick Deployment

### Step 1: Install Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### Step 2: Initialize Railway Project
```bash
# Navigate to your project
cd MediConnect

# Initialize Railway project
railway init

# Link to existing project (if you created one in Railway dashboard)
railway link
```

### Step 3: Set up Environment Variables (Vault)
```bash
# Set environment variables using Railway CLI
railway variables set MONGODB_URI="your-mongodb-connection-string"
railway variables set JWT_SECRET="your-super-secret-jwt-key"
railway variables set S3_BUCKET_NAME="your-s3-bucket"
railway variables set AWS_ACCESS_KEY_ID="your-aws-access-key"
railway variables set AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
railway variables set CORS_ALLOWED_ORIGINS="https://your-domain.railway.app"
railway variables set REACT_APP_API_URL="https://your-backend.railway.app/api"
railway variables set REACT_APP_WS_URL="wss://your-backend.railway.app/ws"
```

### Step 4: Deploy Backend
```bash
# Deploy backend service
railway up

# Check deployment status
railway status

# View logs
railway logs
```

### Step 5: Deploy Frontend
```bash
# Navigate to frontend directory
cd mediconnect-ui

# Deploy frontend service
railway up

# Check deployment status
railway status
```

## 🔧 Railway Configuration

### Backend Configuration (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "java -jar target/mediconnect.jar",
    "healthcheckPath": "/api/actuator/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Frontend Configuration (mediconnect-ui/railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🗄️ Database Setup

### Option 1: Railway MongoDB Plugin
1. **Add MongoDB plugin** in Railway dashboard
2. **Get connection string** from plugin
3. **Set MONGODB_URI** environment variable

### Option 2: MongoDB Atlas (External)
1. **Use existing MongoDB Atlas** cluster
2. **Set MONGODB_URI** to Atlas connection string
3. **Configure network access** to allow Railway IPs

## 🔐 Environment Variables (Vault)

### Required Variables
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mediconnect

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRATION=15
JWT_REFRESH_TOKEN_EXPIRATION=7

# AWS S3 (for file storage)
S3_BUCKET_NAME=mediconnect-files
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app
WEBSOCKET_ALLOWED_ORIGINS=https://your-frontend.railway.app

# Frontend Configuration
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_WS_URL=wss://your-backend.railway.app/ws

# Server Configuration
SERVER_PORT=8080
SERVER_CONTEXT_PATH=/api
ENVIRONMENT=prod
```

### Optional Variables
```bash
# Logging
LOG_LEVEL=INFO
LOG_FILE_PATH=logs/mediconnect.log

# Security
ENABLE_HTTPS=true
ENABLE_HEALTH_CHECK=true
ENABLE_METRICS=false

# Performance
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# File Upload
MAX_FILE_SIZE=10
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
```

## 🌐 Domain Configuration

### Custom Domain Setup
1. **Go to Railway dashboard**
2. **Navigate to Settings → Domains**
3. **Add custom domain**
4. **Update DNS records** as instructed
5. **SSL certificate** is automatically provisioned

### Railway Subdomain
- Railway provides free subdomains: `your-app.railway.app`
- Update CORS and WebSocket origins accordingly

## 📊 Monitoring and Logs

### View Logs
```bash
# View real-time logs
railway logs

# View logs for specific service
railway logs --service backend

# View logs with timestamps
railway logs --timestamps
```

### Health Checks
```bash
# Check backend health
curl https://your-backend.railway.app/api/actuator/health

# Check frontend health
curl https://your-frontend.railway.app/
```

### Railway Dashboard
- **Real-time metrics** in Railway dashboard
- **Deployment history** and rollback options
- **Environment variable** management
- **Service scaling** controls

## 🔄 Continuous Deployment

### Automatic Deployments
1. **Connect GitHub repository** to Railway
2. **Configure branch** for auto-deployment
3. **Railway automatically deploys** on push

### Manual Deployments
```bash
# Deploy specific service
railway up --service backend

# Deploy with specific environment
railway up --environment production

# Deploy from specific branch
railway up --branch feature/new-feature
```

## 🔧 Railway CLI Commands

### Project Management
```bash
# List projects
railway projects

# Switch project
railway link

# Show project info
railway status
```

### Service Management
```bash
# List services
railway services

# Deploy service
railway up

# Stop service
railway down

# Restart service
railway restart
```

### Environment Variables
```bash
# List variables
railway variables

# Set variable
railway variables set KEY=value

# Get variable
railway variables get KEY

# Delete variable
railway variables delete KEY
```

### Logs and Monitoring
```bash
# View logs
railway logs

# View logs for service
railway logs --service backend

# Follow logs
railway logs --follow
```

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
railway logs --service backend

# Verify nixpacks.toml configuration
# Ensure all dependencies are specified
```

#### Environment Variables
```bash
# Verify variables are set
railway variables

# Check variable values
railway variables get MONGODB_URI
```

#### Database Connection
```bash
# Test MongoDB connection
# Check MONGODB_URI format
# Verify network access
```

#### CORS Issues
```bash
# Update CORS_ALLOWED_ORIGINS
# Include both frontend and backend domains
# Check for trailing slashes
```

### Debug Commands
```bash
# Check service status
railway status

# View deployment history
railway deployments

# Check environment
railway variables

# Test connectivity
curl https://your-app.railway.app/api/actuator/health
```

## 💰 Cost Optimization

### Railway Pricing
- **Free tier**: $5 credit monthly
- **Pay-as-you-go**: Based on usage
- **Team plans**: For collaboration

### Cost Optimization Tips
1. **Use free tier** for development
2. **Scale down** during low usage
3. **Monitor usage** in Railway dashboard
4. **Use external databases** if needed

## 🔒 Security Best Practices

### Vault Security
1. **Rotate secrets** regularly
2. **Use strong JWT secrets**
3. **Limit access** to production variables
4. **Audit variable access** regularly

### Application Security
1. **Enable HTTPS** everywhere
2. **Configure CORS** properly
3. **Use environment variables** for all secrets
4. **Regular security updates**

## 📚 Migration from AWS

### Key Differences
| AWS | Railway |
|-----|---------|
| EC2 instances | Managed containers |
| Manual scaling | Auto-scaling |
| Manual SSL setup | Automatic SSL |
| Complex networking | Simplified networking |
| Manual monitoring | Built-in monitoring |

### Migration Steps
1. **Export environment variables** from AWS
2. **Set up Railway project**
3. **Configure Railway variables**
4. **Deploy application**
5. **Update DNS** to point to Railway
6. **Test thoroughly**
7. **Decommission AWS resources**

## 🎯 Next Steps

1. **Set up Railway account** and install CLI
2. **Create Railway project** and link repository
3. **Configure environment variables** (Vault)
4. **Deploy backend** and test
5. **Deploy frontend** and test
6. **Configure custom domain** (optional)
7. **Set up monitoring** and alerts
8. **Document deployment process**

---

**Happy Deploying on Railway! 🚂** 