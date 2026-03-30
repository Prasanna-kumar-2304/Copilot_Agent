const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store conversation sessions
const conversationSessions = {};

// DirectLine API Configuration
const DIRECTLINE_API_URL = process.env.DIRECTLINE_API_URL || 'https://directline.botframework.com/v3/directline';
let DIRECTLINE_TOKEN = process.env.DIRECTLINE_TOKEN;

// Clean token - remove 'Bearer ' prefix if it exists
if (DIRECTLINE_TOKEN && DIRECTLINE_TOKEN.startsWith('Bearer ')) {
  DIRECTLINE_TOKEN = DIRECTLINE_TOKEN.replace('Bearer ', '');
}

// Initialize axios for API calls
const directlineAPI = axios.create({
  baseURL: DIRECTLINE_API_URL,
  headers: {
    'Authorization': `Bearer ${DIRECTLINE_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Initialize conversation with DirectLine
async function initializeConversation(sessionId) {
  try {
    if (conversationSessions[sessionId]?.conversationId) {
      return conversationSessions[sessionId];
    }

    const response = await directlineAPI.post('/conversations');
    console.log('📮 Initialize Conversation Response:', JSON.stringify(response.data, null, 2));
    
    const { conversationId, watermark, streamUrl } = response.data;

    conversationSessions[sessionId] = {
      conversationId,
      watermark,
      streamUrl,
      createdAt: Date.now(),
      lastActivityId: null, // Track last shown message to avoid duplicates
    };

    console.log(`✅ Conversation initialized for session ${sessionId}`);
    console.log(`   ConversationID: ${conversationId}`);
    return conversationSessions[sessionId];
  } catch (error) {
    console.error('Failed to initialize conversation:', error.message);
    throw new Error('Failed to initialize conversation with bot');
  }
}

// Get messages from bot
async function getMessages(sessionId, conversationId, watermark) {
  try {
    const params = watermark ? `?watermark=${watermark}` : '';
    const response = await directlineAPI.get(`/conversations/${conversationId}/activities${params}`);
    console.log('📮 Get Activities Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Failed to get messages:', error.message);
    throw new Error('Failed to retrieve bot response');
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize conversation endpoint
app.post('/api/init', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!DIRECTLINE_TOKEN) {
      return res.status(500).json({ error: 'DirectLine token not configured' });
    }

    const conversation = await initializeConversation(sessionId);
    
    res.json({
      success: true,
      conversationId: conversation.conversationId,
      message: 'Conversation initialized',
    });
  } catch (error) {
    console.error('Initialization Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to initialize conversation',
    });
  }
});

// Chat endpoint - Send message to bot
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!DIRECTLINE_TOKEN) {
      return res.status(500).json({ error: 'DirectLine token not configured' });
    }

    // Initialize conversation if needed
    let session = conversationSessions[sessionId];
    if (!session) {
      session = await initializeConversation(sessionId);
    }

    // Send user message
    const sendResponse = await directlineAPI.post(
      `/conversations/${session.conversationId}/activities`,
      {
        type: 'message',
        from: {
          id: sessionId,
          name: 'User',
        },
        text: message,
      }
    );
    console.log('📮 Send Message Response:', JSON.stringify(sendResponse.data, null, 2));

    console.log(`📤 Message sent from ${sessionId}: ${message.substring(0, 50)}...`);

    // Wait for bot to process and respond (with multiple retries)
    let botMessages = [];
    let retries = 0;
    const maxRetries = 3;

    while (botMessages.length === 0 && retries < maxRetries) {
      // Wait before fetching response
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get bot response
      const activities = await getMessages(
        sessionId,
        session.conversationId,
        session.watermark
      );

      // Update watermark
      if (activities.watermark) {
        conversationSessions[sessionId].watermark = activities.watermark;
      }

      // Find bot response (activity from bot, type message)
      // Only get NEW messages (those we haven't shown before)
      const allBotActivities = activities.activities
        .filter(activity => 
          activity.type === 'message' && 
          activity.from?.id !== sessionId
        );

      // Filter to only NEW messages (with ID greater than lastActivityId)
      const newBotActivities = allBotActivities.filter(activity => {
        if (!conversationSessions[sessionId].lastActivityId) {
          return true; // First time, show all
        }
        // Only show messages newer than the last one we showed
        return activity.id > conversationSessions[sessionId].lastActivityId;
      });

      botMessages = newBotActivities.map(activity => ({
        text: activity.text,
        timestamp: activity.timestamp,
        id: activity.id, // Keep ID for tracking
      }));

      // Update tracking with the latest message ID
      if (botMessages.length > 0) {
        conversationSessions[sessionId].lastActivityId = botMessages[botMessages.length - 1].id;
      }

      retries++;
      console.log(`🔄 Response check ${retries}/${maxRetries}: ${botMessages.length} messages found`);
    }

    if (botMessages.length === 0) {
      console.log('⏳ Bot still processing, returning retry...');
      return res.json({
        success: true,
        message: '(Bot is processing your message... Please try again in a moment)',
        retry: true,
      });
    }

    const latestBotMessage = botMessages[botMessages.length - 1]?.text || 'No response';
    console.log('✅ Bot Response:', latestBotMessage);
    console.log('📊 All Bot Messages:', JSON.stringify(botMessages, null, 2));

    res.json({
      success: true,
      message: latestBotMessage,
      conversationId: session.conversationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat Error:', error);

    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid or expired DirectLine token' });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Conversation not found. Please reinitialize.' });
    }

    res.status(500).json({
      error: error.message || 'Failed to send message to bot',
    });
  }
});

// Clear conversation endpoint
app.post('/api/clear-history', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && conversationSessions[sessionId]) {
    delete conversationSessions[sessionId];
  }
  res.json({ success: true, message: 'Conversation cleared' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('🤖 DirectLine Token configured:', !!DIRECTLINE_TOKEN);
  console.log('🔗 DirectLine API:', DIRECTLINE_API_URL);
});
