import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { StatsGie, ActiviteRecente } from '../models/espace-gie.model';

import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { ACTIVITES_RECENTES_MOCK, STATS_MOCK } from '../data/espace-gie.mock';
import { InfosGie, ModifierGieRequest } from '../models/gie.model';
import { ReponseMembres } from '../models/membre.model';

@Injectable({ providedIn: 'root' })
export class EspaceGieService {
  private authService = inject(AuthService);

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  infosGie = signal<InfosGie | null>(null);

  // Pas encore d'endpoint pour récupérer le GIE de l'utilisateur connecté —
  // en dur pour l'instant, à remplacer par un vrai appel HTTP plus tard.
  nomGie = signal('GIE And Defar');

   stats = signal<StatsGie>({
    nombreMembres: 0,
    cotisationsMois: 0,       // mock — endpoint pas encore disponible
    montantEnAttente: 0,      // mock
    pretsEnCours: 0,          // mock
    demandesApprobationPrets: 0 // mock
  });

  activitesRecentes = signal<ActiviteRecente[]>(ACTIVITES_RECENTES_MOCK);

  prenomUtilisateur(): string {
    return this.authService.currentUser()?.prenom ?? '';
  }

  // Charge le nombre de membres réel depuis l'API
  chargerStats(): Observable<ReponseMembres> {
    return this.http.get<ReponseMembres>(`${this.BASE_URL}membres/membres/`).pipe(
      tap((reponse) => {
        this.stats.update(stats => ({
          ...stats,
          nombreMembres: reponse.total  // seul champ dynamique pour l'instant
        }));
        
      }),
      catchError((err) => throwError(() => err))
    );
  }


  chargerInfos(): Observable<InfosGie> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<InfosGie>(`${this.BASE_URL}gie/infos/`).pipe(
      tap((reponse) => {
        this.infosGie.set(reponse);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du chargement');
        return throwError(() => err);
      })
    );
  }

  modifierInfos(donnees: ModifierGieRequest): Observable<InfosGie> {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    return this.http.patch<InfosGie>(`${this.BASE_URL}gie/infos/`, donnees).pipe(
      tap((reponse) => {
        this.infosGie.set(reponse);
        this.isSaving.set(false);
      }),
      catchError((err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors de la sauvegarde');
        return throwError(() => err);
      })
    );
  }

}
