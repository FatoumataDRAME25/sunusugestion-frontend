// features/dashboard/data/dashboard.mock.ts
import { DashboardStats, EvolutionGie, RepartitionSecteur } from '../models/dashboard.model';
import { GIE } from '../models/gie.model';

export const STATS_MOCK: DashboardStats = {
  totalGies: 284,
  gieActifs: 120,
  gieInactifs: 164,
  totalMembres: 1208,
  totalRegions: 14,
  totalSecteurs: 12
};

export const EVOLUTION_MOCK: EvolutionGie[] = [
  { mois: 'Jan', total: 850 },
  { mois: 'Fév', total: 920 },
  { mois: 'Mar', total: 1050 },
  { mois: 'Avr', total: 1100 },
  { mois: 'Mai', total: 1200 }
];

export const REPARTITION_SECTEURS_MOCK: RepartitionSecteur[] = [
  { secteur: 'Agriculture', pourcentage: 35 },
  { secteur: 'Pêche', pourcentage: 25 },
  { secteur: 'Artisanat', pourcentage: 15 },
  { secteur: 'Commerce', pourcentage: 12 },
  { secteur: 'Élevage', pourcentage: 8 },
  { secteur: 'Services', pourcentage: 5 }
];

export const GIE_RECENTS_ACTIVES_MOCK: GIE[] = [
  { id: 1, nom: 'Kolda Green Agro', code: 'KGA-01', region: 'Kolda', secteur: 'Agriculture', dateCreation: '2024-10-24', statut: 'actif' },
  { id: 2, nom: 'Pêche Artisanale Thiaroye', code: 'PAT-02', region: 'Dakar', secteur: 'Pêche', dateCreation: '2024-10-22', statut: 'actif' },
  { id: 3, nom: 'Artisans de Ziguinchor', code: 'AZ-03', region: 'Ziguinchor', secteur: 'Artisanat', dateCreation: '2024-10-20', statut: 'actif' }
];

export const GIE_RECENTS_DESACTIVES_MOCK: GIE[] = [
  { id: 4, nom: 'Groupement Maraîcher Touba', code: 'GMT-04', region: 'Diourbel', secteur: 'Agriculture', dateCreation: '2024-10-25', statut: 'inactif' },
  { id: 5, nom: 'Textiles Saint-Louis', code: 'TSL-05', region: 'Saint-Louis', secteur: 'Artisanat', dateCreation: '2024-10-18', statut: 'inactif' },
  { id: 6, nom: 'Élevage Bovin Fatick', code: 'EBF-06', region: 'Fatick', secteur: 'Élevage', dateCreation: '2024-10-15', statut: 'inactif' }
];
