export interface IndicateursCotisations {
  nombrePayees: number;
  nombreEnCours: number;
  nombreEnRetard: number;
  montantPaye: number;
}

export interface IndicateursPrets {
  nombreEnCours: number;
  nombreEnRetard: number;
  nombreRembourses: number;
  montantEnCours: number;
  montantEnRetard: number;
  montantRembourse: number;
}

export interface IndicateursTresorerie {
  totalEntrees: number;
  totalSorties: number;
  solde: number;
}

export interface IndicateursFinanciers {
  dateAnalyse: string;
  cotisations: IndicateursCotisations;
  prets: IndicateursPrets;
  tresorerie: IndicateursTresorerie;
}

export interface RecommandationDiagnostic {
  probleme: string;
  action: string;
  objectif: string;
}

export interface AnalyseIA {
  resume: string;
  risques: string | string[];
  recommandations: (string | RecommandationDiagnostic)[];
}

export interface IntelligenceArtificielle {
  disponible: boolean;
  analyse?: AnalyseIA;
  message?: string;
}

export interface DiagnosticResponse {
  indicateurs: IndicateursFinanciers;
  intelligenceArtificielle: IntelligenceArtificielle;
}
