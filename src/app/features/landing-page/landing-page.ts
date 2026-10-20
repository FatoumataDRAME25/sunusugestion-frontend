import { AfterViewInit, Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface GrilleTarifaire {
  paliers: { membresMin: number; membresMax: number | null; montant: number }[];
  tolerance: number;
  dureeEssaiJours: number;
  modesPaiement: string[];
}

@Component({
  imports: [RouterLink, DecimalPipe],
  selector: 'app-landing-page',
  styleUrl: './landing-page.css',
  templateUrl: './landing-page.html',
})
export class LandingPage implements OnInit, AfterViewInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  menuOuvert = signal(false);

  // Tarifs lus depuis le serveur : même grille que la facturation
  grille = signal<GrilleTarifaire | null>(null);
  erreurGrille = signal(false);

  ngOnInit(): void {
    this.http.get<GrilleTarifaire>(`${environment.API_URL}abonnements/grille/`).subscribe({
      next: (grille) => this.grille.set(grille),
      error: () => this.erreurGrille.set(true)
    });
  }

  ngAfterViewInit(): void {
    // Lien direct vers une section, par exemple /#tarification depuis l'inscription
    const fragment = this.route.snapshot.fragment;
    if (fragment) {
      setTimeout(() => this.scrollVers(fragment));
    }
  }

  toggleMenu(): void { this.menuOuvert.update(v => !v); }
  fermerMenu(): void { this.menuOuvert.set(false); }

  scrollVers(id: string): void {
    this.fermerMenu();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
