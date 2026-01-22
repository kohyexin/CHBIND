# Foundry AI Chat Setup Guide

## Quick Start

### ⚠️ Important: Responses API Requires Entra ID

The Foundry Responses API endpoint **requires Entra ID authentication** - API keys don't work for this endpoint. You need to use Entra ID authentication.

### Option 1: API Key (Usually doesn't work for Responses API)

**Note:** API keys typically don't work for the Responses API endpoint. If you get 401 errors, use Option 2 (Entra ID) instead.

1. **Get your API Key:**
   - Go to Azure Portal → Foundry Resource (`starcs-agent-resource`)
   - Click "Keys and Endpoint" in the left menu
   - Copy one of the keys (Key 1 or Key 2)

2. **Set environment variable:**
   ```bash
   # Windows (CMD)
   set FOUNDRY_API_KEY=your-api-key-here
   
   # Windows (PowerShell)
   $env:FOUNDRY_API_KEY="your-api-key-here"
   ```

3. **Start the proxy server:**
   ```bash
   npm install
   npm start
   ```

### Option 2: Entra ID Authentication (Required for Responses API)

**This is the recommended method** - The Responses API endpoint requires Entra ID authentication:

1. **Create App Registration:**
   - Azure Portal → Entra ID → App registrations → New registration
   - Name: "Foundry Chat Proxy"
   - Save Application (client) ID and Directory (tenant) ID

2. **Create Client Secret:**
   - App Registration → Certificates & secrets → New client secret
   - Copy the **Value** (not Secret ID) immediately

3. **Assign Role:**
   - Foundry Resource → Access control (IAM) → Add role assignment
   - Role: "Contributor" or "Azure AI Developer"
   - Assign to your App Registration
   - Wait 2-5 minutes for propagation

4. **Set environment variables:**
   ```bash
   # Windows (CMD)
   set AZURE_TENANT_ID=your-tenant-id
   set AZURE_CLIENT_ID=your-client-id
   set AZURE_CLIENT_SECRET=your-client-secret-value
   
   # Windows (PowerShell)
   $env:AZURE_TENANT_ID="your-tenant-id"
   $env:AZURE_CLIENT_ID="your-client-id"
   $env:AZURE_CLIENT_SECRET="your-client-secret-value"
   
   # Linux/Mac
   export AZURE_TENANT_ID="your-tenant-id"
   export AZURE_CLIENT_ID="your-client-id"
   export AZURE_CLIENT_SECRET="your-client-secret-value"
   ```

5. **Start the proxy server:**
   ```bash
   npm install
   npm start
   ```

## Configuration

### Update Endpoint (if needed)

Edit `foundry-chat.js`:
```javascript
const CONFIG = {
    ENDPOINT: 'https://your-resource.services.ai.azure.com/api/projects/your-project/applications/your-app/protocols/openai/responses?api-version=2024-12-01-preview',
    // ...
};
```

Get the exact endpoint from:
- Foundry Portal → Your Agent → "Agent published successfully" dialog
- Or Azure Portal → Foundry Resource → Keys and Endpoint

## Features

✅ **Conversation History** - Automatically saved to localStorage  
✅ **Agent Instructions** - Uses your Foundry agent's configured instructions  
✅ **Workflow Support** - Ready for workflow integration  
✅ **Simple Setup** - API key or Entra ID, your choice  

## Troubleshooting

### 401 Unauthorized
- Check API key is correct (if using Option 1)
- Or verify Entra ID credentials (if using Option 2)
- Check role assignment has propagated (wait 2-5 minutes)

### 403 Forbidden
- Verify role assignment: "Contributor" or "Azure AI Developer"
- Check role is assigned at correct scope (resource level)
- Wait for role propagation

### Connection Refused
- Make sure proxy server is running: `npm start`
- Check proxy endpoint in `foundry-chat.js` matches your server

### CORS Errors
- Proxy server includes CORS headers automatically
- Make sure proxy is running on `http://localhost:3001`

## Files

- `foundry-chat.js` - Frontend chat component
- `foundry-chat.css` - Chat styles
- `foundry-proxy.js` - Backend proxy server
- `package.json` - Node.js dependencies
