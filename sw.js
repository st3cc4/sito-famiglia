// --- SERVICE WORKER CON SUPPORTO PUSH NOTIFICATIONS ---

self.addEventListener('install', (event) => {
    console.log('Service Worker installato con successo.');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker attivato.');
    return self.clients.claim();
});

// Intercetta l'evento push proveniente dal server/database
self.addEventListener('push', (event) => {
    let notificationData = {
        title: 'Famiglia - Portale',
        body: 'Hai una nuova notifica.',
        icon: './favicon.ico',
        url: './home.html'
    };

    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon || './favicon.ico',
        badge: './favicon.ico',
        vibrate: [200, 100, 200],
        data: {
            url: notificationData.url || './home.html'
        }
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Gestisce il click dell'utente sulla notifica (apre l'app)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data.url || './home.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Se l'app è già aperta in una scheda, portala in primo piano
            for (let client of windowClients) {
                if (client.url.includes('home.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Altrimenti apri una nuova finestra/scheda sull'indirizzo dell'app
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
