import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PretService } from '../../../../../../core/services/pret.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { Pret, ModePaiement } from '../../../../../../core/models/pret.model';

@Component({
  selector: 'app-demandes-a-traiter',
  templateUrl: './demandes-a-traiter.html',
  imports: [RouterLink, DecimalPipe, DatePipe, FormsModule, Navbar, BottomNav],
})
export class DemandesATraiter implements OnInit {

  protected service = inject(PretService);
  protected authService = inject(AuthService);
  private router = inject(Router);

  // Modal approbation
  modalApprouverVisible = signal(false);
  pretAApprouver = signal<Pret | null>(null);
  dureeApprouver = signal(6);

  // Modal décaissement
  modalDecaisserVisible = signal(false);
  pretADecaisser = signal<Pret | null>(null);
  modePaiementDecaissement = signal<ModePaiement>('especes');

  estPresident = computed(() => this.authService.currentUser()?.role === 'president');
  estTresorier = computed(() => this.authService.currentUser()?.role === 'tresorier');

  // Prêts selon rôle
  aApprouver = computed(() => this.service.prets().filter(p => p.statut === 'en_attente'));
  aDecaisser = computed(() => this.service.prets().filter(p => p.statut === 'approuve'));

  readonly modesPaiement: { value: ModePaiement; label: string; logo?: string; icone?: string }[] = [
    { value: 'especes',      label: 'Espèces',      icone: 'pi pi-money-bill' },
    { value: 'wave',         label: 'Wave',         logo: 'images/wave.png' },
    { value: 'orange_money', label: 'Orange Money', logo: 'images/orange_money.png' },
  ];

  ngOnInit(): void {
    this.service.chargerPrets().subscribe();
    this.service.chargerRegle().subscribe();
  }

  // ── APPROBATION ──
  ouvrirApprouver(pret: Pret): void {
    this.pretAApprouver.set(pret);
    this.dureeApprouver.set(6);
    this.modalApprouverVisible.set(true);
  }

  confirmerApprobation(): void {
    const id = this.pretAApprouver()?.id;
    if (!id) return;
    this.service.approuverPret(id, { dureeMois: this.dureeApprouver() }).subscribe({
      next: () => {
        this.modalApprouverVisible.set(false);
        this.pretAApprouver.set(null);
      }
    });
  }

  // ── DÉCAISSEMENT ──
  ouvrirDecaisser(pret: Pret): void {
    this.pretADecaisser.set(pret);
    this.modePaiementDecaissement.set('especes');
    this.modalDecaisserVisible.set(true);
  }

  confirmerDecaissement(): void {
    const id = this.pretADecaisser()?.id;
    if (!id) return;
    this.service.decaisserPret(id, { modePaiement: this.modePaiementDecaissement() }).subscribe({
      next: () => {
        this.modalDecaisserVisible.set(false);
        this.pretADecaisser.set(null);
      }
    });
  }

  voirDetail(id: number): void {
    this.router.navigate(['/mon-espace/prets', id]);
  }
}
