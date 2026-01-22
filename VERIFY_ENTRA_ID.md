# How to Verify Entra ID Credentials

## Step-by-Step Verification Guide

### 1. Verify Tenant ID

**Location:** Azure Portal → Microsoft Entra ID → Overview

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Microsoft Entra ID" or "Azure Active Directory"
3. Click on it
4. In the **Overview** page, you'll see:
   - **Tenant ID** (also called "Directory ID")
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (GUID)
   - Example: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Your Tenant ID should be:** `YOUR_TENANT_ID_HERE` (replace with your actual Tenant ID)

---

### 2. Verify Client ID (Application ID)

**Location:** Azure Portal → Microsoft Entra ID → App registrations → Your App

1. Go to Azure Portal → Microsoft Entra ID
2. Click **"App registrations"** in the left menu
3. Find your app: **"AI Chat Proxy"** (or "Foundry Chat Proxy")
4. Click on it
5. In the **Overview** page, you'll see:
   - **Application (client) ID** 
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (GUID)
   - Example: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Your Client ID should be:** `YOUR_CLIENT_ID_HERE` (replace with your actual Client ID)

---

### 3. Verify Client Secret

**Location:** Azure Portal → Microsoft Entra ID → App registrations → Your App → Certificates & secrets

1. Go to Azure Portal → Microsoft Entra ID → App registrations
2. Click on your app: **"AI Chat Proxy"**
3. Click **"Certificates & secrets"** in the left menu
4. Go to **"Client secrets"** tab
5. You'll see a table with:
   - **Description** (e.g., "AI Chat Proxy Secret")
   - **Value** - This is what you need! (Shows as a long string like `xxxxx~xxxxx...`)
   - **Secret ID** - DO NOT use this (it's a GUID)
   - **Expires** (date)

**Important:**
- ✅ Use the **Value** column (long string like `xxxxx~xxxxx...` - typically 40+ characters)
- ❌ Do NOT use the **Secret ID** column (GUID format like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- If the Value is hidden (shows as `***`), you need to create a new secret

**If Value is hidden:**
1. Click **"+ New client secret"**
2. Enter description: "Foundry Chat Proxy"
3. Choose expiration
4. Click **"Add"**
5. **IMMEDIATELY copy the Value** (it's only shown once!)

---

### 4. Verify Role Assignment

**Location:** Azure Portal → Foundry Resource → Access control (IAM)

1. Go to Azure Portal
2. Search for: `starcs-agent-resource`
3. Click on the Foundry resource
4. Click **"Access control (IAM)"** in the left menu
5. Click **"Role assignments"** tab
6. Look for your App Registration: **"AI Chat Proxy"**
7. Verify it has one of these roles:
   - ✅ **"Azure AI Developer"** (recommended)
   - ✅ **"Azure AI Account Owner"**
   - ✅ **"Contributor"**

**If role is missing or 403 error persists:**

**Option A: Assign at Subscription Level (Recommended)**
1. Go to Azure Portal → **Subscriptions**
2. Click on your subscription (e.g., "Azure subscription 1")
3. Click **"Access control (IAM)"** in the left menu
4. Click **"+ Add"** → **"Add role assignment"**
5. Role tab → Search: `Azure AI Developer` or `Contributor`
6. Select **"Azure AI Developer"** (or "Contributor")
7. Click **"Next"**
8. Assign access to: **"User, group, or service principal"**
9. Click **"+ Select members"**
10. Search for: **"AI Chat Proxy"**
11. Select it → **"Select"**
12. Click **"Review + assign"** → **"Review + assign"** again
13. Wait 5-10 minutes for propagation

**Option B: Assign at Resource Group Level**
1. Go to Azure Portal → Resource Groups
2. Find your resource group: `rg-r.koh-1511` (or the one containing your Foundry resource)
3. Click on it → **"Access control (IAM)"**
4. Follow steps 4-13 from Option A above

**Option C: Verify Foundry Resource Level (Already Done)**
- You already have "Azure AI Developer" and "Azure AI Account Owner" at resource level
- If 403 persists, try Option A (Subscription level)

---

## Quick Verification Checklist

Before starting the proxy server, verify:

- [ ] **Tenant ID:** `YOUR_TENANT_ID` (from Entra ID → Overview)
- [ ] **Client ID:** `YOUR_CLIENT_ID` (from App Registration → Overview)
- [ ] **Client Secret:** Long string (from App Registration → Certificates & secrets → Value column)
- [ ] **Role Assignment:** "AI Chat Proxy" has "Azure AI Developer" role (from Foundry Resource → IAM)

---

## Setting Environment Variables

Once verified, set them:

**Windows (CMD):**
```cmd
set AZURE_TENANT_ID=
set AZURE_CLIENT_ID=
set AZURE_CLIENT_SECRET=
```

**Windows (PowerShell):**
```powershell
$env:AZURE_TENANT_ID=""
$env:AZURE_CLIENT_ID=""
$env:AZURE_CLIENT_SECRET=""
```

**Verify they're set:**
```cmd
echo %AZURE_TENANT_ID%
echo %AZURE_CLIENT_ID%
echo %AZURE_CLIENT_SECRET%
```

---

## Common Issues

### "HTTP 401: Unauthorized"

This error means authentication failed. Follow these steps:

**Step 1: Check Environment Variables**
1. Verify all three variables are set:
   ```powershell
   # PowerShell
   echo $env:AZURE_TENANT_ID
   echo $env:AZURE_CLIENT_ID
   echo $env:AZURE_CLIENT_SECRET
   ```
2. If any are empty, set them:
   ```powershell
   $env:AZURE_TENANT_ID="YOUR_TENANT_ID"
   $env:AZURE_CLIENT_ID="YOUR_CLIENT_ID"
   $env:AZURE_CLIENT_SECRET="YOUR_CLIENT_SECRET_VALUE"
   ```

**Step 2: Use Diagnostic Endpoint**
1. Start the proxy server: `npm start`
2. Open browser: `http://localhost:3001/diagnose-auth`
3. Check the response for specific issues

**Step 3: Verify Credentials**
- ✅ **Tenant ID:** Should be GUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ✅ **Client ID:** Should be GUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ✅ **Client Secret:** Should be long string (40+ chars), NOT a GUID
  - ❌ Wrong: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (this is Secret ID - GUID format)
  - ✅ Correct: `xxxxx~xxxxx...` (this is Value - long string, typically 40+ characters)

**Step 4: Check Client Secret Expiration**
1. Go to Azure Portal → Entra ID → App registrations → "AI Chat Proxy"
2. Click "Certificates & secrets"
3. Check if your secret has expired
4. If expired, create a new one and update `AZURE_CLIENT_SECRET`

**Step 5: Verify App Registration Exists**
1. Go to Azure Portal → Entra ID → App registrations
2. Search for "AI Chat Proxy"
3. Verify it exists and matches your Client ID

**Step 6: Check Server Logs**
- Look for "Token request failed" messages
- Check for specific error codes:
  - `AADSTS7000215`: Invalid client secret
  - `AADSTS700016`: Application not found
  - `AADSTS70011`: Invalid scope

**Step 7: Restart Proxy Server**
After fixing any issues, restart the server:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
```

### "Token request failed: 400 Bad Request"
- Check Tenant ID is correct (no extra quotes)
- Check Client ID is correct
- Check Client Secret is the **Value** (not Secret ID)
- Make sure Client Secret hasn't expired

### "403 Forbidden - does not have permissions"
- **Error:** `does not have permissions for Microsoft.MachineLearningServices/workspaces/agents/action`
- **Solution:** The role needs to be assigned at a higher scope (Subscription or Resource Group level)
- Try assigning "Azure AI Developer" or "Contributor" at:
  1. **Subscription level** (recommended) - Azure Portal → Subscriptions → Your Subscription → IAM
  2. **Resource Group level** - Azure Portal → Resource Groups → Your Resource Group → IAM
- Wait 5-10 minutes after assigning role for propagation
- Restart the proxy server after waiting
- The permission check happens at ML workspace level, so subscription-level assignment usually works

### "Invalid client secret provided"
- You're using Secret ID instead of Value
- Secret ID = GUID (36 characters with hyphens) ❌
- Value = Long string (40+ characters, no hyphens) ✅
