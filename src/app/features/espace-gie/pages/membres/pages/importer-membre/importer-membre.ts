import { Component, inject, signal } from '@angular/core';
import { MembresService } from '../../../../../../core/services/membres.service';
import { Router, RouterLink } from '@angular/router';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { UpperCasePipe } from '@angular/common';

@Component({
  imports: [BottomNav,RouterLink, ButtonModule, DialogModule, UpperCasePipe],
  selector: 'app-importer-membre',
  styleUrl: './importer-membre.css',
  templateUrl: './importer-membre.html',
})
export class ImporterMembre {

  protected service = inject(MembresService);
  private router = inject(Router);

  // Deux étapes : sélection du fichier → vérification
  etape = signal<'selection' | 'verification'>('selection');

  fichierSelectionne = signal<File | null>(null);
  nomFichier = signal<string | null>(null);

  modalSuccesVisible = signal(false);

  onFichierChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier) return;
    this.fichierSelectionne.set(fichier);
    this.nomFichier.set(fichier.name);
  }

  analyser(): void {
    const fichier = this.fichierSelectionne();
    if (!fichier) return;

    this.service.analyserExcel(fichier).subscribe({
      next: () => this.etape.set('verification'),
      error: (err) => this.service.errorMessage.set(err?.error?.detail ?? 'Fichier invalide')
    });
  }

  importer(): void {
    this.service.importerMembres().subscribe({
      next: () => {
        // 1. On nettoie les messages d'erreur précédents en cas de succès
        this.service.errorMessage.set(null);

        // 2. On affiche le modal de succès
        this.modalSuccesVisible.set(true);
      },
      error: (err) => {
        console.error("Détail de l'échec de l'importation :", err);
      }
    });
  }

  retourSelection(): void {
    this.etape.set('selection');
    this.fichierSelectionne.set(null);
    this.nomFichier.set(null);
    this.service.reinitialiserExcel();
  }

  voirLesMembres(): void {
    this.modalSuccesVisible.set(false);
    this.service.reinitialiserExcel();
    this.service.errorMessage.set(null);
    this.etape.set('selection');
    this.fichierSelectionne.set(null);
    this.router.navigate(['/mon-espace/membres']);
  }

  membresValides() {
    return this.service.membresAnalyses().filter(m => m.statut === 'valide');
  }
}
