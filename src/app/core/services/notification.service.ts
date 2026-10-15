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

export interface NotificationItem {
  id: number;
  titre: string;
  message: string;
  type: string;
  module: 'activites' | 'cotisations' | 'prets' | 'membres' | 'general';
  objetId: number | null;
  dateCreation: string;
  lue: boolean;
}

export interface ReponseNotifications {
  notifications: NotificationItem[];
  nonLues: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  // ── Liste des notifications (cloche de la barre du haut) ──
  notifications = signal<NotificationItem[]>([]);
  nonLues = signal(0);
  chargement = signal(false);
  erreur = signal<string | null>(null);

  constructor() {
    // Recharge les notifications quand l'onglet redevient visible.
    // Aucune interrogation périodique : les rechargements sont déclenchés
    // par l'ouverture d'une page, le retour sur l'onglet ou la cloche.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.rafraichir();
      }
    });
  }

  /**
   * Recharge les notifications de l'utilisateur connecté.
   * GET /api/notifications/
   */
  rafraichir(): void {
    // Rien à charger si personne n'est connecté
    if (!localStorage.getItem('sunugestion_access') || this.chargement()) {
      return;
    }

    this.chargement.set(true);

    this.http
      .get<ReponseNotifications>(`${this.BASE_URL}notifications/`)
      .subscribe({
        next: (reponse) => {
          this.notifications.set(reponse.notifications);
          this.nonLues.set(reponse.nonLues);
          this.erreur.set(null);
          this.chargement.set(false);
        },
        error: () => {
          this.erreur.set('Impossible de charger les notifications.');
          this.chargement.set(false);
        }
      });
  }

  /**
   * Marque une notification comme lue.
   * PATCH /api/notifications/<id>/lire/
   */
  marquerCommeLue(notification: NotificationItem): void {
    if (notification.lue) {
      return;
    }

    // Mise à jour immédiate de l'affichage, confirmée par le serveur
    this.notifications.update((liste) =>
      liste.map((n) => (n.id === notification.id ? { ...n, lue: true } : n))
    );
    this.nonLues.update((nombre) => Math.max(0, nombre - 1));

    this.http
      .patch<{ nonLues: number }>(
        `${this.BASE_URL}notifications/${notification.id}/lire/`, {}
      )
      .subscribe({
        next: (reponse) => this.nonLues.set(reponse.nonLues),
        error: () => this.rafraichir()
      });
  }

  /**
   * Marque toutes les notifications comme lues.
   * PATCH /api/notifications/tout-lire/
   */
  toutMarquerCommeLu(): void {
    this.http
      .patch(`${this.BASE_URL}notifications/tout-lire/`, {})
      .subscribe({
        next: () => {
          this.notifications.update((liste) =>
            liste.map((n) => ({ ...n, lue: true }))
          );
          this.nonLues.set(0);
        },
        error: () => this.erreur.set('Impossible de marquer les notifications comme lues.')
      });
  }

  /** Page à ouvrir quand on clique sur une notification. */
  routeDe(notification: NotificationItem): string {
    switch (notification.module) {
      case 'activites':
        return notification.objetId
          ? `/mon-espace/activites/${notification.objetId}`
          : '/mon-espace/activites';
      case 'prets':
        return notification.objetId
          ? `/mon-espace/prets/${notification.objetId}`
          : '/mon-espace/prets';
      case 'cotisations':
        return '/mon-espace/cotisations';
      case 'membres':
        return '/mon-espace/membres';
      default:
        return '/mon-espace/dashboard-president';
    }
  }

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
