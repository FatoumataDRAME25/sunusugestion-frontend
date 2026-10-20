export const environment = {
  // Relatif : les appels passent par le proxy du serveur Angular (proxy.conf.json),
  // ce qui fonctionne aussi depuis un téléphone via l'adresse ngrok.
  API_URL: '/api/',

  // Adresse publique de l'application, utilisée dans les liens d'invitation
  // envoyés aux membres. Seul endroit à modifier quand l'adresse ngrok change.
  URL_PUBLIQUE: 'https://reviving-gurgle-pauper.ngrok-free.dev'
};
