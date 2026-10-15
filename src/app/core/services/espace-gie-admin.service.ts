// features/espaces-gie/services/espaces-gie.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { GieListeItem } from '../models/gie-liste-item.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EspacesGieService {

  private gieListe = signal<GieListeItem[]>([]);
  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  termeRecherche = signal('');
  // Message d'erreur du dernier changement de statut (null si tout va bien)
  erreurStatut = signal<string | null>(null);
  filtreStatut = signal<'actif' | 'inactif' | null>(null);
  filtreRegion = signal<string | null>(null);

  regionsDisponibles = computed(() =>
    [...new Set(this.gieListe().map((gie) => gie.region))]
  );

  gieFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    const statut = this.filtreStatut();
    const region = this.filtreRegion();

    return this.gieListe().filter((gie) => {
      const correspondNom = gie.nom.toLowerCase().includes(terme);
      const correspondStatut = !statut || gie.statut === statut;
      const correspondRegion = !region || gie.region === region;
      return correspondNom && correspondStatut && correspondRegion;
    });
  });


  chargerGies(): void {
  this.http.get<GieListeItem[]>(
    `${this.BASE_URL}auth/liste-gies/`
  ).subscribe({
    next: (data) => {
      console.log('GIES ESPACES RECUS :', data);
      this.gieListe.set(data);
    },
    error: (erreur) => {
      console.error(
        'Erreur lors du chargement des espaces GIE',
        erreur
      );
    }
  });
}

  /**
   * Active ou désactive un espace GIE côté serveur.
   * PATCH /api/auth/gies/<id>/  (administrateur uniquement)
   * L'affichage n'est mis à jour qu'après confirmation du serveur.
   */
  basculerStatut(id: number, apresSucces?: () => void): void {
    const gie = this.gieListe().find((g) => g.id === id);
    if (!gie) return;

    const nouveauStatut = gie.statut === 'actif' ? 'inactif' : 'actif';
    this.erreurStatut.set(null);

    this.http.patch<GieListeItem>(
      `${this.BASE_URL}auth/gies/${id}/`,
      { statut: nouveauStatut }
    ).subscribe({
      next: (reponse) => {
        this.gieListe.update((liste) =>
          liste.map((g) => (g.id === id ? { ...g, statut: reponse.statut } : g))
        );
        apresSucces?.();
      },
      error: (erreur) => {
        console.error('Erreur lors du changement de statut du GIE', erreur);
        this.erreurStatut.set(
          erreur?.error?.detail
            ?? `Impossible de ${nouveauStatut === 'inactif' ? 'désactiver' : 'activer'} l'espace « ${gie.nom} ». Réessayez.`
        );
      }
    });
  }
}
