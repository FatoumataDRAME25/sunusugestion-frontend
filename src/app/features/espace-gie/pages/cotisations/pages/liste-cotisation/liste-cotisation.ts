import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { CotisationService } from '../../../../../../core/services/cotisation.service';


@Component({
  selector: 'app-liste-cotisations',
  imports: [FormsModule, RouterLink, DatePipe, InitialesPipe, BottomNav],
  templateUrl: './liste-cotisation.html'
})
export class ListeCotisations implements OnInit {
  protected service = inject(CotisationService);

  filtreStatut = signal<string | null>(null);
  termeRecherche = signal('');

  optionsFiltres = [
    { label: 'Tout', value: null },
    { label: 'Payées', value: 'payee' },
    { label: 'En cours', value: 'en_cours' },
    { label: 'En retard', value: 'en_retard' }
  ];

  cotisationsFiltrees = computed(() => {
    const statut = this.filtreStatut();
    const terme = this.termeRecherche().toLowerCase();

    return this.service.cotisations().filter(c => {
      const nom = `${c.membre.prenom} ${c.membre.nom}`.toLowerCase();
      const correspondNom = !terme || nom.includes(terme);
      const correspondStatut = !statut || c.statut === statut;
      return correspondNom && correspondStatut;
    });
  });

  ngOnInit(): void {
    // Charge la session active puis ses cotisations
    this.service.getSessions().subscribe({
      next: () => {
        const session = this.service.sessionActive();
        if (session) {
          this.service.getCotisations(session.id).subscribe();
        }
      }
    });
  }
}
