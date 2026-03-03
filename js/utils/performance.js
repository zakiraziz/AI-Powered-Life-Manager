/**
 * Performance Utilities Module
 * Provides debounce, throttle, lazy loading, and performance monitoring
 */

const PerformanceUtils = (function() {
    'use strict';
    
    /**
     * Debounce function to limit execution rate
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    const debounce = (func, wait = 300) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    /**
     * Throttle function to limit execution rate
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    const throttle = (func, limit = 300) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };
    
    /**
     * Lazy load images using Intersection Observer
     */
    const lazyLoadImages = () => {
        const images = document.querySelectorAll('img[data-src]');
        
        if (images.length === 0) return;
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        images.forEach(img => imageObserver.observe(img));
    };
    
    /**
     * Preload critical resources
     */
    const preloadCritical = () => {
        // Preload fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);
        
        // Preconnect to external domains
        const preconnectGoogle = document.createElement('link');
        preconnectGoogle.rel = 'preconnect';
        preconnectGoogle.href = 'https://fonts.googleapis.com';
        document.head.appendChild(preconnectGoogle);
        
        const preconnectGstatic = document.createElement('link');
        preconnectGstatic.rel = 'preconnect';
        preconnectGstatic.href = 'https://fonts.gstatic.com';
        preconnectGstatic.crossOrigin = 'anonymous';
        document.head.appendChild(preconnectGstatic);
    };
    
    /**
     * Measure Largest Contentful Paint (LCP)
     */
    const measureLCP = () => {
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
    };
    
    /**
     * Measure First Input Delay (FID)
     */
    const measureFID = () => {
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
    };
    
    /**
     * Measure Cumulative Layout Shift (CLS)
     */
    const measureCLS = () => {
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
    };
    
    /**
     * Initialize performance monitoring
     */
    const initPerformanceMonitoring = () => {
        // Only measure in production or when explicitly enabled
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            measureLCP();
            measureFID();
            measureCLS();
        }
    };
    
    /**
     * Optimize DOM updates with requestAnimationFrame
     * @param {Function} callback - Function to optimize
     * @returns {Function} Optimized function
     */
    const rafUpdate = (callback) => {
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
    };
    
    /**
     * Cache DOM queries for better performance
     * @returns {Object} Cached elements
     */
    const cacheDom = () => {
        const cache = {};
        const elements = {
            taskInput: 'taskInput',
            taskList: 'taskList',
            balance: 'balance',
            streakCount: 'streakCount',
            completionRate: 'completionRate',
            productivityChart: 'productivityChart',
            moodChart: 'moodChart',
            expenseChart: 'expenseChart'
        };
        
        for (const [key, id] of Object.entries(elements)) {
            cache[key] = document.getElementById(id);
        }
        
        return cache;
    };
    
    /**
     * Initialize intersection observer for animations
     */
    const initIntersectionObserver = () => {
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
    };
    
    /**
     * Memory management - cleanup event listeners
     */
    const cleanup = () => {
        // Remove old event listeners
        const handlers = window._eventHandlers || [];
        handlers.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        window._eventHandlers = [];
    };
    
    // Public API
    return {
        debounce,
        throttle,
        lazyLoadImages,
        preloadCritical,
        rafUpdate,
        cacheDom,
        initIntersectionObserver,
        initPerformanceMonitoring,
        cleanup
    };
})();

// Export
window.PerformanceUtils = PerformanceUtils;

// Auto init
document.addEventListener('DOMContentLoaded', () => {
    PerformanceUtils.preloadCritical();
    PerformanceUtils.initPerformanceMonitoring();
    PerformanceUtils.lazyLoadImages();
});