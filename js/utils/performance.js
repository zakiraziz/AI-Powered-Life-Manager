// ===== PERFORMANCE UTILITIES =====

const PerformanceUtils = {
    // Debounce function
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Lazy load images
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    },

    // Preload critical resources
    preloadCritical() {
        // Preload fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);
    },

    // Measure LCP (Largest Contentful Paint)
    measureLCP() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.log('LCP not supported');
            }
        }
    },

    // Measure FID (First Input Delay)
    measureFID() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const firstEntry = entries[0];
                    console.log('FID:', firstEntry.processingStart - firstEntry.startTime);
                });
                observer.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.log('FID not supported');
            }
        }
    },

    // Measure CLS (Cumulative Layout Shift)
    measureCLS() {
        if ('PerformanceObserver' in window) {
            try {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    console.log('CLS:', clsValue);
                });
                observer.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.log('CLS not supported');
            }
        }
    },

    // Initialize performance monitoring
    init() {
        if (process.env.NODE_ENV === 'development') {
            console.log('Performance monitoring enabled');
        }
        
        // Only measure in production or when explicitly enabled
        if (window.location.hostname !== 'localhost') {
            this.measureLCP();
            this.measureFID();
            this.measureCLS();
        }
    },

    // Optimize DOM updates with requestAnimationFrame
    rafUpdate(callback) {
        let scheduled = false;
        return function(...args) {
            if (!scheduled) {
                scheduled = true;
                requestAnimationFrame(() => {
                    callback.apply(this, args);
                    scheduled = false;
                });
            }
        };
    },

    // Memory management - cleanup event listeners
    cleanup() {
        // Remove unused event listeners
        const cleanupEvents = ['dataChanged'];
        cleanupEvents.forEach(event => {
            const handlers = window.getEventListeners?.(window) || [];
            // Note: getEventListeners is a Chrome devtools feature
            // In production, use a custom event manager
        });
    },

    // Cache DOM queries
    cacheDom() {
        const cache = {};
        const elements = {
            taskInput: 'taskInput',
            taskList: 'taskList',
            balance: 'balance',
            streakCount: 'streakCount',
            completionRate: 'completionRate'
        };

        for (const [key, id] of Object.entries(elements)) {
            cache[key] = document.getElementById(id);
        }

        return cache;
    },

    // Initialize intersection observer for animations
    initIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
};

// Export
window.PerformanceUtils = PerformanceUtils;

// Auto init
document.addEventListener('DOMContentLoaded', () => PerformanceUtils.init());
