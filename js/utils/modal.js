// ===== MODAL SYSTEM =====

const ModalManager = {
    modals: new Map(),
    zIndex: 1000,

    create(config) {
        const {
            id,
            title = '',
            content = '',
            size = 'medium', // small, medium, large, full
            closable = true,
            closeOnOverlay = true,
            closeOnEscape = true,
            showCloseButton = true,
            buttons = [],
            onOpen = null,
            onClose = null
        } = config;

        // Remove existing modal with same id
        if (this.modals.has(id)) {
            this.close(id);
        }

        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal-wrapper';
        modal.id = id;
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: ${this.zIndex++};
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
        `;

        // Size classes
        const sizeClasses = {
            small: 'max-width: 400px',
            medium: 'max-width: 600px',
            large: 'max-width: 800px',
            full: 'max-width: 95vw; max-height: 95vh'
        };

        // Build modal HTML
        let buttonsHtml = '';
        if (buttons.length > 0) {
            buttonsHtml = '<div class="modal-buttons">' + buttons.map(btn => `
                <button class="modal-btn ${btn.primary ? 'primary' : ''}" 
                        data-action="${btn.id}">
                    ${btn.icon ? `<i class="${btn.icon}"></i> ` : ''}${btn.text}
                </button>
            `).join('') + '</div>';
        }

        modal.innerHTML = `
            <div class="modal-overlay" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
            "></div>
            <div class="modal-content" style="
                ${sizeClasses[size]}
                background: var(--bg-secondary, #1e293b);
                border-radius: 16px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                position: relative;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                transform: scale(0.9);
                transition: transform 0.3s;
            ">
                ${showCloseButton ? `
                    <button class="modal-close" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: transparent;
                        border: none;
                        color: var(--text-secondary, #94a3b8);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 8px;
                        transition: all 0.2s;
                        z-index: 10;
                    ">&times;</button>
                ` : ''}
                ${title ? `<div class="modal-header" style="
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1));
                ">
                    <h2 style="
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: var(--text-primary, #fff);
                    ">${SecurityUtils.escapeHtml(title)}</h2>
                </div>` : ''}
                <div class="modal-body" style="
                    padding: 24px;
                ">${content}</div>
                ${buttonsHtml ? `<div class="modal-footer" style="
                    padding: 16px 24px;
                    border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                ">${buttonsHtml}</div>` : ''}
            </div>
        `;

        // Add styles
        this.addStyles();

        // Add event listeners
        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');

        if (closeable && closeOnOverlay) {
            overlay.addEventListener('click', () => this.close(id));
        }

        if (closeable && showCloseButton) {
            closeBtn.addEventListener('click', () => this.close(id));
        }

        // Button handlers
        buttons.forEach(btn => {
            const btnElement = modal.querySelector(`[data-action="${btn.id}"]`);
            if (btnElement && btn.onClick) {
                btnElement.addEventListener('click', (e) => btn.onClick(e, { close: () => this.close(id) }));
            }
        });

        // Escape key handler
        if (closeable && closeOnEscape) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close(id);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            modal.escapeHandler = escapeHandler;
            document.addEventListener('keydown', escapeHandler);
        }

        // Store modal reference
        this.modals.set(id, {
            element: modal,
            config,
            onClose
        });

        // Add to DOM
        document.body.appendChild(modal);

        // Trigger open animation
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        });

        // Call onOpen callback
        if (onOpen) {
            onOpen(modal);
        }

        return modal;
    },

    addStyles() {
        if (document.getElementById('modal-system-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'modal-system-styles';
        style.textContent = `
            .modal-btn {
                padding: 10px 20px;
                border-radius: 8px;
                border: none;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--bg-primary, #334155);
                color: var(--text-primary, #fff);
            }
            .modal-btn:hover {
                background: var(--border-color, #475569);
            }
            .modal-btn.primary {
                background: var(--accent-primary, #6366f1);
                color: white;
            }
            .modal-btn.primary:hover {
                background: var(--accent-secondary, #4f46e5);
            }
        `;
        document.head.appendChild(style);
    },

    close(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { element, onClose } = modalData;
        const content = element.querySelector('.modal-content');

        // Animate out
        element.style.opacity = '0';
        element.style.visibility = 'hidden';
        content.style.transform = 'scale(0.9)';

        // Remove after animation
        setTimeout(() => {
            if (element.escapeHandler) {
                document.removeEventListener('keydown', element.escapeHandler);
            }
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.modals.delete(id);
            
            if (onClose) {
                onClose();
            }
        }, 300);
    },

    closeAll() {
        this.modals.forEach((_, id) => this.close(id));
    },

    // Helper methods for common modals
    alert(message, type = 'info') {
        return new Promise((resolve) => {
            const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
            
            this.create({
                id: 'alert-' + Date.now(),
                title: type.charAt(0).toUpperCase() + type.slice(1),
                content: `<p style="font-size: 1rem; color: var(--text-secondary);">${SecurityUtils.escapeHtml(message)}</p>`,
                size: 'small',
                buttons: [{
                    id: 'ok',
                    text: 'OK',
                    primary: true,
                    onClick: () => resolve(true)
                }]
            });
        });
    },

    confirm(message) {
        return new Promise((resolve) => {
            this.create({
                id: 'confirm-' + Date.now(),
                title: 'Confirm',
                content: `<p style="font-size: 1rem; color: var(--text-secondary);">${SecurityUtils.escapeHtml(message)}</p>`,
                size: 'small',
                buttons: [
                    {
                        id: 'cancel',
                        text: 'Cancel',
                        onClick: () => resolve(false)
                    },
                    {
                        id: 'confirm',
                        text: 'Confirm',
                        primary: true,
                        onClick: () => resolve(true)
                    }
                ]
            });
        });
    },

    prompt(title, defaultValue = '') {
        return new Promise((resolve) => {
            const inputId = 'prompt-input-' + Date.now();
            
            this.create({
                id: 'prompt-' + Date.now(),
                title,
                content: `
                    <input type="text" id="${inputId}" 
                           style="
                               width: 100%;
                               padding: 12px;
                               border-radius: 8px;
                               border: 1px solid var(--border-color);
                               background: var(--bg-primary);
                               color: var(--text-primary);
                               font-size: 1rem;
                           "
                           value="${SecurityUtils.escapeHtml(defaultValue)}"
                           autofocus>
                `,
                size: 'small',
                onOpen: () => {
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.focus();
                        input.select();
                    }
                },
                buttons: [
                    {
                        id: 'cancel',
                        text: 'Cancel',
                        onClick: () => resolve(null)
                    },
                    {
                        id: 'submit',
                        text: 'Submit',
                        primary: true,
                        onClick: () => {
                            const input = document.getElementById(inputId);
                            resolve(input ? input.value : null);
                        }
                    }
                ]
            });
        });
    }
};

// Global helper functions
window.ModalManager = ModalManager;
window.alert = (message, type) => ModalManager.alert(message, type);
window.confirm = (message) => ModalManager.confirm(message);
window.prompt = (title, defaultValue) => ModalManager.prompt(title, defaultValue);
