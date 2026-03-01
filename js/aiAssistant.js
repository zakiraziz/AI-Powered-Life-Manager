// ===== aiAssistant.js - AI Assistant Module =====

const AIAssistant = {
    // Chat history
    chatHistory: [],
    
    // Initialize AI Assistant
    init() {
        this.loadChatHistory();
        this.renderChat();
    },
    
    // Load chat history from storage
    loadChatHistory() {
        const stored = localStorage.getItem('lifeos_chat_history');
        if (stored) {
            this.chatHistory = JSON.parse(stored);
        } else {
            // Welcome message
            this.chatHistory = [
                {
                    id: 1,
                    type: 'assistant',
                    message: 'Hello! I\'m your AI Assistant. How can I help you today?',
                    timestamp: new Date().toISOString()
                }
            ];
        }
    },
    
    // Save chat history to storage
    saveChatHistory() {
        localStorage.setItem('lifeos_chat_history', JSON.stringify(this.chatHistory));
    },
    
    // Render chat messages
    renderChat() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = this.chatHistory.map(msg => `
            <div class="chat-message ${msg.type}" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <div class="message-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: ${msg.type === 'assistant' ? 'var(--accent-primary)' : 'var(--success)'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem;">
                    ${msg.type === 'assistant' ? 'AI' : 'You'}
                </div>
                <div class="message-content" style="flex: 1; background: var(--bg-tertiary); padding: 0.75rem; border-radius: 8px;">
                    <p style="margin: 0;">${msg.message}</p>
                    <small style="color: var(--text-tertiary);">${new Date(msg.timestamp).toLocaleTimeString()}</small>
                </div>
            </div>
        `).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },
    
    // Show AI Assistant
    showAIAssistant() {
        const modal = document.getElementById('aiAssistantModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            this.renderChat();
        }
    },
    
    // Send message to AI
    async sendMessage(message) {
        if (!message.trim()) return;
        
        // Add user message
        const userMsg = {
            id: Date.now(),
            type: 'user',
            message: message,
            timestamp: new Date().toISOString()
        };
        this.chatHistory.push(userMsg);
        
        // Clear input
        const input = document.getElementById('chatInput');
        if (input) input.value = '';
        
        // Render user message immediately
        this.renderChat();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Simulate AI response (in a real app, this would call an AI API)
        setTimeout(() => {
            this.removeTypingIndicator();
            const response = this.generateResponse(message);
            
            const assistantMsg = {
                id: Date.now() + 1,
                type: 'assistant',
                message: response,
                timestamp: new Date().toISOString()
            };
            this.chatHistory.push(assistantMsg);
            this.saveChatHistory();
            this.renderChat();
        }, 1500);
    },
    
    // Show typing indicator
    showTypingIndicator() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <div class="message-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem;">AI</div>
                <div class="message-content" style="background: var(--bg-tertiary); padding: 0.75rem; border-radius: 8px;">
                    <div style="display: flex; gap: 4px;">
                        <span style="width: 8px; height: 8px; background: var(--text-secondary); border-radius: 50%; animation: bounce 1s infinite;"></span>
                        <span style="width: 8px; height: 8px; background: var(--text-secondary); border-radius: 50%; animation: bounce 1s infinite 0.2s;"></span>
                        <span style="width: 8px; height: 8px; background: var(--text-secondary); border-radius: 50%; animation: bounce 1s infinite 0.4s;"></span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    },
    
    // Remove typing indicator
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    },
    
    // Generate AI response (simulated)
    generateResponse(message) {
        const responses = [
            "I'd be happy to help you with that! Let me analyze your request.",
            "That's a great question. Based on your data, I can see some patterns.",
            "I understand what you're looking for. Here's my recommendation:",
            "Great thinking! Here's what I suggest based on your productivity trends.",
            "I can definitely help with that. Let me provide some insights."
        ];
        
        const lowerMessage = message.toLowerCase();
        
        // Simple keyword-based responses
        if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
            return "For tasks, I recommend prioritizing your most important items using the Eisenhower Matrix. Focus on tasks that are both urgent and important first.";
        } else if (lowerMessage.includes('mood') || lowerMessage.includes('feeling')) {
            return "Tracking your mood is a great practice. Regular mood logging can help identify patterns in your emotional well-being.";
        } else if (lowerMessage.includes('expense') || lowerMessage.includes('money') || lowerMessage.includes('budget')) {
            return "For expense tracking, try categorizing your spending and setting weekly budgets. This helps identify areas where you can save.";
        } else if (lowerMessage.includes('productivity') || lowerMessage.includes('focus')) {
            return "To boost productivity, try the Pomodoro Technique: work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer break.";
        } else if (lowerMessage.includes('goal') || lowerMessage.includes('resolution')) {
            return "Setting SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) can help you achieve your objectives more effectively.";
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return "Hello! How can I assist you today? I can help with tasks, mood tracking, expenses, productivity tips, and more!";
        }
        
        return responses[Math.floor(Math.random() * responses.length)] + " Feel free to ask me about tasks, mood, expenses, or productivity!";
    },
    
    // Clear chat history
    clearHistory() {
        if (confirm('Are you sure you want to clear chat history?')) {
            this.chatHistory = [
                {
                    id: 1,
                    type: 'assistant',
                    message: 'Chat history cleared. How can I help you today?',
                    timestamp: new Date().toISOString()
                }
            ];
            this.saveChatHistory();
            this.renderChat();
        }
    }
};

// Global function aliases for HTML onclick handlers
function showAIAssistant() {
    if (App && App.showAIAssistant) {
        App.showAIAssistant();
    } else if (AIAssistant) {
        AIAssistant.showAIAssistant();
    }
}

function closeAIAssistant() {
    const modal = document.getElementById('aiAssistantModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (input && input.value && AIAssistant) {
        AIAssistant.sendMessage(input.value);
    }
}

// Handle Enter key in chat input
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Initialize AI Assistant
    if (typeof AIAssistant !== 'undefined') {
        AIAssistant.init();
    }
});
