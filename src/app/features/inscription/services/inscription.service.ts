
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  finalize,
  Observable,
  tap,
  throwError
} from 'rxjs';

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

  private readonly BASE_URL = environment.API_URL;

  // Mémorise le token reçu à l'étape 1,
  // réutilisé aux étapes 2 et 3.
  tokenInscription = signal<string | null>(null);

  // Rempli seulement à la toute fin (étape 3 réussie),
  // lu par l'écran de succès.
  gieFinalise = signal<GieCree | null>(null);

  // Indique si une requête est en cours.
  isLoading = signal(false);

  // Message d'erreur affiché à l'utilisateur.
  errorMessage = signal<string | null>(null);


  // ============================================================
  // ÉTAPE 1 : CRÉATION DE L'ORGANISATION
  // ============================================================

  creerGie(
    donnees: CreerGieRequest
  ): Observable<{ tokenInscription: string }> {

    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http
      .post<{ tokenInscription: string }>(
        `${this.BASE_URL}auth/creer-gie/`,
        donnees
      )
      .pipe(

        // Si la requête réussit :
        // on mémorise le token d'inscription.
        tap((reponse) => {
          this.tokenInscription.set(reponse.tokenInscription);
        }),

        // Si Django renvoie une erreur (400, 500, etc.),
        // on récupère le message pour l'afficher dans l'interface.
        catchError((err) => {

          const message =
            err.error?.nonFieldErrors?.[0]
            ?? err.error?.detail
            ?? this.extraireErreurChamp(err.error)
            ?? 'Une erreur est survenue lors de la création de l’organisation.';

          this.errorMessage.set(message);

          return throwError(() => err);
        }),

        // S'exécute TOUJOURS :
        // succès OU erreur.
        // Le loader ne peut donc plus rester bloqué.
        finalize(() => {
          this.isLoading.set(false);
        })
      );
  }


  // ============================================================
  // ÉTAPE 2 : CRÉATION DU COMPTE
  // ============================================================

  inscrireCompte(
    donnees: Omit<InscriptionRequest, 'tokenInscription'>
  ): Observable<{ detail: string }> {

    const token = this.tokenInscription();

    // Garde-fou :
    // impossible de continuer sans avoir créé l'organisation.
    if (!token) {
      const message =
        'Aucun token de session actif — recommencez le parcours.';

      this.errorMessage.set(message);

      return throwError(() => new Error(message));
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http
      .post<{ detail: string }>(
        `${this.BASE_URL}auth/inscription/`,
        {
          tokenInscription: token,
          ...donnees
        }
      )
      .pipe(

        catchError((err) => {

          const message =
            err.error?.nonFieldErrors?.[0]
            ?? err.error?.detail
            ?? this.extraireErreurChamp(err.error)
            ?? 'Une erreur est survenue lors de la création du compte.';

          this.errorMessage.set(message);

          return throwError(() => err);
        }),

        finalize(() => {
          this.isLoading.set(false);
        })
      );
  }


  // ============================================================
  // ÉTAPE 3 : VÉRIFICATION OTP
  // ============================================================

  verifierOtp(
    otp: string
  ): Observable<ReponseVerificationOtp> {

    const token = this.tokenInscription();

    // Garde-fou :
    // impossible de vérifier l'OTP sans token.
    if (!token) {
      const message =
        'Aucun token de session actif — recommencez le parcours.';

      this.errorMessage.set(message);

      return throwError(() => new Error(message));
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const requete: VerifierOtpRequest = {
      tokenInscription: token,
      otp
    };

    return this.http
      .post<ReponseVerificationOtp>(
        `${this.BASE_URL}auth/verifier-otp/`,
        requete
      )
      .pipe(

        // Si l'OTP est valide :
        tap((reponse) => {

          this.gieFinalise.set(reponse.gie);

          this.authService.definirSession(
            reponse.access,
            reponse.refresh,
            reponse.user
          );
        }),

        catchError((err) => {

          const message =
            err.error?.nonFieldErrors?.[0]
            ?? err.error?.detail
            ?? 'Code OTP invalide ou expiré.';

          this.errorMessage.set(message);

          return throwError(() => err);
        }),

        // Succès OU erreur :
        // le loader est toujours arrêté.
        finalize(() => {
          this.isLoading.set(false);
        })
      );
  }


renvoyerOtp(): Observable<{ message: string }> {
  const token = this.tokenInscription();

  if (!token) {
    const message = 'Aucun token de session actif — recommencez le parcours.';
    this.errorMessage.set(message);
    return throwError(() => new Error(message));
  }

  this.isLoading.set(true);
  this.errorMessage.set(null);

  return this.http
    .post<{ message: string }>(
      `${this.BASE_URL}auth/renvoyer-otp/`,
      { tokenInscription: token }
    )
    .pipe(
      catchError((err) => {
        const message =
          err.error?.nonFieldErrors?.[0]
          ?? err.error?.detail
          ?? this.extraireErreurChamp(err.error)
          ?? 'Impossible de renvoyer le code OTP.';

        this.errorMessage.set(message);
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
}


  // ============================================================
  // EXTRACTION DES ERREURS DE CHAMPS
  // ============================================================

  private extraireErreurChamp(
    erreurs: any
  ): string | null {

    if (!erreurs || typeof erreurs !== 'object') {
      return null;
    }

    // Exemple Django :
    // {
    //   "nom": ["Ce champ est obligatoire."],
    //   "region": ["Ce champ est obligatoire."]
    // }

    for (const valeur of Object.values(erreurs)) {

      if (Array.isArray(valeur) && valeur.length > 0) {
        return String(valeur[0]);
      }

      if (typeof valeur === 'string') {
        return valeur;
      }
    }

    return null;
  }


  // ============================================================
  // RÉINITIALISATION
  // ============================================================

  reinitialiser(): void {
    this.tokenInscription.set(null);
    this.gieFinalise.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(false);
  }
}

