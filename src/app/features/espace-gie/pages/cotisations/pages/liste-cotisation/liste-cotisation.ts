import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { CotisationService } from '../../../../../../core/services/cotisation.service';
import { Cotisation } from '../../../../../../core/models/cotisation.model';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-liste-cotisations',
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    InitialesPipe,
    BottomNav,
    DialogModule,
    DecimalPipe
  ],
  templateUrl: './liste-cotisation.html'
})
export class ListeCotisations implements OnInit {

  protected service = inject(CotisationService);

  filtreStatut = signal<string | null>(null);
  termeRecherche = signal('');

  // Cotisation sélectionnée pour le détail
  cotisationSelectionnee = signal<Cotisation | null>(null);
  voirDetail = signal(false);

  // Cotisation sélectionnée pour le paiement
  cotisationAPayer = signal<Cotisation | null>(null);
  voirConfirmation = signal(false);

  optionsFiltres = [
    { label: 'Tout', value: null },
    { label: 'Payés', value: 'paye' },
    { label: 'En cours', value: 'en_cours' },
    { label: 'En retard', value: 'en_retard' }
  ];

  cotisationsFiltrees = computed(() => {

    const statut = this.filtreStatut();
    const terme = this.termeRecherche().toLowerCase();

    return this.service.cotisations().filter(c => {

      const nom =
        `${c.membre.prenom} ${c.membre.nom}`.toLowerCase();

      const correspondNom =
        !terme || nom.includes(terme);

      const correspondStatut =
        !statut || c.statut === statut;

      return correspondNom && correspondStatut;
    });
  });

  // -------------------------
  // DÉTAIL
  // -------------------------

  ouvrirDetail(cotisation: Cotisation): void {
    this.cotisationSelectionnee.set(cotisation);
    this.voirDetail.set(true);
  }

  fermerDetail(): void {
    this.voirDetail.set(false);
    this.cotisationSelectionnee.set(null);
  }

  // -------------------------
  // PAIEMENT
  // -------------------------

  ouvrirConfirmationPaiement(cotisation: Cotisation): void {
    this.cotisationAPayer.set(cotisation);
    this.voirConfirmation.set(true);
  }

  annulerPaiement(): void {
    this.voirConfirmation.set(false);
    this.cotisationAPayer.set(null);
  }

  confirmerPaiement(): void {

    const cotisation = this.cotisationAPayer();

    if (!cotisation) {
      return;
    }

    this.service.payerCotisation(
      cotisation.id,
      'especes'
    ).subscribe({

      next: () => {

        console.log('Cotisation payée avec succès');

        this.voirConfirmation.set(false);
        this.cotisationAPayer.set(null);
      },

      error: (error) => {

        console.error(
          'Erreur lors du paiement :',
          error
        );
      }

    });
  }

  ngOnInit(): void {

    // Charge la session active puis ses cotisations
    this.service.getSessions().subscribe({

      next: () => {

        const session = this.service.sessionActive();

        if (session) {
          this.service.getCotisations(session.id).subscribe();
        }

      }

    });
  }
}
