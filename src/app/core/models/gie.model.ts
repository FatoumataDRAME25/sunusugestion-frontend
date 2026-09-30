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
  logo?: string;
}

export interface ModifierGieRequest {
  nom?: string;
  region?: string;
  typeGie?: string;
  telephone?: string;
}
