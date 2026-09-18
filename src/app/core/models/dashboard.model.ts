


export interface DashboardStats {
  totalGies: number;
  gieActifs: number;
  gieInactifs: number;
  totalMembres: number;
  totalRegions: number;
  totalSecteurs: number;
}

export interface EvolutionGie {
  mois: string;
  total: number;
}

export interface RepartitionSecteur {
  secteur: string;
  pourcentage: number;
}
