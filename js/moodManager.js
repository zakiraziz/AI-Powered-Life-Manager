// ===== MOOD TRACKER MANAGER =====

const MoodManager = {
    moods: [],
    moodTypes: [
        { emoji: '😊', label: 'Happy', value: 5, color: '#10b981' },
        { emoji: '😄', label: 'Excited', value: 5, color: '#34d399' },
        { emoji: '😐', label: 'Neutral', value: 3, color: '#f59e0b' },
        { emoji: '😔', label: 'Sad', value: 1, color: '#6366f1' },
        { emoji: '😤', label: 'Frustrated', value: 2, color: '#ef4444' },
        { emoji: '😴', label: 'Tired', value: 2, color: '#8b5cf6' },
        { emoji: '🤔', label: 'Thoughtful', value: 3, color: '#3b82f6' },
        { emoji: '🥰', label: 'Loved', value: 5, color: '#ec4899' }
    ],

    init() {
        this.moods = DataManager.get(DataManager.STORAGE_KEYS.MOODS, []);
        this.updateMoodChart();
    },

    logMood(mood, journal = '', gratitude = '') {
        // Get mood info
        const moodInfo = this.moodTypes.find(m => m.emoji === mood);
        
        const moodEntry = {
            id: `mood_${Date.now()}_${SecurityUtils.generateToken(6)}`,
            date: new Date().toISOString().split('T')[0],
            mood: mood,
            moodValue: moodInfo?.value || 3,
            journal: SecurityUtils.sanitizeInput(journal),
            gratitude: SecurityUtils.sanitizeInput(gratitude),
            timestamp: new Date().toISOString()
        };

        // Check if already logged today
        const existingToday = this.moods.find(m => m.date === moodEntry.date);
        
        if (existingToday) {
            ModalManager.confirm('You already logged your mood today. Update it?').then(confirmed => {
                if (confirmed) {
                    // Update existing
                    Object.assign(existingToday, moodEntry);
                    this.save();
                    this.updateMoodChart();
                    NotificationSystem.success('Mood updated!', 2000);
                }
            });
        } else {
            this.moods.push(moodEntry);
            this.save();
            this.updateMoodChart();
            NotificationSystem.success('Mood logged! 🌟', 2000);
        }
    },

    deleteMood(id) {
        this.moods = this.moods.filter(m => m.id !== id);
        this.save();
        this.updateMoodChart();
        NotificationSystem.info('Mood entry deleted', 2000);
    },

    getMoods(filter = {}) {
        let filtered = [...this.moods];

        if (filter.startDate) {
            filtered = filtered.filter(m => m.date >= filter.startDate);
        }

        if (filter.endDate) {
            filtered = filtered.filter(m => m.date <= filter.endDate);
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getWeeklyAverage() {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const weekMoods = this.moods.filter(m => m.date >= weekAgoStr && m.date <= today);
        
        if (weekMoods.length === 0) return 0;

        const sum = weekMoods.reduce((acc, m) => acc + (m.moodValue || 3), 0);
        return (sum / weekMoods.length).toFixed(1);
    },

    getMonthlyAverage() {
        const today = new Date().toISOString().split('T')[0];
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];

        const monthMoods = this.moods.filter(m => m.date >= monthAgoStr && m.date <= today);
        
        if (monthMoods.length === 0) return 0;

        const sum = monthMoods.reduce((acc, m) => acc + (m.moodValue || 3), 0);
        return (sum / monthMoods.length).toFixed(1);
    },

    getMoodTrend() {
        const recent = this.moods.slice(-7);
        
        if (recent.length < 2) return 'stable';

        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));

        const firstAvg = firstHalf.reduce((s, m) => s + (m.moodValue || 3), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s, m) => s + (m.moodValue || 3), 0) / secondHalf.length;

        const diff = secondAvg - firstAvg;
        
        if (diff > 0.5) return 'improving';
        if (diff < -0.5) return 'declining';
        return 'stable';
    },

    getCommonGratitudes() {
        const gratitudes = this.moods
            .filter(m => m.gratitude)
            .map(m => m.gratitude.toLowerCase());

        const counts = {};
        gratitudes.forEach(g => {
            counts[g] = (counts[g] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([text, count]) => ({ text, count }));
    },

    updateMoodChart() {
        if (window.ChartManager) {
            ChartManager.updateMoodChart();
        }
    },

    save() {
        DataManager.set(DataManager.STORAGE_KEYS.MOODS, this.moods);
    },

    showHistory() {
        const moods = this.getMoods();
        
        const content = moods.length > 0
            ? moods.map(m => {
                const moodInfo = this.moodTypes.find(t => t.emoji === m.mood);
                return `
                    <div style="padding: 16px; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 2rem;">${m.mood}</span>
                                <div>
                                    <div style="font-weight: 500;">${moodInfo?.label || 'Unknown'}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${m.date}</div>
                                </div>
                            </div>
                            <button onclick="MoodManager.deleteMood('${m.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        ${m.journal ? `<div style="margin-top: 12px; padding: 12px; background: var(--bg-primary); border-radius: 8px; font-size: 0.9rem;">${SecurityUtils.escapeHtml(m.journal)}</div>` : ''}
                        ${m.gratitude ? `<div style="margin-top: 8px; font-size: 0.9rem; color: var(--warning);"><i class="fas fa-sun"></i> ${SecurityUtils.escapeHtml(m.gratitude)}</div>` : ''}
                    </div>
                `;
            }).join('')
            : '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No mood entries yet</div>';

        ModalManager.create({
            id: 'mood-history-modal',
            title: 'Mood History',
            content: `<div style="max-height: 400px; overflow-y: auto;">${content}</div>`,
            size: 'large',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    },

    showAnalytics() {
        const weekly = this.getWeeklyAverage();
        const monthly = this.getMonthlyAverage();
        const trend = this.getMoodTrend();
        const commonGratitudes = this.getCommonGratitudes();

        const trendEmoji = {
            improving: '📈',
            declining: '📉',
            stable: '➡️'
        };

        const trendLabel = {
            improving: 'Improving',
            declining: 'Declining',
            stable: 'Stable'
        };

        const gratitudeHtml = commonGratitudes.length > 0
            ? commonGratitudes.map(g => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>${SecurityUtils.escapeHtml(g.text)}</span>
                    <span style="color: var(--text-secondary);">${g.count}x</span>
                </div>
            `).join('')
            : '<div style="color: var(--text-secondary);">No gratitudes logged yet</div>';

        const content = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Weekly Avg</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${weekly}/5</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Monthly Avg</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${monthly}/5</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Trend</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${trendEmoji[trend]} ${trendLabel[trend]}</div>
                </div>
            </div>
            <h4 style="margin-bottom: 12px;">Common Gratitudes</h4>
            ${gratitudeHtml}
        `;

        ModalManager.create({
            id: 'mood-analytics-modal',
            title: 'Mood Analytics',
            content,
            size: 'medium',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    }
};

// Global function for HTML onclick
function logMood(mood) {
    const journal = document.getElementById('journalEntry')?.value || '';
    const gratitude = document.getElementById('gratitudeInput')?.value || '';
    
    MoodManager.logMood(mood, journal, gratitude);
    
    // Clear inputs
    const journalInput = document.getElementById('journalEntry');
    const gratitudeInput = document.getElementById('gratitudeInput');
    if (journalInput) journalInput.value = '';
    if (gratitudeInput) gratitudeInput.value = '';
    
    // Remove active state from mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    MoodManager.init();
});

window.MoodManager = MoodManager;
window.logMood = logMood;
