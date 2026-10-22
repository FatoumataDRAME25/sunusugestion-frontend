import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private route = inject(ActivatedRoute);
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

  // true si Wave et Orange Money sont proposés : un membre qui paie sa propre
  // cotisation. Le trésorier enregistre toujours en espèces, même pour lui.
  payePourSoiModal = computed(() => {
    const cotisation = this.cotisationAPayer();
    const userId = this.authService.currentUser()?.id;
    return cotisation?.membre?.id === userId && !this.estTresorier();
  });

  filtreStatut = signal<string | null>(null);
  termeRecherche = signal('');

  // Session affichée (sélecteur) : par défaut la plus récente des sessions
  // ouvertes, sinon la plus récente tout court
  sessionChoisieId = signal<number | null>(null);

  choisirSession(id: number | string): void {
    const sessionId = Number(id);
    this.sessionChoisieId.set(sessionId);
    // Le filtre « En retard » couvre toutes les sessions : on revient à la session choisie
    if (this.filtreStatut() === 'en_retard') {
      this.filtreStatut.set(null);
    }
    this.service.getCotisations(sessionId).subscribe();
  }

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

    // « En retard » : retards de toutes les sessions terminées (déjà filtrés par
    // le service), pas seulement ceux de la session affichée
    const enRetard = statut === 'en_retard';
    const source = enRetard ? this.service.cotisationsEnRetard() : this.service.cotisations();

    return source.filter(c => {

      const nom =
        `${c.membre.prenom} ${c.membre.nom}`.toLowerCase();

      const correspondNom =
        !terme || nom.includes(terme);

      const correspondStatut =
        !statut || enRetard || c.statut === statut;

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
      this.modePaiementSelectionne.set(payePourSoi && !this.estTresorier() ? 'wave' : 'especes');
      this.erreurPaiementModal.set(null);
      this.modalPaiementVisible.set(true);
    } else {
      this.router.navigate(['/mon-espace/cotisations/payer', cotisation.id]);
    }
  }

  // Modal paiement desktop
  modalPaiementVisible = signal(false);
  modePaiementSelectionne = signal<'especes' | 'wave' | 'orange_money'>('especes');
  paiementEnCours = signal(false);
  erreurPaiementModal = signal<string | null>(null);

  confirmerPaiementModal(): void {
    const cotisation = this.cotisationAPayer();
    if (!cotisation || this.paiementEnCours()) return;
    this.paiementEnCours.set(true);
    this.erreurPaiementModal.set(null);
    this.service.payerCotisation(cotisation.id, this.modePaiementSelectionne()).subscribe({
      next: (reponse) => {
        // Wave / Orange Money : le paiement se fait sur la page PayDunya,
        // qui ramène ensuite sur /paiement/retour
        if (reponse?.urlPaiement) {
          window.location.href = reponse.urlPaiement;
          return;
        }
        // Espèces : paiement enregistré
        this.paiementEnCours.set(false);
        this.modalPaiementVisible.set(false);
        this.cotisationAPayer.set(null);
        this.ngOnInit();
      },
      error: (err) => {
        this.paiementEnCours.set(false);
        const e = err?.error;
        this.erreurPaiementModal.set(
          e?.detail
          ?? (Array.isArray(e?.modePaiement) ? e.modePaiement[0] : null)
          ?? (Array.isArray(e?.nonFieldErrors) ? e.nonFieldErrors[0] : null)
          ?? 'Le paiement n\'a pas pu être lancé. Veuillez réessayer.'
        );
      }
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

    // Filtre demandé dans l'adresse (ex. « Voir plus » des retards : ?statut=en_retard)
    const statutDemande = this.route.snapshot.queryParamMap.get('statut');
    if (this.optionsFiltres.some(o => o.value === statutDemande)) {
      this.filtreStatut.set(statutDemande);
    }

    // Charge les sessions, puis les cotisations de la session choisie (conservée
    // après un paiement), et les retards des sessions terminées
    this.service.getSessions().subscribe({

      next: (sessions) => {

        const session = sessions.find(s => s.id === this.sessionChoisieId())
          ?? this.service.sessionActive()
          ?? sessions[0]
          ?? null;

        this.sessionChoisieId.set(session?.id ?? null);

        if (session) {
          this.service.getCotisations(session.id).subscribe();
        } else {
          this.service.cotisations.set([]);
        }

        this.service.chargerRetards(sessions).subscribe();

      }

    });
  }
}
