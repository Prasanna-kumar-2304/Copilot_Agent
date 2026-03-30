# DirectLine Bot Chat Application

A modern, full-stack web application for interacting with Microsoft Bot Framework bots via the Direct Line API.

## Features

✨ **Modern Chat Interface**
- Clean, responsive design
- Real-time message updates
- Auto-scrolling to latest messages
- Typing indicators and loading states

💬 **Bot Conversation Management**
- Multi-turn conversations with your bot
- Session-based conversation tracking
- Clear conversation button
- Connection status indicators

🔐 **Secure DirectLine Integration**
- Server-side DirectLine token management
- Conversation ID tracking
- Activity watermark management
- Error handling and validation

📱 **Responsive Design**
- Works on desktop, tablet, and mobile
- Touch-friendly interface
- Optimized for all screen sizes

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Microsoft Bot Service with DirectLine Channel enabled
- DirectLine Secret Token

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure DirectLine Token**
   - Open `.env` file
   - Replace `your_directline_secret_token_here` with your actual DirectLine token:
   ```
   DIRECTLINE_TOKEN=your_actual_directline_token_here
   DIRECTLINE_API_URL=https://directline.botframework.com/v3/directline
   PORT=3000
   ```

### Running the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## How to Use

1. Open your browser and navigate to `http://localhost:3000`
2. The app will automatically initialize a conversation with your bot
3. Type your message in the input field
4. Press **Enter** or click the **Send** button
5. Wait for the bot response
6. Continue the conversation - full context is maintained
7. Click **Clear** to start a new conversation

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: Add new line in input

## Project Structure

```
API-Checking/
├── server.js              # Express server and DirectLine API routes
├── .env                   # Environment variables (DirectLine token)
├── package.json           # Dependencies and scripts
├── public/
│   ├── index.html        # Main HTML page
│   ├── style.css         # Styling
│   └── script.js         # Frontend JavaScript
└── README.md             # This file
```

## API Endpoints

### POST /api/init
Initialize a new conversation with the bot.

**Request:**
```json
{
  "sessionId": "user_session_id"
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "abc123...",
  "message": "Conversation initialized"
}
```

### POST /api/chat
Send a message to the bot and get a response.

**Request:**
```json
{
  "message": "Your message here",
  "sessionId": "user_session_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bot response text...",
  "conversationId": "abc123...",
  "timestamp": "2026-03-11T10:30:00Z",
  "retry": false
}
```

### POST /api/clear-history
Clear conversation history for a session.

**Request:**
```json
{
  "sessionId": "user_session_id"
}
```

## How to Get Your DirectLine Token

1. Go to [Azure Portal](https://portal.azure.com)
2. Find your Bot Service resource
3. Click on "Channels" in the left menu
4. Click on "Direct Line"
5. Under "Configure Direct Line", copy your **Secret Key**
6. Paste it in the `.env` file as `DIRECTLINE_TOKEN`

## Security Notes

⚠️ **Important:**
- Never commit your `.env` file to version control
- Keep your DirectLine token confidential
- The token should only be stored on the server
- Consider implementing token refresh mechanism for production
- Use HTTPS in production environments

## Troubleshooting

### "Invalid or expired DirectLine token" error
- Verify your token is correct in the `.env` file
- Check that the token hasn't expired
- Regenerate the token in Azure Portal if needed

### "Conversation not found" error
- The conversation session may have expired
- Click "Clear" to start a new conversation
- The app will automatically reinitialize

### Messages not sending
- Check browser console for errors (F12)
- Verify the server is running (`npm start`)
- Check that your DirectLine token is configured in `.env`
- Ensure your bot is running and accessible

### Bot not responding
- Verify your bot is deployed and running
- Check that DirectLine channel is enabled in your bot config
- Review bot application logs for errors
- Ensure the bot can process message activities

## DirectLine API Details

The application uses the [Microsoft Bot Framework Direct Line API v3](https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-api-reference).

### Request Format
Messages are sent as JSON activities:
```json
{
  "type": "message",
  "from": {
    "id": "user_session_id",
    "name": "User"
  },
  "text": "user message"
}
```

### Response Format
Bot responses are activities with `type: 'message'`:
```json
{
  "type": "message",
  "from": {
    "id": "bot_id",
    "name": "Bot"
  },
  "text": "bot response",
  "timestamp": "2026-03-11T10:30:00.000Z"
}
```

## Customization

### Change Polling Interval
Edit `server.js` line with `setTimeout(resolve, 1000)` to adjust how long the app waits for bot response:
```javascript
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
```

### Modify Message Format
Edit the message sending format in `server.js` if your bot expects additional fields:
```javascript
{
  type: 'message',
  from: { id: sessionId, name: 'User' },
  text: message,
  // Add custom fields here
}
```

## License

This project is open source and available under the ISC License.

## Support

For issues or questions:
1. Check the browser console (F12) for errors
2. Verify your DirectLine token configuration
3. Ensure the server is running properly
4. Check your internet connection
5. Review [DirectLine API documentation](https://docs.microsoft.com/en-us/azure/bot-service/)

---

**Built with ❤️ using Node.js, Express, and Microsoft Bot Framework Direct Line API**
