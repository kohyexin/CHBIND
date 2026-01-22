# Agent Page Interaction Guide

This document explains how the Configuration Agent can interact with the page to automatically fill form fields based on user conversations.

## Overview

The Configuration Agent (`starconfigurator`) has the ability to control page elements **indirectly** through structured JSON responses. When a user selects options in the chat (e.g., "I want to use STAR SAAS"), the agent should respond with JSON containing actions, which the system will automatically execute to update the form fields.

**Important:** The agent itself cannot directly manipulate the DOM, but it CAN control the page by responding with JSON that includes both a message and actions. The system parses this JSON and executes the actions automatically.

## How It Works

1. **Agent Response Format**: The agent should respond with JSON that includes both a user-friendly message and actions to perform:

```json
{
  "message": "I've selected STAR SAAS as the merchant for you. The form has been updated automatically.",
  "actions": [
    {
      "type": "select",
      "field": "merchant-name",
      "value": "starsaas"
    }
  ]
}
```

2. **Response Parsing**: The chat component automatically detects JSON in the agent's response and extracts:
   - `message`: Displayed to the user in the chat
   - `actions`: Executed on the page automatically

3. **Action Execution**: Actions are executed after the message is displayed, updating the form in the background.

## Supported Actions

### 1. Select Action (Dropdown Selection)

Selects an option in a dropdown field.

```json
{
  "type": "select",
  "field": "merchant-name",
  "value": "starsaas"
}
```

**Parameters:**
- `type`: `"select"` (required)
- `field`: Field ID or name (required)
- `value`: Option value to select (required)
- `text`: Alternative - option text to match (optional)

**Available Fields:**
- `merchant-name`: Merchant selection dropdown
- `sub-account`: Sub-account selection (depends on merchant)
- `channel`: Channel selection (ysepay, rumble, evonet, paysaas)
- `payment-type`: Payment type (credit_card, mix)

**Example:**
```json
{
  "message": "I've configured STAR SAAS as your merchant and selected YSEPAY as the channel.",
  "actions": [
    {
      "type": "select",
      "field": "merchant-name",
      "value": "starsaas"
    },
    {
      "type": "select",
      "field": "channel",
      "value": "ysepay"
    }
  ]
}
```

### 2. Input Action (Text Input)

Sets a value in a text input field.

```json
{
  "type": "input",
  "field": "merchant-id",
  "value": "12345678"
}
```

**Parameters:**
- `type`: `"input"` (required)
- `field`: Field ID or name (required)
- `value`: Value to set (required)

### 3. Click Action

Clicks a button or element.

```json
{
  "type": "click",
  "id": "nextBtn"
}
```

**Parameters:**
- `type`: `"click"` (required)
- `id`: Element ID (optional)
- `selector`: CSS selector (optional)

### 4. Navigate Action

Navigates to a different step or tab.

```json
{
  "type": "navigate",
  "step": 2
}
```

**Parameters:**
- `type`: `"navigate"` (required)
- `step`: Step number (1-3) (optional)
- `tab`: Tab name (optional)

## Response Format Options

The agent can provide structured responses in three ways:

### Option 1: Direct JSON

```json
{
  "message": "I've selected STAR SAAS for you.",
  "actions": [{"type": "select", "field": "merchant-name", "value": "starsaas"}]
}
```

### Option 2: JSON in Markdown Code Block

```
I've selected STAR SAAS for you.

```json
{
  "message": "I've selected STAR SAAS for you.",
  "actions": [{"type": "select", "field": "merchant-name", "value": "starsaas"}]
}
```
```

### Option 3: Mixed Response (Message + JSON)

```
I've selected STAR SAAS for you. The form will be updated automatically.

{"message": "I've selected STAR SAAS for you.", "actions": [{"type": "select", "field": "merchant-name", "value": "starsaas"}]}
```

## Merchant Values

Common merchant values:
- `starsaas` or `STARSAAS` → STAR SAAS
- `nbcpay` or `NbcPay` → NbcPay
- `nexpay` or `NexPay` → NexPay

The system will match by value (case-insensitive) or by text content.

## Channel Values

- `ysepay` → YSEPAY
- `rumble` → RUMBLE
- `evonet` → EVONET
- `paysaas` → PAYSAAS

## Example Conversations

### Example 1: Merchant Selection

**User:** "I want to use STAR SAAS"

**Agent Response:**
```json
{
  "message": "Perfect! I've selected STAR SAAS as your merchant. The form has been updated.",
  "actions": [
    {
      "type": "select",
      "field": "merchant-name",
      "value": "starsaas"
    }
  ]
}
```

### Example 2: Multiple Selections

**User:** "Set merchant to STAR SAAS and channel to YSEPAY"

**Agent Response:**
```json
{
  "message": "I've configured STAR SAAS as your merchant and YSEPAY as your channel. The payment type has been automatically set to credit card.",
  "actions": [
    {
      "type": "select",
      "field": "merchant-name",
      "value": "starsaas"
    },
    {
      "type": "select",
      "field": "channel",
      "value": "ysepay"
    }
  ]
}
```

### Example 3: With Sub-account

**User:** "Use STAR SAAS with sub-account STARSAAS-001"

**Agent Response:**
```json
{
  "message": "I've selected STAR SAAS and sub-account STARSAAS-001 for you.",
  "actions": [
    {
      "type": "select",
      "field": "merchant-name",
      "value": "starsaas"
    },
    {
      "type": "select",
      "field": "sub-account",
      "value": "starsaas-001"
    }
  ]
}
```

## Important Notes

1. **Only Configuration Agent**: Page interaction is only enabled for the Configuration Agent (`starconfigurator`). Other agents (CS, Self-Onboarding) cannot control the page.

2. **Action Execution**: Actions are executed automatically after the message is displayed. There's a 100ms delay to ensure the UI is ready.

3. **Error Handling**: If an action fails (e.g., field not found), it will be logged to the console but won't interrupt the conversation.

4. **Form Validation**: Actions update form fields, but standard form validation still applies. Users may need to complete required fields manually.

5. **Dependent Fields**: When a merchant is selected, sub-accounts are automatically loaded. The agent should wait for this before selecting a sub-account, or select it in a follow-up action.

## Testing

To test page interaction:

1. Switch to the Configuration Agent in the chat
2. Ask: "Select STAR SAAS as the merchant"
3. The agent should respond with JSON containing actions
4. The form should automatically update

## Debugging

### Console Logs

Check the browser console for detailed logs:

1. **Agent Interaction Check:**
   - `[Foundry Chat] Agent interaction check:` - Shows if agent can interact
   - Should show `canInteract: true` for Configuration Agent

2. **Response Parsing:**
   - `[Foundry Chat] Attempting to parse agent response for actions...`
   - `[Foundry Chat] Successfully parsed response:` - JSON was found and parsed
   - `[Foundry Chat] No structured JSON found in response` - Agent didn't respond with JSON

3. **Action Execution:**
   - `[Page Actions] executePageActions called with:` - Actions received
   - `[Page Actions] Executing X action(s)` - Starting execution
   - `[Page Actions] Selected field: "old" → "new"` - Field updated successfully
   - `[Page Actions] Option not found for ...` - Value doesn't match

### Common Issues

#### Issue 1: Agent Not Responding with JSON

**Symptom:** Console shows "No structured JSON found in response"

**Solution:** The agent needs to be configured to respond with JSON. The agent should respond in this format:
```json
{
  "message": "I've selected STAR SAAS for you.",
  "actions": [{"type": "select", "field": "merchant-name", "value": "starsaas"}]
}
```

#### Issue 2: Actions Not Executing

**Symptom:** Console shows actions parsed but not executed

**Check:**
1. Verify `window.executePageActions` exists: `console.log(typeof window.executePageActions)`
2. Verify `channel-binding-config.js` is loaded before `foundry-chat.js`
3. Check for JavaScript errors in console

#### Issue 3: Field Not Found

**Symptom:** Console shows "Element not found for field: ..."

**Solution:** 
- Verify field ID matches exactly: `merchant-name`, `channel`, `payment-type`, `sub-account`
- Check: `document.getElementById('merchant-name')` in console

#### Issue 4: Option Not Found

**Symptom:** Console shows "Option not found for ..."

**Solution:**
- Check available options: `Array.from(document.getElementById('merchant-name').options).map(o => o.value)`
- Verify value matches exactly (case-insensitive): `starsaas`, `ysepay`, etc.
- Try using `text` parameter instead of `value` in action

### Manual Testing

Test the action executor directly in console:

```javascript
// Test 1: Check if function exists
console.log('executePageActions:', typeof window.executePageActions);

// Test 2: Get form info
console.log('Form fields:', window.getFormFieldsInfo());

// Test 3: Manually execute an action
window.executePageActions([
    {
        type: 'select',
        field: 'merchant-name',
        value: 'starsaas'
    }
]);

// Test 4: Check if field was updated
console.log('Merchant value:', document.getElementById('merchant-name').value);
```

### Agent Response Format Examples

The agent MUST respond with JSON. Here are valid formats:

**Format 1: Pure JSON**
```json
{"message": "Done.", "actions": [{"type": "select", "field": "merchant-name", "value": "starsaas"}]}
```

**Format 2: JSON in Code Block**
```
I've updated the form.

```json
{"message": "Done.", "actions": [{"type": "select", "field": "merchant-name", "value": "starsaas"}]}
```
```

**Format 3: Mixed (Text + JSON)**
```
I've selected STAR SAAS for you. {"message": "Done.", "actions": [{"type": "select", "field": "merchant-name", "value": "starsaas"}]}
```

### Verifying Agent Configuration

Check that the configurator agent has `canInteractWithPage: true`:

```javascript
// In browser console
console.log('Available agents:', window.FOUNDRY_AVAILABLE_AGENTS);
console.log('Configurator agent:', window.FOUNDRY_AVAILABLE_AGENTS?.configurator);
```

You can also call `window.getFormFieldsInfo()` in the console to see available fields and current values.
