import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PretService } from '../../../../../../core/services/pret.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { ModePaiement } from '../../../../../../core/models/pret.model';

@Component({
  selector: 'app-detail-pret',
  templateUrl: './detail-pret.html',
  imports: [RouterLink, DecimalPipe, DatePipe, FormsModule, Navbar, BottomNav, NgClass],
})
export class DetailPret implements OnInit {

  protected service = inject(PretService);
  protected authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Modal approuver (depuis liste)
  modalApprouverVisible = signal(false);
  dureeApprouver = signal(6);

  // Mode paiement décaissement / remboursement
  modePaiementSelectionne = signal<ModePaiement>('especes');

  // Succès
  succesAction = signal<'approuve' | 'decaisse' | 'rembourse' | null>(null);

  pret = computed(() => this.service.pretSelectionne());
  regle = computed(() => this.service.regle());

  estPresident = computed(() => this.authService.currentUser()?.role === 'president');
  estTresorier = computed(() => this.authService.currentUser()?.role === 'tresorier');

  // Vrai si le prêt appartient à l'utilisateur connecté
  estMonPret = computed(() => {
    const userId = this.authService.currentUser()?.id;
    return this.pret()?.membre?.id === userId;
  });

  // Modes selon règle : paie pour soi → Wave/Orange Money, pour un autre → Espèces
  modesPaiementRemboursement = computed(() => {
    if (!this.estMonPret()) {
      return this.modesPaiement.filter(m => m.value === 'especes');
    }
    return this.modesPaiement.filter(m => m.value === 'wave' || m.value === 'orange_money');
  });

  // Modal de confirmation remboursement
  modalRembourserVisible = signal(false);

  readonly modesPaiement: { value: ModePaiement; label: string; icone: string; sousTitre: string; logo?: string }[] = [
    { value: 'especes',      label: 'Espèces',      icone: 'pi pi-money-bill', sousTitre: 'Remise en main propre' },
    { value: 'wave',         label: 'Wave',         icone: '',                  sousTitre: 'Transfert instantané', logo: 'images/wave.png' },
    { value: 'orange_money', label: 'Orange Money', icone: '',                  sousTitre: 'Portefeuille électronique', logo: 'images/orange_money.png' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.chargerPret(id).subscribe({
      next: () => {
        // Initialiser le mode selon contexte : soi → wave, autre → especes
        this.modePaiementSelectionne.set(this.estMonPret() ? 'wave' : 'especes');
      }
    });
    this.service.chargerRegle().subscribe();
  }

  // ─── APPROUVER ───────────────────────────────────────────
  confirmerApprobation(): void {
    const id = this.pret()?.id;
    if (!id) return;
    this.service.approuverPret(id, { dureeMois: this.dureeApprouver() }).subscribe({
      next: () => {
        this.modalApprouverVisible.set(false);
        this.succesAction.set('approuve');
      }
    });
  }

  // ─── DÉCAISSEMENT ────────────────────────────────────────
  effectuerDecaissement(): void {
    const id = this.pret()?.id;
    if (!id) return;
    this.service.decaisserPret(id, { modePaiement: this.modePaiementSelectionne() }).subscribe({
      next: () => this.succesAction.set('decaisse')
    });
  }

  // ─── REMBOURSEMENT ───────────────────────────────────────
  enregistrerRemboursement(): void {
    const id = this.pret()?.id;
    if (!id) return;
    this.service.rembourserPret(id, { modePaiement: this.modePaiementSelectionne() }).subscribe({
      next: () => this.succesAction.set('rembourse')
    });
  }

  retourListe(): void {
    this.router.navigate(['/mon-espace/prets']);
  }

  initiales(prenom: string, nom: string): string {
    return (prenom[0] ?? '') + (nom[0] ?? '');
  }
}
