# Security Guidelines

## Environment Variables

This project uses environment variables for sensitive configuration. **Never commit actual secrets to the repository.**

### Required Environment Variables

- `FOUNDRY_API_KEY` - Foundry API key (optional, usually doesn't work for Responses API)
- `AZURE_TENANT_ID` - Azure tenant ID for Entra ID authentication
- `AZURE_CLIENT_ID` - Azure client ID for Entra ID authentication  
- `AZURE_CLIENT_SECRET` - Azure client secret value (NOT the Secret ID)
- `FOUNDRY_ENDPOINT` - Foundry API endpoint URL (optional, can be set in code)

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. The `.env` file is automatically ignored by git (see `.gitignore`)

### Important Notes

- ✅ **DO** use environment variables for secrets
- ✅ **DO** commit `.env.example` as a template
- ❌ **DON'T** commit `.env` files
- ❌ **DON'T** hardcode secrets in source code
- ❌ **DON'T** commit actual secret values in documentation

## Code Security

All sensitive values are read from environment variables using `process.env`, never hardcoded:

```javascript
// ✅ Good - reads from environment
const API_KEY = process.env.FOUNDRY_API_KEY || null;

// ❌ Bad - hardcoded secret
const API_KEY = "actual-secret-value";
```

## Documentation

Documentation files use placeholders like:
- `YOUR_TENANT_ID` instead of actual tenant IDs
- `YOUR_CLIENT_ID` instead of actual client IDs
- `your-api-key-here` instead of actual API keys

This prevents GitHub's secret scanning from flagging example values.

## Git Configuration

The `.gitignore` file ensures:
- `.env` files are never committed
- `node_modules/` are excluded
- Temporary and build files are ignored
