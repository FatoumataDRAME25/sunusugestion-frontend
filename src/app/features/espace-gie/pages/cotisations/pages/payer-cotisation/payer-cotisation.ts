import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CotisationService } from '../../../../../../core/services/cotisation.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { Cotisation } from '../../../../../../core/models/cotisation.model';
import { DialogModule } from 'primeng/dialog';

type ModePaiementCotisation = 'especes' | 'wave' | 'orange_money';

@Component({
  selector: 'app-payer-cotisation',
  templateUrl: './payer-cotisation.html',
  imports: [DecimalPipe, InitialesPipe, Navbar, BottomNav, GieSidebar, DialogModule],
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

  estTresorier = computed(() => this.authService.currentUser()?.role === 'tresorier');

  // Modes disponibles : le trésorier enregistre toujours en espèces (sa propre
  // cotisation comme celle d'un membre) ; un membre qui paie pour lui-même
  // passe par Wave ou Orange Money
  modesDisponibles = computed<ModePaiementCotisation[]>(() => {
    if (this.estTresorier() || !this.payePourSoi()) {
      return ['especes'];
    }
    return ['wave', 'orange_money'];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    // Chercher la cotisation dans les listes déjà chargées : session affichée,
    // ou retards des sessions terminées (filtre « En retard »)
    const found = this.service.cotisations().find(c => c.id === id)
      ?? this.service.cotisationsEnRetard().find(c => c.id === id)
      ?? null;
    this.cotisation.set(found);
    // Pré-sélectionner le premier mode disponible
    this.modePaiement.set(this.modesDisponibles()[0]);
  }

  ouvrirConfirmation(): void {
    this.erreurPaiement.set(null);
    this.voirConfirmation.set(true);
  }

  confirmerPaiement(): void {
    const c = this.cotisation();
    if (!c) return;

    this.service.payerCotisation(c.id, this.modePaiement()).subscribe({
      next: (reponse) => {
        this.voirConfirmation.set(false);

        // Si le backend retourne une urlPaiement (wave/orange_money via PayDunya)
        if (reponse?.urlPaiement) {
          // Redirection vers PayDunya — NE PAS naviguer dans Angular
          window.location.href = reponse.urlPaiement;
          return;
        }

        // Espèces : paiement direct confirmé → retour liste
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
