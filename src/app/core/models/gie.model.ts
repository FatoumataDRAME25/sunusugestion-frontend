export interface GIE {
  id: number;
  nom: string;
  code: string;
  region: string;
  typeGie: string;
  dateCreation: string;
  statut: 'actif' | 'inactif';
}


export interface InfosGie {
  id: number;
  nom: string;
  region: string;
  typeGie: string;
  telephone?: string;
  code: string;
  dateCreation: string;
  statut: 'actif' | 'inactif';
  // Adresse relative (/media/gie/logos/…), null sans logo
  logo?: string | null;
}

export interface ModifierGieRequest {
  nom?: string;
  region?: string;
  typeGie?: string;
  telephone?: string;
  // Seule valeur acceptée en JSON : null retire le logo (envoi d'un fichier : FormData)
  logo?: null;
}
