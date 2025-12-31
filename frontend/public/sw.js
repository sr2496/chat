// Service Worker for Push Notifications
/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body,
        icon: data.icon || '/logo.png',
        badge: data.badge || '/logo.png',
        data: data.data || {},
        tag: 'chat-notification-' + (data.data?.conversationId || 'default'),
        requireInteraction: false,
        vibrate: [200, 100, 200],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const conversationId = event.notification.data?.conversationId;
    const url = conversationId
        ? `/?conversation=${conversationId}`
        : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(() => {
                        // Navigate to conversation
                        client.postMessage({
                            type: 'NAVIGATE_TO_CONVERSATION',
                            conversationId,
                        });
                    });
                }
            }

            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
