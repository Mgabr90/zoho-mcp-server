# Zoho MCP Server Tools

This directory contains helper tools for configuring and managing your Zoho MCP Server.

## 🔐 Authentication Configuration Helper

The `auth-config-helper.html` is a web-based tool that guides you through setting up OAuth authentication for Zoho applications.

### When to Use

Run this tool whenever you need to:
- **Add a new organization's OAuth configuration**
- Set up authentication for a new Zoho application
- Configure multiple Zoho accounts/organizations
- Regenerate expired or invalid tokens
- Set up Books functionality for a new organization

### How to Use

1. **Open the tool**:
   ```bash
   # Navigate to the tools directory
   cd tools
   
   # Open in your default browser
   open auth-config-helper.html
   # or on Linux/WSL
   xdg-open auth-config-helper.html
   # or on Windows
   start auth-config-helper.html
   ```

2. **Follow the 5-step process**:
   - **Step 1**: Enter your Zoho application credentials
   - **Step 2**: Complete the OAuth authorization flow
   - **Step 3**: Set up organization ID (for Books functionality)
   - **Step 4**: Configure API scopes
   - **Step 5**: Generate and download your .env configuration

3. **Add to your .env file**:
   - Copy the generated configuration
   - Add it to your project's `.env` file
   - Restart your MCP server

### Multiple Organizations

For multiple organizations, you can:
1. Run the tool multiple times
2. Use different variable prefixes for each organization
3. Configure separate MCP server instances
4. Use different client applications for each organization

### Features

- ✅ **Step-by-step guidance** with progress tracking
- ✅ **Real-time validation** of credentials
- ✅ **Automatic URL parsing** for OAuth callbacks
- ✅ **Organization ID detection** from Zoho Books API
- ✅ **Scope presets** for common use cases
- ✅ **Configuration generation** with copy/download options
- ✅ **Mobile-responsive** design
- ✅ **Error handling** with helpful messages

### Security Notes

- Never commit your `.env` file to version control
- Keep your client secrets secure
- Use environment variables in production
- Regularly rotate your refresh tokens

### Troubleshooting

If you encounter issues:
1. Check that your Zoho application is properly configured
2. Verify your redirect URI matches exactly
3. Ensure your client ID and secret are correct
4. Try clearing your browser cache and cookies
5. Check the browser console for any error messages

### Support

For additional help:
- Check the main README.md for general setup instructions
- Review the Zoho API documentation
- Open an issue if you encounter bugs