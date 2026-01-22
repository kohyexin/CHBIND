// Channel Binding Admin Configuration - JavaScript

(function() {
    'use strict';

    const channelConfigs = {
        ysepay: {
            imageInput: document.getElementById('ysepay-image-input'),
            uploadArea: document.getElementById('ysepay-upload-area'),
            imagePreview: document.getElementById('ysepay-image-preview'),
            imageActions: document.getElementById('ysepay-image-actions'),
            textHint: document.getElementById('ysepay-text-hint'),
            previewContent: document.getElementById('ysepay-preview-content')
        },
        rumble: {
            imageInput: document.getElementById('rumble-image-input'),
            uploadArea: document.getElementById('rumble-upload-area'),
            imagePreview: document.getElementById('rumble-image-preview'),
            imageActions: document.getElementById('rumble-image-actions'),
            textHint: document.getElementById('rumble-text-hint'),
            previewContent: document.getElementById('rumble-preview-content')
        },
        evonet: {
            imageInput: document.getElementById('evonet-image-input'),
            uploadArea: document.getElementById('evonet-upload-area'),
            imagePreview: document.getElementById('evonet-image-preview'),
            imageActions: document.getElementById('evonet-image-actions'),
            textHint: document.getElementById('evonet-text-hint'),
            previewContent: document.getElementById('evonet-preview-content')
        },
        paysaas: {
            imageInput: document.getElementById('paysaas-image-input'),
            uploadArea: document.getElementById('paysaas-upload-area'),
            imagePreview: document.getElementById('paysaas-image-preview'),
            imageActions: document.getElementById('paysaas-image-actions'),
            textHint: document.getElementById('paysaas-text-hint'),
            previewContent: document.getElementById('paysaas-preview-content')
        }
    };

    // Current selected channel
    let currentChannel = 'ysepay';
    
    // Channel table state
    let channelTableState = {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        selectedChannelId: null,
        channels: []
    };

    // Card type options
    const allCardTypes = ['全部', 'Maestro', 'Master', 'Visa', 'JCB', 'Diners', 'Discover', 'AE', 'MIX'];

    // Initialize
    function init() {
        setupChannelSelector();
        setupImageUploads();
        setupTextHintUpdates();
        setupCardTypeConfigurations();
        setupCurrencyConfigurations();
        loadConfigurations();
        loadChannelTable();
        setupTableSelection();
    }

    // Setup Card Type Configurations
    function setupCardTypeConfigurations() {
        // YSEPAY default card types
        setupCardTypeList('ysepay', ['全部', 'Maestro', 'Master', 'Visa', 'JCB', 'Diners', 'Discover', 'AE']);
        
        // RUMBLE default card types
        setupCardTypeList('rumble', ['全部', 'MIX']);
        
        // EVONET default card types
        setupCardTypeList('evonet', ['全部', 'Maestro', 'Master', 'Visa', 'JCB', 'Diners', 'Discover', 'AE']);
        
        // PAYSAAS default card types
        setupCardTypeList('paysaas', ['全部', 'Maestro', 'Master', 'Visa', 'JCB', 'Diners', 'Discover', 'AE']);
    }

    // Setup Currency Configurations
    function setupCurrencyConfigurations() {
        // YSEPAY default currencies
        setupCurrencyList('ysepay', [
            { value: 'USD', label: 'USD - 美元' },
            { value: 'HKD', label: 'HKD - 港币' },
            { value: 'EUR', label: 'EUR - 欧元' },
            { value: 'JPY', label: 'JPY - 日元' }
        ]);
        
        // RUMBLE default currencies
        setupCurrencyList('rumble', [
            { value: 'INR', label: 'INR - 印度卢比' }
        ]);
        
        // EVONET default currencies
        setupCurrencyList('evonet', [
            { value: 'USD', label: 'USD - 美元' },
            { value: 'HKD', label: 'HKD - 港币' },
            { value: 'EUR', label: 'EUR - 欧元' },
            { value: 'JPY', label: 'JPY - 日元' }
        ]);
        
        // PAYSAAS default currencies
        setupCurrencyList('paysaas', [
            { value: 'USD', label: 'USD - 美元' },
            { value: 'HKD', label: 'HKD - 港币' },
            { value: 'EUR', label: 'EUR - 欧元' },
            { value: 'JPY', label: 'JPY - 日元' }
        ]);
    }

    // Setup Currency List
    function setupCurrencyList(channel, defaultCurrencies) {
        const container = document.getElementById(`${channel}-currencies`);
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        // First row: "全部" (All)
        const allRow = document.createElement('div');
        allRow.className = 'currency-config-row';
        const allLabel = document.createElement('label');
        allLabel.className = 'currency-config-checkbox';
        allLabel.style.cssText = 'padding: 8px 12px; background: white; border: 1px solid #ddd; border-radius: 4px;';
        allLabel.innerHTML = `
            <input type="checkbox" name="currency-config-${channel}" value="全部" checked onchange="handleAllCurrencyConfig('${channel}')">
            <span>全部</span>
        `;
        allRow.appendChild(allLabel);
        container.appendChild(allRow);

        // Second row: Other currencies
        const otherRow = document.createElement('div');
        otherRow.className = 'currency-config-row';
        
        defaultCurrencies.forEach(currency => {
            const currencyCode = typeof currency === 'string' ? currency : currency.value;
            const currencyLabel = typeof currency === 'string' ? currency : currency.label;
            
            if (currencyCode === '全部') return; // Skip if "全部" is in the list
            
            const item = document.createElement('div');
            item.className = 'currency-config-item';
            item.innerHTML = `
                <label class="currency-config-checkbox">
                    <input type="checkbox" name="currency-config-${channel}" value="${currencyCode}" checked onchange="handleCurrencyConfig('${channel}')">
                    <span>${currencyLabel || currencyCode}</span>
                </label>
            `;
            otherRow.appendChild(item);
        });
        
        container.appendChild(otherRow);
    }

    // Handle "全部" checkbox in admin currency config
    window.handleAllCurrencyConfig = function(channel) {
        const allCheckbox = document.querySelector(`input[name="currency-config-${channel}"][value="全部"]`);
        const otherCheckboxes = document.querySelectorAll(`input[name="currency-config-${channel}"]:not([value="全部"])`);
        
        if (allCheckbox && allCheckbox.checked) {
            otherCheckboxes.forEach(cb => {
                cb.checked = true;
            });
        } else {
            otherCheckboxes.forEach(cb => {
                cb.checked = false;
            });
        }
    };

    // Handle individual currency in admin config
    window.handleCurrencyConfig = function(channel) {
        const allCheckbox = document.querySelector(`input[name="currency-config-${channel}"][value="全部"]`);
        const otherCheckboxes = document.querySelectorAll(`input[name="currency-config-${channel}"]:not([value="全部"])`);
        const checkedOthers = document.querySelectorAll(`input[name="currency-config-${channel}"]:not([value="全部"]):checked`);
        
        if (allCheckbox) {
            if (checkedOthers.length === otherCheckboxes.length) {
                allCheckbox.checked = true;
            } else {
                allCheckbox.checked = false;
            }
        }
    };

    // Setup Card Type List
    function setupCardTypeList(channel, defaultTypes) {
        const container = document.getElementById(`${channel}-card-types`);
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        // First row: "全部" (All)
        const allRow = document.createElement('div');
        allRow.className = 'card-type-config-row';
        const allLabel = document.createElement('label');
        allLabel.className = 'card-type-config-checkbox';
        allLabel.innerHTML = `
            <input type="checkbox" name="card-type-${channel}" value="全部" checked onchange="handleAllCardTypeConfig('${channel}')">
            <span>全部</span>
        `;
        allRow.appendChild(allLabel);
        container.appendChild(allRow);

        // Second row: Other card types
        const otherRow = document.createElement('div');
        otherRow.className = 'card-type-config-row';
        
        defaultTypes.filter(type => type !== '全部').forEach(cardType => {
            const label = document.createElement('label');
            label.className = 'card-type-config-checkbox';
            label.innerHTML = `
                <input type="checkbox" name="card-type-${channel}" value="${cardType}" checked onchange="handleCardTypeConfig('${channel}')">
                <span>${cardType}</span>
            `;
            otherRow.appendChild(label);
        });
        
        container.appendChild(otherRow);
    }

    // Handle "全部" checkbox in admin config
    window.handleAllCardTypeConfig = function(channel) {
        const allCheckbox = document.querySelector(`input[name="card-type-${channel}"][value="全部"]`);
        const otherCheckboxes = document.querySelectorAll(`input[name="card-type-${channel}"]:not([value="全部"])`);
        
        if (allCheckbox && allCheckbox.checked) {
            otherCheckboxes.forEach(cb => {
                cb.checked = true;
            });
        } else {
            otherCheckboxes.forEach(cb => {
                cb.checked = false;
            });
        }
    };

    // Handle individual card type in admin config
    window.handleCardTypeConfig = function(channel) {
        const allCheckbox = document.querySelector(`input[name="card-type-${channel}"][value="全部"]`);
        const otherCheckboxes = document.querySelectorAll(`input[name="card-type-${channel}"]:not([value="全部"])`);
        const checkedOthers = document.querySelectorAll(`input[name="card-type-${channel}"]:not([value="全部"]):checked`);
        
        if (allCheckbox) {
            if (checkedOthers.length === otherCheckboxes.length) {
                allCheckbox.checked = true;
            } else {
                allCheckbox.checked = false;
            }
        }
    };

    // Tab Switching
    window.switchTab = function(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
            tab.style.display = 'none';
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
            selectedTab.style.display = 'block';
        }
        
        // Activate button
        const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    };

    // Setup Channel Selector
    function setupChannelSelector() {
        const channelSelect = document.getElementById('admin-channel-select');
        if (channelSelect) {
            channelSelect.addEventListener('change', (e) => {
                currentChannel = e.target.value;
                showChannelConfig(currentChannel);
            });
        }

        // Config Type Selector
        const configTypeSelect = document.getElementById('config-type-select');
        const channelSelectGroup = document.getElementById('channel-select-group');
        const platformSelectGroup = document.getElementById('platform-select-group');
        const platformInterfaceGroup = document.getElementById('platform-interface-group');
        const platformSelect = document.getElementById('admin-platform-select');
        const interfaceTypeSelect = document.getElementById('admin-interface-type-select');
        const saveChannelBtn = document.getElementById('saveCurrentChannelBtn');
        const savePlatformBtn = document.getElementById('saveCurrentPlatformBtn');

        if (configTypeSelect) {
            configTypeSelect.addEventListener('change', (e) => {
                const configType = e.target.value;
                if (configType === 'platform') {
                    // Show platform selects, hide channel select
                    channelSelectGroup.style.display = 'none';
                    platformSelectGroup.style.display = 'block';
                    platformInterfaceGroup.style.display = 'block';
                    // Hide all channel configs
                    document.querySelectorAll('.channel-config-item[data-channel]').forEach(item => {
                        item.style.display = 'none';
                    });
                    // Show save platform button, hide save channel button
                    if (saveChannelBtn) saveChannelBtn.style.display = 'none';
                    if (savePlatformBtn) savePlatformBtn.style.display = 'inline-block';
                    // Load platform config if platform and interface type are already selected
                    setTimeout(() => {
                        if (platformSelect && interfaceTypeSelect && platformSelect.value && interfaceTypeSelect.value) {
                            updatePlatformConfig();
                        }
                    }, 50);
                } else {
                    // Show channel select, hide platform selects
                    channelSelectGroup.style.display = 'block';
                    platformSelectGroup.style.display = 'none';
                    platformInterfaceGroup.style.display = 'none';
                    // Hide all platform configs
                    document.querySelectorAll('.channel-config-item[data-platform]').forEach(item => {
                        item.style.display = 'none';
                    });
                    // Show save channel button, hide save platform button
                    if (saveChannelBtn) saveChannelBtn.style.display = 'inline-block';
                    if (savePlatformBtn) savePlatformBtn.style.display = 'none';
                    // Show default channel config
                    if (currentChannel) {
                        showChannelConfig(currentChannel);
                    }
                }
            });
        }

        // Platform and Interface Type Selectors
        if (platformSelect) {
            platformSelect.addEventListener('change', (e) => {
                updatePlatformConfig();
            });
        }

        if (interfaceTypeSelect) {
            interfaceTypeSelect.addEventListener('change', (e) => {
                updatePlatformConfig();
            });
        }

        function updatePlatformConfig() {
            const platform = platformSelect ? platformSelect.value : '';
            const interfaceType = interfaceTypeSelect ? interfaceTypeSelect.value : '';

            // Hide all platform configs
            document.querySelectorAll('.channel-config-item[data-platform]').forEach(item => {
                item.style.display = 'none';
            });

            // Show selected platform config
            if (platform && interfaceType) {
                const selectedConfig = document.getElementById(`${platform}-${interfaceType}-config`);
                if (selectedConfig) {
                    selectedConfig.style.display = 'block';
                    // Load existing config if available
                    loadPlatformConfig(platform, interfaceType);
                    // Setup image upload for this platform config
                    setupPlatformImageUpload(platform, interfaceType);
                }
            }
        }
        
        // Load platform config on page load if dropdowns have values
        // This is called after setupChannelSelector completes
        setTimeout(() => {
            const configTypeSelect = document.getElementById('config-type-select');
            if (configTypeSelect && configTypeSelect.value === 'platform') {
                const platform = platformSelect ? platformSelect.value : '';
                const interfaceType = interfaceTypeSelect ? interfaceTypeSelect.value : '';
                if (platform && interfaceType) {
                    updatePlatformConfig();
                }
            }
        }, 200);

        // Setup Platform Image Upload
        function setupPlatformImageUpload(platform, interfaceType) {
            const configId = `${platform}-${interfaceType}`;
            const uploadArea = document.getElementById(`${configId}-upload-area`);
            const imageInput = document.getElementById(`${configId}-image-input`);
            
            if (!uploadArea || !imageInput) return;

            // Remove existing listeners by cloning
            const newUploadArea = uploadArea.cloneNode(true);
            uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
            const newImageInput = imageInput.cloneNode(true);
            imageInput.parentNode.replaceChild(newImageInput, imageInput);

            // Click to upload
            newUploadArea.addEventListener('click', () => {
                newImageInput.click();
            });

            // File input change
            newImageInput.addEventListener('change', (e) => {
                handlePlatformImageUpload(platform, interfaceType, e.target.files[0]);
            });

            // Drag and drop
            newUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                newUploadArea.classList.add('dragover');
            });

            newUploadArea.addEventListener('dragleave', () => {
                newUploadArea.classList.remove('dragover');
            });

            newUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                newUploadArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
                    handlePlatformImageUpload(platform, interfaceType, file);
                }
            });
        }

        // Handle Platform Image/PDF Upload
        function handlePlatformImageUpload(platform, interfaceType, file) {
            if (!file) return;

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                showMessage('文件大小不能超过 10MB', 'error');
                return;
            }

            // Validate file type
            const isImage = file.type.startsWith('image/');
            const isPDF = file.type === 'application/pdf';
            
            if (!isImage && !isPDF) {
                showMessage('请上传有效的图片或PDF文件', 'error');
                return;
            }

            const configId = `${platform}-${interfaceType}`;
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const fileData = e.target.result;
                const preview = document.getElementById(`${configId}-image-preview`);
                const actions = document.getElementById(`${configId}-image-actions`);
                const uploadArea = document.getElementById(`${configId}-upload-area`);
                
                if (preview) {
                    if (isPDF) {
                        // Escape quotes in fileData for HTML attribute
                        const escapedFileData = fileData.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                        preview.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-top: 12px;" data-pdf-data="${escapedFileData}" data-pdf-name="${file.name.replace(/"/g, '&quot;')}">
                                <div style="font-size: 32px;">📄</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${file.name}</div>
                                    <div style="font-size: 12px; color: #666;">PDF 文件</div>
                                </div>
                            </div>
                        `;
                    } else {
                        preview.innerHTML = `<img src="${fileData}" alt="Platform Hint" style="max-width: 100%; max-height: 300px; border-radius: 4px; margin-top: 12px;">`;
                    }
                }
                if (actions) {
                    actions.style.display = 'block';
                }
                if (uploadArea) {
                    uploadArea.style.display = 'none';
                }

                // Update preview
                updatePlatformPreview(platform, interfaceType, fileData, isPDF ? 'pdf' : 'image', file.name);
            };

            reader.readAsDataURL(file);
        }

        // Load Platform Config
        async function loadPlatformConfig(platform, interfaceType) {
            try {
                const response = await fetch(`/api/platform-hint/${platform}/${interfaceType}`, {
                    method: 'GET',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                if (response.ok) {
                    const data = await response.json();
                    const configId = `${platform}-${interfaceType}`;
                    
                    const fileData = data.fileData || data.imageData || data.imageUrl;
                    // Determine file type - check explicit fileType first, then check data URL prefix
                    let fileType = 'image';
                    if (data.fileType) {
                        fileType = data.fileType;
                    } else if (fileData) {
                        // Check if it's a PDF data URL
                        if (fileData.startsWith('data:application/pdf') || fileData.includes('application/pdf')) {
                            fileType = 'pdf';
                        } else if (fileData.startsWith('data:image/')) {
                            fileType = 'image';
                        }
                    }
                    const fileName = data.fileName || '';
                    
                    if (fileData) {
                        const preview = document.getElementById(`${configId}-image-preview`);
                        const actions = document.getElementById(`${configId}-image-actions`);
                        const uploadArea = document.getElementById(`${configId}-upload-area`);
                        
                        if (preview) {
                            if (fileType === 'pdf') {
                                const escapedFileData = fileData.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                                preview.innerHTML = `
                                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-top: 12px;" data-pdf-data="${escapedFileData}" data-pdf-name="${(fileName || 'document.pdf').replace(/"/g, '&quot;')}">
                                        <div style="font-size: 32px;">📄</div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${fileName || 'document.pdf'}</div>
                                            <div style="font-size: 12px; color: #666;">PDF 文件</div>
                                        </div>
                                    </div>
                                `;
                            } else {
                                preview.innerHTML = `<img src="${fileData}" alt="Platform Hint" style="max-width: 100%; max-height: 300px; border-radius: 4px; margin-top: 12px;">`;
                            }
                        }
                        if (actions) {
                            actions.style.display = 'block';
                        }
                        if (uploadArea) {
                            uploadArea.style.display = 'none';
                        }
                    }

                    if (data.textHint) {
                        const textHintInput = document.getElementById(`${configId}-text-hint`);
                        if (textHintInput) {
                            textHintInput.value = data.textHint;
                        }
                    }

                    updatePlatformPreview(platform, interfaceType, fileData, fileType, fileName, data.textHint);
                }
            } catch (error) {
                console.warn('Failed to load platform config from API:', error);
            }
            
            // Fallback: Try localStorage
            try {
                const key = `platformHint_${platform}_${interfaceType}`;
                const stored = localStorage.getItem(key);
                if (stored) {
                    const data = JSON.parse(stored);
                    const configId = `${platform}-${interfaceType}`;
                    
                    const fileData = data.fileData || data.imageData || data.imageUrl;
                    let fileType = 'image';
                    if (data.fileType) {
                        fileType = data.fileType;
                    } else if (fileData) {
                        if (fileData.startsWith('data:application/pdf') || fileData.includes('application/pdf')) {
                            fileType = 'pdf';
                        } else if (fileData.startsWith('data:image/')) {
                            fileType = 'image';
                        }
                    }
                    const fileName = data.fileName || '';
                    
                    if (fileData) {
                        const preview = document.getElementById(`${configId}-image-preview`);
                        const actions = document.getElementById(`${configId}-image-actions`);
                        const uploadArea = document.getElementById(`${configId}-upload-area`);
                        
                        if (preview) {
                            if (fileType === 'pdf') {
                                const escapedFileData = fileData.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                                preview.innerHTML = `
                                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-top: 12px;" data-pdf-data="${escapedFileData}" data-pdf-name="${(fileName || 'document.pdf').replace(/"/g, '&quot;')}">
                                        <div style="font-size: 32px;">📄</div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${fileName || 'document.pdf'}</div>
                                            <div style="font-size: 12px; color: #666;">PDF 文件</div>
                                        </div>
                                    </div>
                                `;
                            } else {
                                preview.innerHTML = `<img src="${fileData}" alt="Platform Hint" style="max-width: 100%; max-height: 300px; border-radius: 4px; margin-top: 12px;">`;
                            }
                        }
                        if (actions) {
                            actions.style.display = 'block';
                        }
                        if (uploadArea) {
                            uploadArea.style.display = 'none';
                        }
                    }

                    if (data.textHint) {
                        const textHintInput = document.getElementById(`${configId}-text-hint`);
                        if (textHintInput) {
                            textHintInput.value = data.textHint;
                        }
                    }

                    updatePlatformPreview(platform, interfaceType, fileData, fileType, fileName, data.textHint || '');
                    console.log('Loaded platform config from localStorage:', { platform, interfaceType, fileType, fileName });
                }
            } catch (e) {
                console.warn('Failed to load platform config from localStorage:', e);
            }
        }

        // Update Platform Preview
        function updatePlatformPreview(platform, interfaceType, fileData, fileType = 'image', fileName = null, textHint = '') {
            const configId = `${platform}-${interfaceType}`;
            const previewContent = document.getElementById(`${configId}-preview-content`);
            
            if (!previewContent) return;

            let html = '';
            if (fileData) {
                if (fileType === 'pdf') {
                    html += `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-bottom: 16px; cursor: pointer;" onclick="previewPDF('${fileData}', '${fileName || 'document.pdf'}')">
                            <div style="font-size: 32px;">📄</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #4A90E2; margin-bottom: 4px;">${fileName || 'document.pdf'}</div>
                                <div style="font-size: 12px; color: #666;">点击预览 PDF 文件</div>
                            </div>
                        </div>
                    `;
                } else {
                    html += `<img src="${fileData}" alt="Platform Configuration Guide" style="max-width: 100%; border-radius: 4px; margin-bottom: 16px;">`;
                }
            }
            if (textHint) {
                html += `<div style="padding: 12px; background: #f8f9fa; border-radius: 4px; margin-top: 12px;"><p>${textHint}</p></div>`;
            }
            if (!html) {
                html = '<div class="info-box"><p><strong>提示：</strong>请上传配置指南文件</p></div>';
            }
            
            previewContent.innerHTML = html;
        }

        // Save Current Platform
        window.saveCurrentPlatform = async function() {
            const platformSelect = document.getElementById('admin-platform-select');
            const interfaceTypeSelect = document.getElementById('admin-interface-type-select');
            
            if (!platformSelect || !interfaceTypeSelect) {
                showMessage('无法找到平台选择器', 'error');
                return;
            }

            const platform = platformSelect.value;
            const interfaceType = interfaceTypeSelect.value;

            if (!platform || !interfaceType) {
                showMessage('请选择平台和接口类型', 'error');
                return;
            }

            const configId = `${platform}-${interfaceType}`;
            const imagePreview = document.getElementById(`${configId}-image-preview`);
            const textHintInput = document.getElementById(`${configId}-text-hint`);

            const previewElement = imagePreview.querySelector('img') || imagePreview.querySelector('div');
            if (!previewElement) {
                showMessage('请上传提示文件', 'error');
                return;
            }

            // Get file data - could be image src or PDF data
            let fileData = '';
            let fileType = 'image';
            let fileName = '';
            
            const img = imagePreview.querySelector('img');
            if (img) {
                fileData = img.src;
                fileType = 'image';
            } else {
                // For PDF, get from data attributes
                const pdfDiv = imagePreview.querySelector('div[data-pdf-data]');
                if (pdfDiv) {
                    fileData = pdfDiv.getAttribute('data-pdf-data');
                    fileName = pdfDiv.getAttribute('data-pdf-name') || '';
                    fileType = 'pdf';
                }
            }
            
            // File upload is optional - no validation needed
            
            // Debug logging
            console.log('Saving platform configuration:', {
                platform: platform,
                interfaceType: interfaceType,
                hasFileData: !!fileData,
                fileType: fileType,
                fileName: fileName,
                fileDataLength: fileData ? fileData.length : 0
            });
            
            const textHint = textHintInput ? textHintInput.value : '';

            try {
                const response = await fetch('/api/platform-hint/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        platform: platform,
                        interfaceType: interfaceType,
                        fileData: fileData,
                        fileType: fileType,
                        fileName: fileName,
                        textHint: textHint
                    })
                });

                if (response.ok) {
                    showMessage('平台配置保存成功！', 'success');
                } else {
                    throw new Error('Save failed');
                }
            } catch (error) {
                console.error('Save platform config error:', error);
                // Fallback: save to localStorage
                const key = `platformHint_${platform}_${interfaceType}`;
                localStorage.setItem(key, JSON.stringify({
                    fileData: fileData,
                    fileType: fileType,
                    fileName: fileName,
                    textHint: textHint
                }));
                showMessage('平台配置已保存到本地（演示模式）', 'success');
            }
        };
    }

    // Show Channel Config
    function showChannelConfig(channel) {
        // Hide all channel configs
        document.querySelectorAll('.channel-config-item').forEach(item => {
            item.style.display = 'none';
        });

        // Show selected channel config
        const selectedConfig = document.getElementById(`${channel}-config`);
        if (selectedConfig) {
            selectedConfig.style.display = 'block';
        }

        // Update save button text
        const saveBtn = document.getElementById('saveCurrentChannelBtn');
        if (saveBtn) {
            let channelName = 'YSEPAY';
            if (channel === 'rumble') channelName = 'RUMBLE';
            else if (channel === 'evonet') channelName = 'EVONET';
            else if (channel === 'paysaas') channelName = 'PAYSAAS';
            saveBtn.textContent = `保存 ${channelName} 配置`;
        }
    }

    // Setup Image Uploads
    function setupImageUploads() {
        Object.keys(channelConfigs).forEach(channel => {
            const config = channelConfigs[channel];
            
            // Click to upload
            config.uploadArea.addEventListener('click', () => {
                config.imageInput.click();
            });

            // File input change
            config.imageInput.addEventListener('change', (e) => {
                handleImageUpload(channel, e.target.files[0]);
            });

            // Drag and drop
            config.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                config.uploadArea.classList.add('dragover');
            });

            config.uploadArea.addEventListener('dragleave', () => {
                config.uploadArea.classList.remove('dragover');
            });

            config.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                config.uploadArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
                    handleImageUpload(channel, file);
                }
            });

            // Make upload area focusable for paste
            config.uploadArea.setAttribute('tabindex', '0');
            config.uploadArea.style.outline = 'none';
        });

        // Global paste handler - handle paste for the currently active channel
        document.addEventListener('paste', (e) => {
            // Only handle if we're in the hint config tab
            const hintTab = document.getElementById('hint-config-tab');
            if (!hintTab || hintTab.style.display === 'none') {
                return;
            }

            // Find the currently visible channel config
            Object.keys(channelConfigs).forEach(channel => {
                const config = channelConfigs[channel];
                const channelConfigItem = document.getElementById(`${channel}-config`);
                
                // Check if this channel's config is currently visible and upload area is shown
                if (channelConfigItem && 
                    channelConfigItem.style.display !== 'none' &&
                    config.uploadArea.style.display !== 'none' &&
                    config.uploadArea.offsetParent !== null) {
                    handlePasteImage(channel, e);
                    return; // Only handle for the first visible channel
                }
            });
        });
    }

    // Handle Paste Image from Clipboard
    function handlePasteImage(channel, e) {
        e.preventDefault();
        e.stopPropagation();

        const items = e.clipboardData.items;
        if (!items) return;

        // Find image in clipboard items
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Check if item is an image
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    // Convert blob to File-like object for handleImageUpload
                    const file = new File([blob], `pasted-image-${Date.now()}.${blob.type.split('/')[1]}`, {
                        type: blob.type,
                        lastModified: Date.now()
                    });
                    handleImageUpload(channel, file);
                    showMessage('图片已从剪贴板粘贴', 'success');
                }
                break;
            }
        }
    }

    // Handle Image/PDF Upload
    function handleImageUpload(channel, file) {
        if (!file) return;

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            showMessage('文件大小不能超过 10MB', 'error');
            return;
        }

        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        
        if (!isImage && !isPDF) {
            showMessage('请上传有效的图片或PDF文件', 'error');
            return;
        }

        const config = channelConfigs[channel];
        const reader = new FileReader();

        reader.onload = (e) => {
            const fileData = e.target.result;
            
            if (isPDF) {
                // Escape quotes in fileData for HTML attribute
                const escapedFileData = fileData.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                // Display PDF file info with data attributes
                config.imagePreview.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-top: 12px;" data-pdf-data="${escapedFileData}" data-pdf-name="${file.name.replace(/"/g, '&quot;')}">
                        <div style="font-size: 32px;">📄</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${file.name}</div>
                            <div style="font-size: 12px; color: #666;">PDF 文件</div>
                        </div>
                    </div>
                `;
                config.imageActions.style.display = 'flex';
                config.uploadArea.style.display = 'none';

                // Update preview content
                updatePreview(channel, fileData, config.textHint.value, 'pdf', file.name);

                // Store file data
                config.imageData = fileData;
                config.imageFile = file;
                config.fileType = 'pdf';
                config.fileName = file.name;
            } else {
                // Display image preview
                config.imagePreview.innerHTML = `<img src="${fileData}" class="image-preview" alt="Preview">`;
                config.imageActions.style.display = 'flex';
                config.uploadArea.style.display = 'none';

                // Update preview content
                updatePreview(channel, fileData, config.textHint.value, 'image');

                // Store image data
                config.imageData = fileData;
                config.imageFile = file;
                config.fileType = 'image';
                config.fileName = null;
            }
        };

        reader.readAsDataURL(file);
    }

    // Remove Image
    window.removeImage = function(channelOrPlatform) {
        // Check if it's a platform config (contains hyphen)
        if (channelOrPlatform.includes('-')) {
            const [platform, interfaceType] = channelOrPlatform.split('-');
            const configId = `${platform}-${interfaceType}`;
            const preview = document.getElementById(`${configId}-image-preview`);
            const actions = document.getElementById(`${configId}-image-actions`);
            const uploadArea = document.getElementById(`${configId}-upload-area`);
            const imageInput = document.getElementById(`${configId}-image-input`);
            
            if (preview) preview.innerHTML = '';
            if (actions) actions.style.display = 'none';
            if (uploadArea) uploadArea.style.display = 'block';
            if (imageInput) imageInput.value = '';
            
            updatePlatformPreview(platform, interfaceType);
            return;
        }
        
        // Original channel image removal
        const channel = channelOrPlatform;
        const config = channelConfigs[channel];
        config.imagePreview.innerHTML = '';
        config.imageActions.style.display = 'none';
        config.uploadArea.style.display = 'block';
        config.imageInput.value = '';
        config.imageData = null;
        config.imageFile = null;
        updatePreview(channel, null, config.textHint.value);
    };

    // Setup Text Hint Updates
    function setupTextHintUpdates() {
        Object.keys(channelConfigs).forEach(channel => {
            const config = channelConfigs[channel];
            config.textHint.addEventListener('input', () => {
                updatePreview(channel, config.imageData, config.textHint.value);
            });
        });
    }

    // Update Preview
    function updatePreview(channel, fileData, textHint, fileType = 'image', fileName = null) {
        const config = channelConfigs[channel];
        let html = '';

        if (fileData) {
            if (fileType === 'pdf') {
                html += `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-bottom: 12px; cursor: pointer;" onclick="previewPDF('${fileData}', '${fileName || 'document.pdf'}')">
                        <div style="font-size: 32px;">📄</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #4A90E2; margin-bottom: 4px;">${fileName || 'document.pdf'}</div>
                            <div style="font-size: 12px; color: #666;">点击预览 PDF 文件</div>
                        </div>
                    </div>
                `;
            } else {
                html += `<img src="${fileData}" class="image-preview" alt="Channel Hint" style="max-width: 100%; margin-bottom: 12px;">`;
            }
        }

        if (textHint && textHint.trim()) {
            html += `<div class="info-box"><p>${textHint.replace(/\n/g, '<br>')}</p></div>`;
        } else if (!fileData) {
            // Default hint if no file and no text
            if (channel === 'ysepay') {
                html += `<div class="info-box"><p><strong>提示：</strong>请确保已从YSEPAY方获取以下信息：商户号、子商户、Key 与 AesKey</p></div>`;
            } else if (channel === 'rumble') {
                html += `<div class="info-box"><p><strong>提示：</strong>请确保已从 RUMBLE 管理后台获取 authToken 并配置 Callback URL</p><p style="margin-top: 8px; font-size: 12px;">Callback URL 示例：https://checkout.example.com/v1/RBAPMNotify</p></div>`;
            }
        }

        config.previewContent.innerHTML = html;
    }

    // Preview PDF in Modal
    window.previewPDF = function(pdfData, fileName) {
        const modal = document.getElementById('pdfPreviewModal');
        if (!modal) {
            // Create PDF preview modal
            const pdfModal = document.createElement('div');
            pdfModal.id = 'pdfPreviewModal';
            pdfModal.className = 'modal';
            pdfModal.style.display = 'flex';
            pdfModal.innerHTML = `
                <div class="modal-content modal-large" style="width: 98vw; height: 98vh; max-width: 98vw; max-height: 98vh; margin: 1vh auto;">
                    <div class="modal-header" style="flex-shrink: 0;">
                        <h2>${fileName}</h2>
                        <button class="modal-close" onclick="closePDFPreview()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 0; height: calc(98vh - 80px); overflow: hidden;">
                        <iframe src="${pdfData}" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                </div>
            `;
            document.body.appendChild(pdfModal);
        } else {
            modal.style.display = 'flex';
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.width = '98vw';
                modalContent.style.height = '98vh';
                modalContent.style.maxWidth = '98vw';
                modalContent.style.maxHeight = '98vh';
                modalContent.style.margin = '1vh auto';
            }
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.style.height = 'calc(98vh - 80px)';
                modalBody.style.overflow = 'hidden';
            }
            const iframe = modal.querySelector('iframe');
            if (iframe) {
                iframe.src = pdfData;
            }
            const title = modal.querySelector('h2');
            if (title) {
                title.textContent = fileName;
            }
        }
    };

    // Close PDF Preview
    window.closePDFPreview = function() {
        const modal = document.getElementById('pdfPreviewModal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Load Configurations
    async function loadConfigurations() {
        try {
            // Try to load all configurations
            const response = await fetch('/api/channel-binding/admin/config', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                applyConfigurations(data);
                return;
            }
        } catch (error) {
            console.warn('Failed to load configurations from API:', error);
        }

        // Fallback: Try localStorage
        try {
            const stored = localStorage.getItem('channelBindingConfig');
            if (stored) {
                const configs = JSON.parse(stored);
                applyConfigurations(configs);
                
                // Also load card types config
                const cardTypesStored = localStorage.getItem('channelCardTypesConfig');
                if (cardTypesStored) {
                    const cardTypesConfigs = JSON.parse(cardTypesStored);
                    Object.keys(cardTypesConfigs).forEach(ch => {
                        if (cardTypesConfigs[ch]) {
                            applyCardTypesConfig(ch, cardTypesConfigs[ch]);
                        }
                    });
                }

                // Also load currencies config
                const currenciesStored = localStorage.getItem('channelCurrenciesConfig');
                if (currenciesStored) {
                    const currenciesConfigs = JSON.parse(currenciesStored);
                    Object.keys(currenciesConfigs).forEach(ch => {
                        if (currenciesConfigs[ch]) {
                            applyCurrenciesConfig(ch, currenciesConfigs[ch]);
                        }
                    });
                }

                // Also load interface type config
                const interfaceTypeStored = localStorage.getItem('channelInterfaceTypeConfig');
                if (interfaceTypeStored) {
                    const interfaceTypeConfigs = JSON.parse(interfaceTypeStored);
                    Object.keys(interfaceTypeConfigs).forEach(ch => {
                        if (interfaceTypeConfigs[ch]) {
                            applyInterfaceTypeConfig(ch, interfaceTypeConfigs[ch]);
                        }
                    });
                }
                return;
            }
        } catch (e) {
            console.warn('LocalStorage fallback failed:', e);
        }

        // Use default configurations
        showChannelConfig(currentChannel);
    }

    // Apply Configurations
    function applyConfigurations(data) {
        Object.keys(channelConfigs).forEach(channel => {
            const config = channelConfigs[channel];
            const channelData = data[channel];

            if (channelData) {
                const fileData = channelData.fileData || channelData.imageUrl || channelData.imageData;
                // Determine file type - check explicit fileType first, then check data URL prefix, then default to image
                let fileType = 'image';
                if (channelData.fileType) {
                    fileType = channelData.fileType;
                } else if (fileData) {
                    // Check if it's a PDF data URL
                    if (fileData.startsWith('data:application/pdf') || fileData.includes('application/pdf')) {
                        fileType = 'pdf';
                    } else if (fileData.startsWith('data:image/')) {
                        fileType = 'image';
                    }
                }
                const fileName = channelData.fileName || '';
                
                console.log('Loading configuration for channel:', channel, {
                    hasFileData: !!fileData,
                    fileType: fileType,
                    fileName: fileName,
                    fileDataLength: fileData ? fileData.length : 0
                });
                
                if (fileData) {
                    config.imageData = fileData;
                    config.fileType = fileType;
                    config.fileName = fileName;
                    
                    if (fileType === 'pdf') {
                        const escapedFileData = fileData.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                        config.imagePreview.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-top: 12px;" data-pdf-data="${escapedFileData}" data-pdf-name="${(fileName || 'document.pdf').replace(/"/g, '&quot;')}">
                                <div style="font-size: 32px;">📄</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${fileName || 'document.pdf'}</div>
                                    <div style="font-size: 12px; color: #666;">PDF 文件</div>
                                </div>
                            </div>
                        `;
                    } else {
                        config.imagePreview.innerHTML = `<img src="${fileData}" class="image-preview" alt="Preview">`;
                    }
                    config.imageActions.style.display = 'flex';
                    config.uploadArea.style.display = 'none';
                }

                if (channelData.textHint) {
                    config.textHint.value = channelData.textHint;
                }

                // Apply card types configuration
                if (channelData.cardTypes && Array.isArray(channelData.cardTypes)) {
                    applyCardTypesConfig(channel, channelData.cardTypes);
                }

                // Apply currencies configuration
                if (channelData.currencies && Array.isArray(channelData.currencies)) {
                    applyCurrenciesConfig(channel, channelData.currencies);
                }

                // Apply interface type configuration
                if (channelData.interfaceType) {
                    applyInterfaceTypeConfig(channel, channelData.interfaceType);
                }

                updatePreview(channel, config.imageData, config.textHint.value, config.fileType || 'image', config.fileName || '');
            }
        });
        
        // Show current channel config after loading
        showChannelConfig(currentChannel);
    }

    // Apply Card Types Configuration
    function applyCardTypesConfig(channel, cardTypes) {
        const checkboxes = document.querySelectorAll(`input[name="card-type-${channel}"]`);
        checkboxes.forEach(cb => {
            cb.checked = cardTypes.includes(cb.value);
        });
    }

    // Apply Currencies Configuration
    function applyCurrenciesConfig(channel, currencies) {
        const currencyValues = currencies.map(c => typeof c === 'string' ? c : c.value);
        const checkboxes = document.querySelectorAll(`input[name="currency-config-${channel}"]`);
        checkboxes.forEach(cb => {
            cb.checked = currencyValues.includes(cb.value);
        });
    }

    // Apply Interface Type Configuration
    function applyInterfaceTypeConfig(channel, interfaceType) {
        const select = document.getElementById(`${channel}-interface-type`);
        if (select) {
            select.value = interfaceType;
        }
    }

    // Save Current Channel Configuration
    window.saveCurrentChannel = async function() {
        const config = channelConfigs[currentChannel];
        
        if (!config) {
            showMessage('无法找到当前渠道配置', 'error');
            return;
        }

        // Get selected card types
        const cardTypeCheckboxes = document.querySelectorAll(`input[name="card-type-${currentChannel}"]:checked`);
        const cardTypes = Array.from(cardTypeCheckboxes).map(cb => cb.value);
        
        if (cardTypes.length === 0) {
            showMessage('请至少选择一个卡种', 'error');
            return;
        }

        // Get selected currencies
        const currencyCheckboxes = document.querySelectorAll(`input[name="currency-config-${currentChannel}"]:checked`);
        const currencies = Array.from(currencyCheckboxes)
            .filter(cb => cb.value !== '全部')
            .map(cb => {
                // Get the label text
                const label = cb.closest('.currency-config-item')?.querySelector('span')?.textContent || cb.value;
                return { value: cb.value, label: label };
            });
        
        if (currencies.length === 0) {
            showMessage('请至少选择一个币种', 'error');
            return;
        }

        // Get interface type
        const interfaceTypeSelect = document.getElementById(`${currentChannel}-interface-type`);
        const interfaceType = interfaceTypeSelect ? interfaceTypeSelect.value : (currentChannel === 'rumble' ? 'iframe' : 'direct');

        // Get file data - check config first, then DOM
        let fileData = config.imageData || null;
        let fileType = config.fileType || null;
        let fileName = config.fileName || null;
        
        // Always also check DOM to ensure we have the latest data
        // This is important if config object wasn't properly updated
        const img = config.imagePreview.querySelector('img');
        const pdfDiv = config.imagePreview.querySelector('div[data-pdf-data]');
        
        if (img && img.src) {
            // Image found in DOM - use it (might be more up-to-date)
            fileData = img.src;
            fileType = 'image';
            fileName = null;
            // Update config object for consistency
            config.imageData = fileData;
            config.fileType = 'image';
            config.fileName = null;
        } else if (pdfDiv) {
            // PDF found in DOM - get from data attributes
            const pdfData = pdfDiv.getAttribute('data-pdf-data');
            const pdfName = pdfDiv.getAttribute('data-pdf-name');
            if (pdfData) {
                fileData = pdfData;
                fileType = 'pdf';
                fileName = pdfName || '';
                // Update config object for consistency
                config.imageData = fileData;
                config.fileType = 'pdf';
                config.fileName = fileName;
            }
        }
        
        // If still no fileData, check if config has it (for images loaded but not displayed yet)
        if (!fileData && config.imageData) {
            fileData = config.imageData;
            fileType = config.fileType || 'image';
            fileName = config.fileName || null;
        }
        
        const configuration = {
            fileData: fileData,
            fileType: fileType,
            fileName: fileName,
            textHint: config.textHint.value.trim() || null,
            cardTypes: cardTypes,
            currencies: currencies,
            interfaceType: interfaceType
        };

        // File upload and text hint are both optional - no validation needed

        // Show loading
        showMessage('保存中...', 'info');

        try {
            // Save single channel configuration
            const response = await fetch(`/api/channel-binding/admin/config/${currentChannel}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(configuration)
            });

            if (response.ok) {
                const result = await response.json();
                let channelName = 'YSEPAY';
                if (currentChannel === 'rumble') channelName = 'RUMBLE';
                else if (currentChannel === 'evonet') channelName = 'EVONET';
                else if (currentChannel === 'paysaas') channelName = 'PAYSAAS';
                showMessage(`${channelName} 渠道配置保存成功！`, 'success');
                
                // Also update localStorage for demo
                updateLocalStorage(currentChannel, configuration);
                saveCardTypesConfig(currentChannel, cardTypes);
                saveCurrenciesConfig(currentChannel, currencies);
                saveInterfaceTypeConfig(currentChannel, interfaceType);
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            console.error('Save error:', error);
            // Fallback: use localStorage for demo
            updateLocalStorage(currentChannel, configuration);
            saveCardTypesConfig(currentChannel, cardTypes);
            saveCurrenciesConfig(currentChannel, currencies);
            saveInterfaceTypeConfig(currentChannel, interfaceType);
            let channelName = 'YSEPAY';
            if (currentChannel === 'rumble') channelName = 'RUMBLE';
            else if (currentChannel === 'evonet') channelName = 'EVONET';
            else if (currentChannel === 'paysaas') channelName = 'PAYSAAS';
            showMessage(`${channelName} 配置已保存到本地（演示模式）`, 'success');
        }
    };

    // Save Card Types Configuration
    function saveCardTypesConfig(channel, cardTypes) {
        try {
            let allConfigs = {};
            const stored = localStorage.getItem('channelCardTypesConfig');
            if (stored) {
                allConfigs = JSON.parse(stored);
            }
            allConfigs[channel] = cardTypes;
            localStorage.setItem('channelCardTypesConfig', JSON.stringify(allConfigs));
        } catch (e) {
            console.warn('Failed to save card types config:', e);
        }
    }

    // Save Currencies Configuration
    function saveCurrenciesConfig(channel, currencies) {
        try {
            let allConfigs = {};
            const stored = localStorage.getItem('channelCurrenciesConfig');
            if (stored) {
                allConfigs = JSON.parse(stored);
            }
            allConfigs[channel] = currencies;
            localStorage.setItem('channelCurrenciesConfig', JSON.stringify(allConfigs));
        } catch (e) {
            console.warn('Failed to save currencies config:', e);
        }
    }

    // Save Interface Type Configuration
    function saveInterfaceTypeConfig(channel, interfaceType) {
        try {
            let allConfigs = {};
            const stored = localStorage.getItem('channelInterfaceTypeConfig');
            if (stored) {
                allConfigs = JSON.parse(stored);
            }
            allConfigs[channel] = interfaceType;
            localStorage.setItem('channelInterfaceTypeConfig', JSON.stringify(allConfigs));
        } catch (e) {
            console.warn('Failed to save interface type config:', e);
        }
    }

    // Update Local Storage
    function updateLocalStorage(channel, configuration) {
        try {
            let allConfigs = {};
            const stored = localStorage.getItem('channelBindingConfig');
            if (stored) {
                allConfigs = JSON.parse(stored);
            }
            allConfigs[channel] = configuration;
            const jsonString = JSON.stringify(allConfigs);
            
            // Check if data is too large for localStorage (usually 5-10MB limit)
            if (jsonString.length > 4 * 1024 * 1024) { // 4MB warning
                console.warn('Configuration data is large:', jsonString.length, 'bytes');
            }
            
            localStorage.setItem('channelBindingConfig', jsonString);
            console.log('Saved to localStorage:', {
                channel: channel,
                hasFileData: !!configuration.fileData,
                fileType: configuration.fileType,
                fileName: configuration.fileName
            });
        } catch (e) {
            console.error('LocalStorage update failed:', e);
            if (e.name === 'QuotaExceededError') {
                showMessage('存储空间不足，无法保存配置。请删除一些数据后重试。', 'error');
            } else {
                showMessage('保存到本地存储失败: ' + e.message, 'error');
            }
        }
    }

    // Reset Current Channel Configuration
    window.resetCurrentChannel = function() {
        const channelName = currentChannel === 'ysepay' ? 'YSEPAY' : 'RUMBLE';
        if (!confirm(`确定要重置 ${channelName} 渠道的配置吗？此操作不可恢复。`)) {
            return;
        }

        const config = channelConfigs[currentChannel];
        if (config) {
            config.imagePreview.innerHTML = '';
            config.imageActions.style.display = 'none';
            config.uploadArea.style.display = 'block';
            config.imageInput.value = '';
            config.imageData = null;
            config.imageFile = null;
            config.textHint.value = '';
            updatePreview(currentChannel, null, '');
        }

        showMessage(`${channelName} 渠道配置已重置`, 'info');
    };

    // Message Display
    function showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        if (container) {
            container.textContent = message;
            container.className = `message-container ${type}`;
            container.style.display = 'block';

            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    container.style.display = 'none';
                }, 5000);
            }
        }
    }

    // Load Channel Table
    async function loadChannelTable() {
        try {
            const response = await fetch(`/api/channel-binding/admin/channels?page=${channelTableState.currentPage}&size=${channelTableState.pageSize}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                channelTableState.channels = data.channels || [];
                channelTableState.totalItems = data.total || 0;
                renderChannelTable();
            } else {
                // Use mock data for demo
                loadMockChannelData();
            }
        } catch (error) {
            console.warn('Failed to load channels:', error);
            loadMockChannelData();
        }
    }

    // Load Mock Data (for demo)
    function loadMockChannelData() {
        channelTableState.channels = [
            { id: 1, companyName: 'NbcPay', bankName: 'XNOVA', cardType: 'Maestro', channelId: '118701', channelName: 'XNOVAMAESTRO', paymentMethod: 'Credit Card', currencies: 'ARS, AUD, BHD, BOB, BRL, CAD, CHF, CLP, CNY, COP, CRC, CZK, DKK, EUR, GBP, HKD, IDR, ILS, INR, JPY, KRW, MXN, MYR, NOK, NZD, PHP, PLN, RUB, SAR, SEK, SGD, THB, TRY, TWD, USD, VND, ZAR', status: '正常', isDelayed: '否', interface: '[3方]', operator: 'Lynn', operationTime: '2026-01-14' },
            { id: 2, companyName: 'NbcPay', bankName: 'XNOVA', cardType: 'Master', channelId: '118201', channelName: 'XNOVAMASTER', paymentMethod: 'Credit Card', currencies: 'ARS, AUD, BHD, BOB, BRL, CAD, CHF, CLP, CNY, COP, CRC, CZK, DKK, EUR, GBP, HKD, IDR, ILS, INR, JPY, KRW, MXN, MYR, NOK, NZD, PHP, PLN, RUB, SAR, SEK, SGD, THB, TRY, TWD, USD, VND, ZAR', status: '正常', isDelayed: '否', interface: '[3方]', operator: 'Lynn', operationTime: '2026-01-14' },
            { id: 3, companyName: 'NbcPay', bankName: 'XNOVA', cardType: 'Visa', channelId: '117701', channelName: 'XNOVAVISA', paymentMethod: 'Credit Card', currencies: 'ARS, AUD, BHD, BOB, BRL, CAD, CHF, CLP, CNY, COP, CRC, CZK, DKK, EUR, GBP, HKD, IDR, ILS, INR, JPY, KRW, MXN, MYR, NOK, NZD, PHP, PLN, RUB, SAR, SEK, SGD, THB, TRY, TWD, USD, VND, ZAR', status: '正常', isDelayed: '否', interface: '[3方]', operator: 'Lynn', operationTime: '2026-01-14' },
            { id: 4, companyName: 'NexPay', bankName: 'SOLIDPAYMENTSV2', cardType: 'Maestro', channelId: '97701', channelName: 'SOLIDPAYMENTSV2MAESTRO', paymentMethod: 'Credit Card', currencies: 'ARS, AUD, BHD, BOB, BRL, CAD, CHF, CLP, CNY, COP, CRC, CZK, DKK, EUR, GBP, HKD, IDR, ILS, INR, JPY, KRW, MXN, MYR, NOK, NZD, PHP, PLN, RUB, SAR, SEK, SGD, THB, TRY, TWD, USD, VND, ZAR', status: '正常', isDelayed: '否', interface: '[3方]', operator: 'Jason Lin', operationTime: '2026-01-13' }
        ];
        channelTableState.totalItems = 4;
        renderChannelTable();
    }

    // Render Channel Table
    function renderChannelTable() {
        const tbody = document.getElementById('channel-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        const startIndex = (channelTableState.currentPage - 1) * channelTableState.pageSize;
        const endIndex = Math.min(startIndex + channelTableState.pageSize, channelTableState.channels.length);
        const pageChannels = channelTableState.channels.slice(startIndex, endIndex);

        pageChannels.forEach(channel => {
            const row = document.createElement('tr');
            row.dataset.channelId = channel.id;
            
            if (channel.id === channelTableState.selectedChannelId) {
                row.classList.add('selected');
            }

            row.innerHTML = `
                <td>
                    <input type="radio" name="channel-select" value="${channel.id}" 
                           ${channel.id === channelTableState.selectedChannelId ? 'checked' : ''}
                           onchange="selectChannel(${channel.id})">
                </td>
                <td>${channel.companyName || ''}</td>
                <td>${channel.bankName || ''}</td>
                <td>${channel.cardType || ''}</td>
                <td>${channel.channelId || ''}</td>
                <td>${channel.channelName || ''}</td>
                <td>${channel.paymentMethod || ''}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${channel.currencies || ''}">${channel.currencies || ''}</td>
                <td>${channel.status || ''}</td>
                <td>${channel.isDelayed || ''}</td>
                <td>${channel.interface || ''}</td>
                <td>${channel.operator || ''}</td>
                <td>${channel.operationTime || ''}</td>
            `;

            tbody.appendChild(row);
        });

        updatePaginationInfo();
    }

    // Select Channel
    window.selectChannel = function(channelId) {
        channelTableState.selectedChannelId = channelId;
        renderChannelTable();
        
        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (editBtn) editBtn.disabled = false;
        if (deleteBtn) deleteBtn.disabled = false;
    };

    // Setup Table Selection
    function setupTableSelection() {
        const tbody = document.getElementById('channel-table-body');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                if (e.target.type === 'radio') {
                    const channelId = parseInt(e.target.value);
                    selectChannel(channelId);
                }
            });
        }
    }

    // Update Pagination Info
    function updatePaginationInfo() {
        const start = (channelTableState.currentPage - 1) * channelTableState.pageSize + 1;
        const end = Math.min(channelTableState.currentPage * channelTableState.pageSize, channelTableState.totalItems);
        const rangeElement = document.getElementById('pagination-range');
        if (rangeElement) {
            rangeElement.textContent = `${start}~${end}`;
        }

        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        if (prevBtn) {
            prevBtn.disabled = channelTableState.currentPage === 1;
        }
        if (nextBtn) {
            const totalPages = Math.ceil(channelTableState.totalItems / channelTableState.pageSize);
            nextBtn.disabled = channelTableState.currentPage >= totalPages;
        }
    }

    // Pagination Functions
    window.previousPage = function() {
        if (channelTableState.currentPage > 1) {
            channelTableState.currentPage--;
            loadChannelTable();
        }
    };

    window.nextPage = function() {
        const totalPages = Math.ceil(channelTableState.totalItems / channelTableState.pageSize);
        if (channelTableState.currentPage < totalPages) {
            channelTableState.currentPage++;
            loadChannelTable();
        }
    };

    window.changePageSize = function() {
        const select = document.getElementById('pageSize');
        if (select) {
            channelTableState.pageSize = parseInt(select.value);
            channelTableState.currentPage = 1;
            loadChannelTable();
        }
    };

    // Clear Filters
    window.clearFilters = function() {
        // Reset filters if any
        loadChannelTable();
    };

    // Card types configuration
    const cardTypes = ['Visa', 'Master', 'AE', 'Maestro', 'Diners', 'Discover', 'JCB'];
    
    // Channel ID generator (mock - should come from backend)
    function generateChannelId(bankName, cardType, index) {
        const baseIds = {
            'FUTUREPAY': { 'Visa': 119601, 'Master': 119701, 'AE': 119801, 'Maestro': 119901, 'Diners': 120001, 'Discover': 120101, 'JCB': 120201 },
            'XNOVA': { 'Maestro': 118701, 'Master': 118201, 'Visa': 117701 },
            'SOLIDPAYMENTSV2': { 'Maestro': 97701, 'Master': 97201, 'Visa': 96701 }
        };
        
        if (baseIds[bankName] && baseIds[bankName][cardType]) {
            return baseIds[bankName][cardType] + (index || 0);
        }
        return 100000 + Math.floor(Math.random() * 10000);
    }

    // Add Channel
    window.addChannel = function() {
        document.getElementById('channelModal').style.display = 'flex';
        resetAddChannelForm();
        updateChannelTable();
    };

    // Update Channel Table based on selections
    window.updateChannelTable = function() {
        const company = document.getElementById('add-company').value;
        const paymentMethod = document.getElementById('add-payment-method').value;
        const bankName = document.getElementById('add-bank-name').value;

        const tbody = document.getElementById('add-channel-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!company || !paymentMethod || !bankName) {
            return;
        }

        // Generate rows for each card type
        cardTypes.forEach((cardType, index) => {
            const channelId = generateChannelId(bankName, cardType, index);
            const channelName = `${bankName}${cardType}`.toUpperCase();
            
            const row = document.createElement('tr');
            row.dataset.cardType = cardType;
            row.dataset.channelId = channelId;
            row.innerHTML = `
                <td>
                    <input type="checkbox" name="selected-card-types" value="${cardType}">
                </td>
                <td>${cardType}</td>
                <td>${channelId}</td>
                <td>
                    <input type="text" name="channel-name-${cardType}" value="${channelName}" class="form-input" style="width: 100%; padding: 6px 8px;">
                </td>
                <td>${paymentMethod}</td>
                <td>
                    <input type="text" name="currencies-${cardType}" value="USD,HKD,EUR,JPY,AUS,NZD,SGD" class="form-input" style="width: 100%; padding: 6px 8px;">
                </td>
                <td>
                    <select name="status-${cardType}" class="form-select" style="width: 100%; padding: 6px 8px; font-size: 13px;">
                        <option value="正常" selected>正常</option>
                        <option value="暂停">暂停</option>
                        <option value="禁用">禁用</option>
                    </select>
                </td>
                <td>
                    <select name="delayed-${cardType}" class="form-select" style="width: 100%; padding: 6px 8px; font-size: 13px;">
                        <option value="否" selected>否</option>
                        <option value="是">是</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;">
                            <input type="checkbox" name="interface-${cardType}" value="[3方]" checked>
                            <span>[3方]</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;">
                            <input type="checkbox" name="interface-${cardType}" value="[2.5方]" checked>
                            <span>[2.5方]</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;">
                            <input type="checkbox" name="interface-${cardType}" value="[直连]">
                            <span>[直连]</span>
                        </label>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    };

    // Reset Add Channel Form
    window.resetAddChannelForm = function() {
        document.getElementById('add-company').value = 'STARSAAS';
        document.getElementById('add-payment-method').value = 'Credit Card';
        document.getElementById('add-bank-name').value = 'FUTUREPAY';
        updateChannelTable();
    };

    // Submit Channels
    window.submitChannels = function() {
        const company = document.getElementById('add-company').value;
        const paymentMethod = document.getElementById('add-payment-method').value;
        const bankName = document.getElementById('add-bank-name').value;

        if (!company || !paymentMethod || !bankName) {
            showMessage('请填写所有必填字段', 'error');
            return;
        }

        const selectedCheckboxes = document.querySelectorAll('input[name="selected-card-types"]:checked');
        if (selectedCheckboxes.length === 0) {
            showMessage('请至少选择一个卡种', 'error');
            return;
        }

        const channelsToAdd = [];
        selectedCheckboxes.forEach(checkbox => {
            const cardType = checkbox.value;
            const row = checkbox.closest('tr');
            const channelId = row.dataset.channelId;
            const channelName = document.querySelector(`input[name="channel-name-${cardType}"]`).value;
            const currencies = document.querySelector(`input[name="currencies-${cardType}"]`).value;
            const status = document.querySelector(`select[name="status-${cardType}"]`).value;
            const isDelayed = document.querySelector(`select[name="delayed-${cardType}"]`).value;
            const interfaceCheckboxes = document.querySelectorAll(`input[name="interface-${cardType}"]:checked`);
            const interfaceType = Array.from(interfaceCheckboxes).map(cb => cb.value).join('');

            channelsToAdd.push({
                companyName: company,
                bankName: bankName,
                cardType: cardType,
                channelId: channelId,
                channelName: channelName,
                paymentMethod: paymentMethod,
                currencies: currencies,
                status: status,
                isDelayed: isDelayed,
                interface: interfaceType,
                operator: 'Current User',
                operationTime: new Date().toISOString().split('T')[0]
            });
        });

        // Add to table (mock - no actual save)
        channelsToAdd.forEach(channel => {
            const newId = Math.max(...channelTableState.channels.map(c => c.id), 0) + 1;
            channelTableState.channels.push({ id: newId, ...channel });
            channelTableState.totalItems++;
        });

        showMessage(`成功添加 ${channelsToAdd.length} 个通道（演示模式）`, 'success');
        closeChannelModal();
        loadChannelTable();
    };

    // Edit Channel
    window.editChannel = function() {
        if (!channelTableState.selectedChannelId) {
            showMessage('请先选择要修改的通道', 'error');
            return;
        }

        const channel = channelTableState.channels.find(c => c.id === channelTableState.selectedChannelId);
        if (!channel) {
            showMessage('找不到选中的通道', 'error');
            return;
        }

        document.getElementById('edit-company-name').value = channel.companyName || '';
        document.getElementById('edit-bank-name').value = channel.bankName || '';
        document.getElementById('edit-card-type').value = channel.cardType || '';
        document.getElementById('edit-channel-id').value = channel.channelId || '';
        document.getElementById('edit-channel-name').value = channel.channelName || '';
        document.getElementById('edit-payment-method').value = channel.paymentMethod || 'Credit Card';
        document.getElementById('edit-currencies').value = channel.currencies || '';
        document.getElementById('edit-channel-status').value = channel.status || '正常';
        document.getElementById('edit-delayed').value = channel.isDelayed || '否';
        document.getElementById('edit-interface').value = channel.interface || '[3方]';

        document.getElementById('editChannelModal').style.display = 'flex';
    };

    // Delete Channel
    window.deleteChannel = function() {
        if (!channelTableState.selectedChannelId) {
            showMessage('请先选择要删除的通道', 'error');
            return;
        }

        const channel = channelTableState.channels.find(c => c.id === channelTableState.selectedChannelId);
        if (!channel) {
            showMessage('找不到选中的通道', 'error');
            return;
        }

        if (!confirm(`确定要删除通道 "${channel.channelName}" 吗？此操作不可恢复。`)) {
            return;
        }

        // Delete via API
        deleteChannelAPI(channelTableState.selectedChannelId);
    };

    // Delete Channel API
    async function deleteChannelAPI(channelId) {
        try {
            const response = await fetch(`/api/channel-binding/admin/channels/${channelId}`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                showMessage('通道删除成功', 'success');
                channelTableState.selectedChannelId = null;
                loadChannelTable();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            // Fallback: remove from local array
            channelTableState.channels = channelTableState.channels.filter(c => c.id !== channelId);
            channelTableState.totalItems--;
            channelTableState.selectedChannelId = null;
            renderChannelTable();
            showMessage('通道已删除（演示模式）', 'success');
        }
    }

    // Save Edit Channel
    window.saveEditChannel = function() {
        const form = document.getElementById('editChannelForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const channelData = {
            companyName: formData.get('companyName'),
            bankName: formData.get('bankName'),
            cardType: formData.get('cardType'),
            channelId: formData.get('channelId'),
            channelName: formData.get('channelName'),
            paymentMethod: formData.get('paymentMethod'),
            currencies: formData.get('currencies'),
            status: formData.get('channelStatus'),
            isDelayed: formData.get('isDelayed'),
            interface: formData.get('interface'),
            operator: 'Current User',
            operationTime: new Date().toISOString().split('T')[0]
        };

        updateChannelAPI(channelTableState.selectedChannelId, channelData);
    };

    // Close Edit Modal
    window.closeEditChannelModal = function() {
        document.getElementById('editChannelModal').style.display = 'none';
        document.getElementById('editChannelForm').reset();
    };

    // Create Channel API
    async function createChannelAPI(channelData) {
        try {
            const response = await fetch('/api/channel-binding/admin/channels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(channelData)
            });

            if (response.ok) {
                showMessage('通道创建成功', 'success');
                closeChannelModal();
                loadChannelTable();
            } else {
                throw new Error('Create failed');
            }
        } catch (error) {
            console.error('Create error:', error);
            // Fallback: add to local array
            const newId = Math.max(...channelTableState.channels.map(c => c.id), 0) + 1;
            channelTableState.channels.push({ id: newId, ...channelData });
            channelTableState.totalItems++;
            closeChannelModal();
            renderChannelTable();
            showMessage('通道已创建（演示模式）', 'success');
        }
    }

    // Update Channel API
    async function updateChannelAPI(channelId, channelData) {
        try {
            const response = await fetch(`/api/channel-binding/admin/channels/${channelId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(channelData)
            });

            if (response.ok) {
                showMessage('通道更新成功', 'success');
                closeChannelModal();
                loadChannelTable();
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            // Fallback: update local array
            const index = channelTableState.channels.findIndex(c => c.id === channelId);
            if (index !== -1) {
                channelTableState.channels[index] = { id: channelId, ...channelData };
                closeChannelModal();
                renderChannelTable();
                showMessage('通道已更新（演示模式）', 'success');
            }
        }
    }

    // Close Add Modal
    window.closeChannelModal = function() {
        document.getElementById('channelModal').style.display = 'none';
        resetAddChannelForm();
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
