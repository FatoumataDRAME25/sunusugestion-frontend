import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MembresService } from '../../../../../../core/services/membres.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';
import { DialogModule } from 'primeng/dialog';
import { AjouterMembre } from '../ajouter-membre/ajouter-membre';
import { ImporterMembre } from '../importer-membre/importer-membre';

@Component({
  selector: 'app-liste-membre',
  imports: [RouterLink, FormsModule, BottomNav, InitialesPipe, Navbar, GieSidebar, DialogModule, AjouterMembre, ImporterMembre],
  styleUrl: './liste-membre.css',
  templateUrl: './liste-membre.html'
})
export class ListeMembre implements OnInit {

  protected service = inject(MembresService);
  protected authService = inject(AuthService);

  optionsStatut : { label: string; value: 'en_attente' | 'actif' | 'inactif' | null }[] = [
    { label: 'Tous', value: null },
    { label: 'Actifs', value: 'actif' },
    { label: 'Inactifs', value: 'inactif' },
    { label: 'En attente', value: 'en_attente' }
  ];

  statutActuel = 'Tous';

  // ── Modals desktop ────────────────────────────────────────
  modalAjouterVisible = signal(false);
  modalImporterVisible = signal(false);

  ouvrirModalAjouter(): void { this.modalAjouterVisible.set(true); }
  fermerModalAjouter(): void {
    this.modalAjouterVisible.set(false);
    // Recharger la liste après fermeture au cas où un membre a été ajouté
    this.service.chargerMembres().subscribe();
  }

  ouvrirModalImporter(): void { this.modalImporterVisible.set(true); }
  fermerModalImporter(): void {
    this.modalImporterVisible.set(false);
    this.service.chargerMembres().subscribe();
  }

  // ── Pagination ────────────────────────────────────────────
  readonly PAGE_SIZE = 10;
  pageCourante = signal(1);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.service.membresFiltres().length / this.PAGE_SIZE))
  );

  membresPagines = computed(() => {
    const debut = (this.pageCourante() - 1) * this.PAGE_SIZE;
    return this.service.membresFiltres().slice(debut, debut + this.PAGE_SIZE);
  });

  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  finPage = computed(() =>
    Math.min(this.pageCourante() * this.PAGE_SIZE, this.service.membresFiltres().length)
  );

  ngOnInit(): void {
    this.service.chargerMembres().subscribe({
      next: () => console.log('listes affichees'),
      error: (err) => console.log('listes non affichees:', err)
    });
  }

  changerStatut(valeur: 'en_attente' | 'actif' | 'inactif' | null, label: string): void {
    this.service.filtreStatut.set(valeur);
    this.statutActuel = label;
    this.pageCourante.set(1);
  }

  changerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageCourante.set(page);
    }
  }
}
