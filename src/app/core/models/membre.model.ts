

// Membre tel que retourné par l'API dans la liste
export interface Membre {
 id: number;
  prenom: string;
  nom: string;
  telephone: string;
  role: RoleMembre;
  statut: 'en_attente'| 'actif' | 'inactif';

}

// Réponse de l'endpoint liste membres
export interface ReponseMembres {
  membres: Membre[];
  total: number;
  actifs: number;
  inactifs: number;
  enAttente: number;
}


// Les rôles possibles pour un membre (tels qu'attendus par l'API)
export type RoleMembre = 'president'| 'tresorier' | 'secretaire' | 'membre';

// Contrat pour l'ajout manuel d'un membre
export interface AjouterMembreRequest {
  tokenInvitation: string
  prenom: string;
  nom: string;
  telephone: string;
  role: RoleMembre;
  email?: string;
}

// Un membre analysé depuis le fichier Excel (retourné par l'API à l'étape d'analyse)
export interface MembreExcel {
  prenom: string;
  nom: string;
  telephone: string;
  role: string; // peut contenir des valeurs brutes du fichier Excel
  statut: 'valide' | 'erreur';
  erreurs?: string[];

}

// Réponse de l'endpoint analyser-excel
export interface ReponseAnalyseExcel {
  membresValides: MembreExcel[];
  membresInvalides: MembreExcel[];
  totalValides: number;
  totalInvalides: number;
}


// ← pour afficher dans le modal de succès

export interface ReponseImport {
  message: string;
  membresImportes: any[];
  erreurs: any[];
}
