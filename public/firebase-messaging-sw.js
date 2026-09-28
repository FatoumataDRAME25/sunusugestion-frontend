importScripts(
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyB3wQ1JW6qmOvYl5Hokw00iW4chwmjSmm0',
  authDomain: 'sunugestion-290fb.firebaseapp.com',
  projectId: 'sunugestion-290fb',
  storageBucket: 'sunugestion-290fb.firebasestorage.app',
  messagingSenderId: '319488130990',
  appId: '1:319488130990:web:25c74cace3606d10d3d23f'
});

const messaging = firebase.messaging();

console.log('🔥 Firebase Messaging initialisé');

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notification reçue :', payload);

  const notificationTitle = payload.notification?.title || 'SunuGestion';

  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification.',
    icon: '/favicon.ico',
    // Conserver les données FCM pour les récupérer au clic
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ─── URL de base ──────────────────────────────────────────────────────────────
const APP_URL = 'http://localhost:4200';

/**
 * Construit l'URL Angular cible à partir des données de la notification.
 * Utilise uniquement les routes réellement présentes dans app.routes.ts.
 */
function construireUrl(data) {
  const module   = data?.module   || '';
  const objetId  = data?.objet_id || '';

  switch (module) {
    case 'activites':
      return objetId
        ? `${APP_URL}/mon-espace/activites/${objetId}`
        : `${APP_URL}/mon-espace/activites`;

    case 'prets':
      return objetId
        ? `${APP_URL}/mon-espace/prets/${objetId}`
        : `${APP_URL}/mon-espace/prets`;

    case 'cotisations':
      // Pas de route détail cotisation par ID simple — on ouvre la liste
      return `${APP_URL}/mon-espace/cotisations`;

    case 'membres':
      return `${APP_URL}/mon-espace/membres`;

    case 'general':
    default:
      return `${APP_URL}/mon-espace`;
  }
}

// ─── Clic sur la notification ─────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data     = event.notification.data || {};
  const cibleUrl = construireUrl(data);

  console.log('[SW] Clic notification → URL cible :', cibleUrl);

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher un onglet SunuGestion déjà ouvert
        // Chercher un onglet déjà ouvert sur SunuGestion
        const clientOuvert = clientList.find(c => c.url.startsWith(APP_URL));

        if (clientOuvert) {
          // Ouvrir un nouvel onglet sur l'URL cible et focus
          return clients.openWindow(cibleUrl).then(() => clientOuvert.focus());
        }

        // Aucun onglet ouvert → ouvrir directement
        return clients.openWindow(cibleUrl);
        }
      )
  );
});
