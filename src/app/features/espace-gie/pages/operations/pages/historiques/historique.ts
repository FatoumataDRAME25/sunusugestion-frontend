import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { HistoriqueOperationService } from '../../../../../../core/services/historique-operation.service';
import { HistoriqueOperation } from '../../../../../../core/models/historique-operation.model';
import { Solde } from '../../../../../../core/models/solde.model';
import { Dialog } from 'primeng/dialog';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-operations',
  imports: [Dialog, FormsModule, DecimalPipe, DatePipe, BottomNav,RouterLink],
  templateUrl: './historique.html',
  styleUrl: './historique.css'
})
export class Historique implements OnInit {
  private historiqueService = inject(HistoriqueOperationService);

  solde = signal<Solde | null>(null);
  operations = signal<HistoriqueOperation[]>([]);
  isLoading = signal(false);
  voirCaisse = signal(false);

  // Filtre actif : 'toutes' | 'entree' | 'sortie'
  filtreType = signal<'toutes' | 'entree' | 'sortie'>('toutes');

  // Terme de recherche
  termeRecherche = signal('');

  // Opérations filtrées
  operationsFiltrees = computed(() => {
    const type = this.filtreType();
    const terme = this.termeRecherche().toLowerCase();

    return this.operations().filter(op => {
      const correspondType = type === 'toutes' || op.typeOperation === type;
      const correspondTerme = !terme || op.libelle.toLowerCase().includes(terme);
      return correspondType && correspondTerme;
    });
  });

  // Grouper les opérations par date
  operationsGroupees = computed(() => {
    const groupes = new Map<string, HistoriqueOperation[]>();

    for (const op of this.operationsFiltrees()) {
      const date = op.dateOperation.split('T')[0]; // 'YYYY-MM-DD'
      if (!groupes.has(date)) groupes.set(date, []);
      groupes.get(date)!.push(op);
    }

    return Array.from(groupes.entries()).map(([date, ops]) => ({ date, ops }));
  });

  ngOnInit(): void {
    this.chargerSolde();
    this.chargerOperations();
  }

  chargerSolde(): void {
    this.historiqueService.getSolde().subscribe({
      next: (response) => this.solde.set(response),
      error: (err) => console.error('Erreur solde :', err)
    });
  }

  chargerOperations(): void {
    this.isLoading.set(true);
    this.historiqueService.getOperations().subscribe({
      next: (response) => {
        this.operations.set(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur opérations :', err);
        this.isLoading.set(false);
      }
    });
  }

  ouvrirCaisse(): void { this.voirCaisse.set(true); }
  fermerCaisse(): void { this.voirCaisse.set(false); }

  // Formate la date pour l'affichage du groupe
  labelDate(dateStr: string): string {
    const aujourd_hui = new Date().toISOString().split('T')[0];
    const hier = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === aujourd_hui) return "Aujourd'hui";
    if (dateStr === hier) return 'Hier';

    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
