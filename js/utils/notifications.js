// ===== UNIFIED NOTIFICATION SYSTEM =====

const NotificationSystem = {
    container: null,
    stylesAdded: false,

    init() {
        // Create container if not exists
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        }

        // Add animation styles
        if (!this.stylesAdded) {
            this.addStyles();
            this.stylesAdded = true;
        }
    },

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .notification-toast {
                padding: 1rem 1.5rem;
                border-radius: 12px;
                color: white;
                font-family: 'Inter', system-ui, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                animation: slideInRight 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 12px;
                backdrop-filter: blur(10px);
            }
            .notification-toast.success {
                background: linear-gradient(135deg, #10b981, #059669);
                border-left: 4px solid #34d399;
            }
            .notification-toast.error {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                border-left: 4px solid #f87171;
            }
            .notification-toast.warning {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                border-left: 4px solid #fbbf24;
            }
            .notification-toast.info {
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                border-left: 4px solid #818cf8;
            }
            .notification-toast.removing {
                animation: slideOutRight 0.3s ease-in forwards;
            }
            .notification-icon {
                font-size: 18px;
                flex-shrink: 0;
            }
            .notification-close {
                margin-left: auto;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                opacity: 0.8;
                transition: opacity 0.2s;
                font-size: 16px;
            }
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    },

    show(message, type = 'info', duration = 3000, options = {}) {
        this.init();

        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        
        // Get icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const icon = options.icon || icons[type] || 'ℹ';

        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${SecurityUtils.escapeHtml(message)}</span>
            <button class="notification-close">✕</button>
        `;

        // Add click to dismiss
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.dismiss(notification));

        this.container.appendChild(notification);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(notification), duration);
        }

        return notification;
    },

    dismiss(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.add('removing');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    },

    // Show loading/promise-based notification
    promise(promise, loadingMessage = 'Loading...', successMessage = 'Success!', errorMessage = 'An error occurred') {
        const notification = this.show(loadingMessage, 'info', 0);
        
        return promise
            .then(() => {
                this.dismiss(notification);
                return this.success(successMessage);
            })
            .catch((error) => {
                this.dismiss(notification);
                return this.error(errorMessage);
            });
    },

    // Clear all notifications
    clearAll() {
        if (this.container) {
            const notifications = this.container.querySelectorAll('.notification-toast');
            notifications.forEach(n => this.dismiss(n));
        }
    }
};

// Create global function that replaces all other showNotification implementations
window.showNotification = function(message, type = 'info', duration) {
    return NotificationSystem.show(message, type, duration);
};

// Also expose NotificationSystem globally
window.NotificationSystem = NotificationSystem;
