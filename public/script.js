// Generate unique session ID
function getSessionId() {
    let sessionId = localStorage.getItem('chatSessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatSessionId', sessionId);
    }
    return sessionId;
}

const sessionId = getSessionId();
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');
const tokenInfo = document.getElementById('tokenInfo');
const tokenText = document.getElementById('tokenText');

let isLoading = false;
let conversationInitialized = false;

// Initialize conversation with bot
async function initializeConversation() {
    try {
        setStatus('Initializing conversation...', 'loading');
        
        const response = await fetch('/api/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: sessionId,
            }),
        });

        const data = await response.json();
        console.log('📮 Init Conversation Response:', data);

        if (!response.ok) {
            showErrorMessage(data.error || 'Failed to initialize conversation');
            setStatus('Connection error', 'error');
            return false;
        }

        conversationInitialized = true;
        setStatus('Connected to bot', 'ready');
        console.log('✅ Conversation initialized:', data.conversationId);
        return true;
    } catch (error) {
        showErrorMessage('Failed to initialize: ' + error.message);
        setStatus('Connection error', 'error');
        return false;
    }
}

// Send message function
async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    if (isLoading) return;

    // Initialize if not already done
    if (!conversationInitialized) {
        const initialized = await initializeConversation();
        if (!initialized) return;
    }

    // Add user message to chat
    addMessageToChat(message, 'user');
    messageInput.value = '';

    // Reset textarea height
    messageInput.style.height = 'auto';

    // Show loading state
    setLoading(true);
    showLoadingMessage();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                sessionId: sessionId,
            }),
        });

        const data = await response.json();
        console.log('📮 Chat Response:', data);

        // Remove loading message
        removeLoadingMessage();

        if (!response.ok) {
            showErrorMessage(data.error || 'Failed to get response. Please try again.');
            setLoading(false);
            return;
        }

        // If retry is needed (bot still processing), retry after delay
        if (data.retry) {
            console.log('⏳ Bot processing, retrying...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Re-add loading indicator
            showLoadingMessage();
            
            // Retry fetching the response
            const retryResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: sessionId,
                }),
            });

            const retryData = await retryResponse.json();
            console.log('📮 Retry Chat Response:', retryData);
            removeLoadingMessage();

            if (!retryResponse.ok) {
                showErrorMessage(retryData.error || 'Failed to get response. Please try again.');
                setLoading(false);
                return;
            }

            if (retryData.message && !retryData.retry) {
                addMessageToChat(retryData.message, 'assistant');
            } else {
                showErrorMessage('Bot did not respond in time. Please try again.');
            }
        } else {
            // Add bot response
            addMessageToChat(data.message, 'assistant');
        }

        setLoading(false);
    } catch (error) {
        removeLoadingMessage();
        showErrorMessage('Network error: ' + error.message);
        setLoading(false);
    }

    messageInput.focus();
}

// Add message to chat
function addMessageToChat(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Parse markdown-like formatting
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

    contentDiv.innerHTML = `<p>${formattedText}</p>`;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    scrollToBottom();
}

// Show loading message
function showLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    messageDiv.id = 'loading-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Remove loading message
function removeLoadingMessage() {
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// Show error message
function showErrorMessage(error) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.style.borderColor = '#f44336';
    contentDiv.style.color = '#f44336';
    contentDiv.innerHTML = `<p>❌ Error: ${error}</p>`;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Show token usage info
function showTokenInfo(usage) {
    tokenText.textContent = `Tokens used - Prompt: ${usage.promptTokens} | Completion: ${usage.completionTokens} | Total: ${usage.totalTokens}`;
    tokenInfo.style.display = 'block';
}

// Set loading state
function setLoading(loading) {
    isLoading = loading;
    sendBtn.disabled = loading;
    messageInput.disabled = loading;
    
    if (loading) {
        statusText.textContent = 'Waiting for response...';
        statusText.classList.add('loading');
    } else {
        statusText.textContent = 'Ready';
        statusText.classList.remove('loading');
    }
}

// Set status with state
function setStatus(text, state = 'ready') {
    statusText.textContent = text;
    statusText.classList.remove('loading', 'error');
    if (state === 'loading') {
        statusText.classList.add('loading');
    } else if (state === 'error') {
        statusText.classList.add('error');
    }
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Clear conversation
async function clearConversation() {
    if (confirm('Are you sure you want to clear the conversation? This cannot be undone.')) {
        try {
            await fetch('/api/clear-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: sessionId }),
            });

            conversationInitialized = false;

            // Clear messages UI
            chatMessages.innerHTML = `
                <div class="message assistant-message">
                    <div class="message-content">
                        <p>👋 Conversation cleared. Let's start fresh! What would you like to ask?</p>
                    </div>
                </div>
            `;
            tokenInfo.style.display = 'none';
            setStatus('Ready', 'ready');
        } catch (error) {
            alert('Error clearing conversation: ' + error.message);
            setStatus('Error clearing', 'error');
        }
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
clearBtn.addEventListener('click', clearConversation);

// Textarea auto-resize
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

// Send on Enter, new line on Shift+Enter
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && messageInput.value.trim()) {
            sendMessage();
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setStatus('Ready to chat', 'ready');
    messageInput.focus();
});

// Set initial focus
messageInput.focus();