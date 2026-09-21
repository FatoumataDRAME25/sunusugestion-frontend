import { Component, inject, signal, OnInit } from '@angular/core';
import { MembresService } from '../../../../../../core/services/membres.service';
import { OcrService } from '../../../../../../core/services/ocr.service';
import { Router, RouterLink } from '@angular/router';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembreExcel } from '../../../../../../core/models/membre.model';

@Component({
  imports: [BottomNav, RouterLink, ButtonModule, DialogModule, UpperCasePipe, FormsModule],
  selector: 'app-importer-membre',
  styleUrl: './importer-membre.css',
  templateUrl: './importer-membre.html',
})
export class ImporterMembre implements OnInit {

  protected service = inject(MembresService);
  private ocrService = inject(OcrService);
  private router = inject(Router);

  // Mode d'import : excel ou image
  modeImport = signal<'excel' | 'image'>('excel');

  // Étapes : sélection → vérification
  etape = signal<'selection' | 'verification'>('selection');

  // Excel
  fichierExcel = signal<File | null>(null);
  nomFichierExcel = signal<string | null>(null);

  // Image
  fichierImage = signal<File | null>(null);
  nomFichierImage = signal<string | null>(null);
  apercuImage = signal<string | null>(null);

  // Édition inline — index du membre en cours d'édition (-1 = aucun)
  indexEnEdition = signal<number>(-1);

  // Copie locale du membre en cours d'édition
  membreEnEdition = signal<MembreExcel | null>(null);

  // Erreur de validation fichier image côté client
  erreurFichierImage = signal<string | null>(null);

  modalSuccesVisible = signal(false);

  readonly rolesDisponibles = ['president', 'tresorier', 'secretaire', 'membre'];

  ngOnInit(): void {
    this.service.reinitialiserExcel();
    this.service.errorMessage.set(null);
    this.etape.set('selection');
  }

  // --- Changement de mode ---
  changerMode(mode: 'excel' | 'image'): void {
    this.modeImport.set(mode);
    this.service.errorMessage.set(null);
    this.erreurFichierImage.set(null);
    this.fichierExcel.set(null);
    this.nomFichierExcel.set(null);
    this.fichierImage.set(null);
    this.nomFichierImage.set(null);
    this.apercuImage.set(null);
  }

  // --- Excel ---
  onFichierExcelChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier) return;
    this.fichierExcel.set(fichier);
    this.nomFichierExcel.set(fichier.name);
  }

  analyserExcel(): void {
    const fichier = this.fichierExcel();
    if (!fichier) return;
    this.service.analyserExcel(fichier).subscribe({
      next: () => this.etape.set('verification'),
      error: (err) => this.service.errorMessage.set(err?.error?.detail ?? 'Fichier invalide')
    });
  }

  // --- Image ---
  onFichierImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier) return;

    // Validation immédiate côté client
    const erreur = this.ocrService.validerFichier(fichier);
    if (erreur) {
      this.erreurFichierImage.set(erreur);
      return;
    }

    this.erreurFichierImage.set(null);
    this.fichierImage.set(fichier);
    this.nomFichierImage.set(fichier.name);

    // Aperçu base64
    const reader = new FileReader();
    reader.onload = (e) => this.apercuImage.set(e.target?.result as string);
    reader.readAsDataURL(fichier);
  }

  ouvrirCamera(): void {
    const input = document.getElementById('fichier-camera') as HTMLInputElement;
    input?.click();
  }

  ouvrirGalerie(): void {
    const input = document.getElementById('fichier-galerie') as HTMLInputElement;
    input?.click();
  }

  analyserImage(): void {
    const fichier = this.fichierImage();
    if (!fichier) return;
    this.indexEnEdition.set(-1);
    this.membreEnEdition.set(null);
    this.service.analyserImage(fichier).subscribe({
      next: () => this.etape.set('verification'),
      error: (err) => this.service.errorMessage.set(err?.message ?? 'Analyse échouée')
    });
  }

  // --- Édition inline (mode image uniquement) ---

  /** Ouvre le formulaire inline pour un membre invalide */
  ouvrirEdition(index: number): void {
    const membre = this.service.membresAnalyses()[index];
    // Copie profonde pour ne pas modifier le signal directement
    this.membreEnEdition.set({ ...membre });
    this.indexEnEdition.set(index);
  }

  /** Annule l'édition en cours */
  annulerEdition(): void {
    this.indexEnEdition.set(-1);
    this.membreEnEdition.set(null);
  }

  /** Valide et sauvegarde les corrections d'un membre */
  sauvegarderEdition(index: number): void {
    const edite = this.membreEnEdition();
    if (!edite) return;

    // Vérification minimale des champs obligatoires
    const erreurs: string[] = [];
    if (!edite.prenom?.trim()) erreurs.push('Prénom manquant');
    if (!edite.nom?.trim()) erreurs.push('Nom manquant');
    if (!edite.telephone?.trim()) {
      erreurs.push('Téléphone manquant');
    } else if (!/^(70|71|75|76|77|78)\d{7}$/.test(edite.telephone.trim())) {
      erreurs.push('Format invalide — doit commencer par 70, 71, 75, 76, 77 ou 78');
    }
    if (!this.rolesDisponibles.includes(edite.role ?? '')) {
      erreurs.push('Rôle invalide — valeurs autorisées : president, tresorier, secretaire, membre');
    }

    // Met à jour le membre dans le signal avec le nouveau statut
    const liste = [...this.service.membresAnalyses()];
    liste[index] = {
      ...edite,
      prenom: edite.prenom?.trim() ?? '',
      nom: edite.nom?.trim() ?? '',
      telephone: edite.telephone?.trim() ?? '',
      role: edite.role?.trim() ?? '',
      statut: erreurs.length === 0 ? 'valide' : 'erreur',
      erreurs: erreurs.length === 0 ? [] : erreurs
    };

    this.service.membresAnalyses.set(liste);

    // Recalcule les stats
    const valides = liste.filter(m => m.statut === 'valide').length;
    this.service.statsAnalyse.set({
      total: liste.length,
      valides,
      erreurs: liste.length - valides
    });

    this.indexEnEdition.set(-1);
    this.membreEnEdition.set(null);
  }

  // --- Import final (commun aux deux modes) ---
  importer(): void {
    this.service.importerMembres().subscribe({
      next: () => {
        this.service.errorMessage.set(null);
        this.modalSuccesVisible.set(true);
      },
      error: (err) => console.error('Erreur import :', err)
    });
  }

  retourSelection(): void {
    this.etape.set('selection');
    this.fichierExcel.set(null);
    this.nomFichierExcel.set(null);
    this.fichierImage.set(null);
    this.nomFichierImage.set(null);
    this.apercuImage.set(null);
    this.erreurFichierImage.set(null);
    this.indexEnEdition.set(-1);
    this.membreEnEdition.set(null);
    this.service.reinitialiserExcel();
  }

  voirLesMembres(): void {
    this.modalSuccesVisible.set(false);
    this.service.reinitialiserExcel();
    this.service.errorMessage.set(null);
    this.etape.set('selection');
    this.fichierExcel.set(null);
    this.nomFichierExcel.set(null);
    this.fichierImage.set(null);
    this.nomFichierImage.set(null);
    this.apercuImage.set(null);
    this.erreurFichierImage.set(null);
    this.indexEnEdition.set(-1);
    this.membreEnEdition.set(null);
    this.router.navigate(['/mon-espace/membres']);
  }

  membresValides() {
    return this.service.membresAnalyses().filter(m => m.statut === 'valide');
  }

  membresInvalides() {
    return this.service.membresAnalyses().filter(m => m.statut === 'erreur');
  }
}
