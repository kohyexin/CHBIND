# Channel Binding Configuration Page

## Overview

This is a unified, user-friendly channel binding configuration system that includes:

1. **User-facing page** (`channel-binding-config.html`) - Main channel binding configuration page where users configure channels
2. **Admin configuration page** (`channel-binding-admin.html`) - Admin page to configure hints and instructions that display when users select a channel

The system consolidates the multi-step configuration process for YSEPAY Credit Card and RUMBLE MIX channels into a single, streamlined interface.

## Features

### User-Facing Page
- **Single Page Configuration**: All configuration steps in one place, reducing user clicks
- **Step-by-Step Wizard**: Guided 3-step process with progress indicator
- **Dual Channel Support**: YSEPAY Credit Card and RUMBLE MIX configurations
- **Dynamic Hints**: Displays admin-configured images and instructions when channel is selected
- **Real-time Validation**: Form validation on each step
- **Backend Integration Ready**: API endpoints for configuration submission and validation
- **UI Style Consistency**: Matches STAR SAAS Portal design system
- **Chinese Localization**: Full Chinese language support

### Admin Configuration Page
- **Image Upload**: Easy drag-and-drop or click to upload hint images for each channel
- **Text Hints**: Optional text hints that display below images
- **Live Preview**: See exactly how hints will appear to users
- **Channel Management**: Configure hints separately for each channel (YSEPAY, RUMBLE, etc.)
- **Easy Management**: Simple interface for admins to update channel instructions

## Files

- `channel-binding-config.html` - Main channel binding configuration page
- `channel-binding-config.css` - Styling matching portal UI
- `channel-binding-config.js` - Form handling and backend integration
- `channel-binding-admin.html` - Admin configuration page for channel hints
- `channel-binding-admin.js` - Admin page JavaScript
- `CHANNEL_BINDING_README.md` - This documentation

## Integration Steps

### 1. Additional API Endpoints Needed

#### GET `/api/merchants/list`

Get list of merchants for dropdown selection.

**Response:**
```json
{
  "merchants": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

#### GET `/api/merchants/{merchantId}/sub-accounts`

Get list of sub-accounts for a merchant.

**Response:**
```json
{
  "subAccounts": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

#### GET `/api/channel-binding/admin/config`

Get all channel hint configurations (for admin page).

**Response:**
```json
{
  "ysepay": {
    "imageUrl": "string (URL to uploaded image)",
    "textHint": "string (optional text hint)"
  },
  "rumble": {
    "imageUrl": "string (URL to uploaded image)",
    "textHint": "string (optional text hint)"
  }
}
```

#### POST `/api/channel-binding/admin/config`

Save all channel hint configurations (for admin page - optional, for bulk save).

**Request Body:**
```json
{
  "ysepay": {
    "imageData": "string (base64 encoded image or URL)",
    "textHint": "string (optional)"
  },
  "rumble": {
    "imageData": "string (base64 encoded image or URL)",
    "textHint": "string (optional)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configurations saved successfully"
}
```

#### POST `/api/channel-binding/admin/config/{channel}`

Save hint configuration for a specific channel (recommended - allows saving individual channels).

**Path Parameters:**
- `channel`: "ysepay" or "rumble"

**Request Body:**
```json
{
  "imageData": "string (base64 encoded image or URL)",
  "textHint": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration saved successfully"
}
```

#### GET `/api/channel-binding/admin/config/{channel}`

Get hint configuration for a specific channel (for user-facing page).

**Response:**
```json
{
  "imageUrl": "string",
  "imageData": "string (base64, optional)",
  "textHint": "string (optional)"
}
```

### 2. Admin Configuration Page

The admin configuration page (`channel-binding-admin.html`) allows administrators to:

1. **Upload hint images** for each channel (e.g., RUMBLE callback URL configuration guide)
2. **Add text hints** that display below images
3. **Preview** how hints will appear to users
4. **Save configurations** that are automatically loaded when users select channels

**Navigation Path**: 商户 > 绑定渠道配置

### 3. Add to Portal Navigation

Add the page to the portal's navigation menu under "商户" (Merchant) section:

```html
<li>
    <a href="/portal/channel-binding-config.html">渠道绑定配置</a>
</li>
```

### 2. Backend API Endpoints

The page expects two backend API endpoints:

#### POST `/api/channel-binding/configure`

Submit channel configuration.

**Request Body (YSEPAY):**
```json
{
  "channelType": "ysepay",
  "paymentType": "credit_card",
  "channel": "ysepay",
  "merchantName": "string (merchant ID from selection)",
  "subAccount": "string (sub-account ID from selection)",
  "accountName": "string (custom account name)",
  "merchantId": "string (from YSEPAY)",
  "subMerchant": "string (from YSEPAY)",
  "keyAesKey": "string (Key__AesKey format: 'key__aeskey')",
  "channelName": "string (auto-generated)",
  "paymentMethods": ["all"],
  "currency": ["USD"],
  "currencyDefault": boolean,
  "supportedCountries": ["string"] (optional),
  "platform": ["string"] (optional)
}
```

**Request Body (RUMBLE MIX):**
```json
{
  "channelType": "rumble",
  "paymentType": "mix",
  "channel": "rumble",
  "merchantName": "string (merchant ID from selection)",
  "subAccount": "string (sub-account ID from selection)",
  "accountName": "string (custom account name)",
  "authToken": "string (from RUMBLE)",
  "channelName": "string (auto-generated)",
  "paymentMethods": ["mix"],
  "currency": ["INR"],
  "currencyDefault": boolean,
  "supportedCountries": ["string"] (optional),
  "platform": ["string"] (optional)
}
```

**Response:**
```json
{
  "success": true,
  "configId": "string",
  "message": "string"
}
```

#### POST `/api/channel-binding/validate/{configId}`

Validate the configuration after submission.

**Response:**
```json
{
  "success": true,
  "message": "string"
}
```

### 3. Backend Implementation Example (Java/Spring Boot)

```java
@RestController
@RequestMapping("/api/channel-binding")
public class ChannelBindingController {

    @PostMapping("/configure")
    public ResponseEntity<Map<String, Object>> configureChannel(
            @RequestBody ChannelConfigRequest request) {
        
        try {
            // Validate request
            validateRequest(request);
            
            // Save configuration to database
            String configId = channelBindingService.saveConfiguration(request);
            
            // Perform initial validation
            boolean isValid = channelBindingService.validateConfiguration(configId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("configId", configId);
            response.put("message", "Configuration saved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/validate/{configId}")
    public ResponseEntity<Map<String, Object>> validateConfiguration(
            @PathVariable String configId) {
        
        try {
            // Retrieve configuration
            ChannelConfig config = channelBindingService.getConfiguration(configId);
            
            // Perform validation (API connectivity test, etc.)
            ValidationResult result = channelBindingService.performValidation(config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isValid());
            response.put("message", result.getMessage());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
```

### 4. Database Schema Example

```sql
CREATE TABLE channel_binding_config (
    id VARCHAR(50) PRIMARY KEY,
    channel_type VARCHAR(20) NOT NULL,
    merchant_id VARCHAR(100) NOT NULL,
    merchant_name VARCHAR(200),
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    environment VARCHAR(20),
    currency VARCHAR(10),
    api_endpoint VARCHAR(500),
    callback_url VARCHAR(500),
    notify_url VARCHAR(500),
    timeout INT,
    retry_count INT,
    encryption_key VARCHAR(500),
    ip_whitelist TEXT,
    enable_ssl BOOLEAN,
    enable_logging BOOLEAN,
    payment_methods TEXT, -- JSON array for RUMBLE
    status VARCHAR(20), -- pending, active, failed
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    validated_at TIMESTAMP
);
```

## Configuration Steps

### Step 1: Basic Information
- Merchant ID and Name
- API Credentials (Key and Secret)
- Environment Selection (Sandbox/Production)
- Currency Selection
- Payment Methods (for RUMBLE MIX)

### Step 2: API Configuration
- API Endpoint URL
- Callback URL
- Notify URL
- Request Timeout
- Retry Count

### Step 3: Security Settings
- Encryption Key (optional)
- IP Whitelist
- SSL/TLS Settings
- Logging Configuration

## User Experience Improvements

### Before (Multi-page Process)
1. Navigate to Channel Setup page
2. Select channel type
3. Fill basic information → Save → Next page
4. Configure API settings → Save → Next page
5. Set security options → Save → Next page
6. Validate configuration → Separate page
7. **Total: 6+ clicks, 4+ page loads**

### After (Single Page)
1. Navigate to Channel Binding Configuration page
2. Select channel type (YSEPAY or RUMBLE MIX)
3. Fill all information in guided steps
4. Submit once → Backend handles all steps
5. **Total: 2 clicks, 1 page load**

## Customization

### Adding New Channel Types

1. Add new radio option in HTML:
```html
<label class="channel-option">
    <input type="radio" name="channelType" value="newchannel">
    <div class="channel-box">
        <div class="channel-icon">🔷</div>
        <div class="channel-info">
            <div class="channel-name">New Channel</div>
            <div class="channel-desc">新渠道描述</div>
        </div>
    </div>
</label>
```

2. Add form structure in HTML (similar to YSEPAY/RUMBLE forms)

3. Update JavaScript `handleChannelChange` function to handle new channel type

### Modifying Form Fields

Fields can be easily added/removed by modifying the form sections in the HTML. The JavaScript will automatically handle validation and data collection.

## Security Considerations

1. **API Credentials**: Always encrypt sensitive data (API keys, secrets) before storing in database
2. **IP Whitelist**: Validate and sanitize IP addresses
3. **URL Validation**: Ensure callback and notify URLs are valid and secure
4. **HTTPS**: Enforce HTTPS for all API endpoints
5. **Authentication**: Add authentication/authorization checks to API endpoints

## Testing

### Manual Testing Checklist

- [ ] Channel type selection works
- [ ] Step navigation (Next/Previous) works
- [ ] Form validation on each step
- [ ] Password toggle functionality
- [ ] Form reset functionality
- [ ] Backend API integration
- [ ] Success/error message display
- [ ] Loading overlay during submission
- [ ] Responsive design on mobile devices

### Test Data

**YSEPAY Test Credentials:**
```
Merchant ID: YOUR_MERCHANT_ID
API Key: YOUR_API_KEY
API Secret: YOUR_API_SECRET
Environment: Sandbox
```

**RUMBLE MIX Test Credentials:**
```
Merchant ID: YOUR_MERCHANT_ID
API Key: YOUR_API_KEY
API Secret: YOUR_API_SECRET
Environment: Sandbox
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- IE11+ (with polyfills)

## Future Enhancements

1. **Configuration Templates**: Save and reuse common configurations
2. **Bulk Import**: Import multiple channel configurations via CSV
3. **Configuration History**: View and restore previous configurations
4. **Test Mode**: Test configuration before activating
5. **Advanced Validation**: More comprehensive API connectivity tests
6. **Configuration Export**: Export configuration as JSON/PDF

## Support

For issues or questions, please contact the development team or refer to the portal documentation.

---

*Last Updated: 2026-01-14*
