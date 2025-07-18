# Quick Start: Deploy Zoho MCP Server + AnythingLLM on Railway

This guide will get you up and running with a Zoho expert agent in under 30 minutes.

## 🚀 Quick Deployment Steps

### 1. Prerequisites (5 minutes)

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Zoho OAuth Setup**: 
   - Go to [Zoho Developer Console](https://api-console.zoho.com)
   - Create a "Server-based Applications" 
   - Note your Client ID and Client Secret
3. **Zoho Books Organization ID**: Get from Zoho Books Settings → Organization Info

### 2. Deploy Zoho MCP Server (10 minutes)

#### Option A: Using PowerShell (Windows)
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Run deployment script
.\scripts\deploy-railway.ps1 -ZohoClientId "your_client_id" -ZohoClientSecret "your_client_secret" -ZohoRefreshToken "your_refresh_token" -ZohoBooksOrgId "your_org_id"
```

#### Option B: Manual Deployment
1. **Connect your GitHub repo to Railway**
2. **Set environment variables in Railway dashboard:**
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
3. **Deploy**: Railway will automatically build and deploy

### 3. Deploy AnythingLLM (10 minutes)

1. **Create new Railway project**
2. **Add Docker service**: `anythingllm/anythingllm:latest`
3. **Set environment variables:**
   ```
   STORAGE_DIR=/app/server/storage
   UID=1000
   GID=1000
   SERVER_PORT=3001
   MCP_SERVERS_ENABLED=true
   MCP_ZOHO_SERVER_URL=https://your-zoho-mcp-app.railway.app
   MCP_ZOHO_SERVER_NAME=zoho-crm-books
   ```

### 4. Configure Integration (5 minutes)

1. **Access AnythingLLM**: Go to your AnythingLLM URL
2. **Configure MCP**: Settings → MCP Servers → Add:
   - Name: `zoho-crm-books`
   - URL: `https://your-zoho-mcp-app.railway.app`
   - Enabled: Yes

## 🧪 Test Your Zoho Expert Agent

Try these commands in AnythingLLM chat:

### Basic CRM Operations
```
"List all my Zoho CRM contacts"
"Show me the latest deals in my pipeline"
"Create a new task for follow-up with customer John Smith"
```

### Books Operations
```
"Show me all unpaid invoices"
"Create an invoice for deal ABC123"
"List all customers in Zoho Books"
```

### Data Synchronization
```
"Sync my CRM accounts to Books customers"
"Show me the sync status between CRM and Books"
```

### Advanced Queries
```
"Find all contacts with email addresses containing @company.com"
"Show me deals worth more than $10,000"
"List invoices due in the next 30 days"
```

## 🔧 Troubleshooting

### Common Issues

1. **MCP Connection Failed**
   - Check the MCP server URL is correct
   - Verify the Zoho MCP server is running (check health endpoint)
   - Ensure environment variables are set correctly

2. **Zoho API Errors**
   - Verify OAuth credentials are correct
   - Check refresh token is valid
   - Ensure proper scopes are configured

3. **Railway Deployment Issues**
   - Check Railway logs: `railway logs`
   - Verify build process: `railway build`
   - Check environment variables: `railway variables`

### Health Checks

- **Zoho MCP Server**: `https://your-app.railway.app/health`
- **AnythingLLM**: `https://your-anythingllm-app.railway.app/api/health`

## 📊 Monitoring

### Railway Dashboard
- Monitor resource usage
- View logs and errors
- Set up alerts

### Zoho Integration
- Check API rate limits
- Monitor sync status
- Review error logs

## 🚀 Next Steps

1. **Custom Domain**: Configure custom domain in Railway
2. **SSL**: Railway provides automatic HTTPS
3. **Backup**: Set up regular backups
4. **Scaling**: Configure auto-scaling based on usage
5. **Monitoring**: Implement comprehensive monitoring

## 📚 Resources

- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Railway Documentation](https://docs.railway.app)
- [AnythingLLM Documentation](https://docs.anythingllm.com)
- [Zoho API Documentation](https://www.zoho.com/crm/developer/docs/api/)

## 🆘 Support

- **Railway Issues**: Check Railway status page
- **AnythingLLM Issues**: GitHub issues or Discord
- **Zoho API Issues**: Zoho Developer Support
- **MCP Issues**: Model Context Protocol documentation

---

**Your Zoho expert agent is now ready! 🎉**

The AI can now:
- ✅ Access your Zoho CRM data
- ✅ Manage Zoho Books operations  
- ✅ Sync data between CRM and Books
- ✅ Create invoices from deals
- ✅ Search across both systems
- ✅ Handle complex business workflows 