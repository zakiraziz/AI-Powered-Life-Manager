// ===== sw.js - Service Worker for PWA =====
// Progressive Web App Service Worker with enhanced offline support

const CACHE_NAME = 'lifeos-v1';
const STATIC_CACHE = 'lifeos-static-v1';
const DYNAMIC_CACHE = 'lifeos-dynamic-v1';
const MEDIA_CACHE = 'lifeos-media-v1';
const API_CACHE = 'lifeos-api-v1';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/css/offline.css',
    '/js/app.js',
    '/js/aiAssistant.js',
    '/js/keyboardShortcuts.js',
    '/js/gamification.js',
    '/js/offlineManager.js',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    '/assets/offline-image.svg',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/tasks',
    '/api/notes',
    '/api/calendar',
    '/api/projects',
    '/api/habits',
    '/api/user/profile'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE)
                .then((cache) => {
                    console.log('[SW] Caching static assets');
                    return cache.addAll(STATIC_ASSETS).catch(err => {
                        console.log('[SW] Static cache error:', err);
                        // Continue even if some assets fail
                        return Promise.resolve();
                    });
                }),
            // Pre-cache API endpoints for faster initial load
            caches.open(API_CACHE)
                .then((cache) => {
                    console.log('[SW] Pre-caching API endpoints');
                    return cache.addAll(API_ENDPOINTS).catch(err => {
                        console.log('[SW] API cache error:', err);
                        return Promise.resolve();
                    });
                }),
            self.skipWaiting()
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys()
                .then((keys) => {
                    return Promise.all(
                        keys.filter((key) => {
                            return key !== STATIC_CACHE && 
                                   key !== DYNAMIC_CACHE && 
                                   key !== MEDIA_CACHE && 
                                   key !== API_CACHE;
                        }).map((key) => {
                            console.log('[SW] Removing old cache:', key);
                            return caches.delete(key);
                        })
                    );
                }),
            // Enable navigation preload if supported
            self.registration.navigationPreload?.enable(),
            self.clients.claim()
        ])
    );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip chrome extensions and other non-http requests
    if (!url.protocol.startsWith('http')) return;
    
    // Determine strategy based on request type
    const strategy = getStrategy(request);
    
    if (strategy === 'stale-while-revalidate') {
        event.respondWith(staleWhileRevalidate(request));
    } else if (strategy === 'network-first') {
        event.respondWith(networkFirst(request));
    } else if (strategy === 'cache-first') {
        event.respondWith(cacheFirst(request));
    } else if (strategy === 'network-only') {
        event.respondWith(networkOnly(request));
    }
});

// Determine caching strategy based on request
function getStrategy(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // API requests
    if (path.startsWith('/api/')) {
        return 'stale-while-revalidate';
    }
    
    // Media files (images, audio, video)
    if (request.destination === 'image' || 
        request.destination === 'video' || 
        request.destination === 'audio') {
        return 'cache-first';
    }
    
    // Static assets (CSS, JS, fonts)
    if (request.destination === 'style' || 
        request.destination === 'script' || 
        request.destination === 'font') {
        return 'cache-first';
    }
    
    // HTML documents
    if (request.destination === 'document' || 
        request.mode === 'navigate') {
        return 'network-first';
    }
    
    // Default to network-first
    return 'network-first';
}

// Stale-while-revalidate strategy (best for API data)
async function staleWhileRevalidate(request) {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Clone the request for network fetch
    const networkPromise = fetch(request.clone())
        .then(async (networkResponse) => {
            if (networkResponse.ok) {
                // Check response age and update cache
                const headers = new Headers(networkResponse.headers);
                headers.append('Cache-Timestamp', Date.now());
                
                const responseToCache = networkResponse.clone();
                await cache.put(request, responseToCache);
            }
            return networkResponse;
        })
        .catch(error => {
            console.log('[SW] Network fetch failed:', error);
            return null;
        });
    
    // Return cached response immediately if available
    if (cachedResponse) {
        // Check if cache is stale
        const cacheTimestamp = cachedResponse.headers.get('Cache-Timestamp');
        if (cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) > CACHE_MAX_AGE) {
            // Trigger background revalidation
            event.waitUntil(networkPromise);
        }
        return cachedResponse;
    }
    
    // Wait for network if no cache
    return networkPromise;
}

// Enhanced network-first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            const headers = new Headers(networkResponse.headers);
            headers.append('Cache-Timestamp', Date.now());
            
            const responseToCache = networkResponse.clone();
            cache.put(request, responseToCache);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network request failed, falling back to cache');
        
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate' || request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        // Return offline image for image requests
        if (request.destination === 'image') {
            return caches.match('/assets/offline-image.svg');
        }
        
        // Return a simple offline response
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain',
            })
        });
    }
}

// Enhanced cache-first strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Check if cache is too old
        const cacheTimestamp = cachedResponse.headers.get('Cache-Timestamp');
        const isStale = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) > CACHE_MAX_AGE;
        
        if (!isStale) {
            return cachedResponse;
        }
        
        // Refresh in background if stale
        refreshCache(request);
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(MEDIA_CACHE);
            const headers = new Headers(networkResponse.headers);
            headers.append('Cache-Timestamp', Date.now());
            
            const responseToCache = networkResponse.clone();
            cache.put(request, responseToCache);
        }
        
        return networkResponse;
    } catch (error) {
        // Return stale cache if network fails
        if (cachedResponse) {
            return cachedResponse;
        }
        
        console.log('[SW] Fetch failed:', error);
        throw error;
    }
}

// Network-only strategy
async function networkOnly(request) {
    return fetch(request);
}

// Refresh cache in background
async function refreshCache(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(MEDIA_CACHE);
            cache.put(request, networkResponse);
        }
    } catch (error) {
        console.log('[SW] Background refresh failed:', error);
    }
}

// Enhanced background sync
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);
    
    switch (event.tag) {
        case 'sync-data':
            event.waitUntil(syncData());
            break;
        case 'sync-tasks':
            event.waitUntil(syncTasks());
            break;
        case 'sync-notes':
            event.waitUntil(syncNotes());
            break;
        case 'sync-calendar':
            event.waitUntil(syncCalendar());
            break;
        default:
            event.waitUntil(syncData());
    }
});

// Enhanced data sync
async function syncData() {
    try {
        console.log('[SW] Starting data sync...');
        
        // Get pending operations from IndexedDB
        const db = await openIndexedDB();
        const pendingOperations = await getPendingOperations(db);
        
        for (const operation of pendingOperations) {
            try {
                const response = await fetch(operation.url, {
                    method: operation.method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(operation.data)
                });
                
                if (response.ok) {
                    await markOperationComplete(db, operation.id);
                    console.log('[SW] Synced operation:', operation.id);
                }
            } catch (error) {
                console.log('[SW] Failed to sync operation:', operation.id, error);
            }
        }
        
        console.log('[SW] Data sync completed');
        
        // Notify all clients about sync completion
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETED',
                timestamp: Date.now()
            });
        });
        
    } catch (error) {
        console.log('[SW] Sync failed:', error);
        throw error;
    }
}

// Enhanced push notification handling
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'New notification from LifeOS',
        icon: '/assets/icon-192.png',
        badge: '/assets/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            id: data.id || Date.now(),
            type: data.type || 'general'
        },
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'snooze', title: 'Snooze' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        tag: data.tag || 'default',
        renotify: true,
        requireInteraction: data.important || false,
        silent: data.silent || false
    };
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'LifeOS', 
            options
        )
    );
    
    // Log notification for analytics
    logNotificationEvent('push-received', data);
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const action = event.action;
    const notificationData = event.notification.data;
    
    // Log notification click
    logNotificationEvent('notification-clicked', {
        action: action,
        notificationId: notificationData.id,
        type: notificationData.type
    });
    
    if (action === 'open' || !action) {
        event.waitUntil(
            clients.openWindow(notificationData.url)
        );
    } else if (action === 'snooze') {
        // Reschedule notification for 30 minutes later
        const snoozeTime = Date.now() + 30 * 60 * 1000;
        
        event.waitUntil(
            self.registration.showNotification(
                event.notification.title,
                {
                    ...event.notification.options,
                    timestamp: snoozeTime
                }
            )
        );
    }
    // 'dismiss' action just closes the notification
});

// Periodic sync for background updates
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync:', event.tag);
    
    if (event.tag === 'update-content') {
        event.waitUntil(updateContent());
    } else if (event.tag === 'cleanup-cache') {
        event.waitUntil(cleanupCache());
    }
});

// Update content periodically
async function updateContent() {
    console.log('[SW] Updating content...');
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    // Update each cached request
    for (const request of requests) {
        try {
            const response = await fetch(request);
            if (response.ok) {
                cache.put(request, response);
            }
        } catch (error) {
            console.log('[SW] Failed to update:', request.url);
        }
    }
    
    console.log('[SW] Content update completed');
}

// Clean up old cache entries
async function cleanupCache() {
    console.log('[SW] Cleaning up cache...');
    
    const cachesToClean = [DYNAMIC_CACHE, MEDIA_CACHE, API_CACHE];
    
    for (const cacheName of cachesToClean) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            const timestamp = response.headers.get('Cache-Timestamp');
            
            if (timestamp && (Date.now() - parseInt(timestamp)) > CACHE_MAX_AGE) {
                console.log('[SW] Removing old cache entry:', request.url);
                await cache.delete(request);
            }
        }
    }
    
    console.log('[SW] Cache cleanup completed');
}

// Enhanced message handler
self.addEventListener('message', (event) => {
    const { data } = event;
    
    if (!data || !data.type) return;
    
    console.log('[SW] Message received:', data.type);
    
    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            event.waitUntil(
                caches.open(DYNAMIC_CACHE)
                    .then((cache) => cache.addAll(data.urls))
                    .then(() => {
                        event.source?.postMessage({
                            type: 'CACHE_URLS_COMPLETE',
                            urls: data.urls
                        });
                    })
            );
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.delete(data.cacheName || DYNAMIC_CACHE)
                    .then((success) => {
                        event.source?.postMessage({
                            type: 'CACHE_CLEARED',
                            success: success
                        });
                    })
            );
            break;
            
        case 'GET_CACHE_STATUS':
            event.waitUntil(
                getCacheStatus()
                    .then((status) => {
                        event.source?.postMessage({
                            type: 'CACHE_STATUS',
                            status: status
                        });
                    })
            );
            break;
            
        case 'ADD_TO_OFFLINE_QUEUE':
            // Add operation to offline queue
            event.waitUntil(
                addToOfflineQueue(data.operation)
                    .then(() => {
                        event.source?.postMessage({
                            type: 'OFFLINE_QUEUE_ADDED'
                        });
                    })
            );
            break;
            
        case 'REGISTER_SYNC':
            // Register for background sync
            if ('sync' in self.registration) {
                event.waitUntil(
                    self.registration.sync.register(data.tag || 'sync-data')
                );
            }
            break;
    }
});

// Helper: Get cache status
async function getCacheStatus() {
    const status = {};
    const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE, MEDIA_CACHE, API_CACHE];
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        status[cacheName] = {
            size: keys.length,
            urls: keys.map(req => req.url)
        };
    }
    
    return status;
}

// Helper: Add operation to offline queue
async function addToOfflineQueue(operation) {
    const db = await openIndexedDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    const store = tx.objectStore('offlineQueue');
    
    await store.add({
        ...operation,
        timestamp: Date.now(),
        status: 'pending'
    });
    
    return tx.complete;
}

// Helper: IndexedDB operations
async function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LifeOSOffline', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create offline queue store
            if (!db.objectStoreNames.contains('offlineQueue')) {
                const store = db.createObjectStore('offlineQueue', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('status', 'status');
                store.createIndex('timestamp', 'timestamp');
            }
            
            // Create pending operations store
            if (!db.objectStoreNames.contains('pendingOperations')) {
                const store = db.createObjectStore('pendingOperations', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('type', 'type');
                store.createIndex('synced', 'synced');
            }
        };
    });
}

// Helper: Get pending operations
async function getPendingOperations(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('pendingOperations', 'readonly');
        const store = tx.objectStore('pendingOperations');
        const index = store.index('synced');
        const request = index.getAll(false);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Helper: Mark operation complete
async function markOperationComplete(db, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('pendingOperations', 'readwrite');
        const store = tx.objectStore('pendingOperations');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Helper: Log notification events
async function logNotificationEvent(eventType, data) {
    // Store in IndexedDB for analytics
    const db = await openIndexedDB();
    
    if (!db.objectStoreNames.contains('notificationLogs')) {
        // Create store if it doesn't exist
        return;
    }
    
    const tx = db.transaction('notificationLogs', 'readwrite');
    const store = tx.objectStore('notificationLogs');
    
    store.add({
        type: eventType,
        data: data,
        timestamp: Date.now()
    });
}

console.log('[SW] Service Worker loaded successfully');
