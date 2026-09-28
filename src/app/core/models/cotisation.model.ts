export interface MembreCotisation {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
}

export interface SessionCotisationDetail {
  id: number;
  libelle: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
}

export interface Cotisation {
  id: number;
  session: SessionCotisationDetail;
  membre: MembreCotisation;
  datePaiement: string | null;
  modePaiement: string | null;
  statut: string;
}


// ← Ajoute ces deux interfaces
export interface SessionCotisation {
  id: number;
  libelle: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
  statut: 'ouverte' | 'cloturee';
  totalAttendu: number;
  totalCollecte: number;
  nombreMembres: number;
  nombrePaies: number;
  nombreEnAttente: number;
}

export interface CreerSessionRequest {
  libelle: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
}

/**
 * Réponse PayDunya pour le paiement d'une cotisation via wave/orange_money.
 */
export interface ReponsePaiementCotisation {
  statut: 'paye' | 'en_attente_paiement' | 'paiement_echoue';
  token?: string;
  urlPaiement?: string;
  cotisation?: Cotisation;
}
