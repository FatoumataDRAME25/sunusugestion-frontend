export type StatutAbonnement = 'essai' | 'actif';
export type EtatAbonnement = 'essai' | 'actif' | 'grace' | 'lecture_seule';

export interface TarifAbonnement {
  montant: number;
  palier: number;
  seuil: number | null;
  dansTolerance: boolean;
  membresAvantPalierSuivant: number | null;
  montantPalierSuivant: number | null;
}

export interface PalierTarif {
  membresMin: number;
  membresMax: number | null;
  montant: number;
}

export interface PaiementAbonnement {
  id: number;
  montant: string | number;
  nombreMembres: number;
  modePaiement: 'wave' | 'orange_money' | 'manuel';
  statut: 'en_attente' | 'valide' | 'echoue';
  periodeDebut: string | null;
  periodeFin: string | null;
  initiePar: string | null;
  note: string;
  dateCreation: string;
  dateValidation: string | null;
}

export interface Abonnement {
  statut: StatutAbonnement;
  etat: EtatAbonnement;
  dateDebut: string;
  dateFin: string;
  joursRestants: number;
  delaiGraceJours: number;
  dateLectureSeule: string;
  peutPayer?: boolean;
  // Président, trésorier et administrateur uniquement
  membresActifs?: number;
  tarif?: TarifAbonnement;
  prochainePeriode?: { debut: string; fin: string };
  grille?: { paliers: PalierTarif[]; tolerance: number };
  paiements?: PaiementAbonnement[];
}

export interface InstanceAdmin {
  id: number;
  nom: string;
  code: string;
  region: string;
  statutGie: string;
  membresActifs: number;
  montantMensuel: number;
  abonnement: {
    statut: StatutAbonnement;
    etat: EtatAbonnement;
    dateFin: string;
    joursRestants: number;
  };
}

export interface InstanceAdminDetail extends Omit<InstanceAdmin, 'abonnement'> {
  abonnement: Abonnement;
}
