# How to Preview the Channel Binding Configuration Page

## Quick Preview (Simple Method)

### Option 1: Direct File Open
1. Navigate to the folder: `D:\Cursor\paygate\`
2. Double-click `channel-binding-config.html`
3. The page will open in your default browser

**Note:** Some features may not work perfectly (like API calls) when opened directly, but you can see the UI and interact with the form.

---

## Proper Preview (Recommended - Local Web Server)

### Option 2: Using Python (Windows/Mac/Linux)

#### Windows:
1. Open Command Prompt or PowerShell in the project folder
2. Run:
   ```bash
   python -m http.server 8000
   ```
   Or double-click `start-server.bat`

3. Open your browser and go to:
   ```
   http://localhost:8000/channel-binding-config.html
   ```

#### Mac/Linux:
1. Open Terminal in the project folder
2. Run:
   ```bash
   python3 -m http.server 8000
   ```
   Or make it executable and run:
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```

3. Open your browser and go to:
   ```
   http://localhost:8000/channel-binding-config.html
   ```

---

### Option 3: Using Node.js (if you have it installed)

1. Install a simple HTTP server globally:
   ```bash
   npm install -g http-server
   ```

2. Navigate to the project folder and run:
   ```bash
   http-server -p 8000
   ```

3. Open your browser and go to:
   ```
   http://localhost:8000/channel-binding-config.html
   ```

---

### Option 4: Using VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `channel-binding-config.html`
3. Select "Open with Live Server"
4. The page will automatically open in your browser

---

## Testing the Page

### What Works Without Backend:
- ✅ UI/UX - All visual elements
- ✅ Form navigation (Next/Previous buttons)
- ✅ Step-by-step wizard
- ✅ Form validation
- ✅ Channel type switching (YSEPAY/RUMBLE)
- ✅ Password toggle
- ✅ Form reset
- ✅ Auto-generated channel names

### What Requires Backend:
- ❌ Loading merchant/sub-account lists (will show empty dropdowns)
- ❌ Form submission (will show mock success message)
- ❌ Configuration validation

---

## Mock Data for Testing

Since the backend APIs aren't connected yet, the form will use mock responses. You can test the form by:

1. **Selecting Channel Type**: Click YSEPAY or RUMBLE MIX
2. **Filling Form Fields**: 
   - For YSEPAY: Fill in Merchant ID, Sub-merchant, Key, AesKey
   - For RUMBLE: Fill in authToken
3. **Navigating Steps**: Use Next/Previous buttons
4. **Submitting**: Click "提交配置" - it will show a mock success message

---

## Integration with Portal

To integrate this page into your STAR SAAS portal:

1. **Copy files to portal directory**:
   - `channel-binding-config.html`
   - `channel-binding-config.css`
   - `channel-binding-config.js`

2. **Update HTML paths** (if needed):
   ```html
   <link rel="stylesheet" href="/portal/css/channel-binding-config.css">
   <script src="/portal/js/channel-binding-config.js"></script>
   ```

3. **Add to navigation menu**:
   ```html
   <li>
       <a href="/portal/channel-binding-config.html">渠道绑定配置</a>
   </li>
   ```

4. **Update API endpoints in JavaScript**:
   - Edit `channel-binding-config.js`
   - Update the endpoint URLs to match your backend:
   ```javascript
   const endpoint = '/api/channel-binding/configure';
   ```

---

## Troubleshooting

### Page doesn't load styles/scripts
- Make sure all three files are in the same folder:
  - `channel-binding-config.html`
  - `channel-binding-config.css`
  - `channel-binding-config.js`

### CORS errors when testing
- Use a local web server (Option 2, 3, or 4) instead of opening the file directly
- Or configure your browser to allow local file access

### Dropdowns are empty
- This is expected without backend integration
- The merchant/sub-account lists need to be loaded from your backend API
- See `CHANNEL_BINDING_README.md` for API endpoint details

### Form submission shows error
- Check browser console (F12) for error messages
- Make sure you're using a local web server, not opening the file directly
- The mock API responses will work even without a backend

---

## Next Steps

1. **Preview the page** using one of the methods above
2. **Test the UI/UX** and form flow
3. **Integrate with backend** APIs (see `CHANNEL_BINDING_README.md`)
4. **Customize** fields if needed based on your requirements
5. **Deploy** to your portal

---

*For questions or issues, refer to the main README or contact the development team.*
