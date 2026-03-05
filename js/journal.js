// journal.js - Daily Journal Feature

const Journal = {
    STORAGE_KEY: 'lifeos_journal',

    // Initialize the journal module
    init() {
        console.log('[Debug] Journal module initialized');
    },

    // Render the full journal page
    render() {
        const entries = DataManager.get(Journal.STORAGE_KEY, []);
        let html = `
            <div class="journal-page">
                <div class="page-header">
                    <h2><i class="fas fa-book-open"></i> Daily Journal</h2>
                    <button class="btn btn-primary" onclick="Journal.open()">
                        <i class="fas fa-plus"></i> New Entry
                    </button>
                </div>
                <div class="journal-entries">
        `;

        if (entries.length === 0) {
            html += `
                <div class="empty-state">
                    <i class="fas fa-book-open" style="font-size: 48px; color: var(--text-tertiary);"></i>
                    <p>No journal entries yet. Start writing your first entry!</p>
                    <button class="btn btn-primary" onclick="Journal.open()">
                        <i class="fas fa-plus"></i> Create First Entry
                    </button>
                </div>
            `;
        } else {
            entries.forEach(entry => {
                const date = new Date(entry.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                html += `
                    <div class="journal-entry-card">
                        <div class="entry-header">
                            <h3>${entry.title || 'Untitled'}</h3>
                            <span class="entry-date">${formattedDate}</span>
                        </div>
                        <p class="entry-content">${entry.content}</p>
                        <div class="entry-actions">
                            <button class="btn-icon" onclick="Journal.delete(${entry.id})">
                                <i class="fas fa-trash"></i>
                            </button>
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

    // Delete an entry
    delete(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            let entries = DataManager.get(Journal.STORAGE_KEY, []);
            entries = entries.filter(e => e.id !== id);
            DataManager.set(Journal.STORAGE_KEY, entries);
            this.render(); // Re-render
            NotificationSystem.success('Entry deleted');
        }
    },

    // Open modal to add a new entry
    open() {
        const modal = document.getElementById('journalModal');
        if (modal) {
            modal.classList.remove('hidden');
            const textarea = document.getElementById('journalContent');
            if (textarea) textarea.value = '';
            const titleEl = document.getElementById('journalTitle');
            if (titleEl) titleEl.value = '';
        }
    },

    // Save entry
    save() {
        const contentEl = document.getElementById('journalContent');
        const titleEl = document.getElementById('journalTitle');
        if (!contentEl) return;
        const entry = {
            id: Date.now(),
            title: titleEl ? titleEl.value.trim() : 'Untitled',
            content: contentEl.value.trim(),
            date: new Date().toISOString()
        };
        const entries = DataManager.get(Journal.STORAGE_KEY, []);
        entries.unshift(entry);
        DataManager.set(Journal.STORAGE_KEY, entries);
        ModalManager.close('journalModal');
        // Refresh dashboard widget if present
        if (window.WidgetDashboard) WidgetDashboard.renderDashboard();
    },

    // Render recent entries for dashboard widget
    renderWidget() {
        const entries = DataManager.get(Journal.STORAGE_KEY, []);
        const recent = entries.slice(0, 3);
        let html = `<div class="widget-header"><i class="fas fa-book"></i> <span>Journal</span></div>`;
        html += `<div class="widget-content">`;
        if (recent.length === 0) {
            html += `<p style="color: var(--text-tertiary); text-align:center;">No journal entries yet.</p>`;
        } else {
            recent.forEach(e => {
                const date = new Date(e.date).toLocaleDateString();
                html += `<div class="journal-entry" style="margin-bottom:0.5rem;">`;
                html += `<strong>${e.title || 'Untitled'}</strong> <span style="font-size:0.8rem; color: var(--text-tertiary);">${date}</span>`;
                html += `<p style="margin:0.2rem 0;">${e.content.substring(0, 60)}${e.content.length > 60 ? '...' : ''}</p>`;
                html += `</div>`;
            });
        }
        html += `<button class="widget-btn" style="margin-top:0.5rem;" onclick="Journal.open()"><i class="fas fa-plus"></i> New Entry</button>`;
        html += `</div>`;
        return html;
    }
};

// Expose globally
window.Journal = Journal;
