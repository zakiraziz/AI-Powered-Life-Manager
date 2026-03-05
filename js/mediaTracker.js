// ===== Media Tracker Module =====
const MediaTracker = {
    STORAGE_KEY: 'lifeos_media_data',

    // Media types
    TYPES: {
        BOOK: 'book',
        MOVIE: 'movie',
        SHOW: 'show',
        PODCAST: 'podcast',
        AUDIOBOOK: 'audiobook'
    },

    // Status options
    STATUS: {
        WANT_TO: 'want_to',
        READING_WATCHING: 'reading_watching',
        COMPLETED: 'completed',
        DROPPED: 'dropped',
        ON_HOLD: 'on_hold'
    },

    // Ratings
    RATINGS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

    // Initialize media tracker
    init() {
        this.loadMediaData();
        this.renderMediaDashboard();
        this.setupEventListeners();
    },

    // Load media data from storage
    loadMediaData() {
        this.mediaData = DataManager.get(this.STORAGE_KEY, {
            books: [],
            movies: [],
            shows: [],
            podcasts: [],
            audiobooks: []
        });
    },

    // Save media data to storage
    saveMediaData() {
        DataManager.set(this.STORAGE_KEY, this.mediaData);
    },

    // Get media by type
    getMediaByType(type) {
        return this.mediaData[type] || [];
    },

    // Add new media item
    addMediaItem(type, item) {
        const newItem = {
            id: Date.now(),
            title: item.title,
            author: item.author || '', // For books
            director: item.director || '', // For movies
            genre: item.genre || '',
            status: item.status || this.STATUS.WANT_TO,
            rating: item.rating || null,
            progress: item.progress || 0, // For books/shows
            totalEpisodes: item.totalEpisodes || null, // For shows
            episodesWatched: item.episodesWatched || 0,
            notes: item.notes || '',
            dateAdded: new Date().toISOString(),
            dateCompleted: null,
            coverImage: item.coverImage || ''
        };

        if (!this.mediaData[type]) {
            this.mediaData[type] = [];
        }

        this.mediaData[type].unshift(newItem);
        this.saveMediaData();
        this.renderMediaDashboard();
        this.showNotification(`Added: ${item.title}`, 'success');
    },

    // Update media item
    updateMediaItem(type, id, updates) {
        const items = this.mediaData[type];
        const index = items.findIndex(item => item.id === id);

        if (index !== -1) {
            items[index] = { ...items[index], ...updates };

            if (updates.status === this.STATUS.COMPLETED && !items[index].dateCompleted) {
                items[index].dateCompleted = new Date().toISOString();
            }

            this.saveMediaData();
            this.renderMediaDashboard();
        }
    },

    // Delete media item
    deleteMediaItem(type, id) {
        this.mediaData[type] = this.mediaData[type].filter(item => item.id !== id);
        this.saveMediaData();
        this.renderMediaDashboard();
        this.showNotification('Media item deleted', 'info');
    },

    // Get statistics
    getStats() {
        const stats = {
            books: { total: 0, completed: 0, reading: 0 },
            movies: { total: 0, completed: 0 },
            shows: { total: 0, completed: 0, watching: 0 },
            podcasts: { total: 0, completed: 0 },
            audiobooks: { total: 0, completed: 0 }
        };

        Object.keys(this.mediaData).forEach(type => {
            this.mediaData[type].forEach(item => {
                stats[type].total++;
                if (item.status === this.STATUS.COMPLETED) {
                    stats[type].completed++;
                }
                if (item.status === this.STATUS.READING_WATCHING) {
                    if (type === 'books') stats.books.reading++;
                    if (type === 'shows') stats.shows.watching++;
                }
            });
        });

        return stats;
    },

    // Render media dashboard
    renderMediaDashboard() {
        const container = document.getElementById('mediaTrackerContent');
        if (!container) return;

        const stats = this.getStats();
        const currentType = this.currentType || this.TYPES.BOOK;

        container.innerHTML = `
            <div class="media-dashboard">
                <!-- Media Stats -->
                <div class="media-stats-row">
                    <div class="media-stat-card" onclick="MediaTracker.switchType('${this.TYPES.BOOK}')">
                        <div class="stat-icon"><i class="fas fa-book"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.books.completed}/${stats.books.total}</span>
                            <span class="stat-label">Books Read</span>
                        </div>
                    </div>
                    <div class="media-stat-card" onclick="MediaTracker.switchType('${this.TYPES.MOVIE}')">
                        <div class="stat-icon"><i class="fas fa-film"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.movies.completed}/${stats.movies.total}</span>
                            <span class="stat-label">Movies Watched</span>
                        </div>
                    </div>
                    <div class="media-stat-card" onclick="MediaTracker.switchType('${this.TYPES.SHOW}')">
                        <div class="stat-icon"><i class="fas fa-tv"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.shows.completed}/${stats.shows.total}</span>
                            <span class="stat-label">Shows Completed</span>
                        </div>
                    </div>
                    <div class="media-stat-card" onclick="MediaTracker.switchType('${this.TYPES.PODCAST}')">
                        <div class="stat-icon"><i class="fas fa-microphone"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.podcasts.completed}/${stats.podcasts.total}</span>
                            <span class="stat-label">Podcasts</span>
                        </div>
                    </div>
                </div>
                
                <!-- Type Tabs -->
                <div class="media-tabs">
                    <button class="tab-btn ${currentType === this.TYPES.BOOK ? 'active' : ''}" 
                            onclick="MediaTracker.switchType('${this.TYPES.BOOK}')">
                        <i class="fas fa-book"></i> Books
                    </button>
                    <button class="tab-btn ${currentType === this.TYPES.MOVIE ? 'active' : ''}" 
                            onclick="MediaTracker.switchType('${this.TYPES.MOVIE}')">
                        <i class="fas fa-film"></i> Movies
                    </button>
                    <button class="tab-btn ${currentType === this.TYPES.SHOW ? 'active' : ''}" 
                            onclick="MediaTracker.switchType('${this.TYPES.SHOW}')">
                        <i class="fas fa-tv"></i> TV Shows
                    </button>
                    <button class="tab-btn ${currentType === this.TYPES.PODCAST ? 'active' : ''}" 
                            onclick="MediaTracker.switchType('${this.TYPES.PODCAST}')">
                        <i class="fas fa-microphone"></i> Podcasts
                    </button>
                    <button class="tab-btn ${currentType === this.TYPES.AUDIOBOOK ? 'active' : ''}" 
                            onclick="MediaTracker.switchType('${this.TYPES.AUDIOBOOK}')">
                        <i class="fas fa-headphones"></i> Audiobooks
                    </button>
                </div>
                
                <!-- Add Media Form -->
                <div class="media-form-card">
                    <h3><i class="fas fa-plus-circle"></i> Add ${this.getTypeName(currentType)}</h3>
                    <form id="mediaForm" class="media-form">
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="mediaTitle" placeholder="${this.getPlaceholderTitle(currentType)}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${this.getAuthorLabel(currentType)}</label>
                                <input type="text" id="mediaAuthor" placeholder="${this.getPlaceholderAuthor(currentType)}">
                            </div>
                            <div class="form-group">
                                <label>Genre</label>
                                <input type="text" id="mediaGenre" placeholder="e.g., Sci-Fi, Romance">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Status</label>
                                <select id="mediaStatus">
                                    <option value="${this.STATUS.WANT_TO}">Want to ${this.getTypeAction(currentType)}</option>
                                    <option value="${this.STATUS.READING_WATCHING}">Currently ${this.getTypeAction(currentType)}</option>
                                    <option value="${this.STATUS.COMPLETED}">Completed</option>
                                    <option value="${this.STATUS.ON_HOLD}">On Hold</option>
                                    <option value="${this.STATUS.DROPPED}">Dropped</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Rating</label>
                                <select id="mediaRating">
                                    <option value="">Not Rated</option>
                                    ${this.RATINGS.map(r => `<option value="${r}">${r}/10</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        ${currentType === this.TYPES.SHOW ? `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Total Episodes</label>
                                <input type="number" id="mediaTotalEpisodes" placeholder="e.g., 12">
                            </div>
                            <div class="form-group">
                                <label>Episodes Watched</label>
                                <input type="number" id="mediaEpisodesWatched" placeholder="0" value="0">
                            </div>
                        </div>
                        ` : ''}
                        ${currentType === this.TYPES.BOOK || currentType === this.TYPES.AUDIOBOOK ? `
                        <div class="form-group">
                            <label>Progress (pages/chapters)</label>
                            <input type="number" id="mediaProgress" placeholder="0" value="0">
                        </div>
                        ` : ''}
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="mediaNotes" placeholder="Your thoughts..." rows="2"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Add ${this.getTypeName(currentType)}
                        </button>
                    </form>
                </div>
                
                <!-- Media List -->
                <div class="media-list-card">
                    <h3><i class="fas fa-list"></i> My ${this.getTypeName(currentType)}s</h3>
                    <div class="media-list">
                        ${this.renderMediaList(currentType)}
                    </div>
                </div>
            </div>
        `;

        // Setup form submission
        const form = document.getElementById('mediaForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addMediaItem(currentType, {
                    title: document.getElementById('mediaTitle').value,
                    author: document.getElementById('mediaAuthor').value,
                    director: document.getElementById('mediaAuthor').value,
                    genre: document.getElementById('mediaGenre').value,
                    status: document.getElementById('mediaStatus').value,
                    rating: document.getElementById('mediaRating').value ? parseInt(document.getElementById('mediaRating').value) : null,
                    progress: parseInt(document.getElementById('mediaProgress')?.value || 0),
                    totalEpisodes: parseInt(document.getElementById('mediaTotalEpisodes')?.value || 0),
                    episodesWatched: parseInt(document.getElementById('mediaEpisodesWatched')?.value || 0),
                    notes: document.getElementById('mediaNotes').value
                });
                form.reset();
            });
        }
    },

    // Switch media type
    switchType(type) {
        this.currentType = type;
        this.renderMediaDashboard();
    },

    // Render media list
    renderMediaList(type) {
        const items = this.getMediaByType(type);

        if (items.length === 0) {
            return '<p class="no-data">No media yet. Add your first one above!</p>';
        }

        return items.map(item => `
            <div class="media-item" data-id="${item.id}">
                <div class="media-cover">
                    ${item.coverImage ? `<img src="${item.coverImage}" alt="${item.title}">` :
                `<i class="fas fa-${this.getTypeIcon(type)}"></i>`}
                </div>
                <div class="media-info">
                    <h4 class="media-title">${item.title}</h4>
                    <div class="media-meta">
                        ${item.author || item.director ? `<span><i class="fas fa-user"></i> ${item.author || item.director}</span>` : ''}
                        ${item.genre ? `<span><i class="fas fa-tag"></i> ${item.genre}</span>` : ''}
                    </div>
                    <div class="media-status ${item.status}">${this.getStatusLabel(item.status)}</div>
                    ${item.rating ? `<div class="media-rating">${this.renderRating(item.rating)}</div>` : ''}
                    ${item.progress > 0 ? `<div class="media-progress">Progress: ${item.progress}</div>` : ''}
                    ${item.totalEpisodes ? `<div class="media-episodes">${item.episodesWatched}/${item.totalEpisodes} episodes</div>` : ''}
                </div>
                <div class="media-actions">
                    <button class="btn-icon" onclick="MediaTracker.editMediaItem('${type}', ${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-media" onclick="MediaTracker.deleteMediaItem('${type}', ${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Render rating stars
    renderRating(rating) {
        let stars = '';
        for (let i = 1; i <= 10; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star filled"></i>';
            }
        }
        return stars;
    },

    // Edit media item
    editMediaItem(type, id) {
        const items = this.getMediaByType(type);
        const item = items.find(i => i.id === id);
        if (!item) return;

        // Fill form
        document.getElementById('mediaTitle').value = item.title;
        document.getElementById('mediaAuthor').value = item.author || item.director || '';
        document.getElementById('mediaGenre').value = item.genre || '';
        document.getElementById('mediaStatus').value = item.status;
        document.getElementById('mediaRating').value = item.rating || '';
        document.getElementById('mediaNotes').value = item.notes || '';

        if (type === this.TYPES.SHOW) {
            document.getElementById('mediaTotalEpisodes').value = item.totalEpisodes || '';
            document.getElementById('mediaEpisodesWatched').value = item.episodesWatched || 0;
        }

        if (type === this.TYPES.BOOK || type === this.TYPES.AUDIOBOOK) {
            document.getElementById('mediaProgress').value = item.progress || 0;
        }

        // Delete old and let user add new
        if (confirm('Edit this item? Click OK to update the current form, then submit.')) {
            this.deleteMediaItem(type, id);
        }
    },

    // Helper methods
    getTypeName(type) {
        const names = {
            [this.TYPES.BOOK]: 'Book',
            [this.TYPES.MOVIE]: 'Movie',
            [this.TYPES.SHOW]: 'TV Show',
            [this.TYPES.PODCAST]: 'Podcast',
            [this.TYPES.AUDIOBOOK]: 'Audiobook'
        };
        return names[type] || 'Media';
    },

    getTypeIcon(type) {
        const icons = {
            [this.TYPES.BOOK]: 'book-open',
            [this.TYPES.MOVIE]: 'film',
            [this.TYPES.SHOW]: 'tv',
            [this.TYPES.PODCAST]: 'microphone',
            [this.TYPES.AUDIOBOOK]: 'headphones'
        };
        return icons[type] || 'media';
    },

    getTypeAction(type) {
        const actions = {
            [this.TYPES.BOOK]: 'Read',
            [this.TYPES.MOVIE]: 'Watch',
            [this.TYPES.SHOW]: 'Watch',
            [this.TYPES.PODCAST]: 'Listen',
            [this.TYPES.AUDIOBOOK]: 'Listen'
        };
        return actions[type] || 'Consume';
    },

    getAuthorLabel(type) {
        if (type === this.TYPES.MOVIE) return 'Director';
        if (type === this.TYPES.PODCAST) return 'Host/Creator';
        return 'Author/Creator';
    },

    getPlaceholderTitle(type) {
        if (type === this.TYPES.BOOK) return 'Book title';
        if (type === this.TYPES.MOVIE) return 'Movie title';
        if (type === this.TYPES.SHOW) return 'TV Show title';
        if (type === this.TYPES.PODCAST) return 'Podcast name';
        return 'Audiobook title';
    },

    getPlaceholderAuthor(type) {
        if (type === this.TYPES.MOVIE) return 'Director';
        if (type === this.TYPES.PODCAST) return 'Host';
        return 'Author';
    },

    getStatusLabel(status) {
        const labels = {
            [this.STATUS.WANT_TO]: 'Want to Consume',
            [this.STATUS.READING_WATCHING]: 'Currently Consuming',
            [this.STATUS.COMPLETED]: 'Completed',
            [this.STATUS.ON_HOLD]: 'On Hold',
            [this.STATUS.DROPPED]: 'Dropped'
        };
        return labels[status] || status;
    },

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('mediaTracker:refresh', () => {
            this.loadMediaData();
            this.renderMediaDashboard();
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
window.MediaTracker = MediaTracker;
