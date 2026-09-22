import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Pret,
  ReglePret,
  DemanderPretRequest,
  ApprouverPretRequest,
  DecaisserPretRequest,
  RembourserPretRequest,
} from '../models/pret.model';

@Injectable({ providedIn: 'root' })
export class PretService {

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // State
  prets = signal<Pret[]>([]);
  pretSelectionne = signal<Pret | null>(null);
  regle = signal<ReglePret | null>(null);

  // Stats calculées localement depuis la liste
  statsEnAttente = signal(0);
  statsApprouve = signal(0);
  statsEnCours = signal(0);

  // ─── LISTE ───────────────────────────────────────────────
  chargerPrets(): Observable<Pret[]> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<Pret[]>(`${this.BASE_URL}prets/`).pipe(
      tap((liste) => {
        this.prets.set(liste);
        this.statsEnAttente.set(liste.filter(p => p.statut === 'en_attente').length);
        this.statsApprouve.set(liste.filter(p => p.statut === 'approuve').length);
        this.statsEnCours.set(liste.filter(p => p.statut === 'en_cours').length);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        if (err.status === 405) {
          // GET non implémenté côté backend — endpoint manquant dans le contrat API
          this.errorMessage.set('La liste des prêts n\'est pas encore disponible (endpoint GET /api/prets/ manquant).');
        } else {
          this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du chargement des prêts.');
        }
        return throwError(() => err);
      })
    );
  }

  // ─── DÉTAIL ───────────────────────────────────────────────
  chargerPret(id: number): Observable<Pret> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<Pret>(`${this.BASE_URL}prets/${id}/`).pipe(
      tap((pret) => {
        this.pretSelectionne.set(pret);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du chargement du prêt.');
        return throwError(() => err);
      })
    );
  }

  // ─── DEMANDE ──────────────────────────────────────────────
  demanderPret(body: DemanderPretRequest): Observable<Pret> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<Pret>(`${this.BASE_URL}prets/`, body).pipe(
      tap((pret) => {
        this.pretSelectionne.set(pret);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this._extraireErreurs(err));
        return throwError(() => err);
      })
    );
  }

  // ─── APPROBATION ──────────────────────────────────────────
  approuverPret(id: number, body: ApprouverPretRequest): Observable<Pret> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<Pret>(`${this.BASE_URL}prets/${id}/approuver/`, body).pipe(
      tap((pret) => {
        this.pretSelectionne.set(pret);
        this._mettreAJourListe(pret);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors de l\'approbation.');
        return throwError(() => err);
      })
    );
  }

  // ─── DÉCAISSEMENT ─────────────────────────────────────────
  decaisserPret(id: number, body: DecaisserPretRequest): Observable<Pret> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<Pret>(`${this.BASE_URL}prets/${id}/decaisser/`, body).pipe(
      tap((pret) => {
        this.pretSelectionne.set(pret);
        this._mettreAJourListe(pret);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du décaissement.');
        return throwError(() => err);
      })
    );
  }

  // ─── REMBOURSEMENT ────────────────────────────────────────
  rembourserPret(id: number, body: RembourserPretRequest): Observable<Pret> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<Pret>(`${this.BASE_URL}prets/${id}/rembourser/`, body).pipe(
      tap((pret) => {
        this.pretSelectionne.set(pret);
        this._mettreAJourListe(pret);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du remboursement.');
        return throwError(() => err);
      })
    );
  }

  // ─── RÈGLES ───────────────────────────────────────────────
  chargerRegle(): Observable<ReglePret> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<ReglePret>(`${this.BASE_URL}prets/regles/`).pipe(
      tap((regle) => {
        this.regle.set(regle);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        // 404 = pas encore de règle configurée
        if (err.status === 404) {
          this.regle.set(null);
        } else {
          this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du chargement des règles.');
        }
        return throwError(() => err);
      })
    );
  }

  creerRegle(body: Omit<ReglePret, 'id' | 'gie'>): Observable<ReglePret> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<ReglePret>(`${this.BASE_URL}prets/regles/`, body).pipe(
      tap((regle) => {
        this.regle.set(regle);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors de la création des règles.');
        return throwError(() => err);
      })
    );
  }

  modifierRegle(body: Partial<Omit<ReglePret, 'id' | 'gie'>>): Observable<ReglePret> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.patch<ReglePret>(`${this.BASE_URL}prets/regles/`, body).pipe(
      tap((regle) => {
        this.regle.set(regle);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors de la modification des règles.');
        return throwError(() => err);
      })
    );
  }

  // ─── HELPERS ──────────────────────────────────────────────
  private _mettreAJourListe(pretMisAJour: Pret): void {
    const liste = this.prets().map(p => p.id === pretMisAJour.id ? pretMisAJour : p);
    this.prets.set(liste);
  }

  /**
   * Extrait tous les messages d'erreur d'une réponse Django REST Framework.
   * Django peut renvoyer : { detail }, { non_field_errors }, { montant: [] }, etc.
   */
  private _extraireErreurs(err: any): string {
    const data = err?.error;
    if (!data) return 'Une erreur est survenue.';

    // Cas simple : { detail: "..." }
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;

    // Collecte tous les messages de toutes les clés
    const messages: string[] = [];
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val)) {
        val.forEach((msg: any) => messages.push(String(msg)));
      } else if (typeof val === 'string') {
        messages.push(val);
      }
    }

    return messages.length > 0 ? messages.join(' — ') : 'Erreur lors de la demande de prêt.';
  }
}
