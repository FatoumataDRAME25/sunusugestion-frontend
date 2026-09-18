// features/espaces-gie/data/espaces-gie.mock.ts
import { GieListeItem } from '../models/gie-liste-item.model';

export const GIE_LISTE_MOCK: GieListeItem[] = [
  { id: 1, nom: 'Kolda Green Agro', code: 'SG-2024-001', region: 'Kolda', secteur: 'Agriculture', dateCreation: '2024-10-24', statut: 'actif', nombreMembres: 142 },
  { id: 2, nom: 'Pêche Artisanale Thiaroye', code: 'SG-2024-042', region: 'Dakar', secteur: 'Pêche', dateCreation: '2024-10-22', statut: 'actif', nombreMembres: 86 },
  { id: 3, nom: 'Groupement Maraîcher Touba', code: 'SG-2023-854', region: 'Diourbel', secteur: 'Maraîchage', dateCreation: '2023-10-25', statut: 'inactif', nombreMembres: 32 },
  { id: 4, nom: 'Artisans de Ziguinchor', code: 'SG-2024-112', region: 'Ziguinchor', secteur: 'Artisanat', dateCreation: '2024-10-20', statut: 'actif', nombreMembres: 215 },
  { id: 5, nom: 'Textiles Saint-Louis', code: 'SG-2023-442', region: 'Saint-Louis', secteur: 'Industrie', dateCreation: '2023-10-18', statut: 'inactif', nombreMembres: 54 }
];
