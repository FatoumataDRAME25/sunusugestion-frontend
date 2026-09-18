import { Utilisateur } from './../models/utilisateur.model';
import { Injectable, signal, computed, inject } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { ReponseLogin } from '../models/utilisateur.model';
import { HttpClient } from '@angular/common/http';
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

  isAuthenticated = computed(() => this.currentUser() !== null);

  login(identifiant: string, pin: string): Observable<ReponseLogin> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<ReponseLogin>(`${this.BASE_URL}auth/connexion/`, { telephone: identifiant, pin }).pipe(
      tap( {next: (reponse) => {
          console.log('Réponse login complète:', reponse);
          this.definirSession(reponse.tokens.access, reponse.tokens.refresh, reponse.utilisateur);
        },
        error: (err) => {
          // Gestion basique de l'affichage de l'erreur via le signal
          this.errorMessage.set(err.error?.detail || 'Une erreur est survenue lors de la connexion.');
        }
      }),
      // S'exécute QUOI QU'IL ARRIVE (Succès ou Échec) pour couper le spinner
      finalize(() => this.isLoading.set(false))
    );
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

  // MÉTHODES ESSENTIELLES POUR L'INTERCEPTEUR de recuperer les tokens
  getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_ACCESS);
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
