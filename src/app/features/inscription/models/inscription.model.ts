import { Utilisateur } from "../../../core/models/utilisateur.model";

export type TypeGie = 'association' | 'organisation_communautaire' | 'groupement' |  'autre';

export interface CreerGieRequest {
  nom: string;
  region: string;
  typeGie: TypeGie;
  telephone?: string;
  photo?: string;
}


export interface InscriptionRequest {
  tokenInscription: string;
  nom: string;
  prenom: string;
  telephone: string;
  pin: string;
  confirmationPin: string;
  email?: string;
}

export interface VerifierOtpRequest {
  tokenInscription: string;
  otp: string;
}

export interface GieCree {
  id: number;
  nom: string;
  code: string;
  statut: 'actif' | 'inactif';
}

export interface ReponseVerificationOtp {
  access: string;
  refresh: string;
  user: Utilisateur;
  gie: GieCree;
}
