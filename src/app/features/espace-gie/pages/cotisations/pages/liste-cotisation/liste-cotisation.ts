import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { CotisationService } from '../../../../../../core/services/cotisation.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Cotisation } from '../../../../../../core/models/cotisation.model';
import { DialogModule } from 'primeng/dialog';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';

@Component({
  selector: 'app-liste-cotisations',
  styleUrl: './liste-cotisation.css',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    InitialesPipe,
    BottomNav,
    DialogModule,
    DecimalPipe,
    InputTextModule,
    Navbar,
    GieSidebar
  ],
  templateUrl: './liste-cotisation.html'
})
export class ListeCotisations implements OnInit {

  protected service = inject(CotisationService);
  protected authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // true si l'utilisateur connecté est trésorier
  estTresorier = computed(() => this.authService.currentUser()?.role === 'tresorier');

  // Modal desktop Nouvelle session
  modalSessionVisible = signal(false);
  erreurDatesModal = signal<string | null>(null);

  formSession: FormGroup = this.fb.group({
    libelle:   ['', Validators.required],
    montant:   [null, [Validators.required, Validators.min(1)]],
    dateDebut: ['', Validators.required],
    dateFin:   ['', Validators.required]
  });

  ouvrirModalSession(): void {
    this.formSession.reset();
    this.erreurDatesModal.set(null);
    this.modalSessionVisible.set(true);
  }

  fermerModalSession(): void {
    this.modalSessionVisible.set(false);
    this.erreurDatesModal.set(null);
  }

  lancerSessionModal(): void {
    if (this.formSession.invalid) {
      this.formSession.markAllAsTouched();
      return;
    }
    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);
    const dateDebut = new Date(this.formSession.value.dateDebut);
    const dateFin = new Date(this.formSession.value.dateFin);
    if (dateDebut < aujourd_hui) { this.erreurDatesModal.set("La date de début ne peut pas être dans le passé."); return; }
    if (dateFin < aujourd_hui) { this.erreurDatesModal.set("La date de fin ne peut pas être dans le passé."); return; }
    if (dateFin < dateDebut) { this.erreurDatesModal.set("La date de fin ne peut pas être antérieure à la date de début."); return; }
    this.erreurDatesModal.set(null);
    this.service.creerSession(this.formSession.value).subscribe({
      next: () => {
        this.fermerModalSession();
        this.ngOnInit();
      },
      error: (e) => console.error(e)
    });
  }

  // true si une cotisation appartient à l'utilisateur connecté OU si c'est le trésorier
  peutPayer(cotisation: Cotisation): boolean {
    const userId = this.authService.currentUser()?.id;
    return cotisation.membre.id === userId || this.estTresorier();
  }

  // true si le membre paye pour sa propre cotisation (Wave et Orange Money disponibles)
  payePourSoiModal = computed(() => {
    const cotisation = this.cotisationAPayer();
    const userId = this.authService.currentUser()?.id;
    return cotisation?.membre?.id === userId;
  });

  filtreStatut = signal<string | null>(null);
  termeRecherche = signal('');

  // Cotisation sélectionnée pour le détail
  cotisationSelectionnee = signal<Cotisation | null>(null);
  voirDetail = signal(false);

  // Cotisation sélectionnée pour le paiement
  cotisationAPayer = signal<Cotisation | null>(null);
  voirConfirmation = signal(false);

  optionsFiltres = [
    { label: 'Tous', value: null },
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
    // Sur desktop : ouvrir modal. Sur mobile : naviguer vers la page
    if (window.innerWidth >= 768) {
      this.cotisationAPayer.set(cotisation);
      // Pré-sélectionner le bon mode selon qui paie
      const userId = this.authService.currentUser()?.id;
      const payePourSoi = cotisation.membre.id === userId;
      this.modePaiementSelectionne.set(payePourSoi ? 'wave' : 'especes');
      this.modalPaiementVisible.set(true);
    } else {
      this.router.navigate(['/mon-espace/cotisations/payer', cotisation.id]);
    }
  }

  // Modal paiement desktop
  modalPaiementVisible = signal(false);
  modePaiementSelectionne = signal<'especes' | 'wave' | 'orange_money'>('especes');

  confirmerPaiementModal(): void {
    const cotisation = this.cotisationAPayer();
    if (!cotisation) return;
    this.service.payerCotisation(cotisation.id, this.modePaiementSelectionne()).subscribe({
      next: () => {
        this.modalPaiementVisible.set(false);
        this.cotisationAPayer.set(null);
        this.ngOnInit();
      },
      error: (err) => console.error('Erreur paiement:', err)
    });
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
