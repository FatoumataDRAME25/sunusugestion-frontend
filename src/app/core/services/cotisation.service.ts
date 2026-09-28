import { Injectable, inject, signal } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, tap } from 'rxjs';

import {
  Cotisation,
  CreerSessionRequest,
  SessionCotisation
} from '../models/cotisation.model';

import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CotisationService {

  isLoading = signal(false);

  private http = inject(HttpClient);

  cotisations = signal<Cotisation[]>([]);

  sessions = signal<SessionCotisation[]>([]);

  sessionActive = signal<SessionCotisation | null>(null);

  private readonly BASE_URL = environment.API_URL;


  // Créer une session

  creerSession(
    donnees: CreerSessionRequest
  ): Observable<SessionCotisation> {

    this.isLoading.set(true);

    return this.http.post<SessionCotisation>(
      `${this.BASE_URL}cotisations/sessions/`,
      donnees
    ).pipe(

      tap((session) => {

        this.sessionActive.set(session);

        this.isLoading.set(false);

      })

    );
  }


  // Cotisations d'une session

  getCotisations(
    sessionId: number
  ): Observable<Cotisation[]> {

    return this.http.get<Cotisation[]>(
      `${this.BASE_URL}cotisations/sessions/${sessionId}/cotisations/`
    ).pipe(

      tap((data) => {

        this.cotisations.set(data);

      })

    );
  }


  // Payer une cotisation
  // Retourne any car le backend peut retourner soit une Cotisation (especes)
  // soit une réponse PayDunya { statut, token, urlPaiement } (wave/orange_money)
  payerCotisation(
    cotisationId: number,
    modePaiement: 'especes' | 'wave' | 'orange_money'
  ): Observable<any> {

    return this.http.post<any>(
      `${this.BASE_URL}cotisations/${cotisationId}/payer/`,
      { modePaiement }
    );
  }


  // Charger toutes les sessions

  getSessions(): Observable<SessionCotisation[]> {

    return this.http.get<SessionCotisation[]>(
      `${this.BASE_URL}cotisations/sessions/`
    ).pipe(

      tap((data) => {

        this.sessions.set(data);

        const active = data.find(
          s => s.statut === 'ouverte'
        ) ?? null;

        this.sessionActive.set(active);

      })

    );
  }

}
