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

  basculerStatut(id: number): void {
    this.gieListe.update((liste) =>
      liste.map((gie) =>
        gie.id === id
          ? { ...gie, statut: gie.statut === 'actif' ? 'inactif' : 'actif' }
          : gie
      )
    );
  }
}
