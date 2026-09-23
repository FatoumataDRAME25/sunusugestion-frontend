export type StatutActivite = 'planifiee' | 'en_cours' | 'terminee' | 'annulee';

export type TypeActivite = 'reunion' | 'formation' | 'production' | 'commerciale' | 'autre';

export interface Activite {
  id: number;
  gie: number;
  organisateur: number;
  titre: string;
  dateCreation: string;
  dateActivite: string;
  lieu: string;
  typeActivite: TypeActivite;
  ordreDuJour: string | null;
  compteRendu: string | null;
  statut: StatutActivite;
}

export interface MembrePresence {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  statut: 'present' | 'absent' | null;
}

export interface EnregistrerPresence {
  utilisateur: number;
  statut: 'present' | 'absent';
}

// ── Requêtes ──────────────────────────────────────────────────────────────────

export interface CreerActiviteRequest {
  titre: string;
  dateActivite: string;
  lieu: string;
  typeActivite: TypeActivite;
}

export interface DemarrerActiviteRequest {
  ordreDuJour?: string;
}

export interface TerminerActiviteRequest {
  compteRendu: string;
}

export interface EnregistrerPresencesRequest {
  presences: EnregistrerPresence[];
}

// ── Libellés affichés ─────────────────────────────────────────────────────────

export const TYPES_ACTIVITE: { value: TypeActivite; label: string }[] = [
  { value: 'reunion',     label: 'Réunion' },
  { value: 'formation',   label: 'Formation' },
  { value: 'production',  label: 'Production' },
  { value: 'commerciale', label: 'Commerciale' },
  { value: 'autre',       label: 'Autre' },
];
