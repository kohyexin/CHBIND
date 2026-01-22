/**
 * Foundry Chat Proxy Server
 * Simple Express server to proxy requests to Microsoft Foundry API
 * Handles authentication (API key or Entra ID)
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const dns = require('dns');
const https = require('https');

// Force IPv4 DNS resolution (fixes ENOTFOUND issues on some systems)
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const CONFIG = {
    // Foundry endpoint (will be passed from frontend, but can set default)
    // IMPORTANT: Use the EXACT endpoint from your Foundry portal
    // Get it from: Foundry Portal → Your Agent → "Agent published successfully" dialog
    // Or: Azure Portal → Foundry Resource → Keys and Endpoint
    DEFAULT_ENDPOINT: process.env.FOUNDRY_ENDPOINT || 'https://starcsagent-resource.services.ai.azure.com/api/projects/starcsagent/applications/starsaascs/protocols/openai/responses?api-version=2025-11-15-preview',
    
    // API Key (if local auth is enabled)
    API_KEY: process.env.FOUNDRY_API_KEY || null,
    
    // Entra ID Configuration (if API key doesn't work)
    TENANT_ID: process.env.AZURE_TENANT_ID || null,
    CLIENT_ID: process.env.AZURE_CLIENT_ID || null,
    CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET || null,
    
    // Token cache
    accessToken: null,
    tokenExpiry: null
};

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Get Entra ID access token (if configured)
 */
async function getAccessToken() {
    if (!CONFIG.TENANT_ID || !CONFIG.CLIENT_ID || !CONFIG.CLIENT_SECRET) {
        return null;
    }

    // Check if we have a valid cached token
    if (CONFIG.accessToken && CONFIG.tokenExpiry && Date.now() < CONFIG.tokenExpiry) {
        return CONFIG.accessToken;
    }

    try {
        const tokenUrl = `https://login.microsoftonline.com/${CONFIG.TENANT_ID}/oauth2/v2.0/token`;
        
        const params = new URLSearchParams({
            client_id: CONFIG.CLIENT_ID,
            client_secret: CONFIG.CLIENT_SECRET,
            scope: 'https://ai.azure.com/.default',
            grant_type: 'client_credentials'
        });

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            console.error('Token request failed:', response.status, errorText);
            console.error('Error details:', errorData);
            return null;
        }

        const data = await response.json();
        CONFIG.accessToken = data.access_token;
        CONFIG.tokenExpiry = Date.now() + (50 * 60 * 1000); // 50 minutes
        
        return CONFIG.accessToken;
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}

/**
 * Proxy endpoint for chat messages
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, endpoint } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const foundryEndpoint = endpoint || CONFIG.DEFAULT_ENDPOINT;

        // Prepare request body for Foundry API
        // Foundry Responses API format: input should be an array of messages (not an object)
        // Format: { input: [{ role: "user", content: "..." }], stream: false }
        const requestBody = {
            input: messages.map(msg => {
                // Ensure content is always a string
                let content = msg.content;
                if (typeof content !== 'string') {
                    content = content ? String(content) : '';
                }
                return {
                    role: msg.role || 'user',
                    content: content
                };
            }),
            stream: false
        };
        
        // Debug: log the request body
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        console.log('Target endpoint:', foundryEndpoint);

        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Try API key first (simpler)
        if (CONFIG.API_KEY) {
            // Foundry Responses API uses 'Ocp-Apim-Subscription-Key' header
            headers['Ocp-Apim-Subscription-Key'] = CONFIG.API_KEY;
            console.log('Using API key authentication');
            console.log('API Key length:', CONFIG.API_KEY.length, 'characters');
        } else {
            // Try Entra ID authentication
            const token = await getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('Using Entra ID authentication');
                console.log('Token obtained (first 20 chars):', token.substring(0, 20) + '...');
            } else {
                // Check which credentials are missing
                const missing = [];
                if (!CONFIG.TENANT_ID) missing.push('AZURE_TENANT_ID');
                if (!CONFIG.CLIENT_ID) missing.push('AZURE_CLIENT_ID');
                if (!CONFIG.CLIENT_SECRET) missing.push('AZURE_CLIENT_SECRET');
                
                if (missing.length > 0) {
                    return res.status(401).json({ 
                        error: 'Entra ID credentials not configured. Missing: ' + missing.join(', '),
                        details: 'Please set the following environment variables: ' + missing.join(', '),
                        help: 'See VERIFY_ENTRA_ID.md for setup instructions'
                    });
                } else {
                    return res.status(401).json({ 
                        error: 'Failed to obtain access token. Please check:',
                        details: [
                            '1. Tenant ID is correct',
                            '2. Client ID is correct',
                            '3. Client Secret is the VALUE (not Secret ID)',
                            '4. Client Secret has not expired',
                            '5. App registration has proper permissions'
                        ],
                        help: 'See VERIFY_ENTRA_ID.md for troubleshooting'
                    });
                }
            }
        }

        // Forward request to Foundry API
        console.log('Forwarding to:', foundryEndpoint);
        
        // Parse URL to get hostname
        const url = new URL(foundryEndpoint);
        const hostname = url.hostname;
        
        // Resolve DNS first to ensure connectivity
        try {
            console.log(`Resolving DNS for: ${hostname}`);
            const addresses = await dns.promises.resolve4(hostname);
            console.log(`DNS resolved to: ${addresses.join(', ')}`);
        } catch (dnsError) {
            console.error('DNS resolution error:', dnsError);
            // Try IPv6 as fallback
            try {
                const addresses = await dns.promises.resolve6(hostname);
                console.log(`DNS resolved (IPv6) to: ${addresses.join(', ')}`);
            } catch (e) {
                throw new Error(`DNS resolution failed for ${hostname}: ${dnsError.message}`);
            }
        }
        
        const response = await fetch(foundryEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            // Use custom agent with IPv4 preference
            agent: new https.Agent({
                family: 4, // Force IPv4
                keepAlive: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            
            console.error('Foundry API error:', response.status, errorData);
            console.error('Request headers sent:', JSON.stringify(headers, null, 2));
            console.error('Request URL:', foundryEndpoint);
            
            // Provide specific guidance for 401 errors
            if (response.status === 401) {
                return res.status(401).json({
                    error: 'HTTP 401: Unauthorized',
                    message: errorData.error?.message || errorData.message || 'Authentication failed',
                    details: errorData,
                    troubleshooting: [
                        '1. Verify Tenant ID, Client ID, and Client Secret are correct',
                        '2. Check that Client Secret is the VALUE (not Secret ID)',
                        '3. Verify Client Secret has not expired',
                        '4. Check role assignment: App needs "Azure AI Developer" or "Contributor" role',
                        '5. Wait 5-10 minutes after role assignment for propagation',
                        '6. Try assigning role at Subscription level if Resource level fails'
                    ],
                    help: 'See VERIFY_ENTRA_ID.md for detailed troubleshooting steps'
                });
            }
            
            return res.status(response.status).json({
                error: errorData.error?.message || errorData.message || 'API request failed',
                details: errorData,
                status: response.status
            });
        }

        const data = await response.json();
        
        // Debug: log the full response to understand the structure
        console.log('Foundry API response:', JSON.stringify(data, null, 2));
        
        // Extract response text from Foundry Responses API
        let responseText = '';
        
        // Foundry Responses API format
        if (data.output) {
            // output can be string or array of message objects
            if (typeof data.output === 'string') {
                responseText = data.output;
            } else if (Array.isArray(data.output)) {
                // Extract text from nested structure: 
                // output: [{type: "message", content: [{type: "output_text", text: "..."}]}]
                responseText = data.output
                    .map(item => {
                        if (item && typeof item === 'object') {
                            // Handle message format with nested content array
                            if (item.type === 'message' && Array.isArray(item.content)) {
                                return item.content
                                    .map(contentItem => {
                                        if (contentItem && typeof contentItem === 'object') {
                                            // Extract text from output_text format
                                            if (contentItem.type === 'output_text' && contentItem.text) {
                                                return contentItem.text;
                                            }
                                            // Fallback to text property
                                            if (contentItem.text) {
                                                return typeof contentItem.text === 'string' 
                                                    ? contentItem.text 
                                                    : JSON.stringify(contentItem.text);
                                            }
                                        }
                                        return null;
                                    })
                                    .filter(text => text !== null && text !== '')
                                    .join('\n');
                            }
                            // Handle direct output_text format (legacy)
                            if (item.type === 'output_text' && item.text) {
                                return item.text;
                            }
                            // Handle message format with string content
                            if (item.content && typeof item.content === 'string') {
                                return item.content;
                            }
                            // Handle direct text property
                            if (item.text) {
                                return typeof item.text === 'string' ? item.text : JSON.stringify(item.text);
                            }
                        } else if (typeof item === 'string') {
                            return item;
                        }
                        return null;
                    })
                    .filter(text => text !== null && text !== '') // Remove null/empty values
                    .join('\n');
            } else if (data.output.content) {
                responseText = typeof data.output.content === 'string' 
                    ? data.output.content 
                    : JSON.stringify(data.output.content);
            } else if (data.output.text) {
                responseText = data.output.text;
            }
        } else if (data.choices?.[0]?.message?.content) {
            // OpenAI-compatible format
            responseText = data.choices[0].message.content;
        } else if (data.content) {
            responseText = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
        } else if (data.text) {
            responseText = data.text;
        } else {
            // Fallback: return full response for debugging
            console.log('Unexpected response format:', JSON.stringify(data, null, 2));
            responseText = JSON.stringify(data);
        }
        
        // Ensure we have some text to return
        if (!responseText || responseText.trim() === '') {
            console.warn('No text extracted from response, using raw data');
            responseText = JSON.stringify(data);
        }

        // Return response
        res.json({
            text: responseText,
            raw: data
        });

    } catch (error) {
        console.error('Proxy error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Parse error message
        let errorMessage = error.message || 'Unknown error';
        let statusCode = 500;
        
        // Handle specific error types
        if (error.code === 'ENOTFOUND') {
            errorMessage = `DNS resolution failed for endpoint. Please verify:\n1. The endpoint URL is correct (check Foundry Portal)\n2. The resource name is spelled correctly\n3. Your network can reach Azure services\n\nEndpoint: ${foundryEndpoint || CONFIG.DEFAULT_ENDPOINT}`;
            statusCode = 502; // Bad Gateway
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused. The endpoint may be unreachable or the service may be down.';
            statusCode = 502;
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timeout. Please check your network connection.';
            statusCode = 504; // Gateway Timeout
        }
        
        res.status(statusCode).json({
            error: errorMessage,
            details: error.message,
            code: error.code,
            endpoint: foundryEndpoint || CONFIG.DEFAULT_ENDPOINT,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        auth: CONFIG.API_KEY ? 'API Key' : (CONFIG.CLIENT_ID ? 'Entra ID' : 'None'),
        endpoint: CONFIG.DEFAULT_ENDPOINT
    });
});

// Diagnostic endpoint for authentication
app.get('/diagnose-auth', async (req, res) => {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        configuration: {
            hasApiKey: !!CONFIG.API_KEY,
            apiKeyLength: CONFIG.API_KEY ? CONFIG.API_KEY.length : 0,
            hasTenantId: !!CONFIG.TENANT_ID,
            tenantId: CONFIG.TENANT_ID ? CONFIG.TENANT_ID.substring(0, 8) + '...' : null,
            hasClientId: !!CONFIG.CLIENT_ID,
            clientId: CONFIG.CLIENT_ID ? CONFIG.CLIENT_ID.substring(0, 8) + '...' : null,
            hasClientSecret: !!CONFIG.CLIENT_SECRET,
            clientSecretLength: CONFIG.CLIENT_SECRET ? CONFIG.CLIENT_SECRET.length : 0,
            hasCachedToken: !!CONFIG.accessToken,
            tokenExpiry: CONFIG.tokenExpiry ? new Date(CONFIG.tokenExpiry).toISOString() : null,
            tokenValid: CONFIG.accessToken && CONFIG.tokenExpiry && Date.now() < CONFIG.tokenExpiry
        },
        issues: [],
        recommendations: []
    };

    // Check for missing configuration
    if (!CONFIG.API_KEY && !CONFIG.CLIENT_ID) {
        diagnostics.issues.push('No authentication method configured');
        diagnostics.recommendations.push('Set either FOUNDRY_API_KEY or Entra ID credentials (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)');
    }

    if (CONFIG.CLIENT_ID && (!CONFIG.TENANT_ID || !CONFIG.CLIENT_SECRET)) {
        diagnostics.issues.push('Incomplete Entra ID configuration');
        if (!CONFIG.TENANT_ID) diagnostics.recommendations.push('Set AZURE_TENANT_ID environment variable');
        if (!CONFIG.CLIENT_SECRET) diagnostics.recommendations.push('Set AZURE_CLIENT_SECRET environment variable (use the VALUE, not Secret ID)');
    }

    // Test token acquisition if Entra ID is configured
    if (CONFIG.TENANT_ID && CONFIG.CLIENT_ID && CONFIG.CLIENT_SECRET) {
        try {
            const token = await getAccessToken();
            if (token) {
                diagnostics.tokenTest = {
                    status: 'success',
                    message: 'Successfully obtained access token',
                    tokenPreview: token.substring(0, 20) + '...',
                    tokenLength: token.length
                };
            } else {
                diagnostics.tokenTest = {
                    status: 'failed',
                    message: 'Failed to obtain access token'
                };
                diagnostics.issues.push('Token acquisition failed');
                diagnostics.recommendations.push('Check Tenant ID, Client ID, and Client Secret are correct');
                diagnostics.recommendations.push('Verify Client Secret is the VALUE (not Secret ID)');
                diagnostics.recommendations.push('Check that Client Secret has not expired');
            }
        } catch (error) {
            diagnostics.tokenTest = {
                status: 'error',
                message: error.message,
                error: error.toString()
            };
            diagnostics.issues.push('Token acquisition error: ' + error.message);
        }
    }

    res.json(diagnostics);
});

// Test endpoint connectivity
app.get('/test-connection', async (req, res) => {
    try {
        const testUrl = new URL(CONFIG.DEFAULT_ENDPOINT);
        const hostname = testUrl.hostname;
        const baseUrl = `${testUrl.protocol}//${testUrl.host}`;
        
        console.log(`Testing connection to: ${baseUrl}`);
        console.log(`Resolving DNS for: ${hostname}`);
        
        // Test DNS resolution first
        let addresses = [];
        try {
            addresses = await dns.promises.resolve4(hostname);
            console.log(`DNS resolved (IPv4) to: ${addresses.join(', ')}`);
        } catch (dnsError) {
            console.log(`IPv4 resolution failed, trying IPv6...`);
            try {
                addresses = await dns.promises.resolve6(hostname);
                console.log(`DNS resolved (IPv6) to: ${addresses.join(', ')}`);
            } catch (e) {
                throw new Error(`DNS resolution failed: ${dnsError.message}`);
            }
        }
        
        // Try a simple HEAD request to test connectivity
        const response = await fetch(baseUrl, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Foundry-Chat-Proxy/1.0'
            },
            agent: new https.Agent({
                family: 4, // Force IPv4
                keepAlive: true
            })
        });
        
        res.json({
            status: 'success',
            message: 'Connection test successful',
            endpoint: CONFIG.DEFAULT_ENDPOINT,
            baseUrl: baseUrl,
            hostname: hostname,
            resolvedIPs: addresses,
            httpStatus: response.status,
            headers: Object.fromEntries(response.headers.entries())
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Connection test failed',
            error: error.message,
            code: error.code,
            endpoint: CONFIG.DEFAULT_ENDPOINT,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Foundry Chat Proxy Server running on http://localhost:${PORT}`);
    console.log(`\nConfiguration:`);
    console.log(`- Endpoint: ${CONFIG.DEFAULT_ENDPOINT}`);
    console.log(`- Authentication: ${CONFIG.API_KEY ? 'API Key' : (CONFIG.CLIENT_ID ? 'Entra ID' : 'Not configured')}`);
    console.log(`\nTo configure:`);
    console.log(`- API Key: Set FOUNDRY_API_KEY environment variable`);
    console.log(`- Entra ID: Set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET`);
});
