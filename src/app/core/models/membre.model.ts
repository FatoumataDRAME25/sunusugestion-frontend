

// Membre tel que retourné par l'API dans la liste
export interface Membre {
 id: number;
  prenom: string;
  nom: string;
  telephone: string;
  role: RoleMembre;
  fonctionBureau?: FonctionBureau | '';
  email?: string | null;
  statut: 'en_attente'| 'actif' | 'inactif';
  // Date d'expiration du lien d'invitation (comptes en attente)
  invitationExpiration?: string | null;

}

// Titre dans le bureau (adjoints) : purement descriptif, sans droit supplémentaire
export type FonctionBureau = 'vice_president' | 'tresorier_adjoint' | 'secretaire_adjoint';

export const LIBELLES_ROLES: Record<RoleMembre, string> = {
  president: 'Président',
  tresorier: 'Trésorier',
  secretaire: 'Secrétaire',
  membre: 'Membre',
};

export const LIBELLES_FONCTIONS: Record<FonctionBureau, string> = {
  vice_president: 'Vice-président',
  tresorier_adjoint: 'Trésorier adjoint',
  secretaire_adjoint: 'Secrétaire adjoint',
};

// Cotisations d'un membre (fiche membre)
export interface CotisationMembre {
  id: number;
  session: string;
  montant: string | number;
  dateDebut: string;
  dateFin: string;
  statut: 'paye' | 'en_cours' | 'en_retard';
  datePaiement: string | null;
  modePaiement: 'especes' | 'wave' | 'orange_money' | null;
}

export interface ReponseCotisationsMembre {
  cotisations: CotisationMembre[];
  totalPaye: string | number;
  totalEnRetard: string | number;
  totalEnCours: string | number;
  nombrePayees: number;
  nombreEnRetard: number;
}

// Réponse des actions du président sur un membre
export interface ReponseActionMembre {
  message: string;
  membre: Membre;
  ancienPresident?: Membre;
  tokenInvitation?: string;
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


// Un membre retourné après import avec son token d'invitation
export interface MembreImporte {
  prenom: string;
  nom: string;
  telephone: string;
  tokenInvitation: string;
}

export interface ReponseImport {
  message: string;
  totalImportes: number;
  totalEchoues: number;
  membresImportes: MembreImporte[];
  erreurs: any[];
}
