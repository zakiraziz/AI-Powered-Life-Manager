/**
 * Advanced Modal System
 * Provides customizable modals with animations and accessibility
 */

const ModalManager = (function() {
    'use strict';
    
    const modals = new Map();
    let zIndex = 1000;
    
    /**
     * Create a new modal
     * @param {Object} config - Modal configuration
     * @returns {HTMLElement} Modal element
     */
    const create = (config) => {
        const {
            id,
            title = '',
            content = '',
            size = 'medium',
            closable = true,
            closeOnOverlay = true,
            closeOnEscape = true,
            showCloseButton = true,
            buttons = [],
            onOpen = null,
            onClose = null,
            className = ''
        } = config;
        
        // Remove existing modal with same id
        if (modals.has(id)) {
            close(id);
        }
        
        // Create modal element
        const modal = document.createElement('div');
        modal.className = `modal-wrapper ${className}`;
        modal.id = id;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${id}-title`);
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: ${zIndex++};
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
                <button class="modal-btn ${btn.primary ? 'primary' : ''} ${btn.className || ''}" 
                        data-action="${btn.id}"
                        aria-label="${btn.text}">
                    ${btn.icon ? `<i class="${btn.icon}"></i>` : ''}
                    <span>${btn.text}</span>
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
                background: var(--bg-secondary);
                border-radius: 16px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                position: relative;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                transform: scale(0.9);
                transition: transform 0.3s;
                border: 1px solid var(--border-color);
            ">
                ${showCloseButton ? `
                    <button class="modal-close" aria-label="Close" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: transparent;
                        border: none;
                        color: var(--text-secondary);
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
                    border-bottom: 1px solid var(--border-color);
                ">
                    <h2 id="${id}-title" style="
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: var(--text-primary);
                    ">${SecurityUtils.escapeHtml(title)}</h2>
                </div>` : ''}
                <div class="modal-body" style="
                    padding: 24px;
                ">${content}</div>
                ${buttonsHtml ? `<div class="modal-footer" style="
                    padding: 16px 24px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                ">${buttonsHtml}</div>` : ''}
            </div>
        `;
        
        // Add styles
        addStyles();
        
        // Add event listeners
        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');
        
        if (closable && closeOnOverlay) {
            overlay.addEventListener('click', () => close(id));
        }
        
        if (closable && showCloseButton && closeBtn) {
            closeBtn.addEventListener('click', () => close(id));
        }
        
        // Button handlers
        buttons.forEach(btn => {
            const btnElement = modal.querySelector(`[data-action="${btn.id}"]`);
            if (btnElement && btn.onClick) {
                btnElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    btn.onClick(e, { close: () => close(id) });
                });
            }
        });
        
        // Escape key handler
        if (closable && closeOnEscape) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    close(id);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            modal.escapeHandler = escapeHandler;
            document.addEventListener('keydown', escapeHandler);
        }
        
        // Store modal reference
        modals.set(id, {
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
    };
    
    /**
     * Add modal styles
     */
    const addStyles = () => {
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
                background: var(--bg-tertiary);
                color: var(--text-primary);
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .modal-btn:hover {
                background: var(--bg-hover);
            }
            .modal-btn.primary {
                background: var(--accent-gradient);
                color: white;
            }
            .modal-btn.primary:hover {
                opacity: 0.9;
            }
            .modal-btn:focus-visible {
                outline: 2px solid var(--accent-primary);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    };
    
    /**
     * Close a modal
     * @param {string} id - Modal ID
     */
    const close = (id) => {
        const modalData = modals.get(id);
        if (!modalData) return;
        
        const { element, onClose } = modalData;
        const content = element.querySelector('.modal-content');
        
        // Animate out
        element.style.opacity = '0';
        element.style.visibility = 'hidden';
        if (content) {
            content.style.transform = 'scale(0.9)';
        }
        
        // Remove after animation
        setTimeout(() => {
            if (element.escapeHandler) {
                document.removeEventListener('keydown', element.escapeHandler);
            }
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            modals.delete(id);
            
            if (onClose) {
                onClose();
            }
        }, 300);
    };
    
    /**
     * Close all modals
     */
    const closeAll = () => {
        modals.forEach((_, id) => close(id));
    };
    
    /**
     * Show alert modal
     * @param {string} message - Alert message
     * @param {string} type - Alert type
     * @returns {Promise} Resolves when closed
     */
    const alert = (message, type = 'info') => {
        return new Promise((resolve) => {
            const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
            
            create({
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
    };
    
    /**
     * Show confirm modal
     * @param {string} message - Confirmation message
     * @returns {Promise} Resolves with boolean
     */
    const confirm = (message) => {
        return new Promise((resolve) => {
            create({
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
    };
    
    /**
     * Show prompt modal
     * @param {string} title - Prompt title
     * @param {string} defaultValue - Default value
     * @returns {Promise} Resolves with input value or null
     */
    const prompt = (title, defaultValue = '') => {
        return new Promise((resolve) => {
            const inputId = 'prompt-input-' + Date.now();
            
            create({
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
    };
    
    // Public API
    return {
        create,
        close,
        closeAll,
        alert,
        confirm,
        prompt
    };
})();

// Global helper functions
window.ModalManager = ModalManager;
window.alert = (message, type) => ModalManager.alert(message, type);
window.confirm = (message) => ModalManager.confirm(message);
window.prompt = (title, defaultValue) => ModalManager.prompt(title, defaultValue);