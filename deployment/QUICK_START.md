# MediConnect Railway Deployment - Quick Start Guide

## 🚀 Quick Deployment Steps

### Railway Deployment (10 minutes)

---

## 🚂 Railway Deployment

### Step 1: Set Up MongoDB Atlas (Free Tier) - 3 minutes
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 tier - free)
4. Set up database access:
   - Create a database user with username/password
   - Note down the credentials
5. Set up network access:
   - Add IP address: `0.0.0.0/0` (allow from anywhere)
6. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

### Step 2: Set Up AWS S3 (Free Tier) - 3 minutes
1. Go to AWS S3 Console
2. Create a new bucket named `mediconnect-files`
3. Configure CORS for the bucket:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```
4. Create an IAM user with S3 access:
   - Go to IAM Console
   - Create a new user
   - Attach `AmazonS3FullAccess` policy
   - Generate access keys
   - Note down Access Key ID and Secret Access Key

### Step 3: Set Up Railway Account - 2 minutes
1. Go to [Railway](https://railway.app)
2. Create a free account (sign up with GitHub recommended)
3. Create a new project
4. Connect your GitHub repository

### Step 4: Deploy with Railway - 2 minutes
1. **Railway will automatically detect** your project structure
2. **Add environment variables** in Railway dashboard:
   ```bash
   # Database
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/mediconnect
   
   # JWT Secret (generate a strong secret)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # AWS S3
   S3_BUCKET_NAME=mediconnect-files
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   
   # Server Configuration
   SERVER_PORT=8080
   SERVER_CONTEXT_PATH=/api
   ENVIRONMENT=prod
   ```

3. **Deploy backend service**:
   - Railway will use `railway.json` and `nixpacks.toml`
   - Click "Deploy" - Railway builds and deploys automatically

4. **Deploy frontend service**:
   - Add new service in Railway project
   - Set root directory to `mediconnect-ui`
   - Railway will use frontend `railway.json` and `nixpacks.toml`
   - Click "Deploy"

### Step 5: Configure Domains - 2 minutes
1. **Railway provides free subdomains**:
   - Backend: `your-backend.railway.app`
   - Frontend: `your-frontend.railway.app`

2. **Update environment variables** with actual URLs:
   ```bash
   CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app
   WEBSOCKET_ALLOWED_ORIGINS=https://your-frontend.railway.app
   REACT_APP_API_URL=https://your-backend.railway.app/api
   REACT_APP_WS_URL=wss://your-backend.railway.app/ws
   ```

3. **Add custom domain** (optional):
   - Go to Settings → Domains
   - Add your custom domain
   - Railway handles SSL automatically

### Step 6: Verify Deployment
1. Check if services are running in Railway dashboard
2. View logs if needed
3. Visit your frontend URL: `https://your-frontend.railway.app`
4. Test the application

---

## 🔧 Troubleshooting

### Railway Deployment Issues

1. **Service won't start**:
   - Check logs in Railway dashboard
   - Verify environment variables are set correctly
   - Check MongoDB connection string format

2. **Build failures**:
   - Check build logs in Railway dashboard
   - Verify `nixpacks.toml` configuration
   - Ensure all dependencies are specified

3. **Environment variables**:
   - Verify all required variables are set
   - Check variable values in Railway dashboard
   - Update URLs with actual Railway subdomains

4. **Database connection issues**:
   - Verify MongoDB Atlas network access
   - Check connection string format
   - Test connection from Railway

### Railway Dashboard Features
- **Real-time logs** for each service
- **Performance metrics** and resource usage
- **Deployment history** with rollback options
- **Health checks** and status monitoring

## 💰 Cost Optimization

### Free Tier Limits
- **Railway**: $5 credit monthly
- **MongoDB Atlas**: 512 MB storage
- **AWS S3**: 5 GB storage
- **Data transfer**: 15 GB/month

### Monitor Usage
- Set up Railway billing alerts
- Monitor usage in Railway dashboard
- Check usage in AWS Console

## 🔒 Security Best Practices

1. **Environment Variables (Vault)**:
   - Store all secrets in Railway Variables
   - Never commit secrets to version control
   - Use strong JWT secrets
   - Rotate secrets regularly

2. **Access Control**:
   - Use Railway's built-in access control
   - Limit team member access to production
   - Regular security audits

3. **Network Security**:
   - Railway handles SSL automatically
   - Configure CORS properly
   - Use HTTPS everywhere

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify all configuration values
3. Test each component individually
4. Check Railway service status
5. Review this guide for common solutions

## 🎯 Recommendation

**Railway Deployment** provides:
- ✅ Faster deployment (10 minutes)
- ✅ Built-in Vault integration
- ✅ Automatic SSL certificates
- ✅ Auto-scaling capabilities
- ✅ Simplified troubleshooting
- ✅ Better security isolation
- ✅ Easier scaling
- ✅ Built-in monitoring

Your MediConnect application should now be running on Railway! 🎉 