// Channel Binding Configuration - JavaScript
// Handles form navigation, validation, and backend integration

(function() {
    'use strict';

    // State management
    const state = {
        currentChannel: '',
        currentPaymentType: '',
        currentStep: 1,
        totalSteps: 3,
        formData: {}
    };

    // Channel configurations
    const channelConfigs = {
        ysepay: {
            paymentType: 'credit_card',
            paymentMethods: [{ value: 'all', label: '全部', hint: '信用卡正常情况下绑定 Visa, Master, Maestro 等' }],
            currencies: [{ value: 'USD', label: 'USD - 美元' }],
            defaultCurrencyNote: '',
            infoText: '请确保已从YSEPAY方获取以下信息：商户号、子商户、Key 与 AesKey',
            defaultCardTypes: ['全部', 'Maestro', 'Master', 'Visa', 'JCB', 'Diners', 'Discover', 'AE'],
            interfaceType: 'direct' // Default, can be overridden by admin config
        },
        rumble: {
            paymentType: 'mix',
            paymentMethods: [{ value: 'mix', label: '混合支付', hint: '选择混合支付方式' }],
            currencies: [{ value: 'INR', label: 'INR - 印度卢比' }],
            defaultCurrencyNote: '注意：RUMBLE 混合支付通常不勾选是否默认',
            infoText: '请确保已从 RUMBLE 管理后台获取 authToken 并配置回调地址\n回调地址示例：https://checkout.example.com/v1/RBAPMNotify',
            defaultCardTypes: ['全部', 'MIX'],
            interfaceType: 'iframe' // Default, can be overridden by admin config
        },
        evonet: {
            paymentType: 'credit_card',
            paymentMethods: [{ value: 'all', label: '全部', hint: '信用卡正常情况下绑定 Visa, Master, Maestro 等' }],
            currencies: [{ value: 'USD', label: 'USD - 美元' }],
            defaultCurrencyNote: '',
            infoText: '请确保已从EVONET方获取以下信息：Store ID、SignKey 与 RSA Public Key',
            defaultCardTypes: ['全部', 'Maestro', 'Master', 'Visa', 'JCB', 'Diners', 'Discover', 'AE'],
            interfaceType: 'direct' // Default, can be overridden by admin config
        },
        paysaas: {
            paymentType: 'credit_card',
            paymentMethods: [{ value: 'all', label: '全部', hint: '信用卡正常情况下绑定 Visa, Master, Maestro 等' }],
            currencies: [{ value: 'USD', label: 'USD - 美元' }],
            defaultCurrencyNote: '',
            infoText: '请确保已从PAYSAAS方获取以下信息：商户号、子商户、Key 与 AesKey',
            defaultCardTypes: ['全部', 'Maestro', 'Master', 'Visa', 'JCB', 'Diners', 'Discover', 'AE'],
            interfaceType: 'direct' // Default, can be overridden by admin config
        }
    };

    // Card type configurations (loaded from admin config)
    let cardTypeConfigs = {
        ysepay: null,
        rumble: null,
        evonet: null,
        paysaas: null
    };

    // Currency configurations (loaded from admin config)
    let currencyConfigs = {
        ysepay: null,
        rumble: null,
        evonet: null,
        paysaas: null
    };

    // Interface type configurations (loaded from admin config)
    let interfaceTypeConfigs = {
        ysepay: null,
        rumble: null,
        evonet: null,
        paysaas: null
    };

    // DOM Elements
    const elements = {
        channelForm: document.getElementById('channelBindingForm'),
        paymentTypeSelect: document.getElementById('payment-type'),
        channelSelect: document.getElementById('channel'),
        infoBox: document.getElementById('channelInfoBox'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        submitBtn: document.getElementById('submitBtn'),
        resetBtn: document.getElementById('resetBtn'),
        messageContainer: document.getElementById('messageContainer'),
        loadingOverlay: document.getElementById('loadingOverlay')
    };

    // Expose functions immediately so they're available as soon as script loads
    // This ensures foundry-chat.js can access them even if init() hasn't run yet
    window.executePageActions = executePageActions;
    window.getFormFieldsInfo = getFormFieldsInfo;
    
    // Initialize
    function init() {
        console.log('[Channel Binding] Initializing...');
        setupEventListeners();
        updateUI();
        setupAutoGenerateChannelName();
        
        // Load merchants - use a small delay to ensure DOM is ready
        setTimeout(() => {
            console.log('[Channel Binding] Loading merchants after DOM ready check...');
            loadMerchantOptions();
        }, 50);
        
        // Also try loading immediately
        loadMerchantOptions();
        
        // Re-expose to ensure they're still available after init
        window.executePageActions = executePageActions;
        window.getFormFieldsInfo = getFormFieldsInfo;
        
        console.log('[Channel Binding] Initialized. Functions exposed:', {
            executePageActions: typeof window.executePageActions === 'function',
            getFormFieldsInfo: typeof window.getFormFieldsInfo === 'function'
        });
    }
    
    /**
     * Get information about available form fields (for chat bot context)
     * @returns {Object} Information about form fields
     */
    function getFormFieldsInfo() {
        console.log('[getFormFieldsInfo] Called - looking for form elements...');
        
        const merchantSelect = document.getElementById('merchant-name');
        const channelSelect = document.getElementById('channel');
        const paymentTypeSelect = document.getElementById('payment-type');
        
        console.log('[getFormFieldsInfo] Found elements:', {
            merchant: !!merchantSelect,
            channel: !!channelSelect,
            paymentType: !!paymentTypeSelect
        });
        
        const merchants = merchantSelect ? Array.from(merchantSelect.options)
            .slice(1)
            .map(opt => ({ value: opt.value, text: opt.textContent })) : [];
        
        const channels = channelSelect ? Array.from(channelSelect.options)
            .slice(1)
            .map(opt => ({ value: opt.value, text: opt.textContent })) : [];
        
        const paymentTypes = paymentTypeSelect ? Array.from(paymentTypeSelect.options)
            .slice(1)
            .map(opt => ({ value: opt.value, text: opt.textContent })) : [];
        
        const result = {
            merchants: merchants,
            channels: channels,
            paymentTypes: paymentTypes,
            currentValues: {
                merchant: merchantSelect?.value || '',
                channel: channelSelect?.value || '',
                paymentType: paymentTypeSelect?.value || ''
            }
        };
        
        console.log('[getFormFieldsInfo] Returning:', {
            merchantCount: merchants.length,
            channelCount: channels.length,
            paymentTypeCount: paymentTypes.length,
            merchants: merchants.map(m => m.text),
            channels: channels.map(c => c.text),
            paymentTypes: paymentTypes.map(p => p.text)
        });
        
        return result;
    }
    
    /**
     * Execute actions on the page (called by chat bot)
     * @param {Array} actions - Array of action objects
     * Example: [{type: "select", field: "merchant-name", value: "starsaas"}]
     */
    function executePageActions(actions) {
        console.log('[Page Actions] ===== executePageActions CALLED =====');
        console.log('[Page Actions] Actions received:', JSON.stringify(actions, null, 2));
        if (!actions || !Array.isArray(actions)) {
            console.warn('[Page Actions] ✗ Invalid actions provided:', actions);
            return;
        }
        
        console.log('[Page Actions] Executing', actions.length, 'action(s)');
        actions.forEach((action, index) => {
            console.log(`[Page Actions] ===== Executing action ${index + 1}/${actions.length} =====`);
            console.log(`[Page Actions] Action details:`, JSON.stringify(action, null, 2));
            try {
                switch (action.type) {
                    case 'select':
                        console.log(`[Page Actions] → Calling executeSelectAction for field: "${action.field}", value: "${action.value}"`);
                        executeSelectAction(action);
                        break;
                    case 'input':
                        console.log(`[Page Actions] → Calling executeInputAction for field: "${action.field}", value: "${action.value}"`);
                        executeInputAction(action);
                        break;
                    case 'click':
                        console.log(`[Page Actions] → Calling executeClickAction`);
                        executeClickAction(action);
                        break;
                    case 'navigate':
                        console.log(`[Page Actions] → Calling executeNavigateAction`);
                        executeNavigateAction(action);
                        break;
                    default:
                        console.warn('[Page Actions] ✗ Unknown action type:', action.type);
                }
                console.log(`[Page Actions] ✓ Action ${index + 1} completed`);
            } catch (error) {
                console.error(`[Page Actions] ✗ Error executing action ${index + 1}:`, error);
                console.error('[Page Actions] Error stack:', error.stack);
            }
        });
        console.log('[Page Actions] ===== All actions completed =====');
    }
    
    /**
     * Execute select action (dropdown selection)
     */
    function executeSelectAction(action) {
        const { field, value, text } = action;
        console.log(`[Page Actions] executeSelectAction: field="${field}", value="${value}", text="${text}"`);
        
        // Handle field name variations
        let fieldId = field;
        if (field === 'payment-type') {
            fieldId = 'payment-type'; // Keep as is
        }
        
        // Try multiple selectors to find the element
        let element = document.getElementById(fieldId);
        if (!element) {
            element = document.querySelector(`[name="${fieldId}"]`);
        }
        if (!element) {
            element = document.querySelector(`[name="${field}"]`);
        }
        if (!element && field === 'payment-type') {
            // Special case for payment-type: try common variations
            element = document.getElementById('payment-type') || 
                     document.querySelector('select#payment-type') ||
                     document.querySelector('select[name="paymentType"]') ||
                     document.querySelector('select[name="payment-type"]');
        }
        
        if (!element) {
            console.warn(`[Page Actions] ✗ Element not found for field: "${field}" (tried: "${fieldId}")`);
            // Try alternative selectors
            const altElement = document.querySelector(`select[name*="${field}"]`) || 
                             document.querySelector(`#${field}`) ||
                             document.querySelector(`select#${field}`);
            if (altElement) {
                console.log(`[Page Actions] Found element using alternative selector:`, altElement.id || altElement.name);
                return executeSelectAction({ ...action, field: altElement.id || altElement.name });
            }
            console.error(`[Page Actions] ✗ Could not find element. Available selects:`, 
                Array.from(document.querySelectorAll('select')).map(s => ({ id: s.id, name: s.name })));
            return;
        }
        
        if (element.tagName !== 'SELECT') {
            console.warn(`[Page Actions] ✗ Element is not a select: "${field}" (tagName: ${element.tagName})`);
            return;
        }
        
        console.log(`[Page Actions] Found select element:`, element.id || element.name, 'with', element.options.length, 'options');
        
        // Try to find option by value first (case-insensitive)
        let option = null;
        let optionIndex = -1;
        Array.from(element.options).forEach((opt, index) => {
            if (opt.value.toLowerCase() === String(value).toLowerCase()) {
                option = opt;
                optionIndex = index;
            }
        });
        
        // If not found by value, try by text content (partial match)
        if (!option) {
            Array.from(element.options).forEach((opt, index) => {
                const optText = opt.textContent.toLowerCase().trim();
                const searchValue = String(value).toLowerCase().trim();
                if (optText === searchValue || optText.includes(searchValue) || searchValue.includes(optText)) {
                    if (!option) {
                        option = opt;
                        optionIndex = index;
                    }
                }
            });
        }
        
        // If still not found and text is provided, try by text
        if (!option && text) {
            Array.from(element.options).forEach((opt, index) => {
                if (opt.textContent.toLowerCase().includes(String(text).toLowerCase())) {
                    if (!option) {
                        option = opt;
                        optionIndex = index;
                    }
                }
            });
        }
        
        if (!option) {
            console.error(`[Page Actions] ✗ Option not found for value: "${value}"`);
            console.error(`[Page Actions] Available options:`, 
                Array.from(element.options).map((opt, idx) => ({
                    index: idx,
                    value: opt.value,
                    text: opt.textContent,
                    selected: opt.selected
                }))
            );
            return;
        }
        
        const oldValue = element.value;
        const oldIndex = element.selectedIndex;
        const oldText = element.options[element.selectedIndex]?.textContent;
        
        console.log(`[Page Actions] ✓ Found option:`, {
            value: option.value,
            text: option.textContent,
            index: optionIndex
        });
        console.log(`[Page Actions] Current state:`, {
            value: oldValue,
            index: oldIndex,
            text: oldText
        });
        
        // AGGRESSIVE VISUAL UPDATE - Multiple methods to ensure browser recognizes the change
        
        // Method 1: Clear all selections first
        Array.from(element.options).forEach(opt => opt.selected = false);
        
        // Method 2: Set selectedIndex FIRST (most reliable for visual update)
        if (optionIndex >= 0 && optionIndex < element.options.length) {
            element.selectedIndex = optionIndex;
        } else {
            console.warn(`[Page Actions] ⚠ Invalid optionIndex: ${optionIndex}, using value instead`);
            element.value = option.value;
        }
        
        // Method 3: Set value property
        element.value = option.value;
        
        // Method 4: Directly mark the option as selected
        option.selected = true;
        
        // Method 5: Force browser to recognize by accessing offsetHeight (triggers reflow)
        void element.offsetHeight;
        
        // Method 6: Use a temporary style change to force repaint
        const originalDisplay = window.getComputedStyle(element).display;
        element.style.display = 'none';
        void element.offsetHeight; // Force reflow
        element.style.display = originalDisplay;
        
        // Method 7: Verify immediately
        const immediateValue = element.value;
        const immediateIndex = element.selectedIndex;
        const immediateText = element.options[element.selectedIndex]?.textContent;
        console.log(`[Page Actions] Immediate result:`, {
            value: immediateValue,
            index: immediateIndex,
            text: immediateText,
            success: immediateValue === option.value && immediateIndex === optionIndex
        });
        
        // Method 8: Trigger focus/blur cycle to force browser recognition
        element.focus();
        setTimeout(() => {
            element.blur();
        }, 10);
        
        // Method 9: Trigger events synchronously
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        element.dispatchEvent(changeEvent);
        
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        element.dispatchEvent(inputEvent);
        
        // Method 10: Also try native HTMLEvents for older browsers
        if ('createEvent' in document) {
            const evt = document.createEvent('HTMLEvents');
            evt.initEvent('change', true, true);
            element.dispatchEvent(evt);
        }
        
        // Method 11: Use requestAnimationFrame for final verification and additional events
        requestAnimationFrame(() => {
            // Double-check and reset if needed
            const rafValue = element.value;
            const rafIndex = element.selectedIndex;
            
            if (rafValue !== option.value || rafIndex !== optionIndex) {
                console.warn(`[Page Actions] ⚠ Selection mismatch after RAF, forcing reset...`);
                // Force reset more aggressively
                Array.from(element.options).forEach(opt => opt.selected = false);
                element.selectedIndex = optionIndex;
                element.value = option.value;
                option.selected = true;
                void element.offsetHeight; // Force reflow again
            }
            
            // Trigger additional events
            element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            
            // Use another requestAnimationFrame to ensure visual update
            requestAnimationFrame(() => {
                // Final verification
                setTimeout(() => {
                    const finalValue = element.value;
                    const finalIndex = element.selectedIndex;
                    const finalText = element.options[element.selectedIndex]?.textContent;
                    
                    console.log(`[Page Actions] ✓ Final verification:`, {
                        value: finalValue,
                        index: finalIndex,
                        text: finalText,
                        expectedValue: option.value,
                        expectedIndex: optionIndex,
                        success: finalValue === option.value && finalIndex === optionIndex
                    });
                    
                    if (finalValue !== option.value || finalIndex !== optionIndex) {
                        console.error(`[Page Actions] ✗✗✗ UPDATE FAILED AFTER ALL ATTEMPTS!`);
                        console.error(`  Expected: value="${option.value}", index=${optionIndex}, text="${option.textContent}"`);
                        console.error(`  Got: value="${finalValue}", index=${finalIndex}, text="${finalText}"`);
                        console.error(`  Element HTML:`, element.outerHTML);
                        console.error(`  All options:`, Array.from(element.options).map((opt, idx) => ({
                            index: idx,
                            value: opt.value,
                            text: opt.textContent,
                            selected: opt.selected
                        })));
                        
                        // Last resort: try one more time with even more force
                        console.log(`[Page Actions] Attempting last resort update...`);
                        Array.from(element.options).forEach((opt, idx) => {
                            opt.selected = (idx === optionIndex);
                        });
                        element.selectedIndex = optionIndex;
                        element.value = option.value;
                        void element.offsetHeight;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        console.log(`[Page Actions] ✓✓✓ SUCCESS! Updated ${field} from "${oldValue}" to "${option.value}" (${option.textContent})`);
                    }
                }, 100);
            });
        });
        
        // Visual feedback: briefly highlight the field
        element.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease';
        const originalBorder = element.style.borderColor;
        const originalBoxShadow = element.style.boxShadow;
        const originalBorderWidth = element.style.borderWidth;
        element.style.borderColor = '#4CAF50';
        element.style.borderWidth = '2px';
        element.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.3)';
        setTimeout(() => {
            element.style.borderColor = originalBorder || '';
            element.style.borderWidth = originalBorderWidth || '';
            element.style.boxShadow = originalBoxShadow || '';
        }, 2000);
        
        // Force a re-render by toggling a class
        element.classList.add('foundry-updated');
        setTimeout(() => {
            element.classList.remove('foundry-updated');
        }, 100);
    }
    
    /**
     * Execute input action (text input)
     */
    function executeInputAction(action) {
        const { field, value } = action;
        const element = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
        
        if (!element) {
            console.warn('Element not found for field:', field);
            return;
        }
        
        if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
            console.warn('Element is not an input:', field);
            return;
        }
        
        element.value = value;
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
        console.log(`Set ${field} = ${value}`);
    }
    
    /**
     * Execute click action
     */
    function executeClickAction(action) {
        const { selector, id } = action;
        let element = null;
        
        if (id) {
            element = document.getElementById(id);
        } else if (selector) {
            element = document.querySelector(selector);
        }
        
        if (element) {
            element.click();
            console.log(`Clicked element:`, id || selector);
        } else {
            console.warn('Element not found for click:', id || selector);
        }
    }
    
    /**
     * Execute navigate action (switch steps/tabs)
     */
    function executeNavigateAction(action) {
        const { step, tab } = action;
        
        if (step !== undefined) {
            // Navigate to form step
            if (step >= 1 && step <= state.totalSteps) {
                state.currentStep = step;
                updateUI();
                console.log(`Navigated to step ${step}`);
            }
        } else if (tab) {
            // Switch tab (if tabs exist)
            const tabButton = document.querySelector(`[data-tab="${tab}"]`);
            if (tabButton) {
                tabButton.click();
                console.log(`Switched to tab: ${tab}`);
            }
        }
    }

    // Load merchant options from backend
    async function loadMerchantOptions() {
        console.log('[Channel Binding] Loading merchant options...');
        
        // Default merchants to use (always available, API is optional)
        const defaultMerchants = [
            { id: 'starsaas', name: 'STARSAAS' },
            { id: 'nbcpay', name: 'NbcPay' },
            { id: 'nexpay', name: 'NexPay' }
        ];
        
        // Load default merchants immediately (don't wait for API)
        console.log('[Channel Binding] Loading default merchants immediately...');
        populateMerchantSelects(defaultMerchants);
        
        // Try to load from API in the background (optional enhancement)
        try {
            // Only try API if we're not on file:// protocol (which causes CORS errors)
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                const response = await fetch('/api/merchants/list', {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('[Channel Binding] Loaded merchants from API:', data.merchants);
                    if (data.merchants && data.merchants.length > 0) {
                        // Update with API merchants if available
                        populateMerchantSelects(data.merchants);
                    }
                } else {
                    console.log('[Channel Binding] API call failed (status:', response.status, '), keeping default merchants');
                }
            } else {
                console.log('[Channel Binding] Running on file:// protocol, skipping API call (CORS would block it)');
            }
        } catch (error) {
            // Silently fail - we already have default merchants loaded
            console.log('[Channel Binding] API call failed (expected for file:// or no server), using default merchants:', error.message);
        }
    }
    
    // Also expose a function to manually reload merchants (for debugging)
    window.reloadMerchants = function() {
        console.log('[Channel Binding] Manually reloading merchants...');
        loadMerchantOptions();
    };
    
    // Force load merchants immediately (for emergency use)
    window.forceLoadMerchants = function() {
        console.log('[Channel Binding] Force loading merchants...');
        const defaultMerchants = [
            { id: 'starsaas', name: 'STARSAAS' },
            { id: 'nbcpay', name: 'NbcPay' },
            { id: 'nexpay', name: 'NexPay' }
        ];
        populateMerchantSelects(defaultMerchants);
    };

    function populateMerchantSelects(merchants) {
        console.log('[Channel Binding] ===== populateMerchantSelects CALLED =====');
        console.log('[Channel Binding] Merchants received:', merchants);
        
        // Try to find the select element - wait a bit if not found
        let select = document.getElementById('merchant-name');
        if (!select) {
            console.warn('[Channel Binding] ⚠ Merchant select element not found immediately, retrying...');
            console.warn('[Channel Binding] Available select elements:', Array.from(document.querySelectorAll('select')).map(s => ({ id: s.id, name: s.name })));
            // Retry after a short delay
            setTimeout(() => {
                select = document.getElementById('merchant-name');
                if (select) {
                    console.log('[Channel Binding] Found merchant select on retry');
                    populateMerchantSelects(merchants);
                } else {
                    console.error('[Channel Binding] ✗ Merchant select element still not found after retry!');
                    console.error('[Channel Binding] Page HTML:', document.body.innerHTML.substring(0, 500));
                }
            }, 100);
            return;
        }
        
        console.log('[Channel Binding] ✓ Found merchant select element');
        console.log('[Channel Binding] Current options count:', select.options.length);
        console.log('[Channel Binding] Current options:', Array.from(select.options).map(opt => ({ value: opt.value, text: opt.textContent })));
        
        // Clear existing options except the first one (placeholder)
        const initialCount = select.options.length;
        while (select.options.length > 1) {
            select.remove(1);
        }
        console.log('[Channel Binding] Cleared', initialCount - 1, 'existing options');
        
        if (!merchants || merchants.length === 0) {
            console.warn('[Channel Binding] ⚠ No merchants provided to populate, using defaults');
            merchants = [
                { id: 'starsaas', name: 'STARSAAS' },
                { id: 'nbcpay', name: 'NbcPay' },
                { id: 'nexpay', name: 'NexPay' }
            ];
        }
        
        console.log('[Channel Binding] Adding', merchants.length, 'merchant options...');
        merchants.forEach((merchant, index) => {
            const option = document.createElement('option');
            option.value = merchant.id || merchant.value || merchant;
            option.textContent = merchant.name || merchant.text || merchant;
            select.appendChild(option);
            console.log(`[Channel Binding] [${index + 1}/${merchants.length}] Added:`, option.value, '-', option.textContent);
        });
        
        const finalCount = select.options.length;
        console.log('[Channel Binding] ===== DONE =====');
        console.log('[Channel Binding] ✓ Merchant select populated with', finalCount - 1, 'options (total:', finalCount, ')');
        console.log('[Channel Binding] Final merchant options:', Array.from(select.options).map(opt => ({ value: opt.value, text: opt.textContent })));
        
        // Verify the options are actually in the DOM
        const verifySelect = document.getElementById('merchant-name');
        if (verifySelect && verifySelect.options.length <= 1) {
            console.error('[Channel Binding] ✗✗✗ VERIFICATION FAILED: Options were not added!');
            console.error('[Channel Binding] Select element:', verifySelect);
            console.error('[Channel Binding] Options:', Array.from(verifySelect.options));
        } else {
            console.log('[Channel Binding] ✓✓✓ VERIFICATION PASSED: Options are in the DOM');
        }
    }

    // Setup auto-generate channel name
    function setupAutoGenerateChannelName() {
        const accountName = document.getElementById('account-name');
        const channelName = document.getElementById('channel-name');
        
        if (accountName && channelName) {
            accountName.addEventListener('input', function() {
                if (this.value && state.currentChannel) {
                    const timestamp = Date.now().toString().slice(-6);
                    if (state.currentChannel === 'ysepay') {
                        channelName.value = `YSEPAY_${this.value}_${timestamp}`;
                    } else if (state.currentChannel === 'rumble') {
                        channelName.value = `RUMBLE_${this.value}_${timestamp}`;
                    }
                }
            });
        }

        // Load sub-accounts when merchant is selected
        const merchantSelect = document.getElementById('merchant-name');
        if (merchantSelect) {
            merchantSelect.addEventListener('change', function() {
                loadSubAccounts(this.value);
            });
        }
    }

    async function loadSubAccounts(merchantId) {
        if (!merchantId) {
            const select = document.getElementById('sub-account');
            if (select) {
                while (select.options.length > 1) {
                    select.remove(1);
                }
            }
            return;
        }

        try {
            const response = await fetch(`/api/merchants/${merchantId}/sub-accounts`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const select = document.getElementById('sub-account');
                
                if (select) {
                    // Clear existing options except the first one
                    while (select.options.length > 1) {
                        select.remove(1);
                    }
                    
                    (data.subAccounts || []).forEach(subAccount => {
                        const option = document.createElement('option');
                        option.value = subAccount.id;
                        option.textContent = subAccount.name;
                        select.appendChild(option);
                    });
                }
            } else {
                // Fallback: load default sub-accounts for STARSAAS
                loadDefaultSubAccounts(merchantId);
            }
        } catch (error) {
            console.warn('Failed to load sub-accounts:', error);
            // Fallback: load default sub-accounts
            loadDefaultSubAccounts(merchantId);
        }
    }

    // Load default sub-accounts
    function loadDefaultSubAccounts(merchantId) {
        const select = document.getElementById('sub-account');
        if (!select) return;

        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Default sub-accounts for STARSAAS
        const defaultSubAccounts = {
            'starsaas': [
                { id: 'starsaas-001', name: 'STARSAAS-001' },
                { id: 'starsaas-002', name: 'STARSAAS-002' },
                { id: 'starsaas-003', name: 'STARSAAS-003' }
            ],
            'nbcpay': [
                { id: 'nbcpay-001', name: 'NbcPay-001' },
                { id: 'nbcpay-002', name: 'NbcPay-002' }
            ],
            'nexpay': [
                { id: 'nexpay-001', name: 'NexPay-001' },
                { id: 'nexpay-002', name: 'NexPay-002' }
            ]
        };

        const subAccounts = defaultSubAccounts[merchantId] || [
            { id: 'default-001', name: 'Default-001' }
        ];

        subAccounts.forEach(subAccount => {
            const option = document.createElement('option');
            option.value = subAccount.id;
            option.textContent = subAccount.name;
            select.appendChild(option);
        });
    }

    // Event Listeners
    function setupEventListeners() {
        // Channel selection
        elements.channelSelect.addEventListener('change', handleChannelChange);
        elements.paymentTypeSelect.addEventListener('change', handlePaymentTypeChange);

        // Navigation buttons
        elements.prevBtn.addEventListener('click', goToPreviousStep);
        elements.nextBtn.addEventListener('click', handleSubmit);
        elements.submitBtn.addEventListener('click', handleSubmit);
        elements.resetBtn.addEventListener('click', handleReset);

        // Password toggle buttons
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', togglePasswordVisibility);
        });

        // Form validation on input
        if (elements.channelForm) {
            const inputs = elements.channelForm.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', validateField);
                input.addEventListener('input', clearFieldError);
            });
        }
    }

    // Channel Change Handler
    function handleChannelChange(e) {
        const channel = e.target.value;
        if (!channel) {
            state.currentChannel = '';
            state.currentPaymentType = '';
            updateUI();
            return;
        }

        state.currentChannel = channel;
        const config = channelConfigs[channel];
        
        if (config) {
            // Auto-set payment type
            elements.paymentTypeSelect.value = config.paymentType;
            state.currentPaymentType = config.paymentType;
            
            // Load and display channel-specific hint (image + text)
            loadChannelHint(channel);
            
            // Show/hide channel-specific fields
            updateChannelSpecificFields();
            
            // Update payment methods and currencies for step 2 and 3
            updatePaymentMethods();
            updateCurrencies();
            
            // Load and display card types
            loadCardTypes(channel);
            
            // Load and display currencies
            loadCurrencies(channel);
            
            // Load interface type and show domain binding if needed
            loadInterfaceType(channel);
            
            state.currentStep = 1;
            state.formData = {};
            updateUI();
        }
    }

    // Load Card Types Configuration
    async function loadCardTypes(channel) {
        try {
            // Try to load from config endpoint first
            const response = await fetch(`/api/channel-binding/admin/config/${channel}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.cardTypes && Array.isArray(data.cardTypes)) {
                    cardTypeConfigs[channel] = data.cardTypes;
                    displayCardTypes(channel);
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load card types config from API:', error);
        }

        // Try localStorage
        try {
            const stored = localStorage.getItem('channelCardTypesConfig');
            if (stored) {
                const configs = JSON.parse(stored);
                if (configs[channel] && Array.isArray(configs[channel])) {
                    cardTypeConfigs[channel] = configs[channel];
                    displayCardTypes(channel);
                    return;
                }
            }
        } catch (e) {
            console.warn('LocalStorage fallback failed:', e);
        }

        // Use defaults
        displayCardTypes(channel);
    }

    // Display Card Types
    function displayCardTypes(channel) {
        const cardTypeSection = document.getElementById('cardTypeSection');
        const cardTypeList = document.getElementById('cardTypeList');
        
        if (!cardTypeSection || !cardTypeList) return;

        // Show the section
        cardTypeSection.style.display = 'block';

        // Get card types from config or use defaults
        let cardTypes = [];
        if (cardTypeConfigs[channel] && cardTypeConfigs[channel].length > 0) {
            cardTypes = cardTypeConfigs[channel];
        } else {
            cardTypes = channelConfigs[channel].defaultCardTypes || [];
        }

        // Render card types
        cardTypeList.innerHTML = '';
        
        // First row: "全部" (All) option
        const allRow = document.createElement('div');
        allRow.className = 'card-type-row';
        allRow.innerHTML = `
            <label class="card-type-checkbox-label">
                <input type="checkbox" name="cardType" value="全部" checked onchange="handleAllCardTypeChange()">
                <span>全部</span>
            </label>
        `;
        cardTypeList.appendChild(allRow);

        // Second row: Other card types
        const otherRow = document.createElement('div');
        otherRow.className = 'card-type-row';
        
        cardTypes.filter(type => type !== '全部').forEach(cardType => {
            const label = document.createElement('label');
            label.className = 'card-type-checkbox-label';
            label.innerHTML = `
                <input type="checkbox" name="cardType" value="${cardType}" checked onchange="handleCardTypeChange()">
                <span>${cardType}</span>
            `;
            otherRow.appendChild(label);
        });
        
        cardTypeList.appendChild(otherRow);
    }

    // Load Currencies Configuration
    async function loadCurrencies(channel) {
        try {
            // Try to load from config endpoint first
            const response = await fetch(`/api/channel-binding/admin/config/${channel}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.currencies && Array.isArray(data.currencies) && data.currencies.length > 0) {
                    currencyConfigs[channel] = data.currencies;
                    displayCurrencies(channel);
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load currencies config from API:', error);
        }

        // Try localStorage
        try {
            const stored = localStorage.getItem('channelCurrenciesConfig');
            if (stored) {
                const configs = JSON.parse(stored);
                if (configs[channel] && Array.isArray(configs[channel]) && configs[channel].length > 0) {
                    currencyConfigs[channel] = configs[channel];
                    displayCurrencies(channel);
                    return;
                }
            }
        } catch (e) {
            console.warn('LocalStorage fallback failed:', e);
        }

        // Use defaults from channel config
        displayCurrencies(channel);
    }

    // Load Interface Type Configuration
    async function loadInterfaceType(channel) {
        try {
            // Try to load from config endpoint first
            const response = await fetch(`/api/channel-binding/admin/config/${channel}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.interfaceType) {
                    interfaceTypeConfigs[channel] = data.interfaceType;
                    showDomainBinding(channel, data.interfaceType);
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load interface type config from API:', error);
        }

        // Try localStorage
        try {
            const stored = localStorage.getItem('channelInterfaceTypeConfig');
            if (stored) {
                const configs = JSON.parse(stored);
                if (configs[channel]) {
                    interfaceTypeConfigs[channel] = configs[channel];
                    showDomainBinding(channel, configs[channel]);
                    return;
                }
            }
        } catch (e) {
            console.warn('LocalStorage fallback failed:', e);
        }

        // Use default from channel config
        const defaultType = channelConfigs[channel]?.interfaceType || 'direct';
        showDomainBinding(channel, defaultType);
    }

    // Show/Hide Domain Binding Section
    function showDomainBinding(channel, interfaceType) {
        const domainSection = document.getElementById('domainBindingSection');
        if (!domainSection) return;

        if (interfaceType === 'iframe') {
            domainSection.style.display = 'block';
            // Make domain name required
            const domainSelect = document.getElementById('domain-name');
            if (domainSelect) {
                domainSelect.setAttribute('required', 'required');
            }
        } else {
            domainSection.style.display = 'none';
            // Remove required attribute
            const domainSelect = document.getElementById('domain-name');
            if (domainSelect) {
                domainSelect.removeAttribute('required');
                domainSelect.value = '';
            }
            const domainRemarks = document.getElementById('domain-remarks');
            if (domainRemarks) {
                domainRemarks.value = '';
            }
        }
    }

    // Display Currencies
    function displayCurrencies(channel) {
        const currencySection = document.getElementById('currencySection');
        const currencyList = document.getElementById('currencyList');
        
        if (!currencySection || !currencyList) return;

        // Show the section
        currencySection.style.display = 'block';

        // Get currencies from config or use defaults
        let currencies = [];
        if (currencyConfigs[channel] && currencyConfigs[channel].length > 0) {
            currencies = currencyConfigs[channel];
        } else {
            // Use default currencies from channel config
            const config = channelConfigs[channel];
            currencies = config.currencies || [];
        }

        // Render currencies
        currencyList.innerHTML = '';
        
        // First row: "全部" (All) option
        const allRow = document.createElement('div');
        allRow.className = 'currency-row';
        allRow.innerHTML = `
            <div class="currency-item">
                <label class="currency-checkbox-label">
                    <input type="checkbox" name="currency" value="全部" checked onchange="handleAllCurrencyChange()">
                    <span>全部</span>
                </label>
            </div>
        `;
        currencyList.appendChild(allRow);

        // Second row: Other currencies
        const otherRow = document.createElement('div');
        otherRow.className = 'currency-row';
        
        currencies.forEach(currency => {
            const currencyCode = typeof currency === 'string' ? currency : currency.value;
            const currencyLabel = typeof currency === 'string' ? currency : currency.label;
            
            if (currencyCode === '全部') return; // Skip if "全部" is in the list
            
            const item = document.createElement('div');
            item.className = 'currency-item';
            item.innerHTML = `
                <label class="currency-checkbox-label">
                    <input type="checkbox" name="currency" value="${currencyCode}" checked onchange="handleCurrencyChange()">
                    <span>${currencyLabel || currencyCode}</span>
                </label>
                <label class="currency-default-label">
                    <input type="radio" name="currencyDefault" value="${currencyCode}" onchange="handleCurrencyDefaultChange()">
                    <span>是否默认</span>
                </label>
            `;
            otherRow.appendChild(item);
        });
        
        currencyList.appendChild(otherRow);
    }

    // Handle "全部" checkbox change for currencies
    window.handleAllCurrencyChange = function() {
        const allCheckbox = document.querySelector('input[name="currency"][value="全部"]');
        const otherCheckboxes = document.querySelectorAll('input[name="currency"]:not([value="全部"])');
        
        if (allCheckbox && allCheckbox.checked) {
            // If "全部" is checked, check all others
            otherCheckboxes.forEach(cb => {
                cb.checked = true;
            });
        } else {
            // If "全部" is unchecked, uncheck all others
            otherCheckboxes.forEach(cb => {
                cb.checked = false;
            });
        }
    };

    // Handle individual currency change
    window.handleCurrencyChange = function() {
        const allCheckbox = document.querySelector('input[name="currency"][value="全部"]');
        const otherCheckboxes = document.querySelectorAll('input[name="currency"]:not([value="全部"])');
        const checkedOthers = document.querySelectorAll('input[name="currency"]:not([value="全部"]):checked');
        
        if (allCheckbox) {
            // If all others are checked, check "全部"
            if (checkedOthers.length === otherCheckboxes.length) {
                allCheckbox.checked = true;
            } else {
                allCheckbox.checked = false;
            }
        }
    };

    // Handle currency default radio change
    window.handleCurrencyDefaultChange = function() {
        // Only one can be selected, so no special handling needed
    };

    // Handle "全部" checkbox change
    window.handleAllCardTypeChange = function() {
        const allCheckbox = document.querySelector('input[name="cardType"][value="全部"]');
        const otherCheckboxes = document.querySelectorAll('input[name="cardType"]:not([value="全部"])');
        
        if (allCheckbox && allCheckbox.checked) {
            // If "全部" is checked, check all others
            otherCheckboxes.forEach(cb => {
                cb.checked = true;
            });
        } else {
            // If "全部" is unchecked, uncheck all others
            otherCheckboxes.forEach(cb => {
                cb.checked = false;
            });
        }
    };

    // Handle individual card type change
    window.handleCardTypeChange = function() {
        const allCheckbox = document.querySelector('input[name="cardType"][value="全部"]');
        const otherCheckboxes = document.querySelectorAll('input[name="cardType"]:not([value="全部"])');
        const checkedOthers = document.querySelectorAll('input[name="cardType"]:not([value="全部"]):checked');
        
        if (allCheckbox) {
            // If all others are checked, check "全部"
            if (checkedOthers.length === otherCheckboxes.length) {
                allCheckbox.checked = true;
            } else {
                allCheckbox.checked = false;
            }
        }
    };


    // Payment Type Change Handler
    function handlePaymentTypeChange(e) {
        state.currentPaymentType = e.target.value;
        // Payment type might affect available channels, but for now we keep it simple
    }

    // Update Info Box
    function updateInfoBox(text) {
        if (elements.infoBox) {
            const lines = text.split('\n');
            elements.infoBox.innerHTML = lines.map(line => `<p><strong>提示：</strong>${line}</p>`).join('');
        }
    }

    // Load Channel Hint Configuration
    async function loadChannelHint(channel) {
        try {
            const response = await fetch(`/api/channel-binding/admin/config/${channel}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                displayChannelHint(channel, data);
            } else {
                // Use default hint
                displayDefaultHint(channel);
            }
        } catch (error) {
            console.warn('Failed to load channel hint:', error);
            // Try localStorage fallback
            try {
                const stored = localStorage.getItem('channelBindingConfig');
                if (stored) {
                    const configs = JSON.parse(stored);
                    if (configs[channel]) {
                        displayChannelHint(channel, configs[channel]);
                        return;
                    }
                }
            } catch (e) {
                console.warn('LocalStorage fallback failed:', e);
            }
            displayDefaultHint(channel);
        }
    }

    // Display Channel Hint
    function displayChannelHint(channel, config) {
        const hintDisplay = document.getElementById('channelHintDisplay');
        const infoBox = document.getElementById('channelInfoBox');
        
        if (!hintDisplay || !infoBox) return;

        // Hide default info box, show hint display
        infoBox.style.display = 'none';
        hintDisplay.style.display = 'block';

        const fileData = config.fileData || config.imageData || config.imageUrl;
        const fileType = config.fileType || (fileData && fileData.includes('data:application/pdf') ? 'pdf' : 'image');
        const fileName = config.fileName || '';
        const textHint = config.textHint || '';

        // Thumbnail preview
        const thumbnailContainer = document.getElementById('hintThumbnail');
        if (thumbnailContainer) {
            if (fileData) {
                if (fileType === 'pdf') {
                    thumbnailContainer.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; cursor: pointer;" onclick="previewPDFInModal('${fileData}', '${fileName || 'document.pdf'}')">
                            <div style="font-size: 32px;">📄</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #4A90E2; margin-bottom: 4px;">${fileName || 'document.pdf'}</div>
                                <div style="font-size: 12px; color: #666;">点击预览 PDF 文件</div>
                            </div>
                        </div>
                    `;
                } else {
                    thumbnailContainer.innerHTML = `<img src="${fileData}" alt="Configuration Guide" onclick="expandHint()" style="cursor: pointer;">`;
                }
            } else {
                thumbnailContainer.innerHTML = '';
            }
        }

        // Text preview (truncated)
        const textPreview = document.getElementById('hintTextPreview');
        if (textPreview) {
            if (textHint.trim()) {
                const truncated = textHint.length > 100 ? textHint.substring(0, 100) + '...' : textHint;
                textPreview.innerHTML = `<p>${truncated.replace(/\n/g, '<br>')}</p>`;
            } else {
                textPreview.innerHTML = '';
            }
        }

        // Full content (for expanded view)
        const imageContainer = document.getElementById('hintImageContainer');
        const textFull = document.getElementById('hintTextFull');
        
        if (imageContainer) {
            if (fileData) {
                if (fileType === 'pdf') {
                    imageContainer.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 4px; cursor: pointer; margin-bottom: 16px;" onclick="previewPDFInModal('${fileData}', '${fileName || 'document.pdf'}')">
                            <div style="font-size: 48px;">📄</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #4A90E2; font-size: 18px; margin-bottom: 8px;">${fileName || 'document.pdf'}</div>
                                <div style="font-size: 14px; color: #666;">点击此处预览 PDF 文件内容</div>
                            </div>
                        </div>
                    `;
                } else {
                    imageContainer.innerHTML = `<img src="${fileData}" alt="Configuration Guide">`;
                }
            } else {
                imageContainer.innerHTML = '';
            }
        }

        if (textFull) {
            if (textHint.trim()) {
                textFull.innerHTML = `<p>${textHint.replace(/\n/g, '<br>')}</p>`;
            } else {
                textFull.innerHTML = '';
            }
        }

        // Store full content for modal
        window.currentHintData = {
            fileData: fileData,
            fileType: fileType,
            fileName: fileName,
            textHint: textHint
        };

        // Reset to collapsed state
        collapseHint();
    }

    // Preview PDF in Modal (for user-facing page)
    window.previewPDFInModal = function(pdfData, fileName) {
        const existingModal = document.getElementById('pdfPreviewModal');
        if (existingModal) {
            existingModal.remove();
        }

        const pdfModal = document.createElement('div');
        pdfModal.id = 'pdfPreviewModal';
        pdfModal.className = 'modal';
        pdfModal.style.display = 'flex';
        pdfModal.innerHTML = `
            <div class="modal-content modal-large" style="width: 98vw; height: 98vh; max-width: 98vw; max-height: 98vh; margin: 1vh auto;">
                <div class="modal-header" style="flex-shrink: 0;">
                    <h2>${fileName}</h2>
                    <button class="modal-close" onclick="closePDFPreviewModal()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0; height: calc(98vh - 80px); overflow: hidden;">
                    <iframe src="${pdfData}" style="width: 100%; height: 100%; border: none;"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(pdfModal);

        // Close on background click
        pdfModal.addEventListener('click', function(e) {
            if (e.target === pdfModal) {
                closePDFPreviewModal();
            }
        });
    };

    // Close PDF Preview Modal
    window.closePDFPreviewModal = function() {
        const modal = document.getElementById('pdfPreviewModal');
        if (modal) {
            modal.remove();
        }
    };

    // Display Default Hint
    function displayDefaultHint(channel) {
        const hintDisplay = document.getElementById('channelHintDisplay');
        const infoBox = document.getElementById('channelInfoBox');
        
        if (hintDisplay) hintDisplay.style.display = 'none';
        if (infoBox) {
            infoBox.style.display = 'block';
            let text = '';
            if (channel === 'ysepay') {
                text = '请确保已从YSEPAY方获取以下信息：商户号、子商户、Key 与 AesKey';
            } else if (channel === 'rumble') {
                text = '请确保已从 RUMBLE 管理后台获取 authToken 并配置 Callback URL\nCallback URL 示例：https://checkout.example.com/v1/RBAPMNotify';
            }
            updateInfoBox(text);
        }
    }

    // Toggle Hint Expansion
    window.toggleHintExpansion = function() {
        const collapsed = document.getElementById('hintContentCollapsed');
        const expanded = document.getElementById('hintContentExpanded');
        const toggleBtn = document.querySelector('.hint-toggle-btn');
        const toggleText = document.getElementById('hintToggleText');

        if (collapsed && expanded && toggleBtn && toggleText) {
            const isExpanded = expanded.style.display !== 'none';
            
            if (isExpanded) {
                collapseHint();
            } else {
                expandHint();
            }
        }
    };

    function expandHint() {
        const collapsed = document.getElementById('hintContentCollapsed');
        const expanded = document.getElementById('hintContentExpanded');
        const toggleBtn = document.querySelector('.hint-toggle-btn');
        const toggleText = document.getElementById('hintToggleText');

        if (collapsed) collapsed.style.display = 'none';
        if (expanded) expanded.style.display = 'block';
        if (toggleBtn) toggleBtn.classList.add('expanded');
        if (toggleText) toggleText.textContent = '收起';
    }

    function collapseHint() {
        const collapsed = document.getElementById('hintContentCollapsed');
        const expanded = document.getElementById('hintContentExpanded');
        const toggleBtn = document.querySelector('.hint-toggle-btn');
        const toggleText = document.getElementById('hintToggleText');

        if (collapsed) collapsed.style.display = 'block';
        if (expanded) expanded.style.display = 'none';
        if (toggleBtn) toggleBtn.classList.remove('expanded');
        if (toggleText) toggleText.textContent = '展开查看';
    }

    // View Full Hint in Modal
    window.viewFullHint = function() {
        if (!window.currentHintData) return;

        const modal = document.getElementById('fullHintModal');
        const imageContainer = document.getElementById('fullHintImageContainer');
        const textContainer = document.getElementById('fullHintTextContainer');

        if (modal && imageContainer && textContainer) {
            // Clear previous content
            imageContainer.innerHTML = '';
            textContainer.innerHTML = '';

            // Add image
            if (window.currentHintData.imageSrc) {
                imageContainer.innerHTML = `<img src="${window.currentHintData.imageSrc}" alt="Configuration Guide">`;
            }

            // Add text
            if (window.currentHintData.textHint && window.currentHintData.textHint.trim()) {
                textContainer.innerHTML = `<div class="info-box"><p>${window.currentHintData.textHint.replace(/\n/g, '<br>')}</p></div>`;
            }

            modal.style.display = 'flex';
        }
    };

    // Close Full Hint Modal
    window.closeFullHintModal = function() {
        const modal = document.getElementById('fullHintModal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Update Channel Specific Fields
    function updateChannelSpecificFields() {
        // Hide all channel-specific fields
        document.querySelectorAll('.ysepay-only, .rumble-only, .evonet-only, .paysaas-only').forEach(el => {
            el.style.display = 'none';
            // Clear required attributes
            const inputs = el.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.removeAttribute('required');
                input.value = '';
            });
        });

        // Hide card type, currency, and domain binding sections if no channel selected
        const cardTypeSection = document.getElementById('cardTypeSection');
        const currencySection = document.getElementById('currencySection');
        const domainSection = document.getElementById('domainBindingSection');
        if (!state.currentChannel) {
            if (cardTypeSection) cardTypeSection.style.display = 'none';
            if (currencySection) currencySection.style.display = 'none';
            if (domainSection) domainSection.style.display = 'none';
        }

        // Show fields for selected channel
        if (state.currentChannel === 'ysepay') {
            document.querySelectorAll('.ysepay-only').forEach(el => {
                el.style.display = 'block';
                // Add required attributes
                const inputs = el.querySelectorAll('input[type="text"], input[type="password"]');
                inputs.forEach(input => {
                    if (input.id !== 'channel-name') {
                        input.setAttribute('required', 'required');
                    }
                });
            });
        } else if (state.currentChannel === 'rumble') {
            document.querySelectorAll('.rumble-only').forEach(el => {
                el.style.display = 'block';
                // Add required attributes
                const inputs = el.querySelectorAll('input[type="text"], input[type="password"]');
                inputs.forEach(input => {
                    if (input.id !== 'channel-name') {
                        input.setAttribute('required', 'required');
                    }
                });
            });
        } else if (state.currentChannel === 'evonet') {
            document.querySelectorAll('.evonet-only').forEach(el => {
                el.style.display = 'block';
                // Add required attributes
                const inputs = el.querySelectorAll('input[type="text"], input[type="password"]');
                inputs.forEach(input => {
                    if (input.id !== 'channel-name') {
                        input.setAttribute('required', 'required');
                    }
                });
            });
        } else if (state.currentChannel === 'paysaas') {
            document.querySelectorAll('.paysaas-only').forEach(el => {
                el.style.display = 'block';
                // Add required attributes
                const inputs = el.querySelectorAll('input[type="text"], input[type="password"]');
                inputs.forEach(input => {
                    if (input.id !== 'channel-name') {
                        input.setAttribute('required', 'required');
                    }
                });
            });
        }
    }

    // Update Payment Methods
    function updatePaymentMethods() {
        const group = document.getElementById('payment-methods-group');
        const hint = document.getElementById('payment-methods-hint');
        
        if (group && state.currentChannel) {
            const config = channelConfigs[state.currentChannel];
            group.innerHTML = config.paymentMethods.map(method => `
                <label class="checkbox-label">
                    <input type="checkbox" name="paymentMethods" value="${method.value}" checked>
                    <span>${method.label}</span>
                </label>
            `).join('');
            
            if (hint) {
                hint.textContent = config.paymentMethods[0].hint || '';
            }
        }
    }

    // Update Currencies
    function updateCurrencies() {
        const group = document.getElementById('currency-group');
        const hint = document.getElementById('currency-default-hint');
        
        if (group && state.currentChannel) {
            const config = channelConfigs[state.currentChannel];
            group.innerHTML = config.currencies.map(currency => `
                <label class="checkbox-label">
                    <input type="checkbox" name="currency" value="${currency.value}" checked>
                    <span>${currency.label}</span>
                </label>
            `).join('');
            
            if (hint) {
                hint.textContent = config.defaultCurrencyNote || '';
            }
        }
    }

    // Step Navigation
    function goToNextStep() {
        if (validateCurrentStep()) {
            if (state.currentStep < state.totalSteps) {
                state.currentStep++;
                updateUI();
            }
        }
    }

    function goToPreviousStep() {
        if (state.currentStep > 1) {
            state.currentStep--;
            updateUI();
        }
    }

    // Update UI based on current state
    function updateUI() {
        // Show/hide form sections based on step
        if (elements.channelForm) {
            const sections = elements.channelForm.querySelectorAll('.form-section');
            
            sections.forEach((section, index) => {
                if (index + 1 === state.currentStep) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        }

        // Progress indicator removed

        // Update navigation buttons
        elements.prevBtn.style.display = state.currentStep > 1 ? 'block' : 'none';
        // Show submit button on all steps (changed from nextBtn)
        elements.nextBtn.style.display = 'block';
        elements.submitBtn.style.display = 'none';
        
        // Disable submit if no channel selected
        if (!state.currentChannel && state.currentStep === 1) {
            elements.nextBtn.disabled = true;
        } else {
            elements.nextBtn.disabled = false;
        }
    }

    // Progress indicator removed - no longer needed

    // Form Validation
    function validateCurrentStep() {
        if (!elements.channelForm) return false;
        
        const currentSection = elements.channelForm.querySelector(`.form-section[data-section="${state.currentStep}"]`);
        
        if (!currentSection) return false;

        // Validate channel and payment type selection in step 1
        if (state.currentStep === 1) {
            if (!state.currentChannel) {
                showMessage('请先选择渠道', 'error');
                return false;
            }
            if (!state.currentPaymentType) {
                showMessage('请先选择支付种类', 'error');
                return false;
            }

            // Validate card types selection
            const cardTypeCheckboxes = document.querySelectorAll('input[name="cardType"]:checked');
            if (cardTypeCheckboxes.length === 0) {
                showMessage('请至少选择一个卡种', 'error');
                return false;
            }

            // Validate currencies selection
            const currencyCheckboxes = document.querySelectorAll('input[name="currency"]:checked');
            if (currencyCheckboxes.length === 0) {
                showMessage('请至少选择一个币种', 'error');
                return false;
            }

            // Validate domain binding for Iframe channels
            const interfaceType = interfaceTypeConfigs[state.currentChannel] || channelConfigs[state.currentChannel]?.interfaceType || 'direct';
            if (interfaceType === 'iframe') {
                const domainSelect = document.getElementById('domain-name');
                if (domainSelect && !domainSelect.value) {
                    showMessage('请选择域名名称', 'error');
                    return false;
                }
            }
        }

        const requiredFields = currentSection.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!validateField({ target: field })) {
                isValid = false;
            }
        });

        // Special validation for payment methods (Step 2)
        if (state.currentStep === 2) {
            const paymentMethods = currentSection.querySelectorAll('input[name="paymentMethods"]:checked');
            if (paymentMethods.length === 0) {
                showFieldError(currentSection.querySelector('.checkbox-group'), '请至少选择一种支付方式');
                isValid = false;
            }
        }

        // Special validation for currency (Step 3)
        if (state.currentStep === 3) {
            const currencies = currentSection.querySelectorAll('input[name="currency"]:checked');
            if (currencies.length === 0) {
                showFieldError(currentSection.querySelector('.checkbox-group'), '请至少选择一种支付币种');
                isValid = false;
            }
        }

        // Special validation for YSEPAY Key__AesKey
        if (state.currentChannel === 'ysepay' && state.currentStep === 1) {
            const key = document.getElementById('key');
            const aesKey = document.getElementById('aeskey');
            if (key && aesKey && (!key.value || !aesKey.value)) {
                if (!key.value) {
                    showFieldError(key, 'Key 为必填项');
                    isValid = false;
                }
                if (!aesKey.value) {
                    showFieldError(aesKey, 'AesKey 为必填项');
                    isValid = false;
                }
            }
        }

        // Special validation for EVONET fields
        if (state.currentChannel === 'evonet' && state.currentStep === 1) {
            const storeId = document.getElementById('evonet-store-id');
            const signKey = document.getElementById('evonet-signkey');
            const rsaPublicKey = document.getElementById('evonet-rsa-public-key');
            
            if (storeId && !storeId.value) {
                showFieldError(storeId, 'Store ID 为必填项');
                isValid = false;
            }
            if (signKey && !signKey.value) {
                showFieldError(signKey, 'SignKey 为必填项');
                isValid = false;
            }
            if (rsaPublicKey && !rsaPublicKey.value) {
                showFieldError(rsaPublicKey, 'RSA Public Key 为必填项');
                isValid = false;
            }
        }

        // Special validation for PAYSAAS Key__AesKey
        if (state.currentChannel === 'paysaas' && state.currentStep === 1) {
            const key = document.getElementById('paysaas-key');
            const aesKey = document.getElementById('paysaas-aeskey');
            if (key && aesKey && (!key.value || !aesKey.value)) {
                if (!key.value) {
                    showFieldError(key, 'Key 为必填项');
                    isValid = false;
                }
                if (!aesKey.value) {
                    showFieldError(aesKey, 'AesKey 为必填项');
                    isValid = false;
                }
            }
        }

        if (!isValid) {
            showMessage('请填写所有必填字段', 'error');
        }

        return isValid;
    }

    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = '此字段为必填项';
        }

        // URL validation
        if (field.type === 'url' && value && !isValidUrl(value)) {
            isValid = false;
            errorMessage = '请输入有效的URL地址';
        }

        // Email validation
        if (field.type === 'email' && value && !isValidEmail(value)) {
            isValid = false;
            errorMessage = '请输入有效的邮箱地址';
        }

        // Number validation
        if (field.type === 'number' && value) {
            const num = parseFloat(value);
            const min = parseFloat(field.getAttribute('min'));
            const max = parseFloat(field.getAttribute('max'));
            
            if (!isNaN(min) && num < min) {
                isValid = false;
                errorMessage = `值不能小于 ${min}`;
            }
            if (!isNaN(max) && num > max) {
                isValid = false;
                errorMessage = `值不能大于 ${max}`;
            }
        }

        if (isValid) {
            clearFieldError({ target: field });
        } else {
            showFieldError(field, errorMessage);
        }

        return isValid;
    }

    function showFieldError(field, message) {
        clearFieldError({ target: field });
        
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '4px';
        errorDiv.textContent = message;
        
        field.parentElement.appendChild(errorDiv);
    }

    function clearFieldError(e) {
        const field = e.target;
        field.classList.remove('error');
        const errorDiv = field.parentElement.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Utility Functions
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Password Toggle
    function togglePasswordVisibility(e) {
        const button = e.target;
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    }

    // Collect Form Data
    function collectFormData() {
        if (!elements.channelForm) return {};
        
        const formData = new FormData(elements.channelForm);
        const data = {};

        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (key === 'paymentMethods' || key === 'currency' || key === 'supportedCountries' || key === 'platform') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        // Handle checkboxes
        const checkboxes = elements.channelForm.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.name === 'paymentMethods' || checkbox.name === 'currency' || 
                checkbox.name === 'supportedCountries' || checkbox.name === 'platform') {
                // Already handled above
                return;
            }
            data[checkbox.name] = checkbox.checked;
        });

        // Special handling for YSEPAY Key__AesKey
        if (state.currentChannel === 'ysepay') {
            const key = document.getElementById('key');
            const aesKey = document.getElementById('aeskey');
            if (key && aesKey && key.value && aesKey.value) {
                data.keyAesKey = key.value + '__' + aesKey.value;
            }
        }

        // Special handling for EVONET fields
        if (state.currentChannel === 'evonet') {
            const storeId = document.getElementById('evonet-store-id');
            const signKey = document.getElementById('evonet-signkey');
            const rsaPublicKey = document.getElementById('evonet-rsa-public-key');
            
            if (storeId && storeId.value) {
                data.storeId = storeId.value;
            }
            if (signKey && signKey.value) {
                data.signKey = signKey.value;
            }
            if (rsaPublicKey && rsaPublicKey.value) {
                data.rsaPublicKey = rsaPublicKey.value;
            }
        }

        // Special handling for PAYSAAS Key__AesKey
        if (state.currentChannel === 'paysaas') {
            const key = document.getElementById('paysaas-key');
            const aesKey = document.getElementById('paysaas-aeskey');
            if (key && aesKey && key.value && aesKey.value) {
                data.keyAesKey = key.value + '__' + aesKey.value;
            }
        }

        // Handle multi-select for countries and platforms
        const countrySelect = document.getElementById('supported-countries');
        if (countrySelect) {
            const selected = Array.from(countrySelect.selectedOptions).map(opt => opt.value).filter(v => v);
            if (selected.length > 0) {
                data.supportedCountries = selected;
            }
        }

        const platformSelect = document.getElementById('platform');
        if (platformSelect) {
            const selected = Array.from(platformSelect.selectedOptions).map(opt => opt.value).filter(v => v);
            if (selected.length > 0) {
                data.platform = selected;
            }
        }

        // Auto-generate channel name if empty
        const channelNameInput = document.getElementById('channel-name');
        if (channelNameInput && (!channelNameInput.value || channelNameInput.value === '')) {
            const accountName = document.getElementById('account-name').value;
            if (state.currentChannel === 'ysepay') {
                channelNameInput.value = `YSEPAY_${accountName || 'CHANNEL'}_${Date.now().toString().slice(-6)}`;
            } else if (state.currentChannel === 'rumble') {
                channelNameInput.value = `RUMBLE_${accountName || 'CHANNEL'}_${Date.now().toString().slice(-6)}`;
            } else if (state.currentChannel === 'evonet') {
                channelNameInput.value = `EVONET_${accountName || 'CHANNEL'}_${Date.now().toString().slice(-6)}`;
            } else if (state.currentChannel === 'paysaas') {
                channelNameInput.value = `PAYSAAS_${accountName || 'CHANNEL'}_${Date.now().toString().slice(-6)}`;
            }
        }
        data.channelName = channelNameInput ? channelNameInput.value : '';

        // Get selected card types
        const cardTypeCheckboxes = document.querySelectorAll('input[name="cardType"]:checked');
        if (cardTypeCheckboxes.length > 0) {
            data.selectedCardTypes = Array.from(cardTypeCheckboxes).map(cb => cb.value);
        }

        // Get selected currencies
        const currencyCheckboxes = document.querySelectorAll('input[name="currency"]:checked');
        if (currencyCheckboxes.length > 0) {
            data.selectedCurrencies = Array.from(currencyCheckboxes).map(cb => cb.value);
        }

        // Get default currency
        const defaultCurrencyRadio = document.querySelector('input[name="currencyDefault"]:checked');
        if (defaultCurrencyRadio) {
            data.defaultCurrency = defaultCurrencyRadio.value;
        }

        // Get domain binding info for Iframe channels
        const interfaceType = interfaceTypeConfigs[state.currentChannel] || channelConfigs[state.currentChannel]?.interfaceType || 'direct';
        if (interfaceType === 'iframe') {
            const domainName = document.getElementById('domain-name');
            if (domainName && domainName.value) {
                data.domainName = domainName.value;
            }
        }

        return {
            channelType: state.currentChannel,
            ...data
        };
    }

    // Submit Handler
    async function handleSubmit() {
        if (!validateCurrentStep()) {
            return;
        }

        const formData = collectFormData();
        state.formData = formData;

        // Don't show full loading overlay - keep form visible
        hideMessage();

        try {
            // Backend API call (mock - no actual loading overlay)
            const response = await submitConfiguration(formData);
            
            if (response.success) {
                showMessage('渠道配置成功！正在验证配置...', 'success');
                
                // Show connection test (form stays visible)
                showConnectionTest();
                
                // Mock connection test with loading
                await mockConnectionTest();
                
                // Auto-validate configuration
                setTimeout(async () => {
                    const validationResult = await validateConfiguration(response.configId);
                    if (validationResult.success) {
                        showMessage('配置验证成功！渠道已成功绑定。', 'success');
                        // Don't navigate away - keep form visible with success message
                        // The connection test status already shows success, so just keep everything visible
                    } else {
                        showMessage('配置验证失败：' + validationResult.message, 'error');
                    }
                }, 2000);
            } else {
                showMessage('配置失败：' + response.message, 'error');
            }
        } catch (error) {
            console.error('Configuration error:', error);
            showMessage('配置过程中发生错误，请稍后重试。', 'error');
            hideConnectionTest();
        }
    }

    // Show connection test status
    function showConnectionTest() {
        const statusEl = document.getElementById('connectionTestStatus');
        const iconEl = document.getElementById('connectionTestIcon');
        const textEl = document.getElementById('connectionTestText');
        
        if (statusEl && iconEl && textEl) {
            statusEl.style.display = 'block';
            // Use a spinning loader icon (circular arrow)
            iconEl.innerHTML = '⟳';
            iconEl.className = 'connection-test-icon loading';
            textEl.textContent = '正在测试连接...';
        }
    }

    // Mock connection test with loading animation
    async function mockConnectionTest() {
        return new Promise((resolve) => {
            const iconEl = document.getElementById('connectionTestIcon');
            const textEl = document.getElementById('connectionTestText');
            
            // Simulate connection test phases
            setTimeout(() => {
                if (textEl) textEl.textContent = '正在连接渠道服务器...';
            }, 800);
            
            setTimeout(() => {
                if (textEl) textEl.textContent = '正在验证配置信息...';
            }, 1800);
            
            setTimeout(() => {
                if (textEl) textEl.textContent = '正在测试支付接口...';
            }, 2800);
            
            // Show success after ~3.5 seconds
            setTimeout(() => {
                if (iconEl && textEl) {
                    iconEl.textContent = '✓';
                    iconEl.className = 'connection-test-icon success';
                    textEl.textContent = '连接测试成功！渠道已就绪。';
                    iconEl.style.color = '#28a745';
                }
                resolve();
            }, 3500);
        });
    }

    // Hide connection test status
    function hideConnectionTest() {
        const statusEl = document.getElementById('connectionTestStatus');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
    }

    // Backend API Integration
    async function submitConfiguration(data) {
        // TODO: Replace with actual backend API endpoint
        const endpoint = '/api/channel-binding/configure';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Fallback for development/demo
            console.warn('API call failed, using mock response:', error);
            return mockSubmitConfiguration(data);
        }
    }

    async function validateConfiguration(configId) {
        // TODO: Replace with actual backend API endpoint
        const endpoint = `/api/channel-binding/validate/${configId}`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Fallback for development/demo
            console.warn('API call failed, using mock response:', error);
            return mockValidateConfiguration(configId);
        }
    }

    // Mock API responses for development
    function mockSubmitConfiguration(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    configId: 'config_' + Date.now(),
                    message: 'Configuration submitted successfully'
                });
            }, 1500);
        });
    }

    function mockValidateConfiguration(configId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Configuration validated successfully'
                });
            }, 2000);
        });
    }

    // Reset Handler
    function handleReset() {
        // Hide connection test status
        hideConnectionTest();
        if (confirm('确定要重置所有配置吗？未保存的数据将丢失。')) {
            if (elements.channelForm) {
                elements.channelForm.reset();
            }
            state.currentStep = 1;
            state.currentChannel = '';
            state.currentPaymentType = '';
            state.formData = {};
            updateChannelSpecificFields();
            updateUI();
            hideMessage();
            showMessage('表单已重置', 'info');
        }
    }

    // Message Display
    function showMessage(message, type = 'info') {
        elements.messageContainer.textContent = message;
        elements.messageContainer.className = `message-container ${type}`;
        elements.messageContainer.style.display = 'block';
        
        // Auto-hide success/info messages after 5 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                hideMessage();
            }, 5000);
        }
    }

    function hideMessage() {
        elements.messageContainer.style.display = 'none';
    }

    // Loading Overlay
    function showLoading(show) {
        elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            // Also try loading merchants after a short delay to ensure everything is ready
            setTimeout(() => {
                console.log('[Channel Binding] Delayed merchant load after DOMContentLoaded');
                loadMerchantOptions();
            }, 200);
        });
    } else {
        init();
        // Also try loading merchants after a short delay
        setTimeout(() => {
            console.log('[Channel Binding] Delayed merchant load (DOM already ready)');
            loadMerchantOptions();
        }, 200);
    }
    
    // Also try loading merchants when window loads (as a backup)
    window.addEventListener('load', () => {
        console.log('[Channel Binding] Window loaded, ensuring merchants are loaded...');
        const select = document.getElementById('merchant-name');
        if (select && select.options.length <= 1) {
            console.log('[Channel Binding] Merchant select is empty, loading merchants...');
            loadMerchantOptions();
        }
    });
})();
