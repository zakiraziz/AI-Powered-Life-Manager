// ===== Sleep Tracker Module =====
const SleepTracker = {
    STORAGE_KEY: 'lifeos_sleep_data',

    // Initialize sleep tracker
    init() {
        this.loadSleepData();
        this.renderSleepDashboard();
        this.setupEventListeners();
    },

    // Load sleep data from storage
    loadSleepData() {
        this.sleepData = DataManager.get(this.STORAGE_KEY, []);
    },

    // Save sleep data to storage
    saveSleepData() {
        DataManager.set(this.STORAGE_KEY, this.sleepData);
    },

    // Add new sleep entry
    addSleepEntry(entry) {
        const newEntry = {
            id: Date.now(),
            date: entry.date || new Date().toISOString().split('T')[0],
            bedtime: entry.bedtime,
            wakeTime: entry.wakeTime,
            quality: entry.quality || 5,
            notes: entry.notes || '',
            dreams: entry.dreams || '',
            duration: this.calculateDuration(entry.bedtime, entry.wakeTime)
        };

        this.sleepData.unshift(newEntry);
        this.saveSleepData();
        this.renderSleepDashboard();
        this.showNotification('Sleep entry added!', 'success');
    },

    // Calculate sleep duration
    calculateDuration(bedtime, wakeTime) {
        const [bedHour, bedMin] = bedtime.split(':').map(Number);
        const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);

        let bedMinutes = bedHour * 60 + bedMin;
        let wakeMinutes = wakeHour * 60 + wakeMin;

        // Handle overnight sleep
        if (wakeMinutes < bedMinutes) {
            wakeMinutes += 24 * 60;
        }

        const durationMinutes = wakeMinutes - bedMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;

        return `${hours}h ${mins}m`;
    },

    // Delete sleep entry
    deleteSleepEntry(id) {
        this.sleepData = this.sleepData.filter(entry => entry.id !== id);
        this.saveSleepData();
        this.renderSleepDashboard();
        this.showNotification('Sleep entry deleted', 'info');
    },

    // Get weekly sleep statistics
    getWeeklyStats() {
        const weekData = this.sleepData.slice(0, 7);
        if (weekData.length === 0) return null;

        const totalHours = weekData.reduce((acc, entry) => {
            const [hours, mins] = entry.duration.replace('h', '').replace('m', '').split(' ').map(Number);
            return acc + hours + (mins || 0) / 60;
        }, 0);

        const avgQuality = weekData.reduce((acc, entry) => acc + entry.quality, 0) / weekData.length;

        return {
            avgDuration: (totalHours / weekData.length).toFixed(1),
            avgQuality: avgQuality.toFixed(1),
            totalEntries: weekData.length
        };
    },

    // Render sleep dashboard
    renderSleepDashboard() {
        const container = document.getElementById('sleepTrackerContent');
        if (!container) return;

        const stats = this.getWeeklyStats();
        const recentEntries = this.sleepData.slice(0, 5);

        container.innerHTML = `
            <div class="sleep-dashboard">
                <!-- Sleep Stats Cards -->
                <div class="sleep-stats-row">
                    <div class="sleep-stat-card">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats ? stats.avgDuration : 0}h</span>
                            <span class="stat-label">Avg Sleep/night</span>
                        </div>
                    </div>
                    <div class="sleep-stat-card">
                        <div class="stat-icon"><i class="fas fa-star"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats ? stats.avgQuality : 0}</span>
                            <span class="stat-label">Avg Quality</span>
                        </div>
                    </div>
                    <div class="sleep-stat-card">
                        <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats ? stats.totalEntries : 0}</span>
                            <span class="stat-label">Nights Tracked</span>
                        </div>
                    </div>
                </div>
                
                <!-- Add Sleep Entry Form -->
                <div class="sleep-form-card">
                    <h3><i class="fas fa-plus-circle"></i> Log Sleep</h3>
                    <form id="sleepForm" class="sleep-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Bedtime</label>
                                <input type="time" id="bedtime" value="22:00" required>
                            </div>
                            <div class="form-group">
                                <label>Wake Time</label>
                                <input type="time" id="wakeTime" value="07:00" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Sleep Quality (1-10)</label>
                            <input type="range" id="sleepQuality" min="1" max="10" value="7" class="quality-slider">
                            <div class="quality-value">7</div>
                        </div>
                        <div class="form-group">
                            <label>Notes (optional)</label>
                            <input type="text" id="sleepNotes" placeholder="How did you sleep?">
                        </div>
                        <div class="form-group">
                            <label>Dreams (optional)</label>
                            <input type="text" id="sleepDreams" placeholder="Any memorable dreams?">
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Sleep Entry
                        </button>
                    </form>
                </div>
                
                <!-- Recent Sleep Entries -->
                <div class="sleep-entries-card">
                    <h3><i class="fas fa-history"></i> Recent Sleep</h3>
                    <div class="sleep-entries-list">
                        ${recentEntries.length > 0 ? recentEntries.map(entry => `
                            <div class="sleep-entry-item" data-id="${entry.id}">
                                <div class="entry-date">
                                    <span class="date">${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div class="entry-details">
                                    <span class="time-range"><i class="fas fa-moon"></i> ${entry.bedtime} - <i class="fas fa-sun"></i> ${entry.wakeTime}</span>
                                    <span class="duration">${entry.duration}</span>
                                </div>
                                <div class="entry-quality">
                                    <div class="quality-stars">
                                        ${this.renderQualityStars(entry.quality)}
                                    </div>
                                </div>
                                <button class="btn-icon delete-sleep-entry" onclick="SleepTracker.deleteSleepEntry(${entry.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('') : '<p class="no-data">No sleep data yet. Start tracking!</p>'}
                    </div>
                </div>
                
                <!-- Sleep Tips -->
                <div class="sleep-tips-card">
                    <h3><i class="fas fa-lightbulb"></i> Sleep Tips</h3>
                    <div class="tips-grid">
                        <div class="tip-item">
                            <i class="fas fa-bed"></i>
                            <span>Maintain consistent sleep schedule</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-mobile-alt"></i>
                            <span>Avoid screens 1 hour before bed</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-coffee"></i>
                            <span>Limit caffeine after 2 PM</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-temperature-low"></i>
                            <span>Keep room temperature cool (65-68°F)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup form submission
        const form = document.getElementById('sleepForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addSleepEntry({
                    bedtime: document.getElementById('bedtime').value,
                    wakeTime: document.getElementById('wakeTime').value,
                    quality: parseInt(document.getElementById('sleepQuality').value),
                    notes: document.getElementById('sleepNotes').value,
                    dreams: document.getElementById('sleepDreams').value
                });
                form.reset();
            });

            // Quality slider update
            const qualitySlider = document.getElementById('sleepQuality');
            const qualityValue = document.querySelector('.quality-value');
            if (qualitySlider && qualityValue) {
                qualitySlider.addEventListener('input', (e) => {
                    qualityValue.textContent = e.target.value;
                });
            }
        }
    },

    // Render quality stars
    renderQualityStars(quality) {
        let stars = '';
        for (let i = 1; i <= 10; i++) {
            if (i <= quality) {
                stars += '<i class="fas fa-star filled"></i>';
            } else {
                stars += '<i class="fas fa-star empty"></i>';
            }
        }
        return stars;
    },

    // Setup event listeners
    setupEventListeners() {
        // Custom event for refreshing sleep data
        document.addEventListener('sleepTracker:refresh', () => {
            this.loadSleepData();
            this.renderSleepDashboard();
        });
    },

    // Show notification
    showNotification(message, type) {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
};

// Make globally available
window.SleepTracker = SleepTracker;
