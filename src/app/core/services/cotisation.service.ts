import { Injectable, inject, signal } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, forkJoin, map, of, tap } from 'rxjs';

import {
  Cotisation,
  CreerSessionRequest,
  SessionCotisation
} from '../models/cotisation.model';

import { environment } from '../../../environments/environment';

/** Date du jour au format AAAA-MM-JJ (fuseau local), comparable aux dates de l'API. */
function dateDuJour(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


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

  // Cotisations d'une session, sans remplacer la liste partagée (cotisations)

  listerCotisations(sessionId: number): Observable<Cotisation[]> {
    return this.http.get<Cotisation[]>(
      `${this.BASE_URL}cotisations/sessions/${sessionId}/cotisations/`
    );
  }

  // Cotisations en retard de toutes les sessions terminées (tableau de bord et
  // filtre « En retard »). Même règle que le backend : « en retard », ou encore
  // « en cours » alors que la session est terminée (avant la tâche de nuit).
  // Les cotisations d'une session en cours ne sont jamais en retard.

  cotisationsEnRetard = signal<Cotisation[]>([]);

  chargerRetards(sessions: SessionCotisation[]): Observable<Cotisation[]> {
    const aujourdHui = dateDuJour();
    const sessionsEchues = sessions.filter(s => s.dateFin < aujourdHui && s.nombreEnAttente > 0);
    if (!sessionsEchues.length) {
      this.cotisationsEnRetard.set([]);
      return of([]);
    }
    return forkJoin(sessionsEchues.map(s => this.listerCotisations(s.id))).pipe(
      map(listes => listes.flat().filter(c =>
        c.statut === 'en_retard' || (c.statut === 'en_cours' && c.session.dateFin < aujourdHui)
      )),
      tap(retards => this.cotisationsEnRetard.set(retards))
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
