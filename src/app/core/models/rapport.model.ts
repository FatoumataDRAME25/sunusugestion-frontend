export type TypePeriode = 'mensuel' | 'trimestriel' | 'annuel';

export interface ParametresRapport {
  typePeriode: TypePeriode;
  annee: number;
  mois?: number;       // 1 à 12, uniquement pour un rapport mensuel
  trimestre?: number;  // 1 à 4, uniquement pour un rapport trimestriel
}
