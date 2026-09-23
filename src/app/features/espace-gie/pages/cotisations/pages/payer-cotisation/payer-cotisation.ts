import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CotisationService } from '../../../../../../core/services/cotisation.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { Cotisation } from '../../../../../../core/models/cotisation.model';
import { DialogModule } from 'primeng/dialog';

type ModePaiementCotisation = 'especes' | 'wave' | 'orange_money';

@Component({
  selector: 'app-payer-cotisation',
  templateUrl: './payer-cotisation.html',
  imports: [DecimalPipe, InitialesPipe, Navbar, BottomNav, DialogModule],
})
export class PayerCotisation implements OnInit {

  protected service = inject(CotisationService);
  protected authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cotisation = signal<Cotisation | null>(null);
  modePaiement = signal<ModePaiementCotisation>('especes');
  voirConfirmation = signal(false);
  erreurPaiement = signal<string | null>(null);

  // true si l'utilisateur connecté paie pour lui-même
  payePourSoi = computed(() => {
    const userId = this.authService.currentUser()?.id;
    return this.cotisation()?.membre?.id === userId;
  });

  // Modes disponibles selon contexte
  modesDisponibles = computed<ModePaiementCotisation[]>(() => {
    return this.payePourSoi() ? ['wave', 'orange_money'] : ['especes'];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    // Chercher la cotisation dans le signal existant du service
    const found = this.service.cotisations().find(c => c.id === id) ?? null;
    this.cotisation.set(found);
    // Pré-sélectionner le premier mode disponible
    const modes = this.payePourSoi() ? ['wave'] : ['especes'];
    this.modePaiement.set(modes[0] as ModePaiementCotisation);
  }

  ouvrirConfirmation(): void {
    this.erreurPaiement.set(null);
    this.voirConfirmation.set(true);
  }

  confirmerPaiement(): void {
    const c = this.cotisation();
    if (!c) return;

    this.service.payerCotisation(c.id, this.modePaiement()).subscribe({
      next: () => {
        this.voirConfirmation.set(false);
        this.router.navigate(['/mon-espace/cotisations']);
      },
      error: (err) => {
        this.voirConfirmation.set(false);
        const msg = err?.error?.modePaiement?.[0]
          ?? err?.error?.detail
          ?? 'Erreur lors du paiement.';
        this.erreurPaiement.set(msg);
      }
    });
  }

  retour(): void {
    this.router.navigate(['/mon-espace/cotisations']);
  }
}
