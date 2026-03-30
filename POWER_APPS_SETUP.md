# Power Apps Canvas App Integration Guide

## Overview
This guide helps you build a Canvas App in Power Apps that integrates with your DirectLine Bot Chat API.

## Prerequisites
- Power Apps account (Office 365 or standalone)
- Your API endpoints from: https://copilot-agent-kappa.vercel.app
- DirectLine Token and API URL (already configured in Vercel)

## API Endpoints Available

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/init` | POST | Initialize conversation with the bot |
| `/api/chat` | POST | Send message to bot and get response |
| `/api/clear-history` | POST | Clear conversation history |

## Step-by-Step Setup

### 1. Create a New Canvas App

1. Go to [Power Apps](https://make.powerapps.com)
2. Click **+ Create** → **Canvas app from blank**
3. Name it: `DirectLine Bot Chat`
4. Choose **Tablet** or **Phone** layout
5. Click **Create**

### 2. Set Up Variables and Collections

In your app's **OnStart** property, add this code:

```powershell
Set(sessionId, "session_" & Text(Now(), "yyyymmddhhmmss") & "_" & RANDBETWEEN(1000, 9999));
Set(conversationInitialized, false);
Set(conversationId, "");
Set(isLoading, false);
ClearCollect(chatMessages, {id: 1, sender: "assistant", message: "👋 Hello! I'm your bot assistant. Ask me anything!", timestamp: Now()});
```

### 3. Add HTTP Connectors

#### 3.1 Initialize Conversation
Create a function called `InitConversation`:

```powershell
Set(isLoading, true);
Set(statusText, "Initializing...");

If(
    IsBlank(conversationId),
    Set(initResponse, 
        JSON.Parse(
            Text(
                Office365Outlook.SendEmailV2(
                    {
                        "To": " ",
                        "Subject": " ",
                        "Body": " "
                    }
                )
            )
        )
    ),
    Set(statusText, "Connected!")
);

Set(isLoading, false);
```

**Better approach - Use HTTP connector directly:**

1. In the app, select **Action** → **New action**
2. Search for **HTTP**
3. Configure:
   - **Method**: POST
   - **URL**: `https://copilot-agent-kappa.vercel.app/api/init`
   - **Headers**: 
     ```
     {
       "Content-Type": "application/json"
     }
     ```
   - **Body**: 
     ```
     {
       "sessionId": sessionId
     }
     ```

### 4. Build the User Interface

#### Layout Structure:
```
┌─────────────────────────────┐
│  DirectLine Bot Chat        │
├─────────────────────────────┤
│                             │
│  [Chat Messages Display]    │
│                             │
├─────────────────────────────┤
│  Status: Ready              │
├─────────────────────────────┤
│  [Input TextInput]          │
│  [Send Button] [Clear Btn]  │
└─────────────────────────────┘
```

### 5. Add Controls

**Header:**
- Label: "🤖 DirectLine Bot Chat"
- Label: "Chat with your Microsoft Bot Framework powered agent"

**Chat Display:**
- Gallery control (vertical)
  - Name: `chatGallery`
  - Items: `chatMessages`
  - Template:
    ```
    Container with:
    - Label for message text
    - Format: Right-aligned for user, left-aligned for assistant
    ```

**Input Area:**
- TextInput control
  - Name: `messageInput`
  - Placeholder: "Type your message..."
- Button: "Send"
  - OnSelect: `SendMessage()`
- Button: "Clear"
  - OnSelect: `ClearConversation()`

**Status Bar:**
- Label: `statusText`

### 6. Implement Send Message Function

```powershell
SendMessage:
Set(isLoading, true);
Set(statusText, "Sending...");

// Add user message to gallery
Collect(
    chatMessages, 
    {
        id: Max(chatMessages, id) + 1,
        sender: "user",
        message: messageInput.Value,
        timestamp: Now()
    }
);

// Clear input
Set(messageInput, "");

// Send to bot
Set(chatResponse, 
    JSON(
        {
            method: "POST",
            url: "https://copilot-agent-kappa.vercel.app/api/chat",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON({
                "message": messageInput.Value,
                "sessionId": sessionId
            })
        }
    )
);

// Parse response and add to chat
Set(botMessage, chatResponse.message);
Collect(
    chatMessages,
    {
        id: Max(chatMessages, id) + 1,
        sender: "assistant",
        message: botMessage,
        timestamp: Now()
    }
);

Set(isLoading, false);
Set(statusText, "Ready");
```

### 7. Alternative: Use Power Automate Flow

For better error handling, create a Power Automate Flow:

1. Go to [Power Automate](https://make.powerautomate.com)
2. Create **Instant cloud flow** → **Cloud flows**
3. Name it: `DirectLineChat`
4. Add trigger: **When Power Apps calls a flow**
5. Add actions:
   - **HTTP** action to call your API
   - **Parse JSON** to handle response
   - **Respond to PowerApp** with the result

### 8. Styling

Set this color scheme in your app:
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)
- Background: `#f8f9fa` (Light Gray)
- User message: `#667eea` (Purple)
- Bot message: `#ffffff` (White)

## API Connection Details

**Base URL**: `https://copilot-agent-kappa.vercel.app`

**Init Endpoint:**
- URL: `/api/init`
- Method: POST
- Body: `{"sessionId": "<unique-session-id>"}`
- Response: `{"success": true, "conversationId": "<id>"}`

**Chat Endpoint:**
- URL: `/api/chat`
- Method: POST
- Body: `{"message": "<text>", "sessionId": "<session-id>"}`
- Response: `{"success": true, "message": "<bot-response>"}`

**Clear Endpoint:**
- URL: `/api/clear-history`
- Method: POST
- Body: `{"sessionId": "<session-id>"}`
- Response: `{"success": true}`

## Testing

1. Start the app
2. Click **Send** with a test message
3. Verify the bot response appears in the chat
4. Test the **Clear** button

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 errors | Verify API endpoint URL |
| CORS errors | Check CORS is enabled on server |
| No response | Verify sessionId is being passed |
| Slow responses | Check bot processing time |

## Security Considerations

⚠️ **Important:**
- Never hardcode your DirectLine token in Power Apps
- Use environment variables or secure connectors
- Consider adding authentication to your API
- Rate limit API calls to prevent abuse

## Next Steps

1. Deploy the Power App to your organization
2. Add authentication (Azure AD)
3. Customize the UI to match your branding
4. Add error handling and retry logic
5. Monitor API usage and performance

