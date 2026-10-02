import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { EspaceGieService } from '../../../../core/services/espace-gie.service';
import { CotisationService } from '../../../../core/services/cotisation.service';
import { PretService } from '../../../../core/services/pret.service';
import { HistoriqueOperationService } from '../../../../core/services/historique-operation.service';
import { InitialesPipe } from '../../../../shared/pipes/initiales-pipe';
import { BottomNav } from '../../../../shared/ui/bottom-nav/bottom-nav';
import { Navbar } from '../../../../shared/ui/navbar/navbar';
import { Cotisation } from '../../../../core/models/cotisation.model';
import { Pret } from '../../../../core/models/pret.model';
import { Solde } from '../../../../core/models/solde.model';

@Component({
  selector: 'app-accueil-espace',
  imports: [RouterLink, TagModule, InitialesPipe, DecimalPipe, BottomNav, Navbar],
  templateUrl: './accueil-espace.html'
})
export class AccueilEspace implements OnInit {

  protected service        = inject(EspaceGieService);
  protected authService    = inject(AuthService);
  private cotisationService = inject(CotisationService);
  private pretService       = inject(PretService);
  private historiqueService = inject(HistoriqueOperationService);

  dropdownVisible = signal(false);

  // Solde de la caisse
  solde = signal<Solde | null>(null);

  // Cotisations non payées du membre connecté
  cotisationsEnCours = signal<Cotisation[]>([]);

  // Prêts en cours du membre connecté
  pretsEnCours = signal<Pret[]>([]);

  // Vrai si le président est connecté
  estPresident = computed(() => this.authService.currentUser()?.role === 'president');

  // Vrai si le trésorier est connecté
  estTresorier = computed(() => this.authService.currentUser()?.role === 'tresorier');

  // Nombre de demandes en attente (pour le badge président)
  demandesEnAttente = computed(() =>
    this.pretService.prets().filter(p => p.statut === 'en_attente').length
  );

  // Nombre de prêts approuvés à décaisser (pour le trésorier)
  pretsApprouves = computed(() =>
    this.pretService.prets().filter(p => p.statut === 'approuve').length
  );

  toggleDropdown(): void {
    this.dropdownVisible.update(v => !v);
  }

  fermerDropdown(): void {
    this.dropdownVisible.set(false);
  }

  ngOnInit(): void {
    // Stats membres (existant — inchangé)
    this.service.chargerStats().subscribe();

    // Solde de la caisse
    this.historiqueService.getSolde().subscribe({
      next: (s) => this.solde.set(s),
      error: () => {}   // silencieux si l'endpoint échoue
    });

    // Prêts du GIE — on filtre côté frontend pour le membre connecté
    this.pretService.chargerPrets().subscribe({
      next: (liste) => {
        const userId = this.authService.currentUser()?.id;
        this.pretsEnCours.set(
          liste.filter(p => p.membre.id === userId && p.statut === 'en_cours')
        );
      },
      error: () => {}
    });

    // Cotisations : on charge les sessions puis toutes les cotisations ouvertes
    this.cotisationService.getSessions().subscribe({
      next: (sessions) => {
        const sessionOuverte = sessions.find(s => s.statut === 'ouverte') ?? null;
        if (!sessionOuverte) return;

        this.cotisationService.getCotisations(sessionOuverte.id).subscribe({
          next: (cotisations) => {
            const userId = this.authService.currentUser()?.id;
            this.cotisationsEnCours.set(
              cotisations.filter(c => c.membre.id === userId && c.statut !== 'paye')
            );
          },
          error: () => {}
        });
      },
      error: () => {}
    });
  }
}
