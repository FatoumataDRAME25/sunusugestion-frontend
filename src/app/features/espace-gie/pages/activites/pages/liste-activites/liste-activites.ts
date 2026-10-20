import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ActiviteService } from '../../../../../../core/services/activite.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import {
  Activite, StatutActivite, TypeActivite, TYPES_ACTIVITE,
  MembrePresence
} from '../../../../../../core/models/activite.model';

@Component({
  selector: 'app-liste-activites',
  templateUrl: './liste-activites.html',
  imports: [RouterLink, DatePipe, FormsModule, DialogModule, InputTextModule, Navbar, BottomNav, GieSidebar, InitialesPipe],
})
export class ListeActivites implements OnInit {

  protected service = inject(ActiviteService);
  protected authService = inject(AuthService);

  estPresidentOuSecretaire = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'president' || role === 'secretaire';
  });

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

  // ── Modal Planifier (desktop) ──────────────────────────────
  modalPlanifierVisible = signal(false);
  titrePlanifier = signal('');
  lieupPlanifier = signal('');
  datePlanifier = signal('');
  typePlanifier = signal<TypeActivite>('reunion');
  erreurPlanifier = signal<string | null>(null);
  readonly typesActivite = TYPES_ACTIVITE;

  ouvrirModalPlanifier(): void {
    this.titrePlanifier.set('');
    this.lieupPlanifier.set('');
    this.datePlanifier.set('');
    this.typePlanifier.set('reunion');
    this.erreurPlanifier.set(null);
    this.service.errorMessage.set(null);
    this.modalPlanifierVisible.set(true);
  }

  envoyerPlanifier(): void {
    if (!this.titrePlanifier().trim() || !this.lieupPlanifier().trim() || !this.datePlanifier()) {
      this.erreurPlanifier.set('Tous les champs sont obligatoires.');
      return;
    }
    this.erreurPlanifier.set(null);
    this.service.creerActivite({
      titre: this.titrePlanifier().trim(),
      lieu: this.lieupPlanifier().trim(),
      dateActivite: this.datePlanifier(),
      typeActivite: this.typePlanifier(),
    }).subscribe({
      next: () => {
        this.modalPlanifierVisible.set(false);
        this.ngOnInit();
      }
    });
  }

  // ── Modal Détail activité (desktop) ───────────────────────
  modalDetailVisible = signal(false);
  activiteDetail = signal<Activite | null>(null);

  // États détail
  modalDemarrerVisible = signal(false);
  modalTerminerVisible = signal(false);
  modalAnnulerVisible = signal(false);
  ordreDuJour = signal('');
  compteRendu = signal('');
  erreurCompteRendu = signal(false);

  estJourJ = computed(() => {
    const a = this.activiteDetail();
    if (!a) return false;
    const aujourd_hui = new Date();
    const dateActivite = new Date(a.dateActivite);
    return (
      dateActivite.getFullYear() === aujourd_hui.getFullYear() &&
      dateActivite.getMonth()    === aujourd_hui.getMonth()    &&
      dateActivite.getDate()     === aujourd_hui.getDate()
    );
  });

  ouvrirDetail(activite: Activite): void {
    this.activiteDetail.set(activite);
    this.service.activiteSelectionnee.set(activite);
    this.ordreDuJour.set('');
    this.compteRendu.set('');
    this.erreurCompteRendu.set(false);
    this.modalDetailVisible.set(true);
  }

  confirmerDemarrer(): void {
    const id = this.activiteDetail()?.id;
    if (!id) return;
    const body = this.ordreDuJour().trim() ? { ordreDuJour: this.ordreDuJour().trim() } : {};
    this.service.demarrerActivite(id, body).subscribe({
      next: (a) => {
        this.activiteDetail.set(a);
        this.modalDemarrerVisible.set(false);
        this.ngOnInit();
      }
    });
  }

  confirmerTerminer(): void {
    if (!this.compteRendu().trim()) { this.erreurCompteRendu.set(true); return; }
    const id = this.activiteDetail()?.id;
    if (!id) return;
    this.service.terminerActivite(id, { compteRendu: this.compteRendu().trim() }).subscribe({
      next: (a) => {
        this.activiteDetail.set(a);
        this.modalTerminerVisible.set(false);
        this.compteRendu.set('');
        this.erreurCompteRendu.set(false);
        this.ngOnInit();
      }
    });
  }

  confirmerAnnuler(): void {
    const id = this.activiteDetail()?.id;
    if (!id) return;
    this.service.annulerActivite(id).subscribe({
      next: (a) => {
        this.activiteDetail.set(a);
        this.modalAnnulerVisible.set(false);
        this.ngOnInit();
      }
    });
  }

  // ── Modal Présences (desktop) ──────────────────────────────
  modalPresencesVisible = signal(false);
  membresPresences = signal<MembrePresence[]>([]);
  succesPresences = signal(false);

  nbPresents = computed(() => this.membresPresences().filter(m => m.statut === 'present').length);
  nbAbsents  = computed(() => this.membresPresences().filter(m => m.statut === 'absent').length);
  nbTotal    = computed(() => this.membresPresences().length);
  presencesDejaEnregistrees = computed(() =>
    this.membresPresences().length > 0 &&
    this.membresPresences().every(m => m.statut !== null)
  );

  ouvrirPresences(activite: Activite): void {
    this.activiteDetail.set(activite);
    this.service.activiteSelectionnee.set(activite);
    this.succesPresences.set(false);
    this.membresPresences.set([]);
    this.service.getMembresActivite(activite.id).subscribe({
      next: (liste) => this.membresPresences.set(liste)
    });
    this.modalPresencesVisible.set(true);
  }

  setStatut(membre: MembrePresence, statut: 'present' | 'absent'): void {
    this.membresPresences.set(
      this.membresPresences().map(m =>
        m.id === membre.id ? { ...m, statut: m.statut === statut ? null : statut } : m
      )
    );
  }

  enregistrerPresences(): void {
    const id = this.activiteDetail()?.id;
    if (!id) return;
    const presences = this.membresPresences()
      .filter(m => m.statut !== null)
      .map(m => ({ utilisateur: m.id, statut: m.statut as 'present' | 'absent' }));
    this.service.enregistrerPresences(id, { presences }).subscribe({
      next: () => this.succesPresences.set(true)
    });
  }

  labelType(type: TypeActivite): string {
    return TYPES_ACTIVITE.find(t => t.value === type)?.label ?? type;
  }

  badgeClass(statut: StatutActivite): string {
    const map: Record<StatutActivite, string> = {
      planifiee: 'bg-[#1E3A5F]/10 text-[#1E3A5F]',
      en_cours:  'bg-[#2E7D5B]/10 text-[#2E7D5B]',
      terminee:  'bg-[#1A1D23]/10 text-[#1A1D23]/60',
      annulee:   'bg-[#C1654A]/10 text-[#C1654A]',
    };
    return map[statut];
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
      en_cours:  'En cours',
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
