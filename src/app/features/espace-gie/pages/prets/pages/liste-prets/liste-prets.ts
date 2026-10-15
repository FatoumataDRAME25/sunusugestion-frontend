import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PretService } from '../../../../../../core/services/pret.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { Pret, StatutPret } from '../../../../../../core/models/pret.model';

@Component({
  selector: 'app-liste-prets',
  templateUrl: './liste-prets.html',
  imports: [RouterLink, DecimalPipe, DatePipe, FormsModule, DialogModule, InputTextModule, Navbar, BottomNav, GieSidebar, InitialesPipe],
})
export class ListePrets implements OnInit {

  protected service = inject(PretService);
  protected authService = inject(AuthService);
  private router = inject(Router);

  termeRecherche = signal('');
  filtreStatut = signal<StatutPret | null>(null);

  readonly filtres: { label: string; value: StatutPret | null }[] = [
    { label: 'Tous', value: null },
    { label: 'En attente', value: 'en_attente' },
    { label: 'Approuvés', value: 'approuve' },
    { label: 'En cours', value: 'en_cours' },
    { label: 'En retard', value: 'en_retard' },
  ];

  pretsFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    const statut = this.filtreStatut();
    return this.service.prets().filter(p => {
      const nom = `${p.membre.prenom} ${p.membre.nom}`.toLowerCase();
      return (!terme || nom.includes(terme)) && (!statut || p.statut === statut);
    });
  });

  estPresident = computed(() => this.authService.currentUser()?.role === 'president');
  estTresorier = computed(() => this.authService.currentUser()?.role === 'tresorier');
  peutDemanderPret = computed(() => {
    const r = this.authService.currentUser()?.role;
    return r === 'membre' || r === 'secretaire' || r === 'president' || r === 'tresorier';
  });

  // ── Modal Détail desktop ──
  modalDetailVisible = signal(false);
  pretDetail = signal<Pret | null>(null);

  ouvrirDetail(pret: Pret): void {
    this.pretDetail.set(pret);
    this.modalDetailVisible.set(true);
  }

  // ── Modal Demande de prêt desktop ──
  modalDemandeVisible = signal(false);
  montantDemande = signal('');
  erreurMontantDemande = signal<string | null>(null);
  succesDemandeVisible = signal(false);

  ouvrirModalDemande(): void {
    this.montantDemande.set('');
    this.erreurMontantDemande.set(null);
    this.succesDemandeVisible.set(false);
    this.service.errorMessage.set(null);
    this.modalDemandeVisible.set(true);
  }

  envoyerDemande(): void {
    const val = String(this.montantDemande()).trim();
    if (!val) {
      this.erreurMontantDemande.set('Le montant est obligatoire.');
      return;
    }
    const montantNum = Number(val);
    if (isNaN(montantNum) || montantNum <= 0) {
      this.erreurMontantDemande.set('Le montant doit être supérieur à 0.');
      return;
    }
    this.erreurMontantDemande.set(null);
    this.service.demanderPret({ montant: val }).subscribe({
      next: () => {
        this.succesDemandeVisible.set(true);
        this.ngOnInit();
      }
    });
  }

  fermerModalDemande(): void {
    this.modalDemandeVisible.set(false);
    this.succesDemandeVisible.set(false);
  }

  naviguerDemande(): void {
    this.router.navigate(['/mon-espace/prets/demande']);
  }

  ngOnInit(): void {
    this.service.chargerPrets().subscribe();
    this.service.chargerRegle().subscribe();
  }

  badgeClass(statut: StatutPret): string {
    const map: Record<StatutPret, string> = {
      en_attente: 'bg-[#EA580C]/10 text-[#EA580C]',
      approuve:   'bg-[#1E3A5F]/10 text-[#1E3A5F]',
      en_cours:   'bg-[#2E7D5B]/10 text-[#2E7D5B]',
      rembourse:  'bg-[#1A1D23]/10 text-[#1A1D23]/60',
      refuse:     'bg-[#C1654A]/10 text-[#C1654A]',
      en_retard:  'bg-[#C1654A]/10 text-[#C1654A]',
    };
    return map[statut] ?? 'bg-[#1A1D23]/10 text-[#1A1D23]/60';
  }

  badgeStatut(statut: StatutPret): string {
    const map: Record<StatutPret, string> = {
      en_attente: 'bg-or-clair text-or-senegal',
      approuve:   'bg-bleu-clair text-bleu-nuit',
      en_cours:   'bg-vert-clair text-vert-foret',
      rembourse:  'bg-anthracite/10 text-anthracite/60',
      refuse:     'bg-rouge-clair text-rouge-alerte',
      en_retard:  'bg-rouge-clair text-rouge-alerte',
    };
    return map[statut] ?? 'bg-anthracite/10 text-anthracite/60';
  }

  labelStatut(statut: StatutPret): string {
    const map: Record<StatutPret, string> = {
      en_attente: 'En attente',
      approuve:   'Approuvé',
      en_cours:   'En cours',
      rembourse:  'Remboursé',
      refuse:     'Refusé',
      en_retard:  'En retard',
    };
    return map[statut] ?? statut;
  }
}
