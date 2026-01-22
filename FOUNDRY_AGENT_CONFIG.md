# Foundry Chat Agent Configuration Guide

This guide explains how to configure different Foundry agents for different pages.

## Quick Start

### Option 1: Global Configuration (Before Script Loads)

Add this configuration **before** the `foundry-chat.js` script tag:

```html
<script>
    // Configure agent for this page
    window.FOUNDRY_CHAT_CONFIG = {
        endpoint: 'https://starcsagent-resource.services.ai.azure.com/api/projects/starcsagent/applications/starsaascs/protocols/openai/responses?api-version=2025-11-15-preview',
        agentName: 'AI 助手',
        agentTitle: 'STAR SAAS 销售顾问',
        agentModel: 'STAR SAAS Agent',
        useProxy: true,
        proxyEndpoint: 'http://localhost:3001/api/chat'
    };
</script>
<script src="foundry-chat.js"></script>
```

### Option 2: Manual Initialization (After Script Loads)

```html
<script src="foundry-chat.js"></script>
<script>
    // Initialize with specific agent configuration
    window.initFoundryChat({
        endpoint: 'https://starcsagent-resource.services.ai.azure.com/api/projects/starcsagent/applications/starsaascs/protocols/openai/responses?api-version=2025-11-15-preview',
        agentName: 'AI 助手',
        agentTitle: 'STAR SAAS 销售顾问',
        agentModel: 'STAR SAAS Agent',
        useProxy: true,
        proxyEndpoint: 'http://localhost:3001/api/chat'
    });
</script>
```

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `endpoint` | string | Yes | Foundry agent endpoint URL |
| `agentName` | string | No | Display name (default: "AI 助手") |
| `agentTitle` | string | No | Subtitle/title (default: "STAR SAAS 销售顾问") |
| `agentModel` | string | No | Model name in input area (default: "STAR SAAS Agent") |
| `apiKey` | string | No | API key (if not using proxy) |
| `useProxy` | boolean | No | Use proxy server (default: true) |
| `proxyEndpoint` | string | No | Proxy endpoint URL (default: "http://localhost:3001/api/chat") |

## Examples

### Example 1: Customer Service Agent

```html
<!-- Customer Service Page -->
<script>
    window.FOUNDRY_CHAT_CONFIG = {
        endpoint: 'https://starcsagent-resource.services.ai.azure.com/api/projects/starcsagent/applications/cs-agent/protocols/openai/responses?api-version=2025-11-15-preview',
        agentName: '客服助手',
        agentTitle: 'STAR SAAS 客户服务',
        agentModel: 'CS Agent',
        useProxy: true,
        proxyEndpoint: 'http://localhost:3001/api/chat'
    };
</script>
<script src="foundry-chat.js"></script>
```

### Example 2: Helpdesk Agent

```html
<!-- Helpdesk Page -->
<script>
    window.FOUNDRY_CHAT_CONFIG = {
        endpoint: 'https://starcsagent-resource.services.ai.azure.com/api/projects/starcsagent/applications/helpdesk-agent/protocols/openai/responses?api-version=2025-11-15-preview',
        agentName: '技术支持',
        agentTitle: 'STAR SAAS 技术支持助手',
        agentModel: 'Helpdesk Agent',
        useProxy: true,
        proxyEndpoint: 'http://localhost:3001/api/chat'
    };
</script>
<script src="foundry-chat.js"></script>
```

### Example 3: Sales Agent (Default)

```html
<!-- Sales Page -->
<script>
    window.FOUNDRY_CHAT_CONFIG = {
        endpoint: 'https://starcsagent-resource.services.ai.azure.com/api/projects/starcsagent/applications/starsaascs/protocols/openai/responses?api-version=2025-11-15-preview',
        agentName: 'AI 助手',
        agentTitle: 'STAR SAAS 销售顾问',
        agentModel: 'STAR SAAS Agent',
        useProxy: true,
        proxyEndpoint: 'http://localhost:3001/api/chat'
    };
</script>
<script src="foundry-chat.js"></script>
```

## Important Notes

1. **Separate Conversation History**: Each agent has its own conversation history stored in `localStorage` with a unique key based on the agent name.

2. **Endpoint Format**: The endpoint must be the exact URL from your Foundry Portal:
   ```
   https://<resource-name>.services.ai.azure.com/api/projects/<project>/applications/<app>/protocols/openai/responses?api-version=2025-11-15-preview
   ```

3. **Proxy Server**: The proxy server (`foundry-proxy.js`) handles authentication for all agents. Make sure it's running on `http://localhost:3001`.

4. **Multiple Agents on Same Page**: If you need multiple chat instances on the same page, you'll need to modify the code to support multiple instances (currently supports one instance per page).

## Getting Agent Endpoints

1. Go to **Foundry Portal** → Your Agent
2. Click on the agent you want to use
3. Look for "Agent published successfully" dialog or "Endpoints" section
4. Copy the **Responses API endpoint**
5. Use that exact URL in the `endpoint` configuration

## Troubleshooting

- **Agent not responding**: Check that the endpoint URL is correct and matches the agent in Foundry Portal
- **Wrong agent responding**: Verify the endpoint in `FOUNDRY_CHAT_CONFIG` matches the intended agent
- **Conversation history mixing**: Each agent uses a separate storage key, so histories won't mix
