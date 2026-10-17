import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { StatsGie } from '../models/espace-gie.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { InfosGie, ModifierGieRequest } from '../models/gie.model';
import { ReponseMembres } from '../models/membre.model';

@Injectable({ providedIn: 'root' })
export class EspaceGieService {

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  isLoading = signal(false);
  isSaving = signal(false);
  isSavingLogo = signal(false);
  errorMessage = signal<string | null>(null);

  infosGie = signal<InfosGie | null>(null);


  stats = signal<StatsGie>({
    nombreMembres: 0,
    cotisationsMois: 0,
    montantEnAttente: 0,
    pretsEnCours: 0,
    demandesApprobationPrets: 0
  });


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
    return this.envoyerModification(donnees, this.isSaving);
  }

  // Fichier envoyé en multipart : le serveur le vérifie et le réencode
  modifierLogo(fichier: File): Observable<InfosGie> {
    const formData = new FormData();
    formData.append('logo', fichier);
    return this.envoyerModification(formData, this.isSavingLogo);
  }

  retirerLogo(): Observable<InfosGie> {
    return this.envoyerModification({ logo: null }, this.isSavingLogo);
  }

  private envoyerModification(corps: ModifierGieRequest | FormData, enCours: WritableSignal<boolean>): Observable<InfosGie> {
    enCours.set(true);
    this.errorMessage.set(null);

    return this.http.patch<InfosGie>(`${this.BASE_URL}gie/infos/`, corps).pipe(
      tap((reponse) => {
        this.infosGie.set(reponse);
        enCours.set(false);
      }),
      catchError((err) => {
        enCours.set(false);
        // Message du champ refusé (nom, téléphone…) si Django en renvoie un
        const corps = typeof err?.error === 'object' && err.error ? err.error : {};
        const erreurChamp = Object.values(corps).flat().find(m => typeof m === 'string');
        this.errorMessage.set(err?.error?.detail ?? erreurChamp ?? 'Erreur lors de la sauvegarde');
        return throwError(() => err);
      })
    );
  }

}
