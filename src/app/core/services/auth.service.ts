import { Utilisateur } from './../models/utilisateur.model';
import { Injectable, signal, computed, inject } from '@angular/core';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ReponseLogin } from '../models/utilisateur.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly STORAGE_KEY_USER = 'sunugestion_user';
  private readonly STORAGE_KEY_ACCESS = 'sunugestion_access';
  private readonly STORAGE_KEY_REFRESH = 'sunugestion_refresh';

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  currentUser = signal<Utilisateur | null>(this.lireUtilisateurStocke());
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  secondesVerrouillage = signal<number | null>(null);

  isAuthenticated = computed(() => this.currentUser() !== null);

  login(identifiant: string, pin: string): Observable<ReponseLogin> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http
      .post<ReponseLogin>(
        `${this.BASE_URL}auth/connexion/`,
        {
          telephone: identifiant,
          pin
        }
      )
      .pipe(
        tap((reponse) => {
          // La session est créée uniquement si la connexion réussit.
          this.definirSession(
            reponse.tokens.access,
            reponse.tokens.refresh,
            reponse.utilisateur
          );
        }),

        catchError((err: HttpErrorResponse) => {
          const erreur = err.error;

          const message = this.extraireMessageErreur(err);
          this.errorMessage.set(message);

          // Récupérer le temps restant si le compte est verrouillé.
          const secondes = erreur?.secondesRestantes;

          if (secondes !== undefined && secondes !== null) {
            const valeur = Number(
              Array.isArray(secondes) ? secondes[0] : secondes
            );

            if (Number.isFinite(valeur) && valeur >= 0) {
              this.secondesVerrouillage.set(valeur);
            } else {
              this.secondesVerrouillage.set(null);
            }
          } else {
            this.secondesVerrouillage.set(null);
          }

          // Transmettre l'erreur au composant de connexion.
          return throwError(() => err);
        }),

        finalize(() => {
          this.isLoading.set(false);
        })
      );
  }


    private extraireMessageErreur(err: HttpErrorResponse): string {
    const erreur = err.error;

    if (typeof erreur === 'string') {
      return erreur;
    }

    if (erreur?.non_field_errors) {
      const messages = erreur.non_field_errors;

      return Array.isArray(messages)
        ? messages.join(' ')
        : String(messages);
    }

    if (erreur?.detail) {
      return String(erreur.detail);
    }

    if (erreur?.message) {
      return String(erreur.message);
    }

    if (erreur && typeof erreur === 'object') {
      const messages = Object.values(erreur)
        .flat()
        .filter((message): message is string =>
          typeof message === 'string'
        );

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    if (err.status === 0) {
      return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    }

    return 'Une erreur est survenue lors de la connexion.';
  }


  definirSession(access: string, refresh: string, utilisateur: Utilisateur): void {
    this.currentUser.set(utilisateur);
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(utilisateur));
    localStorage.setItem(this.STORAGE_KEY_ACCESS, access);
    localStorage.setItem(this.STORAGE_KEY_REFRESH, refresh);
  }

  logout(): void {
    const refresh = localStorage.getItem(this.STORAGE_KEY_REFRESH);

    if (refresh) {
      this.http.post(`${this.BASE_URL}auth/deconnexion/`, { refresh }).subscribe({
        error: () => {} // même en cas d'échec réseau, on nettoie la session locale ci-dessous
      });
    }

    // Nettoyage du localStorage et remise à zéro du signal
    localStorage.removeItem(this.STORAGE_KEY_USER);
    localStorage.removeItem(this.STORAGE_KEY_ACCESS);
    localStorage.removeItem(this.STORAGE_KEY_REFRESH);
    this.currentUser.set(null);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_REFRESH);
  }

  private lireUtilisateurStocke(): Utilisateur | null {
  const donnees = localStorage.getItem(this.STORAGE_KEY_USER);
  if (!donnees) return null;

  try {
    return JSON.parse(donnees);
  } catch {
    localStorage.removeItem(this.STORAGE_KEY_USER);
    return null;
  }
}

  // Methode pour la mise à jour du profil de l'utilisateur actuel
  updateProfil(modifications: Partial<Utilisateur>): void {
    const utilisateurActuel = this.currentUser();
    if (!utilisateurActuel) return;

    const utilisateurMisAJour = { ...utilisateurActuel, ...modifications };
    this.currentUser.set(utilisateurMisAJour);
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(utilisateurMisAJour));
  }
}
