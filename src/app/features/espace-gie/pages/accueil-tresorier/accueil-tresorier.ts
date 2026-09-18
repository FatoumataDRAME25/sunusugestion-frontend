import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { EspaceGieService } from '../../../../core/services/espace-gie.service';
import { CotisationService } from '../../../../core/services/cotisation.service';
import { HistoriqueOperationService } from '../../../../core/services/historique-operation.service';
import { Solde } from '../../../../core/models/solde.model';
import { HistoriqueOperation } from '../../../../core/models/historique-operation.model';
import { InitialesPipe } from '../../../../shared/pipes/initiales-pipe';
import { BottomNav } from '../../../../shared/ui/bottom-nav/bottom-nav';

@Component({
  selector: 'app-accueil-tresorier',
  imports: [RouterLink, DecimalPipe, InitialesPipe, BottomNav],
  templateUrl: './accueil-tresorier.html'
})
export class AccueilTresorier implements OnInit {
  protected authService = inject(AuthService);
  protected espaceService = inject(EspaceGieService);
  protected cotisationService = inject(CotisationService);
  private historiqueService = inject(HistoriqueOperationService);

  solde = signal<Solde | null>(null);
  activitesRecentes = signal<HistoriqueOperation[]>([]);
  dropdownVisible = signal(false);

  ngOnInit(): void {
    this.historiqueService.getSolde().subscribe({
      next: (s) => this.solde.set(s)
    });
    this.historiqueService.getOperations().subscribe({
      next: (ops) => this.activitesRecentes.set(ops.slice(0, 5)) // 5 dernières
    });
    this.cotisationService.getSessions().subscribe();
    this.espaceService.chargerStats().subscribe();
  }

  toggleDropdown(): void {
    this.dropdownVisible.update(v => !v);
  }

  fermerDropdown(): void {
    this.dropdownVisible.set(false);
  }
}
