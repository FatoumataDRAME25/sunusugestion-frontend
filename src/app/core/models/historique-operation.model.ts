export interface CotisationResum {
  id: number;
  libelleSession: string | null;
  membreNom: string | null;
}

export interface PretResum {
  id: number;
  montant: number;
  membreNom: string | null;
  statut: string;
}

export interface HistoriqueOperation {
  id: number;
  typeOperation: 'entree' | 'sortie';
  montant: number;
  libelle: string;
  cotisation: number | null;
  dateOperation: string;
}

export interface HistoriqueOperationDetail extends HistoriqueOperation {
  pret: number | null;
  cotisationDetail: CotisationResum | null;
  pretDetail: PretResum | null;
}
