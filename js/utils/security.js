// ===== SECURITY UTILITIES =====

const SecurityUtils = {
    // Input sanitization to prevent XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    // HTML escape for rendering user content
    escapeHtml(text) {
        const map = {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // Validate email format
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate password strength
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const score = [password.length >= minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
            .filter(Boolean).length;
        
        return {
            isValid: score >= 3,
            score: score,
            feedback: score < 3 ? [
                !password.length && 'Password must be at least 8 characters',
                !hasUpperCase && 'Add uppercase letter',
                !hasLowerCase && 'Add lowercase letter',
                !hasNumbers && 'Add numbers',
                !hasSpecialChar && 'Add special character'
            ].filter(Boolean) : []
        };
    },

    // Simple hash function for local storage (NOT for real security, just obfuscation)
    // In production, use proper password hashing library
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    },

    // Generate secure random token
    generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => chars[byte % chars.length]).join('');
    },

    // Secure local storage with encryption simulation
    secureStorage: {
        set(key, value) {
            try {
                const encrypted = btoa(JSON.stringify(value));
                localStorage.setItem(key, encrypted);
            } catch (e) {
                console.error('Storage error:', e);
            }
        },

        get(key) {
            try {
                const encrypted = localStorage.getItem(key);
                return encrypted ? JSON.parse(atob(encrypted)) : null;
            } catch (e) {
                console.error('Storage read error:', e);
                return null;
            }
        },

        remove(key) {
            localStorage.removeItem(key);
        }
    },

    // Content Security Policy helper
    validateCSP() {
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return !!meta;
    },

    // Check for common XSS patterns
    detectXSSAttempt(input) {
        const patterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /eval\(/i
        ];
        return patterns.some(pattern => pattern.test(input));
    },

    // Rate limiting helper (client-side simulation)
    rateLimiter: {
        attempts: new Map(),
        maxAttempts: 5,
        windowMs: 60000, // 1 minute

        isAllowed(key) {
            const now = Date.now();
            const attempts = this.attempts.get(key) || [];
            const recentAttempts = attempts.filter(time => now - time < this.windowMs);
            
            if (recentAttempts.length >= this.maxAttempts) {
                return false;
            }
            
            recentAttempts.push(now);
            this.attempts.set(key, recentAttempts);
            return true;
        },

        reset(key) {
            this.attempts.delete(key);
        }
    }
};

// Export for global use
window.SecurityUtils = SecurityUtils;
