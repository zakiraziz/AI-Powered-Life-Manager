// ===== sw.js - Service Worker for PWA =====
// Progressive Web App Service Worker with offline support

const CACHE_NAME = 'lifeos-v1';
const STATIC_CACHE = 'lifeos-static-v1';
const DYNAMIC_CACHE = 'lifeos-dynamic-v1';
const MEDIA_CACHE = 'lifeos-media-v1';
const API_CACHE = 'lifeos-api-v1';
const FONT_CACHE = 'lifeos-fonts-v1';

// Cache sizes and limits
const CACHE_CONFIG = {
    [DYNAMIC_CACHE]: { maxItems: 50, maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
    [MEDIA_CACHE]: { maxItems: 20, maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    [API_CACHE]: { maxItems: 100, maxAge: 1 * 60 * 60 * 1000 }, // 1 hour
    [FONT_CACHE]: { maxItems: 10, maxAge: 365 * 24 * 60 * 60 * 1000 } // 1 year
};

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/css/themes/dark.css',
    '/css/themes/light.css',
    '/js/app.js',
    '/js/aiAssistant.js',
    '/js/keyboardShortcuts.js',
    '/js/gamification.js',
    '/js/offlineManager.js',
    '/js/syncManager.js',
    '/assets/icon-72.png',
    '/assets/icon-96.png',
    '/assets/icon-128.png',
    '/assets/icon-144.png',
    '/assets/icon-152.png',
    '/assets/icon-192.png',
    '/assets/icon-384.png',
    '/assets/icon-512.png',
    '/assets/badge-72.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/user/profile',
    '/api/tasks/priority',
    '/api/analytics/daily',
    '/api/goals/current'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(API_CACHE).then((cache) => {
                console.log('[SW] Caching API endpoints');
                return cache.addAll(API_ENDPOINTS);
            }),
            self.skipWaiting()
        ]).catch((err) => console.log('[SW] Cache error:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.filter((key) => {
                        return key !== STATIC_CACHE && 
                               key !== DYNAMIC_CACHE && 
                               key !== MEDIA_CACHE && 
                               key !== API_CACHE && 
                               key !== FONT_CACHE;
                    }).map((key) => {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    })
                );
            }),
            // Clean expired items
            cleanExpiredCaches(),
            self.clients.claim()
        ])
    );
});

// Fetch event with advanced strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip chrome extensions and other non-http requests
    if (!url.protocol.startsWith('http')) return;
    
    // Determine strategy based on request type
    if (url.pathname.startsWith('/api/')) {
        // API requests - stale-while-revalidate
        event.respondWith(staleWhileRevalidate(request, API_CACHE));
    } 
    else if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|mp4|webm|ogg)$/i)) {
        // Media files - cache-first with size limits
        event.respondWith(cacheFirstWithLimit(request, MEDIA_CACHE));
    }
    else if (url.href.includes('fonts.googleapis.com') || url.href.includes('fonts.gstatic.com')) {
        // Fonts - cache-first, long TTL
        event.respondWith(cacheFirst(request, FONT_CACHE));
    }
    else if (url.origin === location.origin) {
        // Same-origin HTML/JS/CSS - network-first with offline fallback
        event.respondWith(networkFirstWithFallback(request));
    }
    else {
        // Other CDN assets - cache-first
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
});

// Stale-while-revalidate strategy for API calls
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    const networkPromise = fetch(request)
        .then(async (networkResponse) => {
            if (networkResponse.ok) {
                // Clone before caching
                const responseToCache = networkResponse.clone();
                
                // Add to cache and manage size
                await cache.put(request, responseToCache);
                await manageCacheSize(cacheName);
            }
            return networkResponse;
        })
        .catch((error) => {
            console.log('[SW] Network request failed:', error);
            return null;
        });
    
    // Return cached response immediately if available, otherwise wait for network
    if (cachedResponse) {
        // Revalidate in background
        event.waitUntil(networkPromise);
        return cachedResponse;
    }
    
    return networkPromise;
}

// Cache-first strategy with size limits
async function cacheFirstWithLimit(request, cacheName) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse.clone());
            await manageCacheSize(cacheName);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Fetch failed:', error);
        throw error;
    }
}

// Network-first with offline fallback
async function networkFirstWithFallback(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(request, networkResponse.clone());
            await manageCacheSize(DYNAMIC_CACHE);
        }
        
        return networkResponse;
    } catch (error) {
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Manage cache size - remove oldest items if limit exceeded
async function manageCacheSize(cacheName) {
    const config = CACHE_CONFIG[cacheName];
    if (!config) return;
    
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    if (requests.length > config.maxItems) {
        // Remove oldest items
        const toRemove = requests.length - config.maxItems;
        const requestsToRemove = requests.slice(0, toRemove);
        
        await Promise.all(
            requestsToRemove.map(request => cache.delete(request))
        );
        
        console.log(`[SW] Removed ${toRemove} old items from ${cacheName}`);
    }
}

// Clean expired cache items
async function cleanExpiredCaches() {
    for (const [cacheName, config] of Object.entries(CACHE_CONFIG)) {
        if (!config.maxAge) continue;
        
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        const now = Date.now();
        
        await Promise.all(
            requests.map(async (request) => {
                const response = await cache.match(request);
                const cachedTime = response.headers.get('sw-cached-time');
                
                if (cachedTime && (now - parseInt(cachedTime)) > config.maxAge) {
                    await cache.delete(request);
                    console.log(`[SW] Removed expired item from ${cacheName}`);
                }
            })
        );
    }
}

// Enhanced background sync
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    const syncHandlers = {
        'sync-data': syncData,
        'sync-tasks': syncTasks,
        'sync-goals': syncGoals,
        'sync-analytics': syncAnalytics,
        'upload-media': uploadMedia
    };
    
    if (syncHandlers[event.tag]) {
        event.waitUntil(syncHandlers[event.tag]());
    }
});

// Sync tasks
async function syncTasks() {
    try {
        const pendingTasks = await getPendingItems('tasks');
        for (const task of pendingTasks) {
            await fetch('/api/tasks/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
        }
        console.log('[SW] Tasks synced successfully');
    } catch (error) {
        console.log('[SW] Task sync failed:', error);
        throw error; // Retry later
    }
}

// Sync goals
async function syncGoals() {
    try {
        const pendingGoals = await getPendingItems('goals');
        for (const goal of pendingGoals) {
            await fetch('/api/goals/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goal)
            });
        }
        console.log('[SW] Goals synced successfully');
    } catch (error) {
        console.log('[SW] Goal sync failed:', error);
        throw error;
    }
}

// Sync analytics
async function syncAnalytics() {
    try {
        const pendingAnalytics = await getPendingItems('analytics');
        if (pendingAnalytics.length > 0) {
            await fetch('/api/analytics/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingAnalytics)
            });
        }
        console.log('[SW] Analytics synced successfully');
    } catch (error) {
        console.log('[SW] Analytics sync failed:', error);
        throw error;
    }
}

// Upload media files
async function uploadMedia() {
    try {
        const pendingMedia = await getPendingItems('media');
        for (const media of pendingMedia) {
            const formData = new FormData();
            formData.append('file', media.blob, media.filename);
            formData.append('metadata', JSON.stringify(media.metadata));
            
            await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });
        }
        console.log('[SW] Media uploaded successfully');
    } catch (error) {
        console.log('[SW] Media upload failed:', error);
        throw error;
    }
}

// Enhanced push notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'New notification from LifeOS',
        icon: '/assets/icon-192.png',
        badge: '/assets/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            type: data.type || 'general',
            id: data.id || Date.now()
        },
        actions: data.actions || [
            { action: 'open', title: 'Open' },
            { action: 'snooze', title: 'Snooze' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        tag: data.tag || 'default',
        renotify: data.renotify || false,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        timestamp: data.timestamp || Date.now()
    };
    
    // Add image if present
    if (data.image) {
        options.image = data.image;
    }
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'LifeOS', 
            options
        )
    );
    
    // Send acknowledgment
    event.waitUntil(
        fetch('/api/notifications/received', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.id })
        })
    );
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const { action } = event;
    const { data } = event.notification;
    
    // Track notification interaction
    event.waitUntil(
        fetch('/api/notifications/clicked', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: data.id,
                action: action || 'open'
            })
        })
    );
    
    switch (action) {
        case 'open':
        case undefined:
            event.waitUntil(
                clients.openWindow(data.url)
            );
            break;
            
        case 'snooze':
            // Schedule for later
            event.waitUntil(
                scheduleNotification(data, 15) // Snooze for 15 minutes
            );
            break;
            
        case 'dismiss':
            // Just close
            break;
            
        default:
            if (action) {
                // Handle custom actions
                event.waitUntil(
                    handleCustomNotificationAction(action, data)
                );
            }
    }
});

// Schedule a notification
async function scheduleNotification(data, minutes) {
    const scheduledTime = Date.now() + (minutes * 60 * 1000);
    
    // Store in IndexedDB
    await storeScheduledNotification({
        ...data,
        scheduledTime
    });
    
    // Register periodic sync
    await self.registration.periodicSync.register('check-notifications', {
        minInterval: minutes * 60 * 1000
    });
}

// Handle custom notification actions
async function handleCustomNotificationAction(action, data) {
    switch (action) {
        case 'complete':
            await fetch(`/api/tasks/${data.id}/complete`, { method: 'POST' });
            break;
            
        case 'postpone':
            await fetch(`/api/tasks/${data.id}/postpone`, { method: 'POST' });
            break;
            
        case 'view':
            await clients.openWindow(data.url);
            break;
    }
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-notifications') {
        event.waitUntil(checkScheduledNotifications());
    } else if (event.tag === 'update-cache') {
        event.waitUntil(updateCache());
    } else if (event.tag === 'sync-all') {
        event.waitUntil(syncAll());
    }
});

// Check scheduled notifications
async function checkScheduledNotifications() {
    const notifications = await getScheduledNotifications();
    const now = Date.now();
    
    for (const notification of notifications) {
        if (notification.scheduledTime <= now) {
            // Show notification
            await self.registration.showNotification(
                notification.title || 'LifeOS',
                notification.options
            );
            
            // Remove from scheduled
            await removeScheduledNotification(notification.id);
        }
    }
}

// Update cache periodically
async function updateCache() {
    const cache = await caches.open(STATIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                await cache.put(request, networkResponse);
            }
        } catch (error) {
            console.log('[SW] Cache update failed:', request.url);
        }
    }
    
    console.log('[SW] Cache updated successfully');
}

// Sync all pending data
async function syncAll() {
    await Promise.allSettled([
        syncData(),
        syncTasks(),
        syncGoals(),
        syncAnalytics(),
        uploadMedia()
    ]);
}

// Helper functions for IndexedDB (to be implemented)
async function getPendingItems(type) {
    // This would be implemented with IndexedDB
    return [];
}

async function storeScheduledNotification(notification) {
    // Store in IndexedDB
}

async function getScheduledNotifications() {
    // Retrieve from IndexedDB
    return [];
}

async function removeScheduledNotification(id) {
    // Remove from IndexedDB
}

// Message handler for cache updates and more
self.addEventListener('message', (event) => {
    if (!event.data) return;
    
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            event.waitUntil(
                caches.open(DYNAMIC_CACHE)
                    .then((cache) => cache.addAll(payload.urls))
                    .then(() => manageCacheSize(DYNAMIC_CACHE))
            );
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.delete(payload.cacheName)
                    .then(() => caches.open(payload.cacheName))
            );
            break;
            
        case 'GET_CACHE_INFO':
            event.waitUntil(
                getCacheInfo().then((info) => {
                    // Send back to client
                    event.source.postMessage({
                        type: 'CACHE_INFO',
                        payload: info
                    });
                })
            );
            break;
            
        case 'SETTINGS_UPDATED':
            // Handle settings changes
            updateSettings(payload);
            break;
            
        case 'OFFLINE_DATA_SAVED':
            // Trigger background sync
            self.registration.sync.register('sync-data');
            break;
            
        case 'FORCE_SYNC':
            event.waitUntil(syncAll());
            break;
    }
});

// Get cache information
async function getCacheInfo() {
    const info = {};
    
    for (const cacheName of Object.keys(CACHE_CONFIG)) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        let size = 0;
        for (const request of requests) {
            const response = await cache.match(request);
            const blob = await response.clone().blob();
            size += blob.size;
        }
        
        info[cacheName] = {
            items: requests.length,
            size: formatBytes(size),
            config: CACHE_CONFIG[cacheName]
        };
    }
    
    return info;
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Update service worker settings
function updateSettings(settings) {
    // Update cache limits based on settings
    if (settings.cacheSize) {
        for (const [cacheName, limit] of Object.entries(settings.cacheSize)) {
            if (CACHE_CONFIG[cacheName]) {
                CACHE_CONFIG[cacheName].maxItems = limit;
            }
        }
    }
}

// Prefetch feature for better performance
self.addEventListener('message', (event) => {
    if (event.data.type === 'PREFETCH') {
        const urls = event.data.urls;
        
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then(async (cache) => {
                for (const url of urls) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                        }
                    } catch (error) {
                        console.log('[SW] Prefetch failed:', url);
                    }
                }
                await manageCacheSize(DYNAMIC_CACHE);
            })
        );
    }
});

// Handle app version updates
self.addEventListener('message', (event) => {
    if (event.data.type === 'CHECK_VERSION') {
        const currentVersion = CACHE_NAME.split('-')[1];
        
        event.source.postMessage({
            type: 'VERSION_INFO',
            payload: {
                current: currentVersion,
                latest: event.data.payload.latestVersion,
                needsUpdate: currentVersion !== event.data.payload.latestVersion
            }
        });
    }
});

console.log('[SW] Service Worker loaded with enhanced features');