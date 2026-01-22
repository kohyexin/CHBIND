/**
 * Microsoft Foundry AI Chat Integration
 * Simple integration with conversation history support
 */

(function() {
    'use strict';

    // Default Configuration - Can be overridden per page
    let CONFIG = {
        // Foundry endpoint - Get from your Foundry portal
        // IMPORTANT: Use the EXACT endpoint from Foundry Portal → Your Agent → "Agent published successfully" dialog
        // Or: Azure Portal → Foundry Resource → Keys and Endpoint
        // Format: https://<resource-name>.services.ai.azure.com/api/projects/<project>/applications/<app>/protocols/openai/responses
        ENDPOINT: 'https://starcsagent-resource.services.ai.azure.com/api/projects/starcsagent/applications/starsaascs/protocols/openai/responses?api-version=2025-11-15-preview',
        
        // API Key (if local auth is enabled) - Get from Azure Portal > Foundry Resource > Keys and Endpoint
        API_KEY: null, // Set this if you have API key access
        
        // Use proxy server (recommended for Entra ID auth)
        USE_PROXY: true,
        PROXY_ENDPOINT: 'http://localhost:3001/api/chat',
        
        // Agent display information
        AGENT_NAME: 'AI 助手',
        AGENT_TITLE: 'STAR SAAS 销售顾问',
        AGENT_MODEL: 'STAR SAAS Agent',
        AGENT_AVATAR: 'AI', // Avatar text/icon
        
        // Page interaction capability
        CAN_INTERACT_WITH_PAGE: false
    };

    // State
    let chatWindow = null;
    let chatIcon = null;
    let messagesContainer = null;
    let inputField = null;
    let sendButton = null;
    let isOpen = false;
    let conversationHistory = []; // Stores conversation history
    let currentStyle = 'modern'; // 'modern' or 'spreedly'

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Check if avatar is an image (URL or path)
     */
    function isImageAvatar(avatar) {
        if (!avatar) return false;
        const imgExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
        const lowerAvatar = avatar.toLowerCase();
        return lowerAvatar.startsWith('http://') || 
               lowerAvatar.startsWith('https://') || 
               lowerAvatar.startsWith('/') ||
               lowerAvatar.startsWith('./') ||
               imgExtensions.some(ext => lowerAvatar.endsWith(ext));
    }

    /**
     * Render avatar (image or text/emoji)
     */
    function renderAvatar(avatar, className = '') {
        if (isImageAvatar(avatar)) {
            // Use onerror to fallback if image fails to load
            return `<img src="${escapeHtml(avatar)}" alt="Avatar" class="${className}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(CONFIG.AGENT_NAME || 'AI').charAt(0)}'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.style.fontSize='inherit'; this.parentElement.style.fontWeight='600'; this.parentElement.style.color='inherit';" onload="this.parentElement.style.background='transparent';">`;
        } else {
            return escapeHtml(avatar || 'AI');
        }
    }

    /**
     * Initialize the chat component
     * @param {Object} options - Configuration options
     * @param {string} options.endpoint - Foundry agent endpoint
     * @param {string} options.agentName - Display name for the agent
     * @param {string} options.agentTitle - Title/subtitle for the agent
     * @param {string} options.agentModel - Model name shown in input area
     * @param {string} options.apiKey - API key (optional)
     * @param {boolean} options.useProxy - Use proxy server (default: true)
     * @param {string} options.proxyEndpoint - Proxy endpoint URL
     */
    function init(options = {}) {
        // Merge user configuration with defaults
        if (options.endpoint) CONFIG.ENDPOINT = options.endpoint;
        if (options.agentName) CONFIG.AGENT_NAME = options.agentName;
        if (options.agentTitle) CONFIG.AGENT_TITLE = options.agentTitle;
        if (options.agentModel) CONFIG.AGENT_MODEL = options.agentModel;
        if (options.agentAvatar) CONFIG.AGENT_AVATAR = options.agentAvatar;
        if (options.apiKey !== undefined) CONFIG.API_KEY = options.apiKey;
        if (options.useProxy !== undefined) CONFIG.USE_PROXY = options.useProxy;
        if (options.proxyEndpoint) CONFIG.PROXY_ENDPOINT = options.proxyEndpoint;
        if (options.canInteractWithPage !== undefined) CONFIG.CAN_INTERACT_WITH_PAGE = options.canInteractWithPage;
        
        // Use page-specific storage key for conversation history
        // If defaultAgent is set, use that as the key, otherwise use agent name
        const agentKey = options.defaultAgent || CONFIG.AGENT_NAME.replace(/\s+/g, '-').toLowerCase();
        const storageKey = `foundry-chat-history-${agentKey}`;
        CONFIG.STORAGE_KEY = storageKey;
        CONFIG.CURRENT_AGENT_KEY = agentKey;
        
        createChatIcon();
        createStyleToggle();
        createChatWindow();
        attachEventListeners();
        loadConversationHistory(); // Load previous conversations
    }

    /**
     * Create style toggle button
     */
    function createStyleToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'foundry-chat-style-toggle';
        toggle.innerHTML = '🎨';
        toggle.title = 'Toggle Style';
        toggle.setAttribute('aria-label', 'Toggle chat style');
        document.body.appendChild(toggle);
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStyle();
        });
    }

    /**
     * Toggle between modern and Spreedly styles
     */
    function toggleStyle() {
        currentStyle = currentStyle === 'modern' ? 'spreedly' : 'modern';
        chatWindow.classList.toggle('spreedly-style', currentStyle === 'spreedly');
        
        // Update suggestions visibility
        const suggestions = chatWindow.querySelector('.foundry-chat-suggestions');
        if (suggestions) {
            suggestions.style.display = currentStyle === 'spreedly' ? 'block' : 'none';
        }
    }

    /**
     * Create floating chat icon
     */
    function createChatIcon() {
        chatIcon = document.createElement('div');
        chatIcon.className = 'foundry-chat-icon';
        chatIcon.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        `;
        document.body.appendChild(chatIcon);
    }

    /**
     * Create chat window
     */
    function createChatWindow() {
        chatWindow = document.createElement('div');
        chatWindow.className = 'foundry-chat-window';
        
        chatWindow.innerHTML = `
            <div class="foundry-chat-header">
                <div class="foundry-chat-header-content">
                    <div class="foundry-chat-header-avatar">${renderAvatar(CONFIG.AGENT_AVATAR)}</div>
                    <div class="foundry-chat-header-info">
                        <div class="foundry-chat-header-name" id="foundry-chat-agent-name">${escapeHtml(CONFIG.AGENT_NAME)}</div>
                        <div class="foundry-chat-header-title" id="foundry-chat-agent-title">${escapeHtml(CONFIG.AGENT_TITLE)}</div>
                    </div>
                </div>
                <div class="foundry-chat-agent-selector-wrapper">
                    <select id="foundry-chat-agent-selector" class="foundry-chat-agent-selector" onchange="switchFoundryAgent(this.value)">
                        <option value="self-onboarding">自助开通助手</option>
                        <option value="cs">客户服务</option>
                        <option value="configurator">配置助手</option>
                    </select>
                </div>
                <button class="foundry-chat-header-reset" id="foundry-chat-header-reset" aria-label="重置对话" title="重置对话">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                </button>
                <button class="foundry-chat-header-options" aria-label="选项">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"></path>
                    </svg>
                </button>
                <button class="foundry-chat-close-btn" aria-label="关闭">×</button>
            </div>
            <div class="foundry-chat-messages" id="foundry-chat-messages">
                <div class="foundry-chat-empty">
                    <div class="foundry-chat-empty-icon">💬</div>
                    <div class="foundry-chat-empty-text">
                        <p>你好！我是 ${escapeHtml(CONFIG.AGENT_NAME)}。</p>
                        <p>有什么可以帮助您的吗？</p>
                    </div>
                </div>
            </div>
            <div class="foundry-chat-suggestions" id="foundry-chat-suggestions" style="display: none;">
                <div class="foundry-chat-suggestions-label">Sample questions</div>
                <div class="foundry-chat-suggestions-list">
                    <div class="foundry-chat-suggestion-card" data-question="What type of business do you operate?">
                        <div class="foundry-chat-suggestion-icon">${escapeHtml(CONFIG.AGENT_AVATAR || 'AI')}</div>
                        <div class="foundry-chat-suggestion-text">What type of business do you operate?</div>
                    </div>
                    <div class="foundry-chat-suggestion-card" data-question="Which country or region will you operate in?">
                        <div class="foundry-chat-suggestion-icon">${escapeHtml(CONFIG.AGENT_AVATAR || 'AI')}</div>
                        <div class="foundry-chat-suggestion-text">Which country or region will you operate in?</div>
                    </div>
                    <div class="foundry-chat-suggestion-card" data-question="Are you currently processing card payments, or planning to start?">
                        <div class="foundry-chat-suggestion-icon">${escapeHtml(CONFIG.AGENT_AVATAR || 'AI')}</div>
                        <div class="foundry-chat-suggestion-text">Are you currently processing card payments, or planning to start?</div>
                    </div>
                </div>
            </div>
            <div class="foundry-chat-input-area">
                <div class="foundry-chat-input-wrapper">
                    <div class="foundry-chat-model-selector">
                        <svg class="foundry-chat-model-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="3" x2="9" y2="21"></line>
                            <line x1="15" y1="3" x2="15" y2="21"></line>
                        </svg>
                        <span id="foundry-chat-agent-model">${escapeHtml(CONFIG.AGENT_MODEL)}</span>
                    </div>
                    <div class="foundry-chat-message-avatar" style="width: 36px; height: 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 16px; flex-shrink: 0;">${renderAvatar(CONFIG.AGENT_AVATAR)}</div>
                    <input 
                        type="text" 
                        class="foundry-chat-input" 
                        id="foundry-chat-input" 
                        placeholder="Enter your question" 
                        maxlength="2000"
                    >
                </div>
                <button class="foundry-chat-reset-btn" id="foundry-chat-reset-btn" aria-label="重置">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    <span>Reset</span>
                </button>
                <button class="foundry-chat-send-btn" id="foundry-chat-send-btn" aria-label="发送">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(chatWindow);

        messagesContainer = document.getElementById('foundry-chat-messages');
        inputField = document.getElementById('foundry-chat-input');
        sendButton = document.getElementById('foundry-chat-send-btn');
        
        // Attach suggestion card click handlers
        const suggestionCards = chatWindow.querySelectorAll('.foundry-chat-suggestion-card');
        suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
                const question = card.getAttribute('data-question');
                if (question) {
                    inputField.value = question;
                    sendMessage();
                }
            });
        });
        
        // Attach reset button handler (input area)
        const resetBtn = document.getElementById('foundry-chat-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                clearHistory();
            });
        }
        
        // Header reset button
        const headerResetBtn = document.getElementById('foundry-chat-header-reset');
        if (headerResetBtn) {
            headerResetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('确定要重置对话吗？这将清除所有聊天记录。')) {
                    clearHistory();
                }
            });
        }
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        // Chat icon click
        chatIcon.addEventListener('click', toggleChat);

        // Close button
        const closeBtn = chatWindow.querySelector('.foundry-chat-close-btn');
        closeBtn.addEventListener('click', toggleChat);

        // Send button
        sendButton.addEventListener('click', sendMessage);

        // Enter key to send
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Click outside to close
        chatWindow.addEventListener('click', (e) => {
            if (e.target === chatWindow) {
                toggleChat();
            }
        });
    }

    /**
     * Toggle chat window
     */
    function toggleChat() {
        isOpen = !isOpen;
        chatWindow.classList.toggle('active', isOpen);
        if (isOpen) {
            inputField.focus();
            // Show suggestions only in Spreedly style when empty
            const suggestions = chatWindow.querySelector('.foundry-chat-suggestions');
            if (suggestions && currentStyle === 'spreedly') {
                const hasMessages = messagesContainer.querySelectorAll('.foundry-chat-message').length > 0;
                suggestions.style.display = hasMessages ? 'none' : 'block';
            }
        }
    }

    /**
     * Send message
     */
    async function sendMessage() {
        const message = inputField.value.trim();
        if (!message) return;

        // Add user message to UI
        addMessage('user', message);
        inputField.value = '';

        // Disable input while processing
        inputField.disabled = true;
        sendButton.disabled = true;

        // Show typing indicator
        const typingIndicator = showTypingIndicator();

        try {
            // Add user message to conversation history
            conversationHistory.push({ role: 'user', content: message });

            // Get form field information if available (for configurator agent)
            // This allows the agent to see what options are available in dropdowns
            let formContext = '';
            // Check if this agent should have access to form context
            const shouldGetFormInfo = CONFIG.CAN_INTERACT_WITH_PAGE || 
                                     CONFIG.AGENT_MODEL === 'Configuration Agent' || 
                                     CONFIG.AGENT_NAME === '配置助手';
            
            console.log('[Foundry Chat] Form context check:', {
                canInteract: CONFIG.CAN_INTERACT_WITH_PAGE,
                agentModel: CONFIG.AGENT_MODEL,
                agentName: CONFIG.AGENT_NAME,
                shouldGetFormInfo: shouldGetFormInfo,
                hasGetFormFieldsInfo: typeof window.getFormFieldsInfo === 'function'
            });
            
            if (shouldGetFormInfo) {
                if (window.getFormFieldsInfo && typeof window.getFormFieldsInfo === 'function') {
                    try {
                        const formInfo = window.getFormFieldsInfo();
                        console.log('[Foundry Chat] Retrieved form info:', formInfo);
                        if (formInfo) {
                            formContext = `\n\n[Form Field Information - Available Options and Order]\n`;
                            formContext += `You have access to the current form state. IMPORTANT: Guide users in the correct field order.\n\n`;
                            formContext += `**Form Field Order (fill in this sequence):**\n`;
                            formContext += `1. Payment Type (支付种类) - FIRST field to select\n`;
                            formContext += `2. Channel (渠道) - Second field to select\n`;
                            formContext += `3. Merchant Name (商户名) - Third field to select\n`;
                            formContext += `4. Sub-account (子账号) - Fourth field (depends on merchant)\n`;
                            formContext += `5. Account Name (账号名) - Text input field\n\n`;
                            
                            formContext += `**Available Options:**\n\n`;
                            
                            if (formInfo.paymentTypes && formInfo.paymentTypes.length > 0) {
                                formContext += `Payment Types (支付种类) - SELECT FIRST:\n`;
                                formInfo.paymentTypes.forEach(p => {
                                    formContext += `  - ${p.text} (use value: "${p.value}" in actions)\n`;
                                });
                                formContext += `\n`;
                            } else {
                                formContext += `Payment Types (支付种类): No options available\n\n`;
                            }
                            
                            if (formInfo.channels && formInfo.channels.length > 0) {
                                formContext += `Channels (渠道) - SELECT SECOND:\n`;
                                formInfo.channels.forEach(c => {
                                    formContext += `  - ${c.text} (use value: "${c.value}" in actions)\n`;
                                });
                                formContext += `\n`;
                            } else {
                                formContext += `Channels (渠道): No options available\n\n`;
                            }
                            
                            if (formInfo.merchants && formInfo.merchants.length > 0) {
                                formContext += `Merchants (商户名) - SELECT THIRD:\n`;
                                formInfo.merchants.forEach(m => {
                                    formContext += `  - ${m.text} (use value: "${m.value}" in actions)\n`;
                                });
                                formContext += `\n`;
                            } else {
                                formContext += `Merchants (商户名): No options available\n\n`;
                            }
                            
                            if (formInfo.currentValues) {
                                formContext += `Current form selections:\n`;
                                formContext += `  - Payment Type: ${formInfo.currentValues.paymentType || '(not selected)'}\n`;
                                formContext += `  - Channel: ${formInfo.currentValues.channel || '(not selected)'}\n`;
                                formContext += `  - Merchant: ${formInfo.currentValues.merchant || '(not selected)'}\n`;
                            }
                            
                            formContext += `\n**Guidance Rules:**\n`;
                            formContext += `- Always start with Payment Type (支付种类) when configuring from scratch\n`;
                            formContext += `- Then guide to Channel (渠道) selection\n`;
                            formContext += `- Then Merchant Name (商户名)\n`;
                            formContext += `- When creating actions, use the "value" field (e.g., "credit_card", "ysepay", "starsaas")\n`;
                            formContext += `- You CAN see the available options above, so you don't need to ask the user for them.\n`;
                            formContext += `- When the user asks "what options are available" or "can you tell me what's in the dropdown", you should list the available options from the information above.\n`;
                            formContext += `- You have full visibility into the form state and available options.\n`;
                            
                            console.log('[Foundry Chat] ✓ Form context generated successfully. Length:', formContext.length);
                            console.log('[Foundry Chat] Form context preview:', formContext.substring(0, 400) + '...');
                        } else {
                            console.warn('[Foundry Chat] ⚠ getFormFieldsInfo returned null/undefined');
                        }
                    } catch (e) {
                        console.error('[Foundry Chat] ✗ Failed to get form info:', e);
                        console.error('[Foundry Chat] Error stack:', e.stack);
                    }
                } else {
                    console.warn('[Foundry Chat] ✗ getFormFieldsInfo function not available on window object');
                }
            } else {
                console.log('[Foundry Chat] Form context not needed for this agent');
            }

            let responseText = '';

            if (CONFIG.USE_PROXY) {
                // Use proxy server (handles Entra ID auth)
                // Build messages array with form context if available
                const messagesToSend = conversationHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
                
                // Add form context to the last user message if available
                if (formContext && formContext.trim().length > 0) {
                    if (messagesToSend.length > 0 && messagesToSend[messagesToSend.length - 1].role === 'user') {
                        messagesToSend[messagesToSend.length - 1].content += formContext;
                        console.log('[Foundry Chat] ✓ Form context appended to user message (proxy). Total length:', messagesToSend[messagesToSend.length - 1].content.length);
                        console.log('[Foundry Chat] Form context preview:', formContext.substring(0, 500));
                    } else {
                        console.warn('[Foundry Chat] ⚠ Form context available but no user message to append to');
                    }
                } else {
                    console.log('[Foundry Chat] No form context to append (empty or not generated)');
                }
                
                const response = await fetch(CONFIG.PROXY_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: messagesToSend,
                        endpoint: CONFIG.ENDPOINT
                    })
                });

                if (!response.ok) {
                    // Try to get detailed error message
                    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    let errorDetails = null;
                    
                    try {
                        const errorData = await response.json();
                        errorDetails = errorData;
                        if (errorData.error) {
                            errorMessage = errorData.error;
                        }
                        if (errorData.troubleshooting && Array.isArray(errorData.troubleshooting)) {
                            errorMessage += '\n\n故障排除步骤:\n' + errorData.troubleshooting.join('\n');
                        }
                        if (errorData.help) {
                            errorMessage += '\n\n' + errorData.help;
                        }
                    } catch (e) {
                        // If response is not JSON, use status text
                        const text = await response.text();
                        if (text) {
                            errorMessage += '\n' + text;
                        }
                    }
                    
                    console.error('[Foundry Chat] Proxy error:', errorDetails || errorMessage);
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                responseText = data.text || data.message || 'No response received';
            } else {
                // Direct API call (requires API key)
                if (!CONFIG.API_KEY) {
                    throw new Error('API key not configured. Please set CONFIG.API_KEY or use proxy server.');
                }

                // Build messages array with form context if available
                const messagesToSend = conversationHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
                
                // Add form context to the last user message if available
                if (formContext && formContext.trim().length > 0) {
                    if (messagesToSend.length > 0 && messagesToSend[messagesToSend.length - 1].role === 'user') {
                        messagesToSend[messagesToSend.length - 1].content += formContext;
                        console.log('[Foundry Chat] ✓ Form context appended to user message (direct API). Total length:', messagesToSend[messagesToSend.length - 1].content.length);
                        console.log('[Foundry Chat] Form context preview:', formContext.substring(0, 500));
                    } else {
                        console.warn('[Foundry Chat] ⚠ Form context available but no user message to append to');
                    }
                } else {
                    console.log('[Foundry Chat] No form context to append (empty or not generated)');
                }
                
                const response = await fetch(CONFIG.ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': CONFIG.API_KEY
                    },
                    body: JSON.stringify({
                        messages: messagesToSend,
                        stream: false
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
                }

                const data = await response.json();
                
                // Extract response text
                if (data.output?.content) {
                    responseText = typeof data.output.content === 'string' 
                        ? data.output.content 
                        : JSON.stringify(data.output.content);
                } else if (data.choices?.[0]?.message?.content) {
                    responseText = data.choices[0].message.content;
                } else {
                    responseText = JSON.stringify(data);
                }
            }

            // Parse response for actions (if configurator agent)
            let displayText = responseText;
            let actions = null;
            
            // Check if this agent can interact with the page
            const canInteract = CONFIG.CAN_INTERACT_WITH_PAGE || 
                               CONFIG.AGENT_MODEL === 'Configuration Agent' || 
                               CONFIG.AGENT_NAME === '配置助手';
            
            console.log('[Foundry Chat] Agent interaction check:', {
                canInteract: canInteract,
                agentModel: CONFIG.AGENT_MODEL,
                agentName: CONFIG.AGENT_NAME,
                canInteractFlag: CONFIG.CAN_INTERACT_WITH_PAGE
            });
            
            if (canInteract) {
                console.log('[Foundry Chat] Attempting to parse agent response for actions...');
                // Get the user's last message to understand what they actually requested
                // Find the last user message (not assistant message)
                let userLastMessage = '';
                for (let i = conversationHistory.length - 1; i >= 0; i--) {
                    if (conversationHistory[i].role === 'user') {
                        userLastMessage = conversationHistory[i].content || '';
                        break;
                    }
                }
                
                console.log('[Foundry Chat] User last message:', userLastMessage);
                const parsedResponse = parseAgentResponse(responseText, userLastMessage);
                if (parsedResponse) {
                    console.log('[Foundry Chat] Successfully parsed response:', parsedResponse);
                    displayText = parsedResponse.message || responseText;
                    actions = parsedResponse.actions;
                } else {
                    console.log('[Foundry Chat] No structured JSON found in response. Agent may need to respond with JSON format.');
                }
            }

            // Add assistant response to conversation history (store original text)
            conversationHistory.push({ role: 'assistant', content: responseText });

            // Save conversation history
            saveConversationHistory();

            // Remove typing indicator and add response
            typingIndicator.remove();
            addMessage('assistant', displayText);
            
            // Execute actions if any (for configurator agent)
            if (actions && actions.length > 0) {
                console.log('[Foundry Chat] ✓ Parsed actions from agent response:', JSON.stringify(actions, null, 2));
                
                // Wait a bit for executePageActions to be available (in case of timing issues)
                let retries = 5;
                const tryExecute = () => {
                    if (window.executePageActions && typeof window.executePageActions === 'function') {
                        console.log('[Foundry Chat] ✓ executePageActions found, executing actions...');
                        setTimeout(() => {
                            try {
                                console.log('[Foundry Chat] Calling executePageActions with:', actions);
                                window.executePageActions(actions);
                                console.log('[Foundry Chat] ✓ Successfully called executePageActions');
                                
                                // Show visual notification
                                showActionNotification(`Updated ${actions.length} field(s) on the page`);
                            } catch (error) {
                                console.error('[Foundry Chat] ✗ Error executing page actions:', error);
                                console.error('[Foundry Chat] Error stack:', error.stack);
                                showActionNotification('Error updating page fields', true);
                            }
                        }, 100);
                    } else if (retries > 0) {
                        console.warn(`[Foundry Chat] ⚠ executePageActions not available yet, retrying... (${retries} retries left)`);
                        console.warn(`[Foundry Chat] window.executePageActions type:`, typeof window.executePageActions);
                        retries--;
                        setTimeout(tryExecute, 200);
                    } else {
                        console.error('[Foundry Chat] ✗ executePageActions function not found after retries.');
                        console.error('[Foundry Chat] window.executePageActions:', window.executePageActions);
                        console.error('[Foundry Chat] Available window functions:', Object.keys(window).filter(k => k.includes('execute') || k.includes('Page')));
                        showActionNotification('Page action executor not available', true);
                    }
                };
                tryExecute();
            } else if (canInteract) {
                console.log('[Foundry Chat] ⚠ Agent can interact but no actions found in response.');
                console.log('[Foundry Chat] Response text (first 500 chars):', responseText.substring(0, 500));
                console.log('[Foundry Chat] 💡 Tip: Agent should respond with JSON format: {"message": "...", "actions": [...]}');
            }

        } catch (error) {
            typingIndicator.remove();
            showError(error.message);
            console.error('Error sending message:', error);
        } finally {
            inputField.disabled = false;
            sendButton.disabled = false;
            inputField.focus();
        }
    }

    /**
     * Parse agent response for structured data (actions + message)
     * Supports JSON format: {"message": "...", "actions": [...]}
     * Or markdown code block with JSON
     * Also attempts to extract actions from natural language
     * @param {string} text - Agent's response text
     * @param {string} userMessage - User's last message (to understand intent)
     */
    function parseAgentResponse(text, userMessage) {
        if (!text) {
            console.log('[Foundry Chat] parseAgentResponse: Empty text');
            return null;
        }
        
        // Ensure userMessage is defined
        if (typeof userMessage === 'undefined' || userMessage === null) {
            userMessage = '';
        }
        
        console.log('[Foundry Chat] parseAgentResponse: Analyzing text (first 500 chars):', text.substring(0, 500));
        
        // Try to parse as direct JSON
        try {
            const json = JSON.parse(text.trim());
            if (json.message && json.actions) {
                console.log('[Foundry Chat] Found direct JSON with message and actions');
                return json;
            } else {
                console.log('[Foundry Chat] Direct JSON found but missing message or actions:', Object.keys(json));
            }
        } catch (e) {
            // Not direct JSON, continue
            console.log('[Foundry Chat] Not direct JSON, trying other methods...');
        }
        
        // Try to extract JSON from markdown code blocks
        const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = text.match(jsonBlockRegex);
        if (match) {
            try {
                const json = JSON.parse(match[1]);
                if (json.message && json.actions) {
                    console.log('[Foundry Chat] Found JSON in markdown code block');
                    return json;
                }
            } catch (e) {
                console.log('[Foundry Chat] Invalid JSON in code block:', e.message);
            }
        }
        
        // Try to find JSON object anywhere in the text (more flexible regex)
        const jsonObjectRegex = /\{[\s\S]{0,2000}?"message"[\s\S]{0,2000}?"actions"[\s\S]{0,2000}?\}/;
        const objectMatch = text.match(jsonObjectRegex);
        if (objectMatch) {
            try {
                const json = JSON.parse(objectMatch[0]);
                if (json.message && json.actions) {
                    console.log('[Foundry Chat] Found JSON object embedded in text');
                    return json;
                }
            } catch (e) {
                console.log('[Foundry Chat] Failed to parse embedded JSON:', e.message);
            }
        }
        
        // Try to find any JSON object with "actions" property
        const anyJsonRegex = /\{[\s\S]{0,3000}?"actions"[\s\S]{0,3000}?\}/;
        const anyJsonMatch = text.match(anyJsonRegex);
        if (anyJsonMatch) {
            try {
                const json = JSON.parse(anyJsonMatch[0]);
                if (json.actions && Array.isArray(json.actions)) {
                    console.log('[Foundry Chat] Found JSON with actions (message may be missing)');
                    return {
                        message: json.message || text.replace(anyJsonMatch[0], '').trim() || 'Configuration updated.',
                        actions: json.actions
                    };
                }
            } catch (e) {
                console.log('[Foundry Chat] Failed to parse JSON with actions:', e.message);
            }
        }
        
        // Fallback: Try to extract actions from natural language
        // IMPORTANT: Use user's message to understand intent, not agent's response
        // This prevents extracting actions for fields the agent mentions but user didn't request
        console.log('[Foundry Chat] No JSON found, attempting natural language parsing...');
        console.log('[Foundry Chat] User message:', userMessage || '(not provided)');
        // Use user's message if provided and not empty, otherwise fall back to agent's response text
        const textToParse = (userMessage && typeof userMessage === 'string' && userMessage.trim()) ? userMessage : text;
        const naturalLanguageActions = parseNaturalLanguageActions(textToParse);
        if (naturalLanguageActions && naturalLanguageActions.length > 0) {
            console.log('[Foundry Chat] Extracted actions from natural language:', naturalLanguageActions);
            return {
                message: text, // Use original text as message
                actions: naturalLanguageActions
            };
        }
        
        console.log('[Foundry Chat] No valid JSON structure or extractable actions found in response');
        return null;
    }
    
    /**
     * Parse natural language to extract actions
     * Attempts to identify merchant, channel, payment type selections from text
     * IMPORTANT: Only extracts actions for fields explicitly mentioned in the text
     */
    function parseNaturalLanguageActions(text) {
        const actions = [];
        const lowerText = text.toLowerCase();
        
        // More specific patterns that require explicit field mention
        // Merchant patterns - must explicitly mention "merchant" or "商户"
        const merchantPatterns = [
            { pattern: /(?:merchant|商户|商户名).*?(?:star\s*saas|starsaas)/i, value: 'starsaas', field: 'merchant-name' },
            { pattern: /(?:merchant|商户|商户名).*?(?:nbc\s*pay|nbcpay)/i, value: 'nbcpay', field: 'merchant-name' },
            { pattern: /(?:merchant|商户|商户名).*?(?:nex\s*pay|nexpay)/i, value: 'nexpay', field: 'merchant-name' },
            { pattern: /(?:selected|选择|set|设置).*?(?:star\s*saas|starsaas).*?(?:merchant|商户|商户名)/i, value: 'starsaas', field: 'merchant-name' },
            { pattern: /(?:current\s*selection|当前选择).*?(?:merchant\s*name|商户名).*?(?:star\s*saas|starsaas)/i, value: 'starsaas', field: 'merchant-name' }
        ];
        
        // Channel patterns - flexible matching
        // First check for explicit channel mention, then check for common phrases like "set as YSEPAY"
        const channelPatterns = [
            // Explicit channel mention
            { pattern: /(?:channel|渠道).*?ysepay/i, value: 'ysepay', field: 'channel' },
            { pattern: /(?:channel|渠道).*?rumble/i, value: 'rumble', field: 'channel' },
            { pattern: /(?:channel|渠道).*?evonet/i, value: 'evonet', field: 'channel' },
            { pattern: /(?:channel|渠道).*?paysaas/i, value: 'paysaas', field: 'channel' },
            // Flexible patterns: "set as YSEPAY", "use YSEPAY", "select YSEPAY", etc.
            { pattern: /(?:set|use|select|choose|pick).*?(?:as|to|for).*?ysepay/i, value: 'ysepay', field: 'channel' },
            { pattern: /(?:set|use|select|choose|pick).*?(?:as|to|for).*?rumble/i, value: 'rumble', field: 'channel' },
            { pattern: /(?:set|use|select|choose|pick).*?(?:as|to|for).*?evonet/i, value: 'evonet', field: 'channel' },
            { pattern: /(?:set|use|select|choose|pick).*?(?:as|to|for).*?paysaas/i, value: 'paysaas', field: 'channel' },
            // Even more flexible: just "YSEPAY" or "ysepay" (if no other field mentioned)
            { pattern: /^ysepay$/i, value: 'ysepay', field: 'channel' },
            { pattern: /^rumble$/i, value: 'rumble', field: 'channel' },
            { pattern: /^evonet$/i, value: 'evonet', field: 'channel' },
            { pattern: /^paysaas$/i, value: 'paysaas', field: 'channel' },
            // Reverse order: "YSEPAY as channel" or "YSEPAY for channel"
            { pattern: /ysepay.*?(?:as|for).*?(?:channel|渠道)/i, value: 'ysepay', field: 'channel' },
            { pattern: /rumble.*?(?:as|for).*?(?:channel|渠道)/i, value: 'rumble', field: 'channel' },
            { pattern: /evonet.*?(?:as|for).*?(?:channel|渠道)/i, value: 'evonet', field: 'channel' },
            { pattern: /paysaas.*?(?:as|for).*?(?:channel|渠道)/i, value: 'paysaas', field: 'channel' }
        ];
        
        // Payment type patterns - flexible matching like channels
        const paymentTypePatterns = [
            // Explicit payment type/method mention
            { pattern: /(?:payment\s*(?:type|method)|支付类型|支付种类).*?(?:credit\s*card|信用卡)/i, value: 'credit_card', field: 'payment-type' },
            { pattern: /(?:payment\s*(?:type|method)|支付类型|支付种类).*?(?:mix|混合|混合支付)/i, value: 'mix', field: 'payment-type' },
            // Flexible patterns: "set payment method as credit card", "set as credit card", "use credit card", etc.
            { pattern: /(?:set|use|select|choose|pick).*?(?:payment\s*(?:type|method))?.*?(?:as|to|for).*?(?:credit\s*card|信用卡)/i, value: 'credit_card', field: 'payment-type' },
            { pattern: /(?:set|use|select|choose|pick).*?(?:payment\s*(?:type|method))?.*?(?:as|to|for).*?(?:mix|混合支付)/i, value: 'mix', field: 'payment-type' },
            // Reverse order: "credit card as payment type" or "credit card for payment"
            { pattern: /(?:credit\s*card|信用卡).*?(?:as|for).*?(?:payment|支付)/i, value: 'credit_card', field: 'payment-type' },
            { pattern: /(?:mix|混合支付).*?(?:as|for).*?(?:payment|支付)/i, value: 'mix', field: 'payment-type' },
            // Just "credit card" or "信用卡" (if no other field values mentioned)
            { pattern: /^(?:credit\s*card|信用卡)$/i, value: 'credit_card', field: 'payment-type' },
            { pattern: /^(?:mix|混合支付)$/i, value: 'mix', field: 'payment-type' }
        ];
        
        // Check for explicit field mentions
        const hasMerchantMention = /(?:merchant|商户|商户名)/i.test(text);
        const hasChannelMention = /(?:channel|渠道)/i.test(text);
        const hasPaymentTypeMention = /(?:payment\s*(?:type|method)|支付类型|支付种类|as\s+payment|for\s+payment)/i.test(text);
        
        // Check for channel/merchant/payment type values without explicit field mention
        const hasChannelValue = /(?:ysepay|rumble|evonet|paysaas)/i.test(text);
        const hasMerchantValue = /(?:star\s*saas|starsaas|nbcpay|nexpay)/i.test(text);
        const hasPaymentValue = /(?:credit\s*card|信用卡|mix|混合支付)/i.test(text);
        
        // Only extract merchant if explicitly mentioned
        if (hasMerchantMention) {
            for (const pattern of merchantPatterns) {
                if (pattern.pattern.test(text)) {
                    actions.push({
                        type: 'select',
                        field: pattern.field,
                        value: pattern.value
                    });
                    break; // Only add one merchant
                }
            }
        }
        
        // Extract channel - check explicit mention first, then flexible patterns
        if (hasChannelMention) {
            // Explicit channel mention
            for (const pattern of channelPatterns) {
                if (pattern.pattern.test(text)) {
                    actions.push({
                        type: 'select',
                        field: pattern.field,
                        value: pattern.value
                    });
                    break; // Only add one channel
                }
            }
        } else if (hasChannelValue && !hasMerchantMention && !hasPaymentTypeMention) {
            // No explicit field mention, but channel value detected and no other field values
            // Try flexible patterns like "set as YSEPAY", "use YSEPAY", etc.
            for (const pattern of channelPatterns) {
                if (pattern.pattern.test(text)) {
                    actions.push({
                        type: 'select',
                        field: pattern.field,
                        value: pattern.value
                    });
                    break; // Only add one channel
                }
            }
        }
        
        // Extract payment type - check explicit mention first, then flexible patterns
        if (hasPaymentTypeMention) {
            // Explicit payment type mention
            for (const pattern of paymentTypePatterns) {
                if (pattern.pattern.test(text)) {
                    actions.push({
                        type: 'select',
                        field: pattern.field,
                        value: pattern.value
                    });
                    break; // Only add one payment type
                }
            }
        } else if (hasPaymentValue && !hasChannelMention && !hasMerchantMention && !hasChannelValue && !hasMerchantValue) {
            // No explicit field mention, but payment value detected and no other field values
            // Try flexible patterns like "set as credit card", "use credit card", "credit card", etc.
            for (const pattern of paymentTypePatterns) {
                if (pattern.pattern.test(text)) {
                    actions.push({
                        type: 'select',
                        field: pattern.field,
                        value: pattern.value
                    });
                    break; // Only add one payment type
                }
            }
        }
        
        // Special fallback: if text contains "credit card" and nothing else, assume payment type
        if (actions.length === 0 && hasPaymentValue && !hasChannelValue && !hasMerchantValue) {
            const creditCardMatch = /(?:credit\s*card|信用卡)/i.test(text);
            const mixMatch = /(?:mix|混合支付)/i.test(text);
            if (creditCardMatch) {
                console.log('[Foundry Chat] Fallback: Detected Credit Card as payment type');
                actions.push({
                    type: 'select',
                    field: 'payment-type',
                    value: 'credit_card'
                });
            } else if (mixMatch) {
                console.log('[Foundry Chat] Fallback: Detected Mix as payment type');
                actions.push({
                    type: 'select',
                    field: 'payment-type',
                    value: 'mix'
                });
            }
        }
        
        // Additional fallback: "Set as Credit Card" or "Set Payment Method as Credit Card"
        if (actions.length === 0) {
            const setAsCreditCard = /(?:set|use|select).*?(?:as|payment\s*(?:type|method)\s*as).*?(?:credit\s*card|信用卡)/i.test(text);
            if (setAsCreditCard && !hasChannelValue && !hasMerchantValue) {
                console.log('[Foundry Chat] Additional fallback: Detected "Set as Credit Card" pattern');
                actions.push({
                    type: 'select',
                    field: 'payment-type',
                    value: 'credit_card'
                });
            }
        }
        
        console.log('[Foundry Chat] Final actions extracted:', actions.length, 'action(s)');
        if (actions.length > 0) {
            console.log('[Foundry Chat] Actions:', JSON.stringify(actions, null, 2));
        }
        
        // Log what was extracted for debugging
        if (actions.length > 0) {
            console.log('[Foundry Chat] Extracted actions:', actions);
            console.log('[Foundry Chat] Field mentions - Merchant:', hasMerchantMention, 'Channel:', hasChannelMention, 'Payment:', hasPaymentTypeMention);
        }
        
        return actions.length > 0 ? actions : null;
    }

    /**
     * Format message content with proper line breaks and formatting
     */
    function formatMessageContent(text) {
        if (!text) return '';
        
        // Escape HTML to prevent XSS, but preserve formatting
        const escapeHtml = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };
        
        // Split text into lines
        const lines = text.split('\n');
        const formattedParts = [];
        let inList = false;
        let currentParagraph = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Empty line - end current paragraph or list
            if (!line) {
                if (currentParagraph.length > 0) {
                    formattedParts.push('<p>' + currentParagraph.join('<br>') + '</p>');
                    currentParagraph = [];
                }
                if (inList) {
                    formattedParts.push('</ul>');
                    inList = false;
                }
                continue;
            }
            
            // Check if line is a bullet point (starts with -, •, *, or number)
            const bulletMatch = line.match(/^([-•*]|\d+\.)\s+(.+)$/);
            
            if (bulletMatch) {
                // End current paragraph if exists
                if (currentParagraph.length > 0) {
                    formattedParts.push('<p>' + currentParagraph.join('<br>') + '</p>');
                    currentParagraph = [];
                }
                
                // Start list if not already in one
                if (!inList) {
                    formattedParts.push('<ul>');
                    inList = true;
                }
                
                // Process the bullet content for inline formatting
                const bulletContent = processInlineMarkdown(bulletMatch[2]);
                formattedParts.push('<li>' + bulletContent + '</li>');
            } else {
                // Regular text line
                // End list if in one
                if (inList) {
                    formattedParts.push('</ul>');
                    inList = false;
                }
                
                // Process line for inline Markdown formatting
                const processedLine = processInlineMarkdown(line);
                currentParagraph.push(processedLine);
            }
        }
        
        // Close any open paragraph or list
        if (currentParagraph.length > 0) {
            formattedParts.push('<p>' + currentParagraph.join('<br>') + '</p>');
        }
        if (inList) {
            formattedParts.push('</ul>');
        }
        
        return formattedParts.join('');
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Process inline Markdown formatting (bold, italic, code)
     * Converts **bold**, *italic*, ***bold italic***, and `code`
     */
    function processInlineMarkdown(text) {
        if (!text) return '';
        
        // Escape HTML first to prevent XSS
        let processed = escapeHtml(text);
        
        // Process inline code blocks first (to avoid processing markdown inside them)
        // Match `code` but not `` (empty)
        processed = processed.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        
        // Process bold and italic
        // Handle ***bold italic*** first (must come before ** and *)
        processed = processed.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        // Then **bold** (must come before *)
        processed = processed.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
        // Then *italic* (but avoid matching if preceded or followed by *)
        // Use negative lookbehind/lookahead to avoid matching ** or ***
        processed = processed.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
        
        return processed;
    }

    /**
     * Add message to chat
     */
    function addMessage(role, content) {
        const emptyState = messagesContainer.querySelector('.foundry-chat-empty');
        if (emptyState) {
            emptyState.remove();
        }
        
        // Hide suggestions after first message
        const suggestions = chatWindow.querySelector('.foundry-chat-suggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `foundry-chat-message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'foundry-chat-message-avatar';
        avatar.textContent = role === 'user' ? '👤' : (CONFIG.AGENT_AVATAR || 'AI');

        const messageContent = document.createElement('div');
        messageContent.className = 'foundry-chat-message-content';
        
        // Format content with proper line breaks and lists
        if (role === 'assistant') {
            messageContent.innerHTML = formatMessageContent(content);
        } else {
            // User messages don't need formatting
            messageContent.textContent = content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'foundry-chat-message assistant';
        typingDiv.innerHTML = `
            <div class="foundry-chat-message-avatar">${renderAvatar(CONFIG.AGENT_AVATAR)}</div>
            <div class="foundry-chat-typing">
                <div class="foundry-chat-typing-dot"></div>
                <div class="foundry-chat-typing-dot"></div>
                <div class="foundry-chat-typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return typingDiv;
    }

    /**
     * Show error message
     */
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'foundry-chat-error';
        errorDiv.textContent = `错误: ${message}`;
        messagesContainer.appendChild(errorDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    /**
     * Show action notification (visual feedback when page is updated)
     */
    function showActionNotification(message, isError = false) {
        if (!chatWindow) return;
        
        const notification = document.createElement('div');
        notification.className = 'foundry-chat-action-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${isError ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Save conversation history to localStorage
     */
    function saveConversationHistory() {
        try {
            const storageKey = CONFIG.STORAGE_KEY || 'foundry-chat-history';
            localStorage.setItem(storageKey, JSON.stringify(conversationHistory));
        } catch (e) {
            console.warn('Failed to save conversation history:', e);
        }
    }

    /**
     * Load conversation history from localStorage
     */
    function loadConversationHistory() {
        try {
            const storageKey = CONFIG.STORAGE_KEY || 'foundry-chat-history';
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                conversationHistory = JSON.parse(saved);
                // Restore messages to UI
                conversationHistory.forEach(msg => {
                    addMessage(msg.role, msg.content);
                });
            }
        } catch (e) {
            console.warn('Failed to load conversation history:', e);
        }
    }

    /**
     * Clear conversation history
     */
    function clearHistory() {
        conversationHistory = [];
        const storageKey = CONFIG.STORAGE_KEY || 'foundry-chat-history';
        localStorage.removeItem(storageKey);
        
        // Clear messages container
        messagesContainer.innerHTML = `
            <div class="foundry-chat-empty">
                <div class="foundry-chat-empty-icon">💬</div>
                <div class="foundry-chat-empty-text">
                    <p>你好！我是 ${escapeHtml(CONFIG.AGENT_NAME)}。</p>
                    <p>有什么可以帮助您的吗？</p>
                </div>
            </div>
        `;
        
        // Clear input field
        if (inputField) {
            inputField.value = '';
        }
        
        // Show suggestions again in Spreedly style
        const suggestions = chatWindow.querySelector('.foundry-chat-suggestions');
        if (suggestions && currentStyle === 'spreedly' && isOpen) {
            suggestions.style.display = 'block';
        }
        
        console.log('[Foundry Chat] Conversation history cleared');
    }

    // Initialize when DOM is ready
    // Check for global configuration first
    if (window.FOUNDRY_CHAT_CONFIG) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                init(window.FOUNDRY_CHAT_CONFIG);
                // Set default agent selector after initialization
                setTimeout(() => {
                    const selector = document.getElementById('foundry-chat-agent-selector');
                    if (selector && window.FOUNDRY_CHAT_CONFIG.defaultAgent) {
                        selector.value = window.FOUNDRY_CHAT_CONFIG.defaultAgent;
                    }
                }, 100);
            });
        } else {
            init(window.FOUNDRY_CHAT_CONFIG);
            // Set default agent selector after initialization
            setTimeout(() => {
                const selector = document.getElementById('foundry-chat-agent-selector');
                if (selector && window.FOUNDRY_CHAT_CONFIG.defaultAgent) {
                    selector.value = window.FOUNDRY_CHAT_CONFIG.defaultAgent;
                }
            }, 100);
        }
    } else {
        // Use defaults if no configuration provided
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    // Switch agent
    window.switchFoundryAgent = function(agentKey) {
        if (!window.FOUNDRY_AVAILABLE_AGENTS || !window.FOUNDRY_AVAILABLE_AGENTS[agentKey]) {
            console.error('Agent not found:', agentKey);
            return;
        }
        
        const agent = window.FOUNDRY_AVAILABLE_AGENTS[agentKey];
        
        // Update configuration
        CONFIG.ENDPOINT = agent.endpoint;
        CONFIG.AGENT_NAME = agent.agentName;
        CONFIG.AGENT_TITLE = agent.agentTitle;
        CONFIG.AGENT_MODEL = agent.agentModel;
        CONFIG.AGENT_AVATAR = agent.agentAvatar;
        CONFIG.CAN_INTERACT_WITH_PAGE = agent.canInteractWithPage || false;
        
        // Update storage key for separate conversation history
        const storageKey = `foundry-chat-history-${agentKey}`;
        CONFIG.STORAGE_KEY = storageKey;
        
        // Clear current conversation and load new agent's history
        conversationHistory = [];
        const messagesContainer = document.getElementById('foundry-chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="foundry-chat-empty">
                    <div class="foundry-chat-empty-icon">💬</div>
                    <div class="foundry-chat-empty-text">
                        <p>你好！我是 ${CONFIG.AGENT_NAME}。</p>
                        <p>有什么可以帮助您的吗？</p>
                    </div>
                </div>
            `;
        }
        
        // Update UI elements
        const nameEl = document.getElementById('foundry-chat-agent-name');
        const titleEl = document.getElementById('foundry-chat-agent-title');
        const modelEl = document.getElementById('foundry-chat-agent-model');
        const avatarEl = chatWindow?.querySelector('.foundry-chat-header-avatar');
        
        if (nameEl) nameEl.textContent = CONFIG.AGENT_NAME;
        if (titleEl) titleEl.textContent = CONFIG.AGENT_TITLE;
        if (modelEl) modelEl.textContent = CONFIG.AGENT_MODEL;
        if (avatarEl) {
            if (isImageAvatar(CONFIG.AGENT_AVATAR)) {
                avatarEl.innerHTML = `<img src="${escapeHtml(CONFIG.AGENT_AVATAR)}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                avatarEl.textContent = CONFIG.AGENT_AVATAR || 'AI';
            }
        }
        
        // Load conversation history for new agent
        loadConversationHistory();
        
        // Update selector to show current selection
        const selector = document.getElementById('foundry-chat-agent-selector');
        if (selector) {
            selector.value = agentKey;
        }
        
        // Update all message avatars in the conversation
        const messageAvatars = chatWindow?.querySelectorAll('.foundry-chat-message-avatar');
        if (messageAvatars) {
            messageAvatars.forEach(avatar => {
                const message = avatar.closest('.foundry-chat-message');
                if (message && message.classList.contains('assistant')) {
                    if (isImageAvatar(CONFIG.AGENT_AVATAR)) {
                        avatar.innerHTML = `<img src="${escapeHtml(CONFIG.AGENT_AVATAR)}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    } else {
                        avatar.textContent = CONFIG.AGENT_AVATAR || 'AI';
                    }
                }
            });
        }
    };

    // Expose functions for external use
    window.clearFoundryChatHistory = clearHistory;
    window.toggleFoundryChatStyle = toggleStyle;
    window.initFoundryChat = init; // Allow manual initialization with config

})();
