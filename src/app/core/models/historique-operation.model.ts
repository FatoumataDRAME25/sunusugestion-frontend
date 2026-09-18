export interface HistoriqueOperation {
  id: number;
  typeOperation: 'entree' | 'sortie';
  montant: number;
  libelle: string;
  cotisation: number | null;
  dateOperation: string;
}
