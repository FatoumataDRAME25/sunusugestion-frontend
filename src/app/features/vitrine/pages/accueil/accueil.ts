
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface Fonctionnalite {
  icone: string;
  titre: string;
  description: string;
}

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, ButtonModule],
  templateUrl: './accueil.html'
})
export class Accueil implements OnInit, OnDestroy{
  fonctionnalites: Fonctionnalite[] = [
    { icone: 'pi pi-users', titre: 'Membres', description: 'Gérez les profils et statuts des membres avec une base de données centralisée.' },
    { icone: 'pi pi-wallet', titre: 'Cotisations', description: 'Suivez les paiements et échéances de chaque membre en temps réel.' },
    { icone: 'pi pi-chart-line', titre: 'Finances', description: 'Visualisez la santé financière de votre GIE en un coup d\'œil.' },
    { icone: 'pi pi-money-bill', titre: 'Prêts', description: 'Gérez les demandes et remboursements de prêts entre membres.' }
  ];

  indexActif = signal(0);
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.demarrerDefilementAuto();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  private demarrerDefilementAuto(): void {
    this.intervalId = setInterval(() => this.suivant(), 4000);
  }

    private reinitialiserDefilementAuto(): void {
    clearInterval(this.intervalId);
    this.demarrerDefilementAuto();
  }

  suivant(): void {
    this.indexActif.update((i) => (i + 1) % this.fonctionnalites.length);
  }

  precedent(): void {
    this.indexActif.update((i) => (i - 1 + this.fonctionnalites.length) % this.fonctionnalites.length);
    this.reinitialiserDefilementAuto();
  }

    allerA(index: number): void {
    this.indexActif.set(index);
    this.reinitialiserDefilementAuto();
  }
}
