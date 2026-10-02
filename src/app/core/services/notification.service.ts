import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BadgeModule {
  count: number;
  dernierObjetId: number | null;
}

export interface BadgesNotifications {
  activites: BadgeModule;
  cotisations: BadgeModule;
  prets: BadgeModule;
  membres: BadgeModule;
  general: BadgeModule;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  // Signal local pour stocker les badges — consultable depuis n'importe quel composant
  badges = signal<BadgesNotifications>({
    activites:   { count: 0, dernierObjetId: null },
    cotisations: { count: 0, dernierObjetId: null },
    prets:       { count: 0, dernierObjetId: null },
    membres:     { count: 0, dernierObjetId: null },
    general:     { count: 0, dernierObjetId: null },
  });

  /**
   * Récupère les compteurs de badges non lus depuis le backend.
   * GET /api/notifications/badges/
   */
  getBadges(): Observable<BadgesNotifications> {
    return this.http
      .get<BadgesNotifications>(`${this.BASE_URL}notifications/badges/`)
      .pipe(
        tap((data) => this.badges.set(data))
      );
  }

  /**
   * Marque toutes les notifications d'un module comme lues.
   * PATCH /api/notifications/badges/<module>/lire/
   */
  marquerModuleCommeLu(module: string): Observable<any> {
    return this.http
      .patch(`${this.BASE_URL}notifications/badges/${module}/lire/`, {})
      .pipe(
        tap(() => {
          this.badges.update((current) => ({
            ...current,
            [module]: { count: 0, dernierObjetId: null }
          }));
        })
      );
  }
}
