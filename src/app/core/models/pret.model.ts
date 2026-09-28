export type StatutPret =
  | 'en_attente'
  | 'approuve'
  | 'en_cours'
  | 'rembourse'
  | 'refuse'
  | 'en_retard';

export type StatutPaiementPayDunya =
  | 'en_attente_paiement'
  | 'en_attente_decaissement'
  | 'paiement_confirme'
  | 'paiement_echoue';

export type ModePaiement = 'especes' | 'wave' | 'orange_money';

export interface MembrePret {
  id: number;
  prenom: string;
  nom: string;
  telephone?: string;
}

export interface Pret {
  id: number;
  membre: MembrePret;
  montant: string;
  dateDemande: string;
  dureeMois: number | null;
  dateEcheance: string | null;
  dateApprobation: string | null;
  dateRemboursement: string | null;
  statut: StatutPret;
  modePaiement: ModePaiement | null;
}

/**
 * Réponse PayDunya retournée par le backend pour wave/orange_money.
 * Présent uniquement quand modePaiement !== 'especes'.
 */
export interface ReponsePayDunya {
  statut: StatutPaiementPayDunya;
  token?: string;
  urlPaiement?: string;
}

export interface ReglePret {
  id?: number;
  gie?: number;
  montantMax: string;
  dureeMaxMois: number;
  nombrePretsSimultanes: number;
  cotisationAJourObligatoire: boolean;
}

export interface DemanderPretRequest {
  montant: string;
}

export interface ApprouverPretRequest {
  dureeMois: number;
}

export interface DecaisserPretRequest {
  modePaiement: ModePaiement;
}

export interface RembourserPretRequest {
  modePaiement: ModePaiement;
}
