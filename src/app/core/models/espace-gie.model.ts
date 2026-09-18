export interface StatsGie {
  nombreMembres: number;
  cotisationsMois: number;
  montantEnAttente: number;
  pretsEnCours: number;
  demandesApprobationPrets: number;
}

export interface ActiviteRecente {
  id: number;
  message: string;
  tempsEcoule: string;
}
