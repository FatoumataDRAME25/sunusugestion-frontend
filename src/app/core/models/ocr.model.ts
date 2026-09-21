export interface OcrResult {
  rawText: string;
  confidenceScores?: number[];
}

export interface PersonExtraite {
  prenom?: string;
  nom?: string;
  telephone?: string;
  role?: string;
  email?: string;
  dateNaissance?: string;
  numeroPiece?: string;
  adresse?: string;
  erreurs?: string[];
  [key: string]: any;
}

export interface ProcessDocumentResponse {
  rawText: string;
  count: number;
  validCount: number;
  invalidCount: number;
  persons: PersonExtraite[];
}
