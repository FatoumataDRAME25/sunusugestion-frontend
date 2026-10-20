// features/espaces-gie/pages/espaces-gie-list/espaces-gie-list.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
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
import { AbonnementService, LIBELLES_ETATS } from '../../../../core/services/abonnement.service';
import { InstanceAdmin, InstanceAdminDetail } from '../../../../core/models/abonnement.model';

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
    InitialesPipe,
    DialogModule,
    DatePipe,
    DecimalPipe
],
  templateUrl: './espaces-gie-list.html'
})
export class EspacesGieList implements OnInit{
  protected service = inject(EspacesGieService);
  private confirmationService = inject(ConfirmationService);
  protected dashboardService = inject(DashboardService);
  private abonnementService = inject(AbonnementService);

  // ── Abonnements des instances ────────────────────────────
  readonly libellesEtats = LIBELLES_ETATS;
  readonly libellesModes: Record<string, string> = {
    wave: 'Wave', orange_money: 'Orange Money', manuel: 'Manuel (admin)',
  };
  abonnements = signal<Record<number, InstanceAdmin>>({});
  erreurAbonnement = signal<string | null>(null);

  // Détail d'une instance (historique des paiements)
  instanceDetail = signal<InstanceAdminDetail | null>(null);
  detailVisible = signal(false);
  enregistrementEnCours = signal(false);

  chargerAbonnements(): void {
    this.abonnementService.getInstances().subscribe({
      next: (instances) => {
        const parId: Record<number, InstanceAdmin> = {};
        instances.forEach((i) => (parId[i.id] = i));
        this.abonnements.set(parId);
      },
      error: () => this.erreurAbonnement.set('Impossible de charger les abonnements.')
    });
  }

  classeEtat(etat?: string): string {
    return ({
      essai: 'bg-[#1E3A5F]/10 text-[#1E3A5F]',
      actif: 'bg-[#2E7D5B]/10 text-[#2E7D5B]',
      grace: 'bg-[#E8A020]/15 text-[#B7791F]',
      lecture_seule: 'bg-[#C1654A]/10 text-[#C1654A]',
    } as Record<string, string>)[etat ?? ''] ?? 'bg-[#1E3A5F]/10 text-[#1E3A5F]';
  }

  ouvrirDetail(gieId: number): void {
    this.erreurAbonnement.set(null);
    this.abonnementService.getInstance(gieId).subscribe({
      next: (detail) => {
        this.instanceDetail.set(detail);
        this.detailVisible.set(true);
      },
      error: () => this.erreurAbonnement.set("Impossible de charger l'abonnement de ce groupement.")
    });
  }

  /** Action de secours : enregistrer un paiement reçu hors PayDunya. */
  confirmerPaiementManuel(detail: InstanceAdminDetail): void {
    this.confirmationService.confirm({
      header: 'Enregistrer un paiement reçu ?',
      message: `L'abonnement de « ${detail.nom} » sera prolongé d'un mois (${detail.montantMensuel} FCFA). À utiliser uniquement pour un paiement reçu hors de l'application.`,
      icon: 'pi pi-wallet',
      type: 'info',
      acceptButtonProps: { label: 'Enregistrer', severity: 'success' },
      rejectButtonProps: { label: 'Annuler', text: true },
      accept: () => {
        this.enregistrementEnCours.set(true);
        this.abonnementService.enregistrerPaiementManuel(detail.id, 'Paiement enregistré par l\'administrateur').subscribe({
          next: () => {
            this.enregistrementEnCours.set(false);
            this.chargerAbonnements();
            this.ouvrirDetail(detail.id);
          },
          error: () => {
            this.enregistrementEnCours.set(false);
            this.erreurAbonnement.set("Le paiement n'a pas pu être enregistré.");
          }
        });
      }
    } as any);
  }

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
    // Les statistiques (actifs / inactifs) sont rechargées après le changement
    accept: () => this.service.basculerStatut(gie.id, () => this.dashboardService.chargerStatistiques())
  } as any);

}

ngOnInit(): void {
  this.service.chargerGies();
  this.chargerAbonnements();
}
}
