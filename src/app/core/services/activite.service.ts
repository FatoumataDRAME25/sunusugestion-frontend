import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Activite,
  MembrePresence,
  CreerActiviteRequest,
  DemarrerActiviteRequest,
  TerminerActiviteRequest,
  EnregistrerPresencesRequest,
} from '../models/activite.model';

@Injectable({ providedIn: 'root' })
export class ActiviteService {

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  activites = signal<Activite[]>([]);
  activiteSelectionnee = signal<Activite | null>(null);
  membres = signal<MembrePresence[]>([]);

  // ─── LISTE ───────────────────────────────────────────────
  getActivites(): Observable<Activite[]> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<Activite[]>(`${this.BASE_URL}activites/activites/`).pipe(
      tap((liste) => {
        this.activites.set(liste);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du chargement des activités.');
        return throwError(() => err);
      })
    );
  }

  // ─── DÉTAIL ───────────────────────────────────────────────
  getActivite(id: number): Observable<Activite> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<Activite>(`${this.BASE_URL}activites/activites/${id}/`).pipe(
      tap((activite) => {
        this.activiteSelectionnee.set(activite);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du chargement de l\'activité.');
        return throwError(() => err);
      })
    );
  }

  // ─── CRÉATION ─────────────────────────────────────────────
  creerActivite(body: CreerActiviteRequest): Observable<Activite> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<Activite>(`${this.BASE_URL}activites/activites/`, body).pipe(
      tap((activite) => {
        this.activiteSelectionnee.set(activite);
        this.activites.set([activite, ...this.activites()]);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this._extraireErreurs(err));
        return throwError(() => err);
      })
    );
  }

  // ─── MODIFICATION ─────────────────────────────────────────
  modifierActivite(id: number, body: Partial<CreerActiviteRequest>): Observable<Activite> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.patch<Activite>(`${this.BASE_URL}activites/activites/${id}/`, body).pipe(
      tap((activite) => {
        this.activiteSelectionnee.set(activite);
        this._mettreAJourListe(activite);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this._extraireErreurs(err));
        return throwError(() => err);
      })
    );
  }

  // ─── DÉMARRER ─────────────────────────────────────────────
  demarrerActivite(id: number, body: DemarrerActiviteRequest = {}): Observable<any> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<any>(`${this.BASE_URL}activites/activites/${id}/demarrer/`, body).pipe(
      tap((reponse) => {
        // Le backend retourne { message, statut, ordreDuJour }
        // On recharge le détail pour avoir l'objet complet à jour
        const actuelle = this.activiteSelectionnee();
        if (actuelle) {
          this.activiteSelectionnee.set({
            ...actuelle,
            statut: reponse.statut ?? 'en_cours',
            ordreDuJour: reponse.ordreDuJour ?? actuelle.ordreDuJour,
          });
          this._mettreAJourListe({ ...actuelle, statut: reponse.statut ?? 'en_cours' });
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this._extraireErreurs(err));
        return throwError(() => err);
      })
    );
  }

  // ─── TERMINER ─────────────────────────────────────────────
  terminerActivite(id: number, body: TerminerActiviteRequest): Observable<any> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<any>(`${this.BASE_URL}activites/activites/${id}/terminer/`, body).pipe(
      tap((reponse) => {
        const actuelle = this.activiteSelectionnee();
        if (actuelle) {
          this.activiteSelectionnee.set({
            ...actuelle,
            statut: reponse.statut ?? 'terminee',
            compteRendu: reponse.compteRendu ?? body.compteRendu,
          });
          this._mettreAJourListe({ ...actuelle, statut: reponse.statut ?? 'terminee' });
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this._extraireErreurs(err));
        return throwError(() => err);
      })
    );
  }

  // ─── ANNULER ──────────────────────────────────────────────
  annulerActivite(id: number): Observable<any> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<any>(`${this.BASE_URL}activites/activites/${id}/annuler/`, {}).pipe(
      tap(() => {
        const actuelle = this.activiteSelectionnee();
        if (actuelle) {
          const mise = { ...actuelle, statut: 'annulee' as const };
          this.activiteSelectionnee.set(mise);
          this._mettreAJourListe(mise);
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this._extraireErreurs(err));
        return throwError(() => err);
      })
    );
  }

  // ─── MEMBRES (PRÉSENCES) ──────────────────────────────────
  getMembresActivite(id: number): Observable<MembrePresence[]> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<MembrePresence[]>(`${this.BASE_URL}activites/activites/${id}/membres/`).pipe(
      tap((liste) => {
        this.membres.set(liste);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du chargement des membres.');
        return throwError(() => err);
      })
    );
  }

  // ─── ENREGISTRER PRÉSENCES ────────────────────────────────
  enregistrerPresences(id: number, body: EnregistrerPresencesRequest): Observable<any> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<any>(`${this.BASE_URL}activites/activites/${id}/enregistrer-presences/`, body).pipe(
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this._extraireErreurs(err));
        return throwError(() => err);
      })
    );
  }

  // ─── HELPERS ──────────────────────────────────────────────
  private _mettreAJourListe(activiteMaj: Activite): void {
    this.activites.set(
      this.activites().map(a => a.id === activiteMaj.id ? activiteMaj : a)
    );
  }

  private _extraireErreurs(err: any): string {
    const data = err?.error;
    if (!data) return 'Une erreur est survenue.';
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    const messages: string[] = [];
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val)) val.forEach((m: any) => messages.push(String(m)));
      else if (typeof val === 'string') messages.push(val);
    }
    return messages.length > 0 ? messages.join(' — ') : 'Erreur inattendue.';
  }
}
