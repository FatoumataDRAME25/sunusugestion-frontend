import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AbonnementService, LIBELLES_ETATS } from '../../../../../core/services/abonnement.service';
import { AuthService } from '../../../../../core/services/auth.service';

/**
 * Carte « Abonnement » de la page Configuration.
 * Visible du président et du trésorier, qui peuvent payer par PayDunya.
 */
@Component({
  selector: 'app-carte-abonnement',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './carte-abonnement.html',
})
export class CarteAbonnement implements OnInit {

  protected service = inject(AbonnementService);
  private authService = inject(AuthService);

  readonly libellesEtats = LIBELLES_ETATS;
  readonly libellesModes: Record<string, string> = {
    wave: 'Wave',
    orange_money: 'Orange Money',
    manuel: 'Enregistré par SunuGestion',
  };

  estGestionnaire = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'president' || role === 'tresorier';
  });

  paiementEnCours = signal<'wave' | 'orange_money' | null>(null);
  erreur = signal<string | null>(null);

  ngOnInit(): void {
    this.service.rafraichir();
  }

  classeEtat(etat: string): string {
    return {
      essai: 'bg-[#1E3A5F]/10 text-[#1E3A5F]',
      actif: 'bg-[#2E7D5B]/10 text-[#2E7D5B]',
      grace: 'bg-[#E8A020]/15 text-[#B7791F]',
      lecture_seule: 'bg-[#C1654A]/10 text-[#C1654A]',
    }[etat] ?? 'bg-[#1E3A5F]/10 text-[#1E3A5F]';
  }

  payer(mode: 'wave' | 'orange_money'): void {
    this.paiementEnCours.set(mode);
    this.erreur.set(null);

    this.service.payer(mode).subscribe({
      next: (reponse) => {
        // Redirection vers PayDunya ; le retour se fait sur /paiement/retour
        window.location.href = reponse.urlPaiement;
      },
      error: (err) => {
        this.erreur.set(
          err?.error?.detail
            ?? err?.error?.modePaiement?.[0]
            ?? 'Le paiement n\'a pas pu être lancé. Réessayez.'
        );
        this.paiementEnCours.set(null);
      }
    });
  }
}
