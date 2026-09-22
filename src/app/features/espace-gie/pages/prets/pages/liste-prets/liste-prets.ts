import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PretService } from '../../../../../../core/services/pret.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { Pret, StatutPret } from '../../../../../../core/models/pret.model';

@Component({
  selector: 'app-liste-prets',
  templateUrl: './liste-prets.html',
  imports: [RouterLink, DecimalPipe, DatePipe, FormsModule, Navbar, BottomNav],
})
export class ListePrets implements OnInit {

  protected service = inject(PretService);
  protected authService = inject(AuthService);

  termeRecherche = signal('');
  filtreStatut = signal<StatutPret | null>(null);

  readonly filtres: { label: string; value: StatutPret | null }[] = [
    { label: 'Tous', value: null },
    { label: 'En attente', value: 'en_attente' },
    { label: 'Approuvés', value: 'approuve' },
    { label: 'En cours', value: 'en_cours' },
  ];

  pretsFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    const statut = this.filtreStatut();
    return this.service.prets().filter(p => {
      const nom = `${p.membre.prenom} ${p.membre.nom}`.toLowerCase();
      return (!terme || nom.includes(terme)) && (!statut || p.statut === statut);
    });
  });

  estPresident = computed(() => this.authService.currentUser()?.role === 'president');
  estTresorier = computed(() => this.authService.currentUser()?.role === 'tresorier');
  // Tous les membres du GIE peuvent faire une demande de prêt
  peutDemanderPret = computed(() => {
    const r = this.authService.currentUser()?.role;
    return r === 'membre_simple' || r === 'secretaire' || r === 'president' || r === 'tresorier';
  });

  ngOnInit(): void {
    this.service.chargerPrets().subscribe();
  }

  badgeStatut(statut: StatutPret): string {
    const map: Record<StatutPret, string> = {
      en_attente: 'bg-or-clair text-or-senegal',
      approuve:   'bg-bleu-clair text-bleu-nuit',
      en_cours:   'bg-vert-clair text-vert-foret',
      rembourse:  'bg-anthracite/10 text-anthracite/60',
      refuse:     'bg-rouge-clair text-rouge-alerte',
      en_retard:  'bg-rouge-clair text-rouge-alerte',
    };
    return map[statut] ?? 'bg-anthracite/10 text-anthracite/60';
  }

  labelStatut(statut: StatutPret): string {
    const map: Record<StatutPret, string> = {
      en_attente: 'EN ATTENTE',
      approuve:   'APPROUVÉ',
      en_cours:   'EN COURS',
      rembourse:  'REMBOURSÉ',
      refuse:     'REFUSÉ',
      en_retard:  'EN RETARD',
    };
    return map[statut] ?? statut;
  }
}
