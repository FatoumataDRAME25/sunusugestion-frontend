import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { HistoriqueOperationService } from '../../../../../../core/services/historique-operation.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { HistoriqueOperation } from '../../../../../../core/models/historique-operation.model';
import { Solde } from '../../../../../../core/models/solde.model';
import { Dialog } from 'primeng/dialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-operations',
  imports: [Dialog, DialogModule, FormsModule, ReactiveFormsModule, DecimalPipe, DatePipe,
            BottomNav, RouterLink, Navbar, GieSidebar, InputTextModule, TextareaModule],
  templateUrl: './historique.html',
  styleUrl: './historique.css'
})
export class Historique implements OnInit {
  private historiqueService = inject(HistoriqueOperationService);
  protected authService = inject(AuthService);
  private fb = inject(FormBuilder);

  estTresorier = computed(() => this.authService.currentUser()?.role === 'tresorier');

  solde = signal<Solde | null>(null);
  operations = signal<HistoriqueOperation[]>([]);
  isLoading = signal(false);
  voirCaisse = signal(false);

  filtreType = signal<'toutes' | 'entree' | 'sortie'>('toutes');
  termeRecherche = signal('');

  operationsFiltrees = computed(() => {
    const type = this.filtreType();
    const terme = this.termeRecherche().toLowerCase();
    return this.operations().filter(op => {
      const correspondType = type === 'toutes' || op.typeOperation === type;
      const correspondTerme = !terme || op.libelle.toLowerCase().includes(terme);
      return correspondType && correspondTerme;
    });
  });

  operationsGroupees = computed(() => {
    const groupes = new Map<string, HistoriqueOperation[]>();
    for (const op of this.operationsFiltrees()) {
      const date = op.dateOperation.split('T')[0];
      if (!groupes.has(date)) groupes.set(date, []);
      groupes.get(date)!.push(op);
    }
    return Array.from(groupes.entries()).map(([date, ops]) => ({ date, ops }));
  });

  // ── Modal Nouvelle opération (desktop) ────────────────────
  modalNouvelleOpVisible = signal(false);
  isSaving = signal(false);
  succesNouvelleOp = signal(false);

  formNouvelleOp: FormGroup = this.fb.group({
    typeOperation: ['entree', Validators.required],
    libelle:       ['', Validators.required],
    montant:       [null, [Validators.required, Validators.min(1)]],
  });

  get typeOp() { return this.formNouvelleOp.get('typeOperation')!; }

  ouvrirModalNouvelleOp(): void {
    this.formNouvelleOp.reset({ typeOperation: 'entree', libelle: '', montant: null });
    this.succesNouvelleOp.set(false);
    this.modalNouvelleOpVisible.set(true);
  }

  enregistrerNouvelleOp(): void {
    if (this.formNouvelleOp.invalid) {
      this.formNouvelleOp.markAllAsTouched();
      return;
    }
    const { typeOperation, montant, libelle } = this.formNouvelleOp.value;
    this.isSaving.set(true);
    this.historiqueService.creerOperation(typeOperation, montant, libelle).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.succesNouvelleOp.set(true);
        this.ngOnInit();
      },
      error: (e) => {
        console.error(e);
        this.isSaving.set(false);
      }
    });
  }

  fermerModalNouvelleOp(): void {
    this.modalNouvelleOpVisible.set(false);
    this.succesNouvelleOp.set(false);
  }

  // ── Modal Détail opération (desktop) ──────────────────────
  modalDetailVisible = signal(false);
  operationDetail = signal<HistoriqueOperation | null>(null);

  ouvrirDetail(op: HistoriqueOperation): void {
    this.operationDetail.set(op);
    this.modalDetailVisible.set(true);
  }

  ngOnInit(): void {
    this.chargerSolde();
    this.chargerOperations();
  }

  chargerSolde(): void {
    this.historiqueService.getSolde().subscribe({
      next: (response) => this.solde.set(response),
      error: (err) => console.error('Erreur solde :', err)
    });
  }

  chargerOperations(): void {
    this.isLoading.set(true);
    this.historiqueService.getOperations().subscribe({
      next: (response) => {
        this.operations.set(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur opérations :', err);
        this.isLoading.set(false);
      }
    });
  }

  ouvrirCaisse(): void { this.voirCaisse.set(true); }
  fermerCaisse(): void { this.voirCaisse.set(false); }

  labelDate(dateStr: string): string {
    const aujourd_hui = new Date().toISOString().split('T')[0];
    const hier = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === aujourd_hui) return "Aujourd'hui";
    if (dateStr === hier) return 'Hier';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
