// ===== Voice Notes Module =====
const VoiceNotes = {
    STORAGE_KEY: 'lifeos_voice_notes',

    isRecording: false,
    isPlaying: false,
    mediaRecorder: null,
    audioChunks: [],
    currentAudio: null,
    currentPlayingId: null,

    // Initialize voice notes
    init() {
        this.loadNotes();
        this.renderVoiceNotesDashboard();
        this.setupEventListeners();
        this.checkPermissions();
    },

    // Load voice notes from storage
    loadNotes() {
        this.notes = DataManager.get(this.STORAGE_KEY, []);
    },

    // Save voice notes to storage
    saveNotes() {
        DataManager.set(this.STORAGE_KEY, this.notes);
    },

    // Check microphone permissions
    checkPermissions() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    console.log('Microphone permission granted');
                    this.hasPermission = true;
                })
                .catch(() => {
                    console.log('Microphone permission denied');
                    this.hasPermission = false;
                });
        }
    },

    // Start recording
    async startRecording() {
        if (this.isRecording) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showNotification('Voice recording not supported in this browser', 'error');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.processRecording();
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;

            this.updateRecordingUI(true);
            this.showNotification('Recording started...', 'info');

        } catch (error) {
            console.error('Error starting recording:', error);
            this.showNotification('Could not access microphone', 'error');
        }
    },

    // Stop recording
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        this.isRecording = false;

        this.updateRecordingUI(false);
        this.showNotification('Recording stopped', 'success');
    },

    // Toggle recording
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    },

    // Process recorded audio
    processRecording() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Audio = reader.result;

            const newNote = {
                id: Date.now(),
                audioUrl: base64Audio,
                title: this.generateTitle(),
                duration: this.calculateDuration(),
                createdAt: new Date().toISOString(),
                transcript: '',
                tags: [],
                isFavorite: false
            };

            this.notes.unshift(newNote);
            this.saveNotes();
            this.renderVoiceNotesDashboard();
            this.showNotification('Voice note saved!', 'success');
        };
        reader.readAsDataURL(audioBlob);
    },

    // Calculate recording duration
    calculateDuration() {
        const totalChunks = this.audioChunks.length;
        // Estimate ~1 second per chunk on average
        return Math.max(1, Math.round(totalChunks));
    },

    // Generate title from timestamp
    generateTitle() {
        const now = new Date();
        return `Voice Note ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    },

    // Play voice note
    playNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        // Stop current playback if any
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        if (this.currentPlayingId === noteId) {
            // Stop playing
            this.currentPlayingId = null;
            this.updatePlayButton(noteId, false);
            return;
        }

        // Start playing
        this.currentAudio = new Audio(note.audioUrl);
        this.currentPlayingId = noteId;

        this.currentAudio.onended = () => {
            this.currentPlayingId = null;
            this.updatePlayButton(noteId, false);
        };

        this.currentAudio.play();
        this.updatePlayButton(noteId, true);
        this.showNotification('Playing voice note...', 'info');
    },

    // Update play button
    updatePlayButton(noteId, isPlaying) {
        const btn = document.getElementById(`playBtn-${noteId}`);
        if (btn) {
            btn.innerHTML = isPlaying ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-play"></i>';
            btn.classList.toggle('playing', isPlaying);
        }
    },

    // Delete voice note
    deleteNote(noteId) {
        if (!confirm('Delete this voice note?')) return;

        this.notes = this.notes.filter(note => note.id !== noteId);
        this.saveNotes();
        this.renderVoiceNotesDashboard();
        this.showNotification('Voice note deleted', 'info');
    },

    // Toggle favorite
    toggleFavorite(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.isFavorite = !note.isFavorite;
            this.saveNotes();
            this.renderVoiceNotesDashboard();
        }
    },

    // Update note title
    updateNoteTitle(noteId, newTitle) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.title = newTitle;
            this.saveNotes();
            this.renderVoiceNotesDashboard();
        }
    },

    // Add transcript placeholder
    addTranscript(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            const transcript = prompt('Add transcript (or notes) for this voice note:');
            if (transcript) {
                note.transcript = transcript;
                this.saveNotes();
                this.renderVoiceNotesDashboard();
            }
        }
    },

    // Format duration
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    },

    // Update recording UI
    updateRecordingUI(isRecording) {
        const recordBtn = document.getElementById('recordVoiceBtn');
        const statusEl = document.getElementById('recordingStatus');

        if (recordBtn) {
            recordBtn.classList.toggle('recording', isRecording);
            recordBtn.innerHTML = isRecording ?
                '<i class="fas fa-stop"></i> Stop' :
                '<i class="fas fa-microphone"></i> Record';
        }

        if (statusEl) {
            statusEl.textContent = isRecording ? '🔴 Recording...' : '';
            statusEl.classList.toggle('active', isRecording);
        }
    },

    // Render voice notes dashboard
    renderVoiceNotesDashboard() {
        const container = document.getElementById('voiceNotesContent');
        if (!container) return;

        const recentNotes = this.notes.slice(0, 10);
        const favorites = this.notes.filter(n => n.isFavorite);

        container.innerHTML = `
            <div class="voice-notes-dashboard">
                <!-- Recording Section -->
                <div class="recording-section">
                    <div class="recording-card">
                        <h3><i class="fas fa-microphone"></i> Voice Recorder</h3>
                        
                        <div class="recording-controls">
                            <button id="recordVoiceBtn" class="record-btn ${this.isRecording ? 'recording' : ''}" 
                                    onclick="VoiceNotes.toggleRecording()">
                                <i class="fas fa-microphone"></i>
                                ${this.isRecording ? 'Stop' : 'Record'}
                            </button>
                            <div id="recordingStatus" class="recording-status"></div>
                        </div>
                        
                        <p class="recording-hint">
                            ${this.hasPermission === false ?
                '⚠️ Microphone access denied. Please enable in browser settings.' :
                'Click to start recording. Click again to stop.'}
                        </p>
                    </div>
                </div>
                
                <!-- Stats -->
                <div class="voice-stats-row">
                    <div class="voice-stat-card">
                        <div class="stat-icon"><i class="fas fa-microphone"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${this.notes.length}</span>
                            <span class="stat-label">Total Notes</span>
                        </div>
                    </div>
                    <div class="voice-stat-card">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${this.formatTotalDuration()}</span>
                            <span class="stat-label">Total Duration</span>
                        </div>
                    </div>
                    <div class="voice-stat-card">
                        <div class="stat-icon"><i class="fas fa-heart"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${favorites.length}</span>
                            <span class="stat-label">Favorites</span>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Notes -->
                <div class="notes-list-card">
                    <h3><i class="fas fa-list"></i> Recent Voice Notes</h3>
                    <div class="notes-list">
                        ${recentNotes.length > 0 ? recentNotes.map(note => `
                            <div class="voice-note-item ${note.isFavorite ? 'favorite' : ''}" data-id="${note.id}">
                                <div class="note-play">
                                    <button id="playBtn-${note.id}" class="play-btn" 
                                            onclick="VoiceNotes.playNote(${note.id})">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                                <div class="note-info" onclick="VoiceNotes.playNote(${note.id})">
                                    <input type="text" class="note-title-input" 
                                           value="${note.title}" 
                                           onclick="event.stopPropagation()"
                                           onchange="VoiceNotes.updateNoteTitle(${note.id}, this.value)">
                                    <div class="note-meta">
                                        <span><i class="fas fa-clock"></i> ${this.formatDuration(note.duration)}</span>
                                        <span>${new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    ${note.transcript ? `<div class="note-transcript">${note.transcript}</div>` : ''}
                                </div>
                                <div class="note-actions">
                                    <button class="btn-icon" onclick="VoiceNotes.toggleFavorite(${note.id})" title="Favorite">
                                        <i class="fas fa-heart ${note.isFavorite ? 'active' : ''}"></i>
                                    </button>
                                    <button class="btn-icon" onclick="VoiceNotes.addTranscript(${note.id})" title="Add Transcript">
                                        <i class="fas fa-file-alt"></i>
                                    </button>
                                    <button class="btn-icon" onclick="VoiceNotes.deleteNote(${note.id})" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<p class="no-data">No voice notes yet. Click record to create one!</p>'}
                    </div>
                </div>
                
                <!-- Quick Tips -->
                <div class="voice-tips-card">
                    <h3><i class="fas fa-lightbulb"></i> Voice Note Tips</h3>
                    <div class="tips-grid">
                        <div class="tip-item">
                            <i class="fas fa-lightbulb"></i>
                            <span>Capture quick ideas on the go</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-file-alt"></i>
                            <span>Add transcripts for easy searching</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-heart"></i>
                            <span>Favorite important notes</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-share"></i>
                            <span>Use notes for meeting summaries</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Format total duration
    formatTotalDuration() {
        const totalSeconds = this.notes.reduce((acc, note) => acc + (note.duration || 0), 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    },

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('voiceNotes:refresh', () => {
            this.loadNotes();
            this.renderVoiceNotesDashboard();
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
window.VoiceNotes = VoiceNotes;
