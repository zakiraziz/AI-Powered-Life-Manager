// ===== aiAssistant.js - Enhanced AI Assistant Module =====
// With smart suggestions, predictive insights, and voice commands

const AIAssistant = {
    // Chat history
    chatHistory: [],
    
    // Smart suggestions based on context
    suggestions: [],
    
    // User patterns for predictive AI
    userPatterns: {
        peakProductivityHours: [],
        commonTasks: [],
        moodCorrelations: [],
        habitStreakData: []
    },
    
    // Voice recognition
    voiceRecognition: null,
    isListening: false,
    
    // Initialize AI Assistant
    init() {
        this.loadChatHistory();
        this.loadUserPatterns();
        this.generateSmartSuggestions();
        this.renderChat();
        this.initVoiceRecognition();
        this.setupAICommands();
    },
    
    // Load chat history from storage
    loadChatHistory() {
        const stored = localStorage.getItem('lifeos_chat_history');
        if (stored) {
            this.chatHistory = JSON.parse(stored);
        } else {
            // Welcome message with smart suggestions
            this.chatHistory = [
                {
                    id: 1,
                    type: 'assistant',
                    message: 'Hello! I\'m your AI Assistant. How can I help you today?',
                    timestamp: new Date().toISOString(),
                    suggestions: ['Show my tasks', 'Log my mood', 'Start a pomodoro', 'What are my insights?']
                }
            ];
        }
    },
    
    // Load user patterns for predictive AI
    loadUserPatterns() {
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        const moods = JSON.parse(localStorage.getItem('lifeos_moods') || '[]');
        const habits = JSON.parse(localStorage.getItem('lifeos_habits') || '[]');
        
        // Analyze peak productivity hours from completed tasks
        const completedTasks = tasks.filter(t => t.completed && t.completedAt);
        const hourCounts = {};
        completedTasks.forEach(t => {
            const hour = new Date(t.completedAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        this.userPatterns.peakProductivityHours = Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        
        // Common task patterns
        const taskCategories = {};
        tasks.forEach(t => {
            const cat = t.category || 'general';
            taskCategories[cat] = (taskCategories[cat] || 0) + 1;
        });
        this.userPatterns.commonTasks = Object.entries(taskCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat]) => cat);
        
        // Mood patterns
        if (moods.length > 0) {
            this.userPatterns.moodCorrelations = this.analyzeMoodCorrelations(moods);
        }
        
        // Habit streak data
        const habitData = {};
        habits.forEach(h => {
            if (h.completedDates) {
                habitData[h.name] = h.completedDates.length;
            }
        });
        this.userPatterns.habitStreakData = habitData;
    },
    
    // Analyze mood correlations
    analyzeMoodCorrelations(moods) {
        const correlations = [];
        const moodByDate = {};
        
        moods.forEach(m => {
            const date = new Date(m.timestamp).toDateString();
            if (!moodByDate[date]) moodByDate[date] = [];
            moodByDate[date].push(m.mood);
        });
        
        // Find patterns (simplified)
        const avgMoodByHour = {};
        moods.forEach(m => {
            const hour = new Date(m.timestamp).getHours();
            if (!avgMoodByHour[hour]) avgMoodByHour[hour] = [];
            avgMoodByHour[hour].push(m.mood);
        });
        
        Object.entries(avgMoodByHour).forEach(([hour, moods]) => {
            const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
            correlations.push({ hour: parseInt(hour), avgMood: avg });
        });
        
        return correlations.sort((a, b) => b.avgMood - a.avgMood);
    },
    
    // Generate smart suggestions based on context
    generateSmartSuggestions() {
        const suggestions = [];
        const hour = new Date().getHours();
        
        // Time-based suggestions
        if (hour >= 9 && hour < 12) {
            suggestions.push('Start your most important task now (peak productivity hours)');
        } else if (hour >= 14 && hour < 17) {
            suggestions.push('Time for a productivity boost!');
        } else if (hour >= 20) {
            suggestions.push('Consider logging your daily mood');
        }
        
        // Task-based suggestions
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date());
        const todayTasks = tasks.filter(t => !t.completed && new Date(t.dueDate).toDateString() === new Date().toDateString());
        
        if (overdueTasks.length > 0) {
            suggestions.push(`You have ${overdueTasks.length} overdue task(s). Let me help you catch up!`);
        }
        if (todayTasks.length > 0) {
            suggestions.push(`You have ${todayTasks.length} task(s) due today. Ready to tackle them?`);
        }
        
        // Habit suggestions
        const habits = JSON.parse(localStorage.getItem('lifeos_habits') || '[]');
        const incompleteHabits = habits.filter(h => {
            const today = new Date().toDateString();
            return !h.completedDates || !h.completedDates.includes(today);
        });
        
        if (incompleteHabits.length > 0) {
            suggestions.push(`${incompleteHabits.length} habit(s) remaining today`);
        }
        
        // Expense insights
        const expenses = JSON.parse(localStorage.getItem('lifeos_expenses') || '[]');
        const thisMonth = expenses.filter(e => {
            const date = new Date(e.date);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        
        if (thisMonth.length > 0) {
            const total = thisMonth.reduce((sum, e) => sum + (e.amount || 0), 0);
            suggestions.push(`This month's expenses: $${total.toFixed(2)}`);
        }
        
        this.suggestions = suggestions.slice(0, 4);
    },
    
    // Save chat history to storage
    saveChatHistory() {
        localStorage.setItem('lifeos_chat_history', JSON.stringify(this.chatHistory));
    },
    
    // Setup AI commands
    setupAICommands() {
        this.commands = {
            'add task': (params) => this.handleAddTask(params),
            'show tasks': () => this.handleShowTasks(),
            'my tasks': () => this.handleShowTasks(),
            'log mood': () => this.handleLogMood(),
            'how am i feeling': () => this.handleMoodInsights(),
            'start pomodoro': () => this.handleStartPomodoro(),
            'add expense': () => this.handleAddExpense(),
            'my habits': () => this.handleShowHabits(),
            'insights': () => this.handleShowInsights(),
            'productivity': () => this.handleProductivityReport(),
            'help': () => this.handleHelp(),
            'tip': () => this.handleTip(),
            'quote': () => this.handleQuote(),
            'joke': () => this.handleJoke()
        };
    },
    
    // Handle add task command
    handleAddTask(params) {
        return {
            action: 'addTask',
            message: 'I\'ll help you add a task. What would you like to do?'
        };
    },
    
    // Handle show tasks
    handleShowTasks() {
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        const pending = tasks.filter(t => !t.completed);
        
        if (pending.length === 0) {
            return 'Great job! You have no pending tasks.';
        }
        
        const urgent = pending.filter(t => {
            const due = new Date(t.dueDate);
            const now = new Date();
            const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
            return diffDays <= 2;
        });
        
        let response = `You have ${pending.length} pending task(s).`;
        if (urgent.length > 0) {
            response += ` ${urgent.length} are urgent!`;
        }
        
        return response;
    },
    
    // Handle log mood
    handleLogMood() {
        return {
            action: 'logMood',
            message: 'How are you feeling right now? Tell me your mood (1-10)'
        };
    },
    
    // Handle mood insights
    handleMoodInsights() {
        const moods = JSON.parse(localStorage.getItem('lifeos_moods') || '[]');
        
        if (moods.length < 3) {
            return 'Log more moods to get personalized insights!';
        }
        
        const recent = moods.slice(-7);
        const avg = recent.reduce((sum, m) => sum + m.mood, 0) / recent.length;
        
        let insight = `Your average mood this week: ${avg.toFixed(1)}/10.`;
        
        if (avg >= 7) {
            insight += ' You\'ve been feeling great!';
        } else if (avg >= 5) {
            insight += ' Your mood has been moderate.';
        } else {
            insight += ' Consider taking some time for self-care.';
        }
        
        return insight;
    },
    
    // Handle start pomodoro
    handleStartPomodoro() {
        return {
            action: 'startPomodoro',
            message: 'Starting a 25-minute focus session for you!'
        };
    },
    
    // Handle add expense
    handleAddExpense() {
        return {
            action: 'addExpense',
            message: 'What expense would you like to add?'
        };
    },
    
    // Handle show habits
    handleShowHabits() {
        const habits = JSON.parse(localStorage.getItem('lifeos_habits') || '[]');
        
        if (habits.length === 0) {
            return 'You haven\'t set up any habits yet. Would you like to create one?';
        }
        
        const today = new Date().toDateString();
        const completed = habits.filter(h => h.completedDates && h.completedDates.includes(today)).length;
        
        return `You have ${habits.length} habit(s), ${completed} completed today.`;
    },
    
    // Handle show insights
    handleShowInsights() {
        this.loadUserPatterns();
        
        let insights = '📊 Here are your insights:\n\n';
        
        // Peak hours
        if (this.userPatterns.peakProductivityHours.length > 0) {
            const hours = this.userPatterns.peakProductivityHours.map(h => {
                const suffix = h >= 12 ? 'PM' : 'AM';
                const display = h > 12 ? h - 12 : h;
                return `${display}${suffix}`;
            }).join(', ');
            insights += `⏰ Your peak productivity: ${hours}\n`;
        }
        
        // Common tasks
        if (this.userPatterns.commonTasks.length > 0) {
            insights += `📋 Top categories: ${this.userPatterns.commonTasks.slice(0, 3).join(', ')}\n`;
        }
        
        // Best mood time
        if (this.userPatterns.moodCorrelations.length > 0) {
            const best = this.userPatterns.moodCorrelations[0];
            const hour = best.hour > 12 ? best.hour - 12 : best.hour;
            const suffix = best.hour >= 12 ? 'PM' : 'AM';
            insights += `😊 Best mood around: ${hour}${suffix}\n`;
        }
        
        return insights;
    },
    
    // Handle productivity report
    handleProductivityReport() {
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        const completed = tasks.filter(t => t.completed);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const thisWeek = completed.filter(t => new Date(t.completedAt) > weekAgo);
        
        let report = '📈 Productivity Report:\n\n';
        report += `✅ Tasks completed: ${completed.length} total, ${thisWeek.length} this week\n`;
        
        if (thisWeek.length > 0) {
            const avgPerDay = (thisWeek.length / 7).toFixed(1);
            report += `📊 Average: ${avgPerDay} tasks/day this week\n`;
        }
        
        // Calculate streak
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toDateString();
            
            const hasCompleted = completed.some(t => 
                new Date(t.completedAt).toDateString() === dateStr
            );
            
            if (hasCompleted) streak++;
            else if (i > 0) break;
        }
        
        report += `🔥 Current streak: ${streak} day(s)`;
        
        return report;
    },
    
    // Handle help
    handleHelp() {
        return `🤖 Here are some things I can help you with:

• "Show my tasks" - View your tasks
• "Log mood" - Track how you're feeling
• "Start pomodoro" - Begin a focus session
• "Add expense" - Record spending
• "My habits" - Check habit progress
• "Insights" - Get AI-powered insights
• "Productivity" - View your stats
• "Tip" - Get productivity tips
• "Quote" - Daily motivation

Just type naturally and I'll understand!`;
    },
    
    // Handle tip
    handleTip() {
        const tips = [
            'Break large tasks into smaller, manageable chunks.',
            'Use the Pomodoro Technique: 25 minutes of focus, 5 minutes of rest.',
            'Start your day with your most important task.',
            'Take regular breaks to maintain high productivity.',
            'Review your tasks the night before for better planning.',
            'Use the "Two-Minute Rule": if it takes less than 2 minutes, do it now.',
            'Eliminate distractions by turning off notifications.',
            'Set specific, measurable goals for each day.',
            'Practice gratitude to improve overall well-being.',
            'Stay hydrated - it boosts focus and energy!'
        ];
        return `💡 Tip: ${tips[Math.floor(Math.random() * tips.length)]}`;
    },
    
    // Handle quote
    handleQuote() {
        const quotes = [
            { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
            { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
            { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
            { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
            { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
            { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
            { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
            { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
            { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
            { text: 'Your time is limited, don\'t waste it living someone else\'s life.', author: 'Steve Jobs' }
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        return `"${quote.text}"\n\n— ${quote.author}`;
    },
    
    // Handle joke
    handleJoke() {
        const jokes = [
            'Why do programmers prefer dark mode? Because light attracts bugs!',
            'Why did the developer go broke? Because he used up all his cache!',
            'A SQL query walks into a bar, walks up to two tables and asks... "Can I join you?"',
            'Why do Java developers wear glasses? Because they can\'t C#!',
            'A programmer\'s wife tells him: "Go to the store and get a loaf of bread. If they have eggs, get a dozen." He comes home with 12 loaves of bread.',
            'Why was the JavaScript developer sad? Because he didn\'t Node how to Express himself!',
            'What do you call a fake noodle? An Impasta!',
            'Why did the scarecrow win an award? Because he was outstanding in his field!',
            'What do you call a bear with no teeth? A gummy bear!',
            'Why don\'t scientists trust atoms? Because they make up everything!'
        ];
        return `😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`;
    },
    
    // Process natural language input
    processInput(input) {
        const lowerInput = input.toLowerCase();
        
        // Check for exact command matches
        for (const [command, handler] of Object.entries(this.commands)) {
            if (lowerInput.includes(command)) {
                return handler();
            }
        }
        
        // Smart context responses
        if (lowerInput.includes('thank')) {
            return 'You\'re welcome! Let me know if you need anything else.';
        }
        
        if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
            return `Hello! ${this.suggestions[0] || 'How can I help you today?'}`;
        }
        
        if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
            return 'Goodbye! Have a productive day!';
        }
        
        // Check for task-related keywords
        if (lowerInput.includes('task') || lowerInput.includes('todo')) {
            return this.handleShowTasks();
        }
        
        if (lowerInput.includes('mood') || lowerInput.includes('feeling')) {
            return this.handleMoodInsights();
        }
        
        if (lowerInput.includes('habit')) {
            return this.handleShowHabits();
        }
        
        if (lowerInput.includes('expense') || lowerInput.includes('money') || lowerInput.includes('spend')) {
            return this.handleAddExpense();
        }
        
        // Default response with suggestion
        return `I understand you're asking about "${input}". ${this.suggestions[0] || 'Try asking me about your tasks, mood, habits, or insights!'}`;
    },
    
    // Render chat messages
    renderChat() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = this.chatHistory.map(msg => `
            <div class="chat-message ${msg.type}" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; animation: fadeIn 0.3s ease;">
                <div class="message-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: ${msg.type === 'assistant' ? 'var(--accent-primary)' : 'var(--success)'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem; flex-shrink: 0;">
                    ${msg.type === 'assistant' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>'}
                </div>
                <div class="message-content" style="flex: 1; background: var(--bg-tertiary); padding: 0.75rem; border-radius: 12px; border: 1px solid var(--border-color);">
                    <p style="margin: 0; line-height: 1.5;">${msg.message.replace(/\n/g, '<br>')}</p>
                    <small style="color: var(--text-tertiary); font-size: 0.7rem;">${new Date(msg.timestamp).toLocaleTimeString()}</small>
                </div>
            </div>
        `).join('');
        
        // Render suggestions if last message is from assistant
        const lastMsg = this.chatHistory[this.chatHistory.length - 1];
        if (lastMsg && lastMsg.type === 'assistant' && lastMsg.suggestions) {
            container.innerHTML += `
                <div class="suggestions" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${lastMsg.suggestions.map(s => `
                        <button class="suggestion-btn" onclick="AIAssistant.sendMessage('${s}')" 
                            style="background: var(--bg-secondary); border: 1px solid var(--border-color); 
                            padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem; 
                            cursor: pointer; transition: all 0.2s;">
                            ${s}
                        </button>
                    `).join('')}
                </div>
            `;
        }
        
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
            document.getElementById('chatInput')?.focus();
        }
    },
    
    // Hide AI Assistant
    hideAIAssistant() {
        const modal = document.getElementById('aiAssistantModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },
    
    // Toggle AI Assistant
    toggleAIAssistant() {
        const modal = document.getElementById('aiAssistantModal');
        if (modal) {
            const isHidden = modal.classList.contains('hidden') || modal.style.display === 'none';
            if (isHidden) {
                this.showAIAssistant();
            } else {
                this.hideAIAssistant();
            }
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
        
        // Process with AI
        setTimeout(() => {
            this.removeTypingIndicator();
            const response = this.processInput(message);
            
            // Handle action responses
            if (typeof response === 'object' && response.action) {
                this.handleAction(response.action, response.message);
            }
            
            const assistantMsg = {
                id: Date.now() + 1,
                type: 'assistant',
                message: typeof response === 'object' ? response.message : response,
                timestamp: new Date().toISOString(),
                suggestions: this.generateQuickSuggestions(message)
            };
            
            this.chatHistory.push(assistantMsg);
            this.saveChatHistory();
            this.renderChat();
        }, 800 + Math.random() * 500); // Random delay for realism
    },
    
    // Generate quick suggestions based on user input
    generateQuickSuggestions(userInput) {
        const lower = userInput.toLowerCase();
        const suggestions = [];
        
        if (lower.includes('task')) {
            suggestions.push('Show all tasks', 'Add new task');
        } else if (lower.includes('mood')) {
            suggestions.push('Log my mood', 'Show mood history');
        } else if (lower.includes('habit')) {
            suggestions.push('Check habits', 'Add new habit');
        } else if (lower.includes('insight') || lower.includes('stat')) {
            suggestions.push('Productivity report', 'Mood insights');
        } else {
            suggestions.push('Show my tasks', 'Get insights', 'Start pomodoro');
        }
        
        return suggestions.slice(0, 3);
    },
    
    // Handle action responses
    handleAction(action, message) {
        switch (action) {
            case 'addTask':
                if (typeof QuickActions !== 'undefined') {
                    QuickActions.addTask();
                }
                break;
            case 'logMood':
                if (typeof MoodManager !== 'undefined') {
                    MoodManager.showMoodModal();
                }
                break;
            case 'startPomodoro':
                if (typeof PomodoroTimer !== 'undefined') {
                    PomodoroTimer.start();
                }
                break;
            case 'addExpense':
                if (typeof QuickActions !== 'undefined') {
                    QuickActions.addExpense();
                }
                break;
        }
    },
    
    // Show typing indicator
    showTypingIndicator() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; color: white;">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-dots" style="background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
                <span style="animation: bounce 1.4s infinite ease-in-out;"><i class="fas fa-circle" style="font-size: 0.5rem; margin: 0 2px;"></i></span>
                <span style="animation: bounce 1.4s 0.2s infinite ease-in-out;"><i class="fas fa-circle" style="font-size: 0.5rem; margin: 0 2px;"></i></span>
                <span style="animation: bounce 1.4s 0.4s infinite ease-in-out;"><i class="fas fa-circle" style="font-size: 0.5rem; margin: 0 2px;"></i></span>
            </div>
        `;
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    },
    
    // Remove typing indicator
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    },
    
    // Initialize voice recognition
    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.voiceRecognition = new SpeechRecognition();
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';
            
            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const input = document.getElementById('chatInput');
                if (input) {
                    input.value = transcript;
                    this.sendMessage(transcript);
                }
            };
            
            this.voiceRecognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.isListening = false;
                this.updateVoiceButton();
            };
            
            this.voiceRecognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton();
            };
        }
    },
    
    // Toggle voice recognition
    toggleVoice() {
        if (!this.voiceRecognition) {
            this.showError('Voice recognition not supported in this browser');
            return;
        }
        
        if (this.isListening) {
            this.voiceRecognition.stop();
        } else {
            this.voiceRecognition.start();
            this.isListening = true;
            this.updateVoiceButton();
        }
    },
    
    // Update voice button state
    updateVoiceButton() {
        const btn = document.getElementById('voiceInputBtn');
        if (btn) {
            if (this.isListening) {
                btn.classList.add('listening');
                btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            } else {
                btn.classList.remove('listening');
                btn.innerHTML = '<i class="fas fa-microphone"></i>';
            }
        }
    },
    
    // Show error message
    showError(message) {
        const input = document.getElementById('chatInput');
        if (input) {
            input.placeholder = message;
            setTimeout(() => {
                input.placeholder = 'Type a message...';
            }, 3000);
        }
    },
    
    // Clear chat history
    clearChat() {
        this.chatHistory = [
            {
                id: Date.now(),
                type: 'assistant',
                message: 'Chat cleared! How can I help you now?',
                timestamp: new Date().toISOString(),
                suggestions: ['Show my tasks', 'Get insights', 'Start pomodoro']
            }
        ];
        this.saveChatHistory();
        this.renderChat();
    },
    
    // Export chat
    exportChat() {
        const data = {
            history: this.chatHistory,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lifeos-chat-history.json';
        a.click();
        URL.revokeObjectURL(url);
    }
};

// Make AIAssistant globally accessible
window.AIAssistant = AIAssistant;
