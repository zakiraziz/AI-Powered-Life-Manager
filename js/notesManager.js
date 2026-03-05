// ===== notesManager.js - Notes and Diary Module =====

const NotesManager = {
    notes: [],
    categories: ['Personal', 'Work', 'Ideas', 'Tasks', 'Journal', 'Other'],

    init() {
        this.loadNotes();
        this.renderNotes();
        this.setupEventListeners();
        console.log('[NotesManager] Initialized');
    },

    // Render full notes page
    render() {
        this.loadNotes();
        let html = `
            <div class="notes-page">
                <div class="page-header">
                    <h2><i class="fas fa-sticky-note"></i> Notes</h2>
                    <button class="btn btn-primary" onclick="NotesManager.createNote()">
                        <i class="fas fa-plus"></i> New Note
                    </button>
                </div>
                
                <div class="notes-search">
                    <input type="text" id="notesSearchInput" placeholder="Search notes..." 
                           onkeyup="NotesManager.filterNotes()">
                </div>
                
                <div class="notes-grid">
        `;

        if (this.notes.length === 0) {
            html += `
                <div class="empty-state">
                    <i class="fas fa-sticky-note" style="font-size: 48px; color: var(--text-tertiary);"></i>
                    <p>No notes yet. Create your first note!</p>
                    <button class="btn btn-primary" onclick="NotesManager.createNote()">
                        <i class="fas fa-plus"></i> Create First Note
                    </button>
                </div>
            `;
        } else {
            // Sort: pinned first, then by updated date
            const sortedNotes = [...this.notes].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });

            sortedNotes.forEach(note => {
                const date = new Date(note.updatedAt).toLocaleDateString();
                const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
                html += `
                    <div class="note-card" style="border-left: 4px solid ${note.color || '#6366f1'};">
                        <div class="note-header">
                            <h3>${note.isPinned ? '📌 ' : ''}${note.title}</h3>
                            <div class="note-actions">
                                <button class="btn-icon" onclick="NotesManager.togglePin('${note.id}')">
                                    <i class="fas fa-thumbtack"></i>
                                </button>
                                <button class="btn-icon" onclick="NotesManager.editNote('${note.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon" onclick="NotesManager.deleteNote('${note.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="note-preview">${preview}</p>
                        <div class="note-footer">
                            <span class="note-category">${note.category}</span>
                            <span class="note-date">${date}</span>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;

        // Render to pageContent
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.innerHTML = html;
        }
    },

    // Create a new note (open modal)
    createNote() {
        ModalManager.create({
            id: 'noteEditorModal',
            title: 'New Note',
            content: `
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="noteTitle" placeholder="Note title">
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select id="noteCategory">
                        ${this.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Content</label>
                    <textarea id="noteContent" rows="10" placeholder="Write your note..."></textarea>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <input type="color" id="noteColor" value="#6366f1">
                </div>
            `,
            size: 'large',
            buttons: [
                { id: 'cancel', text: 'Cancel', primary: false, onclick: 'ModalManager.close("noteEditorModal")' },
                { id: 'save', text: 'Save Note', primary: true, onclick: 'NotesManager.saveNewNote()' }
            ]
        });
    },

    saveNewNote() {
        const title = document.getElementById('noteTitle')?.value;
        const content = document.getElementById('noteContent')?.value;
        const category = document.getElementById('noteCategory')?.value;
        const color = document.getElementById('noteColor')?.value;

        if (title && content) {
            this.addNote(title, content, category);
            if (color) {
                const note = this.notes[this.notes.length - 1];
                if (note) {
                    note.color = color;
                    this.saveNotes();
                }
            }
            ModalManager.close('noteEditorModal');
            this.render();
            NotificationSystem.success('Note saved!');
        }
    },

    // Filter notes by search
    filterNotes() {
        const searchTerm = document.getElementById('notesSearchInput')?.value.toLowerCase() || '';
        const notes = document.querySelectorAll('.note-card');
        notes.forEach(note => {
            const title = note.querySelector('h3')?.textContent.toLowerCase() || '';
            const content = note.querySelector('.note-preview')?.textContent.toLowerCase() || '';
            if (title.includes(searchTerm) || content.includes(searchTerm)) {
                note.style.display = '';
            } else {
                note.style.display = 'none';
            }
        });
    },

    loadNotes() {
        this.notes = DataManager.get(DataManager.STORAGE_KEYS.NOTES, []);
    },

    saveNotes() {
        DataManager.set(DataManager.STORAGE_KEYS.NOTES, this.notes);
        this.renderNotes();
    },

    addNote(title, content, category) {
        if (!title || !content) {
            NotificationSystem.warning('Please fill in title and content');
            return null;
        }

        const note = {
            id: 'note_' + Date.now() + '_' + SecurityUtils.generateToken(4),
            title: SecurityUtils.sanitizeInput(title),
            content: SecurityUtils.sanitizeInput(content),
            category: category || 'Other',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPinned: false,
            isFavorite: false,
            color: '#6366f1'
        };

        this.notes.unshift(note);
        this.saveNotes();
        NotificationSystem.success('Note saved! 📝', 2000);
        return note;
    },

    updateNote(id, title, content, category) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return null;

        note.title = SecurityUtils.sanitizeInput(title);
        note.content = SecurityUtils.sanitizeInput(content);
        note.category = category || note.category;
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        NotificationSystem.success('Note updated!', 2000);
        return note;
    },

    deleteNote(id) {
        ModalManager.confirm('Delete this note?').then(function (confirmed) {
            if (confirmed) {
                NotesManager.notes = NotesManager.notes.filter(function (n) { return n.id !== id; });
                NotesManager.saveNotes();
                NotificationSystem.info('Note deleted', 2000);
            }
        });
    },

    togglePin(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.isPinned = !note.isPinned;
            this.saveNotes();
        }
    },

    toggleFavorite(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.isFavorite = !note.isFavorite;
            this.saveNotes();
        }
    },

    setNoteColor(id, color) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.color = color;
            this.saveNotes();
        }
    },

    getNote(id) {
        return this.notes.find(n => n.id === id);
    },

    searchNotes(query) {
        if (!query) return this.notes;

        query = query.toLowerCase();
        return this.notes.filter(function (note) {
            return note.title.toLowerCase().includes(query) ||
                note.content.toLowerCase().includes(query) ||
                note.category.toLowerCase().includes(query);
        });
    },

    filterByCategory(category) {
        if (!category || category === 'All') return this.notes;
        return this.notes.filter(function (note) {
            return note.category === category;
        });
    },

    getRecentNotes(limit) {
        limit = limit || 5;
        return this.notes.slice(0, limit);
    },

    getNotesByDate(date) {
        const dateStr = date || new Date().toISOString().split('T')[0];
        return this.notes.filter(function (note) {
            return note.createdAt.split('T')[0] === dateStr;
        });
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
        if (diff < 604800000) return Math.floor(diff / 86400000) + ' days ago';

        return date.toLocaleDateString();
    },

    renderNotes(filter) {
        const container = document.getElementById('notesContainer');
        if (!container) return;

        let notesToRender = this.notes;

        // Apply filter
        if (filter) {
            if (filter.category && filter.category !== 'All') {
                notesToRender = this.filterByCategory(filter.category);
            }
            if (filter.search) {
                notesToRender = this.searchNotes(filter.search);
            }
        }

        // Sort: pinned first, then by date
        notesToRender.sort(function (a, b) {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        if (notesToRender.length === 0) {
            container.innerHTML = '<div class="empty-state">' +
                '<i class="fas fa-sticky-note"></i>' +
                '<p>No notes yet. Create your first note!</p>' +
                '</div>';
            return;
        }

        container.innerHTML = notesToRender.map(function (note) {
            const preview = note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content;
            const dateFormatted = NotesManager.formatDate(note.updatedAt);

            return '<div class="note-card" style="border-left-color: ' + note.color + ';" data-note-id="' + note.id + '">' +
                '<div class="note-header">' +
                '<div class="note-title-row">' +
                '<h4 class="note-title">' + SecurityUtils.escapeHtml(note.title) + '</h4>' +
                '<div class="note-badges">' +
                (note.isPinned ? '<span class="note-badge pinned"><i class="fas fa-thumbtack"></i></span>' : '') +
                (note.isFavorite ? '<span class="note-badge favorite"><i class="fas fa-star"></i></span>' : '') +
                '</div>' +
                '</div>' +
                '<span class="note-category" style="background: ' + note.color + '20; color: ' + note.color + ';">' + note.category + '</span>' +
                '</div>' +
                '<div class="note-content">' + SecurityUtils.escapeHtml(preview) + '</div>' +
                '<div class="note-footer">' +
                '<span class="note-date">' + dateFormatted + '</span>' +
                '<div class="note-actions">' +
                '<button class="note-action-btn" onclick="NotesManager.editNote(\'' + note.id + '\')" title="Edit"><i class="fas fa-edit"></i></button>' +
                '<button class="note-action-btn" onclick="NotesManager.togglePin(\'' + note.id + '\')" title="Pin">' +
                (note.isPinned ? '<i class="fas fa-thumbtack"></i>' : '<i class="far fa-thumbtack"></i>') +
                '</button>' +
                '<button class="note-action-btn" onclick="NotesManager.toggleFavorite(\'' + note.id + '\')" title="Favorite">' +
                (note.isFavorite ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>') +
                '</button>' +
                '<button class="note-action-btn delete" onclick="NotesManager.deleteNote(\'' + note.id + '\')" title="Delete"><i class="fas fa-trash"></i></button>' +
                '</div>' +
                '</div>' +
                '</div>';
        }).join('');

        // Update note count
        const countEl = document.getElementById('notesCount');
        if (countEl) countEl.textContent = this.notes.length;
    },

    openNoteEditor(noteId) {
        const modal = document.getElementById('noteEditorModal');
        if (!modal) return;

        const titleInput = document.getElementById('noteTitleInput');
        const contentInput = document.getElementById('noteContentInput');
        const categorySelect = document.getElementById('noteCategorySelect');
        const colorPicker = document.getElementById('noteColorPicker');
        const saveBtn = document.getElementById('saveNoteBtn');
        const modalTitle = document.getElementById('noteEditorTitle');

        if (noteId) {
            // Editing existing note
            const note = this.getNote(noteId);
            if (!note) return;

            if (titleInput) titleInput.value = note.title;
            if (contentInput) contentInput.value = note.content;
            if (categorySelect) categorySelect.value = note.category;
            if (colorPicker) colorPicker.value = note.color;
            if (modalTitle) modalTitle.textContent = 'Edit Note';

            if (saveBtn) {
                saveBtn.onclick = function () {
                    NotesManager.updateNote(noteId,
                        titleInput ? titleInput.value : '',
                        contentInput ? contentInput.value : '',
                        categorySelect ? categorySelect.value : 'Other'
                    );
                    NotesManager.closeNoteEditor();
                };
            }
        } else {
            // New note
            if (titleInput) titleInput.value = '';
            if (contentInput) contentInput.value = '';
            if (categorySelect) categorySelect.value = 'Other';
            if (colorPicker) colorPicker.value = '#6366f1';
            if (modalTitle) modalTitle.textContent = 'New Note';

            if (saveBtn) {
                saveBtn.onclick = function () {
                    NotesManager.addNote(
                        titleInput ? titleInput.value : '',
                        contentInput ? contentInput.value : '',
                        categorySelect ? categorySelect.value : 'Other'
                    );
                    NotesManager.closeNoteEditor();
                };
            }
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        if (titleInput) titleInput.focus();
    },

    closeNoteEditor() {
        const modal = document.getElementById('noteEditorModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    editNote(id) {
        this.openNoteEditor(id);
    },

    setupEventListeners: function () {
        document.addEventListener('DOMContentLoaded', function () {
            // New note button
            const newNoteBtn = document.getElementById('newNoteBtn');
            if (newNoteBtn) {
                newNoteBtn.addEventListener('click', function () {
                    NotesManager.openNoteEditor(null);
                });
            }

            // Close modal
            const closeNoteBtn = document.getElementById('closeNoteEditor');
            if (closeNoteBtn) {
                closeNoteBtn.addEventListener('click', function () {
                    NotesManager.closeNoteEditor();
                });
            }

            // Search
            const searchInput = document.getElementById('notesSearch');
            if (searchInput) {
                searchInput.addEventListener('input', function (e) {
                    NotesManager.renderNotes({ search: e.target.value });
                });
            }

            // Category filter
            const categoryFilter = document.getElementById('notesCategoryFilter');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', function (e) {
                    NotesManager.renderNotes({ category: e.target.value });
                });
            }
        });
    }
};

// Make available globally
window.NotesManager = NotesManager;
