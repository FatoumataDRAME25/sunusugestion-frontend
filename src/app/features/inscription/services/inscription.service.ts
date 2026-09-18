


import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  CreerGieRequest,
  InscriptionRequest,
  VerifierOtpRequest,
  GieCree,
  ReponseVerificationOtp
} from '../models/inscription.model';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InscriptionService {


  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly BASE_URL = environment.API_URL

  // Mémorise le token reçu à l'étape 1, réutilisé aux étapes 2 et 3.
  // Signal plutôt que simple variable : si un composant affiche ce token
  // quelque part (debug), il se met à jour automatiquement.
  tokenInscription = signal<string | null>(null);

  // Rempli seulement à la toute fin (étape 3 réussie), lu par l'écran de succès.
  gieFinalise = signal<GieCree | null>(null);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  creerGie(donnees: CreerGieRequest): Observable<{ tokenInscription: string }> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<{ tokenInscription: string }>(`${this.BASE_URL}auth/creer-gie/`, donnees).pipe(
      // tap = "regarder passer" la réponse sans la transformer.
      // On s'en sert ici pour un EFFET DE BORD (sauvegarder le token) —
      // le composant qui appelle creerGie() recevra quand même la réponse intacte.
      tap((reponse) => {
        this.tokenInscription.set(reponse.tokenInscription);
        this.isLoading.set(false);
      })
    );
  }

  // Omit<InscriptionRequest, 'tokenInscription'> = "même forme que InscriptionRequest,
  // MAIS sans le champ tokenInscription". Le composant appelant n'a donc pas à le fournir :
  // c'est cette méthode qui l'ajoute elle-même juste en dessous, à partir du signal.
  inscrireCompte(donnees: Omit<InscriptionRequest, 'tokenInscription'>): Observable<{ detail: string }> {
    const token = this.tokenInscription();

    // Garde-fou : si quelqu'un arrive ici sans être passé par creerGie() d'abord
    // (ex: URL /inscription/compte tapée directement dans le navigateur),
    // on arrête tout de suite plutôt que d'envoyer une requête vouée à échouer.
    if (!token) throw new Error('Aucun token de session actif — recommencez le parcours');

    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<{ detail: string }>(`${this.BASE_URL}auth/inscription/`, {
      tokenInscription: token, // ajouté ici, invisible pour le composant appelant
      ...donnees               // toutes les autres infos du formulaire (nom, prénom, pin...)
    }).pipe(
      tap(() => this.isLoading.set(false))
    );
  }

  verifierOtp(otp: string): Observable<ReponseVerificationOtp> {
    const token = this.tokenInscription();
    if (!token) throw new Error('Aucun token de session actif — recommencez le parcours');

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const requete: VerifierOtpRequest = { tokenInscription: token, otp };

    return this.http.post<ReponseVerificationOtp>(`${this.BASE_URL}auth/verifier-otp/`, requete).pipe(
      tap((reponse) => {
        this.isLoading.set(false);
        this.gieFinalise.set(reponse.gie);

        // Étape clé : cette requête ACTIVE le compte ET connecte automatiquement
        // l'utilisateur (elle renvoie les mêmes access/refresh/user qu'un vrai login).
        // On réutilise donc la méthode d'AuthService plutôt que de dupliquer cette logique.
        this.authService.definirSession(reponse.access, reponse.refresh, reponse.user);
      })
    );
  }

  // Appelée une fois arrivé sur l'écran de succès : repart sur une base propre
  // si l'utilisateur (ou un autre) refait une inscription plus tard dans la session.
  reinitialiser(): void {
    this.tokenInscription.set(null);
    this.gieFinalise.set(null);
  }
}
