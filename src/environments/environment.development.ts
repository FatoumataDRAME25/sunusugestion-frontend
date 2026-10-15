export const environment = {
  // Relatif : les appels passent par le proxy du serveur Angular (proxy.conf.json),
  // ce qui fonctionne aussi depuis un téléphone via l'adresse ngrok.
  API_URL: '/api/',

  // Adresse publique de l'application, utilisée dans les liens d'invitation
  // envoyés aux membres. Seul endroit à modifier quand l'adresse ngrok change.
  URL_PUBLIQUE: 'https://reviving-gurgle-pauper.ngrok-free.dev',

  firebase: {
    apiKey: "AIzaSyB3wQ1JW6qmOvYl5Hokw00iW4chwmjSmm0",
    authDomain: 'sunugestion-290fb.firebaseapp.com',
    projectId: 'sunugestion-290fb',
    storageBucket: 'sunugestion-290fb.firebasestorage.app',
    messagingSenderId: '319488130990',
    appId: '1:319488130990:web:25c74cace3606d10d3d23f'
  }
};
