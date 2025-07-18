# Zoho MCP Server + AnythingLLM Railway Deployment Guide

This guide provides step-by-step instructions for deploying your Zoho MCP server together with AnythingLLM on Railway to create a Zoho expert agent.

## Overview

The deployment consists of:
1. **Zoho MCP Server**: Your custom MCP server for Zoho CRM and Books integration
2. **AnythingLLM**: AI chat interface with MCP integration capabilities
3. **Nginx**: Reverse proxy for unified access (optional)

## Prerequisites

### 1. Railway Account
- Sign up at [Railway.app](https://railway.app)
- Install Railway CLI: `npm install -g @railway/cli`

### 2. Zoho OAuth Setup
1. Go to [Zoho Developer Console](https://api-console.zoho.com)
2. Create a new "Server-based Applications"
3. Set redirect URI to your Railway domain (e.g., `https://your-app.railway.app/callback`)
4. Note your Client ID and Client Secret
5. Generate a refresh token using the authorization flow

### 3. Zoho Books Organization ID
- Log into your Zoho Books account
- Go to Settings → Organization → Organization Info
- Copy the Organization ID

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Clone and prepare your repository:**
```bash
git clone <your-repo-url>
cd zoho-mcp-server
```

2. **Create production configuration:**
```bash
cp zoho-config.example.json zoho-config.json
```

3. **Update zoho-config.json with your production settings:**
```json
{
  "environments": {
    "production": {
      "clientId": "your_client_id",
      "clientSecret": "your_client_secret",
      "redirectUri": "https://your-app.railway.app/callback",
      "refreshToken": "your_refresh_token",
      "dataCenter": "com",
      "organizationId": "your_books_org_id",
      "scopes": "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoBooks.fullaccess.all"
    }
  },
  "defaultEnvironment": "production"
}
```

### Step 2: Deploy to Railway

#### Option A: Using Railway CLI

1. **Login to Railway:**
```bash
railway login
```

2. **Initialize Railway project:**
```bash
railway init
```

3. **Set environment variables:**
```bash
railway variables set ZOHO_CLIENT_ID=your_client_id
railway variables set ZOHO_CLIENT_SECRET=your_client_secret
railway variables set ZOHO_REFRESH_TOKEN=your_refresh_token
railway variables set ZOHO_DATA_CENTER=com
railway variables set ZOHO_BOOKS_ORGANIZATION_ID=your_org_id
railway variables set NODE_ENV=production
railway variables set MULTI_CONFIG_ENABLED=true
railway variables set MULTI_CONFIG_ENVIRONMENT=production
```

4. **Deploy:**
```bash
railway up
```

#### Option B: Using Railway Dashboard

1. **Connect your GitHub repository:**
   - Go to Railway Dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure environment variables:**
   - Go to your project settings
   - Add the following variables:
     ```
     ZOHO_CLIENT_ID=your_client_id
     ZOHO_CLIENT_SECRET=your_client_secret
     ZOHO_REFRESH_TOKEN=your_refresh_token
     ZOHO_DATA_CENTER=com
     ZOHO_BOOKS_ORGANIZATION_ID=your_org_id
     NODE_ENV=production
     MULTI_CONFIG_ENABLED=true
     MULTI_CONFIG_ENVIRONMENT=production
     ```

3. **Deploy:**
   - Railway will automatically build and deploy your application

### Step 3: Deploy AnythingLLM

#### Option A: Separate Railway Project

1. **Create a new Railway project for AnythingLLM:**
```bash
mkdir anythingllm-deployment
cd anythingllm-deployment
```

2. **Create docker-compose.yml for AnythingLLM:**
```yaml
version: '3.8'
services:
  anythingllm:
    image: anythingllm/anythingllm:latest
    environment:
      - STORAGE_DIR=/app/server/storage
      - UID=1000
      - GID=1000
      - SERVER_PORT=3001
      - MCP_SERVERS_ENABLED=true
      - MCP_ZOHO_SERVER_URL=https://your-zoho-mcp-app.railway.app
      - MCP_ZOHO_SERVER_NAME=zoho-crm-books
    ports:
      - "3001:3001"
    volumes:
      - anythingllm_storage:/app/server/storage
      - anythingllm_uploads:/app/server/uploads

volumes:
  anythingllm_storage:
  anythingllm_uploads:
```

3. **Deploy to Railway:**
```bash
railway up
```

#### Option B: Using Railway's Docker Support

1. **Create a new Railway project**
2. **Add the AnythingLLM Docker image:**
   - In Railway dashboard, add a new service
   - Choose "Deploy from Docker image"
   - Use: `anythingllm/anythingllm:latest`

3. **Configure environment variables:**
```
STORAGE_DIR=/app/server/storage
UID=1000
GID=1000
SERVER_PORT=3001
MCP_SERVERS_ENABLED=true
MCP_ZOHO_SERVER_URL=https://your-zoho-mcp-app.railway.app
MCP_ZOHO_SERVER_NAME=zoho-crm-books
```

### Step 4: Configure MCP Integration

1. **In AnythingLLM, configure MCP servers:**
   - Go to Settings → MCP Servers
   - Add new MCP server:
     - Name: `zoho-crm-books`
     - URL: `https://your-zoho-mcp-app.railway.app`
     - Enabled: Yes

2. **Test the integration:**
   - In AnythingLLM chat, try: "List all my Zoho CRM contacts"
   - The AI should be able to access your Zoho data

## Configuration Files

### Railway Configuration (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Docker Configuration (Dockerfile)
```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1
CMD ["npm", "start"]
```

## Environment Variables

### Required Variables
```bash
# Zoho OAuth Configuration
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_DATA_CENTER=com
ZOHO_BOOKS_ORGANIZATION_ID=your_org_id

# Application Configuration
NODE_ENV=production
MULTI_CONFIG_ENABLED=true
MULTI_CONFIG_ENVIRONMENT=production
```

### Optional Variables
```bash
# Logging and Performance
LOG_LEVEL=info
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
CACHE_TTL=300000

# Pagination Settings
PAGINATION_DEFAULT_PAGE_SIZE=200
PAGINATION_MAX_PAGE_SIZE=200
PAGINATION_ENABLE_AUTO=true
PAGINATION_RATE_LIMIT_DELAY=1000
PAGINATION_MAX_RETRIES=3
```

## Monitoring and Health Checks

### Health Check Endpoints
- **Zoho MCP Server**: `https://your-app.railway.app/health`
- **AnythingLLM**: `https://your-anythingllm-app.railway.app/api/health`

### Railway Monitoring
- Use Railway's built-in monitoring dashboard
- Set up alerts for service failures
- Monitor resource usage and costs

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **HTTPS**: Railway provides automatic HTTPS certificates
3. **Rate Limiting**: Configure appropriate rate limits for your use case
4. **Access Control**: Consider implementing authentication for the MCP server

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check Dockerfile syntax

2. **Runtime Errors**
   - Check environment variables are set correctly
   - Verify Zoho OAuth credentials
   - Check logs in Railway dashboard

3. **MCP Connection Issues**
   - Verify the MCP server URL is correct
   - Check CORS settings if needed
   - Ensure the server is responding to health checks

### Debug Commands

```bash
# Check Railway logs
railway logs

# Check service status
railway status

# Restart service
railway restart

# View environment variables
railway variables
```

## Cost Optimization

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Auto-scaling**: Configure based on your usage patterns
3. **Monitoring**: Use Railway's monitoring to optimize resource usage

## Next Steps

1. **Custom Domain**: Configure a custom domain in Railway
2. **SSL Certificates**: Railway provides automatic SSL
3. **Backup Strategy**: Set up regular backups of your data
4. **Monitoring**: Implement comprehensive monitoring and alerting
5. **Scaling**: Plan for horizontal scaling as usage grows

## Support

- **Railway Documentation**: https://docs.railway.app
- **AnythingLLM Documentation**: https://docs.anythingllm.com
- **Zoho API Documentation**: https://www.zoho.com/crm/developer/docs/api/
- **MCP Documentation**: https://modelcontextprotocol.io 