/**
 * Unified Notification System
 * Provides toast notifications with different types and animations
 */

const NotificationSystem = (function() {
    'use strict';
    
    let container = null;
    let stylesAdded = false;
    let notificationCount = 0;
    const maxNotifications = 5;
    
    /**
     * Initialize notification container
     */
    const init = () => {
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        
        if (!stylesAdded) {
            addStyles();
            stylesAdded = true;
        }
    };
    
    /**
     * Add notification styles
     */
    const addStyles = () => {
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
            @keyframes progress {
                from { width: 100%; }
                to { width: 0%; }
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
                pointer-events: auto;
                position: relative;
                overflow: hidden;
                min-width: 300px;
            }
            .notification-toast.success {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .notification-toast.error {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }
            .notification-toast.warning {
                background: linear-gradient(135deg, #f59e0b, #d97706);
            }
            .notification-toast.info {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
            }
            .notification-toast.removing {
                animation: slideOutRight 0.3s ease-in forwards;
            }
            .notification-icon {
                font-size: 18px;
                flex-shrink: 0;
            }
            .notification-message {
                flex: 1;
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
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                animation: progress linear forwards;
            }
        `;
        document.head.appendChild(style);
    };
    
    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Type (success, error, warning, info)
     * @param {number} duration - Duration in ms (0 for persistent)
     * @param {Object} options - Additional options
     * @returns {HTMLElement} Notification element
     */
    const show = (message, type = 'info', duration = 3000, options = {}) => {
        init();
        
        // Limit number of notifications
        if (container.children.length >= maxNotifications) {
            dismiss(container.children[0]);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
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
            <button class="notification-close" aria-label="Close">✕</button>
        `;
        
        // Add progress bar if duration > 0
        if (duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'notification-progress';
            progress.style.animationDuration = `${duration}ms`;
            notification.appendChild(progress);
        }
        
        // Add click to dismiss
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss(notification);
        });
        
        // Add click handler if provided
        if (options.onClick) {
            notification.addEventListener('click', () => {
                options.onClick();
                dismiss(notification);
            });
            notification.style.cursor = 'pointer';
        }
        
        container.appendChild(notification);
        
        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => dismiss(notification), duration);
        }
        
        notificationCount++;
        
        return notification;
    };
    
    /**
     * Dismiss a notification
     * @param {HTMLElement} notification - Notification element
     */
    const dismiss = (notification) => {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.add('removing');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
                notificationCount--;
            }
        }, 300);
    };
    
    /**
     * Show success notification
     * @param {string} message - Message
     * @param {number} duration - Duration
     */
    const success = (message, duration = 3000) => {
        return show(message, 'success', duration);
    };
    
    /**
     * Show error notification
     * @param {string} message - Message
     * @param {number} duration - Duration
     */
    const error = (message, duration = 4000) => {
        return show(message, 'error', duration);
    };
    
    /**
     * Show warning notification
     * @param {string} message - Message
     * @param {number} duration - Duration
     */
    const warning = (message, duration = 3500) => {
        return show(message, 'warning', duration);
    };
    
    /**
     * Show info notification
     * @param {string} message - Message
     * @param {number} duration - Duration
     */
    const info = (message, duration = 3000) => {
        return show(message, 'info', duration);
    };
    
    /**
     * Show promise-based notification
     * @param {Promise} promise - Promise to track
     * @param {string} loadingMessage - Loading message
     * @param {string} successMessage - Success message
     * @param {string} errorMessage - Error message
     * @returns {Promise} Original promise
     */
    const promise = (promise, loadingMessage = 'Loading...', successMessage = 'Success!', errorMessage = 'An error occurred') => {
        const notification = show(loadingMessage, 'info', 0);
        
        return promise
            .then((result) => {
                dismiss(notification);
                success(successMessage);
                return result;
            })
            .catch((error) => {
                dismiss(notification);
                this.error(errorMessage);
                throw error;
            });
    };
    
    /**
     * Clear all notifications
     */
    const clearAll = () => {
        if (container) {
            const notifications = container.querySelectorAll('.notification-toast');
            notifications.forEach(n => dismiss(n));
        }
    };
    
    /**
     * Mark all notifications as read
     */
    const markAllRead = () => {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.style.display = 'none';
        }
        info('All notifications marked as read');
    };
    
    // Public API
    return {
        init,
        show,
        success,
        error,
        warning,
        info,
        promise,
        dismiss,
        clearAll,
        markAllRead
    };
})();

// Create global function for backward compatibility
window.showNotification = function(message, type = 'info', duration) {
    return NotificationSystem.show(message, type, duration);
};

// Export
window.NotificationSystem = NotificationSystem;