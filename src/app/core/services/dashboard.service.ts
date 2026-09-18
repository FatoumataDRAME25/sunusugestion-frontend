// features/dashboard/services/dashboard.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { DashboardStats, EvolutionGie, RepartitionSecteur } from '../models/dashboard.model';
import { GIE } from '../models/gie.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class DashboardService {

  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL

  stats = signal<DashboardStats>({ totalGies: 0,
     gieActifs: 0, gieInactifs: 0,
     totalMembres: 0,
     totalRegions: 0,
     totalSecteurs: 0 });

  evolution = signal<EvolutionGie[]>([]);
  repartitionSecteurs = signal<RepartitionSecteur[]>([]);
  gieRecentsActives = signal<GIE[]>([]);
  gieRecentsDesactives = signal<GIE[]>([]);

  chargerStatistiques(): void {
    this.http.get<any>(`${this.BASE_URL}auth/gies/statistiques/`).subscribe({
      next: (data) => { console.log('STATISTIQUES RECUES :', data); this.stats.set({ totalGies: data.totalGies, gieActifs: data.giesActifs, gieInactifs: data.giesInactifs, totalMembres: data.totalMembres, totalRegions: data.totalRegions, totalSecteurs: data.totalSecteurs });
    },
    error: (erreur) => { console.error('Erreur lors du chargement des statistiques', erreur); }
  });
   }

  chargerGies(): void {
    this.http.get<GIE[]>(`${this.BASE_URL}auth/liste-gies/`).subscribe({
      next: (data) => {
        console.log('GIES RECUS', data);


      this.gieRecentsActives.set(
        data
          .filter(gie => gie.statut === 'actif')
          .slice(0, 5)
      );

      this.gieRecentsDesactives.set(
        data
          .filter(gie => gie.statut === 'inactif')
          .slice(0, 5)
      );

    }
  });
}


chargerEvolution(): void {
  this.http.get<EvolutionGie[]>(
    `${this.BASE_URL}auth/gies/evolution/`
  ).subscribe({
    next: (data) => {
      this.evolution.set(data);
    },
    error: (erreur) => {
      console.error(
        'Erreur lors du chargement de l’évolution des GIE',
        erreur
      );
    }
  });
}

chargerRepartitionSecteurs(): void {
  this.http.get<RepartitionSecteur[]>(
    `${this.BASE_URL}auth/gies/repartition-secteur/`
  ).subscribe({
    next: (data) => {
      console.log('REPARTITION SECTEURS RECUE :', data);
      this.repartitionSecteurs.set(data);
    },
    error: (erreur) => {
      console.error(
        'Erreur lors du chargement de la répartition des secteurs',
        erreur
      );
    }
  });
}

}
