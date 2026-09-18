import { ActiviteRecente, StatsGie } from "../models/espace-gie.model";


export const STATS_MOCK: StatsGie = {
  nombreMembres: 24,
  cotisationsMois: 450000,
  montantEnAttente: 75000,
  pretsEnCours: 4,
  demandesApprobationPrets: 3
};

export const ACTIVITES_RECENTES_MOCK: ActiviteRecente[] = [
  { id: 1, message: 'Awa a rejoint le GIE', tempsEcoule: 'Il y a 2 heures' },
  { id: 2, message: 'Cotisation de Mariama enregistrée', tempsEcoule: 'Il y a 5 heures' },
  { id: 3, message: 'Réunion mensuelle créée', tempsEcoule: 'Hier à 14:30' }
];
