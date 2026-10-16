import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Abonnement, InstanceAdmin, InstanceAdminDetail } from '../models/abonnement.model';

export const LIBELLES_ETATS: Record<string, string> = {
  essai: 'Essai gratuit',
  actif: 'Actif',
  grace: 'Délai de grâce',
  lecture_seule: 'Lecture seule',
};

@Injectable({ providedIn: 'root' })
export class AbonnementService {

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  // Abonnement du groupement de l'utilisateur connecté
  abonnement = signal<Abonnement | null>(null);
  private chargementEnCours = false;

  /**
   * Recharge l'abonnement du groupement (bandeau d'alerte, page Configuration).
   * GET /api/abonnements/mon-abonnement/
   */
  rafraichir(): void {
    if (!localStorage.getItem('sunugestion_access') || this.chargementEnCours) {
      return;
    }
    this.chargementEnCours = true;

    this.http.get<Abonnement>(`${this.BASE_URL}abonnements/mon-abonnement/`).subscribe({
      next: (abonnement) => {
        this.abonnement.set(abonnement);
        this.chargementEnCours = false;
      },
      // Administrateur ou erreur réseau : pas de bandeau
      error: () => {
        this.abonnement.set(null);
        this.chargementEnCours = false;
      }
    });
  }

  /** Crée la facture PayDunya et renvoie l'adresse de paiement. */
  payer(modePaiement: 'wave' | 'orange_money'): Observable<{ paiementId: number; montant: number; urlPaiement: string }> {
    return this.http.post<{ paiementId: number; montant: number; urlPaiement: string }>(
      `${this.BASE_URL}abonnements/payer/`, { modePaiement }
    );
  }

  /** Statut d'un paiement (page de retour PayDunya). */
  // ─── Administration ───────────────────────────────────────

  getInstances(): Observable<InstanceAdmin[]> {
    return this.http.get<InstanceAdmin[]>(`${this.BASE_URL}abonnements/admin/instances/`);
  }

  getInstance(id: number): Observable<InstanceAdminDetail> {
    return this.http.get<InstanceAdminDetail>(`${this.BASE_URL}abonnements/admin/instances/${id}/`);
  }

  enregistrerPaiementManuel(id: number, note: string): Observable<unknown> {
    return this.http.post(`${this.BASE_URL}abonnements/admin/instances/${id}/paiement-manuel/`, { note });
  }

  // ─── Affichage ────────────────────────────────────────────

  /** Bandeau à afficher, ou null. Les fins de période proches ne sont signalées qu'au bureau. */
  messageBandeau(abonnement: Abonnement | null, estGestionnaire: boolean): { texte: string; grave: boolean } | null {
    if (!abonnement) return null;

    if (abonnement.etat === 'lecture_seule') {
      return {
        texte: estGestionnaire
          ? "Abonnement expiré : le groupement est en lecture seule. Renouvelez-le depuis Configuration."
          : "L'abonnement du groupement a expiré : consultation uniquement jusqu'au renouvellement par le président ou le trésorier.",
        grave: true,
      };
    }

    if (abonnement.etat === 'grace') {
      const jours = abonnement.delaiGraceJours + abonnement.joursRestants;
      return {
        texte: estGestionnaire
          ? `Abonnement expiré : il vous reste ${Math.max(jours, 0) + 1} jour(s) pour le renouveler avant la lecture seule.`
          : "L'abonnement du groupement a expiré et doit être renouvelé dans les prochains jours.",
        grave: true,
      };
    }

    if (estGestionnaire && abonnement.joursRestants <= 7) {
      const nature = abonnement.statut === 'essai' ? 'Votre essai gratuit' : 'Votre abonnement';
      const quand = abonnement.joursRestants === 0
        ? "aujourd'hui"
        : `dans ${abonnement.joursRestants} jour(s)`;
      return { texte: `${nature} se termine ${quand}. Pensez à le renouveler depuis Configuration.`, grave: false };
    }

    return null;
  }
}
