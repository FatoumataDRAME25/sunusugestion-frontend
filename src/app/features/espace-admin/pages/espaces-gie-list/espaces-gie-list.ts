// features/espaces-gie/pages/espaces-gie-list/espaces-gie-list.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';

import { EspacesGieService } from '../../../../core/services/espace-gie-admin.service';
import { InitialesPipe } from '../../../../shared/pipes/initiales-pipe';
import { GieListeItem } from '../../../../core/models/gie-liste-item.model';
import { ConfirmationService } from 'primeng/api';
import { DashboardService } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-espaces-gie-list',
  imports: [
    FormsModule,
    TableModule,
    TagModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PaginatorModule,
    InitialesPipe
],
  templateUrl: './espaces-gie-list.html'
})
export class EspacesGieList implements OnInit{
  protected service = inject(EspacesGieService);
  private confirmationService = inject(ConfirmationService);
  protected dashboardService = inject(DashboardService);

  optionsStatut = [
    { label: 'Tous les statuts', value: null },
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' }
  ];

  confirmerChangementStatut(gie: GieListeItem): void {
  const estActif = gie.statut === 'actif';

  this.confirmationService.confirm({
    header: estActif ? 'Désactiver cet espace GIE ?' : 'Activer cet espace GIE ?',
    message: estActif
      ? "Voulez-vous vraiment désactiver cet espace GIE ? La désactivation bloque temporairement l'accès à l'espace GIE mais ne supprime aucune donnée."
      : 'Cet espace GIE pourra de nouveau être accessible à ses utilisateurs. Toutes les fonctionnalités seront rétablies.',
    icon: estActif ? 'pi pi-ban' : 'pi pi-check-circle',
    type: estActif ? 'danger' : 'success',
    acceptButtonProps: {
      label: estActif ? 'Désactiver' : 'Activer',
      severity: estActif ? 'danger' : 'success'
    },
    rejectButtonProps: {
      label: 'Annuler',
      text: true
    },
    accept: () => this.service.basculerStatut(gie.id)
  } as any);

}

ngOnInit(): void {
  this.service.chargerGies();
}
}
