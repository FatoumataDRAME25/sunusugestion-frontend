import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActiviteService } from '../../../../../../core/services/activite.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { StatutActivite, TypeActivite, TYPES_ACTIVITE } from '../../../../../../core/models/activite.model';

@Component({
  selector: 'app-liste-activites',
  templateUrl: './liste-activites.html',
  imports: [RouterLink, DatePipe, FormsModule, Navbar, BottomNav],
})
export class ListeActivites implements OnInit {

  protected service = inject(ActiviteService);

  termeRecherche = signal('');
  filtreStatut = signal<StatutActivite | null>(null);

  readonly filtres: { label: string; value: StatutActivite | null }[] = [
    { label: 'Toutes',    value: null },
    { label: 'Planifiées', value: 'planifiee' },
    { label: 'En cours',  value: 'en_cours' },
    { label: 'Terminées', value: 'terminee' },
    { label: 'Annulées',  value: 'annulee' },
  ];

  activitesFiltrees = computed(() => {
    const terme  = this.termeRecherche().toLowerCase();
    const statut = this.filtreStatut();
    return this.service.activites().filter(a => {
      const correspondTitre  = !terme  || a.titre.toLowerCase().includes(terme);
      const correspondStatut = !statut || a.statut === statut;
      return correspondTitre && correspondStatut;
    });
  });

  labelType(type: TypeActivite): string {
    return TYPES_ACTIVITE.find(t => t.value === type)?.label ?? type;
  }

  badgeStatut(statut: StatutActivite): string {
    const map: Record<StatutActivite, string> = {
      planifiee: 'bg-bleu-clair text-bleu-nuit',
      en_cours:  'bg-vert-clair text-vert-foret',
      terminee:  'bg-anthracite/10 text-anthracite/60',
      annulee:   'bg-rouge-clair text-rouge-alerte',
    };
    return map[statut];
  }

  labelStatut(statut: StatutActivite): string {
    const map: Record<StatutActivite, string> = {
      planifiee: 'Planifiée',
      en_cours:  '● En cours',
      terminee:  'Terminée',
      annulee:   'Annulée',
    };
    return map[statut];
  }

  bordureGauche(statut: StatutActivite): string {
    const map: Record<StatutActivite, string> = {
      planifiee: 'border-l-4 border-bleu-nuit',
      en_cours:  'border-l-4 border-vert-foret',
      terminee:  'border-l-4 border-anthracite/30',
      annulee:   'border-l-4 border-rouge-alerte',
    };
    return map[statut];
  }

  ngOnInit(): void {
    this.service.getActivites().subscribe();
  }
}
