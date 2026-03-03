/**
 * Security Utilities Module
 * Handles input sanitization, encryption simulation, and security checks
 */

const SecurityUtils = (function() {
    'use strict';
    
    /**
     * Sanitize user input to prevent XSS
     * @param {string} input - Raw user input
     * @returns {string} Sanitized input
     */
    const sanitizeInput = (input) => {
        if (typeof input !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    };
    
    /**
     * Escape HTML characters for safe rendering
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    const escapeHtml = (text) => {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    };
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    
    /**
     * Validate password strength
     * @param {string} password - Password to check
     * @returns {Object} Strength assessment
     */
    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const score = [
            password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        ].filter(Boolean).length;
        
        const strength = score === 5 ? 'Excellent' :
                        score === 4 ? 'Strong' :
                        score === 3 ? 'Good' :
                        score === 2 ? 'Weak' : 'Very Weak';
        
        return {
            isValid: score >= 3,
            score: score,
            strength: strength,
            feedback: score < 3 ? [
                !password.length && 'Password must be at least 8 characters',
                !hasUpperCase && 'Add uppercase letter',
                !hasLowerCase && 'Add lowercase letter',
                !hasNumbers && 'Add numbers',
                !hasSpecialChar && 'Add special character'
            ].filter(Boolean) : []
        };
    };
    
    /**
     * Simple hash for local storage (not for real security)
     * @param {string} str - String to hash
     * @returns {string} Hash
     */
    const simpleHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    };
    
    /**
     * Generate cryptographically secure random token
     * @param {number} length - Token length
     * @returns {string} Random token
     */
    const generateToken = (length = 32) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => chars[byte % chars.length]).join('');
    };
    
    /**
     * Secure storage with base64 encoding (simulated encryption)
     */
    const secureStorage = {
        set: (key, value) => {
            try {
                const encrypted = btoa(JSON.stringify(value));
                localStorage.setItem(key, encrypted);
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        },
        
        get: (key) => {
            try {
                const encrypted = localStorage.getItem(key);
                return encrypted ? JSON.parse(atob(encrypted)) : null;
            } catch (e) {
                console.error('Storage read error:', e);
                return null;
            }
        },
        
        remove: (key) => {
            localStorage.removeItem(key);
        }
    };
    
    /**
     * Detect potential XSS attempts
     * @param {string} input - Input to check
     * @returns {boolean} True if suspicious
     */
    const detectXSSAttempt = (input) => {
        if (typeof input !== 'string') return false;
        const patterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /eval\(/i,
            /alert\(/i,
            /document\.cookie/i
        ];
        return patterns.some(pattern => pattern.test(input));
    };
    
    /**
     * Client-side rate limiter
     */
    const rateLimiter = {
        attempts: new Map(),
        maxAttempts: 5,
        windowMs: 60000, // 1 minute
        
        isAllowed: (key) => {
            const now = Date.now();
            const attempts = rateLimiter.attempts.get(key) || [];
            const recentAttempts = attempts.filter(time => now - time < rateLimiter.windowMs);
            
            if (recentAttempts.length >= rateLimiter.maxAttempts) {
                return false;
            }
            
            recentAttempts.push(now);
            rateLimiter.attempts.set(key, recentAttempts);
            return true;
        },
        
        reset: (key) => {
            rateLimiter.attempts.delete(key);
        }
    };
    
    // Public API
    return {
        sanitizeInput,
        escapeHtml,
        validateEmail,
        validatePassword,
        simpleHash,
        generateToken,
        secureStorage,
        detectXSSAttempt,
        rateLimiter
    };
})();

// Export globally
window.SecurityUtils = SecurityUtils;